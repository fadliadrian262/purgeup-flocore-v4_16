
import React from 'react';
import { DetectedObject } from '../types';

const getStatusColor = (): string => {
  return 'rgba(249, 115, 22, 0.8)'; // Default orange
};

export const DetectionsOverlay: React.FC<{ objects: DetectedObject[] }> = ({ objects }) => {
  return (
    <div className="absolute inset-0">
      {objects.map((obj) => {
        const color = getStatusColor();
        const boxShadow = color.replace('0.8', '0.5');

        return (
          <div
            key={`detected-${obj.id}`}
            className={`absolute border-2 transition-all duration-300`}
            style={{
              left: `${obj.bounds.left}%`,
              top: `${obj.bounds.top}%`,
              width: `${obj.bounds.width}%`,
              height: `${obj.bounds.height}%`,
              borderColor: color,
              boxShadow: `0 0 10px ${boxShadow}`,
              borderRadius: '8px',
            }}
          >
            <div
              className="absolute -top-8 left-0 text-white text-xs font-bold p-1 px-2 rounded"
              style={{ backgroundColor: color }}
            >
              {obj.label} {`${(obj.confidence * 100).toFixed(0)}%`}
            </div>
          </div>
        );
      })}
    </div>
  );
};
