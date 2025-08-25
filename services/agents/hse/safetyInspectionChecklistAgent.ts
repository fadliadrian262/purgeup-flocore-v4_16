import { Type } from "@google/genai";
import { ai } from "../index";
import { SafetyInspectionChecklist, User, DashboardData } from '../../../types';

const systemInstruction = `You are a Safety Inspector AI. Your task is to generate a Safety Inspection Checklist.

Your entire response MUST be in the specified JSON schema. Do not add any conversational text.

Key instructions:
1.  **inspectionDate**: Use today's date.
2.  **inspector**: Use the current user's name.
3.  **area**: Extract the area to be inspected from the prompt (e.g., 'Scaffolding at East Elevation').
4.  **items**: Based on the area/topic, generate a list of 5-7 relevant, standard safety inspection items.
    - For each item, set the default status to 'Pass' and leave notes empty.`;

const reportSchema = {
    type: Type.OBJECT,
    properties: {
        resultType: { type: Type.STRING, enum: ['SAFETY_INSPECTION_CHECKLIST'] },
        inspectionDate: { type: Type.STRING },
        inspector: { type: Type.STRING },
        area: { type: Type.STRING },
        items: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    item: { type: Type.STRING },
                    status: { type: Type.STRING, enum: ['Pass', 'Fail', 'N/A'] },
                    notes: { type: Type.STRING },
                },
                required: ['item', 'status']
            }
        }
    },
    required: ["resultType", "inspectionDate", "inspector", "area", "items"]
};

/**
 * Creates a Safety Inspection Checklist.
 */
export const create = async (prompt: string, user: User, dashboardData: DashboardData): Promise<SafetyInspectionChecklist> => {
    console.log(`[SafetyInspectionChecklistAgent] Creating checklist for: "${prompt}"`);
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `User Request: "${prompt}". Current User: ${user.name}. Your response MUST include "resultType": "SAFETY_INSPECTION_CHECKLIST".`,
            config: {
                systemInstruction,
                responseMimeType: 'application/json',
                responseSchema: reportSchema,
            }
        });
        const text = response.text;
        if (!text) throw new Error("Received an empty response from the AI.");
        const result: SafetyInspectionChecklist = JSON.parse(text.trim());
        console.log("[SafetyInspectionChecklistAgent] Successfully generated checklist:", result);
        return result;
    } catch (error) {
        console.error("[SafetyInspectionChecklistAgent] Error generating checklist:", error);
        throw new Error("The AI failed to generate the Safety Inspection Checklist.");
    }
};