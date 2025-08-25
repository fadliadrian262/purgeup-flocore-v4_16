import { Type } from "@google/genai";
import { ai } from "../index";
import { ReinforcedBeamResult, CalculationStandard } from '../../../types';

/**
 * This is a specialist sub-agent for designing and analyzing reinforced concrete beams.
 */

const systemInstruction = `You are an expert structural engineer specializing in reinforced concrete beam design. You MUST perform the user's requested calculation strictly according to the **\${standard}** standard.
Your response MUST be in the specified JSON schema. Do not add any conversational text.
Your role is to provide a complete, visually-supported, and verifiable design packet.

Key instructions:
1.  **Full Design**: You MUST perform BOTH flexural (main rebar) design AND shear (stirrup) design.
2.  **LaTeX Formatting**: You MUST format all mathematical formulas, equations, derivations, and inline variables using LaTeX syntax. Use $$...$$ for block-level display equations.
3.  **derivationSteps**: This is critical. Provide the derivation as an array of strings. You MUST strictly separate descriptive text from mathematical formulas. Explanatory text, labels, and sentences MUST be plain text strings. ONLY pure mathematical notation (variables, numbers, operators, symbols) should be enclosed in LaTeX delimiters like $$...$$ as their own separate strings.
    Correct Example: [ "First, we calculate the effective depth, d:", "$$ d = h - \\\\text{cover} - \\\\frac{d_{bar}}{2} $$", "$$ d = 600 - 40 - \\\\frac{22}{2} = 549 \\\\text{ mm} $$" ]
    Incorrect Example: [ "$$ \\\\text{Effective depth, } d = 549 \\\\text{ mm} $$" ]
4.  **calculationSteps**: This section is for FLEXURAL design steps ONLY.
5.  **shearCalculationSteps**: This NEW section is for SHEAR design steps ONLY. Include steps for calculating Vu, Vc, Vs, and determining stirrup spacing.
6.  **verifications**: Include all relevant checks: As_min, As_max, ductility, max stirrup spacing, etc.
7.  **standardReference**: For every step and verification, you MUST cite the specific article, clause, or table number from the governing standard that justifies your action.
8.  **diagramData**: You MUST generate plot data for the Shear Force Diagram (SFD) and Bending Moment Diagram (BMD). Provide arrays of [x, y] coordinates where x is position (meters) and y is value (kN for shear, kNm for moment). Assume a simply supported beam if boundary conditions aren't given.
9.  **drawingSpec**: You MUST generate a JSON specification for a technical drawing of the beam's cross-section. Use a coordinate system with (0,0) at the bottom-left corner of the concrete section. All units must be in mm. Be precise.
10. **conclusion**: Provide a summary of the results and a 'finalAnswer' object with the key result (e.g., "Use 3-D22 bars with D10 stirrups @ 150mm").`;

const calculationSchema = {
    type: Type.OBJECT,
    properties: {
        calculationType: { type: Type.STRING, enum: ['REINFORCED_BEAM_DESIGN'] },
        governingStandard: { type: Type.STRING, description: "The full name of the standard used for the calculation, e.g., 'SNI 2847:2019 (Indonesia)'." },
        problemStatement: { type: Type.STRING, description: "A concise summary of the user's request." },
        assumptions: {
            type: Type.ARRAY,
            description: "List of all engineering assumptions made, formatted as 'Parameter: Value Unit'. E.g., 'Concrete Cover: 40 mm'.",
            items: { type: Type.STRING }
        },
        givenData: {
            type: Type.ARRAY,
            description: "List of the user-provided data points, formatted as 'Parameter: Value Unit'. E.g., 'Beam Width (b): 400 mm'.",
            items: { type: Type.STRING }
        },
        calculationSteps: {
            type: Type.ARRAY,
            description: "A step-by-step breakdown of the FLEXURAL calculation process for the beam.",
            items: {
                type: Type.OBJECT,
                properties: {
                    title: { type: Type.STRING, description: "The title of the calculation step, e.g., 'Calculate Effective Depth (d)'." },
                    formula: { type: Type.STRING, description: "The formula used for this step, formatted as a LaTeX string." },
                    derivationSteps: {
                        type: Type.ARRAY,
                        description: "The step-by-step derivation, with each line as a separate string in the array. All strings must be LaTeX formatted.",
                        items: { type: Type.STRING }
                    },
                    standardReference: { type: Type.STRING, description: "The EXACT clause, article, or table number from the governing standard used for this step. E.g., 'SNI 2847:2019, Table 20.6.1.3.1'." }
                },
                required: ["title", "formula", "derivationSteps", "standardReference"]
            }
        },
        shearCalculationSteps: {
            type: Type.ARRAY,
            description: "A step-by-step breakdown of the SHEAR calculation process for the beam stirrups.",
            items: {
                type: Type.OBJECT,
                properties: {
                    title: { type: Type.STRING },
                    formula: { type: Type.STRING },
                    derivationSteps: { type: Type.ARRAY, items: { type: Type.STRING } },
                    standardReference: { type: Type.STRING }
                },
                required: ["title", "formula", "derivationSteps", "standardReference"]
            }
        },
        verifications: {
            type: Type.ARRAY,
            description: "Verification checks against code standards like As_min and As_max.",
            items: {
                type: Type.OBJECT,
                properties: {
                    checkName: { type: Type.STRING, description: "The name of the verification check, e.g., 'Minimum Reinforcement (As_min)'." },
                    evaluation: { type: Type.STRING, description: "The result of the check, formatted in LaTeX, e.g., '$$A_{s,prov} = 2268 \\\\text{ mm}^2 > A_{s,min} = 1067.5 \\\\text{ mm}^2$$'." },
                    status: { type: Type.STRING, enum: ['OK', 'FAIL', 'WARNING'], description: "The status of the check." },
                    standardReference: { type: Type.STRING, description: "The EXACT clause or table number from the standard for this verification check." }
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
                        value: { type: Type.STRING, description: "The value of the final answer, e.g., '3-D22 Bars'." },
                        unit: { type: Type.STRING, description: "The unit of the final answer, e.g., 'mm^2'." }
                    },
                    required: ["name", "value", "unit"]
                }
            },
            required: ["summary", "finalAnswer"]
        },
        diagramData: {
            type: Type.OBJECT,
            properties: {
                sfd: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { x: { type: Type.NUMBER }, y: { type: Type.NUMBER } }, required: ["x", "y"] } },
                bmd: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { x: { type: Type.NUMBER }, y: { type: Type.NUMBER } }, required: ["x", "y"] } },
                length: { type: Type.NUMBER, description: "The total length of the beam in meters." }
            },
            required: ["sfd", "bmd", "length"]
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
        recommendations: { type: Type.ARRAY, description: "An optional list of recommendations or points needing professional judgment.", items: { type: Type.STRING } },
        warnings: { type: Type.ARRAY, description: "An optional list of warnings.", items: { type: Type.STRING } }
    },
    required: ["calculationType", "governingStandard", "problemStatement", "assumptions", "givenData", "calculationSteps", "verifications", "conclusion", "diagramData", "drawingSpec"]
};


/**
 * Performs a reinforced concrete beam calculation.
 * @param prompt The user's calculation request.
 * @param standard The engineering standard to adhere to.
 * @returns A promise resolving to a structured ReinforcedBeamResult object.
 */
export const calculate = async (prompt: string, standard: CalculationStandard): Promise<ReinforcedBeamResult> => {
    console.log(`[BeamDesignAgent] Performing calculation for: ${prompt}`);
    
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `User Request: "${prompt}". Your response MUST include the property "calculationType": "REINFORCED_BEAM_DESIGN".`,
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
        const result: ReinforcedBeamResult = JSON.parse(jsonText);
        console.log("[BeamDesignAgent] Successfully received structured calculation:", result);
        return result;

    } catch (error) {
        console.error("[BeamDesignAgent] Error getting calculation:", error);
        throw new Error("The AI failed to perform the beam design calculation.");
    }
};