import { Type } from "@google/genai";
import { ai } from "../index";
import { SiteDiaryJournalEntry, User, DashboardData } from '../../../types';

const systemInstruction = `You are FLOCORE, an AI assistant for construction site managers. Your task is to create a chronological Site Diary / Journal Entry.

Your entire response MUST be in the specified JSON schema. Do not add any conversational text.

Key instructions:
1.  **entryDate**: Use today's date in a readable format (e.g., 'July 26, 2024').
2.  **author**: Use the current user's name.
3.  **entries**: Parse the user's prompt, which may contain several activities at different times. Create a separate entry object for each distinct activity.
    - Infer the time (e.g., '8:00 AM').
    - Summarize the activity.
    - Include any specific notes mentioned by the user.`;

const reportSchema = {
    type: Type.OBJECT,
    properties: {
        resultType: { type: Type.STRING, enum: ['SITE_DIARY_JOURNAL_ENTRY'] },
        entryDate: { type: Type.STRING },
        author: { type: Type.STRING },
        entries: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    time: { type: Type.STRING },
                    activity: { type: Type.STRING },
                    notes: { type: Type.STRING }
                },
                required: ['time', 'activity']
            }
        }
    },
    required: ["resultType", "entryDate", "author", "entries"]
};

/**
 * Creates a Site Diary Journal Entry.
 */
export const create = async (prompt: string, user: User, dashboardData: DashboardData): Promise<SiteDiaryJournalEntry> => {
    console.log(`[SiteDiaryJournalEntryAgent] Creating entry for: "${prompt}"`);
    
    const context = `
    Current User: ${user.name}
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `User Request: "${prompt}". \n\n Project Context:\n${context} \n\n Your response MUST include "resultType": "SITE_DIARY_JOURNAL_ENTRY".`,
            config: {
                systemInstruction,
                responseMimeType: 'application/json',
                responseSchema: reportSchema,
            }
        });

        const text = response.text;
        if (!text) {
            throw new Error("Received an empty response from the AI for the Site Diary.");
        }

        const jsonText = text.trim();
        const result: SiteDiaryJournalEntry = JSON.parse(jsonText);
        console.log("[SiteDiaryJournalEntryAgent] Successfully generated entry:", result);
        return result;

    } catch (error) {
        console.error("[SiteDiaryJournalEntryAgent] Error generating entry:", error);
        throw new Error("The AI failed to generate the Site Diary Journal Entry.");
    }
};