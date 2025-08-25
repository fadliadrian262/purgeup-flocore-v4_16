import { ai, noisyEnvironmentInstruction, getLanguageInstruction } from "./index";
import { AiEngine, Language, AnalysisMessage } from '../../types';
import { localLlmService } from '../localLlmService';
import { Content } from "@google/genai";

// Simple text/payload serializer for building conversation history
const serializeMessageToText = (message: AnalysisMessage): string | null => {
    if (message.text) return message.text;
    if (message.analysisSummary) return `[AI Analysis Summary]: ${message.analysisSummary}`;
    if (message.structuralCalculationPayload) {
        const p = message.structuralCalculationPayload;
        return `[Structural Calculation Result: ${p.task}] Final Answer: ${p.result.conclusion.finalAnswer.value} ${p.result.conclusion.finalAnswer.unit}.`;
    }
    if (message.geotechnicalCalculationPayload) {
        const p = message.geotechnicalCalculationPayload;
        return `[Geotechnical Calculation Result: ${p.task}] Final Answer: ${p.result.conclusion.finalAnswer.name} is ${p.result.conclusion.finalAnswer.value} ${p.result.conclusion.finalAnswer.unit}.`;
    }
    if (message.documentPayload) {
        const p = message.documentPayload;
        let summary = `Generated document: ${p.task}`;
        if (p.result.resultType === 'DAILY_SITE_REPORT') {
            summary = `Generated daily report for ${p.result.reportDate}.`;
        } else if (p.result.resultType === 'INCIDENT_REPORT') {
             summary = `Generated incident report for ${p.result.dateOfIncident}.`;
        }
        return `[Document Task: ${p.task}]\nSummary: ${summary}`;
    }
    return null;
}

/**
 * Builds a conversation history in the format expected by the Gemini API.
 * @param messages The application's analysis thread.
 * @returns An array of Content objects for the API.
 */
export const buildHistory = (messages: AnalysisMessage[]): Content[] => {
    const history: Content[] = [];
    // Skip welcome message and current user/thinking messages
    const messagesToProcess = messages.slice(1, messages.length > 1 ? messages.length - 2 : 1);

    for (const message of messagesToProcess) {
        if (message.isTyping) continue;
        
        const role = message.author === 'user' ? 'user' : 'model';
        const text = serializeMessageToText(message);
        
        if (text) {
            history.push({ role, parts: [{ text }] });
        }
    }
    return history;
}

/**
 * Gets a conversational response from the Gemini API for a given text prompt.
 * @param prompt - The user's question or statement.
 * @param aiEngine - The selected AI engine for processing.
 * @param language - The desired output language.
 * @param ragContext - Optional context retrieved from a project document.
 * @param signal - An AbortSignal to allow for cancellation of the stream.
 * @param history - The conversation history.
 * @returns A promise that resolves to the model's text response stream.
 */
export const getConversationalResponseStream = async (
    prompt: string, 
    aiEngine: AiEngine, 
    language: Language, 
    ragContext: { context: string; source: string; } | null,
    signal?: AbortSignal,
    history: AnalysisMessage[] = []
) => {
  let systemInstruction = `You are FLOCORE, an AI-powered construction intelligence platform. You are a helpful assistant to construction professionals. Answer their questions concisely and accurately. Your persona is professional, helpful, and an expert in the construction domain.
If a user asks about your calculation capabilities but does not provide enough data (e.g., "can you calculate a beam?"), you MUST respond by confirming your ability and then asking for the specific information you need to proceed (e.g., dimensions, loads, material properties).
Use markdown for formatting like bolding and lists. ${getLanguageInstruction(language)}`;

  if (ragContext) {
      console.log(`[ConversationalAgent] Injecting RAG context from source: ${ragContext.source}`);
      systemInstruction += `

---
CRITICAL CONTEXT FROM PROJECT DOCUMENT: "${ragContext.source}"
You MUST prioritize the information in this context to answer the user's question. If the context is relevant, you MUST cite the source document in your answer (e.g., "According to ${ragContext.source}, ...").

CONTEXT:
${ragContext.context}
---
`;
  } else {
      systemInstruction += ' Answer based on your general knowledge.';
  }
  
  systemInstruction += noisyEnvironmentInstruction;

  // Local LLM does not support RAG, so we won't pass context. This is handled by supervisor only calling RAG for premium.
  if (aiEngine === 'advanced' || aiEngine === 'compact') {
      console.log(`[ConversationalAgent] Routing to local LLM with engine: ${aiEngine}`);
      // For local LLM, we must build the history into the prompt itself.
      const historyText = history.map(m => `${m.author}: ${serializeMessageToText(m)}`).join('\n');
      const fullPrompt = `${historyText}\nuser: ${prompt}`;
      return localLlmService.generateResponseStream(fullPrompt, systemInstruction);
  }

  console.log(`[ConversationalAgent] Sending prompt to Gemini using ${aiEngine} in ${language}: "${prompt}"`);
  
  const formattedHistory = buildHistory(history);
  const contents: Content[] = [...formattedHistory, { role: 'user', parts: [{ text: prompt }] }];

  try {
    const response = await ai.models.generateContentStream({
      model: 'gemini-2.5-flash',
      contents: contents,
      config: {
        systemInstruction,
        temperature: 0.3, // Lower temperature for more factual, less "creative" (and typo-prone) responses.
        thinkingConfig: { thinkingBudget: 0 }, // Optimize for low latency in conversational mode
      },
    });

    console.log("[ConversationalAgent] Successfully initiated stream.");
    return response;

  } catch (error) {
    console.error("[ConversationalAgent] Error calling Gemini API:", error);
    // Re-throw the error to be handled by the calling function in the UI.
    throw new Error("The AI assistant failed to respond. Please try again.");
  }
};

/**
 * Provides a conversational answer to a follow-up question about a previous analysis.
 * @param base64ImageData The base64-encoded image from the original analysis.
 * @param analysisSummary The text summary from the original analysis.
 * @param userQuestion The user's new follow-up question.
 * @param aiEngine The selected AI engine.
 * @param language The desired output language.
 * @param ragContext - Optional context retrieved from a project document.
 * @param signal - An AbortSignal to allow for cancellation of the stream.
 * @param history - The conversation history.
 * @returns A promise that resolves to the AI's textual answer stream.
 */
export const getFollowUpAnswerStream = async (
  base64ImageData: string,
  analysisSummary: string,
  userQuestion: string,
  aiEngine: AiEngine,
  language: Language,
  ragContext: { context: string; source: string; } | null,
  signal?: AbortSignal,
  history: AnalysisMessage[] = []
) => {
  if (aiEngine !== 'premium') {
    throw new Error("Analyzing images in conversation requires the 'Premium' cloud engine. Please switch engines and try again.");
  }

  console.log(`[ConversationalAgent] Getting follow-up answer from Gemini using ${aiEngine} in ${language}...`);
  
  const languageInstruction = getLanguageInstruction(language);

  let systemInstruction = `You are FLOCORE, an expert construction site AI. You have already provided an initial analysis of an image. The user now has a follow-up question. 
Your task is to answer this new question based on the visual evidence in the image AND any additional context provided. Be direct and concise. If you cannot determine the answer, state that clearly. Use markdown for formatting. ${languageInstruction}`;

  if (ragContext) {
      console.log(`[ConversationalAgent] Injecting RAG context into follow-up from source: ${ragContext.source}`);
      systemInstruction += `

---
CRITICAL CONTEXT FROM PROJECT DOCUMENT: "${ragContext.source}"
You MUST prioritize the information in this context to answer the user's question. If the context is relevant, you MUST cite the source document in your answer (e.g., "According to ${ragContext.source}, ..."). This context is MORE IMPORTANT than the initial analysis summary if they conflict.

CONTEXT:
${ragContext.context}
---
`;
  }
  
  systemInstruction += `

INITIAL ANALYSIS SUMMARY:
---
${analysisSummary}
---` + noisyEnvironmentInstruction;
  
  const formattedHistory = buildHistory(history);
  
  const imagePart = { inlineData: { mimeType: 'image/jpeg', data: base64ImageData } };
  const textPart = { text: `USER'S FOLLOW-UP QUESTION: "${userQuestion}"`};
  
  // The history should lead up to this point. The user's first "message" in this chain
  // is effectively the image, and the model's first response is the summary.
  const contents: Content[] = [
      ...formattedHistory,
      { role: 'user', parts: [textPart, imagePart] }
  ];

  try {
    const response = await ai.models.generateContentStream({
      model: 'gemini-2.5-flash',
      contents: contents,
      config: {
        systemInstruction,
        temperature: 0.3,
      },
    });
    
    console.log("[ConversationalAgent] Successfully initiated follow-up answer stream.");
    return response;

  } catch (error) {
    console.error("[ConversationalAgent] Error calling Gemini API for follow-up:", error);
    throw new Error("The AI assistant failed to provide a follow-up answer.");
  }
};