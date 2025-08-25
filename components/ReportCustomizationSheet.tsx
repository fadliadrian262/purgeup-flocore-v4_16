import React, { useState, useEffect, useMemo } from 'react';
import { TimelineItem, AiEngine, User, StructuralAnalysisResult, GeotechnicalAnalysisResult } from '../types';
import { IconX, IconSparkles, IconLoader, IconFileText, IconArrowLeft } from './icons';
import { supervisor } from '../services/agents/supervisorAgent';
import { produce } from 'immer';

interface ReportCustomizationSheetProps {
  isOpen: boolean;
  onClose: () => void;
  item: TimelineItem | null;
  onFinalize: (updatedItem: TimelineItem) => void;
  aiEngine: string;
}

const SuggestionChip: React.FC<{ text: string, onClick: () => void, disabled?: boolean }> = ({ text, onClick, disabled }) => (
    <button
      onClick={onClick}
      disabled={disabled}
      className="text-xs bg-blue-500/10 hover:bg-blue-500/20 text-blue-300 border border-blue-500/30 rounded-full px-3 py-1.5 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {text}
    </button>
);


const ReportCustomizationSheet: React.FC<ReportCustomizationSheetProps> = ({
  isOpen,
  onClose,
  item,
  onFinalize,
  aiEngine,
}) => {
  if (!isOpen || !item) return null;

  const [editableText, setEditableText] = useState('');
  const [revisionInstruction, setRevisionInstruction] = useState('');
  const [isRevising, setIsRevising] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isFetchingSuggestions, setIsFetchingSuggestions] = useState(false);

  const dummyUser: User = { 
    name: 'User', 
    email: '', 
    language: 'en', 
    calculationStandard: 'ACI 318-19 (USA)', 
    onboardingComplete: true,
    suggestionFrequency: 75,
    proactiveAlerts: { weather: true, safety: true, schedule: true, fatigue: true },
    learnPatterns: true,
  };

  const { label, originalText, isSuggestionEnabled } = useMemo(() => {
    if (!item) return { label: '', originalText: '', isSuggestionEnabled: false };
    
    if ('analysisSummary' in item) { // AnalysisResult
      return { label: 'Report Summary', originalText: item.analysisSummary, isSuggestionEnabled: true };
    }
    if ('result' in item) { // One of the Payloads
      // Structural or Geotechnical Payload
      if ('conclusion' in item.result) {
        return { label: 'Conclusion Summary', originalText: item.result.conclusion.summary, isSuggestionEnabled: false };
      }
    }
    
    return { label: 'Editable Content', originalText: '', isSuggestionEnabled: false };
  }, [item]);


  useEffect(() => {
    setEditableText(originalText);
    setRevisionInstruction('');
    setError(null);
    setSuggestions([]);

    if (isSuggestionEnabled) {
        const fetchSuggestions = async () => {
            setIsFetchingSuggestions(true);
            try {
                const fetchedSuggestions = await supervisor.getReportSuggestions(originalText, aiEngine, dummyUser);
                setSuggestions(fetchedSuggestions);
            } catch (err) {
                console.error("Suggestion fetch failed:", err);
            } finally {
                setIsFetchingSuggestions(false);
            }
        };
        fetchSuggestions();
    }
  }, [item, originalText, isSuggestionEnabled, aiEngine]);

  const handleRevision = async (instruction: string) => {
    if (!instruction.trim()) return;
    setIsRevising(true);
    setError(null);
    try {
      const revisedText = await supervisor.getRevisedText(editableText, instruction, aiEngine, dummyUser);
      setEditableText(revisedText);
      setRevisionInstruction(''); // Clear instruction after use
    } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "An unknown error occurred.";
        setError(errorMessage);
    } finally {
      setIsRevising(false);
    }
  };
  
  const handleSuggestionClick = (suggestion: string) => {
      setRevisionInstruction(suggestion);
      handleRevision(suggestion);
  };

  const handleManualRevision = () => {
      handleRevision(revisionInstruction);
  };

  const handleFinalize = () => {
    if (!item) return;
    const updatedItem = produce(item, draft => {
        if ('analysisSummary' in draft) {
            draft.analysisSummary = editableText;
        } else if ('result' in draft) {
            if ('conclusion' in draft.result) {
                // This cast is needed because `draft.result` is a union that Immer can't narrow perfectly.
                (draft.result as StructuralAnalysisResult | GeotechnicalAnalysisResult).conclusion.summary = editableText;
            }
        }
    });
    onFinalize(updatedItem);
  };

  return (
    <div className="fixed inset-0 bg-zinc-950/80 backdrop-blur-2xl z-[60] flex flex-col text-white animate-fade-in">
      {/* Header */}
      <div className="flex-shrink-0 flex justify-between items-center p-4 border-b border-zinc-800">
        <div className="flex items-center gap-2">
            <button onClick={onClose} className="p-2 -ml-2 rounded-full hover:bg-white/10 transition-colors" aria-label="Back to report view">
                <IconArrowLeft size={24} />
            </button>
            <h2 className="text-xl font-bold text-white">Customize Content</h2>
        </div>
        <button onClick={onClose} className="p-2 -mr-2 rounded-full hover:bg-white/10 transition-colors" aria-label="Close editor">
            <IconX size={24} />
        </button>
      </div>

      {/* Content */}
      <div className="flex-grow p-6 overflow-y-auto space-y-6 no-scrollbar">
        <div className="max-w-4xl mx-auto">
            <div>
                <label htmlFor="summary-editor" className="block text-sm font-bold text-blue-300 mb-2">
                    {label} (Editable)
                </label>
                <textarea
                    id="summary-editor"
                    value={editableText}
                    onChange={(e) => setEditableText(e.target.value)}
                    className="w-full h-48 bg-zinc-900 border border-zinc-700 rounded-lg p-3 text-sm text-zinc-200 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    placeholder="AI analysis summary will appear here..."
                />
            </div>
            
            <div className="mt-6">
                 <label htmlFor="revision-instruction" className="block text-sm font-bold text-blue-300 mb-2">
                    AI Revision Co-Pilot
                </label>
                
                {isSuggestionEnabled && (
                    <div className="p-3 bg-zinc-900 border border-zinc-700 rounded-lg">
                        <div className="flex items-center gap-2 mb-3">
                            <IconSparkles className="text-blue-400" size={18} />
                            <h4 className="text-sm font-semibold text-blue-300">AI Suggestions</h4>
                        </div>
                        {isFetchingSuggestions ? (
                            <div className="flex items-center gap-2 text-zinc-400 text-xs">
                                <IconLoader className="animate-spin" size={16}/>
                                <span>Generating suggestions...</span>
                            </div>
                        ) : (
                            <div className="flex flex-wrap gap-2">
                                {suggestions.length > 0 ? suggestions.map((s, i) => (
                                    <SuggestionChip key={i} text={s} onClick={() => handleSuggestionClick(s)} disabled={isRevising} />
                                )) : <p className="text-xs text-zinc-500 italic">No specific suggestions for this analysis. Type your own instruction below.</p>}
                            </div>
                        )}
                    </div>
                )}

                <div className="flex items-center gap-2 mt-4">
                    <input
                        id="revision-instruction"
                        type="text"
                        value={revisionInstruction}
                        onChange={(e) => setRevisionInstruction(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleManualRevision()}
                        className="flex-grow bg-zinc-900 border border-zinc-700 rounded-lg p-3 text-sm text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        placeholder="Or, type your own instruction... e.g., 'Make this more formal'"
                        disabled={isRevising}
                    />
                    <button
                        onClick={handleManualRevision}
                        disabled={isRevising || !revisionInstruction.trim()}
                        className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition-colors disabled:bg-blue-800 disabled:cursor-not-allowed"
                    >
                       {isRevising ? <IconLoader className="animate-spin" size={20} /> : <IconSparkles size={20} />}
                        <span className="hidden sm:inline">{isRevising ? 'Revising...' : 'Revise'}</span>
                    </button>
                </div>
                {error && <p className="text-red-400 text-xs mt-2">{error}</p>}
            </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex-shrink-0 flex items-center justify-end gap-4 p-4 border-t border-zinc-800 bg-zinc-950/50">
          <button onClick={onClose} className="px-6 py-2 text-sm font-semibold text-zinc-300 hover:text-white rounded-lg hover:bg-zinc-800 transition-colors">
              Cancel
          </button>
          <button 
              onClick={handleFinalize} 
              className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white font-bold px-6 py-2 rounded-lg transition-colors"
          >
              <IconFileText size={18}/>
              Save Changes
          </button>
      </div>
    </div>
  );
};

export default ReportCustomizationSheet;