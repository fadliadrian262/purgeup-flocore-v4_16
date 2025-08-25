import { Type } from "@google/genai";
import { ai } from "../index";
import { QualityManagementPlan, User, DashboardData } from '../../../types';

const systemInstruction = `You are an expert Quality Manager AI. Your task is to generate a comprehensive Quality Management Plan based on the principles of ISO 9001:2015.

Your entire response MUST be in the specified JSON schema. Do not add any conversational text.

Key instructions:
1.  **standardReference**: You MUST specify 'ISO 9001:2015 Principles'.
2.  **projectId**: Use a placeholder like 'METRO-TOWER-2024-QMP'.
3.  **preparedBy**: Use the current user's name.
4.  **revision**: Set to 1.
5.  **sections**: Create a detailed plan with multiple sections. You MUST include sections for:
    - Quality Policy
    - Roles and Responsibilities
    - Document Control
    - Inspection and Testing
    - Non-Conformance Management
    - Audits and Reviews
    Provide concise, professional content for each section based on best practices.`;

const reportSchema = {
    type: Type.OBJECT,
    properties: {
        resultType: { type: Type.STRING, enum: ['QUALITY_MANAGEMENT_PLAN'] },
        standardReference: { type: Type.STRING, enum: ['ISO 9001:2015 Principles'] },
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
 * Creates a Quality Management Plan.
 */
export const create = async (prompt: string, user: User, dashboardData: DashboardData): Promise<QualityManagementPlan> => {
    console.log(`[QualityManagementPlanAgent] Creating QMP for: "${prompt}"`);
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `User Request: "${prompt}". Current User: ${user.name}. Your response MUST include "resultType": "QUALITY_MANAGEMENT_PLAN".`,
            config: {
                systemInstruction,
                responseMimeType: 'application/json',
                responseSchema: reportSchema,
            }
        });
        const text = response.text;
        if (!text) throw new Error("Received an empty response from the AI.");
        const result: QualityManagementPlan = JSON.parse(text.trim());
        console.log("[QualityManagementPlanAgent] Successfully generated plan:", result);
        return result;
    } catch (error) {
        console.error("[QualityManagementPlanAgent] Error generating plan:", error);
        throw new Error("The AI failed to generate the Quality Management Plan.");
    }
};
