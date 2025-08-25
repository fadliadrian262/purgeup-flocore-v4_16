import { Type } from "@google/genai";
import { ai } from "./index";
import { HsePayload, User, DashboardData } from '../../types';
import * as healthAndSafetyPlanAgent from './hse/healthAndSafetyPlanAgent';
import * as riskAssessmentAgent from './hse/riskAssessmentAgent';
import * as methodStatementAgent from './hse/methodStatementAgent';
import * as accidentReportAgent from './hse/accidentReportAgent';
import * as safetyAuditReportAgent from './hse/safetyAuditReportAgent';
import * as jobSafetyAnalysisAgent from './hse/jobSafetyAnalysisAgent';
import * as safetyInspectionChecklistAgent from './hse/safetyInspectionChecklistAgent';
import * as trainingRecordAgent from './hse/trainingRecordAgent';
import * as permitToWorkAgent from './hse/permitToWorkAgent';
import * as environmentalMonitoringReportAgent from './hse/environmentalMonitoringReportAgent';
import * as wasteManagementRecordAgent from './hse/wasteManagementRecordAgent';
import * as emergencyResponsePlanAgent from './hse/emergencyResponsePlanAgent';
import * as safetyPerformanceReportAgent from './hse/safetyPerformanceReportAgent';
import * as nonComplianceNoticeAgent from './hse/nonComplianceNoticeAgent';


type HseTask =
    | 'health_and_safety_plan'
    | 'risk_assessment'
    | 'method_statement'
    | 'accident_report'
    | 'safety_audit_report'
    | 'job_safety_analysis'
    | 'safety_inspection_checklist'
    | 'training_record'
    | 'permit_to_work'
    | 'environmental_monitoring_report'
    | 'waste_management_record'
    | 'emergency_response_plan'
    | 'safety_performance_report'
    | 'non_compliance_notice'
    | 'unsupported_task';

/**
 * Detects the specific HSE task from a user prompt.
 */
const detectHseTask = async (prompt: string): Promise<HseTask> => {
    console.log(`[HseAgent] Detecting sub-task for prompt: "${prompt}"`);

    const taskDetectionPrompt = `Analyze the user's request for an HSE Officer and classify it into ONE of the following document types.

Document Types:
- 'health_and_safety_plan': A comprehensive site safety management system.
- 'risk_assessment': Activity-based hazard identification with probability/impact analysis.
- 'method_statement': Safe work procedures for high-risk activities.
- 'accident_report': Formal investigation of an accident or incident.
- 'safety_audit_report': Regular safety system effectiveness evaluations.
- 'job_safety_analysis': Task-specific hazard breakdown and controls (JSA).
- 'safety_inspection_checklist': Daily/weekly safety condition verification.
- 'training_record': Worker competency documentation and certifications.
- 'permit_to_work': High-risk activity authorization (hot work, confined space).
- 'environmental_monitoring_report': Air quality, noise, waste tracking.
- 'waste_management_record': Disposal documentation and regulatory compliance.
- 'emergency_response_plan': Site-specific emergency procedures and evacuation.
- 'safety_performance_report': KPIs, trend analysis, benchmarking.
- 'non_compliance_notice': Formal violation documentation with corrective requirements.
- 'unsupported_task': For any other task not listed.

Respond with only the specified JSON format.

User Request: "${prompt}"`;
    
    const taskEnum: HseTask[] = [
        'health_and_safety_plan', 'risk_assessment', 'method_statement', 'accident_report',
        'safety_audit_report', 'job_safety_analysis', 'safety_inspection_checklist',
        'training_record', 'permit_to_work', 'environmental_monitoring_report',
        'waste_management_record', 'emergency_response_plan', 'safety_performance_report',
        'non_compliance_notice', 'unsupported_task'
    ];

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: taskDetectionPrompt,
            config: {
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.OBJECT,
                    properties: { task: { type: Type.STRING, enum: taskEnum } },
                    required: ['task'],
                },
                temperature: 0,
            }
        });
        
        const text = response.text;
        if (!text) return 'unsupported_task';

        const result = JSON.parse(text.trim());
        console.log(`[HseAgent] Detected sub-task: ${result.task}`);
        return result.task;

    } catch (error) {
        console.error("[HseAgent] Error detecting sub-task:", error);
        return 'unsupported_task';
    }
};


/**
 * The main entry point for the HSE agent.
 * It acts as a router, delegating to the appropriate sub-agent.
 */
export const generateDocument = async (documentType: string, prompt: string, user: User, dashboardData: DashboardData): Promise<HsePayload> => {
    switch (documentType) {
        case 'health_and_safety_plan':
            const hspResult = await healthAndSafetyPlanAgent.create(prompt, user, dashboardData);
            return { task: 'Health and Safety Plan', result: hspResult };
        case 'risk_assessment':
            const raResult = await riskAssessmentAgent.create(prompt, user, dashboardData);
            return { task: 'Risk Assessment', result: raResult };
        case 'method_statement':
            const msResult = await methodStatementAgent.create(prompt, user, dashboardData);
            return { task: 'Method Statement (Safety)', result: msResult };
        case 'accident_report':
            const arResult = await accidentReportAgent.create(prompt, user, dashboardData);
            return { task: 'Accident/Incident Report', result: arResult };
        case 'safety_audit_report':
            const auditResult = await safetyAuditReportAgent.create(prompt, user, dashboardData);
            return { task: 'Safety Audit Report', result: auditResult };
        case 'job_safety_analysis':
            const jsaResult = await jobSafetyAnalysisAgent.create(prompt, user, dashboardData);
            return { task: 'Job Safety Analysis (JSA)', result: jsaResult };
        case 'safety_inspection_checklist':
            const sicResult = await safetyInspectionChecklistAgent.create(prompt, user, dashboardData);
            return { task: 'Safety Inspection Checklist', result: sicResult };
        case 'training_record':
            const trResult = await trainingRecordAgent.create(prompt, user, dashboardData);
            return { task: 'Training Record', result: trResult };
        case 'permit_to_work':
            const ptwResult = await permitToWorkAgent.create(prompt, user, dashboardData);
            return { task: 'Permit to Work', result: ptwResult };
        case 'environmental_monitoring_report':
            const emrResult = await environmentalMonitoringReportAgent.create(prompt, user, dashboardData);
            return { task: 'Environmental Monitoring Report', result: emrResult };
        case 'waste_management_record':
            const wmrResult = await wasteManagementRecordAgent.create(prompt, user, dashboardData);
            return { task: 'Waste Management Record', result: wmrResult };
        case 'emergency_response_plan':
            const erpResult = await emergencyResponsePlanAgent.create(prompt, user, dashboardData);
            return { task: 'Emergency Response Plan', result: erpResult };
        case 'safety_performance_report':
            const sprResult = await safetyPerformanceReportAgent.create(prompt, user, dashboardData);
            return { task: 'Safety Performance Report', result: sprResult };
        case 'non_compliance_notice':
            const ncnResult = await nonComplianceNoticeAgent.create(prompt, user, dashboardData);
            return { task: 'Non-Compliance Notice', result: ncnResult };
        default:
            throw new Error(`The document type "${documentType}" is not supported by the HSE agent.`);
    }
};