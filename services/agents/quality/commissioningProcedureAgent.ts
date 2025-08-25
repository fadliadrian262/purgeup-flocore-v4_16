import { Type } from "@google/genai";
import { ai } from "../index";
import { CommissioningProcedure, User, DashboardData } from '../../../types';

const systemInstruction = `You are a Commissioning Manager AI. Your task is to generate a formal Commissioning Procedure for a building system.

Your entire response MUST be in the specified JSON schema. Do not add any conversational text.

Key instructions:
1.  **systemName**: Extract the name of the system to be commissioned from the prompt (e.g., 'HVAC System - AHU-01').
2.  **procedureNumber**: Generate a plausible procedure number (e.g., 'COM-HVAC-001').
3.  **steps**: Generate a logical sequence of commissioning steps. For each step:
    - Provide a clear description of the action.
    - State the expected result or acceptance criterion.
    - Specify the record to be completed (e.g., 'Form C-1', 'Test Sheet #3').`;

const reportSchema = {
    type: Type.OBJECT,
    properties: {
        resultType: { type: Type.STRING, enum: ['COMMISSIONING_PROCEDURE'] },
        systemName: { type: Type.STRING },
        procedureNumber: { type: Type.STRING },
        steps: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    stepNumber: { type: Type.NUMBER },
                    description: { type: Type.STRING },
                    expectedResult: { type: Type.STRING },
                    record: { type: Type.STRING },
                },
                required: ['stepNumber', 'description', 'expectedResult', 'record']
            }
        }
    },
    required: ["resultType", "systemName", "procedureNumber", "steps"]
};

/**
 * Creates a Commissioning Procedure.
 */
export const create = async (prompt: string, user: User, dashboardData: DashboardData): Promise<CommissioningProcedure> => {
    console.log(`[CommissioningProcedureAgent] Creating procedure for: "${prompt}"`);
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `User Request: "${prompt}". Your response MUST include "resultType": "COMMISSIONING_PROCEDURE".`,
            config: {
                systemInstruction,
                responseMimeType: 'application/json',
                responseSchema: reportSchema,
            }
        });
        const text = response.text;
        if (!text) throw new Error("Received an empty response from the AI.");
        const result: CommissioningProcedure = JSON.parse(text.trim());
        console.log("[CommissioningProcedureAgent] Successfully generated procedure:", result);
        return result;
    } catch (error) {
        console.error("[CommissioningProcedureAgent] Error generating procedure:", error);
        throw new Error("The AI failed to generate the Commissioning Procedure.");
    }
};
