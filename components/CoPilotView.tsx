import React, { useRef, useEffect, useState } from 'react';
import { parseMarkdown } from '../utils/markdownParser';
import { CoPilotStatus } from '../types';
import { IconLoader, IconMic, IconSparkles, IconX } from './icons';

interface CoPilotViewProps {
  status: CoPilotStatus;
  transcript: string;
  aiResponse: string | null;
  onEndSession: () => void;
}

// Helper component for the elegant Nexus orb
const NexusCore: React.FC<{ status: CoPilotStatus, volume: number }> = ({ status, volume }) => {
    switch (status) {
        case 'listening':
            const particleCount = 40;
            const radius = 96; // for a w-48 container

            // Calculate dynamic styles based on volume (0 to 1)
            const orbScale = 1 + volume * 0.05;
            const glowOpacity = 0.5 + volume * 0.5;
            const particleRingScale = 1 + volume * 0.1;

            return (
                 <div className="relative w-48 h-48 flex items-center justify-center">
                    {/* Particles Ring */}
                    <div className="absolute inset-0" style={{ transform: `scale(${particleRingScale})`, transition: 'transform 100ms ease-out' }}>
                        {Array.from({ length: particleCount }).map((_, i) => (
                            <div
                                key={i}
                                className="absolute top-1/2 left-1/2 w-1.5 h-1.5 bg-blue-300 rounded-full"
                                style={{
                                    transform: `rotate(${(i / particleCount) * 360}deg) translateX(${radius}px) scale(${0.5 + Math.random() * 0.5 + volume})`,
                                    opacity: 0.5 + Math.random() * 0.5,
                                    transition: 'transform 100ms ease-out',
                                }}
                            />
                        ))}
                    </div>

                    {/* The orb itself with dynamic style */}
                    <div 
                        className="absolute inset-0 bg-zinc-900/50 backdrop-blur-md rounded-full border-2 border-blue-500/80"
                        style={{
                            transform: `scale(${orbScale})`,
                            boxShadow: `0 0 ${10 + volume * 30}px rgba(59, 130, 246, ${glowOpacity})`,
                            transition: 'transform 100ms ease-out, box-shadow 100ms ease-out',
                        }}
                    ></div>
                    
                    {/* The icon */}
                    <div className="absolute inset-0 flex items-center justify-center text-blue-300 transition-colors duration-500">
                        <IconMic size={64} />
                    </div>
                </div>
            );
        case 'thinking':
            return (
                <div className="relative w-48 h-48 rounded-full flex items-center justify-center">
                    <div className="absolute inset-0 bg-zinc-900/50 backdrop-blur-md rounded-full border-2 border-purple-500/80 transition-colors duration-500"></div>
                    <div className="absolute inset-0 flex items-center justify-center text-purple-300">
                        <IconLoader size={48} className="animate-thinking-spin" />
                    </div>
                </div>
            );
        case 'speaking':
            return (
                <div className="relative w-48 h-48 rounded-full flex items-center justify-center animate-nexus-speak-pulse">
                    <div className="absolute inset-0 bg-zinc-900/50 backdrop-blur-md rounded-full border-2 border-cyan-500/80 transition-colors duration-500"></div>
                    <div className="absolute inset-0 flex items-center justify-center text-cyan-300">
                        <IconSparkles size={64} />
                    </div>
                </div>
            );
        case 'displaying':
             return (
                <div className="relative w-48 h-48 rounded-full flex items-center justify-center">
                    <div className="absolute inset-0 bg-zinc-900/50 backdrop-blur-md rounded-full border-2 border-cyan-500/50 transition-colors duration-500"></div>
                    <div className="absolute inset-0 flex items-center justify-center text-cyan-300">
                         <IconSparkles size={64} />
                    </div>
                </div>
            );
        default:
            return (
                 <div className="relative w-48 h-48 rounded-full flex items-center justify-center">
                    <div className="absolute inset-0 bg-zinc-900/50 backdrop-blur-md rounded-full border-2 border-zinc-700"></div>
                    <div className="absolute inset-0 flex items-center justify-center text-zinc-400">
                         <IconMic size={64} />
                    </div>
                </div>
            );
    }
};


const CoPilotView: React.FC<CoPilotViewProps> = ({
  status,
  transcript,
  aiResponse,
  onEndSession,
}) => {
  const responseContainerRef = useRef<HTMLDivElement>(null);
  const [volume, setVolume] = useState(0);
  const audioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameIdRef = useRef<number | null>(null);

  useEffect(() => {
    const setupAudio = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
            streamRef.current = stream;

            const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
            audioContextRef.current = audioContext;
            const source = audioContext.createMediaStreamSource(stream);
            const analyser = audioContext.createAnalyser();
            analyser.fftSize = 256;
            source.connect(analyser);

            const dataArray = new Uint8Array(analyser.frequencyBinCount);

            const tick = () => {
                analyser.getByteFrequencyData(dataArray);
                const avg = dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length;
                const normalizedVolume = Math.min(avg / 128, 1); // Normalize to 0-1 range
                setVolume(normalizedVolume);
                animationFrameIdRef.current = requestAnimationFrame(tick);
            };
            tick();
        } catch (err) {
            console.error("Error accessing microphone for visualization:", err);
        }
    };

    const cleanupAudio = () => {
        if (animationFrameIdRef.current) {
            cancelAnimationFrame(animationFrameIdRef.current);
            animationFrameIdRef.current = null;
        }
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
            audioContextRef.current.close();
            audioContextRef.current = null;
        }
        setVolume(0);
    };

    if (status === 'listening') {
        setupAudio();
    } else {
        cleanupAudio();
    }

    return () => {
        cleanupAudio();
    };
}, [status]);
  
  const getTextContent = () => {
      switch(status) {
          case 'listening':
              return { text: transcript || 'Listening...', color: 'text-zinc-300' };
          case 'thinking':
              return { text: 'Analyzing...', color: 'text-purple-300' };
          case 'speaking':
          case 'displaying':
              return { text: aiResponse, color: 'text-white' };
          default:
              return { text: 'Starting Co-Pilot...', color: 'text-zinc-500' };
      }
  };
  
  const { text, color } = getTextContent();

  useEffect(() => {
    if (responseContainerRef.current) {
      responseContainerRef.current.scrollTop = responseContainerRef.current.scrollHeight;
    }
  }, [text]);

  return (
    <div className="absolute inset-0 bg-black flex flex-col items-center justify-between p-8 text-white animate-fade-in">
      {/* Spacer to push content down from the top */}
      <div className="flex-1"></div>

      {/* Main Visualizer and Transcript */}
      <div className="flex flex-col items-center justify-center gap-12 text-center flex-shrink">
        <NexusCore status={status} volume={volume} />
        <div ref={responseContainerRef} className="h-40 max-h-40 overflow-y-auto no-scrollbar w-full max-w-2xl">
          <div
            className={`prose prose-xl prose-invert max-w-none transition-colors duration-500 ${color}`}
            dangerouslySetInnerHTML={{ __html: parseMarkdown(text || '&nbsp;') }}
          />
        </div>
      </div>
      
      {/* Spacer and End Session Button at the bottom */}
      <div className="flex-1 flex items-end justify-center">
        <button
          onClick={onEndSession}
          aria-label="End Co-Pilot Session"
          className="flex items-center justify-center gap-3 bg-zinc-800 hover:bg-zinc-700 active:bg-zinc-900 text-white font-bold py-3 px-8 rounded-full transition-all duration-300 transform active:scale-95 border border-zinc-700"
        >
          <IconX size={24} />
          <span className="text-lg">End Session</span>
        </button>
      </div>
    </div>
  );
};

export default CoPilotView;
