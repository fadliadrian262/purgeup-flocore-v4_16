import React, { useState } from 'react';
import { GeotechnicalAnalysisResult, ShallowFoundationResult, CalculationStep, Verification } from '../types';
import { IconSparkles, IconLayers, IconRuler, IconShieldCheck, IconGlobe } from './icons';
import MessageActionBar from './MessageActionBar';
import LatexRenderer from './LatexRenderer';
import GeotechnicalVisualizer from './GeotechnicalVisualizer';
import DataBlock from './DataBlock';

type CardTheme = 'light' | 'dark';

const StepCard: React.FC<{ step: CalculationStep & { theoryReference: string }, index: number, theme: CardTheme }> = ({ step, index, theme }) => (
    <div className={`p-3 rounded-lg border ${theme === 'dark' ? 'bg-zinc-900/50 border-zinc-800' : 'bg-gray-50 border-gray-200'}`}>
        <div className="flex justify-between items-start">
            <h5 className={`font-semibold text-sm ${theme === 'dark' ? 'text-white' : 'text-zinc-800'}`}>{index + 1}. {step.title}</h5>
            <div className="flex-shrink-0 ml-4 text-right">
                <p className={`text-xs font-mono px-2 py-0.5 rounded ${theme === 'dark' ? 'text-zinc-400 bg-zinc-700/50' : 'text-zinc-600 bg-gray-200'}`}>
                    {step.theoryReference}
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

interface GeotechnicalCalculationCardProps { 
    result: GeotechnicalAnalysisResult; 
    title?: string; 
    onSave?: () => void; 
    isSaved?: boolean;
    theme?: CardTheme;
}

const GeotechnicalCalculationCard: React.FC<GeotechnicalCalculationCardProps> = ({ result, title, onSave, isSaved, theme = 'dark' }) => {
    const isShallowFoundation = result.calculationType === 'SHALLOW_FOUNDATION_BEARING_CAPACITY';
    const hasSettlement = isShallowFoundation && (result as ShallowFoundationResult).settlementCalculation;

    const tabs = [
        { id: 'summary', icon: IconLayers, label: 'Summary', enabled: true },
        { id: 'bearing', icon: IconRuler, label: 'Bearing Calcs', enabled: true },
        { id: 'settlement', icon: IconRuler, label: 'Settlement Calcs', enabled: !!hasSettlement },
        { id: 'verifications', icon: IconShieldCheck, label: 'Verifications', enabled: true },
    ];
    const [activeTab, setActiveTab] = useState('summary');

    const TabButton: React.FC<{ tab: typeof tabs[0] }> = ({ tab }) => (
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

    const renderSummary = () => (
        <div className="p-4 space-y-4">
            {isShallowFoundation && (result as ShallowFoundationResult).drawingSpec && (
                <div className={`p-2 rounded-lg border ${theme === 'dark' ? 'bg-zinc-950/50 border-zinc-800' : 'bg-gray-100 border-gray-200'}`}>
                    <GeotechnicalVisualizer spec={(result as ShallowFoundationResult).drawingSpec!} theme={theme} />
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

    const renderBearingCalcs = () => (
        <div className="p-4 space-y-3">
            {result.calculationSteps.map((step, i) => <StepCard key={i} step={step} index={i} theme={theme} />)}
        </div>
    );
    
    const renderSettlementCalcs = () => {
        if (!hasSettlement) return <div className="p-4 text-zinc-400">No settlement calculation provided.</div>;
        const settlementResult = (result as ShallowFoundationResult).settlementCalculation!;
        return (
             <div className="p-4 space-y-3">
                 {settlementResult.calculationSteps.map((step, i) => <StepCard key={i} step={step} index={i} theme={theme} />)}
            </div>
        );
    };

    const renderVerifications = () => (
        <div className="p-4 space-y-3">
             {result.verifications.map((v, i) => <StepCard key={i} step={{...v, title: v.checkName, formula: '', derivationSteps: [v.evaluation], theoryReference: v.standardReference}} index={i} theme={theme} />)}
             {hasSettlement && (result as ShallowFoundationResult).settlementCalculation!.verifications.map((v, i) => <StepCard key={`settle-v-${i}`} step={{...v, title: v.checkName, formula: '', derivationSteps: [v.evaluation], theoryReference: v.standardReference}} index={i} theme={theme} />)}
        </div>
    );

    const renderContent = () => {
        switch(activeTab) {
            case 'summary': return renderSummary();
            case 'bearing': return renderBearingCalcs();
            case 'settlement': return renderSettlementCalcs();
            case 'verifications': return renderVerifications();
            default: return null;
        }
    };

    const CardContent = (
        <div id={`geotechnical-calculation-${result.problemStatement.slice(0, 10)}`} className={`${theme === 'dark' ? 'bg-zinc-900 border-zinc-700' : 'bg-transparent border-transparent'} rounded-xl border`}>
            {/* Header */}
            <div className={`p-4 flex justify-between items-center ${theme === 'dark' ? '' : 'border-b border-gray-200'}`}>
                <h3 className={`text-lg font-bold ${theme === 'dark' ? 'text-white' : 'text-zinc-900'}`}>{title}</h3>
                <span className={`text-sm font-semibold px-3 py-1 rounded-full ${theme === 'dark' ? 'text-teal-300 bg-teal-900/50 border border-teal-500/30' : 'text-teal-700 bg-teal-50 border border-teal-200'}`}>{result.governingTheory}</span>
            </div>
            
            {/* Tabs */}
            <div className={`flex items-center border-b ${theme === 'dark' ? 'border-zinc-800' : 'border-gray-200'} mx-4`}>
                {tabs.map(tabInfo => <TabButton key={tabInfo.id} tab={tabInfo} />)}
            </div>

            {/* Content */}
            <div className="min-h-[200px]">
                {renderContent()}
            </div>
            
            <MessageActionBar onSaveToTimeline={onSave} isSaved={isSaved} theme={theme} />
        </div>
    );
    
     if (theme === 'light') {
        return CardContent;
    }

    return (
        <div className="mb-6 animate-fade-in">
            <p className="font-semibold text-purple-400 text-sm flex items-center gap-2">
                 <IconSparkles size={16}/>
                 <span>FLOCORE AI</span>
            </p>
            <div className="mt-2 pl-8">
                {CardContent}
            </div>
            <hr className="border-t border-zinc-800 my-6" />
        </div>
    );
};

export default GeotechnicalCalculationCard;
