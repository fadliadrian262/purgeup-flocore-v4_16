import { Type } from "@google/genai";
import { ai } from "../index";
import { MaterialDeliveryRecord, User, DashboardData } from '../../../types';

const systemInstruction = `You are FLOCORE, an AI assistant for construction site managers. Your task is to generate a Material Delivery Record.

Your entire response MUST be in the specified JSON schema. Do not add any conversational text.

Key instructions:
1.  **deliveryDate**: Use today's date in a readable format (e.g., 'July 26, 2024').
2.  **records**: Parse the user's prompt to extract details for each delivery.
    - Material: The item delivered (e.g., 'Rebar D22').
    - Supplier: The company that delivered the material.
    - Quantity: The amount delivered (e.g., '5 tons').
    - qualityCheckStatus: Assume 'Pass' unless the user indicates an issue.
    - storageLocation: Infer a logical storage location (e.g., 'Laydown Area B').`;

const reportSchema = {
    type: Type.OBJECT,
    properties: {
        resultType: { type: Type.STRING, enum: ['MATERIAL_DELIVERY_RECORD'] },
        deliveryDate: { type: Type.STRING },
        records: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    material: { type: Type.STRING },
                    supplier: { type: Type.STRING },
                    quantity: { type: Type.STRING },
                    qualityCheckStatus: { type: Type.STRING, enum: ['Pass', 'Fail'] },
                    storageLocation: { type: Type.STRING },
                },
                required: ['material', 'supplier', 'quantity', 'qualityCheckStatus', 'storageLocation']
            }
        }
    },
    required: ["resultType", "deliveryDate", "records"]
};

/**
 * Creates a Material Delivery Record.
 */
export const create = async (prompt: string, user: User, dashboardData: DashboardData): Promise<MaterialDeliveryRecord> => {
    console.log(`[MaterialDeliveryRecordAgent] Creating record for: "${prompt}"`);

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `User Request: "${prompt}". \n\n Your response MUST include "resultType": "MATERIAL_DELIVERY_RECORD".`,
            config: {
                systemInstruction,
                responseMimeType: 'application/json',
                responseSchema: reportSchema,
            }
        });

        const text = response.text;
        if (!text) {
            throw new Error("Received an empty response from the AI for the Material Delivery Record.");
        }

        const jsonText = text.trim();
        const result: MaterialDeliveryRecord = JSON.parse(jsonText);
        console.log("[MaterialDeliveryRecordAgent] Successfully generated record:", result);
        return result;

    } catch (error) {
        console.error("[MaterialDeliveryRecordAgent] Error generating record:", error);
        throw new Error("The AI failed to generate the Material Delivery Record.");
    }
};