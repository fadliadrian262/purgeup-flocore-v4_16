import React, { useState, useEffect } from 'react';
import { ReportTemplate } from '../types';
import { IconX, IconPlusCircle, IconArrowLeft } from './icons';

interface TemplateStudioProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateNew: () => void;
  templates: ReportTemplate[];
}

const TemplateCard: React.FC<{ template: ReportTemplate, isBlueprint?: boolean }> = ({ template, isBlueprint }) => (
    <div className={`group relative bg-zinc-900 border border-zinc-800 rounded-lg p-4 flex flex-col justify-between hover:border-blue-500 transition-colors cursor-pointer min-h-[150px]
        ${isBlueprint ? 'bg-zinc-900/50' : ''}`}>
        <div>
            <h4 className="font-bold text-white">{template.name}</h4>
            <p className="text-xs text-zinc-400 mt-1">{template.description}</p>
        </div>
        {isBlueprint ? (
            <div className="text-xs font-semibold px-2 py-1 rounded-full self-start mt-4 bg-blue-900/50 border border-blue-500/30 text-blue-300">Blueprint</div>
        ) : (
             <div className="flex items-center gap-4 mt-4">
                 <div className={`text-xs font-semibold px-2 py-1 rounded-full self-start ${
                    template.scope === 'Company' ? 'bg-blue-600/20 text-blue-300' :
                    template.scope === 'Project' ? 'bg-teal-600/20 text-teal-300' :
                    'bg-zinc-600/20 text-zinc-300'
                }`}>{template.scope}</div>
                <div className="absolute bottom-4 right-4 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    {/* Placeholder for future Edit/Delete buttons */}
                </div>
            </div>
        )}
    </div>
);


const TemplateStudio: React.FC<TemplateStudioProps> = ({ isOpen, onClose, onCreateNew, templates }) => {
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
  const blueprintTemplates = templates.filter(t => !t.isBranded);
  const brandedTemplates = templates.filter(t => t.isBranded);

  return (
    <div className={`fixed inset-0 bg-zinc-950/80 backdrop-blur-2xl z-[60] flex flex-col text-white ${animationClass}`}>
      {/* Header */}
      <div className="flex-shrink-0 flex justify-between items-center p-4 border-b border-zinc-800">
        <div className="flex items-center gap-2 min-w-0">
            <button onClick={onClose} className="p-2 -ml-2 rounded-full hover:bg-white/10 transition-colors flex-shrink-0">
              <IconArrowLeft size={24} />
            </button>
            <h2 className="text-xl font-bold truncate text-white">Template Studio</h2>
        </div>
        <button onClick={onClose} className="p-2 -mr-2 rounded-full hover:bg-white/10 transition-colors flex-shrink-0">
            <IconX size={24} />
        </button>
      </div>

      <div className="flex-grow p-6 flex flex-col gap-8 overflow-y-auto no-scrollbar">
        
        {/* Report Blueprints */}
        <div>
            <div className="mb-4">
                <h3 className="font-bold text-white text-lg">Report Blueprints</h3>
                <p className="text-sm text-zinc-400">Use these built-in, unbranded templates for quick reports.</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {blueprintTemplates.map(template => <TemplateCard key={template.id} template={template} isBlueprint />)}
            </div>
        </div>
        
        {/* Branded Templates */}
        <div>
            <div className="flex justify-between items-center mb-4">
                 <div>
                    <h3 className="font-bold text-white text-lg">My Branded Templates</h3>
                    <p className="text-sm text-zinc-400">Your custom templates with company headers and footers.</p>
                </div>
                 <button
                    onClick={onCreateNew}
                    className="flex items-center gap-2 text-sm bg-blue-500 hover:bg-blue-600 px-3 py-1.5 rounded-lg font-semibold transition-colors text-white active:scale-95"
                >
                    <IconPlusCircle size={16} />
                    Create New
                </button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {brandedTemplates.map(template => <TemplateCard key={template.id} template={template} />)}
                <button
                    onClick={onCreateNew}
                    className="border-2 border-dashed border-zinc-700 rounded-lg flex flex-col items-center justify-center p-4 text-zinc-500 min-h-[150px] hover:border-blue-500 hover:text-blue-400 transition-colors"
                >
                    <IconPlusCircle size={32} />
                    <span className="mt-2 text-sm font-semibold text-center">Create New Template</span>
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default TemplateStudio;