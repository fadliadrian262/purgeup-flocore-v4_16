import React from 'react';
import { LogItem, LogStatus } from '../types';
import { IconCheckCircle2, IconAlertCircle, IconLoader, IconTriangleAlert } from './icons';
import { parseMarkdown } from '../utils/markdownParser';

const getStatusIcon = (status: LogStatus, customIcon: React.ElementType) => {
    const Icon = customIcon;
    switch(status) {
        case LogStatus.SUCCESS:
            return <IconCheckCircle2 size={14} className="text-green-400" />;
        case LogStatus.WARNING:
            return <IconTriangleAlert size={14} className="text-yellow-400" />;
        case LogStatus.ERROR:
            return <IconAlertCircle size={14} className="text-red-400" />;
        case LogStatus.IN_PROGRESS:
            return <IconLoader size={14} className="text-blue-400 animate-spin" />;
        default:
            return <Icon size={14} className="text-zinc-400" />;
    }
}

const LogEntry: React.FC<{ item: LogItem, index: number }> = ({ item, index }) => {
    const { icon: CustomIcon, title, timestamp, status, context, content } = item;
    
    return (
        <div
          className="flex items-start gap-3 py-2 text-xs animate-fade-in-stagger border-b border-zinc-800/50 last:border-b-0"
          style={{ animationDelay: `${index * 30}ms`}}
        >
            <div className="w-4 mt-1 flex-shrink-0">
                {getStatusIcon(status, CustomIcon)}
            </div>
            <div className="flex-grow min-w-0">
              <div className="flex items-baseline gap-3">
                <p className="text-zinc-500 flex-shrink-0">{timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</p>
                <p className="text-zinc-200 font-semibold truncate">{title}</p>
              </div>
              {context && (
                <blockquote className="mt-1 pl-3 py-1 border-l-2 border-zinc-700 text-zinc-400 italic">
                  "{context}"
                </blockquote>
              )}
              {content && (
                <div className="mt-1 pl-3 text-zinc-400 prose prose-xs prose-zinc max-w-none break-words" dangerouslySetInnerHTML={{ __html: parseMarkdown(content) }}>
                </div>
              )}
            </div>
        </div>
    );
};


const LogFeed: React.FC<{ items: LogItem[] }> = ({ items }) => {
     const userLogs = items.filter(item => item.channel === 'user');

     if (userLogs.length === 0) {
        return (
            <div className="flex items-center justify-center h-full text-zinc-500 p-4">
                <p>User command log is empty.</p>
            </div>
        );
    }
    
    return (
        <div className="font-mono p-4">
            {userLogs.map((item, index) => <LogEntry key={item.id} item={item} index={index}/>)}
        </div>
    );
};

export default LogFeed;