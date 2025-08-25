import React from 'react';

type CardTheme = 'light' | 'dark';

interface DataBlockProps {
    title: string;
    items?: string[];
    theme?: CardTheme;
}

const DataBlock: React.FC<DataBlockProps> = ({ title, items, theme = 'dark' }) => {
    if (!items || items.length === 0) {
        return null;
    }

    return (
        <div>
            <h4 className={`font-bold text-base mb-2 ${theme === 'dark' ? 'text-blue-300' : 'text-blue-600'}`}>{title}</h4>
            <div className={`p-3 rounded-lg border ${theme === 'dark' ? 'bg-zinc-800/50 border-zinc-700' : 'bg-gray-100 border-gray-200'}`}>
                <ul className={`list-disc list-inside space-y-1 text-sm ${theme === 'dark' ? 'text-zinc-300' : 'text-zinc-700'}`}>
                    {items.map((item, index) => (
                        <li key={index}>{item}</li>
                    ))}
                </ul>
            </div>
        </div>
    );
};

export default DataBlock;
