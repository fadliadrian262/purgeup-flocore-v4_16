import { Type } from "@google/genai";
import { ai } from "../index";
import { WeldedConnectionResult, CalculationStandard } from '../../../types';

const systemInstruction = `You are an expert structural engineer specializing in steel welded connection design. You MUST perform the user's requested calculation strictly according to the **\${standard}** standard (e.g., AISC 360).
Your response MUST be in the specified JSON schema. Do not add any conversational text.

Key instructions:
1.  **LaTeX Formatting**: You MUST format all mathematical formulas, equations, and derivations using LaTeX syntax. Use $$...$$ for block-level display equations.
2.  **governingStandard**: Echo back the standard you are using.
3.  **problemStatement**: Restate the user's request (e.g., "Design a fillet weld for...").
4.  **calculationSteps**: Show your work for every step. Critical steps include:
    - Calculating the required weld size based on the applied force and material strengths.
    - Determining the required weld length.
5.  **derivationSteps**: This is critical. Provide the derivation as an array of strings. Each string in the array is a separate line. You MUST strictly separate descriptive text from mathematical formulas. Explanatory text, labels, and sentences MUST be plain text strings. ONLY pure mathematical notation should be enclosed in LaTeX delimiters like $$...$$ as their own separate strings.
6.  **verifications**: This section is critical. Include checks for:
    - Weld metal strength.
    - Base metal shear strength (yielding and rupture).
    - Minimum and maximum weld sizes.
    For each verification, provide the full formula and derivation as a LaTeX string, the calculated capacity (phi*Rn), and a status of 'OK' if capacity > demand.
7.  **standardReference**: For every step and verification, you MUST cite the specific chapter/table/equation from the governing standard.
8.  **conclusion**: State the final required weld size and length/configuration in the 'summary' and 'finalAnswer' object.`;

const calculationSchema = {
    type: Type.OBJECT,
    properties: {
        calculationType: { type: Type.STRING, enum: ['WELDED_CONNECTION_DESIGN'] },
        governingStandard: { type: Type.STRING },
        problemStatement: { type: Type.STRING },
        assumptions: { type: Type.ARRAY, items: { type: Type.STRING } },
        givenData: { type: Type.ARRAY, items: { type: Type.STRING } },
        calculationSteps: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    title: { type: Type.STRING },
                    formula: { type: Type.STRING, description: "LaTeX formatted formula string." },
                    derivationSteps: {
                        type: Type.ARRAY,
                        description: "The step-by-step derivation, with each line as a separate string in the array. All strings must be LaTeX formatted.",
                        items: { type: Type.STRING }
                    },
                    standardReference: { type: Type.STRING }
                },
                required: ["title", "formula", "derivationSteps", "standardReference"]
            }
        },
        verifications: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    checkName: { type: Type.STRING },
                    evaluation: { type: Type.STRING, description: "The formula, derivation (in LaTeX), and result." },
                    status: { type: Type.STRING, enum: ['OK', 'FAIL', 'WARNING'] },
                    standardReference: { type: Type.STRING }
                },
                required: ["checkName", "evaluation", "status", "standardReference"]
            }
        },
        conclusion: {
            type: Type.OBJECT,
            properties: {
                summary: { type: Type.STRING, description: "A summary of the calculation results." },
                finalAnswer: {
                    type: Type.OBJECT,
                    properties: {
                        name: { type: Type.STRING, description: "e.g., 'Required Weld'." },
                        value: { type: Type.STRING, description: "e.g., '8mm fillet weld, 150mm long'." },
                        unit: { type: Type.STRING }
                    },
                    required: ["name", "value", "unit"]
                }
            },
            required: ["summary", "finalAnswer"]
        },
        recommendations: { type: Type.ARRAY, items: { type: Type.STRING } },
        warnings: { type: Type.ARRAY, items: { type: Type.STRING } }
    },
    required: ["calculationType", "governingStandard", "problemStatement", "assumptions", "givenData", "calculationSteps", "verifications", "conclusion"]
};

/**
 * Performs a welded connection design calculation.
 */
export const calculate = async (prompt: string, standard: CalculationStandard): Promise<WeldedConnectionResult> => {
    console.log(`[WeldedConnectionAgent] Performing calculation for: ${prompt}`);
    
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `User Request: "${prompt}". Your response MUST include "calculationType": "WELDED_CONNECTION_DESIGN".`,
            config: {
                systemInstruction: systemInstruction.replace('${standard}', standard),
                responseMimeType: 'application/json',
                responseSchema: calculationSchema,
                temperature: 0.1,
            }
        });

        const text = response.text;
        if (!text) {
            throw new Error("Received an empty response from the AI. The request may have been blocked or the model failed to generate content.");
        }

        const jsonText = text.trim();
        const result: WeldedConnectionResult = JSON.parse(jsonText);
        console.log("[WeldedConnectionAgent] Successfully received structured calculation:", result);
        return result;

    } catch (error) {
        console.error("[WeldedConnectionAgent] Error getting calculation:", error);
        throw new Error("The AI failed to perform the welded connection design.");
    }
};