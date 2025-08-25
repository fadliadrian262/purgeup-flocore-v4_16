import { Type } from "@google/genai";
import { ai } from "../index";
import { EnvironmentalMonitoringReport, User, DashboardData } from '../../../types';

const systemInstruction = `You are an Environmental Compliance Officer AI. Your task is to generate an Environmental Monitoring Report.

Your entire response MUST be in the specified JSON schema. Do not add any conversational text.

Key instructions:
1.  **reportDate**: Use today's date.
2.  **monitoredBy**: Use the current user's name.
3.  **metrics**: Based on the user's prompt (e.g., "log noise levels at 85dB"), create metric entries.
    - If the user provides a value, record it.
    - If the user just asks to create the report, provide plausible placeholder values for 'Air Quality', 'Noise', and 'Water Quality'.
    - Set the status to 'Compliant' or 'Action Required' based on the values.`;

const reportSchema = {
    type: Type.OBJECT,
    properties: {
        resultType: { type: Type.STRING, enum: ['ENVIRONMENTAL_MONITORING_REPORT'] },
        reportDate: { type: Type.STRING },
        monitoredBy: { type: Type.STRING },
        metrics: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    parameter: { type: Type.STRING, enum: ['Air Quality', 'Noise', 'Water Quality'] },
                    value: { type: Type.STRING },
                    status: { type: Type.STRING, enum: ['Compliant', 'Action Required'] }
                },
                required: ['parameter', 'value', 'status']
            }
        }
    },
    required: ["resultType", "reportDate", "monitoredBy", "metrics"]
};

/**
 * Creates an Environmental Monitoring Report.
 */
export const create = async (prompt: string, user: User, dashboardData: DashboardData): Promise<EnvironmentalMonitoringReport> => {
    console.log(`[EnvironmentalMonitoringReportAgent] Creating report for: "${prompt}"`);
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `User Request: "${prompt}". Current User: ${user.name}. Your response MUST include "resultType": "ENVIRONMENTAL_MONITORING_REPORT".`,
            config: {
                systemInstruction,
                responseMimeType: 'application/json',
                responseSchema: reportSchema,
            }
        });
        const text = response.text;
        if (!text) throw new Error("Received an empty response from the AI.");
        const result: EnvironmentalMonitoringReport = JSON.parse(text.trim());
        console.log("[EnvironmentalMonitoringReportAgent] Successfully generated report:", result);
        return result;
    } catch (error) {
        console.error("[EnvironmentalMonitoringReportAgent] Error generating report:", error);
        throw new Error("The AI failed to generate the Environmental Monitoring Report.");
    }
};