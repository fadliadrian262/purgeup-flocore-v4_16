import { ProjectDocument } from '../types';

// Simulate a remote database
const mockDocuments: ProjectDocument[] = [
    { id: 'doc-01', name: 'Structural_Drawings_Rev4.pdf', type: 'PDF', uploadedAt: new Date(new Date().setDate(new Date().getDate() - 2)), size: 15728640, uploader: 'Sarah M.' },
    { id: 'doc-02', name: 'RFI-112_HVAC_Response.pdf', type: 'PDF', uploadedAt: new Date(new Date().setDate(new Date().getDate() - 1)), size: 838860, uploader: 'Miguel R.' },
    { id: 'doc-03', name: 'Concrete_Pour_Checklist_L2.docx', type: 'DOCX', uploadedAt: new Date(new Date().setHours(new Date().getHours() - 3)), size: 122880, uploader: 'Miguel R.' },
    { id: 'doc-04', name: 'Site-Logistics-Plan.pdf', type: 'PDF', uploadedAt: new Date(new Date().setDate(new Date().getDate() - 10)), size: 2097152, uploader: 'Admin' },
    { id: 'doc-05', name: 'Weekly_Safety_Audit_Template.xlsx', type: 'XLSX', uploadedAt: new Date(new Date().setDate(new Date().getDate() - 15)), size: 45056, uploader: 'Sarah M.' },
];

const getFileType = (fileName: string): 'PDF' | 'DWG' | 'XLSX' | 'DOCX' => {
    const extension = fileName.split('.').pop()?.toUpperCase() || '';
    if (extension === 'PDF') return 'PDF';
    if (extension === 'DWG') return 'DWG';
    if (extension === 'XLSX' || extension === 'XLS') return 'XLSX';
    if (extension === 'DOCX' || extension === 'DOC') return 'DOCX';
    return 'DOCX'; // Default
}

/**
 * Simulates fetching project documents from a remote server.
 */
export const getProjectDocuments = async (): Promise<ProjectDocument[]> => {
    console.log("Fetching project documents from remote...");
    return new Promise((resolve) => {
        setTimeout(() => {
            console.log("Successfully fetched documents.");
            // Return a sorted copy
            resolve([...mockDocuments].sort((a, b) => b.uploadedAt.getTime() - a.uploadedAt.getTime()));
        }, 1000); // Simulate network delay
    });
};

/**
 * Simulates uploading a document to a remote server.
 * @param file The file to upload.
 */
export const uploadProjectDocument = async (file: File): Promise<ProjectDocument> => {
    console.log(`Uploading file: ${file.name}`);
    return new Promise((resolve) => {
        setTimeout(() => {
            const newDocument: ProjectDocument = {
                id: `doc-${Date.now()}`,
                name: file.name,
                type: getFileType(file.name),
                uploadedAt: new Date(),
                size: file.size,
                uploader: 'You', // In a real app, this would be the logged-in user
            };
            mockDocuments.unshift(newDocument); // Add to the top of our "remote" database
            console.log("File uploaded successfully.");
            resolve(newDocument);
        }, 1500); // Simulate upload delay
    });
};