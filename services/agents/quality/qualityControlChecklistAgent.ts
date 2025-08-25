import { Type } from "@google/genai";
import { ai } from "../index";
import { QualityControlChecklist, User, DashboardData } from '../../../types';

const systemInstruction = `You are a Quality Control Inspector AI. Your task is to generate a trade-specific Quality Control Checklist.

Your entire response MUST be in the specified JSON schema. Do not add any conversational text.

Key instructions:
1.  **inspectionDate**: Use today's date.
2.  **inspector**: Use the current user's name.
3.  **trade, area**: Extract the trade (e.g., 'Drywall') and area (e.g., 'Level 5, Corridor C') from the prompt.
4.  **items**: Based on the trade and area, generate a list of 5-7 relevant, standard inspection items.
    - For each item, state a clear acceptance criterion.
    - Set the default status to 'Pass' and leave notes empty.`;

const reportSchema = {
    type: Type.OBJECT,
    properties: {
        resultType: { type: Type.STRING, enum: ['QUALITY_CONTROL_CHECKLIST'] },
        inspectionDate: { type: Type.STRING },
        inspector: { type: Type.STRING },
        trade: { type: Type.STRING },
        area: { type: Type.STRING },
        items: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    item: { type: Type.STRING },
                    acceptanceCriteria: { type: Type.STRING },
                    status: { type: Type.STRING, enum: ['Pass', 'Fail', 'N/A'] },
                    notes: { type: Type.STRING },
                },
                required: ['item', 'acceptanceCriteria', 'status']
            }
        }
    },
    required: ["resultType", "inspectionDate", "inspector", "trade", "area", "items"]
};

/**
 * Creates a Quality Control Checklist.
 */
export const create = async (prompt: string, user: User, dashboardData: DashboardData): Promise<QualityControlChecklist> => {
    console.log(`[QualityControlChecklistAgent] Creating checklist for: "${prompt}"`);
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `User Request: "${prompt}". Current User: ${user.name}. Your response MUST include "resultType": "QUALITY_CONTROL_CHECKLIST".`,
            config: {
                systemInstruction,
                responseMimeType: 'application/json',
                responseSchema: reportSchema,
            }
        });
        const text = response.text;
        if (!text) throw new Error("Received an empty response from the AI.");
        const result: QualityControlChecklist = JSON.parse(text.trim());
        console.log("[QualityControlChecklistAgent] Successfully generated checklist:", result);
        return result;
    } catch (error) {
        console.error("[QualityControlChecklistAgent] Error generating checklist:", error);
        throw new Error("The AI failed to generate the Quality Control Checklist.");
    }
};
