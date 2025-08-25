import { Type } from "@google/genai";
import { ai } from "../index";
import { TemporaryWorksCertificate, User, DashboardData } from '../../../types';

const systemInstruction = `You are a Temporary Works Coordinator AI. Your task is to generate a Temporary Works Certificate for approval.

Your entire response MUST be in the specified JSON schema. Do not add any conversational text.

Key instructions:
1.  **certificateDate**: Use today's date.
2.  **descriptionOfWorks**: Extract the description of the temporary works (e.g., 'Scaffolding for Level 3 facade') from the prompt.
3.  **designer, checker**: Extract the names or roles of the designer and checker from the prompt.
4.  **approvalStatus**: Set the default status to 'Approved', as this is a draft for signature.`;

const reportSchema = {
    type: Type.OBJECT,
    properties: {
        resultType: { type: Type.STRING, enum: ['TEMPORARY_WORKS_CERTIFICATE'] },
        certificateDate: { type: Type.STRING },
        descriptionOfWorks: { type: Type.STRING },
        designer: { type: Type.STRING },
        checker: { type: Type.STRING },
        approvalStatus: { type: Type.STRING, enum: ['Approved', 'Approved with Comments', 'Rejected'] },
    },
    required: ["resultType", "certificateDate", "descriptionOfWorks", "designer", "checker", "approvalStatus"]
};

/**
 * Creates a Temporary Works Certificate.
 */
export const create = async (prompt: string, user: User, dashboardData: DashboardData): Promise<TemporaryWorksCertificate> => {
    console.log(`[TemporaryWorksCertificateAgent] Creating certificate for: "${prompt}"`);

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `User Request: "${prompt}". \n\n Your response MUST include "resultType": "TEMPORARY_WORKS_CERTIFICATE".`,
            config: {
                systemInstruction,
                responseMimeType: 'application/json',
                responseSchema: reportSchema,
            }
        });

        const text = response.text;
        if (!text) {
            throw new Error("Received an empty response from the AI for the Temporary Works Certificate.");
        }

        const jsonText = text.trim();
        const result: TemporaryWorksCertificate = JSON.parse(jsonText);
        console.log("[TemporaryWorksCertificateAgent] Successfully generated certificate:", result);
        return result;

    } catch (error) {
        console.error("[TemporaryWorksCertificateAgent] Error generating certificate:", error);
        throw new Error("The AI failed to generate the Temporary Works Certificate.");
    }
};