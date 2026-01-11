'use client';

import React from 'react';
import { Line } from 'react-konva';
import type { SnapGuide } from '@/types/canvas';

// Re-export utilities for convenience
export { getShapeBounds, calculateSnapGuides } from '@/lib/smartGuidesUtils';
export type { ShapeBounds, SnapResult } from '@/lib/smartGuidesUtils';

interface SmartGuidesProps {
  guides: SnapGuide[];
  viewportWidth: number;
  viewportHeight: number;
}

export const SmartGuides: React.FC<SmartGuidesProps> = ({
  guides,
  viewportWidth,
  viewportHeight,
}) => {
  return (
    <>
      {guides.map((guide, index) => {
        if (guide.type === 'vertical') {
          return (
            <Line
              key={`v-${index}`}
              points={[guide.position, -viewportHeight, guide.position, viewportHeight * 2]}
              stroke="#FF4081"
              strokeWidth={1}
              dash={[4, 4]}
              opacity={0.8}
              listening={false}
            />
          );
        } else {
          return (
            <Line
              key={`h-${index}`}
              points={[-viewportWidth, guide.position, viewportWidth * 2, guide.position]}
              stroke="#FF4081"
              strokeWidth={1}
              dash={[4, 4]}
              opacity={0.8}
              listening={false}
            />
          );
        }
      })}
    </>
  );
};

export default SmartGuides;
