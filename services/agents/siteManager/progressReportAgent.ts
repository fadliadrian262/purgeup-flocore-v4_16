import { Type } from "@google/genai";
import { ai } from "../index";
import { ProgressReport, User, DashboardData } from '../../../types';

const systemInstruction = `You are an expert Project Controls specialist AI. Your task is to generate a formal Progress Report that aligns with the principles of the CIOB Code of Practice and PMBOK.

Your entire response MUST be in the specified JSON schema. Do not add any conversational text.

Key instructions:
1.  **reportingPeriod**: Define the period, e.g., "Week of July 22-26, 2024".
2.  **executiveSummary**: Provide a high-level summary of project status.
3.  **progressAgainstSchedule**: Analyze alerts and project data to comment on schedule adherence. State if the project is 'On Track', 'Ahead of Schedule', or 'Behind Schedule'.
4.  **costPerformance**: Comment on budget status. Assume 'On Target' unless alerts indicate otherwise.
5.  **risksAndIssues**: Extract any items from the alerts with 'WARNING' or 'CRITICAL' urgency.
6.  **lookAhead**: Summarize the key activities planned for the next reporting period.`;

const reportSchema = {
    type: Type.OBJECT,
    properties: {
        resultType: { type: Type.STRING, enum: ['PROGRESS_REPORT'] },
        reportingPeriod: { type: Type.STRING },
        executiveSummary: { type: Type.STRING },
        progressAgainstSchedule: { type: Type.STRING },
        costPerformance: { type: Type.STRING },
        risksAndIssues: { type: Type.ARRAY, items: { type: Type.STRING } },
        lookAhead: { type: Type.STRING },
    },
    required: ["resultType", "reportingPeriod", "executiveSummary", "progressAgainstSchedule", "costPerformance", "risksAndIssues", "lookAhead"]
};

/**
 * Creates a Progress Report.
 */
export const create = async (prompt: string, user: User, dashboardData: DashboardData): Promise<ProgressReport> => {
    console.log(`[ProgressReportAgent] Creating report for: "${prompt}"`);

    const context = `
    Project Data:
    - Progress Completion: ${dashboardData.progress.completion}%
    - Safety Score: ${dashboardData.progress.safetyScore}
    - Alerts:
    ${dashboardData.alerts.map(a => `  - [${a.urgency}] ${a.title}: ${a.message}`).join('\n')}
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `User Request: "${prompt}". \n\n Project Context:\n${context} \n\n Your response MUST include "resultType": "PROGRESS_REPORT".`,
            config: {
                systemInstruction,
                responseMimeType: 'application/json',
                responseSchema: reportSchema,
            }
        });

        const text = response.text;
        if (!text) {
            throw new Error("Received an empty response from the AI for the Progress Report.");
        }

        const jsonText = text.trim();
        const result: ProgressReport = JSON.parse(jsonText);
        console.log("[ProgressReportAgent] Successfully generated report:", result);
        return result;

    } catch (error) {
        console.error("[ProgressReportAgent] Error generating report:", error);
        throw new Error("The AI failed to generate the Progress Report.");
    }
};