import { Type } from "@google/genai";
import { ai } from "../index";
import { HoldPointNotification, User, DashboardData } from '../../../types';

const systemInstruction = `You are a Quality Inspector AI. Your task is to generate a formal Hold Point Notification.

Your entire response MUST be in the specified JSON schema. Do not add any conversational text.

Key instructions:
1.  **notificationDate**: Use today's date.
2.  **holdPointReference**: Extract the ITP reference for the hold point from the prompt (e.g., 'ITP-CONC-05').
3.  **description**: Describe the work that is being held for inspection.
4.  **requiredInspectionDate**: State when the inspection is required.
5.  **issuedBy**: Use the current user's name.`;

const reportSchema = {
    type: Type.OBJECT,
    properties: {
        resultType: { type: Type.STRING, enum: ['HOLD_POINT_NOTIFICATION'] },
        notificationDate: { type: Type.STRING },
        holdPointReference: { type: Type.STRING },
        description: { type: Type.STRING },
        requiredInspectionDate: { type: Type.STRING },
        issuedBy: { type: Type.STRING },
    },
    required: ["resultType", "notificationDate", "holdPointReference", "description", "requiredInspectionDate", "issuedBy"]
};

/**
 * Creates a Hold Point Notification.
 */
export const create = async (prompt: string, user: User, dashboardData: DashboardData): Promise<HoldPointNotification> => {
    console.log(`[HoldPointNotificationAgent] Creating notification for: "${prompt}"`);
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `User Request: "${prompt}". Current User: ${user.name}. Your response MUST include "resultType": "HOLD_POINT_NOTIFICATION".`,
            config: {
                systemInstruction,
                responseMimeType: 'application/json',
                responseSchema: reportSchema,
            }
        });
        const text = response.text;
        if (!text) throw new Error("Received an empty response from the AI.");
        const result: HoldPointNotification = JSON.parse(text.trim());
        console.log("[HoldPointNotificationAgent] Successfully generated notification:", result);
        return result;
    } catch (error) {
        console.error("[HoldPointNotificationAgent] Error generating notification:", error);
        throw new Error("The AI failed to generate the Hold Point Notification.");
    }
};
