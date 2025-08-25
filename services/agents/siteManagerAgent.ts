import { Type } from "@google/genai";
import { ai } from "./index";
import { SiteManagerPayload, User, DashboardData } from '../../types';
import * as dailySiteReportAgent from './siteManager/dailySiteReportAgent';
import * as siteDiaryJournalEntryAgent from './siteManager/siteDiaryJournalEntryAgent';
import * as progressReportAgent from './siteManager/progressReportAgent';
import * as incidentReportAgent from './siteManager/incidentReportAgent';
import * as siteSafetyReportAgent from './siteManager/siteSafetyReportAgent';
import * as toolboxTalkRecordAgent from './siteManager/toolboxTalkRecordAgent';
import * as siteInspectionChecklistAgent from './siteManager/siteInspectionChecklistAgent';
import * as weatherConditionReportAgent from './siteManager/weatherConditionReportAgent';
import * as equipmentUsageLogAgent from './siteManager/equipmentUsageLogAgent';
import * as materialDeliveryRecordAgent from './siteManager/materialDeliveryRecordAgent';
import * as siteMeetingMinutesAgent from './siteManager/siteMeetingMinutesAgent';
import * as nonConformanceReportAgent from './siteManager/nonConformanceReportAgent';
import * as siteInstructionRecordAgent from './siteManager/siteInstructionRecordAgent';
import * as temporaryWorksCertificateAgent from './siteManager/temporaryWorksCertificateAgent';

type SiteManagerTask = 
    | 'daily_site_report'
    | 'site_diary_journal_entry'
    | 'progress_report'
    | 'incident_report'
    | 'site_safety_report'
    | 'toolbox_talk_record'
    | 'site_inspection_checklist'
    | 'weather_condition_report'
    | 'equipment_usage_log'
    | 'material_delivery_record'
    | 'site_meeting_minutes'
    | 'non_conformance_report'
    | 'site_instruction_record'
    | 'temporary_works_certificate'
    | 'unsupported_task';

/**
 * Detects the specific site manager task from a user prompt.
 */
const detectSiteManagerTask = async (prompt: string): Promise<SiteManagerTask> => {
    console.log(`[SiteManagerAgent] Detecting sub-task for prompt: "${prompt}"`);

    const taskDetectionPrompt = `Analyze the user's request for a Site Manager and classify it into ONE of the following document types.

Document Types:
- 'daily_site_report': For daily progress reports, site logs.
- 'site_diary_journal_entry': For chronological site diary or journal entries.
- 'progress_report': For weekly or monthly progress reports with variance analysis.
- 'incident_report': For reports about accidents, near-misses, or safety violations.
- 'site_safety_report': For daily safety conditions, hazard identification.
- 'toolbox_talk_record': For daily safety briefings, attendance, topics.
- 'site_inspection_checklist': For quality control verification across trades.
- 'weather_condition_report': For environmental impact on construction.
- 'equipment_usage_log': For heavy equipment deployment, hours, maintenance.
- 'material_delivery_record': For receipt verification, quality checks, storage.
- 'site_meeting_minutes': For daily huddles, coordination meetings, problem resolution.
- 'non_conformance_report': For quality issues identification and response.
- 'site_instruction_record': For field directives and clarifications.
- 'temporary_works_certificate': For scaffolding, formwork, temp structure approvals.
- 'unsupported_task': For any other task not listed.

Respond with only the specified JSON format.

User Request: "${prompt}"`;
    
    const taskEnum = [
        'daily_site_report', 'site_diary_journal_entry', 'progress_report', 'incident_report',
        'site_safety_report', 'toolbox_talk_record', 'site_inspection_checklist',
        'weather_condition_report', 'equipment_usage_log', 'material_delivery_record',
        'site_meeting_minutes', 'non_conformance_report', 'site_instruction_record',
        'temporary_works_certificate', 'unsupported_task'
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
        if (!text) return 'unsupported_task';

        const result = JSON.parse(text.trim());
        console.log(`[SiteManagerAgent] Detected sub-task: ${result.task}`);
        return result.task;

    } catch (error) {
        console.error("[SiteManagerAgent] Error detecting sub-task:", error);
        return 'unsupported_task';
    }
};


/**
 * The main entry point for the Site Manager agent.
 * It acts as a router, detecting the specific document and delegating to the appropriate sub-agent.
 */
export const generateDocument = async (documentType: string, prompt: string, user: User, dashboardData: DashboardData): Promise<SiteManagerPayload> => {
    // The supervisor already detected the document type, so we use it directly to route.
    
    switch (documentType) {
        case 'daily_site_report':
            const dsrResult = await dailySiteReportAgent.create(prompt, user, dashboardData);
            return { task: 'Daily Site Report', result: dsrResult };
        case 'site_diary_journal_entry':
            const diaryResult = await siteDiaryJournalEntryAgent.create(prompt, user, dashboardData);
            return { task: 'Site Diary/Journal Entry', result: diaryResult };
        case 'progress_report':
            const progressResult = await progressReportAgent.create(prompt, user, dashboardData);
            return { task: 'Progress Report', result: progressResult };
        case 'incident_report':
            const incidentResult = await incidentReportAgent.create(prompt, user, dashboardData);
            return { task: 'Incident Report', result: incidentResult };
        case 'site_safety_report':
            const safetyResult = await siteSafetyReportAgent.create(prompt, user, dashboardData);
            return { task: 'Site Safety Report', result: safetyResult };
        case 'toolbox_talk_record':
            const talkResult = await toolboxTalkRecordAgent.create(prompt, user, dashboardData);
            return { task: 'Toolbox Talk Record', result: talkResult };
        case 'site_inspection_checklist':
            const checklistResult = await siteInspectionChecklistAgent.create(prompt, user, dashboardData);
            return { task: 'Site Inspection Checklist', result: checklistResult };
        case 'weather_condition_report':
            const weatherResult = await weatherConditionReportAgent.create(prompt, user, dashboardData);
            return { task: 'Weather Condition Report', result: weatherResult };
        case 'equipment_usage_log':
            const equipResult = await equipmentUsageLogAgent.create(prompt, user, dashboardData);
            return { task: 'Equipment Usage Log', result: equipResult };
        case 'material_delivery_record':
            const materialResult = await materialDeliveryRecordAgent.create(prompt, user, dashboardData);
            return { task: 'Material Delivery Record', result: materialResult };
        case 'site_meeting_minutes':
            const minutesResult = await siteMeetingMinutesAgent.create(prompt, user, dashboardData);
            return { task: 'Site Meeting Minutes', result: minutesResult };
        case 'non_conformance_report':
            const ncrResult = await nonConformanceReportAgent.create(prompt, user, dashboardData);
            return { task: 'Non-Conformance Report', result: ncrResult };
        case 'site_instruction_record':
            const instructionResult = await siteInstructionRecordAgent.create(prompt, user, dashboardData);
            return { task: 'Site Instruction Record', result: instructionResult };
        case 'temporary_works_certificate':
            const tempWorksResult = await temporaryWorksCertificateAgent.create(prompt, user, dashboardData);
            return { task: 'Temporary Works Certificate', result: tempWorksResult };

        default:
            throw new Error(`The document type "${documentType}" is not supported by the Site Manager agent.`);
    }
};