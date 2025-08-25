import { Type } from "@google/genai";
import { ai, getLanguageInstruction } from "./index";
import { AiEngine, DashboardData, User, PriorityTask, Language, IntelligenceCard, IntelligenceCardType, DashboardAlert } from '../../types';
import { localLlmService } from '../localLlmService';

/**
 * Revises a given text based on user instructions.
 * @param originalText - The text to be revised.
 * @param instruction - The user's instruction for the revision.
 * @param aiEngine - The selected AI engine for processing.
 * @param language - The desired output language.
 * @returns A promise that resolves to the revised text.
 */
export const getRevisedText = async (originalText: string, instruction: string, aiEngine: AiEngine, language: Language): Promise<string> => {
  console.log(`[UtilityAgent] Sending text for revision with instruction: "${instruction}" using ${aiEngine}`);

  const languageInstruction = getLanguageInstruction(language);
  const prompt = `You are a professional editor. The user has provided a text and an instruction to revise it. ${languageInstruction}
Revise the following text based on the user's instruction.
Your response MUST ONLY be the revised text itself, without any preamble, conversational text, or markdown formatting.

INSTRUCTION: "${instruction}"

TEXT TO REVISE:
---
${originalText}
---
`;
    
  if (aiEngine !== 'premium') {
      let fullAnswer = '';
      const stream = localLlmService.generateResponseStream(prompt, ''); // System prompt handled in main prompt for local
      for await (const chunk of stream) {
          fullAnswer += chunk.text;
      }
      return fullAnswer.trim();
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        temperature: 0.5, // Allow for some creativity in revision
      },
    });

    const text = response.text;
    if (!text) {
        throw new Error("Received an empty response from the AI for text revision.");
    }
    console.log("[UtilityAgent] Successfully received revised text.");
    return text.trim();

  } catch (error) {
    console.error("[UtilityAgent] Error calling Gemini API for text revision:", error);
    throw new Error("The AI assistant failed to revise the text. Please try again.");
  }
};

/**
 * Generates relevant report suggestions based on an analysis summary.
 * @param analysisText - The summary of the AI analysis.
 * @param aiEngine - The selected AI engine for processing.
 * @param language - The desired output language.
 * @returns A promise that resolves to an array of suggestion strings.
 */
export const getReportSuggestions = async (analysisText: string, aiEngine: AiEngine, language: Language): Promise<string[]> => {
  // This task requires nuanced understanding and structured output, which is better suited for the premium model.
  if (aiEngine !== 'premium') {
      console.log("[UtilityAgent] Report suggestions require premium engine. Returning empty.");
      return [];
  }
  
  console.log(`[UtilityAgent] Fetching report suggestions for analysis using ${aiEngine}...`);
  
  const languageInstruction = getLanguageInstruction(language);
  const prompt = `Based on the following construction site analysis summary, suggest 1 to 3 brief, actionable report generation instructions for a user. These will be used as one-click suggestion chips. ${languageInstruction}
  Examples:
  - If the summary mentions missing safety equipment, a good suggestion is "Generate a safety report for the missing PPE".
  - If it mentions a structural element mismatch, suggest "Flag the structural mismatch for engineering review".
  - If it's a general scene overview, suggest "Create a daily progress summary".

  Your output MUST be a valid JSON array of strings. Do not include any other text or markdown.

  ANALYSIS SUMMARY:
  ---
  ${analysisText}
  ---
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.STRING,
            description: "A single, actionable suggestion for generating a report."
          }
        }
      },
    });

    const text = response.text;
    if (!text) {
        console.warn("[UtilityAgent] Received empty response for suggestions, returning empty array.");
        return [];
    }

    const jsonText = text.trim();
    let suggestions = [];
    try {
        suggestions = JSON.parse(jsonText);
    } catch (parseError) {
        console.error("[UtilityAgent] Failed to parse suggestions JSON:", parseError, "Raw text:", jsonText);
        return []; // Return empty on parse failure
    }

    if (!Array.isArray(suggestions)) {
        throw new Error("Invalid JSON structure received from API for suggestions.");
    }

    console.log("[UtilityAgent] Successfully received report suggestions:", suggestions);
    return suggestions.slice(0, 3); // Ensure max 3 suggestions

  } catch (error) {
    console.error("[UtilityAgent] Error calling Gemini API for report suggestions:", error);
    // Return an empty array on error to avoid breaking the UI
    return [];
  }
};

export const generateBriefingCards = async (dashboardData: DashboardData, language: Language): Promise<{ cards: IntelligenceCard[] }> => {
    console.log(`[UtilityAgent] Generating AI briefing cards...`);

    const context = `
    - Weather: ${dashboardData.weather.condition}, ${dashboardData.weather.temp}°C. Forecast: ${dashboardData.weather.forecast}
    - Team: ${dashboardData.team.onSite}/${dashboardData.team.total} on site.
    - Progress: ${dashboardData.progress.completion}% complete.
    - Equipment Status: ${dashboardData.equipment.map(e => `${e.name}: ${e.status}`).join(', ')}
    - Alerts:
    ${dashboardData.alerts.map(a => `  - [${a.urgency}] ${a.title}: ${a.message}`).join('\n')}
    `;

    const cardSchema = {
        type: Type.OBJECT,
        properties: {
            id: { type: Type.STRING },
            type: { type: Type.STRING, enum: Object.values(IntelligenceCardType) },
            icon: { type: Type.STRING, description: "A relevant icon name from lucide-react icons, e.g., 'TriangleAlert', 'Sparkles', 'MessageCircle'." },
            title: { type: Type.STRING },
            message: { type: Type.STRING },
            timestamp: { type: Type.STRING, description: "Relative time, e.g., 'Just now', '15 mins ago'." },
            source: { type: Type.ARRAY, items: { type: Type.STRING } },
        },
        required: ["id", "type", "icon", "title", "message", "timestamp", "source"]
    };

    const responseSchema = {
        type: Type.OBJECT,
        properties: {
            cards: {
                type: Type.ARRAY,
                items: cardSchema
            }
        },
        required: ["cards"]
    };

    const languageInstruction = getLanguageInstruction(language);

    const prompt = `You are FLOCORE, an AI co-pilot for a construction project manager. Your task is to synthesize the provided project data into a feed of actionable "Intelligence Cards".

    Instructions:
    1.  Analyze all context data (Weather, Team, Progress, Alerts).
    2.  Generate 3-5 intelligence cards that highlight the most important risks, opportunities, and informational updates.
    3.  For each card, determine its type:
        - 'CRITICAL_RISK': For immediate, high-priority safety or schedule threats (e.g., high winds, critical alerts).
        - 'OPPORTUNITY': For potential optimizations or positive updates (e.g., good weather for a pour, a task being ahead of schedule).
        - 'INFO': For important but non-urgent updates (e.g., an RFI response, a change order approval).
    4.  Write a concise, clear title and message for each card.
    5.  For each card, identify the data sources you used (e.g., "Weather API", "Schedule Alert").
    6.  ${languageInstruction}
    7.  You MUST respond in the specified JSON format.

    PROJECT CONTEXT:
    ---
    ${context}
    ---
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: responseSchema,
                temperature: 0.4,
            }
        });

        const text = response.text;
        if (!text) {
            throw new Error("Received an empty response from the AI for the briefing cards.");
        }
        const result = JSON.parse(text.trim());
        console.log("[UtilityAgent] Successfully generated briefing cards:", result.cards);
        return result;

    } catch (error) {
        console.error("[UtilityAgent] Error calling Gemini API for briefing cards:", error);
        throw new Error("The AI assistant failed to generate the briefing. Please try again.");
    }
};

/**
 * Generates a single, high-priority focus statement for the day.
 * @param alerts - An array of dashboard alerts.
 * @param user - The current user.
 * @returns A promise that resolves to the daily focus text.
 */
export const getDailyFocus = async (alerts: DashboardAlert[], user: User, aiEngine: AiEngine): Promise<string> => {
    console.log(`[UtilityAgent] Generating Daily Focus for ${user.name} using ${aiEngine}...`);

    const formattedAlerts = alerts.map(a => `- ${a.title}: ${a.message} (Urgency: ${a.urgency}, Category: ${a.category})`).join('\n');
    const languageInstruction = getLanguageInstruction(user.language);

    const prompt = `You are FLOCORE, a construction AI co-pilot.
Your task is to analyze today's alerts and distill them into a SINGLE, powerful focus statement for the project manager, ${user.name}.

Instructions:
1.  Identify the single most urgent or impactful item from the alerts. A 'WARNING' for logistics is highly critical.
2.  Craft a single, concise sentence that tells the user what their primary focus should be.
3.  The tone should be direct, professional, and helpful.
4.  ${languageInstruction}

Example:
- If an alert says "Concrete Pour (Lvl 2 Slab) Scheduled for tomorrow at 8:00 AM", a good focus is: "Your primary focus today is completing all pre-pour checks for the Level 2 slab."
- If an RFI was just answered, a good focus is: "The key action for today is to review the architect's response to RFI #112 on HVAC placement."

Do not add any preamble like "Your focus is...". Just return the sentence.

RAW ALERT DATA:
---
${formattedAlerts}
---
`;

    if (aiEngine !== 'premium') {
        let fullAnswer = '';
        const stream = localLlmService.generateResponseStream(prompt, '');
        for await (const chunk of stream) {
            fullAnswer += chunk.text;
        }
        return fullAnswer.trim();
    }

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                temperature: 0.3,
            }
        });
        const text = response.text;
        if (!text) {
            throw new Error("Received an empty response from the AI for the daily focus.");
        }
        console.log("[UtilityAgent] Successfully generated Daily Focus:", text);
        return text.trim();
    } catch (error) {
        console.error("[UtilityAgent] Error calling Gemini API for Daily Focus:", error);
        throw new Error("Failed to generate the daily focus statement.");
    }
};

/**
 * Generates a list of priority tasks for the day.
 * @param alerts - An array of dashboard alerts.
 * @param language - The desired output language.
 * @returns A promise that resolves to an array of PriorityTask objects.
 */
export const getPriorityTasks = async (alerts: DashboardAlert[], language: Language, aiEngine: AiEngine): Promise<PriorityTask[]> => {
    console.log(`[UtilityAgent] Generating Priority Tasks using ${aiEngine}...`);

    const formattedAlerts = alerts.map(a => `- ${a.title}: ${a.message} (Urgency: ${a.urgency}, Category: ${a.category})`).join('\n');
    const languageInstruction = getLanguageInstruction(language);

    const responseSchema = {
        type: Type.ARRAY,
        items: {
            type: Type.OBJECT,
            properties: {
                id: { type: Type.STRING },
                title: { type: Type.STRING },
                deadline: { type: Type.STRING },
                category: {
                    type: Type.STRING,
                    enum: ['Safety', 'Quality', 'Schedule', 'Documentation'],
                },
            },
            required: ["id", "title", "deadline", "category"],
        }
    };

    const prompt = `You are FLOCORE, a construction AI co-pilot.
Your task is to analyze today's alerts and generate a short list of 2-3 high-priority, actionable tasks for a project manager.

Instructions:
1.  Read the alerts and identify concrete actions the user needs to take.
2.  Formulate each action as a clear, concise task title (e.g., "Complete pre-pour safety checklist").
3.  Assign a deadline (e.g., "Due Today by 3:00 PM", "Due This Week").
4.  Categorize each task as one of: 'Safety', 'Quality', 'Schedule', 'Documentation'.
5.  Create a unique ID for each task (e.g., "task-1").
6.  You MUST respond in the specified JSON format.
7.  ${languageInstruction}

RAW ALERT DATA:
---
${formattedAlerts}
---
`;

    if (aiEngine !== 'premium') {
         // Local LLMs are not reliable for this kind of structured JSON output.
         // We will return an empty array to prevent errors, with a console log.
        console.warn("[UtilityAgent] Priority task generation requires the 'premium' engine for reliable JSON output. Returning empty list.");
        return [];
    }

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: responseSchema,
            }
        });

        const text = response.text;
        if (!text) {
            console.warn("[UtilityAgent] Received empty response for priority tasks, returning empty array.");
            return [];
        }

        const jsonText = text.trim();
        let tasks = JSON.parse(jsonText);
        
        // Add isCompleted field
        tasks = tasks.map((task: any) => ({ ...task, isCompleted: false }));

        console.log("[UtilityAgent] Successfully generated Priority Tasks:", tasks);
        return tasks;
    } catch (error) {
        console.error("[UtilityAgent] Error calling Gemini API for Priority Tasks:", error);
        throw new Error("Failed to generate priority tasks.");
    }
};


/**
 * Generates a dynamic list of project-specific grammar terms from document names.
 * @param documentNames - An array of document file names.
 * @returns A promise that resolves to an array of grammar term strings.
 */
export const getDynamicGrammar = async (documentNames: string[]): Promise<string[]> => {
    // This task requires reliable JSON output, best handled by the premium model.
    console.log(`[UtilityAgent] Generating dynamic grammar from ${documentNames.length} documents...`);

    const prompt = `You are a text analysis AI for a construction company. Your task is to extract key project-specific nouns, abbreviations, and identifiers from the following list of document names.

    Instructions:
    1.  Extract names of companies, people, specific drawing numbers (e.g., 'RFI-112', 'CO-07'), and technical material names.
    2.  Do not extract generic words like 'plan', 'response', 'template', 'weekly', 'drawings'.
    3.  Break down hyphenated or underscore-separated names into their constituent parts if they seem like distinct words (e.g., 'Site-Logistics-Plan' -> 'Site Logistics').
    4.  The output MUST be a valid JSON array of strings. Do not include any other text or markdown.
    5.  Keep the list concise and focused on unique, likely-to-be-spoken terms.

    DOCUMENT NAMES:
    ---
    ${documentNames.join('\n')}
    ---
    `;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.STRING,
                        description: "A single, project-specific term or identifier."
                    }
                },
                temperature: 0.1,
            }
        });
        
        const text = response.text;
        if (!text) {
            console.warn("[UtilityAgent] Received empty response for dynamic grammar, returning empty array.");
            return [];
        }

        const jsonText = text.trim();
        const terms = JSON.parse(jsonText);
        
        if (!Array.isArray(terms)) {
            throw new Error("Invalid JSON structure received from API for grammar.");
        }

        console.log(`[UtilityAgent] Successfully generated ${terms.length} dynamic grammar terms.`);
        return terms;
    } catch (error) {
        console.error("[UtilityAgent] Error generating dynamic grammar:", error);
        // Fallback to empty array on failure
        return [];
    }
};