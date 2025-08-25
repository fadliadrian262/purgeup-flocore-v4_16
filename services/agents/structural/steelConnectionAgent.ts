import { Type } from "@google/genai";
import { ai } from "../index";
import { SteelConnectionResult, CalculationStandard, SteelConnectionType } from '../../../types';

const systemInstruction = `You are an expert structural engineer specializing in steel connection design. You MUST perform the user's requested calculation strictly according to the **\${standard}** standard (e.g., AISC 360).
Your response MUST be in the specified JSON schema. Do not add any conversational text.

Key instructions:
1.  **LaTeX Formatting**: You MUST format all mathematical formulas and equations using LaTeX syntax. Use $$...$$ for block-level display equations.
2.  **governingStandard**: Echo back the standard you are using.
3.  **problemStatement**: Restate the user's request (e.g., "Design a bolted shear tab connection...").
4.  **verifications**: THIS IS THE MOST CRITICAL PART. You must perform a check for **every relevant limit state**. For a standard shear tab, this includes:
    - Bolt Shear Rupture
    - Bolt Bearing/Tearout on Beam Web
    - Bolt Bearing/Tearout on Plate
    - Gross Yielding of Plate
    - Net Rupture of Plate
    - Block Shear Rupture of Plate
    - Block Shear Rupture of Beam Web
    For each verification, provide the evaluation as a single LaTeX string showing the final comparison, e.g. '$$ \\\\phi R_n = 350 \\\\text{ kN} > R_u = 200 \\\\text{ kN} $$'. Do not include descriptive text inside the LaTeX block.
5.  **standardReference**: For every verification, you MUST cite the specific chapter/equation from the governing standard (e.g., "AISC 360-16, Eq. J3-1").
6.  **conclusion**: State the final controlling limit state and the overall connection capacity in the 'summary' and 'finalAnswer' object.`;

const calculationSchema = {
    type: Type.OBJECT,
    properties: {
        calculationType: { type: Type.STRING, enum: ['STEEL_CONNECTION_DESIGN'] },
        connectionType: { type: Type.STRING, enum: [SteelConnectionType.SHEAR_TAB] },
        governingStandard: { type: Type.STRING },
        problemStatement: { type: Type.STRING },
        assumptions: { type: Type.ARRAY, items: { type: Type.STRING } },
        givenData: { type: Type.ARRAY, items: { type: Type.STRING } },
        calculationSteps: {
            type: Type.ARRAY,
            description: "Generally empty for connections, as work is shown in verifications.",
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
            description: "A comprehensive check of all relevant limit states for the connection.",
            items: {
                type: Type.OBJECT,
                properties: {
                    checkName: { type: Type.STRING, description: "The name of the limit state, e.g., 'Bolt Shear Rupture'." },
                    evaluation: { type: Type.STRING, description: "The formula, derivation (in LaTeX), and result, e.g., '$$ \\\\phi R_n = ... = 350 \\\\text{ kN} > R_u = 200 \\\\text{ kN} $$'." },
                    status: { type: Type.STRING, enum: ['OK', 'FAIL', 'WARNING'] },
                    standardReference: { type: Type.STRING, description: "The EXACT chapter/equation from the standard." }
                },
                required: ["checkName", "evaluation", "status", "standardReference"]
            }
        },
        conclusion: {
            type: Type.OBJECT,
            properties: {
                summary: { type: Type.STRING, description: "A summary of the calculation results, including controlling limit state." },
                finalAnswer: {
                    type: Type.OBJECT,
                    properties: {
                        name: { type: Type.STRING, description: "e.g., 'Connection Capacity (φRn)'." },
                        value: { type: Type.STRING, description: "e.g., '345'." },
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
    required: ["calculationType", "connectionType", "governingStandard", "problemStatement", "assumptions", "givenData", "calculationSteps", "verifications", "conclusion"]
};


const hasSufficientInfo = async (prompt: string): Promise<boolean> => {
    const checkPrompt = `Does the following user prompt contain enough specific numerical information (like shear load, member sizes, bolt diameter, bolt grade, material strengths) to perform a quantitative steel connection design calculation? Respond with only the specified JSON format.
    
    User prompt: "${prompt}"`;
    
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: checkPrompt,
            config: {
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        hasInfo: { type: Type.BOOLEAN }
                    },
                    required: ['hasInfo']
                },
                temperature: 0,
            }
        });
        
        const text = response.text;
        if (!text) {
            console.error("[SteelConnectionAgent] Pre-flight check received empty response.");
            return false; // Safe fallback
        }
        
        const result = JSON.parse(text.trim());
        console.log('[SteelConnectionAgent] Pre-flight info check result:', result.hasInfo);
        return result.hasInfo;
    } catch (e) {
        console.error("[SteelConnectionAgent] Pre-flight check failed:", e);
        return false; // Fail safe, assume not enough info if check fails
    }
};


/**
 * Performs a steel connection design calculation.
 */
export const calculate = async (prompt: string, standard: CalculationStandard): Promise<SteelConnectionResult> => {
    console.log(`[SteelConnectionAgent] Performing calculation for: ${prompt}`);

    const infoCheck = await hasSufficientInfo(prompt);
    if (!infoCheck) {
        throw new Error("I can help with that. To design a steel connection, I need a bit more information. Please provide:\n- The design shear load (e.g., 250 kN)\n- The beam and column/girder sizes (e.g., W18x50 into a W24x94)\n- The bolt details (e.g., number, diameter, and grade)");
    }
    
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `User Request: "${prompt}". Your response MUST include "calculationType": "STEEL_CONNECTION_DESIGN" and "connectionType": "SHEAR_TAB".`,
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
        const result: SteelConnectionResult = JSON.parse(jsonText);
        console.log("[SteelConnectionAgent] Successfully received structured calculation:", result);
        return result;

    } catch (error) {
        console.error("[SteelConnectionAgent] Error getting calculation:", error);
        throw new Error("The AI failed to perform the steel connection design.");
    }
};