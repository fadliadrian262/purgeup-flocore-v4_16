import { GoogleGenAI } from '@google/genai';

class GeminiService {
    private ai: GoogleGenAI | null = null;
    private apiKey: string | null = null;

    constructor() {
        this.initializeService();
    }

    private initializeService() {
        // Get API key from environment variables
        this.apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
        
        if (!this.apiKey) {
            console.warn('� Gemini API key not found. Some features will be disabled.');
            return;
        }

        if (this.apiKey === 'PLACEHOLDER_API_KEY') {
            console.warn('� Please set your actual Gemini API key in .env.local');
            return;
        }

        try {
            this.ai = new GoogleGenAI({ apiKey: this.apiKey });
            console.log(' Gemini service initialized successfully');
        } catch (error) {
            console.error('L Failed to initialize Gemini service:', error);
        }
    }

    public isReady(): boolean {
        return this.ai !== null && this.apiKey !== null && this.apiKey !== 'PLACEHOLDER_API_KEY';
    }

    public getModel(modelName: string = 'gemini-2.0-flash-exp') {
        if (!this.isReady() || !this.ai) {
            throw new Error('Gemini service not ready. Please check your API key.');
        }
        return this.ai.getGenerativeModel({ model: modelName });
    }

    public async generateContent(prompt: string, modelName?: string) {
        try {
            const model = this.getModel(modelName);
            const result = await model.generateContent(prompt);
            return result.response.text();
        } catch (error) {
            console.error('Error generating content:', error);
            throw error;
        }
    }

    // Legacy compatibility layer for existing agent code
    public get models() {
        return {
            generateContent: async (config: any) => {
                const model = this.getModel(config.model);
                const result = await model.generateContent({
                    contents: config.contents,
                    generationConfig: config.config
                });
                return result;
            }
        };
    }

    public async generateContentStream(prompt: string, modelName?: string) {
        try {
            const model = this.getModel(modelName);
            const result = await model.generateContentStream(prompt);
            return result.stream;
        } catch (error) {
            console.error('Error generating content stream:', error);
            throw error;
        }
    }

    public async analyzeImage(imageBase64: string, prompt: string, mimeType: string = 'image/jpeg', modelName?: string) {
        try {
            const model = this.getModel(modelName);
            const imagePart = {
                inlineData: {
                    data: imageBase64,
                    mimeType: mimeType
                }
            };
            
            const result = await model.generateContent([prompt, imagePart]);
            return result.response.text();
        } catch (error) {
            console.error('Error analyzing image:', error);
            throw error;
        }
    }

    public getApiKey(): string | null {
        return this.apiKey;
    }
}

// Export singleton instance
export const geminiService = new GeminiService();
export default geminiService;