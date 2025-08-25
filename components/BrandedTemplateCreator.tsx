import React, { useState, useRef, useEffect } from 'react';
import { ReportTemplate } from '../types';
import { IconX, IconUploadCloud, IconFileText, IconArrowLeft } from './icons';

interface BrandedTemplateCreatorProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (template: ReportTemplate) => void;
}

const ImageUploadBox: React.FC<{
    title: string;
    image: string | null;
    onImageSelect: (base64: string | null) => void;
}> = ({ title, image, onImageSelect }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isDragging, setIsDragging] = useState(false);

    const handleFileChange = (file: File) => {
        if (file && (file.type === 'image/jpeg' || file.type === 'image/png')) {
            const reader = new FileReader();
            reader.onload = (e) => {
                onImageSelect(e.target?.result as string);
            };
            reader.readAsDataURL(file);
        } else {
            alert('Please select a valid JPG or PNG file.');
        }
    };
    
    const onDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(true);
    };
    const onDragLeave = () => setIsDragging(false);
    const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFileChange(e.dataTransfer.files[0]);
        }
    };

    return (
        <div 
            onClick={() => fileInputRef.current?.click()}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
            className={`relative flex flex-col items-center justify-center p-4 h-32 bg-zinc-900 border-2 border-dashed rounded-xl cursor-pointer transition-all duration-200 ${isDragging ? 'border-blue-500 bg-blue-500/10' : 'border-zinc-700 hover:border-zinc-600'}`}
        >
            <input 
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/png, image/jpeg"
                onChange={(e) => e.target.files && handleFileChange(e.target.files[0])}
            />
            {image ? (
                <>
                    <img src={image} alt={`${title} preview`} className="max-w-full max-h-full object-contain rounded" />
                     <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onImageSelect(null);
                        }}
                        className="absolute top-1 right-1 p-1 bg-black/50 rounded-full text-white hover:bg-red-500"
                    >
                        <IconX size={14} />
                    </button>
                </>
            ) : (
                <div className="text-center text-zinc-500">
                    <IconUploadCloud size={24} className="mx-auto" />
                    <p className="text-sm font-semibold mt-1">Upload {title}</p>
                    <p className="text-xs">Drop or click to browse</p>
                </div>
            )}
        </div>
    );
};


const BrandedTemplateCreator: React.FC<BrandedTemplateCreatorProps> = ({ isOpen, onClose, onSave }) => {
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
  
  const [name, setName] = useState('');
  const [headerImage, setHeaderImage] = useState<string | null>(null);
  const [footerImage, setFooterImage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
        setName('');
        setHeaderImage(null);
        setFooterImage(null);
    }
  }, [isOpen]);

  if (!isRendered) return null;

  const animationClass = isAnimatingOut ? 'animate-fade-out' : 'animate-fade-in';
  const canSave = name.trim() && (headerImage || footerImage);

  const handleSave = () => {
    if (!canSave) return;
    
    const newTemplate: ReportTemplate = {
        id: `branded-${Date.now()}`,
        name: name.trim(),
        scope: 'Personal', // For now, all user-created templates are personal
        description: `Custom branded report template created on ${new Date().toLocaleDateString()}`,
        isBranded: true,
        headerImage: headerImage || undefined,
        footerImage: footerImage || undefined,
    };

    onSave(newTemplate);
  };


  return (
    <div className={`fixed inset-0 bg-zinc-950 z-[70] flex flex-col text-white ${animationClass}`}>
       <div className="flex flex-col h-full max-w-2xl mx-auto w-full">
            {/* Header */}
            <div className="flex-shrink-0 flex justify-between items-center p-4 border-b border-zinc-800">
                <div className="flex items-center gap-3">
                    <button onClick={onClose} className="p-2 -ml-2 rounded-full hover:bg-zinc-800 transition-colors" aria-label="Back to Template Studio">
                        <IconArrowLeft size={24} />
                    </button>
                    <h2 className="text-xl font-bold">Create New Branded Template</h2>
                </div>
                <button onClick={onClose} className="p-2 -mr-2 rounded-full hover:bg-zinc-800 transition-colors" aria-label="Close">
                    <IconX size={24} />
                </button>
            </div>

            {/* Content */}
            <div className="flex-grow p-6 space-y-6 overflow-y-auto no-scrollbar">
                <p className="text-sm text-zinc-400">
                    Create a reusable report template by uploading your company's header and footer. The AI-generated content will be placed between them.
                </p>

                <div>
                    <label htmlFor="template-name" className="block text-sm font-semibold text-zinc-300 mb-1">Template Name</label>
                    <input
                        id="template-name"
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-3 text-base text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        placeholder="e.g., Daily Site Report"
                    />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <ImageUploadBox title="Header" image={headerImage} onImageSelect={setHeaderImage} />
                    <ImageUploadBox title="Footer" image={footerImage} onImageSelect={setFooterImage} />
                </div>
                
                <div>
                     <h4 className="text-sm font-semibold text-zinc-300 mb-2">Live Preview</h4>
                     <div className="bg-zinc-950 p-4 rounded-lg flex items-center justify-center min-h-[32rem] py-8">
                        <div className="bg-white shadow-lg w-[420px] h-[594px] flex flex-col text-black overflow-hidden">
                            {/* Header */}
                            {headerImage && (
                                <div className="flex-shrink-0">
                                    <img src={headerImage} alt="Header Preview" className="w-full h-auto object-contain" />
                                </div>
                            )}
                            {/* Content Placeholder */}
                            <div className="flex-grow p-8 text-xs text-gray-700 space-y-2 overflow-y-hidden flex flex-col">
                                <h1 className="text-lg font-bold text-black mb-4 text-center">(THIS is THE TITLE PART)</h1>
                                <div className="space-y-2 text-justify">
                                    <p>
                                        (this is your page descriptions) (this is your page descriptions) (this is your page descriptions) (this is your page descriptions) (this is your page descriptions) (this is your page descriptions) (this is your page descriptions) (this is your page descriptions).
                                    </p>
                                    <p>
                                        (this is your page descriptions) (this is your page descriptions) (this is your page descriptions) (this is your page descriptions) (this is your page descriptions) (this is your page descriptions) (this is your page descriptions) (this is your page descriptions) (this is your page descriptions).
                                    </p>
                                    <p>
                                        (this is your page descriptions) (this is your page descriptions) (this is your page descriptions) (this is your page descriptions) (this is your page descriptions) (this is your page descriptions) (this is your page descriptions) (this is your page descriptions) (this is your page descriptions).
                                    </p>
                                    <p>
                                        (this is your page descriptions) (this is your page descriptions) (this is your page descriptions) (this is your page descriptions) (this is your page descriptions) (this is your page descriptions) (this is your page descriptions) (this is your page descriptions) (this is your page descriptions).
                                    </p>
                                </div>
                            </div>
                             {/* Footer */}
                             {footerImage && (
                                <div className="flex-shrink-0 mt-auto">
                                    <img src={footerImage} alt="Footer Preview" className="w-full h-auto object-contain"/>
                                </div>
                            )}
                        </div>
                     </div>
                </div>
            </div>
             {/* Footer */}
            <div className="flex-shrink-0 flex items-center justify-end gap-4 p-4 border-t border-zinc-800">
                <button onClick={onClose} className="text-sm font-semibold text-zinc-300 px-4 py-2 rounded-lg hover:bg-zinc-800 transition-colors">
                    Cancel
                </button>
                 <button 
                    onClick={handleSave}
                    disabled={!canSave}
                    className="flex items-center gap-2 text-sm bg-blue-500 hover:bg-blue-600 px-4 py-2 rounded-lg font-semibold transition-colors text-white active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Save Template
                </button>
            </div>
       </div>
    </div>
  );
};

export default BrandedTemplateCreator;