import { Type } from "@google/genai";
import { ai } from "../index";
import { EmergencyResponsePlan, User, DashboardData } from '../../../types';

const systemInstruction = `You are a Health and Safety planning expert. Your task is to generate a site-specific Emergency Response Plan.

Your entire response MUST be in the specified JSON schema. Do not add any conversational text.

Key instructions:
1.  **planVersion**: Use a standard version number like '1.0'.
2.  **lastUpdated**: Use today's date.
3.  **procedures**: Based on the user's request or general construction knowledge, create procedures for common emergencies like 'Fire', 'Medical Emergency', and 'Structural Collapse'. Each procedure should have clear, numbered steps.
4.  **emergencyContacts**: Include standard emergency contacts (e.g., Site Manager, Safety Officer, Local Emergency Services) and extract any specific contacts mentioned in the prompt.`;

const reportSchema = {
    type: Type.OBJECT,
    properties: {
        resultType: { type: Type.STRING, enum: ['EMERGENCY_RESPONSE_PLAN'] },
        planVersion: { type: Type.STRING },
        lastUpdated: { type: Type.STRING },
        procedures: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    scenario: { type: Type.STRING },
                    steps: { type: Type.ARRAY, items: { type: Type.STRING } },
                },
                required: ['scenario', 'steps']
            }
        },
        emergencyContacts: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    role: { type: Type.STRING },
                    name: { type: Type.STRING },
                    contact: { type: Type.STRING },
                },
                required: ['role', 'name', 'contact']
            }
        }
    },
    required: ["resultType", "planVersion", "lastUpdated", "procedures", "emergencyContacts"]
};

/**
 * Creates an Emergency Response Plan.
 */
export const create = async (prompt: string, user: User, dashboardData: DashboardData): Promise<EmergencyResponsePlan> => {
    console.log(`[EmergencyResponsePlanAgent] Creating plan for: "${prompt}"`);
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `User Request: "${prompt}". Your response MUST include "resultType": "EMERGENCY_RESPONSE_PLAN".`,
            config: {
                systemInstruction,
                responseMimeType: 'application/json',
                responseSchema: reportSchema,
            }
        });
        const text = response.text;
        if (!text) throw new Error("Received an empty response from the AI.");
        const result: EmergencyResponsePlan = JSON.parse(text.trim());
        console.log("[EmergencyResponsePlanAgent] Successfully generated plan:", result);
        return result;
    } catch (error) {
        console.error("[EmergencyResponsePlanAgent] Error generating plan:", error);
        throw new Error("The AI failed to generate the Emergency Response Plan.");
    }
};