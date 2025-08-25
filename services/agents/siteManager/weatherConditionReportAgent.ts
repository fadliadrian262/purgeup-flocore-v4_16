import { Type } from "@google/genai";
import { ai } from "../index";
import { WeatherConditionReport, User, DashboardData } from '../../../types';

const systemInstruction = `You are FLOCORE, an AI assistant for construction site managers. Your task is to generate a Weather Condition Report.

You will be given the current project data. Your entire response MUST be in the specified JSON schema. Do not add any conversational text.

Key instructions:
1.  **reportDate**: Use today's date in a readable format (e.g., 'July 26, 2024').
2.  **temperature, wind, precipitation**: Use the 'weather' data from the provided project context.
3.  **impactOnActivities**: Based on the weather and any user input, provide a brief assessment of how the weather is affecting or will affect site work. For example, 'High winds may impact crane operations.' or 'Clear conditions, no impact.'`;

const reportSchema = {
    type: Type.OBJECT,
    properties: {
        resultType: { type: Type.STRING, enum: ['WEATHER_CONDITION_REPORT'] },
        reportDate: { type: Type.STRING },
        temperature: { type: Type.STRING },
        wind: { type: Type.STRING },
        precipitation: { type: Type.STRING },
        impactOnActivities: { type: Type.STRING },
    },
    required: ["resultType", "reportDate", "temperature", "wind", "precipitation", "impactOnActivities"]
};

/**
 * Creates a Weather Condition Report.
 */
export const create = async (prompt: string, user: User, dashboardData: DashboardData): Promise<WeatherConditionReport> => {
    console.log(`[WeatherConditionReportAgent] Creating report for: "${prompt}"`);

    const context = `
    Project Data:
    - Weather: ${dashboardData.weather.condition}, ${dashboardData.weather.temp}°C, ${dashboardData.weather.windSpeed} km/h Wind. Forecast: ${dashboardData.weather.forecast}
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `User Request: "${prompt}". \n\n Project Context:\n${context} \n\n Your response MUST include "resultType": "WEATHER_CONDITION_REPORT".`,
            config: {
                systemInstruction,
                responseMimeType: 'application/json',
                responseSchema: reportSchema,
            }
        });

        const text = response.text;
        if (!text) {
            throw new Error("Received an empty response from the AI for the Weather Condition Report.");
        }

        const jsonText = text.trim();
        const result: WeatherConditionReport = JSON.parse(jsonText);
        console.log("[WeatherConditionReportAgent] Successfully generated report:", result);
        return result;

    } catch (error) {
        console.error("[WeatherConditionReportAgent] Error generating report:", error);
        throw new Error("The AI failed to generate the Weather Condition Report.");
    }
};