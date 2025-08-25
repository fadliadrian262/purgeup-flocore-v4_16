import { Type } from "@google/genai";
import { ai } from "../index";
import { DailySiteReport, User, DashboardData } from '../../../types';

const systemInstruction = `You are FLOCORE, an AI assistant for construction site managers. Your task is to generate a comprehensive and professionally formatted Daily Site Report based on the context provided.

Your entire response MUST be in the specified JSON schema. Do not add any conversational text.

Key instructions:
1.  **reportDate**: Use today's date in a readable format (e.g., 'July 26, 2024').
2.  **weather**: Use the weather data from the provided context.
3.  **personnel**: Use the 'team' data from the context to list trades and their counts.
4.  **equipment**: Infer equipment usage from the 'equipment' status and any user prompts or alerts.
5.  **workCompleted**: Synthesize the 'alerts' data to determine what was completed. An alert about an "approved change order" or a "responded RFI" means that task is "completed".
6.  **materialsDelivered**: Infer material deliveries from alerts or user prompts.
7.  **delaysOrIssues**: List any items from the 'alerts' that are of WARNING or CRITICAL urgency.
8.  **safetyObservations**: Infer any safety-related items from alerts or user prompts.`;

const reportSchema = {
    type: Type.OBJECT,
    properties: {
        resultType: { type: Type.STRING, enum: ['DAILY_SITE_REPORT'] },
        reportDate: { type: Type.STRING },
        weather: { type: Type.STRING },
        personnel: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    trade: { type: Type.STRING },
                    count: { type: Type.NUMBER }
                },
                required: ['trade', 'count']
            }
        },
        equipment: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    name: { type: Type.STRING },
                    hours: { type: Type.NUMBER }
                },
                required: ['name', 'hours']
            }
        },
        workCompleted: { type: Type.ARRAY, items: { type: Type.STRING } },
        materialsDelivered: { type: Type.ARRAY, items: { type: Type.STRING } },
        delaysOrIssues: { type: Type.ARRAY, items: { type: Type.STRING } },
        safetyObservations: { type: Type.ARRAY, items: { type: Type.STRING } }
    },
    required: ["resultType", "reportDate", "weather", "personnel", "equipment", "workCompleted", "materialsDelivered", "delaysOrIssues", "safetyObservations"]
};


/**
 * Creates a Daily Site Report.
 */
export const create = async (prompt: string, user: User, dashboardData: DashboardData): Promise<DailySiteReport> => {
    console.log(`[DailySiteReportAgent] Creating report for: "${prompt}"`);

    const context = `
    Current User: ${user.name}
    Project Data:
    - Weather: ${dashboardData.weather.condition}, ${dashboardData.weather.temp}°C. Forecast: ${dashboardData.weather.forecast}
    - Team: ${dashboardData.team.onSite}/${dashboardData.team.total} on site. Trades: ${dashboardData.team.trades.map(t => `${t.name}: ${t.count}`).join(', ')}.
    - Equipment Status: ${dashboardData.equipment.map(e => `${e.name}: ${e.status}`).join(', ')}
    - Alerts:
    ${dashboardData.alerts.map(a => `  - [${a.urgency}] ${a.title}: ${a.message}`).join('\n')}
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `User Request: "${prompt}". \n\n Project Context:\n${context} \n\n Your response MUST include the property "resultType": "DAILY_SITE_REPORT".`,
            config: {
                systemInstruction: systemInstruction,
                responseMimeType: 'application/json',
                responseSchema: reportSchema,
                temperature: 0.2,
            }
        });

        const text = response.text;
        if (!text) {
            throw new Error("Received an empty response from the AI for the Daily Site Report.");
        }

        const jsonText = text.trim();
        const result: DailySiteReport = JSON.parse(jsonText);
        console.log("[DailySiteReportAgent] Successfully generated daily report:", result);
        return result;

    } catch (error) {
        console.error("[DailySiteReportAgent] Error generating report:", error);
        throw new Error("The AI failed to generate the Daily Site Report.");
    }
};
