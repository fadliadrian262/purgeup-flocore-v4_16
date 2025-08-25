import { Type } from "@google/genai";
import { ai } from "./index";
import { GeotechnicalCalculationPayload, CalculationStandard, AiEngine } from '../../types';

import * as shallowFoundationAgent from './geotechnical/shallowFoundationAgent';
import * as deepFoundationAgent from './geotechnical/deepFoundationAgent';
import * as foundationSettlementAgent from './geotechnical/foundationSettlementAgent';
import * as slopeStabilityAgent from './geotechnical/slopeStabilityAgent';


type GeotechnicalTask =
    | 'shallow_foundation'
    | 'deep_foundation'
    | 'foundation_settlement'
    | 'slope_stability'
    | 'unsupported_task';

/**
 * Detects the specific geotechnical engineering task from a user prompt.
 * This is the routing logic for the geotechnical agent.
 * @param prompt The user's request.
 * @returns A promise resolving to the detected task type.
 */
const detectGeotechnicalTask = async (prompt: string): Promise<GeotechnicalTask> => {
    console.log(`[GeotechnicalAgent] Detecting sub-task for prompt: "${prompt}"`);

    const taskDetectionPrompt = `Analyze the user's geotechnical engineering request and classify it into ONE of the following categories. Choose the most specific and relevant category.

Categories:
- 'shallow_foundation': Designing or analyzing shallow foundations like footings for bearing capacity.
- 'deep_foundation': Designing or analyzing deep foundations like piles for axial capacity.
- 'foundation_settlement': Calculating immediate or consolidation settlement for any foundation type.
- 'slope_stability': Analyzing the factor of safety of a soil slope.
- 'unsupported_task': For any other task not listed above or if the request is too vague.

Respond with only the specified JSON format.

User Request: "${prompt}"`;

    const taskEnum = [
        'shallow_foundation', 'deep_foundation', 'foundation_settlement',
        'slope_stability', 'unsupported_task'
    ];

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: taskDetectionPrompt,
            config: {
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        task: { type: Type.STRING, enum: taskEnum },
                    },
                    required: ['task'],
                },
                temperature: 0,
            }
        });
        
        const text = response.text;
        if (!text) {
            console.error("[GeotechnicalAgent] Received empty response when detecting sub-task.");
            return 'unsupported_task';
        }
        
        const result = JSON.parse(text.trim());
        console.log(`[GeotechnicalAgent] Detected sub-task: ${result.task}`);
        return result.task;

    } catch (error) {
        console.error("[GeotechnicalAgent] Error detecting sub-task:", error);
        return 'unsupported_task';
    }
};

/**
 * The main entry point for the geotechnical agent.
 * It acts as a router, detecting the specific task and delegating to the appropriate sub-agent.
 * @param prompt The user's calculation request.
 * @param standard The engineering standard to adhere to.
 * @param aiEngine The selected AI engine.
 * @returns A promise resolving to a structured payload containing the task and result.
 */
export const getGeotechnicalCalculation = async (prompt: string, standard: CalculationStandard, aiEngine: AiEngine): Promise<GeotechnicalCalculationPayload> => {
    // Engineering calculations require the highest precision and reliability of the premium cloud model.
    if (aiEngine !== 'premium') {
        throw new Error("Engineering calculations require the 'Premium' cloud engine. Please switch engines and try again.");
    }

    const task = await detectGeotechnicalTask(prompt);

    switch (task) {
        case 'shallow_foundation':
            const shallowResult = await shallowFoundationAgent.calculate(prompt, standard);
            return { task: 'Shallow Foundation Analysis', result: shallowResult };
        case 'deep_foundation':
            const deepResult = await deepFoundationAgent.calculate(prompt, standard);
            return { task: 'Deep Foundation Analysis', result: deepResult };
        case 'foundation_settlement':
            const settlementResult = await foundationSettlementAgent.calculate(prompt, standard);
            return { task: 'Foundation Settlement Analysis', result: settlementResult };
        case 'slope_stability':
            const slopeResult = await slopeStabilityAgent.calculate(prompt, standard);
            return { task: 'Slope Stability Analysis', result: slopeResult };
        case 'unsupported_task':
        default:
            throw new Error("The requested geotechnical calculation is not yet supported or could not be clearly identified.");
    }
};