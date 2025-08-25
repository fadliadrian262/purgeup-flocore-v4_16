import { Type } from "@google/genai";
import { ai } from "../index";
import { QualityPerformanceMetrics, User, DashboardData } from '../../../types';

const systemInstruction = `You are a Data Analyst AI specializing in quality performance metrics. Your task is to generate a Quality Performance Metrics Report.

Your entire response MUST be in the specified JSON schema. Do not add any conversational text.

Key instructions:
1.  **reportingPeriod**: Define the period, e.g., "Month of July 2024".
2.  **kpis**: Generate several relevant Key Performance Indicators (KPIs) for quality. Provide a plausible value, target, and trend for each. Examples: 'First-Time-Right (FTR) Rate', 'Number of Open NCRs', 'Rework Cost as % of Total Cost'.
3.  **summary**: Provide a brief summary of quality performance trends for the period.`;

const reportSchema = {
    type: Type.OBJECT,
    properties: {
        resultType: { type: Type.STRING, enum: ['QUALITY_PERFORMANCE_METRICS'] },
        reportingPeriod: { type: Type.STRING },
        kpis: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    metric: { type: Type.STRING },
                    value: { type: Type.STRING },
                    target: { type: Type.STRING },
                    trend: { type: Type.STRING, enum: ['Improving', 'Stable', 'Declining'] },
                },
                required: ['metric', 'value', 'target', 'trend']
            }
        },
        summary: { type: Type.STRING },
    },
    required: ["resultType", "reportingPeriod", "kpis", "summary"]
};

/**
 * Creates a Quality Performance Metrics report.
 */
export const create = async (prompt: string, user: User, dashboardData: DashboardData): Promise<QualityPerformanceMetrics> => {
    console.log(`[QualityPerformanceMetricsAgent] Creating report for: "${prompt}"`);
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `User Request: "${prompt}". Your response MUST include "resultType": "QUALITY_PERFORMANCE_METRICS".`,
            config: {
                systemInstruction,
                responseMimeType: 'application/json',
                responseSchema: reportSchema,
            }
        });
        const text = response.text;
        if (!text) throw new Error("Received an empty response from the AI.");
        const result: QualityPerformanceMetrics = JSON.parse(text.trim());
        console.log("[QualityPerformanceMetricsAgent] Successfully generated report:", result);
        return result;
    } catch (error) {
        console.error("[QualityPerformanceMetricsAgent] Error generating report:", error);
        throw new Error("The AI failed to generate the Quality Performance Metrics report.");
    }
};
