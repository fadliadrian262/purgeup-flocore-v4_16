import { Type } from "@google/genai";
import { ai } from "../index";
import { DeepFoundationResult, CalculationStandard } from '../../../types';

const systemInstruction = `You are a senior Geotechnical Engineer specializing in deep foundations. You MUST perform the user's requested calculation for the **axial capacity of a single pile** with rigor and clarity.
Your entire response MUST adhere to the specified JSON schema.

Key instructions:
1.  **LaTeX Formatting**: You MUST format all mathematical formulas, equations, and derivations using LaTeX syntax. Use $$...$$ for block-level display equations.
2.  **governingTheory**: State the methods used (e.g., 'Alpha-Method for clays, Beta-Method for sands').
3.  **problemStatement**: Restate the user's request.
4.  **soilProfile**: The soil profile is critical. You must process it layer by layer.
5.  **calculationSteps**: Show your work for every step. The critical steps are:
    - For each soil layer the pile passes through, calculate the **skin friction**.
    - Calculate the **end bearing** capacity at the pile tip.
    - Sum the skin friction components and end bearing to get the **ultimate capacity (Qu)**.
    - Apply a Factor of Safety to get the **allowable capacity (Qa)**.
6.  **derivationSteps**: This is critical. Provide the derivation as an array of strings. Each string in the array is a separate line. You MUST strictly separate descriptive text from mathematical formulas. Explanatory text MUST be plain text strings. ONLY pure mathematical notation (variables, numbers, operators, symbols) should be enclosed in LaTeX delimiters like $$...$$ as their own separate strings.
    Correct Example: [ "Skin friction in clay layer:", "$$ f_s = \\\\alpha c_u $$" ]
    Incorrect Example: [ "$$ \\\\text{Skin friction in clay layer is } f_s = \\\\alpha c_u = 50 \\\\text{ kPa} $$" ]
7.  **drawingSpec**: You MUST generate a 'drawingSpec' JSON object for a technical drawing of the pile elevation, showing soil layers.
8.  **conclusion**: State the ultimate and allowable pile capacities clearly.`;

const calculationSchema = {
    type: Type.OBJECT,
    properties: {
        calculationType: { type: Type.STRING, enum: ['DEEP_FOUNDATION_AXIAL_CAPACITY'] },
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
                        name: { type: Type.STRING, description: "e.g., 'Allowable Pile Capacity (Qa)'" },
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
 * Performs a deep foundation axial capacity calculation.
 */
export const calculate = async (prompt: string, standard: CalculationStandard): Promise<DeepFoundationResult> => {
    console.log(`[DeepFoundationAgent] Performing calculation for: ${prompt}`);

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `User Request: "${prompt}". Your response MUST include "calculationType": "DEEP_FOUNDATION_AXIAL_CAPACITY".`,
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
        const result: DeepFoundationResult = JSON.parse(jsonText);
        console.log("[DeepFoundationAgent] Successfully received structured calculation:", result);
        return result;

    } catch (error) {
        console.error("[DeepFoundationAgent] Error getting calculation:", error);
        throw new Error("The AI failed to perform the deep foundation calculation.");
    }
};