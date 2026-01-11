'use client';

import React from 'react';
import { Line } from 'react-konva';

interface LassoSelectionProps {
  points: number[];
  isDrawing: boolean;
}

export const LassoSelection: React.FC<LassoSelectionProps> = ({ points, isDrawing }) => {
  if (points.length < 4) return null;

  return (
    <Line
      points={points}
      stroke="#3B82F6"
      strokeWidth={1.5}
      dash={[5, 5]}
      fill="rgba(59, 130, 246, 0.1)"
      closed={!isDrawing}
      listening={false}
    />
  );
};

// Helper function to check if a point is inside a polygon (lasso path)
export const isPointInPolygon = (
  x: number,
  y: number,
  polygon: number[]
): boolean => {
  let inside = false;
  const n = polygon.length / 2;

  for (let i = 0, j = n - 1; i < n; j = i++) {
    const xi = polygon[i * 2];
    const yi = polygon[i * 2 + 1];
    const xj = polygon[j * 2];
    const yj = polygon[j * 2 + 1];

    if (
      yi > y !== yj > y &&
      x < ((xj - xi) * (y - yi)) / (yj - yi) + xi
    ) {
      inside = !inside;
    }
  }

  return inside;
};

// Helper function to check if a shape (rectangle bounds) intersects with the lasso
export const isShapeInLasso = (
  shapeX: number,
  shapeY: number,
  shapeWidth: number,
  shapeHeight: number,
  scaleX: number,
  scaleY: number,
  polygon: number[]
): boolean => {
  // Check if any corner of the shape is inside the lasso
  const corners = [
    { x: shapeX, y: shapeY },
    { x: shapeX + shapeWidth * scaleX, y: shapeY },
    { x: shapeX + shapeWidth * scaleX, y: shapeY + shapeHeight * scaleY },
    { x: shapeX, y: shapeY + shapeHeight * scaleY },
  ];

  // Check if any corner is inside
  for (const corner of corners) {
    if (isPointInPolygon(corner.x, corner.y, polygon)) {
      return true;
    }
  }

  // Check if center is inside (for shapes fully contained)
  const centerX = shapeX + (shapeWidth * scaleX) / 2;
  const centerY = shapeY + (shapeHeight * scaleY) / 2;

  if (isPointInPolygon(centerX, centerY, polygon)) {
    return true;
  }

  return false;
};
