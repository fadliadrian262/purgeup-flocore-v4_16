import { Type } from "@google/genai";
import { ai } from "../index";
import { JobSafetyAnalysis, User, DashboardData } from '../../../types';

const systemInstruction = `You are a Safety Supervisor AI. Your task is to generate a Job Safety Analysis (JSA) for a specific construction task.

Your entire response MUST be in the specified JSON schema. Do not add any conversational text.

Key instructions:
1.  **task**: Extract the specific task from the user's prompt (e.g., 'Excavation for foundation').
2.  **preparedBy**: Use the current user's name.
3.  **date**: Use today's date.
4.  **steps**: Break the task down into logical steps. For each step:
    - Identify potential hazards associated with it.
    - List specific control measures to mitigate those hazards.
    Generate at least 3-4 steps for a comprehensive JSA.`;

const reportSchema = {
    type: Type.OBJECT,
    properties: {
        resultType: { type: Type.STRING, enum: ['JOB_SAFETY_ANALYSIS'] },
        task: { type: Type.STRING },
        preparedBy: { type: Type.STRING },
        date: { type: Type.STRING },
        steps: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    step: { type: Type.STRING },
                    potentialHazards: { type: Type.ARRAY, items: { type: Type.STRING } },
                    controls: { type: Type.ARRAY, items: { type: Type.STRING } },
                },
                required: ['step', 'potentialHazards', 'controls']
            }
        }
    },
    required: ["resultType", "task", "preparedBy", "date", "steps"]
};

/**
 * Creates a Job Safety Analysis.
 */
export const create = async (prompt: string, user: User, dashboardData: DashboardData): Promise<JobSafetyAnalysis> => {
    console.log(`[JobSafetyAnalysisAgent] Creating JSA for: "${prompt}"`);
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `User Request: "${prompt}". Current User: ${user.name}. Your response MUST include "resultType": "JOB_SAFETY_ANALYSIS".`,
            config: {
                systemInstruction,
                responseMimeType: 'application/json',
                responseSchema: reportSchema,
            }
        });
        const text = response.text;
        if (!text) throw new Error("Received an empty response from the AI.");
        const result: JobSafetyAnalysis = JSON.parse(text.trim());
        console.log("[JobSafetyAnalysisAgent] Successfully generated JSA:", result);
        return result;
    } catch (error) {
        console.error("[JobSafetyAnalysisAgent] Error generating JSA:", error);
        throw new Error("The AI failed to generate the Job Safety Analysis.");
    }
};