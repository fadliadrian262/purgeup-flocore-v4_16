import { Type } from "@google/genai";
import { ai } from "../index";
import { EquipmentUsageLog, User, DashboardData } from '../../../types';

const systemInstruction = `You are FLOCORE, an AI assistant for construction site managers. Your task is to generate an Equipment Usage Log.

You will be given the current project data. Your entire response MUST be in the specified JSON schema. Do not add any conversational text.

Key instructions:
1.  **logDate**: Use today's date in a readable format (e.g., 'July 26, 2024').
2.  **logs**: Analyze the user prompt and the provided 'equipment' status from the project data.
    - If the user specifies hours (e.g., "log 8 hours for the excavator"), use that.
    - If the user doesn't specify hours but equipment is 'Operational', assume a standard 8-hour workday.
    - Infer the operator's name if mentioned in the prompt or use a placeholder like 'Assigned Operator'.
    - Populate the logs array with an entry for each piece of equipment mentioned or inferred.`;

const reportSchema = {
    type: Type.OBJECT,
    properties: {
        resultType: { type: Type.STRING, enum: ['EQUIPMENT_USAGE_LOG'] },
        logDate: { type: Type.STRING },
        logs: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    equipment: { type: Type.STRING },
                    operator: { type: Type.STRING },
                    hoursUsed: { type: Type.NUMBER },
                    notes: { type: Type.STRING },
                },
                required: ['equipment', 'operator', 'hoursUsed']
            }
        }
    },
    required: ["resultType", "logDate", "logs"]
};

/**
 * Creates an Equipment Usage Log.
 */
export const create = async (prompt: string, user: User, dashboardData: DashboardData): Promise<EquipmentUsageLog> => {
    console.log(`[EquipmentUsageLogAgent] Creating log for: "${prompt}"`);

    const context = `
    Current User: ${user.name}
    Project Data:
    - Equipment Status: ${dashboardData.equipment.map(e => `${e.name}: ${e.status}`).join(', ')}
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `User Request: "${prompt}". \n\n Project Context:\n${context} \n\n Your response MUST include "resultType": "EQUIPMENT_USAGE_LOG".`,
            config: {
                systemInstruction,
                responseMimeType: 'application/json',
                responseSchema: reportSchema,
            }
        });

        const text = response.text;
        if (!text) {
            throw new Error("Received an empty response from the AI for the Equipment Usage Log.");
        }

        const jsonText = text.trim();
        const result: EquipmentUsageLog = JSON.parse(jsonText);
        console.log("[EquipmentUsageLogAgent] Successfully generated log:", result);
        return result;

    } catch (error) {
        console.error("[EquipmentUsageLogAgent] Error generating log:", error);
        throw new Error("The AI failed to generate the Equipment Usage Log.");
    }
};