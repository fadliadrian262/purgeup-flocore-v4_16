import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ProjectDocument } from '../types';
import { getProjectDocuments, uploadProjectDocument } from '../services/documentService';
import { IconX, IconDatabase, IconFileText, IconLoader, IconTriangleAlert, IconRefreshCw, IconUpload } from './icons';
import { LogItem, LogStatus } from '../types';

interface DocumentHubProps {
  isOpen: boolean;
  onClose: () => void;
  addLogEntry: (logData: Omit<LogItem, 'id' | 'timestamp'>) => void;
  showToast: (message: string, type: 'success' | 'error' | 'warning' | 'info') => void;
}

const formatBytes = (bytes: number, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

const DocumentRow: React.FC<{ doc: ProjectDocument; index: number }> = ({ doc, index }) => (
    <div 
      className="flex items-center justify-between py-4 border-b border-zinc-800 last:border-b-0 animate-fade-in-stagger hover:bg-zinc-800/50 px-4 rounded-lg transition-colors cursor-pointer"
      style={{ animationDelay: `${index * 30}ms` }}
    >
        <div className="flex items-center gap-4 min-w-0">
            <IconFileText className="text-blue-400 flex-shrink-0" size={24} />
            <div className="min-w-0">
                <p className="font-semibold text-white truncate text-sm">{doc.name}</p>
                <p className="text-xs text-zinc-400">Uploaded by {doc.uploader}</p>
            </div>
        </div>
        <div className="flex items-center gap-6 text-right flex-shrink-0">
            <p className="text-xs text-zinc-500 font-mono hidden md:block">{formatBytes(doc.size)}</p>
            <p className="text-xs text-zinc-500 font-mono hidden sm:block">{doc.uploadedAt.toLocaleDateString()}</p>
            <p className="text-xs text-zinc-400 font-semibold bg-zinc-700/50 px-2 py-1 rounded-md">{doc.type}</p>
        </div>
    </div>
);

const DocumentHub: React.FC<DocumentHubProps> = ({ isOpen, onClose, addLogEntry, showToast }) => {
  if (!isOpen) return null;
  
  const [documents, setDocuments] = useState<ProjectDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchDocs = useCallback(async (isManualSync = false) => {
    setIsLoading(true);
    setError(null);
    if(isManualSync) {
        addLogEntry({ title: 'Manual document sync started', status: LogStatus.IN_PROGRESS, icon: IconDatabase, channel: 'system' });
    }
    try {
      const fetchedDocs = await getProjectDocuments();
      setDocuments(fetchedDocs);
      if(isManualSync) {
        showToast('Documents synced successfully.', 'success');
        addLogEntry({ title: 'Document Hub synced successfully', status: LogStatus.SUCCESS, icon: IconDatabase, channel: 'user' });
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to fetch documents.";
      setError(errorMessage);
      showToast('Could not sync documents.', 'error');
      addLogEntry({ title: 'Document Hub sync failed', status: LogStatus.ERROR, icon: IconDatabase, channel: 'user', content: errorMessage });
    } finally {
      setIsLoading(false);
    }
  }, [addLogEntry, showToast]);

  useEffect(() => {
    if (isOpen) {
      fetchDocs();
    }
  }, [isOpen, fetchDocs]);
  
  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    addLogEntry({ title: `Uploading document: ${file.name}`, status: LogStatus.IN_PROGRESS, icon: IconUpload, channel: 'system' });
    try {
      const newDocument = await uploadProjectDocument(file);
      setDocuments(prev => [newDocument, ...prev].sort((a,b) => b.uploadedAt.getTime() - a.uploadedAt.getTime()));
      showToast('Document uploaded successfully.', 'success');
      addLogEntry({ title: 'Document uploaded', status: LogStatus.SUCCESS, icon: IconUpload, channel: 'user', content: file.name });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to upload document.";
      showToast('Document upload failed.', 'error');
      addLogEntry({ title: 'Document upload failed', status: LogStatus.ERROR, icon: IconUpload, channel: 'user', content: `File: ${file.name}`, context: errorMessage });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };


  return (
    <div className="fixed inset-0 bg-zinc-950/80 backdrop-blur-2xl z-50 flex flex-col text-white animate-fade-in no-scrollbar">
      {/* Header */}
      <div className="flex-shrink-0 flex justify-between items-center p-4 border-b border-zinc-800">
        <div className="flex items-center gap-3">
          <IconDatabase className="text-blue-400" size={24} />
          <h2 className="text-xl font-bold">Document Hub</h2>
        </div>
        <div className="flex items-center gap-2">
            <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept=".pdf,.doc,.docx,.xls,.xlsx,.dwg" />
            <button
                onClick={() => fetchDocs(true)}
                disabled={isLoading || isUploading}
                className="flex items-center gap-2 text-sm bg-zinc-800 hover:bg-zinc-700 px-3 py-1.5 rounded-lg font-semibold transition-colors disabled:opacity-50 text-zinc-300 active:scale-95"
            >
                <IconRefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
                Sync Now
            </button>
             <button
                onClick={handleUploadClick}
                disabled={isUploading || isLoading}
                className="flex items-center gap-2 text-sm bg-blue-500 hover:bg-blue-600 px-3 py-1.5 rounded-lg font-semibold transition-colors text-white active:scale-95 disabled:opacity-50"
            >
                {isUploading ? <IconLoader size={14} className="animate-spin" /> : <IconUpload size={14} />}
                {isUploading ? 'Uploading...' : 'Upload File'}
            </button>
            <div className="h-6 w-px bg-zinc-700 mx-1"></div>
            <button onClick={onClose} className="p-2 rounded-full hover:bg-zinc-800 transition-colors">
                <IconX size={24} />
            </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-grow p-6 overflow-y-auto no-scrollbar">
        <div className="max-w-4xl mx-auto">
          <p className="text-zinc-400 text-sm mb-6">Manage project files like drawings and specifications. Uploaded documents can be used by the AI to provide context-aware answers.</p>
          {isLoading ? (
              <div className="flex flex-col items-center justify-center h-full text-zinc-500">
                  <IconLoader className="animate-spin mb-4" size={32} />
                  <p>Syncing documents...</p>
              </div>
          ) : error ? (
              <div className="flex flex-col items-center justify-center h-full text-orange-400">
                  <IconTriangleAlert size={40} className="mb-4" />
                  <p className="font-semibold">Error syncing documents</p>
                  <p className="text-sm text-zinc-500 mt-1">{error}</p>
              </div>
          ) : documents.length === 0 ? (
               <div className="flex flex-col items-center justify-center h-full text-zinc-500 text-center pt-8">
                  <IconDatabase size={40} className="mb-4" />
                  <p className="font-semibold">Document Hub is empty.</p>
                  <p className="text-sm">Upload your first project document to get started.</p>
              </div>
          ) : (
              <div>
                  {documents.map((doc, i) => <DocumentRow key={doc.id} doc={doc} index={i} />)}
              </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DocumentHub;