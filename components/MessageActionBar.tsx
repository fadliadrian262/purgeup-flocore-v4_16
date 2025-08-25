import React from 'react';
import { IconArchive, IconCheckCircle2 } from './icons';

type CardTheme = 'light' | 'dark';

interface MessageActionBarProps {
  onSaveToTimeline?: () => void;
  isSaved?: boolean;
  theme?: CardTheme;
}

const MessageActionBar: React.FC<MessageActionBarProps> = ({ onSaveToTimeline, isSaved, theme = 'dark' }) => {
  if (!onSaveToTimeline) {
    return null; // Don't render the bar at all if there's no save action
  }

  const saveButtonClasses = isSaved
    ? (theme === 'dark' ? 'bg-zinc-800 text-zinc-400 cursor-default' : 'bg-gray-200 text-gray-500 cursor-default')
    : (theme === 'dark' ? 'bg-zinc-700 text-white hover:bg-zinc-600' : 'bg-gray-200 text-zinc-700 hover:bg-gray-300');

  return (
    <div className={`mt-4 pt-4 flex items-center justify-end gap-2 ${theme === 'dark' ? 'border-t border-zinc-800' : 'border-t border-gray-200'}`}>
      <button
        onClick={onSaveToTimeline}
        disabled={isSaved}
        className={`flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-lg transition-colors active:scale-95 ${saveButtonClasses}`}
      >
        {isSaved ? <IconCheckCircle2 size={16} /> : <IconArchive size={16} />}
        {isSaved ? 'Saved to Timeline' : 'Save to Timeline'}
      </button>
    </div>
  );
};

export default MessageActionBar;
