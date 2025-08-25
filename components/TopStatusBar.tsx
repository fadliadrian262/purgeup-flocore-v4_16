import React from 'react';
import { IconArchive, IconSettings, IconServer, IconCpu, IconFeather, IconChevronDown, IconDatabase, IconBuilding } from './icons';
import { AiEngine } from '../types';

interface TopStatusBarProps {
  onHistory: () => void;
  historyCount: number;
  onToggleSettings: () => void;
  onToggleDocumentHub: () => void;
  onToggleProjectSnapshot: () => void;
  selectedEngine: AiEngine;
  onToggleModelSelection: () => void;
}

const TopStatusBar: React.FC<TopStatusBarProps> = ({
  onHistory,
  historyCount,
  onToggleSettings,
  onToggleDocumentHub,
  onToggleProjectSnapshot,
  selectedEngine,
  onToggleModelSelection,
}) => {
  const getEngineInfo = () => {
      switch(selectedEngine) {
          case 'premium':
              return { Icon: IconServer, name: 'Premium' };
          case 'advanced':
              return { Icon: IconCpu, name: 'Advanced' };
          case 'compact':
              return { Icon: IconFeather, name: 'Compact' };
      }
  };
  
  const IconButton: React.FC<{ icon: React.ElementType; onClick: () => void; disabled?: boolean; ariaLabel: string; }> = ({ icon: Icon, onClick, disabled, ariaLabel }) => {
        return (
            <button
                onClick={onClick}
                disabled={disabled}
                aria-label={ariaLabel}
                className={`w-10 h-10 rounded-full flex items-center justify-center text-zinc-300 transform transition-all duration-200 hover:bg-white/10 hover:text-white active:scale-95 ${disabled ? "opacity-40 cursor-not-allowed" : ""}`}
            >
                <Icon size={22} />
            </button>
        );
  };
  
  const engineInfo = getEngineInfo();

  return (
    <div className="fixed top-0 left-0 right-0 z-20 flex items-center justify-between p-4 animate-slide-in-down">
      {/* Left: Project "POD" */}
      <div className="flex-1 flex justify-start">
        <button
          onClick={onToggleProjectSnapshot}
          className="flex items-center gap-2.5 text-white px-4 py-2 rounded-xl bg-zinc-900/70 backdrop-blur-xl border border-zinc-800 hover:bg-zinc-800 transition-colors shadow-lg"
        >
            <IconBuilding size={18} />
            <span className="font-semibold text-sm">Metro Tower</span>
        </button>
      </div>

      {/* Center: AI Engine "POD" */}
      <div className="flex-shrink-0">
        <button 
            onClick={onToggleModelSelection} 
            className="flex items-center gap-2 text-white px-4 py-2 rounded-xl bg-zinc-900/70 backdrop-blur-xl border border-zinc-800 hover:bg-zinc-800 transition-colors shadow-lg"
        >
            <engineInfo.Icon size={20} className="text-blue-400" />
            <span className="font-semibold text-sm">{engineInfo.name}</span>
            <IconChevronDown size={16} className="text-zinc-400" />
        </button>
      </div>

      {/* Right: Actions "POD" */}
      <div className="flex-1 flex justify-end">
        <div className="flex items-center gap-1 p-1 rounded-full bg-zinc-900/70 backdrop-blur-xl border border-zinc-800 shadow-lg">
            <IconButton icon={IconArchive} onClick={onHistory} ariaLabel="History"/>
            <IconButton icon={IconDatabase} onClick={onToggleDocumentHub} ariaLabel="Document Hub"/>
            <IconButton icon={IconSettings} onClick={onToggleSettings} ariaLabel="Settings"/>
        </div>
      </div>
    </div>
  );
};

export default TopStatusBar;