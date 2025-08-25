import { Type } from "@google/genai";
import { ai } from "../index";
import { InspectionTestPlan, User, DashboardData } from '../../../types';

const systemInstruction = `You are a Lead Quality Engineer AI. Your task is to generate a detailed Inspection and Test Plan (ITP).

Your entire response MUST be in the specified JSON schema. Do not add any conversational text.

Key instructions:
1.  **planTitle**: Create a title based on the user's prompt (e.g., 'ITP for Structural Steel Erection').
2.  **trade**: Extract the relevant construction trade from the prompt (e.g., 'Structural Steel').
3.  **items**: Generate a list of at least 5-7 relevant inspection/test activities for that trade. For each item:
    - **activity**: Describe the work item (e.g., 'Verify column base plate grouting').
    - **referenceSpec**: Cite a plausible technical specification (e.g., 'Spec 051200, Dwg S-501').
    - **inspectionType**: Choose from 'Visual', 'Measurement', 'Test', 'Surveillance'.
    - **acceptanceCriteria**: State a clear, measurable acceptance criterion (e.g., 'Grout strength > 50 MPa', 'Bolt torque meets spec').
    - **interventionPoint**: Assign 'Hold', 'Witness', or 'Surveillance'.
    - **record**: Specify the document that records the result (e.g., 'Checklist CL-ST-05', 'Pour Record #').`;

const reportSchema = {
    type: Type.OBJECT,
    properties: {
        resultType: { type: Type.STRING, enum: ['INSPECTION_TEST_PLAN'] },
        planTitle: { type: Type.STRING },
        trade: { type: Type.STRING },
        items: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    activity: { type: Type.STRING },
                    referenceSpec: { type: Type.STRING },
                    inspectionType: { type: Type.STRING, enum: ['Visual', 'Measurement', 'Test', 'Surveillance'] },
                    acceptanceCriteria: { type: Type.STRING },
                    interventionPoint: { type: Type.STRING, enum: ['Hold', 'Witness', 'Surveillance'] },
                    record: { type: Type.STRING },
                },
                required: ['activity', 'referenceSpec', 'inspectionType', 'acceptanceCriteria', 'interventionPoint', 'record']
            }
        }
    },
    required: ["resultType", "planTitle", "trade", "items"]
};

/**
 * Creates an Inspection and Test Plan.
 */
export const create = async (prompt: string, user: User, dashboardData: DashboardData): Promise<InspectionTestPlan> => {
    console.log(`[InspectionTestPlanAgent] Creating ITP for: "${prompt}"`);
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `User Request: "${prompt}". Your response MUST include "resultType": "INSPECTION_TEST_PLAN".`,
            config: {
                systemInstruction,
                responseMimeType: 'application/json',
                responseSchema: reportSchema,
            }
        });
        const text = response.text;
        if (!text) throw new Error("Received an empty response from the AI.");
        const result: InspectionTestPlan = JSON.parse(text.trim());
        console.log("[InspectionTestPlanAgent] Successfully generated ITP:", result);
        return result;
    } catch (error) {
        console.error("[InspectionTestPlanAgent] Error generating ITP:", error);
        throw new Error("The AI failed to generate the Inspection and Test Plan.");
    }
};
