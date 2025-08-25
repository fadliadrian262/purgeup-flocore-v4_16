import React, { useState, useEffect } from 'react';
import { AiEngine, DownloadStatusMap } from '../types';
import { IconX, IconServer, IconCpu, IconFeather, IconCheckCircle2, IconLoader, IconDownloadCloud, IconTriangleAlert, IconCheck } from './icons';
import { localLlmService } from '../services/localLlmService';

interface ModelSelectionSheetProps {
  isOpen: boolean;
  onClose: () => void;
  selectedEngine: AiEngine;
  onEngineAction: (engine: AiEngine) => void;
  initializedEngines: AiEngine[];
  downloadStatus: DownloadStatusMap;
}

// Legacy model definitions for backward compatibility
const legacyModelOptions: {
  id: AiEngine;
  name: string;
  subtitle: string;
  description: string;
  icon: React.ElementType;
  tags: string[];
}[] = [
  {
    id: 'premium',
    name: 'Premium',
    subtitle: 'Cloud LLM (Gemini)',
    icon: IconServer,
    tags: ['online', 'cloud'],
    description: 'Highest quality analysis and reasoning via cloud processing. Required for complex engineering calculations and visual analysis. Internet required.',
  },
  {
    id: 'advanced',
    name: 'Advanced',
    subtitle: 'Qwen2.5-3B (1.8 GB)',
    icon: IconCpu,
    tags: ['offline', 'performance'],
    description: 'Superior engineering analysis and structural reasoning. Optimized for technical documentation, code compliance, and complex calculations. Works completely offline.',
  },
  {
    id: 'compact',
    name: 'Compact',
    subtitle: 'Llama 3.2-1B (600 MB)',
    icon: IconFeather,
    tags: ['offline', 'speed'],
    description: 'Lightning-fast responses for summaries, field notes, and quick questions. Perfect for on-site documentation and safety reports. Ultra-fast offline performance.',
  },
];


const ModelSelectionSheet: React.FC<ModelSelectionSheetProps> = ({
  isOpen,
  onClose,
  selectedEngine,
  onEngineAction,
  initializedEngines,
  downloadStatus
}) => {

  if (!isOpen) return null;
  
  const isAnyModelDownloading = Object.values(downloadStatus).some(s => s.status === 'downloading');

  const getModelInfo = (modelId: AiEngine) => {
    // Only use legacy model options (Premium, Advanced, Compact)
    const legacy = legacyModelOptions.find(opt => opt.id === modelId);
    if (legacy) return legacy;

    // If not found in legacy options, return default
    return {
      id: modelId,
      name: modelId,
      subtitle: 'Unknown',
      description: 'Model information unavailable',
      icon: IconCpu,
      tags: ['unknown']
    };
  };

  const allModelIds: AiEngine[] = legacyModelOptions.map(opt => opt.id);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-end animate-fade-in">
        <div className="w-full bg-zinc-900 backdrop-blur-2xl rounded-t-3xl p-6 border-t border-zinc-700 animate-slide-in-up">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-white text-xl font-bold">Select AI Model</h2>
            <button onClick={onClose} className="p-1 rounded-full hover:bg-white hover:bg-opacity-10 text-zinc-400 hover:text-white">
              <IconX className="text-zinc-400" size={24} />
            </button>
          </div>
          <p className="text-zinc-400 mb-6">Choose the best AI model for your current task.</p>
          
          <div className="space-y-3">
              {allModelIds.map((modelId) => {
                const modelInfo = getModelInfo(modelId);
                const isSelected = selectedEngine === modelId;
                const status = downloadStatus[modelId];
                const isDownloading = status?.status === 'downloading';
                const hasError = status?.status === 'error';
                const isInitialized = initializedEngines.includes(modelId);
                const isActionDisabled = isAnyModelDownloading && !isDownloading;

                return (
                  <div
                    key={modelId}
                    className={`w-full flex items-start text-left p-4 rounded-xl border-2 transition-all duration-200 ${
                        isSelected ? 'border-blue-500 bg-blue-500 bg-opacity-10' : 'border-zinc-800 bg-zinc-800 bg-opacity-50'
                    } ${isActionDisabled ? 'opacity-50' : ''}`}
                  >
                    <modelInfo.icon className={`mr-4 mt-1 flex-shrink-0 ${isSelected ? 'text-blue-400' : 'text-zinc-300'}`} size={22} />
                    <div className="flex-grow">
                        <div className="flex justify-between items-center">
                            <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-bold text-white">{modelInfo.name}</span>
                                <span className="text-xs text-zinc-500 font-mono">{modelInfo.subtitle}</span>
                                {/* Model Tags */}
                                {modelInfo.tags?.map(tag => {
                                  const getTagStyle = (tagType: string) => {
                                    switch(tagType) {
                                      case 'offline': return 'bg-green-600 bg-opacity-20 text-green-300';
                                      case 'online': return 'bg-blue-600 bg-opacity-20 text-blue-300';
                                      case 'cloud': return 'bg-purple-600 bg-opacity-20 text-purple-300';
                                      case 'speed': return 'bg-orange-600 bg-opacity-20 text-orange-300';
                                      case 'performance': return 'bg-red-600 bg-opacity-20 text-red-300';
                                      case 'downloaded': return 'bg-green-600 bg-opacity-20 text-green-300';
                                      default: return 'bg-zinc-600 bg-opacity-20 text-zinc-300';
                                    }
                                  };
                                  
                                  const getTagLabel = (tagType: string) => {
                                    switch(tagType) {
                                      case 'offline': return 'Offline';
                                      case 'online': return 'Online';
                                      case 'cloud': return 'Cloud';
                                      case 'speed': return 'Speed';
                                      case 'performance': return 'Performance';
                                      case 'downloaded': return (
                                        <React.Fragment>
                                          <IconCheck size={10} /> Local
                                        </React.Fragment>
                                      );
                                      default: return tagType;
                                    }
                                  };
                                  
                                  return (
                                    <span key={tag} className={`px-2 py-1 text-xs rounded-full flex items-center gap-1 ${getTagStyle(tag)}`}>
                                      {getTagLabel(tag)}
                                    </span>
                                  );
                                })}
                            </div>
                             {isSelected && !isDownloading && <IconCheckCircle2 className="text-blue-500" size={20} />}
                        </div>
                        <p className="text-sm text-zinc-400 mt-1">{modelInfo.description}</p>
                        
                        {/* Action/Status Area */}
                        <div className="mt-3">
                          {isDownloading ? (
                              <div className="w-full">
                                  <div className="flex justify-between text-xs font-semibold text-blue-300 mb-1">
                                    <span>{status?.message || 'Downloading...'}</span>
                                    <span>{Math.round((status?.progress || 0) * 100)}%</span>
                                  </div>
                                  <div className="w-full bg-zinc-600 rounded-full h-2">
                                      <div
                                        className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                                        style={{ width: `${Math.round((status?.progress || 0) * 100)}%` }}
                                      ></div>
                                  </div>
                              </div>
                          ) : hasError ? (
                              <div className="bg-red-900 bg-opacity-40 border border-red-500 border-opacity-50 p-2 rounded-lg flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <IconTriangleAlert className="text-red-400" size={16} />
                                    <p className="text-xs text-red-300">Download Failed</p>
                                </div>
                                <button onClick={() => onEngineAction(modelId)} className="text-xs font-semibold bg-zinc-700 hover:bg-zinc-600 px-3 py-1 rounded">Retry</button>
                              </div>
                          ) : (
                              <button
                                  onClick={() => onEngineAction(modelId)}
                                  disabled={isSelected || isActionDisabled}
                                  className="text-sm font-semibold px-4 py-1.5 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed group"
                              >
                                  {isSelected ? (
                                      <span className="text-green-400">Active</span>
                                  ) : isInitialized || modelId === 'premium' ? (
                                      <span className="bg-zinc-700 text-zinc-200 group-hover:bg-zinc-600 px-4 py-1.5 rounded-lg">Select</span>
                                  ) : (
                                      <span className="bg-blue-500 text-white flex items-center gap-2 group-hover:bg-blue-600 px-4 py-1.5 rounded-lg">
                                          <IconDownloadCloud size={16} />
                                          Download
                                      </span>
                                  )}
                              </button>
                          )}
                        </div>
                    </div>
                  </div>
                )
              })}
          </div>
        </div>
      </div>
  );
};

export default ModelSelectionSheet;