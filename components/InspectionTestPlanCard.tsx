import React from 'react';
import { InspectionTestPlan } from '../types';
import { IconSparkles, IconClipboardCheck } from './icons';
import MessageActionBar from './MessageActionBar';

type CardTheme = 'light' | 'dark';

interface InspectionTestPlanCardProps {
    result: InspectionTestPlan,
    title: string,
    onSave?: () => void;
    isSaved?: boolean;
    theme?: CardTheme;
}

const InspectionTestPlanCard: React.FC<InspectionTestPlanCardProps> = ({ result, title, onSave, isSaved, theme = 'dark' }) => {
    
    const CardContent = (
         <div className={`p-4 rounded-xl border space-y-5 ${theme === 'dark' ? 'bg-zinc-900 border-zinc-700' : 'bg-transparent border-transparent'}`}>
            {/* Header */}
            <div className={`flex justify-between items-start pb-4 ${theme === 'dark' ? 'border-b border-zinc-800' : 'border-b border-gray-200'}`}>
                <div>
                    <h3 className={`text-lg font-bold ${theme === 'dark' ? 'text-white' : 'text-zinc-900'}`}>{title}</h3>
                    <p className={`text-sm font-semibold mt-1 ${theme === 'dark' ? 'text-zinc-400' : 'text-zinc-600'}`}>{result.planTitle}</p>
                </div>
                <div className={`text-sm font-semibold px-3 py-1 rounded-full ${theme === 'dark' ? 'text-teal-300 bg-teal-900/50 border border-teal-500/30' : 'text-teal-700 bg-teal-50 border border-teal-200'}`}>{result.trade}</div>
            </div>

            {/* ITP Table */}
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className={`${theme === 'dark' ? 'text-zinc-400' : 'text-zinc-600'}`}>
                        <tr className={`${theme === 'dark' ? 'border-b border-zinc-700' : 'border-b border-gray-300'}`}>
                            <th className="p-2">Activity</th>
                            <th className="p-2">Reference</th>
                            <th className="p-2">Type</th>
                            <th className="p-2">Acceptance Criteria</th>
                            <th className="p-2 text-center">Intervention</th>
                            <th className="p-2">Record</th>
                        </tr>
                    </thead>
                    <tbody>
                        {result.items.map((item, index) => (
                            <tr key={index} className={`border-t ${theme === 'dark' ? 'border-zinc-800' : 'border-gray-200'}`}>
                                <td className={`p-2 font-medium ${theme === 'dark' ? 'text-white' : 'text-zinc-800'}`}>{item.activity}</td>
                                <td className={`p-2 font-mono text-xs ${theme === 'dark' ? 'text-zinc-400' : 'text-zinc-500'}`}>{item.referenceSpec}</td>
                                <td className={`p-2 ${theme === 'dark' ? 'text-zinc-300' : 'text-zinc-700'}`}>{item.inspectionType}</td>
                                <td className={`p-2 ${theme === 'dark' ? 'text-zinc-300' : 'text-zinc-700'}`}>{item.acceptanceCriteria}</td>
                                <td className="p-2 text-center">
                                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full
                                        ${item.interventionPoint === 'Hold' ? (theme === 'dark' ? 'bg-red-500/20 text-red-300' : 'bg-red-100 text-red-700') :
                                         item.interventionPoint === 'Witness' ? (theme === 'dark' ? 'bg-blue-500/20 text-blue-300' : 'bg-blue-100 text-blue-700') :
                                         (theme === 'dark' ? 'bg-zinc-700 text-zinc-300' : 'bg-gray-200 text-gray-700')
                                        }`}>
                                        {item.interventionPoint}
                                    </span>
                                </td>
                                <td className={`p-2 font-mono text-xs ${theme === 'dark' ? 'text-zinc-400' : 'text-zinc-500'}`}>{item.record}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
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

export default InspectionTestPlanCard;