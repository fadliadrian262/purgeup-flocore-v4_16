import React from 'react';
import { PMInteractionData } from '../types';

interface PMInteractionDiagramProps {
    data: PMInteractionData;
    theme?: 'light' | 'dark';
}

const PMInteractionDiagram: React.FC<PMInteractionDiagramProps> = ({ data, theme = 'dark' }) => {
    if (!data || !data.capacityCurve || !data.demandPoint) {
        return <div className={`text-center p-4 rounded-lg ${theme === 'dark' ? 'bg-zinc-800 text-zinc-400' : 'bg-gray-100 text-gray-500'}`}>P-M Diagram data not available.</div>;
    }

    const { capacityCurve, demandPoint } = data;
    const width = 500;
    const height = 300;
    const margin = { top: 20, right: 20, bottom: 40, left: 60 };

    const colors = {
        dark: { axis: '#a1a1aa', text: '#d4d4d8', grid: '#3f3f46', capacity: '#3b82f6', demand: '#ef4444' },
        light: { axis: '#71717a', text: '#3f3f46', grid: '#e4e4e7', capacity: '#2563eb', demand: '#dc2626' }
    };
    const C = colors[theme];

    const allPoints = [...capacityCurve, demandPoint];
    const mMax = Math.max(0, ...allPoints.map(p => p.m)) * 1.1;
    const pMax = Math.max(0, ...allPoints.map(p => p.p)) * 1.1;
    
    const xScale = (m: number) => margin.left + (m / mMax) * (width - margin.left - margin.right);
    const yScale = (p: number) => (height - margin.bottom) - (p / pMax) * (height - margin.top - margin.bottom);
    
    const pathData = capacityCurve
        .sort((a, b) => b.p - a.p)
        .map((p, i) => `${i === 0 ? 'M' : 'L'} ${xScale(p.m)} ${yScale(p.p)}`).join(' ');

    return (
        <div className='w-full'>
            <h5 className={`font-semibold text-sm mb-1 text-center ${C.text}`}>P-M Interaction Diagram</h5>
            <svg viewBox={`0 0 ${width} ${height}`} width="100%">
                {/* Grid Lines */}
                <line x1={margin.left} y1={margin.top} x2={width - margin.right} y2={margin.top} stroke={C.grid} strokeWidth="1" />
                <line x1={width - margin.right} y1={margin.top} x2={width - margin.right} y2={height - margin.bottom} stroke={C.grid} strokeWidth="1" />
                
                {/* Axes */}
                <line x1={margin.left} y1={height - margin.bottom} x2={width - margin.right} y2={height - margin.bottom} stroke={C.axis} strokeWidth="1.5" />
                <line x1={margin.left} y1={margin.top} x2={margin.left} y2={height - margin.bottom} stroke={C.axis} strokeWidth="1.5" />
                
                {/* Axes Labels */}
                <text x={width/2} y={height - 5} textAnchor="middle" fontSize="12" fontWeight="bold" fill={C.text}>Moment, M (kNm)</text>
                <text x={margin.left - 45} y={height/2} transform={`rotate(-90, ${margin.left-45}, ${height/2})`} textAnchor="middle" fontSize="12" fontWeight="bold" fill={C.text}>Axial Load, P (kN)</text>
                
                {/* Ticks */}
                <text x={margin.left - 8} y={yScale(0)} textAnchor="end" dominantBaseline="middle" fontSize="10" fill={C.text}>0</text>
                <text x={margin.left - 8} y={yScale(pMax / 1.1)} textAnchor="end" dominantBaseline="middle" fontSize="10" fill={C.text}>{(pMax / 1.1).toFixed(0)}</text>
                <text x={xScale(0)} y={height - margin.bottom + 12} textAnchor="middle" fontSize="10" fill={C.text}>0</text>
                <text x={xScale(mMax / 1.1)} y={height - margin.bottom + 12} textAnchor="middle" fontSize="10" fill={C.text}>{(mMax / 1.1).toFixed(0)}</text>

                {/* Capacity Curve */}
                <path d={pathData} stroke={C.capacity} strokeWidth="2.5" fill="none" />
                
                {/* Demand Point */}
                <circle cx={xScale(demandPoint.m)} cy={yScale(demandPoint.p)} r="5" fill={C.demand} />
                <text x={xScale(demandPoint.m) + 8} y={yScale(demandPoint.p) + 4} fontSize="10" fontWeight="bold" fill={C.demand}>
                    (Mu={demandPoint.m.toFixed(1)}, Pu={demandPoint.p.toFixed(1)})
                </text>
            </svg>
        </div>
    );
}

export default PMInteractionDiagram;
