import React from 'react';
import { DocumentPayload } from '../types';
import DailyReportCard from './DailyReportCard';
import IncidentReportCard from './IncidentReportCard';
import HealthAndSafetyPlanCard from './HealthAndSafetyPlanCard';
import RiskAssessmentCard from './RiskAssessmentCard';
import InspectionTestPlanCard from './InspectionTestPlanCard';
import NonConformanceReportQcCard from './NonConformanceReportQcCard';
import QualityAuditReportCard from './QualityAuditReportCard';
import JobSafetyAnalysisCard from './JobSafetyAnalysisCard';
import { IconSparkles } from './icons';
import MessageActionBar from './MessageActionBar';

interface DocumentCardProps {
    payload: DocumentPayload;
    onSave?: () => void;
    isSaved?: boolean;
    // Added to support light-theme rendering from ReportCanvas
    onGenerateReport?: () => void;
    theme?: 'light' | 'dark';
}

const GenericDocumentRenderer: React.FC<{ payload: DocumentPayload, onSave?: () => void, isSaved?: boolean }> = ({ payload, onSave, isSaved }) => {
    // A simple fallback renderer that displays the generated JSON data.
    // This allows us to see the output of any new agent without needing a custom UI card immediately.
    return (
        <div className="mb-6 animate-fade-in">
            <p className="font-semibold text-purple-400 text-sm flex items-center gap-2">
                 <IconSparkles size={16}/>
                 <span>FLOCORE AI</span>
            </p>
            <div className="mt-2 pl-8">
                <div className="p-4 bg-zinc-900 rounded-xl border border-zinc-700">
                    <h3 className="font-bold text-white text-lg mb-2">{payload.task}</h3>
                    <pre className="text-xs bg-zinc-950 p-2 rounded-md overflow-x-auto text-zinc-300">
                        {JSON.stringify(payload.result, null, 2)}
                    </pre>
                     <MessageActionBar onSaveToTimeline={onSave} isSaved={isSaved} />
                </div>
            </div>
            <hr className="border-t border-zinc-800 my-6" />
        </div>
    );
};


const DocumentCard: React.FC<DocumentCardProps> = ({ payload, onSave, isSaved, onGenerateReport, theme }) => {
    // This component acts as a router to the correct, specialized card component
    // based on the resultType of the document.
    
    const { task, result } = payload;
    // Pass all relevant props down
    const commonProps = { title: task, onSave, isSaved, onGenerateReport, theme };

    switch(result.resultType) {
        // Site Manager Cards
        case 'DAILY_SITE_REPORT':
            return <DailyReportCard result={result} {...commonProps} />;
        case 'INCIDENT_REPORT':
             return <IncidentReportCard result={result} {...commonProps} />;
        
        // HSE Officer Cards
        case 'HEALTH_AND_SAFETY_PLAN':
            return <HealthAndSafetyPlanCard result={result} {...commonProps} />;
        case 'RISK_ASSESSMENT':
            return <RiskAssessmentCard result={result} {...commonProps} />;
        case 'HSE_ACCIDENT_REPORT':
            // Re-using the IncidentReportCard as the structure is compatible
            return <IncidentReportCard result={{...result, resultType: 'INCIDENT_REPORT', standardReference: 'OSHA 301 Format'}} {...commonProps} />;
        case 'JOB_SAFETY_ANALYSIS':
            return <JobSafetyAnalysisCard result={result} {...commonProps} />;

        // Quality Control Cards
        case 'INSPECTION_TEST_PLAN':
            return <InspectionTestPlanCard result={result} {...commonProps} />;
        case 'NON_CONFORMANCE_REPORT_QC':
            return <NonConformanceReportQcCard result={result} {...commonProps} />;
        case 'QUALITY_AUDIT_REPORT':
            return <QualityAuditReportCard result={result} {...commonProps} />;
            
        default:
            // Render a generic fallback for any document type that doesn't have a custom card yet.
            return <GenericDocumentRenderer payload={payload} {...commonProps} />;
    }
};

export default DocumentCard;