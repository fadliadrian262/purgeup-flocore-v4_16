import React from 'react';
import { DailySiteReport } from '../types';
import { IconSparkles, IconSun, IconUsers, IconWrench, IconCheckCircle2, IconAlertCircle, IconClipboardCheck, IconTruck } from './icons';
import MessageActionBar from './MessageActionBar';

type CardTheme = 'light' | 'dark';

interface SectionProps { 
    title: string;
    icon: React.ElementType; 
    items: string[] | { name: string, value: string | number }[];
    theme: CardTheme;
    emptyText?: string;
}

const Section: React.FC<SectionProps> = ({ title, icon: Icon, items, theme, emptyText = "None recorded." }) => {
    if (!items || items.length === 0) {
        return (
             <div>
                <div className="flex items-center gap-3 mb-2">
                    <Icon size={18} className={`${theme === 'dark' ? 'text-blue-300' : 'text-blue-600'}`} />
                    <h4 className={`font-bold text-base ${theme === 'dark' ? 'text-blue-300' : 'text-blue-600'}`}>{title}</h4>
                </div>
                <div className="pl-8">
                     <p className={`text-sm italic ${theme === 'dark' ? 'text-zinc-500' : 'text-zinc-500'}`}>{emptyText}</p>
                </div>
            </div>
        );
    }
    
    return (
        <div>
            <div className="flex items-center gap-3 mb-2">
                <Icon size={18} className={`${theme === 'dark' ? 'text-blue-300' : 'text-blue-600'}`} />
                <h4 className={`font-bold text-base ${theme === 'dark' ? 'text-blue-300' : 'text-blue-600'}`}>{title}</h4>
            </div>
            <div className={`pl-8 text-sm p-3 rounded-lg ${theme === 'dark' ? 'bg-zinc-800/50 text-zinc-300' : 'bg-gray-50 text-zinc-700 border border-gray-200'}`}>
                <ul className="list-disc list-inside space-y-1">
                    {items.map((item, i) => (
                        <li key={i}>
                            {typeof item === 'string' ? item : `${item.name}: ${item.value}`}
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
};

interface DailyReportCardProps {
    result: DailySiteReport,
    title: string,
    onSave?: () => void;
    isSaved?: boolean;
    theme?: CardTheme;
}

const DailyReportCard: React.FC<DailyReportCardProps> = ({ result, title, onSave, isSaved, theme = 'dark' }) => {
    
    const personnel = result.personnel.map(p => `${p.trade}: ${p.count}`);
    const equipment = result.equipment.map(e => `${e.name} (${e.hours} hours)`);

    const CardContent = (
         <div className={`p-4 rounded-xl border space-y-5 ${theme === 'dark' ? 'bg-zinc-900 border-zinc-700' : 'bg-transparent border-transparent'}`}>
            {/* Header */}
            <div className={`flex justify-between items-start pb-4 ${theme === 'dark' ? 'border-b border-zinc-800' : 'border-b border-gray-200'}`}>
                <div>
                    <h3 className={`text-lg font-bold ${theme === 'dark' ? 'text-white' : 'text-zinc-900'}`}>{title}</h3>
                </div>
                <div className="text-right">
                    <p className={`text-sm font-semibold ${theme === 'dark' ? 'text-zinc-300' : 'text-zinc-600'}`}>{result.reportDate}</p>
                    <p className={`text-xs flex items-center gap-2 mt-1 ${theme === 'dark' ? 'text-zinc-400' : 'text-zinc-500'}`}>
                        <IconSun size={14} /> {result.weather}
                    </p>
                </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <Section title="Personnel On Site" icon={IconUsers} items={personnel} theme={theme} />
                 <Section title="Equipment Used" icon={IconWrench} items={equipment} theme={theme} />
            </div>

            <Section title="Work Completed" icon={IconCheckCircle2} items={result.workCompleted} theme={theme} />
            <Section title="Materials Delivered" icon={IconTruck} items={result.materialsDelivered} theme={theme} />
            <Section title="Delays or Issues" icon={IconAlertCircle} items={result.delaysOrIssues} theme={theme} emptyText="No delays or issues." />
            <Section title="Safety Observations" icon={IconClipboardCheck} items={result.safetyObservations} theme={theme} emptyText="No specific safety observations." />

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

export default DailyReportCard;