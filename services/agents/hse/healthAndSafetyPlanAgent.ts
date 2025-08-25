import { Type } from "@google/genai";
import { ai } from "../index";
import { HealthAndSafetyPlan, User, DashboardData } from '../../../types';

const systemInstruction = `You are an expert Health and Safety Manager AI. Your task is to generate a comprehensive Health and Safety Plan based on the principles of ISO 45001.

Your entire response MUST be in the specified JSON schema. Do not add any conversational text.

Key instructions:
1.  **standardReference**: You MUST specify 'ISO 45001 Principles'.
2.  **projectId**: Use a placeholder like 'METRO-TOWER-2024'.
3.  **preparedBy**: Use the current user's name.
4.  **revision**: Set to 1.
5.  **sections**: Create a detailed plan with multiple sections. You MUST include sections for:
    - Policy Statement
    - Roles and Responsibilities
    - Hazard Identification and Risk Assessment
    - Emergency Procedures
    - Training and Competence
    - Incident Reporting
    Provide concise, professional content for each section.`;

const reportSchema = {
    type: Type.OBJECT,
    properties: {
        resultType: { type: Type.STRING, enum: ['HEALTH_AND_SAFETY_PLAN'] },
        standardReference: { type: Type.STRING, enum: ['ISO 45001 Principles'] },
        projectId: { type: Type.STRING },
        preparedBy: { type: Type.STRING },
        revision: { type: Type.NUMBER },
        sections: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    title: { type: Type.STRING },
                    content: { type: Type.STRING },
                },
                required: ['title', 'content']
            }
        }
    },
    required: ["resultType", "standardReference", "projectId", "preparedBy", "revision", "sections"]
};

/**
 * Creates a Health and Safety Plan.
 */
export const create = async (prompt: string, user: User, dashboardData: DashboardData): Promise<HealthAndSafetyPlan> => {
    console.log(`[HealthAndSafetyPlanAgent] Creating plan for: "${prompt}"`);
    
    const context = `
    Current User: ${user.name}
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `User Request: "${prompt}". \n\n Project Context:\n${context} \n\n Your response MUST include "resultType": "HEALTH_AND_SAFETY_PLAN".`,
            config: {
                systemInstruction,
                responseMimeType: 'application/json',
                responseSchema: reportSchema,
            }
        });

        const text = response.text;
        if (!text) {
            throw new Error("Received an empty response from the AI for the Health and Safety Plan.");
        }

        const jsonText = text.trim();
        const result: HealthAndSafetyPlan = JSON.parse(jsonText);
        console.log("[HealthAndSafetyPlanAgent] Successfully generated plan:", result);
        return result;

    } catch (error) {
        console.error("[HealthAndSafetyPlanAgent] Error generating plan:", error);
        throw new Error("The AI failed to generate the Health and Safety Plan.");
    }
};