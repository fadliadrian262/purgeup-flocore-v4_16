import React from 'react';
import { HealthAndSafetyPlan } from '../types';
import { IconSparkles, IconShieldCheck } from './icons';
import MessageActionBar from './MessageActionBar';
import { parseMarkdown } from '../utils/markdownParser';

type CardTheme = 'light' | 'dark';

interface HealthAndSafetyPlanCardProps {
    result: HealthAndSafetyPlan,
    title: string,
    onSave?: () => void;
    isSaved?: boolean;
    theme?: CardTheme;
}

const HealthAndSafetyPlanCard: React.FC<HealthAndSafetyPlanCardProps> = ({ result, title, onSave, isSaved, theme = 'dark' }) => {
    
    const CardContent = (
         <div className={`p-4 rounded-xl border space-y-5 ${theme === 'dark' ? 'bg-zinc-900 border-zinc-700' : 'bg-transparent border-transparent'}`}>
            {/* Header */}
            <div className={`flex justify-between items-start pb-4 ${theme === 'dark' ? 'border-b border-zinc-800' : 'border-b border-gray-200'}`}>
                <div>
                    <h3 className={`text-lg font-bold ${theme === 'dark' ? 'text-white' : 'text-zinc-900'}`}>{title}</h3>
                    <p className={`text-sm font-semibold mt-1 ${theme === 'dark' ? 'text-teal-300' : 'text-teal-600'}`}>Standard: {result.standardReference}</p>
                </div>
                <div className="text-right">
                    <p className={`text-sm font-semibold ${theme === 'dark' ? 'text-zinc-300' : 'text-zinc-600'}`}>Rev: {result.revision}</p>
                    <p className={`text-xs ${theme === 'dark' ? 'text-zinc-400' : 'text-zinc-500'}`}>By: {result.preparedBy}</p>
                </div>
            </div>

            {result.sections.map((section, index) => (
                <div key={index}>
                    <div className="flex items-center gap-3 mb-2">
                        <IconShieldCheck size={18} className={`${theme === 'dark' ? 'text-blue-300' : 'text-blue-600'}`} />
                        <h4 className={`font-bold text-base ${theme === 'dark' ? 'text-blue-300' : 'text-blue-600'}`}>{section.title}</h4>
                    </div>
                    <div 
                        className={`pl-8 prose prose-sm max-w-none ${theme === 'dark' ? 'prose-zinc text-zinc-300' : 'text-zinc-700'}`}
                        dangerouslySetInnerHTML={{ __html: parseMarkdown(section.content) }}
                    />
                </div>
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

export default HealthAndSafetyPlanCard;