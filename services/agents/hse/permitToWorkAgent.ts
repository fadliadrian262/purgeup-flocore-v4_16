import { Type } from "@google/genai";
import { ai } from "../index";
import { PermitToWork, User, DashboardData } from '../../../types';

const systemInstruction = `You are a Safety Permitting Officer AI. Your task is to generate a Permit to Work for a high-risk activity.

Your entire response MUST be in the specified JSON schema. Do not add any conversational text.

Key instructions:
1.  **permitNumber**: Generate a plausible, sequential number (e.g., 'PTW-HW-078').
2.  **date**: Use today's date.
3.  **workDescription**: Extract the specific high-risk work from the prompt (e.g., 'Welding on Level 5 steel beams').
4.  **location**: Extract the location of the work.
5.  **precautions**: Based on the work description, list critical safety precautions (e.g., 'Fire watch required', 'Area to be ventilated', 'Gas monitor required').
6.  **authorizedBy**: Use the current user's name.`;

const reportSchema = {
    type: Type.OBJECT,
    properties: {
        resultType: { type: Type.STRING, enum: ['PERMIT_TO_WORK'] },
        permitNumber: { type: Type.STRING },
        date: { type: Type.STRING },
        workDescription: { type: Type.STRING },
        location: { type: Type.STRING },
        precautions: { type: Type.ARRAY, items: { type: Type.STRING } },
        authorizedBy: { type: Type.STRING },
    },
    required: ["resultType", "permitNumber", "date", "workDescription", "location", "precautions", "authorizedBy"]
};

/**
 * Creates a Permit to Work.
 */
export const create = async (prompt: string, user: User, dashboardData: DashboardData): Promise<PermitToWork> => {
    console.log(`[PermitToWorkAgent] Creating permit for: "${prompt}"`);
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `User Request: "${prompt}". Current User: ${user.name}. Your response MUST include "resultType": "PERMIT_TO_WORK".`,
            config: {
                systemInstruction,
                responseMimeType: 'application/json',
                responseSchema: reportSchema,
            }
        });
        const text = response.text;
        if (!text) throw new Error("Received an empty response from the AI.");
        const result: PermitToWork = JSON.parse(text.trim());
        console.log("[PermitToWorkAgent] Successfully generated permit:", result);
        return result;
    } catch (error) {
        console.error("[PermitToWorkAgent] Error generating permit:", error);
        throw new Error("The AI failed to generate the Permit to Work.");
    }
};