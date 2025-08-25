import { Type } from "@google/genai";
import { ai } from "../index";
import { SlenderColumnResult, CalculationStandard } from '../../../types';

const systemInstruction = `You are an expert structural engineer specializing in slender reinforced concrete column design. You MUST perform the user's requested calculation strictly according to the **\${standard}** standard, specifically focusing on the Moment Magnifier Method for slenderness effects (P-delta analysis).
Your response MUST be in the specified JSON schema. Do not add any conversational text.

Key instructions:
1.  **LaTeX Formatting**: You MUST format all mathematical formulas, equations, and derivations using LaTeX syntax. Use $$...$$ for block-level display equations.
2.  **derivationSteps**: This is critical. Provide the derivation as an array of strings. You MUST strictly separate descriptive text from mathematical formulas. Explanatory text, labels, and sentences MUST be plain text strings. ONLY pure mathematical notation (variables, numbers, operators, symbols) should be enclosed in LaTeX delimiters like $$...$$ as their own separate strings.
    Correct Example: [ "Calculate the critical buckling load, Pc:", "$$ P_c = \\\\frac{\\\\pi^2 (EI)_{eff}}{ (k l_u)^2 } $$", "$$ P_c = 15000 \\\\text{ kN} $$" ]
    Incorrect Example: [ "$$ \\\\text{Critical buckling load, } P_c = 15000 \\\\text{ kN} $$" ]
3.  **calculationSteps**: Show your work for every step. Critical steps include:
    - Calculating the slenderness ratio (kl/r) and checking if slenderness effects must be considered.
    - Calculating the critical buckling load (Pc).
    - Calculating the moment magnification factor (δ).
    - Calculating the final magnified moment (Mc).
    - Verifying the final design based on the magnified moment.
4.  **standardReference**: For every step and verification, you MUST cite the specific clause from the governing standard.
5.  **pmInteractionData**: You MUST generate plot data for the P-M Interaction Diagram.
    -   capacityCurve: Provide at least 10 data points for the nominal capacity curve (Pn, Mn). Start from pure compression, include the balanced point, and end near pure bending.
    -   demandPoint: Provide the single point representing the factored design loads (Pu, Mu_magnified).
6.  **drawingSpec**: You MUST generate a JSON specification for a technical drawing of the column's cross-section. Use a coordinate system with (0,0) at the bottom-left corner of the concrete section. All units must be in mm. Be precise.
7.  **conclusion**: State the final design or check result clearly in a 'summary' and 'finalAnswer' object.`;

const calculationSchema = {
    type: Type.OBJECT,
    properties: {
        calculationType: { type: Type.STRING, enum: ['SLENDER_COLUMN_DESIGN'] },
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
                        name: { type: Type.STRING, description: "The name of the final answer, e.g., 'Required Reinforcement'." },
                        value: { type: Type.STRING, description: "The value of the final answer, e.g., '8-D25 Bars'." },
                        unit: { type: Type.STRING, description: "The unit of the final answer." }
                    },
                    required: ["name", "value", "unit"]
                }
            },
            required: ["summary", "finalAnswer"]
        },
        pmInteractionData: {
            type: Type.OBJECT,
            properties: {
                capacityCurve: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { p: { type: Type.NUMBER }, m: { type: Type.NUMBER } }, required: ["p", "m"] } },
                demandPoint: { type: Type.OBJECT, properties: { p: { type: Type.NUMBER }, m: { type: Type.NUMBER } }, required: ["p", "m"] },
            },
            required: ["capacityCurve", "demandPoint"]
        },
        drawingSpec: {
            type: Type.OBJECT,
            properties: {
                viewBox: { type: Type.OBJECT, properties: { width: { type: Type.NUMBER }, height: { type: Type.NUMBER } }, required: ["width", "height"] },
                section: { type: Type.OBJECT, properties: { width: { type: Type.NUMBER }, height: { type: Type.NUMBER } }, required: ["width", "height"] },
                stirrup: {
                    type: Type.OBJECT,
                    properties: {
                        shape: { type: Type.STRING }, x: { type: Type.NUMBER }, y: { type: Type.NUMBER },
                        width: { type: Type.NUMBER }, height: { type: Type.NUMBER }, label: { type: Type.STRING }
                    },
                    required: ["shape", "x", "y", "width", "height", "label"]
                },
                mainRebar: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { cx: { type: Type.NUMBER }, cy: { type: Type.NUMBER }, radius: { type: Type.NUMBER }, label: { type: Type.STRING } }, required: ["cx", "cy", "radius"] } },
                topRebar: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { cx: { type: Type.NUMBER }, cy: { type: Type.NUMBER }, radius: { type: Type.NUMBER }, label: { type: Type.STRING } }, required: ["cx", "cy", "radius"] } },
                dimensions: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { type: { type: Type.STRING }, start: { type: Type.NUMBER }, end: { type: Type.NUMBER }, label: { type: Type.STRING }, x: { type: Type.NUMBER }, y: { type: Type.NUMBER } }, required: ["type", "start", "end", "label"] } },
                labels: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { x: { type: Type.NUMBER }, y: { type: Type.NUMBER }, text: { type: Type.STRING }, anchor: { type: Type.STRING } }, required: ["x", "y", "text", "anchor"] } }
            },
            required: ["viewBox", "section", "stirrup", "mainRebar", "dimensions", "labels"]
        },
        recommendations: { type: Type.ARRAY, items: { type: Type.STRING } },
        warnings: { type: Type.ARRAY, items: { type: Type.STRING } }
    },
    required: ["calculationType", "governingStandard", "problemStatement", "assumptions", "givenData", "calculationSteps", "verifications", "conclusion", "pmInteractionData", "drawingSpec"]
};

/**
 * Performs a slender column calculation.
 */
export const calculate = async (prompt: string, standard: CalculationStandard): Promise<SlenderColumnResult> => {
    console.log(`[SlenderColumnAgent] Performing calculation for: ${prompt}`);
    
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `User Request: "${prompt}". Your response MUST include the property "calculationType": "SLENDER_COLUMN_DESIGN".`,
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
        const result: SlenderColumnResult = JSON.parse(jsonText);
        console.log("[SlenderColumnAgent] Successfully received structured calculation:", result);
        return result;

    } catch (error) {
        console.error("[SlenderColumnAgent] Error getting calculation:", error);
        throw new Error("The AI failed to perform the slender column design calculation.");
    }
};