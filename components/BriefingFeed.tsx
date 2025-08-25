import React from 'react';
import { IntelligenceCard, IntelligenceCardType } from '../types';
import { IconTriangleAlert, IconSparkles, IconMessageCircle, IconLoader, IconRefreshCw } from './icons';
import { parseMarkdown } from '../utils/markdownParser';

interface BriefingFeedProps {
    briefing: {
        cards: IntelligenceCard[];
        isLoading: boolean;
        error: string | null;
        lastUpdated: Date | null;
    };
    onRefreshBriefing: () => void;
}

const IntelligenceCardDisplay: React.FC<{ card: IntelligenceCard, index: number }> = ({ card, index }) => {
    const cardConfig = {
        [IntelligenceCardType.CRITICAL_RISK]: {
            Icon: IconTriangleAlert,
            iconClass: 'text-orange-400',
            borderClass: 'border-orange-500/30 bg-orange-900/20',
        },
        [IntelligenceCardType.OPPORTUNITY]: {
            Icon: IconSparkles,
            iconClass: 'text-blue-400',
            borderClass: 'border-blue-500/30 bg-blue-900/20',
        },
        [IntelligenceCardType.INFO]: {
            Icon: IconMessageCircle,
            iconClass: 'text-zinc-400',
            borderClass: 'border-zinc-800 bg-zinc-900/50',
        },
    };
    
    const config = cardConfig[card.type] || cardConfig[IntelligenceCardType.INFO];
    const CardIcon = config.Icon;

    return (
        <div className={`p-4 rounded-2xl border ${config.borderClass} animate-fade-in-stagger`} style={{ animationDelay: `${index * 50}ms` }}>
            <div className="flex items-start gap-3 mb-2">
                <CardIcon className={`${config.iconClass} flex-shrink-0 mt-0.5`} size={20} />
                <div className="flex-grow">
                    <h4 className="font-bold text-white text-base">{card.title}</h4>
                    <p className="text-xs text-zinc-500 font-mono">{card.timestamp}</p>
                </div>
            </div>
            <div className="pl-8">
                <div
                    className="prose prose-sm prose-zinc max-w-none text-zinc-300 prose-strong:text-white"
                    dangerouslySetInnerHTML={{ __html: parseMarkdown(card.message) }}
                />
                <p className="text-xs text-zinc-500 mt-2">Source: {card.source.join(', ')}</p>
            </div>
        </div>
    );
};


const BriefingFeed: React.FC<BriefingFeedProps> = ({ briefing, onRefreshBriefing }) => {
    const { cards, isLoading, error, lastUpdated } = briefing;

    if (isLoading && cards.length === 0) {
        return (
             <div className="p-4 rounded-2xl border border-zinc-800 bg-zinc-900 flex flex-col items-center justify-center gap-4 animate-pulse min-h-[150px]">
                <IconLoader className="animate-spin text-zinc-500" size={24} />
                <div className='text-center'>
                    <h4 className="font-bold text-zinc-400">Generating AI Briefing...</h4>
                    <p className="text-sm text-zinc-500">Synthesizing project data.</p>
                </div>
            </div>
        );
    }
    
    if (error) {
        return (
            <div className="p-4 rounded-2xl border border-orange-500/30 bg-orange-900/20 flex items-center gap-4">
                <IconTriangleAlert className="text-orange-300 flex-shrink-0" size={24} />
                <div>
                    <h4 className="font-bold text-white">Could not generate briefing</h4>
                    <p className="text-orange-300/80 text-sm">{error}</p>
                </div>
            </div>
        );
    }

    if (cards.length === 0) {
        return (
            <div className="p-4 rounded-2xl border border-zinc-800 bg-zinc-900/50 flex flex-col items-center justify-center text-center min-h-[150px]">
                <IconSparkles size={24} className="text-zinc-500 mb-2"/>
                <h4 className="font-bold text-white">Briefing Clear</h4>
                <p className="text-sm text-zinc-400">No critical items or opportunities detected at this time.</p>
            </div>
        );
    }
    
    const timeSinceUpdate = lastUpdated ? Math.round((new Date().getTime() - lastUpdated.getTime()) / 60000) : 0;
    const updateText = timeSinceUpdate < 1 ? 'just now' : `${timeSinceUpdate}m ago`;

    return (
        <div>
            <div className="flex justify-between items-center mb-3 px-1">
                <div className="flex items-center gap-3">
                    <IconSparkles className="text-purple-400" size={20}/>
                    <h4 className="font-bold text-white text-base">AI Co-pilot Briefing</h4>
                </div>
                <div className="flex items-center gap-2">
                    <p className="text-xs text-zinc-500 font-mono">
                        Updated: {updateText}
                    </p>
                    <button
                        onClick={onRefreshBriefing}
                        disabled={isLoading}
                        className="p-1 rounded-full text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-wait"
                        aria-label="Refresh Briefing"
                    >
                        <IconRefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
                    </button>
                </div>
            </div>
            <div className="space-y-3">
                {cards.map((card, index) => (
                    <IntelligenceCardDisplay key={card.id} card={card} index={index} />
                ))}
            </div>
        </div>
    );
};

export default BriefingFeed;