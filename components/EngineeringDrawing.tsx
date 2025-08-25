import React from 'react';
import { DrawingSpec } from '../types';

interface EngineeringDrawingProps {
    spec: DrawingSpec;
    theme?: 'light' | 'dark';
}

const EngineeringDrawing: React.FC<EngineeringDrawingProps> = ({ spec, theme = 'dark' }) => {
    if (!spec) {
        return <div className={`text-center p-4 rounded-lg ${theme === 'dark' ? 'bg-zinc-800 text-zinc-400' : 'bg-gray-100 text-gray-500'}`}>Drawing data not available.</div>;
    }
    
    const colors = {
        dark: { line: '#a1a1aa', text: '#d4d4d8', section: '#52525b', rebar: '#e4e4e7' },
        light: { line: '#71717a', text: '#3f3f46', section: '#d4d4d4', rebar: '#52525b' }
    };
    const C = colors[theme];
    const { viewBox, section, stirrup, mainRebar, topRebar, dimensions, labels } = spec;

    const renderDimension = (dim: typeof dimensions[0], index: number) => {
        const offset = 20;
        const tickSize = 4;
        
        if (dim.type === 'horizontal') {
            const y = dim.y ?? -offset;
            const path = `M ${dim.start},${y + tickSize} L ${dim.start},${y - tickSize} M ${dim.start},${y} L ${dim.end},${y} M ${dim.end},${y + tickSize} L ${dim.end},${y - tickSize}`;
            return (
                <g key={`dim-h-${index}`}>
                    <path d={path} stroke={C.line} strokeWidth="1" fill="none" />
                    <text x={(dim.start + dim.end) / 2} y={y - 16} textAnchor="middle" fontSize="28" fontFamily="monospace" fill={C.text}>{dim.label}</text>
                </g>
            );
        } else { // vertical
            const x = dim.x ?? -offset;
            const path = `M ${x + tickSize},${dim.start} L ${x - tickSize},${dim.start} M ${x},${dim.start} L ${x},${dim.end} M ${x + tickSize},${dim.end} L ${x - tickSize},${dim.end}`;
            return (
                 <g key={`dim-v-${index}`} transform={`translate(${x}, ${(dim.start + dim.end) / 2}) rotate(-90)`}>
                    <path d={path.replace(/M \S+/g, 'M 0')} transform={`translate(${-x}, -${(dim.start + dim.end) / 2})`} stroke={C.line} strokeWidth="1" fill="none" />
                    <text x="0" y="-16" textAnchor="middle" fontSize="28" fontFamily="monospace" fill={C.text}>{dim.label}</text>
                </g>
            );
        }
    };

    return (
        <div className={`p-2 rounded-lg ${theme === 'dark' ? 'bg-zinc-950/50' : ''}`}>
             <svg viewBox={`${viewBox.width / -4} ${viewBox.height / -4} ${viewBox.width * 1.5} ${viewBox.height * 1.5}`} width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
                <g transform={`translate(${((viewBox.width-section.width)/2)}, ${((viewBox.height-section.height)/2)})`}>
                    {/* Concrete Section */}
                    <rect x="0" y="0" width={section.width} height={section.height} fill={C.section} rx="5" />
                    
                    {/* Stirrup */}
                    <rect x={stirrup.x} y={stirrup.y} width={stirrup.width} height={stirrup.height} stroke={C.rebar} strokeWidth="2" fill="none" rx="8" />

                    {/* Rebar */}
                    {mainRebar.map((bar, i) => <circle key={`main-${i}`} cx={bar.cx} cy={bar.cy} r={bar.radius} fill={C.rebar} />)}
                    {topRebar?.map((bar, i) => <circle key={`top-${i}`} cx={bar.cx} cy={bar.cy} r={bar.radius} fill={C.rebar} />)}
                    
                    {/* Dimensions */}
                    {dimensions.map(renderDimension)}

                    {/* Labels */}
                    {labels.map((label, i) => (
                        <text key={`label-${i}`} x={label.x} y={label.y} textAnchor={label.anchor} fontSize="28" fontFamily="monospace" fill={C.text}>{label.text}</text>
                    ))}
                </g>
            </svg>
        </div>
    );
};

export default EngineeringDrawing;