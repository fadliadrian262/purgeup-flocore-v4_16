import { Type } from "@google/genai";
import { ai } from "../index";
import { SeismicLoadResult, CalculationStandard } from '../../../types';

const systemInstruction = `You are an expert structural engineer specializing in seismic load analysis. You MUST perform the user's requested calculation strictly according to the **\${standard}** standard, using the **Equivalent Lateral Force (ELF) Procedure**.
Your response MUST be in the specified JSON schema. Do not add any conversational text.

Key instructions:
1.  **LaTeX Formatting**: You MUST format all mathematical formulas, equations, and derivations using LaTeX syntax. Use $$...$$ for block-level display equations.
2.  **governingStandard**: Echo back the standard you are using (e.g., 'ASCE 7-16').
3.  **problemStatement**: Restate the user's request.
4.  **calculationSteps**: Show your work for every step. Critical steps include:
    - Determining seismic parameters from user input (e.g., Ss, S1, Site Class).
    - Calculating design spectral response acceleration parameters (SDS, SD1).
    - Calculating the building's fundamental period (T).
    - Calculating the seismic response coefficient (Cs).
    - Calculating the total seismic base shear (V).
    - Vertically distributing the base shear to each floor level (Fx).
5.  **derivationSteps**: This is critical. Provide the derivation as an array of strings. Each string in the array is a separate line. You MUST strictly separate descriptive text from mathematical formulas. Explanatory text, labels, and sentences MUST be plain text strings. ONLY pure mathematical notation (variables, numbers, operators, symbols) should be enclosed in LaTeX delimiters like $$...$$ as their own separate strings.
    Correct Example: [ "Calculate seismic base shear, V:", "$$ V = C_s W $$" ]
    Incorrect Example: [ "$$ \\\\text{Seismic base shear, } V = 5000 \\\\text{ kN} $$" ]
6.  **conclusion**: Summarize the total base shear and provide a clear table of lateral forces at each floor level in the 'summary'. The 'finalAnswer' should highlight the total base shear.`;

const calculationSchema = {
    type: Type.OBJECT,
    properties: {
        calculationType: { type: Type.STRING, enum: ['SEISMIC_LOAD_ANALYSIS'] },
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
                summary: { type: Type.STRING, description: "A summary of the calculation results including the floor force distribution table." },
                finalAnswer: {
                    type: Type.OBJECT,
                    properties: {
                        name: { type: Type.STRING, description: "e.g., 'Total Seismic Base Shear (V)'." },
                        value: { type: Type.STRING, description: "e.g., '5250'." },
                        unit: { type: Type.STRING, description: "e.g., 'kN'." }
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
 * Performs a seismic load analysis using the ELF procedure.
 */
export const calculate = async (prompt: string, standard: CalculationStandard): Promise<SeismicLoadResult> => {
    console.log(`[SeismicLoadAgent] Performing calculation for: ${prompt}`);
    
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `User Request: "${prompt}". Your response MUST include "calculationType": "SEISMIC_LOAD_ANALYSIS".`,
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
        const result: SeismicLoadResult = JSON.parse(jsonText);
        console.log("[SeismicLoadAgent] Successfully received structured calculation:", result);
        return result;

    } catch (error) {
        console.error("[SeismicLoadAgent] Error getting calculation:", error);
        throw new Error("The AI failed to perform the seismic load analysis.");
    }
};