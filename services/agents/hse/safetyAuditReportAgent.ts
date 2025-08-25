import { Type } from "@google/genai";
import { ai } from "../index";
import { SafetyAuditReport, User, DashboardData } from '../../../types';

const systemInstruction = `You are a certified Lead Safety Auditor AI. Your task is to generate a formal Safety Audit Report.

Your entire response MUST be in the specified JSON schema. Do not add any conversational text.

Key instructions:
1.  **auditDate**: Use today's date.
2.  **auditor**: Use the current user's name.
3.  **scope**: Define the scope based on the user's prompt (e.g., 'Weekly site safety inspection of Level 2').
4.  **findings**: Based on the user's prompt, list positive observations and areas of compliance.
5.  **nonConformities**: List any safety issues or violations mentioned by the user.
6.  **recommendations**: For each non-conformity, propose a specific recommendation for improvement.`;

const reportSchema = {
    type: Type.OBJECT,
    properties: {
        resultType: { type: Type.STRING, enum: ['SAFETY_AUDIT_REPORT'] },
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
 * Creates a Safety Audit Report.
 */
export const create = async (prompt: string, user: User, dashboardData: DashboardData): Promise<SafetyAuditReport> => {
    console.log(`[SafetyAuditReportAgent] Creating report for: "${prompt}"`);
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `User Request: "${prompt}". Current User: ${user.name}. Your response MUST include "resultType": "SAFETY_AUDIT_REPORT".`,
            config: {
                systemInstruction,
                responseMimeType: 'application/json',
                responseSchema: reportSchema,
            }
        });
        const text = response.text;
        if (!text) throw new Error("Received an empty response from the AI.");
        const result: SafetyAuditReport = JSON.parse(text.trim());
        console.log("[SafetyAuditReportAgent] Successfully generated report:", result);
        return result;
    } catch (error) {
        console.error("[SafetyAuditReportAgent] Error generating report:", error);
        throw new Error("The AI failed to generate the Safety Audit Report.");
    }
};