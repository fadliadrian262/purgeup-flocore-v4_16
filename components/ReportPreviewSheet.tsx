import React, { useState, useEffect } from 'react';
import { IconX, IconLoader, IconDownloadCloud } from './icons';

interface ReportPreviewSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmDownload: () => void;
  pdfUrl: string | null;
  templateName: string;
}

const ReportPreviewSheet: React.FC<ReportPreviewSheetProps> = ({
  isOpen,
  onClose,
  onConfirmDownload,
  pdfUrl,
  templateName,
}) => {
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
    <div className={`fixed inset-0 bg-black/70 backdrop-blur-xl z-[70] flex flex-col text-white ${animationClass}`}>
      {/* Header */}
      <div className="flex-shrink-0 flex justify-between items-center p-4 border-b border-white/10">
        <h2 className="text-xl font-bold">Preview: {templateName} Report</h2>
        <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10 transition-colors">
          <IconX size={24} />
        </button>
      </div>

      {/* Content */}
      <div className="flex-grow p-6 flex items-center justify-center bg-black/30">
        {pdfUrl ? (
          <iframe
            src={pdfUrl}
            title="Report Preview"
            className="w-full h-full border-2 border-gray-700 rounded-lg bg-white"
          />
        ) : (
          <div className="flex flex-col items-center justify-center text-red-400">
             <IconX size={32} className="mb-2" />
            <p>Could not generate PDF preview.</p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex-shrink-0 flex items-center justify-end gap-4 p-4 border-t border-white/10 bg-black/30">
        <button
          onClick={onConfirmDownload}
          disabled={!pdfUrl}
          className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white font-bold px-6 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <IconDownloadCloud size={18}/>
          Download PDF
        </button>
      </div>
    </div>
  );
};

export default ReportPreviewSheet;