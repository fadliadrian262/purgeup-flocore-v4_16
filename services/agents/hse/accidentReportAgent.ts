import { Type } from "@google/genai";
import { ai } from "../index";
import { HseAccidentReport, User, DashboardData } from '../../../types';

const systemInstruction = `You are an expert in incident investigation and reporting, adhering to OSHA 301 standards for construction site safety. Your task is to generate a formal Accident/Incident Report based on the user's description.

Your entire response MUST be in the specified JSON schema. Do not add any conversational text.

Key instructions:
1.  **standardReference**: You MUST specify 'OSHA 301 Format'.
2.  **dateOfIncident, timeOfIncident, location**: Extract these details from the user's prompt. If not provided, use today's date and note that the time/location were not specified.
3.  **personnelInvolved, witnesses**: Extract names from the prompt.
4.  **description**: Summarize the user's account of what happened.
5.  **rootCauseAnalysis**: Based on the description, provide a plausible root cause analysis.
6.  **correctiveActions**: Propose logical corrective actions to prevent recurrence.`;

const reportSchema = {
    type: Type.OBJECT,
    properties: {
        resultType: { type: Type.STRING, enum: ['HSE_ACCIDENT_REPORT'] },
        standardReference: { type: Type.STRING, enum: ['OSHA 301 Format'] },
        dateOfIncident: { type: Type.STRING },
        timeOfIncident: { type: Type.STRING },
        location: { type: Type.STRING },
        personnelInvolved: { type: Type.ARRAY, items: { type: Type.STRING } },
        description: { type: Type.STRING },
        rootCauseAnalysis: { type: Type.STRING },
        correctiveActions: { type: Type.ARRAY, items: { type: Type.STRING } },
        witnesses: { type: Type.ARRAY, items: { type: Type.STRING } },
    },
    required: ["resultType", "standardReference", "dateOfIncident", "timeOfIncident", "location", "personnelInvolved", "description", "rootCauseAnalysis", "correctiveActions", "witnesses"]
};

/**
 * Creates an Accident Report.
 */
export const create = async (prompt: string, user: User, dashboardData: DashboardData): Promise<HseAccidentReport> => {
    console.log(`[AccidentReportAgent] Creating report for: "${prompt}"`);

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `User Request: "${prompt}". \n\n Your response MUST include "resultType": "HSE_ACCIDENT_REPORT".`,
            config: {
                systemInstruction,
                responseMimeType: 'application/json',
                responseSchema: reportSchema,
            }
        });

        const text = response.text;
        if (!text) {
            throw new Error("Received an empty response from the AI for the Accident Report.");
        }

        const jsonText = text.trim();
        const result: HseAccidentReport = JSON.parse(jsonText);
        console.log("[AccidentReportAgent] Successfully generated report:", result);
        return result;

    } catch (error) {
        console.error("[AccidentReportAgent] Error generating report:", error);
        throw new Error("The AI failed to generate the Accident Report.");
    }
};