import React, { useState } from 'react';
import { CalculationStep, Verification, StructuralAnalysisResult, ReinforcedBeamResult, SlenderColumnResult } from '../types';
import { IconLayers, IconRuler, IconWrench, IconShieldCheck, IconSparkles } from './icons';
import MessageActionBar from './MessageActionBar';
import LatexRenderer from './LatexRenderer';
import EngineeringDrawing from './EngineeringDrawing';
import StructuralDiagram from './StructuralDiagram';
import PMInteractionDiagram from './PMInteractionDiagram';
import DataBlock from './DataBlock';

type CardTheme = 'light' | 'dark';

const StepCard: React.FC<{ step: CalculationStep, index: number, theme: CardTheme }> = ({ step, index, theme }) => (
    <div className={`p-3 rounded-lg border ${theme === 'dark' ? 'bg-zinc-900/50 border-zinc-800' : 'bg-gray-50 border-gray-200'}`}>
        <div className="flex justify-between items-start">
            <h5 className={`font-semibold text-sm ${theme === 'dark' ? 'text-white' : 'text-zinc-800'}`}>{index + 1}. {step.title}</h5>
            <div className="flex-shrink-0 ml-4 text-right">
                <p className={`text-xs font-mono px-2 py-0.5 rounded ${theme === 'dark' ? 'text-zinc-400 bg-zinc-700/50' : 'text-zinc-600 bg-gray-200'}`}>
                    {step.standardReference}
                </p>
            </div>
        </div>
        <div className="mt-2 space-y-1">
            {step.derivationSteps.map((line, i) => (
                <LatexRenderer key={i} latexString={line} theme={theme} />
            ))}
        </div>
    </div>
);

interface EngineeringCalculationCardProps {
    id: string;
    result: StructuralAnalysisResult;
    title?: string;
    onSave?: () => void;
    isSaved?: boolean;
    theme?: CardTheme;
}

const EngineeringCalculationCard: React.FC<EngineeringCalculationCardProps> = ({ id, result, title, onSave, isSaved, theme = 'dark' }) => {
    const TABS_CONFIG = {
        REINFORCED_BEAM_DESIGN: [
            { id: 'summary', icon: IconLayers, label: 'Summary', enabled: true },
            { id: 'flexure', icon: IconRuler, label: 'Flexure Calcs', enabled: true },
            { id: 'shear', icon: IconWrench, label: 'Shear Calcs', enabled: (result as ReinforcedBeamResult).shearCalculationSteps?.length > 0 },
            { id: 'verifications', icon: IconShieldCheck, label: 'Verifications', enabled: true },
        ],
        SLENDER_COLUMN_DESIGN: [
            { id: 'summary', icon: IconLayers, label: 'Summary', enabled: true },
            { id: 'magnification', icon: IconRuler, label: 'Magnification Calcs', enabled: true },
            { id: 'verifications', icon: IconShieldCheck, label: 'Verifications', enabled: true },
        ],
        DEFAULT: [
            { id: 'summary', icon: IconLayers, label: 'Summary', enabled: true },
            { id: 'calculations', icon: IconRuler, label: 'Calculations', enabled: true },
            { id: 'verifications', icon: IconShieldCheck, label: 'Verifications', enabled: true },
        ]
    };

    const currentTabs = TABS_CONFIG[result.calculationType as keyof typeof TABS_CONFIG] || TABS_CONFIG.DEFAULT;
    const [activeTab, setActiveTab] = useState(currentTabs[0].id);
    
    const TabButton: React.FC<{ tab: typeof currentTabs[0] }> = ({ tab }) => (
        <button
            onClick={() => setActiveTab(tab.id)}
            disabled={!tab.enabled}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-semibold rounded-t-lg border-b-2 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed ${
                activeTab === tab.id ? 'border-blue-500 text-white' : 'border-transparent text-zinc-400 hover:bg-zinc-800/50 hover:text-white'
            }`}
        >
            <tab.icon size={16} />
            {tab.label}
        </button>
    );

    const renderSummary = () => {
        return (
             <div className="p-4 space-y-4">
                {result.calculationType === 'REINFORCED_BEAM_DESIGN' && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                        <div className={`lg:col-span-1 p-2 rounded-lg flex items-center justify-center ${theme === 'dark' ? 'bg-zinc-950/50 border border-zinc-800' : 'bg-gray-100 border border-gray-200'}`}>
                            {(result as ReinforcedBeamResult).drawingSpec && <EngineeringDrawing spec={(result as ReinforcedBeamResult).drawingSpec!} theme={theme} />}
                        </div>
                        <div className={`lg:col-span-2 p-2 rounded-lg ${theme === 'dark' ? 'bg-zinc-950/50 border border-zinc-800' : 'bg-gray-100 border border-gray-200'}`}>
                            {(result as ReinforcedBeamResult).diagramData && <StructuralDiagram data={(result as ReinforcedBeamResult).diagramData!} theme={theme} />}
                        </div>
                    </div>
                )}
                 {result.calculationType === 'SLENDER_COLUMN_DESIGN' && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                        <div className={`lg:col-span-1 p-2 rounded-lg flex items-center justify-center ${theme === 'dark' ? 'bg-zinc-950/50 border border-zinc-800' : 'bg-gray-100 border border-gray-200'}`}>
                            {(result as SlenderColumnResult).drawingSpec && <EngineeringDrawing spec={(result as SlenderColumnResult).drawingSpec!} theme={theme} />}
                        </div>
                        <div className={`lg:col-span-2 p-2 rounded-lg flex items-center justify-center ${theme === 'dark' ? 'bg-zinc-950/50 border border-zinc-800' : 'bg-gray-100 border border-gray-200'}`}>
                            {(result as SlenderColumnResult).pmInteractionData && <PMInteractionDiagram data={(result as SlenderColumnResult).pmInteractionData!} theme={theme} />}
                        </div>
                    </div>
                )}

                <DataBlock title="Given Data" items={result.givenData} theme={theme} />
                <DataBlock title="Assumptions" items={result.assumptions} theme={theme} />

                <div>
                    <h4 className={`font-bold text-base mb-2 ${theme === 'dark' ? 'text-blue-300' : 'text-blue-600'}`}>{title}</h4>
                    <div className={`p-4 rounded-lg space-y-2 ${theme === 'dark' ? 'bg-blue-900/20 border border-blue-500/30' : 'bg-blue-50 border border-blue-200'}`}>
                        <p className={`text-sm ${theme === 'dark' ? 'text-zinc-300' : 'text-zinc-700'}`}>{result.conclusion.summary}</p>
                        <hr className={`${theme === 'dark' ? 'border-blue-500/30' : 'border-blue-200'} !my-2`} />
                        <p className={`text-base font-bold ${theme === 'dark' ? 'text-white' : 'text-zinc-900'}`}>
                        {result.conclusion.finalAnswer.name}: {result.conclusion.finalAnswer.value} {result.conclusion.finalAnswer.unit}
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    const renderContent = () => {
        switch(activeTab) {
            case 'summary':
                return renderSummary();
            case 'flexure':
            case 'magnification':
            case 'calculations':
                return (
                    <div className="p-4 space-y-3">
                         {result.calculationSteps.map((step, i) => <StepCard key={i} step={step} index={i} theme={theme} />)}
                    </div>
                );
            case 'shear':
                 if (result.calculationType === 'REINFORCED_BEAM_DESIGN' && (result as ReinforcedBeamResult).shearCalculationSteps) {
                     return (
                        <div className="p-4 space-y-3">
                             {(result as ReinforcedBeamResult).shearCalculationSteps!.map((step, i) => <StepCard key={i} step={step} index={i} theme={theme} />)}
                        </div>
                    );
                 }
                 return <div className='p-4 text-zinc-400'>No shear calculations provided.</div>;
            case 'verifications':
                return (
                     <div className="p-4 space-y-3">
                         {result.verifications.map((v, i) => <StepCard key={i} step={{...v, title: v.checkName, formula: '', derivationSteps: [v.evaluation]}} index={i} theme={theme} />)}
                    </div>
                );
            default: return null;
        }
    }
    

    return (
        <div id={id} className={`${theme === 'dark' ? 'bg-zinc-900 border-zinc-700' : 'bg-transparent border-transparent'} rounded-xl border`}>
            {/* Header */}
            <div className={`p-4 flex justify-between items-center ${theme === 'dark' ? '' : 'border-b border-gray-200'}`}>
                <h3 className={`text-lg font-bold ${theme === 'dark' ? 'text-white' : 'text-zinc-900'}`}>{title}</h3>
                <span className={`text-sm font-semibold px-3 py-1 rounded-full ${theme === 'dark' ? 'text-teal-300 bg-teal-900/50 border border-teal-500/30' : 'text-teal-700 bg-teal-50 border border-teal-200'}`}>{result.governingStandard}</span>
            </div>
            
            {/* Tabs */}
            <div className={`flex items-center border-b ${theme === 'dark' ? 'border-zinc-800' : 'border-gray-200'} mx-4`}>
                {currentTabs.map(tabInfo => <TabButton key={tabInfo.id} tab={tabInfo} />)}
            </div>

            {/* Content */}
            <div className="min-h-[200px]">
                {renderContent()}
            </div>
            
            <MessageActionBar onSaveToTimeline={onSave} isSaved={isSaved} theme={theme} />
        </div>
    );
};

const EngineeringCalculationCardWrapper: React.FC<EngineeringCalculationCardProps> = ({ theme = 'dark', ...props }) => {
    if (theme === 'light') {
        return <EngineeringCalculationCard {...props} theme={theme} />;
    }
    
    return (
        <div className="mb-6 animate-fade-in">
            <p className="font-semibold text-purple-400 text-sm flex items-center gap-2">
                 <IconSparkles size={16}/>
                 <span>FLOCORE AI</span>
            </p>
            <div className="mt-2 pl-8">
                <EngineeringCalculationCard {...props} theme="dark" />
            </div>
            <hr className="border-t border-zinc-800 my-6" />
        </div>
    );
};


export default EngineeringCalculationCardWrapper;
