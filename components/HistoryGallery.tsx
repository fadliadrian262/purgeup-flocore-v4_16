import React, { useState, useEffect } from 'react';
import { ReportablePayload, TimelineItem, ReportTemplate, DocumentPayload } from '../types';
import { IconX, IconFileText, IconArrowLeft, IconArchive, IconWrench, IconGlobe, IconBookCheck, IconSparkles } from './icons';
import { DetectionsOverlay } from './Overlays';
import ReportCanvas from './ReportCanvas';

interface HistoryGalleryProps {
  isOpen: boolean;
  onClose: () => void;
  history: TimelineItem[];
  templates: ReportTemplate[];
  onGenerateReport: (item: ReportablePayload, templateId: string) => void;
  onOpenEditor: (item: TimelineItem) => void;
}

const HistoryGallery: React.FC<HistoryGalleryProps> = ({ isOpen, onClose, history, templates, onGenerateReport, onOpenEditor }) => {
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

  const [selectedId, setSelectedId] = useState<number | null>(null);
  
  // Reset selected item when gallery is re-opened
  useEffect(() => {
    if(isOpen) {
      setSelectedId(null);
    }
  }, [isOpen]);
  
  if (!isRendered) return null;

  const animationClass = isAnimatingOut ? 'animate-fade-out' : 'animate-fade-in';
  const selectedItem = history.find(h => h.id === selectedId);
  
   const getCalculationCardInfo = (item: ReportablePayload) => {
        if ('result' in item && 'governingStandard' in item.result && 'conclusion' in item.result) { // Structural
            return {
                icon: IconWrench,
                title: item.task,
                keyResult: `${item.result.conclusion.finalAnswer.name}: ${item.result.conclusion.finalAnswer.value} ${item.result.conclusion.finalAnswer.unit}`,
                standard: item.result.governingStandard,
            };
        }
        if ('result' in item && 'governingTheory' in item.result) { // Geotechnical
            return {
                icon: IconGlobe,
                title: item.task,
                keyResult: `${item.result.conclusion.finalAnswer.name}: ${item.result.conclusion.finalAnswer.value} ${item.result.conclusion.finalAnswer.unit}`,
                standard: item.result.governingTheory,
            };
        }
        if ('result' in item && 'resultType' in item.result) { // DocumentPayload
            const docPayload = item as DocumentPayload;
            let keyResult = '';
            let standard = docPayload.result.resultType.replace(/_/g, ' ').replace(/(?:^|\s)\S/g, a => a.toUpperCase());

            switch (docPayload.result.resultType) {
                case 'DAILY_SITE_REPORT':
                    keyResult = `Report for ${docPayload.result.reportDate}`;
                    break;
                case 'INCIDENT_REPORT':
                    keyResult = `Incident at ${docPayload.result.location}`;
                    break;
                case 'JOB_SAFETY_ANALYSIS':
                    keyResult = `JSA for ${docPayload.result.task}`;
                    break;
                case 'RISK_ASSESSMENT':
                    keyResult = `RA for ${docPayload.result.activity}`;
                    break;
                case 'INSPECTION_TEST_PLAN':
                    keyResult = `ITP for ${docPayload.result.trade}`;
                    break;
                default:
                    keyResult = "Document Generated";
            }

            return {
                icon: IconBookCheck,
                title: item.task,
                keyResult: keyResult,
                standard: standard,
            };
        }
        return null;
    }
  
  const renderDetailView = () => {
    if (!selectedItem) return null;

    // ALL items now use ReportCanvas for a consistent detail view and report generation flow.
    return (
        <ReportCanvas
            item={selectedItem}
            templates={templates}
            onGenerateReport={onGenerateReport}
            onEdit={() => onOpenEditor(selectedItem)}
        />
    );
  }


  return (
    <div className={`fixed inset-0 bg-zinc-950/80 backdrop-blur-2xl z-50 flex flex-col text-white ${animationClass}`}>
      {/* Header */}
      <div className="flex-shrink-0 flex justify-between items-center p-4 border-b border-zinc-800">
        <div className="flex items-center gap-4">
          {selectedItem && (
            <button onClick={() => setSelectedId(null)} className="p-2 rounded-full hover:bg-white/10 transition-colors">
              <IconArrowLeft size={24} />
            </button>
          )}
          <div>
            <h2 className="text-xl font-bold">{selectedItem ? 'Live Report View' : 'Project Timeline'}</h2>
            {!selectedItem && <p className="text-sm text-zinc-400 mt-1">A complete, chronological record of all AI analyses, generated documents, and saved calculations for your project.</p>}
          </div>
        </div>
        <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10 transition-colors">
          <IconX size={24} />
        </button>
      </div>

      {/* Content */}
      <div className="flex-grow overflow-y-auto no-scrollbar">
        {!selectedItem ? (
          // Grid View
          <div className="p-6 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {history.length === 0 ? (
                 <div className="col-span-full h-full flex flex-col items-center justify-center text-zinc-500 p-8 text-center min-h-[50vh]">
                    <IconArchive size={40} className="mb-4" />
                    <p className="font-semibold">Project Timeline is empty.</p>
                    <p className="text-sm">Perform an analysis or save a calculation to begin.</p>
                 </div>
            ) : (
                history.map((item, index) => {
                    if ('analysisSummary' in item) { // It's an AnalysisResult
                        return (
                             <button 
                                key={item.id} 
                                onClick={() => setSelectedId(item.id)}
                                className="group aspect-square bg-zinc-900 rounded-2xl overflow-hidden relative border-2 border-zinc-800 hover:border-blue-500 focus:outline-none focus:border-blue-500 transition-all duration-300 active:scale-95 animate-fade-in-stagger"
                                style={{ animationDelay: `${index * 40}ms` }}
                            >
                                <img src={item.image} alt={`Analysis from ${new Date(item.id).toLocaleString()}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                                <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/90 to-transparent">
                                    <p className="text-white text-xs font-semibold truncate">{item.analysisSummary.split('.')[0]}</p>
                                    <p className="text-zinc-400 text-xs font-mono">{new Date(item.id).toLocaleString()}</p>
                                </div>
                            </button>
                        )
                    } else { // It's a calculation or document
                        const info = getCalculationCardInfo(item);
                        if (!info) return null;
                        const Icon = info.icon;
                        return (
                            <button 
                                key={item.id}
                                onClick={() => setSelectedId(item.id)}
                                className="group aspect-square bg-zinc-900 rounded-2xl p-4 flex flex-col justify-between overflow-hidden relative border-2 border-zinc-800 hover:border-blue-500 focus:outline-none focus:border-blue-500 transition-all duration-300 active:scale-95 animate-fade-in-stagger"
                                style={{ animationDelay: `${index * 40}ms`, background: 'radial-gradient(circle, rgba(24, 24, 27, 0.9) 0%, rgba(39, 39, 42, 0.9) 100%), linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)', backgroundSize: '100% 100%, 1rem 1rem, 1rem 1rem' }}
                            >
                                <Icon className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 text-zinc-700/50 group-hover:text-blue-500/30 transition-colors duration-300" />
                                <div className="relative z-10">
                                    <h4 className="font-bold text-white truncate">{info.title}</h4>
                                    <p className="text-xs text-zinc-400 font-mono mt-1 truncate">{info.standard}</p>
                                </div>
                                <div className="relative z-10 mt-auto">
                                    <p className="text-sm font-semibold bg-zinc-800/80 backdrop-blur-sm text-zinc-200 px-2 py-1 rounded-md truncate">{info.keyResult}</p>
                                    <p className="text-zinc-500 text-xs font-mono mt-2">{new Date(item.timestamp).toLocaleString()}</p>
                                </div>
                            </button>
                        )
                    }
                })
            )}
          </div>
        ) : (
          renderDetailView()
        )}
      </div>
    </div>
  );
};

export default HistoryGallery;