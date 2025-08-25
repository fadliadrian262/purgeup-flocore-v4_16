import { QualityPayload, User, DashboardData } from '../../types';

import * as qualityManagementPlanAgent from './quality/qualityManagementPlanAgent';
import * as inspectionTestPlanAgent from './quality/inspectionTestPlanAgent';
import * as qualityControlChecklistAgent from './quality/qualityControlChecklistAgent';
import * as inspectionReportAgent from './quality/inspectionReportAgent';
import * as testCertificateAgent from './quality/testCertificateAgent';
import * as nonConformanceReportAgent from './quality/nonConformanceReportAgent';
import * as qualityAuditReportAgent from './quality/qualityAuditReportAgent';
import * as correctiveActionRequestAgent from './quality/correctiveActionRequestAgent';
import * as qualityPerformanceMetricsAgent from './quality/qualityPerformanceMetricsAgent';
import * as materialCertificationRecordAgent from './quality/materialCertificationRecordAgent';
import * as commissioningProcedureAgent from './quality/commissioningProcedureAgent';
import * as holdPointNotificationAgent from './quality/holdPointNotificationAgent';
import * as qualitySurveillanceReportAgent from './quality/qualitySurveillanceReportAgent';

/**
 * The main entry point for the Quality Control agent.
 * It acts as a router, detecting the specific document and delegating to the appropriate sub-agent.
 */
export const generateDocument = async (documentType: string, prompt: string, user: User, dashboardData: DashboardData): Promise<QualityPayload> => {
    switch (documentType) {
        case 'quality_management_plan':
            const qmpResult = await qualityManagementPlanAgent.create(prompt, user, dashboardData);
            return { task: 'Quality Management Plan', result: qmpResult };
        case 'inspection_test_plan':
            const itpResult = await inspectionTestPlanAgent.create(prompt, user, dashboardData);
            return { task: 'Inspection and Test Plan (ITP)', result: itpResult };
        case 'quality_control_checklist':
            const qccResult = await qualityControlChecklistAgent.create(prompt, user, dashboardData);
            return { task: 'Quality Control Checklist', result: qccResult };
        case 'inspection_report':
            const irResult = await inspectionReportAgent.create(prompt, user, dashboardData);
            return { task: 'Inspection Report', result: irResult };
        case 'test_certificate':
            const tcResult = await testCertificateAgent.create(prompt, user, dashboardData);
            return { task: 'Test Certificate', result: tcResult };
        case 'non_conformance_report_qc':
            const ncrResult = await nonConformanceReportAgent.create(prompt, user, dashboardData);
            return { task: 'Non-Conformance Report (QC)', result: ncrResult };
        case 'quality_audit_report':
            const auditResult = await qualityAuditReportAgent.create(prompt, user, dashboardData);
            return { task: 'Quality Audit Report', result: auditResult };
        case 'corrective_action_request':
            const carResult = await correctiveActionRequestAgent.create(prompt, user, dashboardData);
            return { task: 'Corrective Action Request (CAR)', result: carResult };
        case 'quality_performance_metrics':
            const qpmResult = await qualityPerformanceMetricsAgent.create(prompt, user, dashboardData);
            return { task: 'Quality Performance Metrics', result: qpmResult };
        case 'material_certification_record':
            const mcrResult = await materialCertificationRecordAgent.create(prompt, user, dashboardData);
            return { task: 'Material Certification Record', result: mcrResult };
        case 'commissioning_procedure':
            const cpResult = await commissioningProcedureAgent.create(prompt, user, dashboardData);
            return { task: 'Commissioning Procedure', result: cpResult };
        case 'hold_point_notification':
            const hpnResult = await holdPointNotificationAgent.create(prompt, user, dashboardData);
            return { task: 'Hold Point Notification', result: hpnResult };
        case 'quality_surveillance_report':
            const qsrResult = await qualitySurveillanceReportAgent.create(prompt, user, dashboardData);
            return { task: 'Quality Surveillance Report', result: qsrResult };
        default:
            throw new Error(`The document type "${documentType}" is not supported by the Quality Control agent.`);
    }
};
