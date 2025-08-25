import React, { useState, useEffect } from 'react';
import {
  IconX,
  IconUsers,
  IconMapPin,
  IconCalendarDays,
  IconBuilding,
  IconClipboardCheck,
  IconCheckCircle2,
  IconShieldCheck,
  IconHardHat,
  IconCircleCheck,
  IconHeartPulse,
} from './icons';

interface ProjectSnapshotModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const Section: React.FC<{ title: string; icon: React.ElementType; children: React.ReactNode }> = ({ title, icon: Icon, children }) => (
    <div>
        <div className="flex items-center gap-3 mb-3">
            <Icon size={18} className="text-blue-400" />
            <h3 className="text-base font-semibold text-white">{title}</h3>
        </div>
        <div className="pl-9 space-y-2 text-sm text-zinc-300">
            {children}
        </div>
    </div>
);

const ProjectSnapshotModal: React.FC<ProjectSnapshotModalProps> = ({ isOpen, onClose }) => {
  const [isRendered, setIsRendered] = useState(isOpen);
  const [isAnimatingOut, setIsAnimatingOut] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsRendered(true);
      setIsAnimatingOut(false);
    } else {
      if (isRendered) {
        setIsAnimatingOut(true);
        const timer = setTimeout(() => setIsRendered(false), 200);
        return () => clearTimeout(timer);
      }
    }
  }, [isOpen, isRendered]);

  if (!isRendered) return null;

  const animationClass = isAnimatingOut ? 'animate-fade-out' : 'animate-fade-in';

  return (
    <div className={`fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 ${animationClass}`} onClick={onClose}>
      <div
        className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-4xl mx-auto shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-start p-6 border-b border-zinc-800">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-500/10 border border-blue-500/30 rounded-lg flex items-center justify-center">
                <IconBuilding size={28} className="text-blue-400"/>
            </div>
            <div>
                <div className="flex items-center gap-3">
                    <h2 className="text-2xl font-bold text-white">Metro Tower</h2>
                    <span className="text-xs font-semibold px-2 py-1 rounded-full bg-green-500/20 text-green-300 border border-green-500/30">On Track</span>
                </div>
                <p className="text-sm text-zinc-400 font-mono mt-1">#MT-2024-001</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 -mr-2 -mt-2 rounded-full text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors"
            aria-label="Close project snapshot"
          >
            <IconX size={24} />
          </button>
        </div>

        {/* Main Content */}
        <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column */}
            <div className="lg:col-span-2 space-y-6">
                <Section title="Location" icon={IconMapPin}>
                    <div className="flex justify-between items-center">
                        <p>123 Main Street, Metropolis, USA</p>
                        <a href="#" className="text-sm text-blue-400 hover:underline flex-shrink-0 font-semibold">View Map</a>
                    </div>
                </Section>
                <Section title="Timeline" icon={IconCalendarDays}>
                     <p><span className="text-zinc-500">Start Date: </span><span className="font-medium">Jan 15, 2024</span></p>
                     <p><span className="text-zinc-500">Projected Completion: </span><span className="font-medium">Dec 20, 2025</span></p>
                </Section>
                 <Section title="Next Milestone" icon={IconClipboardCheck}>
                    <p className="font-semibold text-base text-white">Level 5 Concrete Pour</p>
                </Section>
                 <Section title="Key Stakeholders" icon={IconUsers}>
                    <p><span className="text-zinc-500 w-24 inline-block">Owner:</span><span className="font-medium">Pinnacle Properties Inc.</span></p>
                    <p><span className="text-zinc-500 w-24 inline-block">Contractor:</span><span className="font-medium">BuildRight Construction</span></p>
                    <p><span className="text-zinc-500 w-24 inline-block">Consultant:</span><span className="font-medium">A&B Engineering</span></p>
                </Section>
            </div>
            
            {/* Right Column - Project Vitals */}
            <div className="lg:col-span-1">
                <div className="flex items-center gap-3 mb-3">
                    <IconHeartPulse size={18} className="text-blue-400" />
                    <h3 className="text-base font-semibold text-white">Project Vitals</h3>
                </div>
                <div className="grid grid-cols-2 gap-px bg-zinc-800 rounded-xl border border-zinc-800 overflow-hidden">
                    {/* Schedule */}
                    <div className="bg-zinc-900 p-4">
                        <div className="flex items-center gap-2 text-sm text-zinc-400">
                            <IconCheckCircle2 size={14} className="text-green-400" />
                            <span>Schedule</span>
                        </div>
                        <p className="mt-2 text-xl font-bold text-green-400">On Track</p>
                    </div>
                    {/* Budget */}
                    <div className="bg-zinc-900 p-4">
                        <div className="flex items-center gap-2 text-sm text-zinc-400">
                            <IconCircleCheck size={14} className="text-green-400" />
                            <span>Budget</span>
                        </div>
                        <p className="mt-2 text-xl font-bold text-green-400">On Target</p>
                    </div>
                    {/* Safety */}
                    <div className="bg-zinc-900 p-4">
                        <div className="flex items-center gap-2 text-sm text-zinc-400">
                            <IconShieldCheck size={14} className="text-green-400" />
                            <span>Safety</span>
                        </div>
                        <p className="mt-2 text-xl font-bold text-green-400">No Incidents</p>
                    </div>
                    {/* Team on Site */}
                    <div className="bg-zinc-900 p-4">
                        <div className="flex items-center gap-2 text-sm text-zinc-400">
                            <IconHardHat size={14} />
                            <span>Team on Site</span>
                        </div>
                        <p className="mt-2 text-xl font-bold text-white">
                            34 <span className="text-base text-zinc-500 font-medium">/ 40</span>
                        </p>
                    </div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectSnapshotModal;