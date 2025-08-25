import { Type } from "@google/genai";
import { ai } from "../index";
import { RetainingWallResult, CalculationStandard } from '../../../types';

const systemInstruction = `You are a senior Geotechnical and Structural Engineer, an expert in retaining wall design. You MUST perform a full stability and structural design check for a cantilever retaining wall according to the **\${standard}** for concrete design and established geotechnical principles (e.g., Rankine/Coulomb theory).
Your response MUST be in the specified JSON schema. Do not add any conversational text.

Key instructions:
1.  **LaTeX Formatting**: You MUST format all mathematical formulas, equations, and derivations using LaTeX syntax. Use $$...$$ for block-level display equations.
2.  **governingStandard**: Echo back the standard you are using.
3.  **Geotechnical Analysis**: First, perform the stability analysis. This includes:
    - Calculating active and passive earth pressures.
    - Checking for Overturning, Sliding, and Bearing Capacity failures.
    - Clearly show the calculation for the Factor of Safety (FoS) for each stability mode.
4.  **Structural Design**: Second, perform the structural design of the wall components. This includes:
    - Designing flexural reinforcement for the Stem (vertical wall).
    - Designing flexural reinforcement for the Heel (base slab under backfill).
    - Designing flexural reinforcement for the Toe (base slab at front).
5.  **derivationSteps**: This is critical. Provide the derivation as an array of strings. Each string in the array is a separate line. You MUST strictly separate descriptive text from mathematical formulas. Explanatory text, labels, and sentences MUST be plain text strings. ONLY pure mathematical notation (variables, numbers, operators, symbols) should be enclosed in LaTeX delimiters like $$...$$ as their own separate strings.
    Correct Example: [ "Calculate resisting moment due to soil weight on heel, Ms:", "$$ M_s = W_s \\\\times x_s $$" ]
    Incorrect Example: [ "$$ \\\\text{Resisting moment, } M_s = W_s \\\\times x_s = 250 \\\\text{ kNm} $$" ]
6.  **verifications**: This section should contain the results of the stability checks (Overturning FoS, Sliding FoS, etc.).
7.  **standardReference**: For every step, cite the relevant standard or engineering principle.
8.  **conclusion**: Summarize the stability status and the required reinforcement for all components in a 'summary' and 'finalAnswer' object.`;

const calculationSchema = {
    type: Type.OBJECT,
    properties: {
        calculationType: { type: Type.STRING, enum: ['RETAINING_WALL_DESIGN'] },
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
                    checkName: { type: Type.STRING, description: "e.g., 'Factor of Safety against Overturning'" },
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
                        name: { type: Type.STRING, description: "e.g., 'Wall Stability'." },
                        value: { type: Type.STRING, description: "e.g., 'Stable and Reinforcement adequate'." },
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
 * Performs a retaining wall stability and design calculation.
 */
export const calculate = async (prompt: string, standard: CalculationStandard): Promise<RetainingWallResult> => {
    console.log(`[RetainingWallAgent] Performing calculation for: ${prompt}`);
    
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `User Request: "${prompt}". Your response MUST include "calculationType": "RETAINING_WALL_DESIGN".`,
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
        const result: RetainingWallResult = JSON.parse(jsonText);
        console.log("[RetainingWallAgent] Successfully received structured calculation:", result);
        return result;

    } catch (error) {
        console.error("[RetainingWallAgent] Error getting calculation:", error);
        throw new Error("The AI failed to perform the retaining wall design calculation.");
    }
};