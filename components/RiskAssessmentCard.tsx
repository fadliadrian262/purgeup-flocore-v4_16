import React from 'react';
import { RiskAssessment } from '../types';
import { IconSparkles, IconTriangleAlert } from './icons';
import MessageActionBar from './MessageActionBar';

type CardTheme = 'light' | 'dark';

interface RiskAssessmentCardProps {
    result: RiskAssessment,
    title: string,
    onSave?: () => void;
    isSaved?: boolean;
    theme?: CardTheme;
}

const getRiskColor = (rating: number) => {
    if (rating >= 15) return { text: 'text-red-300', bg: 'bg-red-500/20', border: 'border-red-500/30' }; // High
    if (rating >= 5) return { text: 'text-yellow-300', bg: 'bg-yellow-500/20', border: 'border-yellow-500/30' }; // Medium
    return { text: 'text-green-300', bg: 'bg-green-500/20', border: 'border-green-500/30' }; // Low
};


const RiskAssessmentCard: React.FC<RiskAssessmentCardProps> = ({ result, title, onSave, isSaved, theme = 'dark' }) => {
    
    const CardContent = (
         <div className={`p-4 rounded-xl border space-y-5 ${theme === 'dark' ? 'bg-zinc-900 border-zinc-700' : 'bg-transparent border-transparent'}`}>
            {/* Header */}
            <div className={`flex justify-between items-start pb-4 ${theme === 'dark' ? 'border-b border-zinc-800' : 'border-b border-gray-200'}`}>
                <div>
                    <h3 className={`text-lg font-bold ${theme === 'dark' ? 'text-white' : 'text-zinc-900'}`}>{title}</h3>
                    <p className={`text-sm font-semibold mt-1 ${theme === 'dark' ? 'text-zinc-400' : 'text-zinc-600'}`}>Activity: {result.activity}</p>
                </div>
                <div className="text-right">
                    <p className={`text-sm font-semibold ${theme === 'dark' ? 'text-zinc-300' : 'text-zinc-600'}`}>{result.assessmentDate}</p>
                    <p className={`text-xs ${theme === 'dark' ? 'text-zinc-400' : 'text-zinc-500'}`}>Assessor: {result.assessor}</p>
                </div>
            </div>

            {/* Risk Table */}
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className={`${theme === 'dark' ? 'text-zinc-400' : 'text-zinc-600'}`}>
                        <tr>
                            <th className="p-2">Hazard / Risk</th>
                            <th className="p-2 text-center">L</th>
                            <th className="p-2 text-center">S</th>
                            <th className="p-2 text-center">Rating</th>
                            <th className="p-2">Mitigation Measures</th>
                        </tr>
                    </thead>
                    <tbody>
                        {result.risks.map((risk, index) => {
                            const colors = getRiskColor(risk.riskRating);
                            return (
                                <tr key={index} className={`border-t ${theme === 'dark' ? 'border-zinc-800' : 'border-gray-200'}`}>
                                    <td className="p-2 font-medium">
                                        <p className={`${theme === 'dark' ? 'text-white' : 'text-zinc-800'}`}>{risk.hazard}</p>
                                        <p className={`${theme === 'dark' ? 'text-zinc-400' : 'text-zinc-600'} text-xs`}>{risk.risk}</p>
                                    </td>
                                    <td className="p-2 text-center font-mono">{risk.likelihood}</td>
                                    <td className="p-2 text-center font-mono">{risk.severity}</td>
                                    <td className="p-2 text-center font-bold">
                                        <span className={`px-3 py-1 rounded-full text-xs ${colors.bg} ${colors.text} ${colors.border}`}>
                                            {risk.riskRating}
                                        </span>
                                    </td>
                                    <td className={`p-2 ${theme === 'dark' ? 'text-zinc-300' : 'text-zinc-700'}`}>{risk.mitigation}</td>
                                </tr>
                            );
                        })}
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

export default RiskAssessmentCard;