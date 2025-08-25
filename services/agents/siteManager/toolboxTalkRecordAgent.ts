import { Type } from "@google/genai";
import { ai } from "../index";
import { ToolboxTalkRecord, User, DashboardData } from '../../../types';

const systemInstruction = `You are an AI assistant for a construction Site Manager. Your task is to generate a record for a Toolbox Talk (daily safety briefing).

Your entire response MUST be in the specified JSON schema. Do not add any conversational text.

Key instructions:
1.  **date**: Use today's date.
2.  **topic**: Extract the main topic of the talk from the user's prompt (e.g., 'Working at Height').
3.  **presenter**: Use the current user's name as the presenter.
4.  **attendees**: Extract the list of attendees from the prompt. If none are listed, use a placeholder like 'Site Team'.
5.  **keyPointsDiscussed**: Summarize the key safety points mentioned in the user's prompt into a bulleted list.`;

const reportSchema = {
    type: Type.OBJECT,
    properties: {
        resultType: { type: Type.STRING, enum: ['TOOLBOX_TALK_RECORD'] },
        date: { type: Type.STRING },
        topic: { type: Type.STRING },
        presenter: { type: Type.STRING },
        attendees: { type: Type.ARRAY, items: { type: Type.STRING } },
        keyPointsDiscussed: { type: Type.ARRAY, items: { type: Type.STRING } },
    },
    required: ["resultType", "date", "topic", "presenter", "attendees", "keyPointsDiscussed"]
};

/**
 * Creates a Toolbox Talk Record.
 */
export const create = async (prompt: string, user: User, dashboardData: DashboardData): Promise<ToolboxTalkRecord> => {
    console.log(`[ToolboxTalkRecordAgent] Creating record for: "${prompt}"`);
    
    const context = `
    Current User: ${user.name}
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `User Request: "${prompt}". \n\n Project Context:\n${context} \n\n Your response MUST include "resultType": "TOOLBOX_TALK_RECORD".`,
            config: {
                systemInstruction,
                responseMimeType: 'application/json',
                responseSchema: reportSchema,
            }
        });

        const text = response.text;
        if (!text) {
            throw new Error("Received an empty response from the AI for the Toolbox Talk Record.");
        }

        const jsonText = text.trim();
        const result: ToolboxTalkRecord = JSON.parse(jsonText);
        console.log("[ToolboxTalkRecordAgent] Successfully generated record:", result);
        return result;

    } catch (error) {
        console.error("[ToolboxTalkRecordAgent] Error generating record:", error);
        throw new Error("The AI failed to generate the Toolbox Talk Record.");
    }
};