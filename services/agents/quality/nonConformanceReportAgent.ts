import { Type } from "@google/genai";
import { ai } from "../index";
import { NonConformanceReportQC, User, DashboardData } from '../../../types';

const systemInstruction = `You are a senior Quality Assurance Manager AI. Your task is to generate a formal Non-Conformance Report (NCR) based on the principles of ISO 9001. This is a detailed quality report, distinct from a general site incident report.

Your entire response MUST be in the specified JSON schema. Do not add any conversational text.

Key instructions:
1.  **standardReference**: You MUST specify 'ISO 9001 Principles'.
2.  **ncrNumber**: Generate a plausible, sequential NCR number (e.g., 'NCR-2024-015').
3.  **dateIssued**: Use today's date.
4.  **description**: Clearly and objectively describe the non-conformance based on the user's prompt.
5.  **specClauseViolated**: Infer or request the specific drawing or specification clause that was violated.
6.  **rootCauseAnalysis**: Provide a plausible technical root cause for the issue.
7.  **correctiveAction**: Suggest a clear, actionable step to fix the immediate problem.
8.  **preventiveAction**: Suggest a systemic action to prevent recurrence.
9.  **disposition**: Recommend a disposition for the non-conforming work: 'Rework', 'Use As-Is', or 'Scrap'.`;

const reportSchema = {
    type: Type.OBJECT,
    properties: {
        resultType: { type: Type.STRING, enum: ['NON_CONFORMANCE_REPORT_QC'] },
        standardReference: { type: Type.STRING, enum: ['ISO 9001 Principles'] },
        ncrNumber: { type: Type.STRING },
        dateIssued: { type: Type.STRING },
        description: { type: Type.STRING },
        specClauseViolated: { type: Type.STRING },
        rootCauseAnalysis: { type: Type.STRING },
        correctiveAction: { type: Type.STRING },
        preventiveAction: { type: Type.STRING },
        disposition: { type: Type.STRING, enum: ['Rework', 'Use As-Is', 'Scrap'] },
    },
    required: ["resultType", "standardReference", "ncrNumber", "dateIssued", "description", "specClauseViolated", "rootCauseAnalysis", "correctiveAction", "preventiveAction", "disposition"]
};

/**
 * Creates a QC Non-Conformance Report.
 */
export const create = async (prompt: string, user: User, dashboardData: DashboardData): Promise<NonConformanceReportQC> => {
    console.log(`[QcNcrAgent] Creating NCR for: "${prompt}"`);
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `User Request: "${prompt}". Your response MUST include "resultType": "NON_CONFORMANCE_REPORT_QC".`,
            config: {
                systemInstruction,
                responseMimeType: 'application/json',
                responseSchema: reportSchema,
            }
        });
        const text = response.text;
        if (!text) throw new Error("Received an empty response from the AI.");
        const result: NonConformanceReportQC = JSON.parse(text.trim());
        console.log("[QcNcrAgent] Successfully generated NCR:", result);
        return result;
    } catch (error) {
        console.error("[QcNcrAgent] Error generating NCR:", error);
        throw new Error("The AI failed to generate the Non-Conformance Report.");
    }
};
