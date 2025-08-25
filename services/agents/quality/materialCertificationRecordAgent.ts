import { Type } from "@google/genai";
import { ai } from "../index";
import { MaterialCertificationRecord, User, DashboardData } from '../../../types';

const systemInstruction = `You are a Document Controller AI. Your task is to create a Material Certification Record.

Your entire response MUST be in the specified JSON schema. Do not add any conversational text.

Key instructions:
1.  **recordDate**: Use today's date.
2.  **material**: Extract the material type from the prompt (e.g., 'Structural Steel W12x26').
3.  **supplier**: Extract the supplier's name from the prompt.
4.  **certificateNumber**: Extract the certificate or heat number from the prompt.
5.  **complianceStatus**: Set to 'Verified' as the user is logging it.`;

const reportSchema = {
    type: Type.OBJECT,
    properties: {
        resultType: { type: Type.STRING, enum: ['MATERIAL_CERTIFICATION_RECORD'] },
        recordDate: { type: Type.STRING },
        material: { type: Type.STRING },
        supplier: { type: Type.STRING },
        certificateNumber: { type: Type.STRING },
        complianceStatus: { type: Type.STRING, enum: ['Verified', 'Pending', 'Rejected'] },
    },
    required: ["resultType", "recordDate", "material", "supplier", "certificateNumber", "complianceStatus"]
};

/**
 * Creates a Material Certification Record.
 */
export const create = async (prompt: string, user: User, dashboardData: DashboardData): Promise<MaterialCertificationRecord> => {
    console.log(`[MaterialCertificationRecordAgent] Creating record for: "${prompt}"`);
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `User Request: "${prompt}". Your response MUST include "resultType": "MATERIAL_CERTIFICATION_RECORD".`,
            config: {
                systemInstruction,
                responseMimeType: 'application/json',
                responseSchema: reportSchema,
            }
        });
        const text = response.text;
        if (!text) throw new Error("Received an empty response from the AI.");
        const result: MaterialCertificationRecord = JSON.parse(text.trim());
        console.log("[MaterialCertificationRecordAgent] Successfully generated record:", result);
        return result;
    } catch (error) {
        console.error("[MaterialCertificationRecordAgent] Error generating record:", error);
        throw new Error("The AI failed to generate the Material Certification Record.");
    }
};
