import { Type } from "@google/genai";
import { ai } from "../index";
import { SlopeStabilityResult, CalculationStandard } from '../../../types';

const systemInstruction = `You are a senior Geotechnical Engineer specializing in slope stability analysis. You MUST perform the user's requested calculation with rigor and clarity.
Your entire response MUST adhere to the specified JSON schema.

Key instructions:
1.  **LaTeX Formatting**: You MUST format all mathematical formulas, equations, and derivations using LaTeX syntax. Use $$...$$ for block-level display equations.
2.  **governingTheory**: State the method used (e.g., 'Ordinary Method of Slices (Fellenius)', 'Bishop's Simplified Method').
3.  **problemStatement**: Restate the user's request, specifying the slope and any slip surface information provided.
4.  **calculationSteps**: The critical steps involve:
    - Dividing the failure mass into a series of vertical slices.
    - For each slice, calculating the weight and resisting/driving forces.
    - Summing the forces for all slices.
    - Calculating the overall **Factor of Safety (FoS)** against sliding.
5.  **derivationSteps**: This is critical. Provide the derivation as an array of strings. You MUST strictly separate descriptive text from mathematical formulas. Explanatory text MUST be plain text strings. ONLY pure mathematical notation (variables, numbers, operators, symbols) should be enclosed in LaTeX delimiters like $$...$$ as their own separate strings.
    Correct Example: [ "Calculate Factor of Safety, FoS:", "$$ FoS = \\\\frac{\\\\sum(c'l + (W\\\\cos\\\\alpha - ul)\\\\tan\\\\phi')}{\\\\sum W\\\\sin\\\\alpha} $$" ]
    Incorrect Example: [ "$$ \\\\text{Factor of Safety, } FoS = 1.6 > 1.5 \\\\text{ (OK)} $$" ]
6.  **slipCircleSpec**: You MUST generate a 'slipCircleSpec' JSON object for a technical drawing of the slope and the critical slip circle.
7.  **conclusion**: State the final calculated Factor of Safety and whether the slope is considered stable (typically FoS > 1.5).
8.  **recommendations**: If the slope is unstable, suggest potential remediation measures (e.g., regrading, retaining structures).`;

const calculationSchema = {
    type: Type.OBJECT,
    properties: {
        calculationType: { type: Type.STRING, enum: ['SLOPE_STABILITY_ANALYSIS'] },
        governingTheory: { type: Type.STRING },
        problemStatement: { type: Type.STRING },
        soilProfile: {
            type: Type.OBJECT,
            properties: {
                layers: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            depthTop: { type: Type.NUMBER },
                            depthBottom: { type: Type.NUMBER },
                            description: { type: Type.STRING },
                            unitWeight: { type: Type.NUMBER },
                            cohesion: { type: Type.NUMBER },
                            frictionAngle: { type: Type.NUMBER },
                        },
                        required: ["depthTop", "depthBottom", "description", "unitWeight"]
                    }
                },
                waterTableDepth: { type: Type.NUMBER },
            },
            required: ["layers", "waterTableDepth"]
        },
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
                    standardReference: { type: Type.STRING },
                    theoryReference: { type: Type.STRING }
                },
                required: ["title", "formula", "derivationSteps", "standardReference", "theoryReference"]
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
                summary: { type: Type.STRING },
                finalAnswer: {
                    type: Type.OBJECT,
                    properties: {
                        name: { type: Type.STRING, description: "e.g., 'Factor of Safety'" },
                        value: { type: Type.STRING },
                        unit: { type: Type.STRING, description: "Unit is usually empty for FoS" },
                    },
                    required: ["name", "value", "unit"]
                }
            },
             required: ["summary", "finalAnswer"]
        },
        recommendations: { type: Type.ARRAY, items: { type: Type.STRING } }
    },
    required: ["calculationType", "governingTheory", "problemStatement", "soilProfile", "assumptions", "givenData", "calculationSteps", "verifications", "conclusion"]
};

/**
 * Performs a slope stability analysis.
 */
export const calculate = async (prompt: string, standard: CalculationStandard): Promise<SlopeStabilityResult> => {
    console.log(`[SlopeStabilityAgent] Performing calculation for: ${prompt}`);

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `User Request: "${prompt}". Your response MUST include "calculationType": "SLOPE_STABILITY_ANALYSIS".`,
            config: {
                systemInstruction,
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
        const result: SlopeStabilityResult = JSON.parse(jsonText);
        console.log("[SlopeStabilityAgent] Successfully received structured calculation:", result);
        return result;

    } catch (error) {
        console.error("[SlopeStabilityAgent] Error getting calculation:", error);
        throw new Error("The AI failed to perform the slope stability analysis.");
    }
};