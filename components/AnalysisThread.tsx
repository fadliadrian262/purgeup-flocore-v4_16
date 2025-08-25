import React, { useRef, useEffect, useState } from 'react';
import { AnalysisMessage, ReportablePayload, TimelineItem, AnalysisResult } from '../types';
import { parseMarkdown } from '../utils/markdownParser';
import { IconMic, IconLoader, IconSend, IconSparkles, IconUser, IconFileText } from './icons';
import EngineeringCalculationCard from './EngineeringCalculationCard';
import GeotechnicalCalculationCard from './GeotechnicalCalculationCard';
import CalculationSkeletonCard from './CalculationSkeletonCard';
import DocumentCard from './DocumentCard';

const UserMessage: React.FC<{ message: AnalysisMessage }> = ({ message }) => (
    <div className="mb-6 animate-fade-in">
        <p className="font-semibold text-blue-400 text-sm flex items-center gap-2">
            <IconUser size={16} />
            <span>You</span>
        </p>
        <p className="text-white text-base mt-1 pl-8">{message.text}</p>
    </div>
);

const AIMessage: React.FC<{ message: AnalysisMessage }> = ({ message }) => {
    
    const formattedText = message.text ? parseMarkdown(message.text) : '';

    return (
        <div className="mb-6 animate-fade-in">
            <p className="font-semibold text-purple-400 text-sm flex items-center gap-2">
                 <IconSparkles size={16}/>
                 <span>FLOCORE AI</span>
            </p>
            <div className="mt-2 pl-8">
                 {message.isTyping ? (
                    <div className="flex items-center gap-2">
                        <IconLoader className="inline-block animate-spin" size={16} />
                        <span className="text-sm text-zinc-400 italic">Thinking...</span>
                    </div>
                 ) : (
                    <div
                        className="prose prose-sm prose-zinc max-w-none text-zinc-300"
                        dangerouslySetInnerHTML={{ __html: formattedText }}
                    />
                 )}
            </div>
            {!message.isTyping && <hr className="border-t border-zinc-800 my-6" />}
        </div>
    );
};

const AIAnalysisCard: React.FC<{ 
    message: AnalysisMessage; 
    timeline: TimelineItem[];
}> = ({ message, timeline }) => {
    if (message.isTyping) {
        return (
            <div className="mb-6 animate-fade-in">
                 <p className="font-semibold text-purple-400 text-sm flex items-center gap-2">
                     <IconSparkles size={16}/>
                     <span>FLOCORE AI</span>
                </p>
                 <div className="mt-2 pl-8">
                    <div className="p-4 bg-zinc-900 rounded-xl border border-zinc-800">
                        {message.image && (
                             <div className="relative">
                                <img src={message.image} alt="Site Analysis in progress" className="rounded-lg mb-3 w-full object-contain max-h-48 opacity-40" />
                                <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                                    <IconLoader className="animate-spin text-white" size={32} />
                                </div>
                            </div>
                        )}
                         <h4 className="font-bold text-white text-base mb-2">Analyzing Scene...</h4>
                         <p className="text-zinc-400 text-sm">The AI is inspecting the captured image.</p>
                    </div>
                </div>
            </div>
        );
    }
    
    const formattedSummary = message.analysisSummary ? parseMarkdown(message.analysisSummary) : '';


    return (
         <div className="mb-6 animate-fade-in">
            <p className="font-semibold text-purple-400 text-sm flex items-center gap-2">
                <IconSparkles size={16}/>
                <span>FLOCORE AI</span>
            </p>
            <div className="mt-2 space-y-4 pl-8">
                {message.image && (
                    <img src={message.image} alt="Site Analysis" className="rounded-xl w-full object-contain max-h-64 border border-zinc-800" />
                )}
                <div>
                     <h4 className="font-bold text-white text-base">AI Analysis Summary</h4>
                     <div
                        className="prose prose-sm prose-zinc max-w-none text-zinc-300 mt-1"
                        dangerouslySetInnerHTML={{ __html: formattedSummary }}
                    />
                </div>
            </div>
            <hr className="border-t border-zinc-800 my-6" />
        </div>
    );
};


interface AnalysisThreadProps {
    history: AnalysisMessage[];
    isAnalyzing: boolean;
    isListening: boolean;
    onStartListening: () => void;
    onStopListening: () => void;
    interimTranscript: string;
    onTextSubmit: (text: string) => void;
    onInterrupt: () => void;
    onSaveCalculation: (message: AnalysisMessage) => void;
    timeline: TimelineItem[];
    pendingAnalysisQuery: string;
    onClearPendingQuery: () => void;
}

const AnalysisThread: React.FC<AnalysisThreadProps> = ({ history, isAnalyzing, isListening, onStartListening, onStopListening, interimTranscript, onTextSubmit, onInterrupt, onSaveCalculation, timeline, pendingAnalysisQuery, onClearPendingQuery }) => {
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const [inputText, setInputText] = useState('');
    const textAreaRef = useRef<HTMLTextAreaElement>(null);
    const [maxInputHeight, setMaxInputHeight] = useState<number>();

    // This effect handles a pending query from voice input in another mode
    useEffect(() => {
        if (pendingAnalysisQuery) {
            setInputText(prev => (prev ? prev + ' ' : '') + pendingAnalysisQuery);
            onClearPendingQuery();
        }
    }, [pendingAnalysisQuery, onClearPendingQuery]);

    // This effect runs once on mount to calculate the max height for 10 lines
    useEffect(() => {
        const ta = textAreaRef.current;
        if (ta) {
            const style = window.getComputedStyle(ta);
            const lineHeight = parseFloat(style.lineHeight);
            const padding = parseFloat(style.paddingTop) + parseFloat(style.paddingBottom);
            // Fallback for browsers where `line-height` is 'normal'
            const effectiveLineHeight = isNaN(lineHeight) ? 1.2 * parseFloat(style.fontSize) : lineHeight;
            setMaxInputHeight(effectiveLineHeight * 10 + padding);
        }
    }, []);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [history, inputText]); // Also scroll when text input grows
    
    // Auto-resize textarea, with a cap, and handle empty state
    useEffect(() => {
        const ta = textAreaRef.current;
        if (ta) {
            const currentVal = ta.value;
            if (currentVal) {
                // When there is text, resize dynamically
                ta.style.height = 'auto'; // Reset height to get correct scrollHeight for shrinking
                
                if (maxInputHeight && ta.scrollHeight > maxInputHeight) {
                    ta.style.height = `${maxInputHeight}px`; // Cap the height
                } else {
                    ta.style.height = `${ta.scrollHeight}px`;
                }
            } else {
                // When empty, reset to initial single-line height to prevent scrolling
                ta.style.height = 'auto';
            }
        }
    }, [inputText, interimTranscript, maxInputHeight]);


    const handleSend = () => {
        if (inputText.trim()) {
            onTextSubmit(inputText.trim());
            setInputText('');
        }
    };
    
    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };
    
    const handleMicPress = () => {
        if (isAnalyzing) {
            onInterrupt();
        }
        setInputText('');
        onStartListening();
    };

    const displayedValue = inputText + (interimTranscript ? (inputText ? ' ' : '') + interimTranscript : '');
    const hasText = displayedValue.trim().length > 0;
    const showSendButton = hasText && !isListening;

    return (
        <div className="h-full flex flex-col p-4 pt-0">
            <div className="flex-grow overflow-y-auto no-scrollbar pt-4">
                {history.length === 0 && !isAnalyzing && (
                    <div className="flex flex-col items-center justify-center h-full text-zinc-500 text-center p-4">
                        <IconSparkles size={32} className="mb-4 text-purple-400" />
                        <p className="text-lg font-semibold text-white">FLOCORE AI Assistant</p>
                        <p className="text-sm">Ask a question or tap the camera to analyze a scene.</p>
                    </div>
                )}
                {history.map(msg => {
                    if (msg.author === 'user') {
                        return <UserMessage key={msg.id} message={msg} />;
                    }
                    if (msg.isTyping && (msg.type === 'structural' || msg.type === 'geotechnical' || msg.type === 'document')) {
                        return <CalculationSkeletonCard key={msg.id} type={'structural'} />;
                    }
                    if (msg.type === 'analysis') {
                        return <AIAnalysisCard key={msg.id} message={msg} timeline={timeline} />;
                    }
                    if (msg.type === 'structural' && msg.structuralCalculationPayload) {
                        return <EngineeringCalculationCard id={`structural-calculation-${msg.id}`} key={msg.id} result={msg.structuralCalculationPayload.result} title={msg.structuralCalculationPayload.task} onSave={() => onSaveCalculation(msg)} isSaved={!!msg.isArchived} />;
                    }
                    if (msg.type === 'geotechnical' && msg.geotechnicalCalculationPayload) {
                        return <GeotechnicalCalculationCard key={msg.id} result={msg.geotechnicalCalculationPayload.result} title={msg.geotechnicalCalculationPayload.task} onSave={() => onSaveCalculation(msg)} isSaved={!!msg.isArchived} />;
                    }
                    if (msg.type === 'document' && msg.documentPayload) {
                        return <DocumentCard key={msg.id} payload={msg.documentPayload} onSave={() => onSaveCalculation(msg)} isSaved={!!msg.isArchived} />;
                    }
                    return <AIMessage key={msg.id} message={msg} />;
                })}
                <div ref={messagesEndRef} />
            </div>

            <div className="flex-shrink-0 pt-3">
                 <div className="chat-input-container flex items-end gap-2 bg-zinc-900 border border-zinc-700 rounded-2xl p-2">
                    <textarea
                        ref={textAreaRef}
                        rows={1}
                        value={displayedValue}
                        onChange={(e) => setInputText(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={isListening ? 'Listening...' : "Ask a question..."}
                        className="flex-grow bg-transparent text-sm text-zinc-200 placeholder-zinc-500 focus:outline-none resize-none py-2 px-2"
                        disabled={isAnalyzing}
                    />
                     {showSendButton ? (
                        <button
                            onClick={handleSend}
                            disabled={isAnalyzing}
                            className="w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center transition-all duration-200 bg-blue-500 text-white disabled:opacity-50 active:scale-90"
                            aria-label="Send message"
                        >
                            <IconSend size={20} />
                        </button>
                    ) : (
                        <button
                            onMouseDown={handleMicPress}
                            onMouseUp={onStopListening}
                            onMouseLeave={onStopListening}
                            onTouchStart={handleMicPress}
                            onTouchEnd={onStopListening}
                            disabled={isAnalyzing && !history.some(m => m.isTyping)}
                            className={`w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center transition-all duration-200 active:scale-90 ${
                                isListening ? 'bg-blue-500 text-white animate-pulse-glow-blue' : 'bg-zinc-700 text-zinc-300'
                            } disabled:opacity-50`}
                            aria-label={isListening ? "Listening..." : "Hold to speak"}
                        >
                            <IconMic size={22} />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AnalysisThread;