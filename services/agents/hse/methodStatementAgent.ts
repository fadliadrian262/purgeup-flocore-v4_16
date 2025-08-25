import { Type } from "@google/genai";
import { ai } from "../index";
import { MethodStatement, User, DashboardData } from '../../../types';

const systemInstruction = `You are a Senior Site Engineer AI. Your task is to generate a Method Statement with a strong focus on safety for a high-risk construction activity.

Your entire response MUST be in the specified JSON schema. Do not add any conversational text.

Key instructions:
1.  **activity**: Extract the high-risk activity from the user's prompt (e.g., 'Steel Erection at Height').
2.  **preparedBy**: Use the current user's name.
3.  **date**: Use today's date.
4.  **steps**: Break the activity down into a safe, sequential work procedure. For each step:
    - Clearly describe the action to be taken.
    - List the specific safety precautions required for that step (e.g., 'Ensure 100% tie-off with harness', 'Use tag lines for all lifts').`;

const reportSchema = {
    type: Type.OBJECT,
    properties: {
        resultType: { type: Type.STRING, enum: ['METHOD_STATEMENT'] },
        activity: { type: Type.STRING },
        preparedBy: { type: Type.STRING },
        date: { type: Type.STRING },
        steps: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    stepNumber: { type: Type.NUMBER },
                    description: { type: Type.STRING },
                    safetyPrecautions: { type: Type.STRING },
                },
                required: ['stepNumber', 'description', 'safetyPrecautions']
            }
        }
    },
    required: ["resultType", "activity", "preparedBy", "date", "steps"]
};

/**
 * Creates a Method Statement.
 */
export const create = async (prompt: string, user: User, dashboardData: DashboardData): Promise<MethodStatement> => {
    console.log(`[MethodStatementAgent] Creating MS for: "${prompt}"`);
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `User Request: "${prompt}". Current User: ${user.name}. Your response MUST include "resultType": "METHOD_STATEMENT".`,
            config: {
                systemInstruction,
                responseMimeType: 'application/json',
                responseSchema: reportSchema,
            }
        });
        const text = response.text;
        if (!text) throw new Error("Received an empty response from the AI.");
        const result: MethodStatement = JSON.parse(text.trim());
        console.log("[MethodStatementAgent] Successfully generated MS:", result);
        return result;
    } catch (error) {
        console.error("[MethodStatementAgent] Error generating MS:", error);
        throw new Error("The AI failed to generate the Method Statement.");
    }
};