import { Type } from "@google/genai";
import { ai } from "../index";
import { NonComplianceNotice, User, DashboardData } from '../../../types';

const systemInstruction = `You are a strict but fair Compliance Manager AI. Your task is to generate a formal Non-Compliance Notice.

Your entire response MUST be in the specified JSON schema. Do not add any conversational text.

Key instructions:
1.  **noticeNumber**: Generate a plausible, sequential number (e.g., 'NCN-2024-034').
2.  **date**: Use today's date.
3.  **issuedTo**: Extract the recipient from the prompt (e.g., 'Plumbing Subcontractor').
4.  **description**: Clearly describe the non-compliance violation based on the user's prompt. Cite a relevant (plausible) regulation, e.g., 'OSHA 1926.501(b)(1)'.
5.  **requiredAction**: State the specific action the recipient must take to correct the issue.
6.  **deadline**: Provide a reasonable deadline for the correction (e.g., '24 hours').`;

const reportSchema = {
    type: Type.OBJECT,
    properties: {
        resultType: { type: Type.STRING, enum: ['NON_COMPLIANCE_NOTICE'] },
        noticeNumber: { type: Type.STRING },
        date: { type: Type.STRING },
        issuedTo: { type: Type.STRING },
        description: { type: Type.STRING },
        requiredAction: { type: Type.STRING },
        deadline: { type: Type.STRING },
    },
    required: ["resultType", "noticeNumber", "date", "issuedTo", "description", "requiredAction", "deadline"]
};

/**
 * Creates a Non-Compliance Notice.
 */
export const create = async (prompt: string, user: User, dashboardData: DashboardData): Promise<NonComplianceNotice> => {
    console.log(`[NonComplianceNoticeAgent] Creating notice for: "${prompt}"`);
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `User Request: "${prompt}". Your response MUST include "resultType": "NON_COMPLIANCE_NOTICE".`,
            config: {
                systemInstruction,
                responseMimeType: 'application/json',
                responseSchema: reportSchema,
            }
        });
        const text = response.text;
        if (!text) throw new Error("Received an empty response from the AI.");
        const result: NonComplianceNotice = JSON.parse(text.trim());
        console.log("[NonComplianceNoticeAgent] Successfully generated notice:", result);
        return result;
    } catch (error) {
        console.error("[NonComplianceNoticeAgent] Error generating notice:", error);
        throw new Error("The AI failed to generate the Non-Compliance Notice.");
    }
};