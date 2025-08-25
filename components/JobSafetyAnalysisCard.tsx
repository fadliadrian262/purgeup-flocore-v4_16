import React from 'react';
import { JobSafetyAnalysis } from '../types';
import { IconSparkles, IconTriangleAlert, IconShieldCheck } from './icons';
import MessageActionBar from './MessageActionBar';

type CardTheme = 'light' | 'dark';

interface SectionProps { 
    title: string;
    children: React.ReactNode;
    theme: CardTheme;
}

const Section: React.FC<SectionProps> = ({ title, children, theme }) => (
    <div className={`pt-4 mt-4 ${theme === 'dark' ? 'border-t border-zinc-800' : 'border-t border-gray-200'}`}>
        <h4 className={`font-bold text-base mb-3 ${theme === 'dark' ? 'text-blue-300' : 'text-blue-600'}`}>
            {title}
        </h4>
        {children}
    </div>
);

const ListItem: React.FC<{ icon: React.ElementType, text: string, theme: CardTheme, type: 'hazard' | 'control' }> = ({ icon: Icon, text, theme, type }) => {
    const colors = {
        light: {
            hazard: 'text-yellow-700',
            control: 'text-green-700'
        },
        dark: {
            hazard: 'text-yellow-300',
            control: 'text-green-300'
        }
    };
    return (
        <li className="flex items-start gap-3">
            <Icon size={18} className={`flex-shrink-0 mt-0.5 ${colors[theme][type]}`} />
            <span className={theme === 'dark' ? 'text-zinc-300' : 'text-zinc-700'}>{text}</span>
        </li>
    );
};


interface JobSafetyAnalysisCardProps {
    result: JobSafetyAnalysis,
    title: string,
    onSave?: () => void;
    isSaved?: boolean;
    theme?: CardTheme;
}

const JobSafetyAnalysisCard: React.FC<JobSafetyAnalysisCardProps> = ({ result, title, onSave, isSaved, theme = 'dark' }) => {
    
    const CardContent = (
         <div className={`p-4 rounded-xl border space-y-2 ${theme === 'dark' ? 'bg-zinc-900 border-zinc-700' : 'bg-transparent border-transparent'}`}>
            {/* Header */}
            <div className={`flex justify-between items-start pb-4 ${theme === 'dark' ? 'border-b border-zinc-800' : 'border-b border-gray-200'}`}>
                <div>
                    <h3 className={`text-lg font-bold ${theme === 'dark' ? 'text-white' : 'text-zinc-900'}`}>{title}</h3>
                    <p className={`text-sm font-semibold mt-1 ${theme === 'dark' ? 'text-zinc-400' : 'text-zinc-600'}`}>Task: {result.task || title}</p>
                </div>
                <div className="text-right flex-shrink-0 ml-4">
                    <p className={`text-sm font-semibold ${theme === 'dark' ? 'text-zinc-300' : 'text-zinc-600'}`}>{result.date}</p>
                    <p className={`text-xs ${theme === 'dark' ? 'text-zinc-400' : 'text-zinc-500'}`}>Prepared by: {result.preparedBy}</p>
                </div>
            </div>

            {result.steps.map((step, index) => (
                <Section key={index} title={`Step ${index + 1}: ${step.step}`} theme={theme}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        {/* Potential Hazards */}
                        <div className={`p-3 rounded-lg ${theme === 'dark' ? 'bg-zinc-800/50' : 'bg-gray-50 border border-gray-200'}`}>
                            <h5 className={`font-semibold mb-2 ${theme === 'dark' ? 'text-zinc-300' : 'text-zinc-700'}`}>Potential Hazards</h5>
                            <ul className="space-y-2">
                                {step.potentialHazards.map((hazard, i) => (
                                    <ListItem key={i} icon={IconTriangleAlert} text={hazard} theme={theme} type="hazard" />
                                ))}
                            </ul>
                        </div>
                        {/* Control Measures */}
                        <div className={`p-3 rounded-lg ${theme === 'dark' ? 'bg-zinc-800/50' : 'bg-gray-50 border border-gray-200'}`}>
                            <h5 className={`font-semibold mb-2 ${theme === 'dark' ? 'text-zinc-300' : 'text-zinc-700'}`}>Control Measures</h5>
                            <ul className="space-y-2">
                                {step.controls.map((control, i) => (
                                    <ListItem key={i} icon={IconShieldCheck} text={control} theme={theme} type="control" />
                                ))}
                            </ul>
                        </div>
                    </div>
                </Section>
            ))}

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

export default JobSafetyAnalysisCard;