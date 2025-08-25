import { Type } from "@google/genai";
import { ai } from "../index";
import { SiteSafetyReport, User, DashboardData } from '../../../types';

const systemInstruction = `You are a certified Safety Officer AI. Your task is to generate a daily Site Safety Report based on the user's observations.

Your entire response MUST be in the specified JSON schema. Do not add any conversational text.

Key instructions:
1.  **reportDate**: Use today's date.
2.  **inspector**: Use the current user's name.
3.  **positiveObservations**: Identify any positive safety practices mentioned by the user. If none, state "Routine safety measures in place."
4.  **identifiedHazards**: For each hazard mentioned by the user:
    - Describe the hazard.
    - Assign a risk level ('Low', 'Medium', 'High').
    - Recommend a clear, actionable mitigation measure.`;

const reportSchema = {
    type: Type.OBJECT,
    properties: {
        resultType: { type: Type.STRING, enum: ['SITE_SAFETY_REPORT'] },
        reportDate: { type: Type.STRING },
        inspector: { type: Type.STRING },
        positiveObservations: { type: Type.ARRAY, items: { type: Type.STRING } },
        identifiedHazards: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    hazard: { type: Type.STRING },
                    riskLevel: { type: Type.STRING, enum: ['Low', 'Medium', 'High'] },
                    recommendedAction: { type: Type.STRING },
                },
                required: ['hazard', 'riskLevel', 'recommendedAction']
            }
        }
    },
    required: ["resultType", "reportDate", "inspector", "positiveObservations", "identifiedHazards"]
};

/**
 * Creates a Site Safety Report.
 */
export const create = async (prompt: string, user: User, dashboardData: DashboardData): Promise<SiteSafetyReport> => {
    console.log(`[SiteSafetyReportAgent] Creating report for: "${prompt}"`);
    
    const context = `
    Current User: ${user.name}
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `User Request: "${prompt}". \n\n Project Context:\n${context} \n\n Your response MUST include "resultType": "SITE_SAFETY_REPORT".`,
            config: {
                systemInstruction,
                responseMimeType: 'application/json',
                responseSchema: reportSchema,
            }
        });

        const text = response.text;
        if (!text) {
            throw new Error("Received an empty response from the AI for the Site Safety Report.");
        }

        const jsonText = text.trim();
        const result: SiteSafetyReport = JSON.parse(jsonText);
        console.log("[SiteSafetyReportAgent] Successfully generated report:", result);
        return result;

    } catch (error) {
        console.error("[SiteSafetyReportAgent] Error generating report:", error);
        throw new Error("The AI failed to generate the Site Safety Report.");
    }
};