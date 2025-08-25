import React, { useState, useEffect, useRef } from 'react';
import { parseMarkdown } from '../utils/markdownParser';
import { IconMic, IconSparkles, IconLoader, IconLink } from './icons';
import { AppMode } from '../types';

type ContextCaptureState = 'idle' | 'capturing' | 'captured';

interface FloatingTranscriptProps {
    currentMode: AppMode;
    contextCaptureState: ContextCaptureState;
    isListening: boolean;
    isAiResponding: boolean;
    interimTranscript: string;
    captionText: string;
}

const FloatingTranscript: React.FC<FloatingTranscriptProps> = ({
    currentMode,
    contextCaptureState,
    isListening,
    isAiResponding,
    interimTranscript,
    captionText,
}) => {
    const [visible, setVisible] = useState(false);
    const [currentText, setCurrentText] = useState('');
    const [currentIcon, setCurrentIcon] = useState<React.ElementType>(() => IconMic);
    const [currentGlow, setCurrentGlow] = useState('');
    const [currentIconColor, setCurrentIconColor] = useState('');

    const captionRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Handle context capture states first, as they take priority
        if (contextCaptureState === 'capturing') {
            setVisible(true);
            setCurrentText('Capturing screen & camera context...');
            setCurrentIcon(() => IconLoader);
            setCurrentGlow('animate-pulse-glow-blue');
            setCurrentIconColor('text-blue-400');
            return;
        }
        if (contextCaptureState === 'captured') {
            setVisible(true);
            setCurrentText('Context captured. Ask your question.');
            setCurrentIcon(() => IconLink);
            setCurrentGlow('animate-pulse-glow-blue');
            setCurrentIconColor('text-blue-400');
            return;
        }

        // --- NEW LOGIC: Show content, not state ---
        if (interimTranscript) {
             // If user is speaking, ALWAYS show their transcript.
            setVisible(true);
            setCurrentText(interimTranscript);
            setCurrentIcon(() => IconMic);
            setCurrentGlow('animate-pulse-glow-blue');
            setCurrentIconColor('text-blue-400');
        } else if (captionText) {
             // If there's an AI caption, show that. This is the new "displaying" state.
            setVisible(true);
            setCurrentText(captionText);
            setCurrentIcon(() => IconSparkles);
             // Use a less intense glow for the static "displaying" state.
            setCurrentGlow(isAiResponding ? 'animate-pulse-glow-purple' : '');
            setCurrentIconColor('text-purple-400');
        } else if (isAiResponding && currentMode !== 'ANALYSIS') {
            // Show "Analyzing..." only if the AI is busy but hasn't produced text yet.
            setVisible(true);
            setCurrentText('Analyzing...');
            setCurrentIcon(() => IconLoader);
            setCurrentGlow('animate-pulse-glow-purple');
            setCurrentIconColor('text-purple-400');
        } else {
             // Hide the bar if there's nothing to say.
            setVisible(false);
        }
    }, [currentMode, contextCaptureState, isAiResponding, interimTranscript, captionText, isListening]);

    useEffect(() => {
        if (captionRef.current) {
            captionRef.current.scrollTop = captionRef.current.scrollHeight;
        }
    }, [currentText]);


    if (!visible) {
        return null;
    }

    const Icon = currentIcon;
    const isThinking = (isAiResponding && !captionText && currentMode !== 'ANALYSIS') || contextCaptureState === 'capturing';

    return (
        <div
            className="fixed top-20 left-0 right-0 w-full z-20 flex justify-center px-4 animate-slide-in-down"
            aria-live="assertive"
            aria-atomic="true"
        >
            <div
                className={`flex items-start gap-4 w-full max-w-xl
                           bg-zinc-900/70 backdrop-blur-xl
                           rounded-2xl px-4 py-3
                           border border-zinc-800 shadow-2xl
                           transition-all duration-300 ${currentGlow}`}
            >
                <Icon
                    size={20}
                    className={`${currentIconColor} ${isThinking ? 'animate-spin' : ''} flex-shrink-0 mt-1`}
                    aria-hidden="true"
                />
                <div
                  ref={captionRef}
                  className="flex-grow prose prose-base prose-invert max-w-none max-h-[4.5rem] overflow-y-auto no-scrollbar pr-2"
                  dangerouslySetInnerHTML={{ __html: parseMarkdown(currentText || '&nbsp;') }}
                />
            </div>
        </div>
    );
};

export default FloatingTranscript;