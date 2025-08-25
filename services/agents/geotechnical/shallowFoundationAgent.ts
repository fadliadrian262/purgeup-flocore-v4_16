import { Type } from "@google/genai";
import { ai } from "../index";
import { ShallowFoundationResult, CalculationStandard } from '../../../types';

const systemInstruction = `You are a senior Geotechnical Engineer, an expert in shallow foundation design. Your analysis must be rigorous, clear, and based on established geotechnical principles. Your task is to provide a COMPLETE design packet.

You MUST perform a two-part analysis:
1.  **Bearing Capacity Analysis**: Calculate the ultimate and allowable bearing capacity.
2.  **Settlement Analysis**: Calculate the total estimated settlement (elastic + consolidation).

For every calculation, you MUST:
1.  **LaTeX Formatting**: Format all mathematical formulas and equations using LaTeX syntax ($$...$$ for block-level).
2.  **State Governing Theory**: (e.g., 'Terzaghi's Bearing Capacity Theory').
3.  **Step-by-Step Format**: Present all calculations clearly.
4.  **derivationSteps**: This is critical. Provide the derivation as an array of strings. You MUST strictly separate descriptive text from mathematical formulas. Explanatory text MUST be plain text strings. ONLY pure mathematical notation should be enclosed in LaTeX delimiters like $$...$$ as their own separate strings.
    Correct Example: [ "Calculate ultimate bearing capacity, q_ult:", "$$ q_{ult} = c'N_c + qN_q + 0.5\\\\gamma'BN_\\\\gamma $$" ]
    Incorrect Example: [ "$$ \\\\text{Ultimate bearing capacity, } q_{ult} = 500 \\\\text{ kPa} $$" ]
5.  **Visual Specification**: You MUST generate a 'drawingSpec' JSON object for a technical drawing of the foundation cross-section. Use a coordinate system with (0,0) at the ground surface on the left. All units must be in a consistent scale (e.g., meters). Be precise. Include the footing, soil layers, and a representative pressure bulb.
6.  **Nested Result**: Your entire response MUST be a single JSON object where the bearing capacity result is the parent, and the full settlement calculation result is nested inside the 'settlementCalculation' property.
7.  **Conclusion**: Conclude each analysis with a definitive answer. The parent conclusion should summarize BOTH bearing and settlement results.`;

const baseGeoSchemaProperties = {
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
                formula: { type: Type.STRING },
                derivationSteps: { type: Type.ARRAY, items: { type: Type.STRING } },
                theoryReference: { type: Type.STRING },
                standardReference: { type: Type.STRING },
            },
            required: ["title", "formula", "derivationSteps", "theoryReference", "standardReference"]
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
                properties: { name: { type: Type.STRING }, value: { type: Type.STRING }, unit: { type: Type.STRING } },
                required: ["name", "value", "unit"]
            }
        },
        required: ["summary", "finalAnswer"]
    },
    recommendations: { type: Type.ARRAY, items: { type: Type.STRING } }
};

const settlementCalculationSchema = {
    type: Type.OBJECT,
    properties: {
        ...baseGeoSchemaProperties,
        calculationType: { type: Type.STRING, enum: ['FOUNDATION_SETTLEMENT_ANALYSIS'] },
    },
    required: Object.keys(baseGeoSchemaProperties),
};

const drawingSpecSchema = {
    type: Type.OBJECT,
    properties: {
        viewBox: { type: Type.OBJECT, properties: { width: { type: Type.NUMBER }, height: { type: Type.NUMBER } }, required: ["width", "height"] },
        footing: { type: Type.OBJECT, properties: { x: { type: Type.NUMBER }, y: { type: Type.NUMBER }, width: { type: Type.NUMBER }, height: { type: Type.NUMBER } }, required: ["x", "y", "width", "height"] },
        soilLayers: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: { depthTop: { type: Type.NUMBER }, depthBottom: { type: Type.NUMBER }, description: { type: Type.STRING } },
                required: ["depthTop", "depthBottom", "description"]
            }
        },
        waterTableDepth: { type: Type.NUMBER },
        pressureBulb: { type: Type.OBJECT, properties: { cx: { type: Type.NUMBER }, cy: { type: Type.NUMBER }, rx: { type: Type.NUMBER }, ry: { type: Type.NUMBER } } },
        labels: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { x: { type: Type.NUMBER }, y: { type: Type.NUMBER }, text: { type: Type.STRING }, anchor: { type: Type.STRING, enum: ['start', 'middle', 'end'] } }, required: ["x", "y", "text", "anchor"] } },
        dimensions: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { type: { type: Type.STRING, enum: ['horizontal', 'vertical'] }, start: { type: Type.ARRAY, items: { type: Type.NUMBER } }, end: { type: Type.ARRAY, items: { type: Type.NUMBER } }, label: { type: Type.STRING } }, required: ["type", "start", "end", "label"] } }
    },
    required: ["viewBox", "footing", "soilLayers"]
};

const calculationSchema = {
    type: Type.OBJECT,
    properties: {
        ...baseGeoSchemaProperties,
        calculationType: { type: Type.STRING, enum: ['SHALLOW_FOUNDATION_BEARING_CAPACITY'] },
        drawingSpec: drawingSpecSchema,
        settlementCalculation: settlementCalculationSchema,
    },
    required: [...Object.keys(baseGeoSchemaProperties), "calculationType", "drawingSpec", "settlementCalculation"]
};

/**
 * Performs a shallow foundation bearing capacity calculation.
 */
export const calculate = async (prompt: string, standard: CalculationStandard): Promise<ShallowFoundationResult> => {
    console.log(`[ShallowFoundationAgent] Performing calculation for: ${prompt}`);

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `User Request: "${prompt}". Your response MUST include "calculationType": "SHALLOW_FOUNDATION_BEARING_CAPACITY".`,
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
        const result: ShallowFoundationResult = JSON.parse(jsonText);
        console.log("[ShallowFoundationAgent] Successfully received structured calculation:", result);
        return result;

    } catch (error) {
        console.error("[ShallowFoundationAgent] Error getting calculation:", error);
        throw new Error("The AI failed to perform the shallow foundation calculation.");
    }
};