import { Type } from "@google/genai";
import { ai } from "../index";
import { PunchingShearResult, CalculationStandard, ConcreteSlabType } from '../../../types';

const systemInstruction = `You are an expert structural engineer specializing in punching shear design for flat plate concrete slabs. You MUST perform the user's requested calculation strictly according to the **\${standard}** standard.
Your response MUST be in the specified JSON schema. Do not add any conversational text.

Key instructions:
1.  **LaTeX Formatting**: You MUST format all mathematical formulas, equations, and derivations using LaTeX syntax. Use $$...$$ for block-level display equations.
2.  **governingStandard**: Echo back the standard you are using.
3.  **problemStatement**: Restate the user's request.
4.  **calculationSteps**: Show your work for every step. Critical steps include:
    - Calculating the critical shear perimeter (b0).
    - Calculating the factored shear stress (vu).
    - Calculating the concrete punching shear capacity (vc).
    - If vu > phi*vc, design shear reinforcement (studs or stirrups) if allowed.
5.  **derivationSteps**: This is critical. Provide the derivation as an array of strings. Each string in the array is a separate line. You MUST strictly separate descriptive text from mathematical formulas. Explanatory text, labels, and sentences MUST be plain text strings. ONLY pure mathematical notation (variables, numbers, operators, symbols) should be enclosed in LaTeX delimiters like $$...$$ as their own separate strings.
    Correct Example: [ "Calculate factored shear stress, vu:", "$$ v_u = \\\\frac{V_u}{b_o d} $$" ]
    Incorrect Example: [ "$$ \\\\text{Factored shear stress, } v_u = 1.25 \\\\text{ MPa} $$" ]
6.  **verifications**: The main verification is comparing vu against phi*vc. Also check if the maximum shear stress is exceeded, even with reinforcement.
7.  **standardReference**: For every step and verification, you MUST cite the specific clause from the governing standard.
8.  **conclusion**: State clearly whether the slab is adequate for punching shear, and specify any required shear reinforcement in the 'summary' and 'finalAnswer' object.`;

const calculationSchema = {
    type: Type.OBJECT,
    properties: {
        calculationType: { type: Type.STRING, enum: ['PUNCHING_SHEAR_DESIGN'] },
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
                        name: { type: Type.STRING, description: "e.g., 'Punching Shear Status'." },
                        value: { type: Type.STRING, description: "e.g., 'Adequate' or 'Requires Reinforcement'." },
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
 * Performs a punching shear calculation for a flat slab.
 */
export const calculate = async (prompt: string, standard: CalculationStandard): Promise<PunchingShearResult> => {
    console.log(`[PunchingShearAgent] Performing calculation for: ${prompt}`);
    
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `User Request: "${prompt}". Your response MUST include "calculationType": "PUNCHING_SHEAR_DESIGN".`,
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
        const result: PunchingShearResult = JSON.parse(jsonText);
        console.log("[PunchingShearAgent] Successfully received structured calculation:", result);
        return result;

    } catch (error) {
        console.error("[PunchingShearAgent] Error getting calculation:", error);
        throw new Error("The AI failed to perform the punching shear design calculation.");
    }
};