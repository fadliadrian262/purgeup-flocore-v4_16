



import { ai, noisyEnvironmentInstruction, getLanguageInstruction } from "./index";
import { AiEngine, Language } from '../../types';

/**
 * Gets a unified response based on multiple visual contexts and a user prompt.
 * This is a specialist agent for the multi-modal "Co-Pilot" view.
 * @param prompt - The user's question or statement.
 * @param aiEngine - The selected AI engine for processing.
 * @param cameraFrameB64 - Optional base64-encoded JPEG from the camera.
 * @param deviceScreenshotB64 - Optional base64-encoded JPEG of the full device screen.
 * @param language - The desired output language.
 * @param signal - An AbortSignal to allow for cancellation of the stream.
 * @returns A promise that resolves to the model's text response stream.
 */
export const getUnifiedCoPilotResponseStream = async (
    prompt: string,
    aiEngine: AiEngine,
    cameraFrameB64: string | null | undefined,
    deviceScreenshotB64: string | null | undefined,
    language: Language,
    signal?: AbortSignal
) => {
    // This is a multi-modal feature, which our local LLM setup doesn't support easily.
    // Force this feature to use the premium cloud engine.
    if (aiEngine !== 'premium') {
        throw new Error("Co-Pilot's screen analysis requires the 'Premium' cloud engine. Please switch engines and try again.");
    }

    console.log(`[CoPilotAgent] Sending unified query to Gemini using ${aiEngine}...`);
    
    const languageInstruction = getLanguageInstruction(language);

    const systemInstruction = `You are FLOCORE, a field co-pilot. You have been given up to two visual contexts and a user's question.
Context A is a live camera feed from the construction site.
Context B is a screenshot of the user's entire device screen, which may show another application like a PDF viewer, photos, or a web browser.

Your task is to intelligently synthesize information from these contexts to provide a direct, concise answer to the user's question. Follow these rules:

1.  **Analyze the Question:** First, understand what the user is asking. Are they comparing something? Asking for information? Asking for an action?
2.  **Prioritize Context Comparison:** Your primary function is to bridge the digital and physical worlds. If the question involves a comparison (e.g., "does this match that?", "is this correct based on the spec?"), you MUST use Context A (Camera) and Context B (Device Screen) together.
3.  **Default to Camera:** If the question is general and does not seem to relate to an open document on the screen, default to analyzing the live camera feed (Context A).
4.  **Be Direct:** Formulate a direct answer. If you synthesize information from both contexts, explain your reasoning briefly (e.g., "Based on the drawing on your screen, the rebar you're looking at is correctly spaced.").
5.  **Be Honest:** If you cannot find the answer in the provided contexts, state that clearly. Do not invent information.
6.  **Language**: ${languageInstruction}` + noisyEnvironmentInstruction;

    try {
        const parts: any[] = [
            { text: `USER'S QUESTION: "${prompt}"` },
        ];

        if (cameraFrameB64) {
            parts.push({ text: "CONTEXT A (LIVE CAMERA):" });
            parts.push({ inlineData: { mimeType: 'image/jpeg', data: cameraFrameB64 } });
        }
        if (deviceScreenshotB64) {
             parts.push({ text: "CONTEXT B (DEVICE SCREEN):" });
            parts.push({ inlineData: { mimeType: 'image/jpeg', data: deviceScreenshotB64 } });
        }

        const response = await ai.models.generateContentStream({
            model: 'gemini-2.5-flash',
            contents: { parts },
            config: {
                systemInstruction,
                tools: [{ googleSearch: {} }],
                temperature: 0.3,
                thinkingConfig: { thinkingBudget: 0 }, // Optimize for low latency in live mode
            },
        });

        console.log("[CoPilotAgent] Successfully initiated unified co-pilot stream.");
        return response;

    } catch (error) {
        console.error("[CoPilotAgent] Error calling Gemini API for unified response:", error);
        throw new Error("The AI assistant failed to provide a unified response.");
    }
};