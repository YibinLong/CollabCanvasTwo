// Utility functions for calculating snap guides
import type { SnapGuide } from '@/types/canvas';

export interface ShapeBounds {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  centerX: number;
  centerY: number;
  right: number;
  bottom: number;
}

export function getShapeBounds(shape: {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  scaleX: number;
  scaleY: number;
}): ShapeBounds {
  const width = shape.width * shape.scaleX;
  const height = shape.height * shape.scaleY;
  return {
    id: shape.id,
    x: shape.x,
    y: shape.y,
    width,
    height,
    centerX: shape.x + width / 2,
    centerY: shape.y + height / 2,
    right: shape.x + width,
    bottom: shape.y + height,
  };
}

const SNAP_THRESHOLD = 5;

export interface SnapResult {
  guides: SnapGuide[];
  snapX: number | null;
  snapY: number | null;
  offsetX: number;
  offsetY: number;
}

export function calculateSnapGuides(
  movingShape: ShapeBounds,
  otherShapes: ShapeBounds[],
  threshold: number = SNAP_THRESHOLD
): SnapResult {
  const guides: SnapGuide[] = [];
  let snapX: number | null = null;
  let snapY: number | null = null;
  let offsetX = 0;
  let offsetY = 0;

  for (const target of otherShapes) {
    if (target.id === movingShape.id) continue;

    // Vertical guides (X alignment)
    // Left to left
    if (Math.abs(movingShape.x - target.x) <= threshold) {
      if (snapX === null) {
        snapX = target.x;
        offsetX = target.x - movingShape.x;
        const minY = Math.min(movingShape.y, target.y);
        const maxY = Math.max(movingShape.bottom, target.bottom);
        guides.push({ type: 'vertical', position: target.x, start: minY, end: maxY });
      }
    }
    // Right to right
    if (Math.abs(movingShape.right - target.right) <= threshold) {
      if (snapX === null) {
        snapX = target.right - movingShape.width;
        offsetX = target.right - movingShape.right;
        const minY = Math.min(movingShape.y, target.y);
        const maxY = Math.max(movingShape.bottom, target.bottom);
        guides.push({ type: 'vertical', position: target.right, start: minY, end: maxY });
      }
    }
    // Left to right
    if (Math.abs(movingShape.x - target.right) <= threshold) {
      if (snapX === null) {
        snapX = target.right;
        offsetX = target.right - movingShape.x;
        const minY = Math.min(movingShape.y, target.y);
        const maxY = Math.max(movingShape.bottom, target.bottom);
        guides.push({ type: 'vertical', position: target.right, start: minY, end: maxY });
      }
    }
    // Right to left
    if (Math.abs(movingShape.right - target.x) <= threshold) {
      if (snapX === null) {
        snapX = target.x - movingShape.width;
        offsetX = target.x - movingShape.right;
        const minY = Math.min(movingShape.y, target.y);
        const maxY = Math.max(movingShape.bottom, target.bottom);
        guides.push({ type: 'vertical', position: target.x, start: minY, end: maxY });
      }
    }
    // Center to center (vertical)
    if (Math.abs(movingShape.centerX - target.centerX) <= threshold) {
      if (snapX === null) {
        snapX = target.centerX - movingShape.width / 2;
        offsetX = target.centerX - movingShape.centerX;
        const minY = Math.min(movingShape.y, target.y);
        const maxY = Math.max(movingShape.bottom, target.bottom);
        guides.push({ type: 'vertical', position: target.centerX, start: minY, end: maxY });
      }
    }

    // Horizontal guides (Y alignment)
    // Top to top
    if (Math.abs(movingShape.y - target.y) <= threshold) {
      if (snapY === null) {
        snapY = target.y;
        offsetY = target.y - movingShape.y;
        const minX = Math.min(movingShape.x, target.x);
        const maxX = Math.max(movingShape.right, target.right);
        guides.push({ type: 'horizontal', position: target.y, start: minX, end: maxX });
      }
    }
    // Bottom to bottom
    if (Math.abs(movingShape.bottom - target.bottom) <= threshold) {
      if (snapY === null) {
        snapY = target.bottom - movingShape.height;
        offsetY = target.bottom - movingShape.bottom;
        const minX = Math.min(movingShape.x, target.x);
        const maxX = Math.max(movingShape.right, target.right);
        guides.push({ type: 'horizontal', position: target.bottom, start: minX, end: maxX });
      }
    }
    // Top to bottom
    if (Math.abs(movingShape.y - target.bottom) <= threshold) {
      if (snapY === null) {
        snapY = target.bottom;
        offsetY = target.bottom - movingShape.y;
        const minX = Math.min(movingShape.x, target.x);
        const maxX = Math.max(movingShape.right, target.right);
        guides.push({ type: 'horizontal', position: target.bottom, start: minX, end: maxX });
      }
    }
    // Bottom to top
    if (Math.abs(movingShape.bottom - target.y) <= threshold) {
      if (snapY === null) {
        snapY = target.y - movingShape.height;
        offsetY = target.y - movingShape.bottom;
        const minX = Math.min(movingShape.x, target.x);
        const maxX = Math.max(movingShape.right, target.right);
        guides.push({ type: 'horizontal', position: target.y, start: minX, end: maxX });
      }
    }
    // Center to center (horizontal)
    if (Math.abs(movingShape.centerY - target.centerY) <= threshold) {
      if (snapY === null) {
        snapY = target.centerY - movingShape.height / 2;
        offsetY = target.centerY - movingShape.centerY;
        const minX = Math.min(movingShape.x, target.x);
        const maxX = Math.max(movingShape.right, target.right);
        guides.push({ type: 'horizontal', position: target.centerY, start: minX, end: maxX });
      }
    }
  }

  return { guides, snapX, snapY, offsetX, offsetY };
}
