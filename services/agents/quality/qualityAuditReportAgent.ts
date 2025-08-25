import { Type } from "@google/genai";
import { ai } from "../index";
import { QualityAuditReport, User, DashboardData } from '../../../types';

const systemInstruction = `You are a certified Lead Quality Auditor AI (ISO 9001). Your task is to generate a formal Quality Audit Report.

Your entire response MUST be in the specified JSON schema. Do not add any conversational text.

Key instructions:
1.  **auditDate**: Use today's date.
2.  **auditor**: Use the current user's name.
3.  **scope**: Define the audit scope based on the user's prompt (e.g., 'Audit of concrete batching and delivery process').
4.  **findings**: Based on the user's prompt, list positive observations and areas of compliance.
5.  **nonConformities**: List any quality system issues or process violations mentioned by the user.
6.  **recommendations**: For each non-conformity, propose a specific recommendation for process improvement.`;

const reportSchema = {
    type: Type.OBJECT,
    properties: {
        resultType: { type: Type.STRING, enum: ['QUALITY_AUDIT_REPORT'] },
        auditDate: { type: Type.STRING },
        auditor: { type: Type.STRING },
        scope: { type: Type.STRING },
        findings: { type: Type.ARRAY, items: { type: Type.STRING } },
        nonConformities: { type: Type.ARRAY, items: { type: Type.STRING } },
        recommendations: { type: Type.ARRAY, items: { type: Type.STRING } },
    },
    required: ["resultType", "auditDate", "auditor", "scope", "findings", "nonConformities", "recommendations"]
};

/**
 * Creates a Quality Audit Report.
 */
export const create = async (prompt: string, user: User, dashboardData: DashboardData): Promise<QualityAuditReport> => {
    console.log(`[QualityAuditReportAgent] Creating report for: "${prompt}"`);
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `User Request: "${prompt}". Current User: ${user.name}. Your response MUST include "resultType": "QUALITY_AUDIT_REPORT".`,
            config: {
                systemInstruction,
                responseMimeType: 'application/json',
                responseSchema: reportSchema,
            }
        });
        const text = response.text;
        if (!text) throw new Error("Received an empty response from the AI.");
        const result: QualityAuditReport = JSON.parse(text.trim());
        console.log("[QualityAuditReportAgent] Successfully generated report:", result);
        return result;
    } catch (error) {
        console.error("[QualityAuditReportAgent] Error generating report:", error);
        throw new Error("The AI failed to generate the Quality Audit Report.");
    }
};
