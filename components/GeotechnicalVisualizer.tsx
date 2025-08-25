import React from 'react';
import { GeotechnicalDrawingSpec } from '../types';

interface GeotechnicalVisualizerProps {
    spec: GeotechnicalDrawingSpec;
    theme?: 'light' | 'dark';
}

const GeotechnicalVisualizer: React.FC<GeotechnicalVisualizerProps> = ({ spec, theme = 'dark' }) => {
    if (!spec) {
        return <div className={`text-center p-4 rounded-lg ${theme === 'dark' ? 'bg-zinc-800 text-zinc-400' : 'bg-gray-100 text-gray-500'}`}>Drawing data not available.</div>;
    }

    const colors = {
        dark: { line: '#a1a1aa', text: '#d4d4d8', footing: '#71717a', soil: '#3f3f46', water: '#22d3ee', pressure: '#3b82f6' },
        light: { line: '#71717a', text: '#3f3f46', footing: '#a1a1aa', soil: '#e4e4e7', water: '#06b6d4', pressure: '#2563eb' }
    };
    const C = colors[theme];
    const { viewBox, footing, soilLayers, waterTableDepth, pressureBulb } = spec;

    // Define margins for labels and axes
    const margin = { top: 20, right: 100, bottom: 40, left: 60 };
    const chartWidth = viewBox.width - margin.left - margin.right;
    const chartHeight = viewBox.height - margin.top - margin.bottom;

    // --- ROBUST SCALING LOGIC ---
    // Dynamically determine the total depth and width required to fit all elements.
    const allDepths = soilLayers.map(l => l.depthBottom);
    if (waterTableDepth !== undefined) allDepths.push(waterTableDepth);
    const totalDepth = Math.max(...allDepths, footing.height + footing.y + 1); // Fit all content
    const totalWidth = Math.max(footing.width * 2.5, 8); // Ensure enough space around footing

    // Calculate scale factors to map real-world units (meters) to SVG coordinates (pixels).
    const scaleY = chartHeight / totalDepth;
    const scaleX = chartWidth / totalWidth;
    
    // Calculate the horizontal offset to center the main footing in the chart area.
    const xOffset = margin.left + (chartWidth / 2);

    return (
        <div className={`p-2 rounded-lg ${theme === 'dark' ? 'bg-zinc-950/50' : ''}`}>
             <svg viewBox={`0 0 ${viewBox.width} ${viewBox.height}`} width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
                <g>
                    {/* Soil Layers */}
                    {soilLayers.map((layer, i) => (
                        <g key={`layer-${i}`}>
                            <rect
                                x="0"
                                y={margin.top + layer.depthTop * scaleY}
                                width={viewBox.width}
                                height={(layer.depthBottom - layer.depthTop) * scaleY}
                                fill={C.soil}
                                stroke={C.line}
                                strokeWidth="0.5"
                                fillOpacity={i % 2 === 0 ? 0.3 : 0.6}
                            />
                             <text x={margin.left + chartWidth + 10} y={margin.top + (layer.depthTop + (layer.depthBottom - layer.depthTop) / 2) * scaleY} dominantBaseline="middle" fontSize="12" fontFamily="sans-serif" fill={C.text}>{layer.description}</text>
                        </g>
                    ))}
                    
                    {/* ENHANCED: Water Table Area */}
                    {waterTableDepth !== undefined && waterTableDepth >= 0 && (
                        <g>
                            <rect 
                                x="0"
                                y={margin.top + waterTableDepth * scaleY}
                                width={viewBox.width}
                                height={viewBox.height - (margin.top + waterTableDepth * scaleY)}
                                fill={C.water}
                                fillOpacity={0.2}
                            />
                            <line x1="0" y1={margin.top + waterTableDepth * scaleY} x2={viewBox.width} y2={margin.top + waterTableDepth * scaleY} stroke={C.water} strokeWidth="1.5" strokeDasharray="4 2" />
                            <text x={margin.left + chartWidth + 10} y={(margin.top + waterTableDepth * scaleY) + 5} dominantBaseline="hanging" fontSize="12" fontFamily="sans-serif" fill={C.water}>GWT</text>
                        </g>
                    )}

                    {/* Pressure Bulb */}
                    {pressureBulb && (
                        <ellipse
                            cx={xOffset + (pressureBulb.cx * scaleX)}
                            cy={margin.top + (pressureBulb.cy * scaleY)}
                            rx={pressureBulb.rx * scaleX}
                            ry={pressureBulb.ry * scaleY}
                            fill={C.pressure}
                            fillOpacity="0.2"
                            stroke={C.pressure}
                            strokeWidth="1.5"
                            strokeDasharray="3 2"
                        />
                    )}

                    {/* Footing */}
                    <rect
                        x={xOffset + (footing.x * scaleX)}
                        y={margin.top + (footing.y * scaleY)}
                        width={footing.width * scaleX}
                        height={footing.height * scaleY}
                        fill={C.footing}
                        stroke={C.text}
                        strokeWidth="1"
                    />
                    
                    {/* Depth Axis */}
                     <g>
                        <line x1={margin.left} y1={margin.top} x2={margin.left} y2={margin.top + chartHeight} stroke={C.line} strokeWidth="1" />
                        {Array.from({ length: Math.floor(totalDepth) + 1 }).map((_, i) => {
                            if (i % (Math.ceil(totalDepth / 8)) === 0 || i === Math.floor(totalDepth)) { // Don't draw too many ticks
                                return (
                                    <g key={`tick-${i}`}>
                                        <line x1={margin.left - 4} y1={margin.top + i * scaleY} x2={margin.left} y2={margin.top + i * scaleY} stroke={C.line} strokeWidth="1" />
                                        <text x={margin.left - 8} y={margin.top + i * scaleY} textAnchor="end" dominantBaseline="middle" fontSize="10" fontFamily="monospace" fill={C.text}>{i.toFixed(1)}m</text>
                                    </g>
                                );
                            }
                            return null;
                        })}
                    </g>
                </g>
            </svg>
        </div>
    );
};

export default GeotechnicalVisualizer;
