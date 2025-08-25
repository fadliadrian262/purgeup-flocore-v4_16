import { Type } from "@google/genai";
import { ai } from "../index";
import { QualitySurveillanceReport, User, DashboardData } from '../../../types';

const systemInstruction = `You are a Quality Surveillance Engineer AI. Your task is to generate a Quality Surveillance Report based on your ongoing monitoring of site activities.

Your entire response MUST be in the specified JSON schema. Do not add any conversational text.

Key instructions:
1.  **reportDate**: Use today's date.
2.  **surveyor**: Use the current user's name.
3.  **area**: Extract the area under surveillance from the prompt.
4.  **observations**: Summarize the user's observations into a clear, bulleted list.
5.  **complianceStatus**: Based on the observations, assign a status of 'Compliant', 'Minor Issues', or 'Major Issues'.`;

const reportSchema = {
    type: Type.OBJECT,
    properties: {
        resultType: { type: Type.STRING, enum: ['QUALITY_SURVEILLANCE_REPORT'] },
        reportDate: { type: Type.STRING },
        surveyor: { type: Type.STRING },
        area: { type: Type.STRING },
        observations: { type: Type.ARRAY, items: { type: Type.STRING } },
        complianceStatus: { type: Type.STRING, enum: ['Compliant', 'Minor Issues', 'Major Issues'] },
    },
    required: ["resultType", "reportDate", "surveyor", "area", "observations", "complianceStatus"]
};

/**
 * Creates a Quality Surveillance Report.
 */
export const create = async (prompt: string, user: User, dashboardData: DashboardData): Promise<QualitySurveillanceReport> => {
    console.log(`[QualitySurveillanceReportAgent] Creating report for: "${prompt}"`);
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `User Request: "${prompt}". Current User: ${user.name}. Your response MUST include "resultType": "QUALITY_SURVEILLANCE_REPORT".`,
            config: {
                systemInstruction,
                responseMimeType: 'application/json',
                responseSchema: reportSchema,
            }
        });
        const text = response.text;
        if (!text) throw new Error("Received an empty response from the AI.");
        const result: QualitySurveillanceReport = JSON.parse(text.trim());
        console.log("[QualitySurveillanceReportAgent] Successfully generated report:", result);
        return result;
    } catch (error) {
        console.error("[QualitySurveillanceReportAgent] Error generating report:", error);
        throw new Error("The AI failed to generate the Quality Surveillance Report.");
    }
};
