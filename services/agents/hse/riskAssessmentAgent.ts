import { Type } from "@google/genai";
import { ai } from "../index";
import { RiskAssessment, User, DashboardData } from '../../../types';

const systemInstruction = `You are a Senior HSE Officer AI. Your task is to generate a formal Risk Assessment for a specific construction activity.

Your entire response MUST be in the specified JSON schema. Do not add any conversational text.

Key instructions:
1.  **activity**: Extract the specific activity from the user's prompt (e.g., 'Operating a mobile crane').
2.  **assessmentDate**: Use today's date.
3.  **assessor**: Use the current user's name.
4.  **risks**: Generate a list of at least 3-4 plausible risks associated with the activity. For each risk:
    - Identify the specific **hazard**.
    - Describe the potential **risk**.
    - Assign a **likelihood** (1-5) and **severity** (1-5).
    - Calculate the **riskRating** (likelihood * severity).
    - Propose a clear **mitigation** measure.`;

const reportSchema = {
    type: Type.OBJECT,
    properties: {
        resultType: { type: Type.STRING, enum: ['RISK_ASSESSMENT'] },
        activity: { type: Type.STRING },
        assessmentDate: { type: Type.STRING },
        assessor: { type: Type.STRING },
        risks: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    hazard: { type: Type.STRING },
                    risk: { type: Type.STRING },
                    likelihood: { type: Type.NUMBER },
                    severity: { type: Type.NUMBER },
                    riskRating: { type: Type.NUMBER },
                    mitigation: { type: Type.STRING },
                },
                required: ['hazard', 'risk', 'likelihood', 'severity', 'riskRating', 'mitigation']
            }
        }
    },
    required: ["resultType", "activity", "assessmentDate", "assessor", "risks"]
};

/**
 * Creates a Risk Assessment.
 */
export const create = async (prompt: string, user: User, dashboardData: DashboardData): Promise<RiskAssessment> => {
    console.log(`[RiskAssessmentAgent] Creating RA for: "${prompt}"`);
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `User Request: "${prompt}". Current User: ${user.name}. Your response MUST include "resultType": "RISK_ASSESSMENT".`,
            config: {
                systemInstruction,
                responseMimeType: 'application/json',
                responseSchema: reportSchema,
            }
        });
        const text = response.text;
        if (!text) throw new Error("Received an empty response from the AI.");
        const result: RiskAssessment = JSON.parse(text.trim());
        console.log("[RiskAssessmentAgent] Successfully generated RA:", result);
        return result;
    } catch (error) {
        console.error("[RiskAssessmentAgent] Error generating RA:", error);
        throw new Error("The AI failed to generate the Risk Assessment.");
    }
};