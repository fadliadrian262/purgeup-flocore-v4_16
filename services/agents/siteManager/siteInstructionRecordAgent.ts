import { Type } from "@google/genai";
import { ai } from "../index";
import { SiteInstructionRecord, User, DashboardData } from '../../../types';

const systemInstruction = `You are an AI assistant for a construction Site Manager. Your task is to generate a formal Site Instruction Record.

Your entire response MUST be in the specified JSON schema. Do not add any conversational text.

Key instructions:
1.  **instructionDate**: Use today's date.
2.  **instructionNumber**: Generate a plausible, sequential number (e.g., 'SI-014').
3.  **issuedBy**: Use the current user's name.
4.  **issuedTo**: Extract the recipient from the user's prompt (e.g., 'the electrical subcontractor').
5.  **instructionDetails**: Clearly state the instruction provided by the user in the prompt.`;

const reportSchema = {
    type: Type.OBJECT,
    properties: {
        resultType: { type: Type.STRING, enum: ['SITE_INSTRUCTION_RECORD'] },
        instructionDate: { type: Type.STRING },
        instructionNumber: { type: Type.STRING },
        issuedBy: { type: Type.STRING },
        issuedTo: { type: Type.STRING },
        instructionDetails: { type: Type.STRING },
    },
    required: ["resultType", "instructionDate", "instructionNumber", "issuedBy", "issuedTo", "instructionDetails"]
};

/**
 * Creates a Site Instruction Record.
 */
export const create = async (prompt: string, user: User, dashboardData: DashboardData): Promise<SiteInstructionRecord> => {
    console.log(`[SiteInstructionRecordAgent] Creating record for: "${prompt}"`);

    const context = `
    Current User: ${user.name}
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `User Request: "${prompt}". \n\n Project Context:\n${context} \n\n Your response MUST include "resultType": "SITE_INSTRUCTION_RECORD".`,
            config: {
                systemInstruction,
                responseMimeType: 'application/json',
                responseSchema: reportSchema,
            }
        });

        const text = response.text;
        if (!text) {
            throw new Error("Received an empty response from the AI for the Site Instruction Record.");
        }

        const jsonText = text.trim();
        const result: SiteInstructionRecord = JSON.parse(jsonText);
        console.log("[SiteInstructionRecordAgent] Successfully generated record:", result);
        return result;

    } catch (error) {
        console.error("[SiteInstructionRecordAgent] Error generating record:", error);
        throw new Error("The AI failed to generate the Site Instruction Record.");
    }
};