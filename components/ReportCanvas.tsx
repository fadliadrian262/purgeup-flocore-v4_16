import React, { useState, useRef, useEffect } from 'react';
import { PDFDocument } from 'pdf-lib';
import html2canvas from 'html2canvas';
import { TimelineItem, ReportTemplate, ReportablePayload, DocumentPayload, AnalysisResult } from '../types';
import { IconFileText, IconChevronDown, IconCamera, IconLoader, IconSparkles } from './icons';
import EngineeringCalculationCard from './EngineeringCalculationCard';
import GeotechnicalCalculationCard from './GeotechnicalCalculationCard';
import DocumentCard from './DocumentCard';
import { parseMarkdown } from '../utils/markdownParser';


interface ReportCanvasProps {
    item: TimelineItem;
    templates: ReportTemplate[];
    onGenerateReport: (item: ReportablePayload, templateId: string) => void;
    onEdit: () => void;
}

const A4PageMockup: React.FC<{
    template: ReportTemplate | null;
    children: React.ReactNode;
}> = ({ template, children }) => (
    <div className="w-full bg-white shadow-2xl aspect-[1/1.414] flex flex-col text-black">
        {template?.headerImage && (
            <div className="flex-shrink-0">
                <img src={template.headerImage} alt="Report Header" className="w-full h-auto object-contain" />
            </div>
        )}
        <div className="flex-grow p-10 overflow-y-auto no-scrollbar">
            {children}
        </div>
        {template?.footerImage && (
            <div className="flex-shrink-0 mt-auto">
                <img src={template.footerImage} alt="Report Footer" className="w-full h-auto object-contain" />
            </div>
        )}
    </div>
);

const ReportCanvas: React.FC<ReportCanvasProps> = ({ item, templates, onGenerateReport, onEdit }) => {
    const [selectedTemplateId, setSelectedTemplateId] = useState('standard-blank');
    const [isExporting, setIsExporting] = useState<'png' | null>(null);
    const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
    
    const pageRef = useRef<HTMLDivElement>(null);
    const exportMenuRef = useRef<HTMLDivElement>(null);
    
    const selectedTemplate = templates.find(t => t.id === selectedTemplateId) || null;
    
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (exportMenuRef.current && !exportMenuRef.current.contains(event.target as Node)) {
                setIsExportMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);
    
    const getFilename = () => {
        const taskName = ('task' in item ? item.task : 'Analysis').replace(/\s+/g, '_');
        return `FLOCORE_Report_${taskName}_${new Date().toISOString().split('T')[0]}`;
    };

    const handleDownloadPNG = async () => {
        if (!pageRef.current) return;
        setIsExporting('png');
        setIsExportMenuOpen(false);

        try {
            const canvas = await html2canvas(pageRef.current, {
                scale: 2,
                useCORS: true,
                backgroundColor: '#ffffff',
            });
            const dataUrl = canvas.toDataURL('image/png');
            const link = document.createElement('a');
            link.href = dataUrl;
            link.download = `${getFilename()}.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (error) {
            console.error("Failed to generate PNG:", error);
            alert("Sorry, there was an error generating the PNG file.");
        } finally {
            setIsExporting(null);
        }
    };

    const renderItemContent = () => {
        // Handle visual analysis results
        if ('analysisSummary' in item) {
             const analysisItem = item as AnalysisResult;
             return (
                <div>
                    <h1 style={{fontSize: '18pt', fontWeight: 'bold', marginBottom: '16px'}}>AI Analysis Summary</h1>
                    {analysisItem.image && <img src={analysisItem.image} alt="Site Analysis" style={{maxWidth: '100%', marginBottom: '16px', border: '1px solid #eee'}} />}
                    <div
                        style={{fontSize: '10pt', lineHeight: '1.5'}}
                        dangerouslySetInnerHTML={{ __html: parseMarkdown(analysisItem.analysisSummary) }}
                    />
                    {analysisItem.detectedObjects.length > 0 && (
                        <div style={{marginTop: '24px'}}>
                            <h2 style={{fontSize: '14pt', fontWeight: 'bold', marginBottom: '8px', borderBottom: '1px solid #ccc', paddingBottom: '4px'}}>
                                Detected Objects ({analysisItem.detectedObjects.length})
                            </h2>
                            <table style={{width: '100%', borderCollapse: 'collapse', fontSize: '9pt'}}>
                                <thead>
                                    <tr style={{backgroundColor: '#f2f2f2', textAlign: 'left'}}>
                                        <th style={{padding: '8px', border: '1px solid #ddd'}}>Object</th>
                                        <th style={{padding: '8px', border: '1px solid #ddd'}}>Confidence</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {analysisItem.detectedObjects.map(obj => (
                                        <tr key={obj.id} style={{borderBottom: '1px solid #eee'}}>
                                            <td style={{padding: '8px', border: '1px solid #ddd'}}>{obj.label}</td>
                                            <td style={{padding: '8px', border: '1px solid #ddd'}}>{(obj.confidence * 100).toFixed(1)}%</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )
        }
        
        // Handle calculation and document payloads
        if ('task' in item && 'result' in item) {
            const commonProps = {
                id: `report-canvas-${item.id}`,
                title: item.task,
                onGenerateReport: () => onGenerateReport(item, selectedTemplateId),
                theme: 'light' as const,
                onSave: undefined,
                isSaved: undefined,
            };
            
            if ('governingStandard' in item.result && 'conclusion' in item.result) {
                return <EngineeringCalculationCard result={item.result} {...commonProps} />;
            } 
            if ('governingTheory' in item.result) {
                return <GeotechnicalCalculationCard result={item.result} {...commonProps} />;
            }
            if ('resultType' in item.result) {
                // This now only handles DocumentPayload types, as FieldPayload has been removed.
                return <DocumentCard payload={item as DocumentPayload} {...commonProps} />;
            }
        }
        return <p className="p-4 text-red-500 bg-red-100 rounded-lg">Error: Unknown item type for report canvas.</p>;
    }
    

    return (
        <div className="flex flex-col h-full bg-zinc-900">
            {/* Toolbar */}
            <div className="flex-shrink-0 flex items-center justify-between p-3 bg-zinc-950 border-b border-zinc-800">
                {/* Left: Configuration */}
                <div className="flex items-center gap-2">
                    <label htmlFor="template-select" className="text-sm font-semibold text-zinc-400">Template:</label>
                    <div className="relative">
                         <select
                            id="template-select"
                            value={selectedTemplateId}
                            onChange={(e) => setSelectedTemplateId(e.target.value)}
                            className="text-sm font-semibold bg-zinc-800 border border-zinc-700 rounded-md py-1 pl-3 pr-8 appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            {templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                        </select>
                         <IconChevronDown size={16} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-400" />
                    </div>
                     <button
                        onClick={onEdit}
                        disabled={!!isExporting}
                        className="flex items-center justify-center gap-2 bg-zinc-700 hover:bg-zinc-600 text-white font-semibold px-4 py-1.5 rounded-lg transition-all duration-200 active:scale-95 text-sm disabled:opacity-50"
                        title="Edit Content"
                    >
                        <IconSparkles size={16} /> Edit
                    </button>
                </div>

                {/* Right: Actions (Split Button) */}
                 <div className="relative" ref={exportMenuRef}>
                    <div className="flex items-center rounded-lg overflow-hidden">
                        <button 
                            onClick={() => onGenerateReport(item, selectedTemplateId)} 
                            disabled={!!isExporting}
                            className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-bold px-4 py-1.5 transition-all duration-200 active:scale-95 text-sm disabled:opacity-50"
                        >
                            <IconFileText size={16} /> Generate Report
                        </button>
                        <button
                            onClick={() => setIsExportMenuOpen(prev => !prev)}
                            disabled={!!isExporting}
                            className="px-2 py-1.5 bg-blue-600 hover:bg-blue-500 text-white border-l border-blue-400/50"
                            aria-label="More export options"
                        >
                             <IconChevronDown size={16} />
                        </button>
                    </div>

                    {isExportMenuOpen && (
                         <div className="absolute top-full right-0 mt-2 w-56 bg-zinc-800 border border-zinc-700 rounded-lg shadow-xl animate-fade-in z-10">
                            <button
                                onClick={handleDownloadPNG}
                                disabled={!!isExporting}
                                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-zinc-200 hover:bg-zinc-700 disabled:opacity-50"
                            >
                                {isExporting === 'png' ? <IconLoader size={16} className="animate-spin" /> : <IconCamera size={16} />}
                                Export as PNG
                            </button>
                        </div>
                    )}
                </div>
            </div>
            
            {/* Canvas */}
            <div className="flex-grow p-8 overflow-y-auto no-scrollbar">
                <div className="max-w-4xl mx-auto">
                    <div ref={pageRef}>
                        <A4PageMockup template={selectedTemplate}>
                            {renderItemContent()}
                        </A4PageMockup>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ReportCanvas;