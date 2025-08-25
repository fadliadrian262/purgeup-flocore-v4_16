
import { MLCEngine, ChatOptions, InitProgressCallback } from "@mlc-ai/web-llm";
import { AiEngine } from '../types';

// Core model mappings for optimal performance
const modelMap: Record<Exclude<AiEngine, 'premium'>, string> = {
    compact: 'Llama-3.2-1B-Instruct-q4f16_1-MLC',  // Lightning-fast for summaries & field work
    advanced: 'Qwen2.5-3B-Instruct-q4f16_1-MLC',   // Superior engineering analysis
};

// Singleton instance of the MLCEngine.
let engine: MLCEngine | null = null;
let currentEngine: AiEngine | null = null;


/**
 * Initializes the Web-LLM chat module with a specific model.
 *
 * @param engineToLoad - The engine ('compact' or 'advanced') to initialize.
 * @param progressCallback - A callback to report model loading progress.
 */
const initialize = async (engineToLoad: Exclude<AiEngine, 'premium'>, progressCallback: InitProgressCallback): Promise<void> => {
    if (engine && currentEngine === engineToLoad) {
        console.log(`[LocalLlmService] ${engineToLoad} engine is already initialized.`);
        return;
    }

    console.log(`[LocalLlmService] Initializing ${engineToLoad} engine...`);
    
    if (!engine) {
        engine = new MLCEngine();
    }
    
    // Set the initialization progress callback
    engine.setInitProgressCallback(progressCallback);

    const modelId = modelMap[engineToLoad];
    const chatOpts: ChatOptions = {
        // Options for temperature, top_p, etc., can be set here.
        // We'll keep defaults for general conversation.
    };

    try {
        await engine.reload(modelId, chatOpts);
        currentEngine = engineToLoad;
        console.log(`[LocalLlmService] Successfully loaded ${engineToLoad} model: ${modelId}`);
    } catch (err) {
        console.error(`[LocalLlmService] Error loading model ${modelId}:`, err);
        engine = null; // Reset on failure
        currentEngine = null;
        throw new Error(`Failed to load the ${engineToLoad} model. It might be too large for this device.`);
    }
};

/**
 * Checks if a specific engine is already initialized.
 * @param engineToCheck - The engine to check.
 * @returns True if the engine is loaded and ready, false otherwise.
 */
const isInitialized = (engineToCheck: AiEngine): boolean => {
    return !!engine && currentEngine === engineToCheck;
};

/**
 * Generates a response stream from the local LLM.
 *
 * @param prompt - The user's prompt.
 * @param systemInstruction - The system instruction to guide the model.
 * @returns An async generator that yields response chunks compatible with the app's structure.
 */
async function* generateResponseStream(
    prompt: string,
    systemInstruction: string
): AsyncGenerator<{ text: string }> {
    if (!engine) {
        throw new Error("Local LLM is not initialized. Please select a local engine first.");
    }
    console.log("[LocalLlmService] Generating response from local model...");

    // To maintain the single-turn conversation behavior of the original code,
    // we reset the chat history before each generation.
    await engine.resetChat();
    
    const messages: {role: "system" | "user", content: string}[] = [];
    if(systemInstruction) {
        messages.push({ role: "system", content: systemInstruction });
    }
    messages.push({ role: 'user', content: prompt });

    try {
        const stream = await engine.chat.completions.create({
            stream: true,
            messages: messages,
        });

        for await (const chunk of stream) {
            const delta = chunk.choices[0]?.delta?.content;
            if (delta) {
                yield { text: delta };
            }
        }
        console.log("[LocalLlmService] Finished generating local response.");
    } catch (err) {
        console.error("[LocalLlmService] Error during generation:", err);
        throw new Error("Failed to generate response from the local model.");
    }
}

export const localLlmService = {
    initialize,
    isInitialized,
    generateResponseStream,
};
