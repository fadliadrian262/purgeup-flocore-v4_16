import React, { useState, useEffect, useRef } from 'react';
import { User } from '../types';
import { IconMic, IconCheckCircle2, IconHardHat, IconMessageCircle, IconFileText, IconCheck, IconMail, IconFolderSync, IconWhatsApp, IconSparkles } from './icons';
import * as authService from '../services/authService';

interface OnboardingGuideProps {
  user: User;
  onComplete: (updatedUser: User) => void;
}

// A component for the progress bar at the bottom
const ProgressBar: React.FC<{ current: number; total: number }> = ({ current, total }) => (
  <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-2 z-10">
    {Array.from({ length: total }).map((_, i) => (
      <div
        key={i}
        className={`h-2 rounded-full transition-all duration-500 ${
          i + 1 === current ? 'bg-blue-500 w-6' : 'bg-zinc-700 w-2'
        }`}
      />
    ))}
  </div>
);

// A component for the scanning animation in Step 3
const VisionSystemDemo: React.FC<{ onAnimationComplete: () => void }> = ({ onAnimationComplete }) => {
  useEffect(() => {
    const timer = setTimeout(onAnimationComplete, 4000); // Animation duration is 4s
    return () => clearTimeout(timer);
  }, [onAnimationComplete]);

  const detectedItems = [
    { top: '25%', left: '15%', width: '30%', height: '50%', label: 'W12x26 Column', delay: 1 },
    { top: '60%', left: '55%', width: '25%', height: '30%', label: 'Rebar Cage', delay: 1.5 },
    { top: '10%', left: '70%', width: '15%', height: '20%', label: 'PPE: COMPLIANT', delay: 2 },
  ];
  
  const telemetryItems = [
    { label: 'OBJECTS IDENTIFIED', value: '12', delay: 1.2 },
    { label: 'SAFETY SCORE', value: '92%', delay: 1.7 },
    { label: 'STRUCTURAL INTEGRITY', value: 'STABLE', delay: 2.2 },
  ]

  return (
    <div className="w-full max-w-2xl bg-black p-2 rounded-xl border-2 border-zinc-700 relative overflow-hidden aspect-video">
      <img src="https://images.unsplash.com/photo-1581092448342-574215a133ce?q=80&w=1200&auto=format&fit=crop" alt="AI Analysis Demo" className="w-full h-full object-cover rounded-lg" />
      <div className="scan-line"></div>
      {detectedItems.map((item) => (
        <div key={item.label} className="bounding-box" style={{ top: item.top, left: item.left, width: item.width, height: item.height, animationDelay: `${item.delay}s` }}>
          <span className="bounding-box-label" style={{ animationDelay: `${item.delay + 0.5}s` }}>{item.label}</span>
        </div>
      ))}
      <div className="absolute bottom-2 right-2 bg-black/50 backdrop-blur-sm p-3 rounded-lg border border-zinc-700 text-left font-mono text-xs">
          <p className="text-cyan-400 font-bold mb-2">[LIVE TELEMETRY]</p>
          {telemetryItems.map(item => (
              <div key={item.label} className="animate-hud-fade-in" style={{ animationDelay: `${item.delay}s`, opacity: 0 }}>
                  <span className="text-zinc-400">{item.label}: </span>
                  <span className="text-white font-semibold">{item.value}</span>
              </div>
          ))}
      </div>
    </div>
  );
};

const SystemCheck: React.FC = () => {
    const checks = ['INITIALIZING CORE', 'VERIFYING USER CREDENTIALS', 'LOADING PROJECT DATA'];
    const [completedChecks, setCompletedChecks] = useState<string[]>([]);

    useEffect(() => {
        checks.forEach((check, index) => {
            setTimeout(() => {
                setCompletedChecks(prev => [...prev, check]);
            }, (index + 1) * 300);
        });
    }, []);

    return (
        <div className="font-mono text-lg text-zinc-400 w-full max-w-md">
            {checks.map((check, index) => (
                <div key={check} className="flex justify-between items-center" style={{ animation: `text-focus-in ${0.5 + index * 0.3}s cubic-bezier(0.550, 0.085, 0.680, 0.530) forwards`, opacity: 0 }}>
                    <span>{check}...</span>
                    <span className={`transition-opacity duration-300 ${completedChecks.includes(check) ? 'text-green-400 opacity-100' : 'opacity-0'}`}>OK</span>
                </div>
            ))}
        </div>
    );
};

const VoiceWaveform: React.FC<{ isPressed: boolean, isSuccess: boolean }> = ({ isPressed, isSuccess }) => {
    const bars = Array.from({ length: 50 });
    return (
        <div className="w-48 h-48 rounded-full flex items-center justify-center relative transition-all duration-500" style={{ transform: isPressed ? 'scale(1.1)' : 'scale(1)' }}>
            {/* Outer ring */}
            <div className={`absolute inset-0 rounded-full border-2 transition-all duration-300 ${isSuccess ? 'border-green-500' : 'border-blue-500/80 animate-nexus-breathe'}`}></div>
            {/* Inner fill */}
            <div className={`absolute inset-2 rounded-full transition-colors duration-300 ${isSuccess ? 'bg-green-900/50' : 'bg-blue-900/50'}`}></div>

            {isSuccess ? (
                <IconCheck size={64} className="text-white z-10" />
            ) : (
                 <div className="absolute inset-0 flex items-center justify-center z-10">
                    {bars.map((_, i) => (
                        <div key={i} className="w-1 h-2 bg-blue-400 rounded-full absolute"
                             style={{
                                 transform: `rotate(${i * (360 / bars.length)}deg) translateY(${isPressed ? Math.random() * 20 + 55 : 60}px)`,
                                 height: `${isPressed ? Math.random() * 20 + 4 : 4}px`,
                                 transition: 'all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
                             }}
                        />
                    ))}
                    <IconMic size={48} className="text-white z-20" />
                </div>
            )}
        </div>
    );
};

const DigitalNervousSystemDemo: React.FC<{ onAnimationComplete: () => void }> = ({ onAnimationComplete }) => {
    const [phase, setPhase] = useState(0); // 0: init, 1: inputs appear, 2: processing, 3: outputs appear, 4: tagline
    const [statusText, setStatusText] = useState('');
    const statusTextRef = useRef('');

    useEffect(() => {
        const typeWriter = (text: string, onComplete?: () => void) => {
            let i = 0;
            statusTextRef.current = '';
            const interval = setInterval(() => {
                if (i < text.length) {
                    statusTextRef.current += text.charAt(i);
                    setStatusText(statusTextRef.current);
                    i++;
                } else {
                    clearInterval(interval);
                    if (onComplete) onComplete();
                }
            }, 50);
            return () => clearInterval(interval);
        };

        const timeouts = [
            setTimeout(() => setPhase(1), 500),
            setTimeout(() => typeWriter('Cross-referencing RFI-112 against drawing S-201...'), 1000),
            setTimeout(() => setPhase(2), 3000),
            setTimeout(() => typeWriter('Conflict detected.'), 3500),
            setTimeout(() => setPhase(3), 5000),
            setTimeout(() => typeWriter('Orchestrating solution: Alerting team & drafting report...'), 5500),
            setTimeout(() => {
                setPhase(4);
                onAnimationComplete();
            }, 8000),
        ];
        return () => timeouts.forEach(clearTimeout);
    }, [onAnimationComplete]);

    const IconWrapper: React.FC<{ icon: React.ElementType, position: string, visible: boolean }> = ({ icon: Icon, position, visible }) => (
        <div className={`absolute transition-all duration-500 ${visible ? 'opacity-100 scale-100' : 'opacity-0 scale-90'}`} style={{ ...JSON.parse(position) }}>
            <div className="w-16 h-16 bg-zinc-800/50 border border-zinc-700 rounded-full flex items-center justify-center">
                <Icon size={32} />
            </div>
        </div>
    );
    
    const DataPacket: React.FC<{ flow: 'in' | 'out', delay: string }> = ({ flow, delay }) => (
        <div className={`absolute top-1/2 -translate-y-1/2 w-2 h-2 rounded-full ${flow === 'in' ? 'bg-blue-400 animate-data-packet-flow-in' : 'bg-green-400 animate-data-packet-flow-out'}`}
             style={{ animationDelay: delay }}>
        </div>
    );

    return (
        <div className="w-full flex flex-col items-center text-center">
            <div className="w-full max-w-2xl h-48 relative flex items-center justify-center mb-6">
                {/* Input Icons */}
                <IconWrapper icon={IconMail} position='{"left": "0", "top": "0"}' visible={phase >= 1} />
                <IconWrapper icon={IconFolderSync} position='{"left": "20%", "bottom": "0"}' visible={phase >= 1} />
                
                {/* Central AI Core */}
                <div className="relative">
                    <div className={`w-28 h-28 rounded-full flex items-center justify-center transition-all duration-500 ${phase >= 2 ? 'bg-blue-500/30 border-2 border-blue-500' : 'bg-zinc-800 border border-zinc-700'}`}>
                        <IconSparkles size={56} className={`transition-colors duration-500 ${phase >= 2 ? 'text-blue-300' : 'text-zinc-400'}`} />
                    </div>
                    {phase === 2 && (
                         <div className="absolute inset-0 border-4 border-cyan-400 rounded-full animate-processing-ring" style={{ borderTopColor: 'transparent', borderBottomColor: 'transparent' }}></div>
                    )}
                </div>

                {/* Output Icons */}
                <IconWrapper icon={IconWhatsApp} position='{"right": "0", "top": "0"}' visible={phase >= 3} />
                <IconWrapper icon={IconFileText} position='{"right": "20%", "bottom": "0"}' visible={phase >= 3} />

                {/* Data Packets */}
                {phase === 1 && <div className="absolute left-[30%]"><DataPacket flow="in" delay="0s" /><DataPacket flow="in" delay="0.5s" /></div>}
                {phase >= 3 && <div className="absolute left-[55%]"><DataPacket flow="out" delay="0s" /><DataPacket flow="out" delay="0.5s" /></div>}
            </div>

            <div className="h-12 font-mono text-lg text-center">
                <span className={`transition-colors duration-300 ${phase === 2 ? 'text-cyan-300 font-semibold' : 'text-zinc-300'}`}>{statusText}</span>
            </div>
            
             {phase === 4 && <p className="text-xl font-bold text-white mt-4 animate-text-block-fade-in">FLOCORE doesn't just find problems. It orchestrates the solution.</p>}
        </div>
    );
};


const OnboardingGuide: React.FC<OnboardingGuideProps> = ({ user, onComplete }) => {
  const [step, setStep] = useState(1);
  const [isAnimatingOut, setIsAnimatingOut] = useState(false);
  const [micPressed, setMicPressed] = useState(false);
  const [micSuccess, setMicSuccess] = useState(false);
  const [visionAnimationComplete, setVisionAnimationComplete] = useState(false);
  const [integrationAnimationComplete, setIntegrationAnimationComplete] = useState(false);

  const totalSteps = 5;

  const nextStep = () => {
    setIsAnimatingOut(true);
    setTimeout(async () => {
      if (step < totalSteps) {
        setStep(prev => prev + 1);
        setIsAnimatingOut(false);
        // Reset step-specific states
        setMicPressed(false);
        setMicSuccess(false);
        setVisionAnimationComplete(false);
        setIntegrationAnimationComplete(false);
      } else {
        const updatedUser = await authService.completeOnboarding(user);
        onComplete(updatedUser);
      }
    }, 500); // Duration of slide-out animation must match CSS
  };

  const handleMicPress = () => {
    if (micPressed) return;
    setMicPressed(true);
    setTimeout(() => {
        setMicSuccess(true);
        setTimeout(nextStep, 1000);
    }, 1500); // Simulate analysis
  };

  const renderStepContent = () => {
    const animationClass = isAnimatingOut ? 'animate-slide-out-left' : 'animate-slide-in-right';

    switch (step) {
      case 1:
        return (
          <div key={1} className={`w-full max-w-2xl flex flex-col items-center text-center ${animationClass}`}>
            <SystemCheck />
            <div className="mt-10 animate-text-focus-in" style={{ animationDelay: '1.2s', opacity: 0 }}>
                <h1 className="text-4xl md:text-5xl font-bold text-white">Welcome, {user?.name || 'User'}.</h1>
                <p className="text-lg md:text-xl text-zinc-400 mt-4 max-w-xl font-mono">
                  Let's calibrate your AI Co-Pilot for the <span className="text-white">Metro Tower</span> project.
                </p>
                <button onClick={nextStep} className="mt-12 bg-blue-500 text-white font-bold py-3 px-10 rounded-full text-lg hover:bg-blue-600 transition-all transform hover:scale-105 active:scale-100 shadow-[0_0_20px_rgba(59,130,246,0.5)]">
                  Begin Calibration
                </button>
            </div>
          </div>
        );
      case 2:
        return (
          <div key={2} className={`w-full max-w-2xl flex flex-col items-center text-center ${animationClass}`}>
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">Voice Signature Analysis</h1>
            <p className="text-lg text-zinc-400 max-w-lg mb-10 font-mono">
              Press and hold to provide a voice sample. Say: <strong className="text-white">"Start my day."</strong>
            </p>
            <button
              onMouseDown={handleMicPress}
              onTouchStart={handleMicPress}
              className="transition-transform duration-300 active:scale-95"
            >
             <VoiceWaveform isPressed={micPressed} isSuccess={micSuccess} />
            </button>
            <p className="text-xl text-zinc-300 mt-10 font-semibold h-8 transition-opacity duration-500 font-mono" style={{ opacity: micSuccess ? 1 : 0 }}>
              VOICE SIGNATURE CALIBRATED
            </p>
          </div>
        );
      case 3:
        return (
          <div key={3} className={`w-full max-w-2xl flex flex-col items-center text-center ${animationClass}`}>
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">Calibrating Optical Sensors</h1>
            <p className="text-lg text-zinc-400 max-w-xl mb-8 font-mono">
              The AI analyzes your camera feed to identify materials, spot risks, and track progress.
            </p>
            <VisionSystemDemo onAnimationComplete={() => setVisionAnimationComplete(true)} />
            <button
              onClick={nextStep}
              className="mt-8 bg-zinc-700 text-white font-bold py-2 px-8 rounded-full text-base hover:bg-zinc-600 transition-all transform hover:scale-105 active:scale-100 disabled:opacity-0 disabled:scale-100"
              disabled={!visionAnimationComplete}
            >
              Continue
            </button>
          </div>
        );
      case 4:
        return (
          <div key={4} className={`w-full max-w-3xl flex flex-col items-center text-center ${animationClass}`}>
             <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">Unleash Your Co-Pilot's Full Potential</h1>
             <p className="text-lg text-zinc-400 max-w-xl mb-8 font-mono">
               Connect your tools to automate your entire workflow.
             </p>
             <DigitalNervousSystemDemo onAnimationComplete={() => setIntegrationAnimationComplete(true)} />
             <button
              onClick={nextStep}
              className="mt-8 bg-zinc-700 text-white font-bold py-2 px-8 rounded-full text-base hover:bg-zinc-600 transition-all transform hover:scale-105 active:scale-100 disabled:opacity-0 disabled:scale-100"
              disabled={!integrationAnimationComplete}
            >
              Continue
            </button>
          </div>
        );
      case 5:
         const capabilityCards = [
            { icon: IconHardHat, title: "Live Analysis", description: "Identify materials, measure distances, and spot safety hazards." },
            { icon: IconMessageCircle, title: "Instant Answers", description: "Ask complex engineering and code questions." },
            { icon: IconFileText, title: "Automated Reporting", description: "Draft daily logs, incident reports, and checklists in seconds." },
        ];
        return (
          <div key={5} className={`w-full max-w-3xl flex flex-col items-center text-center ${animationClass}`}>
            <div className="w-24 h-24 rounded-full flex items-center justify-center bg-green-500/10 border-2 border-green-500/50 mb-6">
                <IconCheckCircle2 size={48} className="text-green-400" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-white">Calibration Complete</h1>
            <p className="text-lg text-zinc-400 mt-2 font-mono">Your AI Co-Pilot is ready for deployment.</p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-10 w-full">
                {capabilityCards.map((card, i) => (
                    <div key={card.title} className="bg-zinc-900/50 p-4 rounded-lg border border-zinc-800 text-center animate-hud-fade-in" style={{opacity: 0, animationDelay: `${i * 0.2}s`}}>
                        <card.icon size={24} className="text-blue-400 mx-auto mb-3" />
                        <h3 className="font-bold text-white">{card.title}</h3>
                        <p className="text-xs text-zinc-400 mt-1">{card.description}</p>
                    </div>
                ))}
            </div>
             <p className="text-sm text-zinc-500 mt-6 font-mono animate-hud-fade-in" style={{opacity: 0, animationDelay: '0.6s'}}>
                Offline mode enabled. All systems are operational.
            </p>
            <button onClick={nextStep} className="mt-8 bg-blue-500 text-white font-bold py-3 px-10 rounded-full text-lg hover:bg-blue-600 transition-all transform hover:scale-105 active:scale-100 shadow-[0_0_20px_rgba(59,130,246,0.5)] animate-hud-fade-in" style={{opacity: 0, animationDelay: '0.8s'}}>
              Enter Site
            </button>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-zinc-950 flex flex-col items-center justify-center p-4 md:p-8 animate-fade-in overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0 bg-cover bg-center transition-opacity duration-1000"
           style={{ backgroundImage: "url('https://images.unsplash.com/photo-1541888946425-d81bb19240f5?q=80&w=2070&auto=format&fit=crop')", opacity: 0.1 }}>
      </div>
      <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/80 to-transparent"></div>
      
      {/* Content */}
      <div className="relative w-full flex-grow flex items-center justify-center">
        {renderStepContent()}
      </div>

      <ProgressBar current={step} total={totalSteps} />
    </div>
  );
};

export default OnboardingGuide;