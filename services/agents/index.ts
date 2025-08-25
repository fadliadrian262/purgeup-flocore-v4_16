
import { geminiService } from '../geminiService';
import { Language } from "../../types";

/**
 * Shared instance of the Gemini service.
 * Centralized service for all AI operations with proper error handling.
 */
export const ai = geminiService;

/**
 * System instruction suffix to make the AI aware of potential transcript errors
 * in noisy construction environments. This is appended to relevant system instructions.
 */
export const noisyEnvironmentInstruction = `

---
IMPORTANT CONTEXT: You are operating on a noisy construction site. The user's voice transcript may contain errors. Use your expert knowledge of construction and the visual context (if available) to infer the user's likely intent from a potentially imperfect transcript. For example, if the transcript says "check rebar's facing", it is highly probable the user meant "check rebar spacing". Be prepared to disambiguate or correct for common transcription errors.`;


/**
 * Returns a directive for the AI to respond in a specific language.
 * @param language The target language code ('en' or 'id').
 * @returns A string containing the system instruction for language.
 */
export const getLanguageInstruction = (language: Language | undefined): string => {
  const langMap: Record<Language, string> = {
    'en': 'You MUST respond in English.',
    'id': 'Anda HARUS merespons dalam Bahasa Indonesia.',
  };
  return langMap[language || 'en'] || langMap['en'];
};

// Export agents
export { supervisor } from './supervisorAgent';
