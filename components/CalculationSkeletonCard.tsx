import React from 'react';
import { IconSparkles, IconWrench, IconGlobe } from './icons';

interface CalculationSkeletonCardProps {
    type: 'structural' | 'geotechnical';
}

const SkeletonSection: React.FC = () => (
    <div>
        <div className="h-5 w-1/3 bg-zinc-700 rounded mb-3 animate-pulse"></div>
        <div className="space-y-2">
            <div className="h-10 w-full bg-zinc-800 rounded-lg animate-pulse"></div>
            <div className="h-10 w-full bg-zinc-800 rounded-lg animate-pulse" style={{ animationDelay: '100ms' }}></div>
        </div>
    </div>
);


const CalculationSkeletonCard: React.FC<CalculationSkeletonCardProps> = ({ type }) => {
    const cardInfo = type === 'structural'
        ? { icon: IconWrench, title: 'Contacting Structural Specialist...' }
        : { icon: IconGlobe, title: 'Contacting Geotechnical Specialist...' };

    return (
        <div className="mb-6 animate-fade-in">
            <p className="font-semibold text-purple-400 text-sm flex items-center gap-2">
                 <IconSparkles size={16}/>
                 <span>FLOCORE AI</span>
            </p>
            <div className="mt-2 pl-8">
                <div className="p-4 bg-zinc-900 rounded-xl border border-zinc-700 space-y-6">
                    <div className="flex justify-between items-center pb-4 border-b border-zinc-800">
                        <div className="flex items-center gap-3">
                            <cardInfo.icon size={20} className="text-zinc-500 animate-pulse" />
                            <div className="h-6 w-48 bg-zinc-700 rounded animate-pulse"></div>
                        </div>
                        <div className="h-8 w-32 bg-zinc-800 rounded-full animate-pulse"></div>
                    </div>

                    <div className="space-y-6">
                        <SkeletonSection />
                        <SkeletonSection />
                        <SkeletonSection />
                    </div>
                </div>
            </div>
            <hr className="border-t border-zinc-800 my-6" />
        </div>
    );
};

export default CalculationSkeletonCard;
