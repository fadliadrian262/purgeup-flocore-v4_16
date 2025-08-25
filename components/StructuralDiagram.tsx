import React from 'react';
import { DiagramDataPoint } from '../types';

interface StructuralDiagramProps {
    data: {
        sfd: DiagramDataPoint[];
        bmd: DiagramDataPoint[];
        length: number;
    };
    theme?: 'light' | 'dark';
}

const Chart: React.FC<{
    title: string;
    points: DiagramDataPoint[];
    length: number;
    unit: string;
    theme: 'light' | 'dark';
    color: string;
}> = ({ title, points, length, unit, theme, color }) => {
    const width = 500;
    const height = 150;
    const margin = { top: 20, right: 20, bottom: 30, left: 50 };

    const colors = {
        dark: { axis: '#a1a1aa', text: '#d4d4d8', grid: '#3f3f46', zero: '#71717a' },
        light: { axis: '#71717a', text: '#3f3f46', grid: '#e4e4e7', zero: '#a1a1aa' }
    };
    const C = colors[theme];

    const yValues = points.map(p => p.y);
    const yMax = Math.max(0, ...yValues);
    const yMin = Math.min(0, ...yValues);
    
    // Make symmetrical if both positive and negative values exist
    const yAbsMax = Math.max(Math.abs(yMax), Math.abs(yMin));
    const finalYMax = yMax > 0 && yMin < 0 ? yAbsMax : yMax;
    const finalYMin = yMax > 0 && yMin < 0 ? -yAbsMax : yMin;

    const xScale = (x: number) => margin.left + (x / length) * (width - margin.left - margin.right);
    const yScale = (y: number) => (height - margin.bottom) - ((y - finalYMin) / (finalYMax - finalYMin)) * (height - margin.top - margin.bottom);
    
    const pathData = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${xScale(p.x)} ${yScale(p.y)}`).join(' ');

    const zeroLineY = yScale(0);

    return (
        <div className='w-full'>
            <h5 className={`font-semibold text-sm mb-1 ${C.text}`}>{title}</h5>
            <svg viewBox={`0 0 ${width} ${height}`} width="100%">
                {/* Grid Lines */}
                <line x1={margin.left} y1={margin.top} x2={margin.left} y2={height - margin.bottom} stroke={C.grid} strokeWidth="1" />
                <line x1={width - margin.right} y1={margin.top} x2={width - margin.right} y2={height - margin.bottom} stroke={C.grid} strokeWidth="1" />
                
                {/* Axes */}
                <line x1={margin.left} y1={height - margin.bottom} x2={width - margin.right} y2={height - margin.bottom} stroke={C.axis} strokeWidth="1" />
                <line x1={margin.left} y1={margin.top} x2={margin.left} y2={height - margin.bottom} stroke={C.axis} strokeWidth="1" />
                
                {/* Zero Line */}
                <line x1={margin.left} y1={zeroLineY} x2={width - margin.right} y2={zeroLineY} stroke={C.zero} strokeWidth="1" strokeDasharray="4 2" />

                {/* Path */}
                <path d={pathData} stroke={color} strokeWidth="2" fill="none" />
                
                {/* Labels */}
                <text x={margin.left - 8} y={yScale(finalYMax)} textAnchor="end" dominantBaseline="middle" fontSize="10" fill={C.text}>{finalYMax.toFixed(1)}</text>
                <text x={margin.left - 8} y={yScale(finalYMin)} textAnchor="end" dominantBaseline="middle" fontSize="10" fill={C.text}>{finalYMin.toFixed(1)}</text>
                <text x={margin.left - 8} y={yScale(0)} textAnchor="end" dominantBaseline="middle" fontSize="10" fill={C.text}>0</text>
                <text x={margin.left} y={height - margin.bottom + 12} textAnchor="middle" fontSize="10" fill={C.text}>0m</text>
                <text x={width - margin.right} y={height - margin.bottom + 12} textAnchor="middle" fontSize="10" fill={C.text}>{length}m</text>
                <text x={margin.left-35} y={(height - margin.bottom + margin.top) / 2} transform={`rotate(-90, ${margin.left-35}, ${(height - margin.bottom + margin.top) / 2})`} textAnchor="middle" fontSize="10" fill={C.text}>{unit}</text>

                {/* Min/Max Markers */}
                {points.map((p, i) => {
                    if (p.y === yMax || p.y === yMin) {
                        return (
                            <g key={i}>
                                <circle cx={xScale(p.x)} cy={yScale(p.y)} r="3" fill={color} />
                                <text x={xScale(p.x)} y={yScale(p.y) + (p.y >= 0 ? -8 : 16)} textAnchor="middle" fontSize="10" fontWeight="bold" fill={color}>{p.y.toFixed(1)}</text>
                            </g>
                        );
                    }
                    return null;
                })}
            </svg>
        </div>
    );
}

const StructuralDiagram: React.FC<StructuralDiagramProps> = ({ data, theme = 'dark' }) => {
    if (!data || !data.sfd || !data.bmd) {
        return <div className={`text-center p-4 rounded-lg ${theme === 'dark' ? 'bg-zinc-800 text-zinc-400' : 'bg-gray-100 text-gray-500'}`}>Diagram data not available.</div>;
    }

    return (
        <div className="space-y-4">
            <Chart title="Shear Force Diagram (SFD)" points={data.sfd} length={data.length} unit="kN" theme={theme} color="#3b82f6" />
            <Chart title="Bending Moment Diagram (BMD)" points={data.bmd} length={data.length} unit="kNm" theme={theme} color="#8b5cf6" />
        </div>
    );
};

export default StructuralDiagram;