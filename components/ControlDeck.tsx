import React, { useState, useCallback, useEffect } from 'react';
import { IconActivity, IconMessageCircle, IconArchive, IconLayers, IconCamera, IconLoader, IconBuilding, IconStop, IconPause, IconVideo, IconUpload, IconX, IconSparkles } from './icons';
import { DashboardData, LogItem, AppMode, AnalysisMessage, ReportablePayload, TimelineItem } from '../types';
import DashboardDisplay from './DashboardDisplay';
import LogFeed from './LogFeed';
import AnalysisThread from './AnalysisThread';

type Tab = 'briefing' | 'analysis' | 'log';

interface ControlDeckProps {
    isAnalyzing: boolean;
    currentMode: AppMode;
    onModeChange: (mode: AppMode) => void;
    activeTab: Tab;
    onTabChange: (tab: Tab) => void;
    dashboardData: DashboardData | null;
    logItems: LogItem[];
    analysisThread: AnalysisMessage[];
    onCapture: () => void;
    onStartCoPilotQuery: () => void;
    isLiveAnalysisPaused: boolean;
    onToggleLivePause: () => void;
    isListening: boolean;
    startListening: () => void;
    stopListening: () => void;
    interimTranscript: string;
    onTextSubmit: (text: string) => void;
    onToggleTask: (taskId: string) => void;
    onInterrupt: () => void;
    onSaveCalculation: (message: AnalysisMessage) => void;
    timeline: TimelineItem[];
    analysisTabNotification: boolean;
    briefingTabNotification: boolean;
    pendingAnalysisQuery: string;
    onClearPendingQuery: () => void;
    onRefreshBriefing: () => void;
}

const TabButton: React.FC<{
    icon: React.ElementType;
    label: string;
    isActive: boolean;
    onClick: () => void;
    hasNotification?: boolean;
}> = ({ icon: Icon, label, isActive, onClick, hasNotification }) => (
    <button
        onClick={onClick}
        className={`relative flex-1 flex items-center justify-center gap-2 py-3 rounded-t-lg transition-colors duration-300 text-xs font-semibold border-b-2 ${
            isActive ? 'border-blue-500 text-blue-400' : 'border-transparent text-zinc-400 hover:bg-white/5 hover:text-zinc-200'
        }`}
    >
        <Icon size={14} />
        <span>{label}</span>
        {hasNotification && (
            <span className="absolute top-2 right-1/2 translate-x-8 w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
        )}
    </button>
);

const ModeButton: React.FC<{ label: string; isActive: boolean; onClick: () => void }> = ({ label, isActive, onClick }) => (
    <button
        onClick={onClick}
        className={`px-4 py-1.5 rounded-full text-sm font-bold transition-all duration-300 transform active:scale-95 ${
            isActive ? 'bg-blue-500 text-white shadow-lg' : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
        }`}
    >
        {label}
    </button>
);

const ModeSelector: React.FC<{ currentMode: AppMode; onModeChange: (mode: AppMode) => void; isActionDisabled: boolean }> = ({ currentMode, onModeChange, isActionDisabled }) => (
    <div className={`flex items-center justify-center p-1 rounded-full bg-zinc-900/60 border border-zinc-800 transition-opacity ${isActionDisabled ? 'opacity-50 pointer-events-none' : ''}`}>
        <ModeButton label="Analysis" isActive={currentMode === 'ANALYSIS'} onClick={() => onModeChange('ANALYSIS')} />
        <ModeButton label="Live" isActive={currentMode === 'LIVE'} onClick={() => onModeChange('LIVE')} />
        <ModeButton label="Co-Pilot" isActive={currentMode === 'COPILOT'} onClick={() => onModeChange('COPILOT')} />
    </div>
);

const LiveControlHub: React.FC<{
    onStopSession: () => void;
    onToggleLivePause: () => void;
    isLiveAnalysisPaused: boolean;
    onStartCoPilotQuery: () => void;
}> = ({ onStopSession, onToggleLivePause, isLiveAnalysisPaused, onStartCoPilotQuery }) => {
    return (
        <div className="flex items-center justify-center w-full h-[88px] gap-6">
            <button
                onClick={onStartCoPilotQuery}
                aria-label="Start Co-Pilot Query with Screen Context"
                className="w-14 h-14 rounded-full flex items-center justify-center bg-zinc-800/80 hover:bg-zinc-700 text-white transition-colors duration-200 active:scale-95"
            >
                <IconUpload size={24} />
            </button>
            
            <button
                onClick={onToggleLivePause}
                aria-label={isLiveAnalysisPaused ? "Resume Session" : "Pause Session"}
                className="w-20 h-20 rounded-full flex items-center justify-center bg-white text-black transition-colors duration-200 active:scale-95"
            >
                {isLiveAnalysisPaused ? <IconVideo size={36} /> : <IconPause size={36} />}
            </button>
            
            <button
                onClick={onStopSession}
                aria-label="Stop Live Session"
                className="w-14 h-14 rounded-full flex items-center justify-center bg-red-500 hover:bg-red-600 text-white transition-colors duration-200 active:scale-95"
            >
                <IconX size={28} />
            </button>
        </div>
    );
};


const ControlDeck: React.FC<ControlDeckProps> = (props) => {
    const { 
        currentMode,
        onModeChange,
        activeTab,
        onTabChange,
        onCapture,
        isAnalyzing,
        analysisThread,
        dashboardData,
        logItems,
        onStartCoPilotQuery,
        isLiveAnalysisPaused,
        onToggleLivePause,
        isListening,
        startListening,
        stopListening,
        interimTranscript,
        onTextSubmit,
        onToggleTask,
        onInterrupt,
        onSaveCalculation,
        timeline,
        analysisTabNotification,
        briefingTabNotification,
        pendingAnalysisQuery,
        onClearPendingQuery,
        onRefreshBriefing,
    } = props;
    
    const [height, setHeight] = useState(65);
    const [isDragging, setIsDragging] = useState(false);
    
    const handleDragStart = (e: React.MouseEvent | React.TouchEvent) => {
        if (currentMode !== 'ANALYSIS') return;
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragMove = useCallback((e: MouseEvent | TouchEvent) => {
        if (!isDragging) return;

        const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
        const windowHeight = window.innerHeight;
        const newHeight = ((windowHeight - clientY) / windowHeight) * 100;
        
        const minHeight = 20;
        const maxHeight = 95; // Increased max height

        if (newHeight >= minHeight && newHeight <= maxHeight) {
            setHeight(newHeight);
        } else if (newHeight > maxHeight) {
            setHeight(maxHeight);
        } else if (newHeight < minHeight) {
            setHeight(minHeight);
        }
    }, [isDragging]);

    const handleDragEnd = useCallback(() => {
        setIsDragging(false);
    }, []);

    useEffect(() => {
        if (isDragging) {
            document.body.style.cursor = 'row-resize';
            window.addEventListener('mousemove', handleDragMove);
            window.addEventListener('mouseup', handleDragEnd);
            window.addEventListener('touchmove', handleDragMove, { passive: false });
            window.addEventListener('touchend', handleDragEnd);
        } else {
            document.body.style.cursor = 'default';
        }

        return () => {
            document.body.style.cursor = 'default';
            window.removeEventListener('mousemove', handleDragMove);
            window.removeEventListener('mouseup', handleDragEnd);
            window.removeEventListener('touchmove', handleDragMove);
            window.removeEventListener('touchend', handleDragEnd);
        };
    }, [isDragging, handleDragMove, handleDragEnd]);
    
    const MainButtonIcon = isAnalyzing ? IconLoader : IconCamera;
    
    const deckClasses = [
        "absolute bottom-0 left-0 right-0 bg-black/50 backdrop-blur-2xl flex flex-col z-10",
        !isDragging ? "transition-all duration-300" : "",
        currentMode === 'ANALYSIS' ? "rounded-t-3xl border-t border-zinc-700/80 overflow-hidden" : ""
    ].filter(Boolean).join(" ");

    return (
        <div
            className={deckClasses}
            style={{ height: currentMode === 'ANALYSIS' ? `${height}%` : 'auto' }}
        >
            {/* Draggable Panel for ANALYSIS mode */}
            {currentMode === 'ANALYSIS' && (
                <>
                    <div
                        onMouseDown={handleDragStart}
                        onTouchStart={handleDragStart}
                        className="relative w-full h-8 flex-shrink-0 flex items-center justify-center cursor-row-resize touch-none"
                    >
                        <div className="w-10 h-1.5 bg-zinc-600 rounded-full" aria-hidden="true"></div>
                    </div>

                    <div className="flex-grow flex flex-col min-h-0">
                        <div className="flex-shrink-0 flex items-center border-b border-zinc-800/80 px-2">
                            <TabButton icon={IconSparkles} label="Briefing" isActive={activeTab === 'briefing'} onClick={() => onTabChange('briefing')} hasNotification={briefingTabNotification && activeTab !== 'briefing'} />
                            <TabButton icon={IconMessageCircle} label="Analysis" isActive={activeTab === 'analysis'} onClick={() => onTabChange('analysis')} hasNotification={analysisTabNotification && activeTab !== 'analysis'} />
                            <TabButton icon={IconArchive} label="Log" isActive={activeTab === 'log'} onClick={() => onTabChange('log')} />
                        </div>
                        <div className={`flex-grow min-h-0 ${activeTab !== 'analysis' ? 'overflow-y-auto no-scrollbar' : 'overflow-hidden'}`}>
                            {/* Panel content with "keep-alive" strategy */}
                            <div className={`h-full ${activeTab === 'analysis' ? '' : 'hidden'}`}>
                                <AnalysisThread
                                    history={analysisThread}
                                    isAnalyzing={isAnalyzing}
                                    isListening={isListening}
                                    onStartListening={startListening}
                                    onStopListening={stopListening}
                                    interimTranscript={interimTranscript}
                                    onTextSubmit={onTextSubmit}
                                    onInterrupt={onInterrupt}
                                    onSaveCalculation={onSaveCalculation}
                                    timeline={timeline}
                                    pendingAnalysisQuery={pendingAnalysisQuery}
                                    onClearPendingQuery={onClearPendingQuery}
                                />
                            </div>
                            <div className={activeTab === 'briefing' ? 'h-full' : 'hidden'}>
                                <DashboardDisplay data={dashboardData} onToggleTask={onToggleTask} onRefreshBriefing={onRefreshBriefing} />
                            </div>
                            <div className={activeTab === 'log' ? '' : 'hidden'}>
                                <LogFeed items={logItems} />
                            </div>
                        </div>
                    </div>
                </>
            )}

            {/* Unified Action Bar */}
            <div className="relative flex-shrink-0 flex flex-col items-center px-4 pt-3 pb-4 mt-1 gap-y-3">
                {currentMode === 'LIVE' ? (
                    <LiveControlHub
                        onStopSession={() => onModeChange('ANALYSIS')}
                        onToggleLivePause={onToggleLivePause}
                        isLiveAnalysisPaused={isLiveAnalysisPaused}
                        onStartCoPilotQuery={onStartCoPilotQuery}
                    />
                ) : (
                    <>
                        <ModeSelector currentMode={currentMode} onModeChange={onModeChange} isActionDisabled={isAnalyzing && currentMode !== 'COPILOT'} />

                        <div className="w-full h-[88px] flex items-center justify-center">
                            <div className="flex-shrink-0">
                                <button
                                    onClick={onCapture}
                                    disabled={isAnalyzing || currentMode === 'COPILOT'}
                                    aria-label="Capture Photo"
                                    className={`w-20 h-20 rounded-full flex items-center justify-center transition-all duration-200 transform hover:scale-105 active:scale-95 bg-white text-black ${
                                        (isAnalyzing || currentMode === 'COPILOT') ? 'opacity-40 cursor-not-allowed' : ''
                                    }`}
                                >
                                   <MainButtonIcon size={40} className={isAnalyzing ? 'animate-spin' : ''} />
                                </button>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default ControlDeck;