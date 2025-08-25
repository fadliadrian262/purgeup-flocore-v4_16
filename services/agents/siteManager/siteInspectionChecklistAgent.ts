import { Type } from "@google/genai";
import { ai } from "../index";
import { SiteInspectionChecklist, User, DashboardData } from '../../../types';

const systemInstruction = `You are a Quality Control Inspector AI. Your task is to generate a Site Inspection Checklist based on the user's request.

Your entire response MUST be in the specified JSON schema. Do not add any conversational text.

Key instructions:
1.  **inspectionDate**: Use today's date.
2.  **inspector**: Use the current user's name.
3.  **trade, area**: Extract the trade (e.g., 'Concrete') and area (e.g., 'Level 2 Slab') from the prompt.
4.  **items**: Based on the trade and area, generate a list of 5-7 relevant, standard inspection items.
    - For each item, set the default status to 'Pass' and leave notes empty, as the user will fill this out during the inspection.`;

const reportSchema = {
    type: Type.OBJECT,
    properties: {
        resultType: { type: Type.STRING, enum: ['SITE_INSPECTION_CHECKLIST'] },
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
                    status: { type: Type.STRING, enum: ['Pass', 'Fail', 'N/A'] },
                    notes: { type: Type.STRING },
                },
                required: ['item', 'status']
            }
        }
    },
    required: ["resultType", "inspectionDate", "inspector", "trade", "area", "items"]
};

/**
 * Creates a Site Inspection Checklist.
 */
export const create = async (prompt: string, user: User, dashboardData: DashboardData): Promise<SiteInspectionChecklist> => {
    console.log(`[SiteInspectionChecklistAgent] Creating checklist for: "${prompt}"`);
    
    const context = `
    Current User: ${user.name}
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `User Request: "${prompt}". \n\n Project Context:\n${context} \n\n Your response MUST include "resultType": "SITE_INSPECTION_CHECKLIST".`,
            config: {
                systemInstruction,
                responseMimeType: 'application/json',
                responseSchema: reportSchema,
            }
        });

        const text = response.text;
        if (!text) {
            throw new Error("Received an empty response from the AI for the Site Inspection Checklist.");
        }

        const jsonText = text.trim();
        const result: SiteInspectionChecklist = JSON.parse(jsonText);
        console.log("[SiteInspectionChecklistAgent] Successfully generated checklist:", result);
        return result;

    } catch (error) {
        console.error("[SiteInspectionChecklistAgent] Error generating checklist:", error);
        throw new Error("The AI failed to generate the Site Inspection Checklist.");
    }
};