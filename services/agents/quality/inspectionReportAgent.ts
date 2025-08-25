import { Type } from "@google/genai";
import { ai } from "../index";
import { InspectionReport, User, DashboardData } from '../../../types';

const systemInstruction = `You are a certified Quality Inspector AI. Your task is to generate a formal Inspection Report.

Your entire response MUST be in the specified JSON schema. Do not add any conversational text.

Key instructions:
1.  **reportNumber**: Generate a plausible, sequential number (e.g., 'INSP-2024-112').
2.  **inspectionDate**: Use today's date.
3.  **inspector**: Use the current user's name.
4.  **areaInspected**: Extract the area/work inspected from the prompt.
5.  **findings**: Summarize the user's inspection findings into a clear, bulleted list.
6.  **status**: Based on the findings, assign a status of 'Approved', 'Approved as Noted', or 'Rejected'.`;

const reportSchema = {
    type: Type.OBJECT,
    properties: {
        resultType: { type: Type.STRING, enum: ['INSPECTION_REPORT'] },
        reportNumber: { type: Type.STRING },
        inspectionDate: { type: Type.STRING },
        inspector: { type: Type.STRING },
        areaInspected: { type: Type.STRING },
        findings: { type: Type.ARRAY, items: { type: Type.STRING } },
        status: { type: Type.STRING, enum: ['Approved', 'Approved as Noted', 'Rejected'] },
        photographicEvidencePaths: { type: Type.ARRAY, items: { type: Type.STRING } },
    },
    required: ["resultType", "reportNumber", "inspectionDate", "inspector", "areaInspected", "findings", "status"]
};

/**
 * Creates an Inspection Report.
 */
export const create = async (prompt: string, user: User, dashboardData: DashboardData): Promise<InspectionReport> => {
    console.log(`[InspectionReportAgent] Creating report for: "${prompt}"`);
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `User Request: "${prompt}". Current User: ${user.name}. Your response MUST include "resultType": "INSPECTION_REPORT".`,
            config: {
                systemInstruction,
                responseMimeType: 'application/json',
                responseSchema: reportSchema,
            }
        });
        const text = response.text;
        if (!text) throw new Error("Received an empty response from the AI.");
        const result: InspectionReport = JSON.parse(text.trim());
        console.log("[InspectionReportAgent] Successfully generated report:", result);
        return result;
    } catch (error) {
        console.error("[InspectionReportAgent] Error generating report:", error);
        throw new Error("The AI failed to generate the Inspection Report.");
    }
};
