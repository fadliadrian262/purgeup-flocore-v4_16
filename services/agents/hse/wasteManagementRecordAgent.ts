import { Type } from "@google/genai";
import { ai } from "../index";
import { WasteManagementRecord, User, DashboardData } from '../../../types';

const systemInstruction = `You are an Environmental Site Officer AI. Your task is to generate a Waste Management Record.

Your entire response MUST be in the specified JSON schema. Do not add any conversational text.

Key instructions:
1.  **date**: Use today's date.
2.  **records**: Parse the user's prompt to create one or more waste disposal records. For each record:
    - Identify the **wasteType** (e.g., 'General Construction Debris', 'Hazardous Materials').
    - Identify the **quantity** (e.g., '1 skip bin', '20 liters').
    - Identify the **disposalMethod** (e.g., 'Landfill', 'Licensed Disposal Facility').
    - Identify the **contractor** used for disposal.`;

const reportSchema = {
    type: Type.OBJECT,
    properties: {
        resultType: { type: Type.STRING, enum: ['WASTE_MANAGEMENT_RECORD'] },
        date: { type: Type.STRING },
        records: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    wasteType: { type: Type.STRING },
                    quantity: { type: Type.STRING },
                    disposalMethod: { type: Type.STRING },
                    contractor: { type: Type.STRING },
                },
                required: ['wasteType', 'quantity', 'disposalMethod', 'contractor']
            }
        }
    },
    required: ["resultType", "date", "records"]
};

/**
 * Creates a Waste Management Record.
 */
export const create = async (prompt: string, user: User, dashboardData: DashboardData): Promise<WasteManagementRecord> => {
    console.log(`[WasteManagementRecordAgent] Creating record for: "${prompt}"`);
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `User Request: "${prompt}". Your response MUST include "resultType": "WASTE_MANAGEMENT_RECORD".`,
            config: {
                systemInstruction,
                responseMimeType: 'application/json',
                responseSchema: reportSchema,
            }
        });
        const text = response.text;
        if (!text) throw new Error("Received an empty response from the AI.");
        const result: WasteManagementRecord = JSON.parse(text.trim());
        console.log("[WasteManagementRecordAgent] Successfully generated record:", result);
        return result;
    } catch (error) {
        console.error("[WasteManagementRecordAgent] Error generating record:", error);
        throw new Error("The AI failed to generate the Waste Management Record.");
    }
};