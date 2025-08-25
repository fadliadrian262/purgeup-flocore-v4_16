import React from 'react';
import { IconMail, IconCalendarDays, IconWhatsApp } from './icons';

interface PlatformLogoProps {
  serviceId: string;
  className?: string;
}

const GoogleWorkspaceLogo: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M17.65 9.35C17.65 9.35 17.65 9.35 17.65 9.35C16.65 6.45 13.95 4.5 10.95 4.5C7.95 4.5 5.25 6.45 4.25 9.35C4.25 9.35 4.25 9.35 4.25 9.35C1.95 9.85 0.25 11.8 0.25 14.25C0.25 16.95 2.45 19.15 5.15 19.15H16.75C19.45 19.15 21.65 16.95 21.65 14.25C21.65 11.8 19.95 9.85 17.65 9.35Z" fill="#4285F4"/>
        <path d="M10.95 4.5C7.95 4.5 5.25 6.45 4.25 9.35L6.65 13.95L10.95 22.5L15.25 13.95L17.65 9.35C16.65 6.45 13.95 4.5 10.95 4.5Z" fill="#34A853"/>
        <path d="M4.25 9.35L0.25 14.25L5.15 19.15L6.65 13.95L4.25 9.35Z" fill="#FBBC05"/>
        <path d="M17.65 9.35L15.25 13.95L16.75 19.15L21.65 14.25L17.65 9.35Z" fill="#EA4335"/>
    </svg>
);

const GoogleDriveLogo: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M7.71 1.43L1.42 12.01L4.57 17.36L10.86 6.77L7.71 1.43Z" fill="#34A853"/>
        <path d="M15.43 1.43L9.14 12.01H21.71L15.43 1.43Z" fill="#FFC107"/>
        <path d="M19.57 17.36L13.28 6.77L10.14 12.12L16.43 22.7L19.57 17.36Z" fill="#1A73E8"/>
    </svg>
);

const GoogleDocsLogo: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M14 2H6C4.9 2 4 2.9 4 4V20C4 21.1 4.9 22 6 22H18C19.1 22 20 21.1 20 20V8L14 2Z" fill="#4285F4"/>
        <path d="M13 3.5V9H18.5L13 3.5Z" fill="#1A73E8"/>
        <path d="M16 13H8V11H16V13Z" fill="white"/>
        <path d="M16 17H8V15H16V17Z" fill="white"/>
    </svg>
);


const PlatformLogo: React.FC<PlatformLogoProps> = ({ serviceId, className }) => {
    const defaultClassName = "w-6 h-6 flex-shrink-0 flex items-center justify-center";
    const finalClassName = `${defaultClassName} ${className || ''}`;

    switch (serviceId) {
        case 'google-workspace': return <GoogleWorkspaceLogo className={finalClassName} />;
        case 'google-drive': return <GoogleDriveLogo className={finalClassName} />;
        case 'google-docs': return <GoogleDocsLogo className={finalClassName} />;
        case 'gmail': return <IconMail size={20} className="text-zinc-300" />;
        case 'google-calendar': return <IconCalendarDays size={20} className="text-zinc-300" />;
        case 'whatsapp': return <IconWhatsApp size={20} className="text-green-500" />;
        default:
            return <div className={finalClassName} />;
    }
};

export default PlatformLogo;