import { Type } from "@google/genai";
import { ai } from "../index";
import { FoundationSettlementResult, CalculationStandard } from '../../../types';

const systemInstruction = `You are a senior Geotechnical Engineer specializing in foundation settlement analysis. You MUST perform the user's requested settlement calculation with rigor and clarity.
Your entire response MUST adhere to the specified JSON schema.

Key instructions:
1.  **LaTeX Formatting**: You MUST format all mathematical formulas, equations, and derivations using LaTeX syntax. Use $$...$$ for block-level display equations.
2.  **governingTheory**: State the methods used (e.g., 'Elastic Theory for immediate settlement', 'Terzaghi's Theory of Consolidation').
3.  **problemStatement**: Restate the user's request.
4.  **calculationSteps**: Differentiate between settlement types. The critical steps are:
    - Calculate **Immediate (Elastic) Settlement**, especially for foundations on sand.
    - Calculate **Primary Consolidation Settlement** for foundations on saturated clay, using parameters like Cc, Cr, and preconsolidation pressure.
    - Sum the components to get the **Total Settlement**.
5.  **derivationSteps**: This is critical. Provide the derivation as an array of strings. Each string in the array is a separate line. You MUST strictly separate descriptive text from mathematical formulas. Explanatory text, labels, and sentences MUST be plain text strings. ONLY pure mathematical notation (variables, numbers, operators, symbols) should be enclosed in LaTeX delimiters like $$...$$ as their own separate strings.
    Correct Example: [ "Calculate primary consolidation settlement, Sc:", "$$ S_c = \\\\frac{C_c H_c}{1+e_o} \\\\log(\\\\frac{\\\\sigma'_{vf}}{\\\\sigma'_{vo}}) $$" ]
    Incorrect Example: [ "$$ \\\\text{Consolidation settlement is } S_c = 25 \\\\text{ mm} $$" ]
6.  **conclusion**: State the total estimated settlement clearly.
7.  **recommendations**: Provide recommendations if the settlement exceeds allowable limits.`;

const calculationSchema = {
    type: Type.OBJECT,
    properties: {
        calculationType: { type: Type.STRING, enum: ['FOUNDATION_SETTLEMENT_ANALYSIS'] },
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
                        name: { type: Type.STRING, description: "e.g., 'Total Estimated Settlement'" },
                        value: { type: Type.STRING },
                        unit: { type: Type.STRING },
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
 * Performs a foundation settlement analysis.
 */
export const calculate = async (prompt: string, standard: CalculationStandard): Promise<FoundationSettlementResult> => {
    console.log(`[FoundationSettlementAgent] Performing calculation for: ${prompt}`);

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `User Request: "${prompt}". Your response MUST include "calculationType": "FOUNDATION_SETTLEMENT_ANALYSIS".`,
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
        const result: FoundationSettlementResult = JSON.parse(jsonText);
        console.log("[FoundationSettlementAgent] Successfully received structured calculation:", result);
        return result;

    } catch (error) {
        console.error("[FoundationSettlementAgent] Error getting calculation:", error);
        throw new Error("The AI failed to perform the foundation settlement analysis.");
    }
};