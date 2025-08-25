import { Type } from "@google/genai";
import { ai } from "../index";
import { ColumnBasePlateResult, CalculationStandard } from '../../../types';

const systemInstruction = `You are an expert structural engineer specializing in steel column base plate design. You MUST perform the user's requested calculation strictly according to the **\${standard}** standard (e.g., AISC Design Guide 1).
Your response MUST be in the specified JSON schema. Do not add any conversational text.

Key instructions:
1.  **LaTeX Formatting**: You MUST format all mathematical formulas, equations, and derivations using LaTeX syntax. Use $$...$$ for block-level display equations.
2.  **governingStandard**: Echo back the standard you are using.
3.  **calculationSteps**: Show your work for every step. Critical steps include:
    - Determining the required bearing area based on the concrete strength.
    - Selecting the plate dimensions (N and B).
    - Calculating the required plate thickness (tp) based on the cantilever bending action of the plate.
    - Checking anchor bolt requirements if uplift or high shear is specified.
4.  **derivationSteps**: This is critical. Provide the derivation as an array of strings. Each string in the array is a separate line. You MUST strictly separate descriptive text from mathematical formulas. Explanatory text, labels, and sentences MUST be plain text strings. ONLY pure mathematical notation (variables, numbers, operators, symbols) should be enclosed in LaTeX delimiters like $$...$$ as their own separate strings.
    Correct Example: [ "Calculate required plate thickness, tp:", "$$ t_p = l \\\\sqrt{\\\\frac{2 P_u}{0.9 F_y B N}} $$" ]
    Incorrect Example: [ "$$ \\\\text{Required thickness, } t_p = 25 \\\\text{ mm} $$" ]
5.  **verifications**: The main verification is ensuring the provided plate thickness is greater than the required thickness.
6.  **standardReference**: For every step, cite the relevant design guide or standard section.
7.  **conclusion**: State the final required base plate dimensions (N x B x tp) and any anchor bolt requirements in the 'summary' and 'finalAnswer' object.`;

const calculationSchema = {
    type: Type.OBJECT,
    properties: {
        calculationType: { type: Type.STRING, enum: ['COLUMN_BASE_PLATE_DESIGN'] },
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
                    evaluation: { type: Type.STRING },
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
                        name: { type: Type.STRING, description: "e.g., 'Required Plate Size'." },
                        value: { type: Type.STRING, description: "e.g., '450mm x 500mm x 25mm'." },
                        unit: { type: Type.STRING, description: "Unit of the final answer." }
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
 * Performs a column base plate design calculation.
 */
export const calculate = async (prompt: string, standard: CalculationStandard): Promise<ColumnBasePlateResult> => {
    console.log(`[ColumnBasePlateAgent] Performing calculation for: ${prompt}`);
    
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `User Request: "${prompt}". Your response MUST include "calculationType": "COLUMN_BASE_PLATE_DESIGN".`,
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
        const result: ColumnBasePlateResult = JSON.parse(jsonText);
        console.log("[ColumnBasePlateAgent] Successfully received structured calculation:", result);
        return result;

    } catch (error) {
        console.error("[ColumnBasePlateAgent] Error getting calculation:", error);
        throw new Error("The AI failed to perform the column base plate design.");
    }
};