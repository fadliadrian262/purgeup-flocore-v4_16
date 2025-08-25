
import React, { createContext, useState, useEffect, useCallback, useMemo } from 'react';
import { Language } from '../types';

interface LocalizationContextType {
    language: Language;
    setLanguage: (language: Language) => void;
    translations: Record<string, string>;
    t: (key: string, replacements?: Record<string, string>) => string;
}

export const LocalizationContext = createContext<LocalizationContextType | undefined>(undefined);

export const LocalizationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [language, setLanguage] = useState<Language>('en');
    const [translations, setTranslations] = useState<Record<string, string>>({});

    useEffect(() => {
        const fetchTranslations = async () => {
            try {
                const response = await fetch(`/locales/${language}.json`);
                if (!response.ok) {
                    throw new Error(`Could not load ${language}.json`);
                }
                const data = await response.json();
                setTranslations(data);
            } catch (error) {
                console.error("Failed to fetch translations:", error);
                // Fallback to English if the selected language file fails
                if (language !== 'en') {
                   console.error(`Falling back to English because ${language}.json was not found.`);
                   setLanguage('en');
                } else if (Object.keys(translations).length === 0) {
                    // If English fails on first load, we have a serious problem.
                    // Set a minimal translation object to prevent a blank screen.
                    setTranslations({ "app_title": "FLOCORE AI Camera" });
                }
            }
        };

        fetchTranslations();
    }, [language]);

    const t = useCallback((key: string, replacements?: Record<string, string>): string => {
        let translation = translations[key] || key;
        if (replacements) {
            Object.keys(replacements).forEach(placeholder => {
                translation = translation.replace(`{${placeholder}}`, replacements[placeholder]);
            });
        }
        return translation;
    }, [translations]);

    const value = useMemo(() => ({
        language,
        setLanguage,
        translations,
        t,
    }), [language, setLanguage, translations, t]);
    
    if (Object.keys(translations).length === 0) {
        return (
             <div className="w-full h-screen flex flex-col items-center justify-center bg-zinc-950 text-zinc-200 gap-6">
                {/* Minimal loading state to avoid blank screen while loading initial language */}
            </div>
        );
    }

    return (
        <LocalizationContext.Provider value={value}>
            {children}
        </LocalizationContext.Provider>
    );
};
