import { Type } from "@google/genai";
import { ai } from "../index";
import { WindLoadResult, CalculationStandard } from '../../../types';

const systemInstruction = `You are an expert structural engineer specializing in wind load analysis for buildings. You MUST perform the user's requested calculation strictly according to the **\${standard}** standard (e.g., ASCE 7-16), using the **Directional Procedure for Main Wind-Force Resisting Systems (MWFRS)**.
Your response MUST be in the specified JSON schema. Do not add any conversational text.

Key instructions:
1.  **LaTeX Formatting**: You MUST format all mathematical formulas, equations, and derivations using LaTeX syntax. Use $$...$$ for block-level display equations.
2.  **governingStandard**: Echo back the standard you are using.
3.  **problemStatement**: Restate the user's request.
4.  **calculationSteps**: Show your work for every step. Critical steps include:
    - Determining wind load parameters (e.g., Basic Wind Speed V, Risk Category, Exposure Category, Kzt, Kd).
    - Calculating the velocity pressure exposure coefficient (Kz).
    - Calculating the velocity pressure (qz).
    - Determining the gust-effect factor (G).
    - Determining external pressure coefficients (Cp) for walls and roofs.
    - Calculating the final design wind pressures (p) for each surface (windward, leeward, side walls, roof).
5.  **derivationSteps**: This is critical. Provide the derivation as an array of strings. Each string in the array is a separate line. You MUST strictly separate descriptive text from mathematical formulas. Explanatory text, labels, and sentences MUST be plain text strings. ONLY pure mathematical notation (variables, numbers, operators, symbols) should be enclosed in LaTeX delimiters like $$...$$ as their own separate strings.
    Correct Example: [ "Calculate velocity pressure, qz:", "$$ q_z = 0.613 K_z K_{zt} K_d K_e V^2 $$" ]
    Incorrect Example: [ "$$ \\\\text{Velocity pressure, } q_z = 1.2 \\\\text{ kPa} $$" ]
6.  **conclusion**: Summarize the design wind pressures for all building surfaces clearly in the 'summary' and 'finalAnswer' object.`;

const calculationSchema = {
    type: Type.OBJECT,
    properties: {
        calculationType: { type: Type.STRING, enum: ['WIND_LOAD_ANALYSIS'] },
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
                summary: { type: Type.STRING, description: "A summary of the calculation results including pressures for each surface." },
                finalAnswer: {
                    type: Type.OBJECT,
                    properties: {
                        name: { type: Type.STRING, description: "e.g., 'Windward Wall Pressure'." },
                        value: { type: Type.STRING, description: "e.g., '1.5'." },
                        unit: { type: Type.STRING, description: "e.g., 'kPa'." }
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
 * Performs a wind load analysis for a building.
 */
export const calculate = async (prompt: string, standard: CalculationStandard): Promise<WindLoadResult> => {
    console.log(`[WindLoadAgent] Performing calculation for: ${prompt}`);
    
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `User Request: "${prompt}". Your response MUST include "calculationType": "WIND_LOAD_ANALYSIS".`,
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
        const result: WindLoadResult = JSON.parse(jsonText);
        console.log("[WindLoadAgent] Successfully received structured calculation:", result);
        return result;

    } catch (error) {
        console.error("[WindLoadAgent] Error getting calculation:", error);
        throw new Error("The AI failed to perform the wind load analysis.");
    }
};