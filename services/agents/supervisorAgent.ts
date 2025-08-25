import { Type } from "@google/genai";
import { ai } from "./index";
import { User, DashboardData, AiEngine, StructuralCalculationPayload, GeotechnicalCalculationPayload, AnalysisMessage, DocumentPayload, IntelligenceCard } from '../../types';
import { getProjectDocuments } from '../documentService';

import * as analysisAgent from './analysisAgent';
import * as conversationalAgent from './conversationalAgent';
import * as structuralAgent from './structuralAgent';
import * as geotechnicalAgent from './geotechnicalAgent';
import * as utilityAgent from './utilityAgent';
import * as copilotAgent from './copilotAgent';
import * as siteManagerAgent from './siteManagerAgent';
import * as hseAgent from './hseAgent';
import * as qualityAgent from './qualityAgent';

// Helper to serialize the last AI message for context.
const serializeLastAiMessage = (message: AnalysisMessage): string | null => {
    if (message.structuralCalculationPayload) {
        const p = message.structuralCalculationPayload;
        return `[AI previous response was a Structural Calculation: ${p.task}] Summary: ${p.result.conclusion.summary}`;
    }
    if (message.analysisSummary) return `[AI previous response was a Visual Analysis] Summary: ${message.analysisSummary}`;
    if (message.text) return `[AI previous response was text]: ${message.text}`;
    return null;
}

export type TaskIntent =
    | { type: 'structural'; sufficientData: boolean }
    | { type: 'geotechnical'; sufficientData: boolean }
    | { type: 'document_generation', role: string, documentType: string, sufficientData: boolean }
    | { type: 'conversation' };


/**
 * Detects the user's intent from a prompt to determine which specialist agent to route to.
 * This version is context-aware, using the conversation history.
 * @param prompt The user's prompt text.
 * @param history The full conversation history.
 * @param user The current user.
 * @returns A promise that resolves to the detected intent.
 */
export const detectTaskIntent = async (prompt: string, history: AnalysisMessage[], user: User): Promise<TaskIntent> => {
  console.log("[SupervisorAgent] Detecting nuanced intent for prompt:", prompt);

  const lastAiMessage = [...history].reverse().find(m => m.author === 'ai' && !m.isTyping);
  let contextPrompt = '';

  if (lastAiMessage) {
      const lastAiResponseText = serializeLastAiMessage(lastAiMessage);
      if (lastAiResponseText) {
          contextPrompt = `
For context, the AI's previous response was: "${lastAiResponseText.substring(0, 500)}..."
The user's new prompt is likely a direct response to this. If the AI asked a clarifying question, the user is likely providing the missing information.
`;
      }
  }
    
  const languageInstruction = `The user is communicating in ${user.language === 'id' ? 'Indonesian' : 'English'}. Understand the request in that language.`;

  const intentDetectionPrompt = `You are a supervisor AI. Your job is to analyze a user's request and classify it with extreme precision.
${languageInstruction}

Classification Rules:
1.  **Intent Classification**: First, classify the user's core **intent**.
    - \`structural\`: The user wants to design or analyze concrete, steel, rebar, beams, columns, connections, or slabs.
    - \`geotechnical\`: The user wants to analyze soil, foundations, bearing capacity, settlement, or slopes.
    - \`document_generation\`: The user wants to **create a document**. Keywords: "create", "draft", "generate", "make a report", "log", "plan", "assessment", "ITP", "NCR", "audit".
    - \`conversation\`: It's a general question, a follow-up, a greeting, or anything that isn't a direct command to calculate or create a document. A question about *capability* (e.g., "Can you calculate beams?") is a 'conversation'.

2.  **Role & Document Type (for 'document_generation' ONLY)**:
    - If the intent is \`document_generation\`, you MUST identify the responsible **role** and the specific **documentType**.
    - **Roles**: 'site_manager', 'hse_officer', 'project_manager', 'quality_control', 'contractor', 'client', 'architect', 'engineer', 'surveyor'.
    - **Document Types**:
      - For 'site_manager': 'daily_site_report', 'incident_report', 'progress_report', 'site_diary_journal_entry', etc.
      - For 'hse_officer': 'health_and_safety_plan', 'risk_assessment', 'accident_report', 'method_statement', 'job_safety_analysis', 'permit_to_work', etc.
      - For 'quality_control': 'quality_management_plan', 'inspection_test_plan', 'quality_control_checklist', 'inspection_report', 'test_certificate', 'non_conformance_report_qc', 'quality_audit_report', 'corrective_action_request', 'quality_performance_metrics', 'material_certification_record', 'commissioning_procedure', 'hold_point_notification', 'quality_surveillance_report'.
    - Example: "draft an incident report" -> role: 'site_manager', documentType: 'incident_report'.
    - Example: "create the health and safety plan" -> role: 'hse_officer', documentType: 'health_and_safety_plan'.
    - Example: "make a risk assessment for the excavation" -> role: 'hse_officer', documentType: 'risk_assessment'.
    - Example: "draft an ITP for concrete" -> role: 'quality_control', documentType: 'inspection_test_plan'.
    - Example: "create a non conformance report for the rebar" -> role: 'quality_control', documentType: 'non_conformance_report_qc'.

3.  **Data Sufficiency**: 
    - For \`structural\` or \`geotechnical\` intents, determine if the user has provided **sufficient numerical data** to perform the calculation. Set \`sufficientData\` to \`true\` or \`false\`.
    - For \`document_generation\` and \`conversation\` intents, \`sufficientData\` is always \`true\`.
${contextPrompt}
Respond with only the specified JSON format.

User Request: "${prompt}"`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: intentDetectionPrompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            intent: {
              type: Type.STRING,
              enum: ['structural', 'geotechnical', 'document_generation', 'conversation'],
            },
            role: { type: Type.STRING },
            documentType: { type: Type.STRING },
            sufficientData: { type: Type.BOOLEAN }
          },
          required: ['intent', 'sufficientData'],
        },
        temperature: 0,
      },
    });
    const result = JSON.parse(response.text.trim());
    console.log("[SupervisorAgent] Detected nuanced intent:", result);
    
    if (result.intent === 'conversation') {
        return { type: 'conversation' };
    }

    if (result.intent === 'document_generation') {
        return { type: 'document_generation', role: result.role, documentType: result.documentType, sufficientData: true };
    }
    
    return { type: result.intent, sufficientData: result.sufficientData };

  } catch (error) {
    console.error("[SupervisorAgent] Error detecting nuanced intent:", error);
    return { type: 'conversation' };
  }
};

/**
 * Performs a Retrieval-Augmented Generation (RAG) search.
 * It identifies if a document in the Document Hub is relevant to the user's query,
 * and if so, generates a mock context to be injected into the main prompt.
 * @param prompt The user's query.
 * @param user The current user.
 * @returns A promise resolving to a context object or null if no relevant document is found.
 */
const performRagSearch = async (prompt: string, user: User): Promise<{ context: string; source: string; } | null> => {
    console.log("[SupervisorAgent] Performing RAG search for prompt:", prompt);
    try {
        const documents = await getProjectDocuments();
        if (documents.length === 0) {
            console.log("[SupervisorAgent] No documents in hub, skipping RAG search.");
            return null;
        }

        const documentList = documents.map(doc => `- ${doc.name}`).join('\n');

        const relevanceCheckPrompt = `You are a document retrieval specialist. Analyze the user's query and the list of available project documents. Determine if any single document is highly relevant for answering the query.

User's Query: "${prompt}"

Available Documents:
${documentList}

Your task:
1. If one document is clearly the best source, respond with its exact filename.
2. If no single document seems directly relevant, respond with "N/A".
3. Your response must be ONLY the filename or "N/A". Do not add any other text.
`;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: relevanceCheckPrompt,
            config: {
                temperature: 0,
            }
        });

        const relevantDocName = response.text.trim();

        if (relevantDocName === 'N/A' || !documents.some(d => d.name === relevantDocName)) {
            console.log("[SupervisorAgent] No single relevant document found for RAG.");
            return null;
        }

        console.log(`[SupervisorAgent] Found relevant document: ${relevantDocName}. Generating mock context.`);

        // In a real system, this would involve parsing the document, chunking, vectorizing, and searching.
        // For this mock, we will generate a plausible-sounding context with another AI call.
        const contextGenerationPrompt = `You are an AI simulating a document retrieval system. You have identified the document "${relevantDocName}" as relevant to the user's query "${prompt}".
        
        Your task is to generate a short, plausible-sounding paragraph of text that *could* have been extracted from this document to answer the user's query. This is a simulation. The text should be directly relevant to the query.
        
        Example:
        - Query: "What is the concrete strength for the level 5 slab?"
        - Document: "Structural_Drawings_Rev4.pdf"
        - Your generated context: "Per section S-2.1 of the structural drawings, the 28-day compressive strength (f'c) for the Level 5 slab-on-deck shall be 4,000 psi (27.5 MPa). All concrete must conform to ASTM C39 standards."
        
        Generate the context now.`;
        
        const contextResponse = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: contextGenerationPrompt,
        });

        const mockContext = contextResponse.text.trim();
        
        console.log("[SupervisorAgent] RAG search complete. Context will be injected.");
        return {
            context: mockContext,
            source: relevantDocName,
        };

    } catch (error) {
        console.error("[SupervisorAgent] Error during RAG search:", error);
        return null; // Fail gracefully
    }
};


/**
 * The Supervisor Agent.
 * This object acts as the single, public-facing interface for all AI capabilities.
 * It imports functions from the specialist agents and exposes them as a unified API.
 * The application should only ever interact with this `supervisor` object.
 */
export const supervisor = {
  // Analysis Agent Functions
  getAIAnalysis: (base64ImageData: string, aiEngine: AiEngine, user: User) => 
    analysisAgent.getAIAnalysis(base64ImageData, aiEngine, user.language),

  // Conversational Agent Functions
  getConversationalResponseStream: async (prompt: string, aiEngine: AiEngine, user: User, signal?: AbortSignal, history: AnalysisMessage[] = []) => {
    // RAG is a premium feature and requires documents to be present.
    if (aiEngine === 'premium') {
        const ragContext = await performRagSearch(prompt, user);
        return conversationalAgent.getConversationalResponseStream(prompt, aiEngine, user.language, ragContext, signal, history);
    }
    // For non-premium, call without RAG context.
    return conversationalAgent.getConversationalResponseStream(prompt, aiEngine, user.language, null, signal, history);
  },
  getFollowUpAnswerStream: async (base64ImageData: string, analysisSummary: string, userQuestion: string, aiEngine: AiEngine, user: User, signal?: AbortSignal, history: AnalysisMessage[] = []) => {
     // RAG can also be applied to follow-up questions. It is a premium feature.
     if (aiEngine === 'premium') {
        const ragContext = await performRagSearch(userQuestion, user);
        return conversationalAgent.getFollowUpAnswerStream(base64ImageData, analysisSummary, userQuestion, aiEngine, user.language, ragContext, signal, history);
     }
    // For non-premium, call without RAG context.
    return conversationalAgent.getFollowUpAnswerStream(base64ImageData, analysisSummary, userQuestion, aiEngine, user.language, null, signal, history);
  },

  // Structural Agent Functions
  getStructuralCalculation: (prompt: string, user: User, aiEngine: AiEngine): Promise<StructuralCalculationPayload> =>
    structuralAgent.getStructuralCalculation(prompt, user.calculationStandard, aiEngine),

  // Geotechnical Agent Functions
  getGeotechnicalCalculation: (prompt: string, user: User, aiEngine: AiEngine): Promise<GeotechnicalCalculationPayload> =>
    geotechnicalAgent.getGeotechnicalCalculation(prompt, user.calculationStandard, aiEngine),
  
  // Document Generation Router
  generateDocument: async (prompt: string, user: User, dashboardData: DashboardData, aiEngine: AiEngine): Promise<DocumentPayload> => {
      const intent = await detectTaskIntent(prompt, [], user); // History not needed for this specific detection
      if (intent.type !== 'document_generation') {
          throw new Error("This request was not identified as a document generation task.");
      }

      switch (intent.role) {
          case 'site_manager':
              return siteManagerAgent.generateDocument(intent.documentType, prompt, user, dashboardData);
          case 'hse_officer':
              return hseAgent.generateDocument(intent.documentType, prompt, user, dashboardData);
          case 'quality_control':
              return qualityAgent.generateDocument(intent.documentType, prompt, user, dashboardData);
          default:
              throw new Error(`The role "${intent.role}" is not yet supported for document generation.`);
      }
  },

  // Utility Agent Functions
  getRevisedText: (originalText: string, instruction: string, aiEngine: AiEngine, user: User): Promise<string> =>
    utilityAgent.getRevisedText(originalText, instruction, aiEngine, user.language),
  getReportSuggestions: (analysisText: string, aiEngine: AiEngine, user: User): Promise<string[]> =>
    utilityAgent.getReportSuggestions(analysisText, aiEngine, user.language),
  generateBriefingCards: (dashboardData: DashboardData, user: User): Promise<{ cards: IntelligenceCard[] }> =>
    utilityAgent.generateBriefingCards(dashboardData, user.language),
  getDailyFocus: (alerts: DashboardData['alerts'], user: User, aiEngine: AiEngine): Promise<string> =>
    utilityAgent.getDailyFocus(alerts, user, aiEngine),
  getPriorityTasks: (alerts: DashboardData['alerts'], user: User, aiEngine: AiEngine): Promise<any> =>
    utilityAgent.getPriorityTasks(alerts, user.language, aiEngine),
  getDynamicGrammar: utilityAgent.getDynamicGrammar,

  // Co-Pilot Agent Functions
  getUnifiedCoPilotResponseStream: (prompt: string, aiEngine: AiEngine, cameraFrameB64: string | null | undefined, deviceScreenshotB64: string | null | undefined, user: User, signal?: AbortSignal) =>
    copilotAgent.getUnifiedCoPilotResponseStream(prompt, aiEngine, cameraFrameB64, deviceScreenshotB64, user.language, signal),

  // Supervisor's Own Functions
  detectTaskIntent: detectTaskIntent,
};