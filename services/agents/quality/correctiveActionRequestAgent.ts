import { Type } from "@google/genai";
import { ai } from "../index";
import { CorrectiveActionRequest, User, DashboardData } from '../../../types';

const systemInstruction = `You are a Quality Manager AI. Your task is to generate a formal Corrective Action Request (CAR).

Your entire response MUST be in the specified JSON schema. Do not add any conversational text.

Key instructions:
1.  **carNumber**: Generate a plausible, sequential number (e.g., 'CAR-2024-021').
2.  **dateIssued**: Use today's date.
3.  **issuedTo**: Extract the recipient from the prompt (e.g., 'Formwork Subcontractor').
4.  **nonConformanceReference**: Extract the reference NCR number from the prompt.
5.  **description**: Briefly restate the non-conformance issue.
6.  **requiredAction**: State the specific systemic action the recipient must take to prevent recurrence.
7.  **deadline**: Provide a reasonable deadline for the action plan submission.`;

const reportSchema = {
    type: Type.OBJECT,
    properties: {
        resultType: { type: Type.STRING, enum: ['CORRECTIVE_ACTION_REQUEST'] },
        carNumber: { type: Type.STRING },
        dateIssued: { type: Type.STRING },
        issuedTo: { type: Type.STRING },
        nonConformanceReference: { type: Type.STRING },
        description: { type: Type.STRING },
        requiredAction: { type: Type.STRING },
        deadline: { type: Type.STRING },
    },
    required: ["resultType", "carNumber", "dateIssued", "issuedTo", "nonConformanceReference", "description", "requiredAction", "deadline"]
};

/**
 * Creates a Corrective Action Request.
 */
export const create = async (prompt: string, user: User, dashboardData: DashboardData): Promise<CorrectiveActionRequest> => {
    console.log(`[CorrectiveActionRequestAgent] Creating CAR for: "${prompt}"`);
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `User Request: "${prompt}". Your response MUST include "resultType": "CORRECTIVE_ACTION_REQUEST".`,
            config: {
                systemInstruction,
                responseMimeType: 'application/json',
                responseSchema: reportSchema,
            }
        });
        const text = response.text;
        if (!text) throw new Error("Received an empty response from the AI.");
        const result: CorrectiveActionRequest = JSON.parse(text.trim());
        console.log("[CorrectiveActionRequestAgent] Successfully generated CAR:", result);
        return result;
    } catch (error) {
        console.error("[CorrectiveActionRequestAgent] Error generating CAR:", error);
        throw new Error("The AI failed to generate the Corrective Action Request.");
    }
};
