import { Type } from "@google/genai";
import { ai } from "../index";
import { TwoWaySlabResult, CalculationStandard, ConcreteSlabType } from '../../../types';

const systemInstruction = `You are an expert structural engineer specializing in two-way concrete slab design. You MUST perform the user's requested calculation strictly according to the **\${standard}** standard, using the **Direct Design Method (DDM)**.
Your response MUST be in the specified JSON schema. Do not add any conversational text.

Key instructions:
1.  **LaTeX Formatting**: You MUST format all mathematical formulas, equations, and derivations using LaTeX syntax. Use $$...$$ for block-level display equations.
2.  **governingStandard**: Echo back the standard you are using.
3.  **problemStatement**: Restate the user's request.
4.  **calculationSteps**: Show your work for every step. Critical steps include:
    - Checking the limitations of the Direct Design Method.
    - Calculating the minimum slab thickness (h_min).
    - Calculating the total factored static moment (Mo).
    - Distributing Mo into positive and negative moments.
    - Distributing moments to column and middle strips.
    - Designing reinforcement for all strips.
5.  **derivationSteps**: This is critical. Provide the derivation as an array of strings. Each string in the array is a separate line. You MUST strictly separate descriptive text from mathematical formulas. Explanatory text, labels, and sentences MUST be plain text strings. ONLY pure mathematical notation (variables, numbers, operators, symbols) should be enclosed in LaTeX delimiters like $$...$$ as their own separate strings.
    Correct Example: [ "Calculate total factored static moment, Mo:", "$$ M_o = \\\\frac{w_u l_2 (l_n)^2}{8} $$" ]
    Incorrect Example: [ "$$ \\\\text{Total factored static moment, } M_o = 120 \\\\text{ kNm} $$" ]
6.  **verifications**: Include all required checks (e.g., shear checks are often simplified in DDM but mention them).
7.  **standardReference**: For every step and verification, you MUST cite the specific clause from the governing standard.
8.  **conclusion**: Summarize the required reinforcement (e.g., "Top bars in column strip: D13 @ 200 mm") in a 'summary' and 'finalAnswer' object.`;

const calculationSchema = {
    type: Type.OBJECT,
    properties: {
        calculationType: { type: Type.STRING, enum: ['TWO_WAY_SLAB_DESIGN'] },
        slabType: { type: Type.STRING, enum: [ConcreteSlabType.TWO_WAY_DDM] },
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
                        name: { type: Type.STRING, description: "e.g., 'Required Reinforcement'." },
                        value: { type: Type.STRING, description: "e.g., 'See summary for details'." },
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
    required: ["calculationType", "slabType", "governingStandard", "problemStatement", "assumptions", "givenData", "calculationSteps", "verifications", "conclusion"]
};

/**
 * Performs a two-way slab calculation using DDM.
 */
export const calculate = async (prompt: string, standard: CalculationStandard): Promise<TwoWaySlabResult> => {
    console.log(`[TwoWaySlabAgent] Performing calculation for: ${prompt}`);
    
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `User Request: "${prompt}". Your response MUST include "calculationType": "TWO_WAY_SLAB_DESIGN" and "slabType": "TWO_WAY_DDM".`,
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
        const result: TwoWaySlabResult = JSON.parse(jsonText);
        console.log("[TwoWaySlabAgent] Successfully received structured calculation:", result);
        return result;

    } catch (error) {
        console.error("[TwoWaySlabAgent] Error getting calculation:", error);
        throw new Error("The AI failed to perform the two-way slab design calculation.");
    }
};