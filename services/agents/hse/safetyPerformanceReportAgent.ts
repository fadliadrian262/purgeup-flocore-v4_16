import { Type } from "@google/genai";
import { ai } from "../index";
import { SafetyPerformanceReport, User, DashboardData } from '../../../types';

const systemInstruction = `You are a Data Analyst AI specializing in safety performance metrics. Your task is to generate a Safety Performance Report.

Your entire response MUST be in the specified JSON schema. Do not add any conversational text.

Key instructions:
1.  **reportingPeriod**: Define the period, e.g., "Month of July 2024".
2.  **kpis**: Generate several relevant Key Performance Indicators (KPIs). Provide a plausible value and target for each. Examples: 'Lost Time Injury Frequency Rate (LTIFR)', 'Total Recordable Incident Rate (TRIR)', 'Safety Observations Submitted'.
3.  **incidentSummary**: Provide a brief summary of incident trends for the period.
4.  **leadingIndicators**: List positive, forward-looking safety activities, such as 'Increased participation in toolbox talks'.`;

const reportSchema = {
    type: Type.OBJECT,
    properties: {
        resultType: { type: Type.STRING, enum: ['SAFETY_PERFORMANCE_REPORT'] },
        reportingPeriod: { type: Type.STRING },
        kpis: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    metric: { type: Type.STRING },
                    value: { type: Type.STRING },
                    target: { type: Type.STRING },
                },
                required: ['metric', 'value', 'target']
            }
        },
        incidentSummary: { type: Type.STRING },
        leadingIndicators: { type: Type.ARRAY, items: { type: Type.STRING } },
    },
    required: ["resultType", "reportingPeriod", "kpis", "incidentSummary", "leadingIndicators"]
};

/**
 * Creates a Safety Performance Report.
 */
export const create = async (prompt: string, user: User, dashboardData: DashboardData): Promise<SafetyPerformanceReport> => {
    console.log(`[SafetyPerformanceReportAgent] Creating report for: "${prompt}"`);
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `User Request: "${prompt}". Your response MUST include "resultType": "SAFETY_PERFORMANCE_REPORT".`,
            config: {
                systemInstruction,
                responseMimeType: 'application/json',
                responseSchema: reportSchema,
            }
        });
        const text = response.text;
        if (!text) throw new Error("Received an empty response from the AI.");
        const result: SafetyPerformanceReport = JSON.parse(text.trim());
        console.log("[SafetyPerformanceReportAgent] Successfully generated report:", result);
        return result;
    } catch (error) {
        console.error("[SafetyPerformanceReportAgent] Error generating report:", error);
        throw new Error("The AI failed to generate the Safety Performance Report.");
    }
};