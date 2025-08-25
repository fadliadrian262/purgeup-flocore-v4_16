import { Type } from "@google/genai";
import { ai } from "../index";
import { TestCertificate, User, DashboardData } from '../../../types';

const systemInstruction = `You are a Materials Testing Laboratory AI. Your task is to generate a formal Test Certificate.

Your entire response MUST be in the specified JSON schema. Do not add any conversational text.

Key instructions:
1.  **certificateNumber**: Generate a unique certificate number (e.g., 'TC-CONC-24-088').
2.  **testDate**: Extract the date of the test from the prompt, or use today's date.
3.  **materialOrSystem**: Identify the material or system that was tested (e.g., 'Concrete Cylinder Batch #12').
4.  **testStandard**: Identify the standard the test was performed against (e.g., 'ASTM C39').
5.  **testResults**: Parse the user's prompt for test parameters and their results. For each, state the result as 'Pass' or 'Fail'.
6.  **certifiedBy**: Use the user's name as the certifier.`;

const reportSchema = {
    type: Type.OBJECT,
    properties: {
        resultType: { type: Type.STRING, enum: ['TEST_CERTIFICATE'] },
        certificateNumber: { type: Type.STRING },
        testDate: { type: Type.STRING },
        materialOrSystem: { type: Type.STRING },
        testStandard: { type: Type.STRING },
        testResults: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    parameter: { type: Type.STRING },
                    value: { type: Type.STRING },
                    result: { type: Type.STRING, enum: ['Pass', 'Fail'] },
                },
                required: ['parameter', 'value', 'result']
            }
        },
        certifiedBy: { type: Type.STRING },
    },
    required: ["resultType", "certificateNumber", "testDate", "materialOrSystem", "testStandard", "testResults", "certifiedBy"]
};

/**
 * Creates a Test Certificate.
 */
export const create = async (prompt: string, user: User, dashboardData: DashboardData): Promise<TestCertificate> => {
    console.log(`[TestCertificateAgent] Creating certificate for: "${prompt}"`);
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `User Request: "${prompt}". Current User: ${user.name}. Your response MUST include "resultType": "TEST_CERTIFICATE".`,
            config: {
                systemInstruction,
                responseMimeType: 'application/json',
                responseSchema: reportSchema,
            }
        });
        const text = response.text;
        if (!text) throw new Error("Received an empty response from the AI.");
        const result: TestCertificate = JSON.parse(text.trim());
        console.log("[TestCertificateAgent] Successfully generated certificate:", result);
        return result;
    } catch (error) {
        console.error("[TestCertificateAgent] Error generating certificate:", error);
        throw new Error("The AI failed to generate the Test Certificate.");
    }
};
