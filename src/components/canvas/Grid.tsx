'use client';

import React, { useMemo } from 'react';
import { Line, Group } from 'react-konva';

interface GridProps {
  width: number;
  height: number;
  gridSize: number;
  scale: number;
  offsetX: number;
  offsetY: number;
}

export const Grid: React.FC<GridProps> = ({
  width,
  height,
  gridSize,
  scale,
  offsetX,
  offsetY,
}) => {
  const lines = useMemo(() => {
    const result: React.ReactNode[] = [];
    const scaledGridSize = gridSize * scale;

    // Calculate visible area
    const startX = Math.floor(-offsetX / scaledGridSize) * scaledGridSize;
    const startY = Math.floor(-offsetY / scaledGridSize) * scaledGridSize;
    const endX = startX + width + scaledGridSize * 2;
    const endY = startY + height + scaledGridSize * 2;

    // Vertical lines
    for (let x = startX; x < endX; x += scaledGridSize) {
      result.push(
        <Line
          key={`v-${x}`}
          points={[x + offsetX, 0, x + offsetX, height]}
          stroke="#e5e7eb"
          strokeWidth={1}
          listening={false}
        />
      );
    }

    // Horizontal lines
    for (let y = startY; y < endY; y += scaledGridSize) {
      result.push(
        <Line
          key={`h-${y}`}
          points={[0, y + offsetY, width, y + offsetY]}
          stroke="#e5e7eb"
          strokeWidth={1}
          listening={false}
        />
      );
    }

    return result;
  }, [width, height, gridSize, scale, offsetX, offsetY]);

  return <Group listening={false}>{lines}</Group>;
};
