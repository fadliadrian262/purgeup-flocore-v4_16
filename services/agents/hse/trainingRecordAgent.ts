import { Type } from "@google/genai";
import { ai } from "../index";
import { TrainingRecord, User, DashboardData } from '../../../types';

const systemInstruction = `You are an administrative AI for a training coordinator. Your task is to generate a formal Training Record.

Your entire response MUST be in the specified JSON schema. Do not add any conversational text.

Key instructions:
1.  **courseTitle**: Extract the title of the training from the prompt (e.g., 'Working at Height Certification').
2.  **trainer**: Extract the trainer's name or use the current user's name if not specified.
3.  **date**: Use today's date.
4.  **attendees**: Extract the names of all attendees from the user's prompt. For the 'signature' field, always set it to 'false' as this will be handled physically or digitally later.`;

const reportSchema = {
    type: Type.OBJECT,
    properties: {
        resultType: { type: Type.STRING, enum: ['TRAINING_RECORD'] },
        courseTitle: { type: Type.STRING },
        trainer: { type: Type.STRING },
        date: { type: Type.STRING },
        attendees: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    name: { type: Type.STRING },
                    signature: { type: Type.BOOLEAN },
                },
                required: ['name', 'signature']
            }
        }
    },
    required: ["resultType", "courseTitle", "trainer", "date", "attendees"]
};

/**
 * Creates a Training Record.
 */
export const create = async (prompt: string, user: User, dashboardData: DashboardData): Promise<TrainingRecord> => {
    console.log(`[TrainingRecordAgent] Creating record for: "${prompt}"`);
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `User Request: "${prompt}". Current User: ${user.name}. Your response MUST include "resultType": "TRAINING_RECORD".`,
            config: {
                systemInstruction,
                responseMimeType: 'application/json',
                responseSchema: reportSchema,
            }
        });
        const text = response.text;
        if (!text) throw new Error("Received an empty response from the AI.");
        const result: TrainingRecord = JSON.parse(text.trim());
        console.log("[TrainingRecordAgent] Successfully generated record:", result);
        return result;
    } catch (error) {
        console.error("[TrainingRecordAgent] Error generating record:", error);
        throw new Error("The AI failed to generate the Training Record.");
    }
};