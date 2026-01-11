// Canvas Types for CollabCanvas

export type ShapeType = 'rectangle' | 'circle' | 'line' | 'text' | 'triangle' | 'star' | 'image';

export interface Point {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

export interface Transform {
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  scaleX: number;
  scaleY: number;
}

export interface BaseShape {
  id: string;
  type: ShapeType;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  scaleX: number;
  scaleY: number;
  fill: string;
  stroke: string;
  strokeWidth: number;
  opacity: number;
  visible: boolean;
  locked: boolean;
  name: string;
  zIndex: number;
  groupId?: string;
  createdAt: number;
  updatedAt: number;
  createdBy: string;
  lastEditedBy: string;
}

export interface RectangleShape extends BaseShape {
  type: 'rectangle';
  cornerRadius?: number;
}

export interface CircleShape extends BaseShape {
  type: 'circle';
  radiusX?: number;
  radiusY?: number;
}

export interface LineShape extends BaseShape {
  type: 'line';
  points: number[];
}

export interface TextShape extends BaseShape {
  type: 'text';
  text: string;
  fontSize: number;
  fontFamily: string;
  fontStyle: 'normal' | 'bold' | 'italic' | 'bold italic';
  textAlign: 'left' | 'center' | 'right';
  textDecoration: 'none' | 'underline' | 'line-through';
}

export interface TriangleShape extends BaseShape {
  type: 'triangle';
}

export interface StarShape extends BaseShape {
  type: 'star';
  numPoints: number;
  innerRadius: number;
  outerRadius: number;
}

export interface ImageShape extends BaseShape {
  type: 'image';
  src: string;
}

export type CanvasShape =
  | RectangleShape
  | CircleShape
  | LineShape
  | TextShape
  | TriangleShape
  | StarShape
  | ImageShape;

export interface ShapeGroup {
  id: string;
  name: string;
  shapeIds: string[];
  createdAt: number;
  createdBy: string;
}

export interface CursorPosition {
  odId: string;
  x: number;
  y: number;
  userId: string;
  userName: string;
  userColor: string;
  timestamp: number;
}

export interface User {
  id: string;
  email: string;
  displayName: string;
  photoURL?: string;
  color: string;
  isOnline: boolean;
  lastSeen: number;
}

export interface CanvasState {
  id: string;
  name: string;
  shapes: Record<string, CanvasShape>;
  groups: Record<string, ShapeGroup>;
  viewport: {
    x: number;
    y: number;
    scale: number;
  };
  gridEnabled: boolean;
  snapToGrid: boolean;
  gridSize: number;
  createdAt: number;
  updatedAt: number;
  version: number;
}

export interface HistoryEntry {
  id: string;
  action: 'create' | 'update' | 'delete' | 'batch';
  shapes: CanvasShape[];
  previousShapes?: CanvasShape[];
  timestamp: number;
  userId: string;
}

export interface SelectionState {
  selectedIds: string[];
  selectionBox: {
    x: number;
    y: number;
    width: number;
    height: number;
  } | null;
}

export interface CanvasTool {
  type: 'select' | 'rectangle' | 'circle' | 'line' | 'text' | 'triangle' | 'star' | 'pan' | 'hand';
}

export interface SnapGuide {
  type: 'vertical' | 'horizontal';
  position: number;
  start: number;
  end: number;
}

// AI Agent Types
export interface AICommand {
  id: string;
  command: string;
  userId: string;
  userName: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  result?: string;
  error?: string;
  createdAt: number;
  completedAt?: number;
}

export interface AIAction {
  type: 'create' | 'move' | 'resize' | 'rotate' | 'delete' | 'style' | 'arrange';
  params: Record<string, unknown>;
}

// Layer panel types
export interface LayerItem {
  id: string;
  name: string;
  type: ShapeType;
  visible: boolean;
  locked: boolean;
  depth: number;
  children?: LayerItem[];
}

// Version history types
export interface CanvasVersion {
  id: string;
  name: string;
  shapes: Record<string, CanvasShape>;
  groups: Record<string, ShapeGroup>;
  timestamp: number;
  createdBy: string;
  createdByName: string;
}
