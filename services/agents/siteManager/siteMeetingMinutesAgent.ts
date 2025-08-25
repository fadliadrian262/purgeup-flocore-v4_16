import { Type } from "@google/genai";
import { ai } from "../index";
import { SiteMeetingMinutes, User, DashboardData } from '../../../types';

const systemInstruction = `You are a Project Administrator AI. Your task is to generate formal meeting minutes based on the user's summary of a site meeting.

Your entire response MUST be in the specified JSON schema. Do not add any conversational text.

Key instructions:
1.  **meetingDate**: Use today's date.
2.  **attendees**: Extract the names of attendees from the user's prompt.
3.  **agenda**: Infer the main discussion topics from the prompt.
4.  **decisionsMade**: List any clear decisions that were reached.
5.  **actionItems**: For each action, identify the task, who is responsible, and the deadline.`;

const reportSchema = {
    type: Type.OBJECT,
    properties: {
        resultType: { type: Type.STRING, enum: ['SITE_MEETING_MINUTES'] },
        meetingDate: { type: Type.STRING },
        attendees: { type: Type.ARRAY, items: { type: Type.STRING } },
        agenda: { type: Type.ARRAY, items: { type: Type.STRING } },
        decisionsMade: { type: Type.ARRAY, items: { type: Type.STRING } },
        actionItems: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    action: { type: Type.STRING },
                    responsible: { type: Type.STRING },
                    deadline: { type: Type.STRING },
                },
                required: ['action', 'responsible', 'deadline']
            }
        }
    },
    required: ["resultType", "meetingDate", "attendees", "agenda", "decisionsMade", "actionItems"]
};

/**
 * Creates Site Meeting Minutes.
 */
export const create = async (prompt: string, user: User, dashboardData: DashboardData): Promise<SiteMeetingMinutes> => {
    console.log(`[SiteMeetingMinutesAgent] Creating minutes for: "${prompt}"`);

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `User Request: "${prompt}". \n\n Your response MUST include "resultType": "SITE_MEETING_MINUTES".`,
            config: {
                systemInstruction,
                responseMimeType: 'application/json',
                responseSchema: reportSchema,
            }
        });

        const text = response.text;
        if (!text) {
            throw new Error("Received an empty response from the AI for the Site Meeting Minutes.");
        }

        const jsonText = text.trim();
        const result: SiteMeetingMinutes = JSON.parse(jsonText);
        console.log("[SiteMeetingMinutesAgent] Successfully generated minutes:", result);
        return result;

    } catch (error) {
        console.error("[SiteMeetingMinutesAgent] Error generating minutes:", error);
        throw new Error("The AI failed to generate the Site Meeting Minutes.");
    }
};