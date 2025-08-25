import { Type } from "@google/genai";
import { ai } from "../index";
import { NonConformanceReport, User, DashboardData } from '../../../types';

const systemInstruction = `You are a Quality Assurance Manager AI. Your task is to generate a formal Non-Conformance Report (NCR) based on the principles of ISO 9001.

Your entire response MUST be in the specified JSON schema. Do not add any conversational text.

Key instructions:
1.  **standardReference**: You MUST specify 'ISO 9001 Principles'.
2.  **reportDate**: Use today's date.
3.  **issueDescription**: Clearly and objectively describe the non-conformance based on the user's prompt.
4.  **rootCause**: Analyze the description and provide a plausible root cause for the issue.
5.  **correctiveActionProposed**: Suggest a clear, actionable step to fix the immediate problem.
6.  **actionTaken**: If the user mentions an action has already been taken, record it here. Otherwise, state "To be determined".
7.  **verificationOfEffectiveness**: State a method to verify the fix works, e.g., "Re-inspection after 24 hours".`;

const reportSchema = {
    type: Type.OBJECT,
    properties: {
        resultType: { type: Type.STRING, enum: ['NON_CONFORMANCE_REPORT'] },
        standardReference: { type: Type.STRING, enum: ['ISO 9001 Principles'] },
        reportDate: { type: Type.STRING },
        issueDescription: { type: Type.STRING },
        rootCause: { type: Type.STRING },
        correctiveActionProposed: { type: Type.STRING },
        actionTaken: { type: Type.STRING },
        verificationOfEffectiveness: { type: Type.STRING },
    },
    required: ["resultType", "standardReference", "reportDate", "issueDescription", "rootCause", "correctiveActionProposed", "actionTaken", "verificationOfEffectiveness"]
};

/**
 * Creates a Non-Conformance Report.
 */
export const create = async (prompt: string, user: User, dashboardData: DashboardData): Promise<NonConformanceReport> => {
    console.log(`[NonConformanceReportAgent] Creating NCR for: "${prompt}"`);

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `User Request: "${prompt}". \n\n Your response MUST include "resultType": "NON_CONFORMANCE_REPORT".`,
            config: {
                systemInstruction,
                responseMimeType: 'application/json',
                responseSchema: reportSchema,
            }
        });

        const text = response.text;
        if (!text) {
            throw new Error("Received an empty response from the AI for the Non-Conformance Report.");
        }

        const jsonText = text.trim();
        const result: NonConformanceReport = JSON.parse(jsonText);
        console.log("[NonConformanceReportAgent] Successfully generated NCR:", result);
        return result;

    } catch (error) {
        console.error("[NonConformanceReportAgent] Error generating NCR:", error);
        throw new Error("The AI failed to generate the Non-Conformance Report.");
    }
};