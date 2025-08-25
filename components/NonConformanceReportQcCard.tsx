import React from 'react';
import { NonConformanceReportQC } from '../types';
import { IconSparkles, IconFileText, IconWrench, IconShieldCheck } from './icons';
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
            {children}
        </div>
    </div>
);

interface NonConformanceReportQcCardProps {
    result: NonConformanceReportQC,
    title: string,
    onSave?: () => void;
    isSaved?: boolean;
    theme?: CardTheme;
}

const NonConformanceReportQcCard: React.FC<NonConformanceReportQcCardProps> = ({ result, title, onSave, isSaved, theme = 'dark' }) => {
    
    const CardContent = (
         <div className={`p-4 rounded-xl border space-y-5 ${theme === 'dark' ? 'bg-zinc-900 border-zinc-700' : 'bg-transparent border-transparent'}`}>
            {/* Header */}
            <div className={`flex justify-between items-start pb-4 ${theme === 'dark' ? 'border-b border-zinc-800' : 'border-b border-gray-200'}`}>
                <div>
                    <h3 className={`text-lg font-bold ${theme === 'dark' ? 'text-white' : 'text-zinc-900'}`}>{title}</h3>
                    <p className={`text-sm font-semibold mt-1 ${theme === 'dark' ? 'text-orange-300' : 'text-orange-600'}`}>Standard: {result.standardReference}</p>
                </div>
                <div className="text-right">
                    <p className={`text-sm font-semibold ${theme === 'dark' ? 'text-zinc-300' : 'text-zinc-600'}`}>{result.ncrNumber}</p>
                    <p className={`text-xs ${theme === 'dark' ? 'text-zinc-400' : 'text-zinc-500'}`}>{result.dateIssued}</p>
                </div>
            </div>

            <Section title="Description of Non-Conformance" icon={IconFileText} theme={theme}>
                <p className="italic">"{result.description}"</p>
                <p className={`font-mono text-xs mt-2 pt-2 ${theme === 'dark' ? 'border-t border-zinc-700 text-zinc-400' : 'border-t border-gray-300 text-zinc-500'}`}>
                    Clause Violated: {result.specClauseViolated}
                </p>
            </Section>

            <Section title="Root Cause Analysis" icon={IconWrench} theme={theme}>
                <p>{result.rootCauseAnalysis}</p>
            </Section>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <Section title="Corrective Action (Immediate Fix)" icon={IconShieldCheck} theme={theme}>
                    <p>{result.correctiveAction}</p>
                </Section>
                 <Section title="Preventive Action (Systemic Fix)" icon={IconShieldCheck} theme={theme}>
                    <p>{result.preventiveAction}</p>
                </Section>
            </div>

            <div className="flex justify-between items-center pt-4">
                <span className={`text-sm font-semibold ${theme === 'dark' ? 'text-zinc-400' : 'text-zinc-600'}`}>Disposition:</span>
                <span className={`text-base font-bold px-3 py-1 rounded-full ${theme === 'dark' ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30' : 'bg-yellow-100 text-yellow-700 border border-yellow-200'}`}>
                    {result.disposition}
                </span>
            </div>


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

export default NonConformanceReportQcCard;