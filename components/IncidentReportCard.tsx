import React from 'react';
import { IncidentReport } from '../types';
import { IconSparkles, IconUser, IconMapPin, IconClock, IconFileText, IconWrench, IconShieldCheck, IconMessageCircle, IconUsers } from './icons';
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
        <div className="pl-8">{children}</div>
    </div>
);

interface IncidentReportCardProps {
    result: IncidentReport,
    title: string,
    onSave?: () => void;
    isSaved?: boolean;
    theme?: CardTheme;
}

const IncidentReportCard: React.FC<IncidentReportCardProps> = ({ result, title, onSave, isSaved, theme = 'dark' }) => {
    
    const CardContent = (
         <div className={`p-4 rounded-xl border space-y-5 ${theme === 'dark' ? 'bg-zinc-900 border-zinc-700' : 'bg-transparent border-transparent'}`}>
            {/* Header */}
            <div className={`flex justify-between items-start pb-4 ${theme === 'dark' ? 'border-b border-zinc-800' : 'border-b border-gray-200'}`}>
                <div>
                    <h3 className={`text-lg font-bold ${theme === 'dark' ? 'text-white' : 'text-zinc-900'}`}>{title}</h3>
                    <p className={`text-sm font-semibold mt-1 ${theme === 'dark' ? 'text-orange-300' : 'text-orange-600'}`}>Standard: {result.standardReference}</p>
                </div>
                <div className="text-right">
                    <p className={`text-sm font-semibold ${theme === 'dark' ? 'text-zinc-300' : 'text-zinc-600'}`}>{result.dateOfIncident}</p>
                    <p className={`text-xs ${theme === 'dark' ? 'text-zinc-400' : 'text-zinc-500'}`}>{result.timeOfIncident}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                 <div className="flex items-center gap-3">
                    <IconMapPin size={16} className={`${theme === 'dark' ? 'text-zinc-400' : 'text-zinc-500'}`} />
                    <p className={`text-sm ${theme === 'dark' ? 'text-zinc-300' : 'text-zinc-700'}`}><span className="font-semibold">Location:</span> {result.location}</p>
                </div>
                <div className="flex items-center gap-3">
                    <IconUsers size={16} className={`${theme === 'dark' ? 'text-zinc-400' : 'text-zinc-500'}`} />
                    <p className={`text-sm ${theme === 'dark' ? 'text-zinc-300' : 'text-zinc-700'}`}><span className="font-semibold">Involved:</span> {result.personnelInvolved.join(', ')}</p>
                </div>
            </div>

            <Section title="Description of Incident" icon={IconFileText} theme={theme}>
                <p className={`text-sm italic p-3 rounded-lg ${theme === 'dark' ? 'bg-zinc-800/50 text-zinc-300' : 'bg-gray-100 text-zinc-700 border border-gray-200'}`}>
                    "{result.description}"
                </p>
            </Section>

            <Section title="Root Cause Analysis" icon={IconWrench} theme={theme}>
                 <p className={`text-sm p-3 rounded-lg ${theme === 'dark' ? 'bg-zinc-800/50 text-zinc-300' : 'bg-gray-100 text-zinc-700 border border-gray-200'}`}>
                    {result.rootCauseAnalysis}
                </p>
            </Section>
            
            <Section title="Corrective Actions Taken" icon={IconShieldCheck} theme={theme}>
                 <div className={`text-sm p-3 rounded-lg ${theme === 'dark' ? 'bg-green-900/40 text-green-300 border border-green-500/30' : 'bg-green-50 text-green-800 border border-green-200'}`}>
                    <ul className="list-disc list-inside space-y-1">
                        {result.correctiveActions.map((action, i) => <li key={i}>{action}</li>)}
                    </ul>
                </div>
            </Section>
            
            <Section title="Witnesses" icon={IconMessageCircle} theme={theme}>
                 <p className={`text-sm p-3 rounded-lg ${theme === 'dark' ? 'bg-zinc-800/50 text-zinc-400' : 'bg-gray-100 text-zinc-600 border border-gray-200'}`}>
                    {result.witnesses.join(', ')}
                </p>
            </Section>

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

export default IncidentReportCard;