import React from 'react';
import { QualityAuditReport } from '../types';
import { IconSparkles, IconFileText, IconCheckCircle2, IconAlertCircle, IconWrench } from './icons';
import MessageActionBar from './MessageActionBar';

type CardTheme = 'light' | 'dark';

interface SectionProps { 
    title: string;
    icon: React.ElementType; 
    children: React.ReactNode;
    theme: CardTheme;
}

const Section: React.FC<SectionProps> = ({ title, icon: Icon, children, theme }) => (
    <div>
        <div className="flex items-center gap-3 mb-2">
            <Icon size={18} className={`${theme === 'dark' ? 'text-blue-300' : 'text-blue-600'}`} />
            <h4 className={`font-bold text-base ${theme === 'dark' ? 'text-blue-300' : 'text-blue-600'}`}>{title}</h4>
        </div>
        <div className={`pl-8 text-sm p-3 rounded-lg ${theme === 'dark' ? 'bg-zinc-800/50 text-zinc-300' : 'bg-gray-100 text-zinc-700 border border-gray-200'}`}>
            <ul className="list-disc list-inside space-y-1">
                {children}
            </ul>
        </div>
    </div>
);

interface QualityAuditReportCardProps {
    result: QualityAuditReport,
    title: string,
    onSave?: () => void;
    isSaved?: boolean;
    theme?: CardTheme;
}

const QualityAuditReportCard: React.FC<QualityAuditReportCardProps> = ({ result, title, onSave, isSaved, theme = 'dark' }) => {
    
    const CardContent = (
         <div className={`p-4 rounded-xl border space-y-5 ${theme === 'dark' ? 'bg-zinc-900 border-zinc-700' : 'bg-transparent border-transparent'}`}>
            {/* Header */}
            <div className={`flex justify-between items-start pb-4 ${theme === 'dark' ? 'border-b border-zinc-800' : 'border-b border-gray-200'}`}>
                <div>
                    <h3 className={`text-lg font-bold ${theme === 'dark' ? 'text-white' : 'text-zinc-900'}`}>{title}</h3>
                    <p className={`text-sm font-semibold mt-1 ${theme === 'dark' ? 'text-zinc-400' : 'text-zinc-600'}`}>Scope: {result.scope}</p>
                </div>
                <div className="text-right">
                    <p className={`text-sm font-semibold ${theme === 'dark' ? 'text-zinc-300' : 'text-zinc-600'}`}>{result.auditDate}</p>
                    <p className={`text-xs ${theme === 'dark' ? 'text-zinc-400' : 'text-zinc-500'}`}>Auditor: {result.auditor}</p>
                </div>
            </div>

            {result.findings.length > 0 && (
                <Section title="Positive Findings & Compliance" icon={IconCheckCircle2} theme={theme}>
                    {result.findings.map((item, i) => <li key={i}>{item}</li>)}
                </Section>
            )}

            {result.nonConformities.length > 0 && (
                 <Section title="Non-Conformities Identified" icon={IconAlertCircle} theme={theme}>
                    {result.nonConformities.map((item, i) => <li key={i}>{item}</li>)}
                </Section>
            )}

            {result.recommendations.length > 0 && (
                <Section title="Recommendations for Improvement" icon={IconWrench} theme={theme}>
                    {result.recommendations.map((item, i) => <li key={i}>{item}</li>)}
                </Section>
            )}


            {theme === 'dark' && <MessageActionBar onSaveToTimeline={onSave} isSaved={isSaved} theme={theme} />}
        </div>
    );
    
    if (theme === 'light') {
        return CardContent;
    }

    return (
        <div className="mb-6 animate-fade-in">
            <p className="font-semibold text-purple-400 text-sm flex items-center gap-2">
                <IconSparkles size={16} />
                <span>FLOCORE AI</span>
            </p>
            <div className="mt-2 pl-8">
                {CardContent}
            </div>
            <hr className="border-t border-zinc-800 my-6" />
        </div>
    );
};

export default QualityAuditReportCard;