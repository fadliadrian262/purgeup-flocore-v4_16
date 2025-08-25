

import { Type } from "@google/genai";
import { ai, getLanguageInstruction } from "./index";
import { DetectedObject, AiEngine, Language } from '../../types';

// Define the expected JSON schema for the model's response for scene analysis.
const analysisResponseSchema = {
  type: Type.OBJECT,
  properties: {
    analysis: {
      type: Type.STRING,
      description: "A brief summary of the construction scene analysis, including observations on progress and safety.",
    },
    objects: {
      type: Type.ARRAY,
      description: "A list of all detected objects in the scene.",
      items: {
        type: Type.OBJECT,
        properties: {
          id: {
            type: Type.NUMBER,
            description: "A unique identifier for the detected object."
          },
          label: {
            type: Type.STRING,
            description: "The name of the detected object, including specifications if possible (e.g., 'W12x26 Steel Beam', 'Safety Helmet')."
          },
          confidence: {
            type: Type.NUMBER,
            description: "The model's confidence in the detection, from 0.0 to 1.0."
          },
          bounds: {
            type: Type.OBJECT,
            description: "The bounding box of the object as percentages of the image dimensions.",
            properties: {
              left: { type: Type.NUMBER },
              top: { type: Type.NUMBER },
              width: { type: Type.NUMBER },
              height: { type: Type.NUMBER },
            },
            required: ["left", "top", "width", "height"],
          },
        },
        required: ["id", "label", "confidence", "bounds"],
      },
    },
  },
  required: ["analysis", "objects"],
};


/**
 * Analyzes a construction site image using the Gemini API.
 * @param base64ImageData - The base64-encoded JPEG image data.
 * @param aiEngine - The selected AI engine for processing.
 * @param language - The desired output language.
 * @returns A promise that resolves to an object containing the analysis and detected objects.
 */
export const getAIAnalysis = async (base64ImageData: string, aiEngine: AiEngine, language: Language): Promise<{ analysis: string; objects: DetectedObject[] }> => {
  // Visual analysis with bounding boxes is a complex task requiring the premium cloud model.
  if (aiEngine !== 'premium') {
    throw new Error("Visual analysis requires the 'Premium' cloud engine. Please switch engines and try again.");
  }

  console.log(`[AnalysisAgent] Sending image to Gemini for analysis using ${aiEngine} engine in ${language}...`);

  const languageInstruction = getLanguageInstruction(language);
  const prompt = `You are FLOCORE, an expert construction site inspector AI. Analyze the provided image of a construction site. ${languageInstruction}

Instructions:
1.  Identify key structural elements, equipment, and personnel. For structural steel, be as specific as possible with the beam/column designation (e.g., "W14x30 Steel Beam", "HSS 8x8x1/2").
2.  For each object you identify, provide its label, your confidence level (0.0-1.0), and its bounding box coordinates as percentages of the image dimensions (left, top, width, height).
3.  Provide a brief but insightful overall analysis summary of the scene. Mention any potential safety observations (like missing PPE, hazards) or general construction progress.
4.  You MUST respond in the specified JSON format. Assign a unique numeric ID to each detected object.`;

  try {
    const imagePart = {
      inlineData: {
        mimeType: 'image/jpeg',
        data: base64ImageData,
      },
    };

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: { parts: [{ text: prompt }, imagePart] },
      config: {
        responseMimeType: "application/json",
        responseSchema: analysisResponseSchema,
        temperature: 0.2, // Lower temperature for more deterministic analysis
      },
    });

    const text = response.text;
    if (!text) {
        throw new Error("Received an empty response from the AI for scene analysis. The request may have been blocked.");
    }

    const jsonText = text.trim();
    const result = JSON.parse(jsonText);
    
    if (!result.analysis || !Array.isArray(result.objects)) {
        throw new Error("Invalid JSON structure received from API.");
    }

    console.log("[AnalysisAgent] Successfully received and parsed AI analysis.");
    return result;

  } catch (error) {
    console.error("[AnalysisAgent] Error calling Gemini API:", error);
    throw new Error("The AI analysis failed. Please check your connection or API key.");
  }
};