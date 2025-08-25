import React from 'react';
import { ActionItem } from '../types';
import { IconX } from './icons';

interface ActionSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  actions: ActionItem[];
}

const ActionSheet: React.FC<ActionSheetProps> = ({ isOpen, onClose, title, actions }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-end animate-fade-in">
      <div className="w-full bg-zinc-900 backdrop-blur-2xl rounded-t-3xl p-6 border-t border-zinc-700 animate-slide-in-up">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-white text-xl font-bold">{title}</h2>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-white/10 text-zinc-400 hover:text-white">
            <IconX size={24} />
          </button>
        </div>
        <p className="text-zinc-400 mb-6">Select a follow-up action for this workflow.</p>
        <div className="space-y-3">
          {actions.map((action, index) => (
            <button
              key={index}
              onClick={() => {
                action.onClick();
                onClose();
              }}
              className="w-full flex items-center text-left p-4 bg-zinc-800 border border-zinc-700 rounded-xl transition-all duration-200 hover:border-blue-500 hover:bg-blue-500/10 active:scale-[0.98]"
            >
              <action.icon className="text-blue-400 mr-4" size={22} />
              <span className="text-white font-medium">{action.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ActionSheet;