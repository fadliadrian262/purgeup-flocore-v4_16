import React from 'react';
import { DashboardData, EquipmentInfo, PriorityTask, User } from '../types';
import { IconSun, IconCloudRain, IconLoader, IconSparkles, IconTriangleAlert, IconCheckCircle2, IconClock, IconCheck, IconHardHat, IconBuilding, IconFileText } from './icons';
import { parseMarkdown } from '../utils/markdownParser';
import BriefingFeed from './BriefingFeed';

const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 18) return "Good Afternoon";
    return "Good Evening";
};

const LoadingCard: React.FC<{ text: string }> = ({ text }) => (
    <div className="p-4 rounded-2xl border border-zinc-800 bg-zinc-900 flex items-center gap-4 animate-pulse">
        <IconLoader className="animate-spin text-zinc-500" size={24} />
        <div>
            <h4 className="font-bold text-zinc-400">{text}</h4>
        </div>
    </div>
);

const ErrorCard: React.FC<{ error: string, title: string }> = ({ error, title }) => (
    <div className="p-4 rounded-2xl border border-orange-500/30 bg-orange-900/20 flex items-center gap-4">
        <IconTriangleAlert className="text-orange-300 flex-shrink-0" size={24} />
        <div>
            <h4 className="font-bold text-white">{title}</h4>
            <p className="text-orange-300/80 text-sm">{error}</p>
        </div>
    </div>
);

const SalutationHeader: React.FC<{ user: User }> = ({ user }) => (
    <div>
        <h1 className="text-2xl font-bold text-white">{getGreeting()}, {user.name}.</h1>
    </div>
);

const DailyFocusCard: React.FC<{ focus: DashboardData['dailyFocus'] }> = ({ focus }) => {
    if (focus.isLoading) return <LoadingCard text="Determining Daily Focus..." />;
    if (focus.error) return <ErrorCard error={focus.error} title="Could not get daily focus" />;
    if (!focus.text) return null;

    return (
        <div className="p-4 rounded-2xl border-2 border-blue-500/50 bg-blue-900/20">
            <h3 className="text-sm font-semibold text-blue-300 mb-2">Your Daily Focus</h3>
            <p className="text-lg font-medium text-white">{focus.text}</p>
        </div>
    );
};

const TaskCard: React.FC<{ task: PriorityTask; onToggle: () => void }> = ({ task, onToggle }) => {
    const categoryIcons: Record<PriorityTask['category'], React.ElementType> = {
        'Safety': IconTriangleAlert,
        'Quality': IconCheckCircle2,
        'Schedule': IconClock,
        'Documentation': IconFileText,
    };
    const CategoryIcon = categoryIcons[task.category] || IconFileText;
    
    return (
        <div className={`flex items-start gap-4 p-4 rounded-xl border transition-all duration-300 ${task.isCompleted ? 'bg-zinc-800/30 border-zinc-800' : 'bg-zinc-900 border-zinc-800'}`}>
            <button 
                onClick={onToggle} 
                aria-label={`Mark task ${task.title} as ${task.isCompleted ? 'incomplete' : 'complete'}`}
                className={`w-6 h-6 rounded-md flex-shrink-0 mt-0.5 flex items-center justify-center border-2 transition-colors ${task.isCompleted ? 'bg-green-500 border-green-500' : 'border-zinc-600 hover:border-green-500'}`}>
                {task.isCompleted && <IconCheck size={16} className="text-white"/>}
            </button>
            <div className="flex-grow">
                <p className={`font-semibold text-white ${task.isCompleted ? 'line-through text-zinc-500' : ''}`}>{task.title}</p>
                <div className="flex items-center gap-4 text-xs text-zinc-400 mt-1">
                    <div className="flex items-center gap-1.5">
                        <CategoryIcon size={12} />
                        <span>{task.category}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <IconClock size={12} />
                        <span>{task.deadline}</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

const PriorityTasks: React.FC<{ data: DashboardData['priorityTasks']; onToggleTask: (id: string) => void }> = ({ data, onToggleTask }) => {
    if (data.isLoading) return <LoadingCard text="Finding Priority Tasks..." />;
    if (data.error) return <ErrorCard error={data.error} title="Could not get tasks" />;
    if (!data.tasks || data.tasks.length === 0) return null;

    return (
        <div className="p-4 rounded-2xl border border-zinc-800 bg-zinc-900/50">
             <div className="flex items-center gap-3 mb-4">
                <IconCheckCircle2 className="text-purple-400" size={20}/>
                <h4 className="font-bold text-white text-base">Your Priority Tasks</h4>
            </div>
            <div className="space-y-3">
                {data.tasks.map(task => <TaskCard key={task.id} task={task} onToggle={() => onToggleTask(task.id)} />)}
            </div>
        </div>
    );
}


const WeatherWidget: React.FC<{ weather: DashboardData['weather'] }> = ({ weather }) => {
    const WeatherIcon = weather.condition === 'Clear' ? IconSun : IconCloudRain;
    return (
        <div className="bg-zinc-900 p-4 rounded-2xl col-span-2 border border-zinc-800">
            <h3 className="text-sm font-semibold text-zinc-400 mb-3">Weather</h3>
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <WeatherIcon className="text-yellow-300" size={36} />
                    <div>
                        <p className="text-2xl font-bold text-white">{weather.temp}°C</p>
                        <p className="text-sm text-zinc-400">{weather.condition}</p>
                    </div>
                </div>
                <div className="text-right">
                     <p className="text-base text-white">{weather.windSpeed} km/h Wind</p>
                     <p className="text-sm text-zinc-400 truncate max-w-[150px]">{weather.forecast}</p>
                </div>
            </div>
        </div>
    );
};

const TeamWidget: React.FC<{ team: DashboardData['team'] }> = ({ team }) => (
    <div className="bg-zinc-900 p-4 rounded-2xl border border-zinc-800">
        <h3 className="text-sm font-semibold text-zinc-400 mb-2">Team Status</h3>
        <div className="flex items-baseline gap-2">
            <p className="text-4xl font-bold text-white">{team.onSite}</p>
            <p className="text-zinc-400 font-medium">/ {team.total} On Site</p>
        </div>
    </div>
);

const ProgressBar: React.FC<{ value: number; color: string }> = ({ value, color }) => (
    <div className="w-full bg-zinc-700 rounded-full h-2.5">
        <div className="rounded-full h-2.5" style={{ width: `${value}%`, backgroundColor: color }}></div>
    </div>
);

const ProgressWidget: React.FC<{ progress: DashboardData['progress'] }> = ({ progress }) => (
    <div className="bg-zinc-900 p-4 rounded-2xl col-span-2 border border-zinc-800">
        <div className="flex justify-between items-center mb-2">
            <h3 className="text-sm font-semibold text-zinc-400">Project Completion</h3>
            <p className="text-sm font-bold text-white">{progress.completion}%</p>
        </div>
        <ProgressBar value={progress.completion} color="#3b82f6" />
        <div className="flex justify-between items-center mt-4 mb-2">
            <h3 className="text-sm font-semibold text-zinc-400">Site Safety Score</h3>
            <p className="text-sm font-bold text-white">{progress.safetyScore} / 100</p>
        </div>
        <ProgressBar value={progress.safetyScore} color="#22c55e" />
    </div>
);

const EquipmentStatusWidget: React.FC<{ equipment: EquipmentInfo[] }> = ({ equipment }) => {
    const getStatusIndicator = (status: EquipmentInfo['status']) => {
        switch(status) {
            case 'Operational': return <div className="w-2.5 h-2.5 rounded-full bg-green-500" />;
            case 'Attention': return <div className="w-2.5 h-2.5 rounded-full bg-yellow-500 animate-pulse" />;
            case 'Offline': return <div className="w-2.5 h-2.5 rounded-full bg-zinc-500" />;
        }
    }
    return (
        <div className="bg-zinc-900 p-4 rounded-2xl border border-zinc-800">
            <h3 className="text-sm font-semibold text-zinc-400 mb-3">Equipment</h3>
            <ul className="space-y-2 text-sm">
                {equipment.map(item => (
                    <li key={item.id} className="flex items-center justify-between">
                       <div className="flex items-center gap-3">
                            {getStatusIndicator(item.status)}
                            <span className="text-zinc-200 font-medium">{item.name}</span>
                       </div>
                       <span className="text-zinc-500 font-semibold">{item.status}</span>
                    </li>
                ))}
            </ul>
        </div>
    );
};


const DashboardDisplay: React.FC<{ data: DashboardData | null, onToggleTask: (taskId: string) => void, onRefreshBriefing: () => void }> = ({ data, onToggleTask, onRefreshBriefing }) => {
    if (!data) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-zinc-500 p-4">
                <IconLoader className="animate-spin mb-4" size={32} />
                <p>Loading Dashboard...</p>
            </div>
        );
    }

    const { user, weather, team, equipment, progress, briefing, dailyFocus, priorityTasks } = data;

    return (
        <div className="space-y-5 p-4">
            <SalutationHeader user={user} />
            <DailyFocusCard focus={dailyFocus} />
            <BriefingFeed briefing={briefing} onRefreshBriefing={onRefreshBriefing} />
            <PriorityTasks data={priorityTasks} onToggleTask={onToggleTask} />
            
            <div>
                 <div className="flex items-center gap-3 mb-4 mt-6">
                    <IconBuilding className="text-purple-400" size={20}/>
                    <h4 className="font-bold text-white text-base">Project Vitals</h4>
                </div>
                <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <WeatherWidget weather={weather} />
                        <TeamWidget team={team} />
                    </div>
                     <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <ProgressWidget progress={progress} />
                        <EquipmentStatusWidget equipment={equipment} />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DashboardDisplay;