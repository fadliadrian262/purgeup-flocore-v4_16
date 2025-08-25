import { Type } from "@google/genai";
import { ai } from "./index";
import { CalculationStandard, StructuralCalculationPayload, AiEngine } from '../../types';
import * as beamDesignAgent from './structural/beamDesignAgent';
import * as slenderColumnAgent from './structural/slenderColumnAgent';
import * as twoWaySlabAgent from './structural/twoWaySlabAgent';
import * as steelConnectionAgent from './structural/steelConnectionAgent';
import * as compositeBeamAgent from './structural/compositeBeamAgent';
import * as punchingShearAgent from './structural/punchingShearAgent';
import * as retainingWallAgent from './structural/retainingWallAgent';
import * as columnBasePlateAgent from './structural/columnBasePlateAgent';
import * as weldedConnectionAgent from './structural/weldedConnectionAgent';
import * as seismicLoadAgent from './structural/seismicLoadAgent';
import * as windLoadAgent from './structural/windLoadAgent';


type StructuralTask =
    | 'reinforced_concrete_beam_design'
    | 'slender_column_design'
    | 'two_way_slab_design'
    | 'punching_shear_design'
    | 'retaining_wall_design'
    | 'steel_connection_design'
    | 'welded_connection_design'
    | 'column_base_plate_design'
    | 'composite_beam_design'
    | 'seismic_load_analysis'
    | 'wind_load_analysis'
    | 'unsupported_task';

/**
 * Detects the specific structural engineering task from a user prompt.
 * This is the routing logic for the structural agent.
 * @param prompt The user's request.
 * @returns A promise resolving to the detected task type.
 */
const detectStructuralTask = async (prompt: string): Promise<StructuralTask> => {
    console.log(`[StructuralAgent] Detecting sub-task for prompt: "${prompt}"`);

    const taskDetectionPrompt = `Analyze the user's structural engineering request and classify it into ONE of the following categories. Choose the most specific and relevant category.

Categories:
- 'reinforced_concrete_beam_design': Designing flexural reinforcement in concrete beams.
- 'slender_column_design': Analyzing or designing concrete columns with slenderness/P-delta effects.
- 'two_way_slab_design': Designing concrete floor slabs supported on all sides.
- 'punching_shear_design': Checking two-way shear in flat plate slabs at columns.
- 'retaining_wall_design': Full stability analysis and design of cantilever retaining walls.
- 'steel_connection_design': Designing bolted shear connections between steel members.
- 'welded_connection_design': Designing welded connections between steel members.
- 'column_base_plate_design': Designing the steel plate under a column connecting to a footing.
- 'composite_beam_design': Designing steel beams acting compositely with a concrete slab.
- 'seismic_load_analysis': Calculating the overall seismic forces on a building using ELF procedure.
- 'wind_load_analysis': Calculating the overall wind pressures and forces on a building.
- 'unsupported_task': For any other task not listed above or if the request is too vague.

Respond with only the specified JSON format.

User Request: "${prompt}"`;

    const taskEnum = [
        'reinforced_concrete_beam_design', 'slender_column_design', 'two_way_slab_design',
        'punching_shear_design', 'retaining_wall_design', 'steel_connection_design',
        'welded_connection_design', 'column_base_plate_design', 'composite_beam_design',
        'seismic_load_analysis', 'wind_load_analysis', 'unsupported_task'
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
            console.error("[StructuralAgent] Received empty response when detecting sub-task.");
            return 'unsupported_task';
        }

        const result = JSON.parse(text.trim());
        console.log(`[StructuralAgent] Detected sub-task: ${result.task}`);
        return result.task;

    } catch (error) {
        console.error("[StructuralAgent] Error detecting sub-task:", error);
        return 'unsupported_task';
    }
};


/**
 * The main entry point for the structural agent.
 * It acts as a router, detecting the specific task and delegating to the appropriate sub-agent.
 * @param prompt The user's calculation request.
 * @param standard The engineering standard to adhere to.
 * @param aiEngine The selected AI engine.
 * @returns A promise resolving to a structured payload containing the task and result.
 */
export const getStructuralCalculation = async (prompt: string, standard: CalculationStandard, aiEngine: AiEngine): Promise<StructuralCalculationPayload> => {
    // Engineering calculations require the highest precision and reliability of the premium cloud model.
    if (aiEngine !== 'premium') {
        throw new Error("Engineering calculations require the 'Premium' cloud engine. Please switch engines and try again.");
    }

    const task = await detectStructuralTask(prompt);

    switch (task) {
        case 'reinforced_concrete_beam_design':
            const beamResult = await beamDesignAgent.calculate(prompt, standard);
            return { task: 'Reinforced Concrete Beam Design', result: beamResult };
        case 'slender_column_design':
            const columnResult = await slenderColumnAgent.calculate(prompt, standard);
            return { task: 'Slender Column Design', result: columnResult };
        case 'two_way_slab_design':
            const slabResult = await twoWaySlabAgent.calculate(prompt, standard);
            return { task: 'Two-Way Slab Design (DDM)', result: slabResult };
        case 'punching_shear_design':
            const punchingResult = await punchingShearAgent.calculate(prompt, standard);
            return { task: 'Punching Shear Design', result: punchingResult };
        case 'retaining_wall_design':
            const wallResult = await retainingWallAgent.calculate(prompt, standard);
            return { task: 'Cantilever Retaining Wall Design', result: wallResult };
        case 'steel_connection_design':
            const connectionResult = await steelConnectionAgent.calculate(prompt, standard);
            return { task: 'Steel Shear Connection Design', result: connectionResult };
        case 'welded_connection_design':
            const weldedResult = await weldedConnectionAgent.calculate(prompt, standard);
            return { task: 'Welded Connection Design', result: weldedResult };
        case 'column_base_plate_design':
            const basePlateResult = await columnBasePlateAgent.calculate(prompt, standard);
            return { task: 'Column Base Plate Design', result: basePlateResult };
        case 'composite_beam_design':
            const compositeResult = await compositeBeamAgent.calculate(prompt, standard);
            return { task: 'Composite Beam Design', result: compositeResult };
        case 'seismic_load_analysis':
            const seismicResult = await seismicLoadAgent.calculate(prompt, standard);
            return { task: 'Seismic Load Analysis (ELF)', result: seismicResult };
        case 'wind_load_analysis':
            const windResult = await windLoadAgent.calculate(prompt, standard);
            return { task: 'Wind Load Analysis', result: windResult };
        case 'unsupported_task':
        default:
            throw new Error("The requested structural calculation is not yet supported or could not be clearly identified.");
    }
};