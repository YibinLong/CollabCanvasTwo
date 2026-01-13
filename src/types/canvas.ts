// Canvas Types for CollabCanvas

export type ShapeType = 'rectangle' | 'circle' | 'line' | 'text' | 'triangle' | 'star' | 'image' | 'frame' | 'path';

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

export type BlendMode =
  | 'normal'
  | 'multiply'
  | 'screen'
  | 'overlay'
  | 'darken'
  | 'lighten'
  | 'color-dodge'
  | 'color-burn'
  | 'hard-light'
  | 'soft-light'
  | 'difference'
  | 'exclusion'
  | 'hue'
  | 'saturation'
  | 'color'
  | 'luminosity';

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
  blendMode?: BlendMode;
  shadowEnabled?: boolean;
  shadowColor?: string;
  shadowBlur?: number;
  shadowOffsetX?: number;
  shadowOffsetY?: number;
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

// Bezier path point for vector editing
export interface PathPoint {
  x: number;
  y: number;
  handleIn?: { x: number; y: number };  // Control point for incoming curve
  handleOut?: { x: number; y: number }; // Control point for outgoing curve
  type: 'corner' | 'smooth' | 'symmetric';
}

export interface PathShape extends BaseShape {
  type: 'path';
  points: PathPoint[];
  closed: boolean;
}

// Auto-layout types (needed before Frame)
export interface AutoLayoutConfig {
  direction: 'horizontal' | 'vertical';
  gap: number;
  padding: number;
  alignment: 'start' | 'center' | 'end' | 'stretch';
  wrap: boolean;
}

export interface Frame extends BaseShape {
  type: 'frame';
  autoLayout?: AutoLayoutConfig;
  childIds: string[];
}

export type CanvasShape =
  | RectangleShape
  | CircleShape
  | LineShape
  | TextShape
  | TriangleShape
  | StarShape
  | ImageShape
  | PathShape
  | Frame;

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
  isGuest?: boolean;
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
  type: 'select' | 'lasso' | 'rectangle' | 'circle' | 'line' | 'text' | 'triangle' | 'star' | 'pan' | 'hand' | 'frame' | 'comment' | 'pen';
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

// Comment/Annotation types
export interface Comment {
  id: string;
  x: number;
  y: number;
  text: string;
  userId: string;
  userName: string;
  userColor: string;
  shapeId?: string; // Optional: attach comment to a specific shape
  resolved: boolean;
  createdAt: number;
  updatedAt: number;
  replies: CommentReply[];
}

export interface CommentReply {
  id: string;
  text: string;
  userId: string;
  userName: string;
  userColor: string;
  createdAt: number;
}

// Component/Symbol system types
export interface Component {
  id: string;
  name: string;
  description?: string;
  shapes: CanvasShape[];
  width: number;
  height: number;
  createdAt: number;
  updatedAt: number;
  createdBy: string;
}

export interface ComponentInstance {
  id: string;
  componentId: string;
  x: number;
  y: number;
  scaleX: number;
  scaleY: number;
  overrides?: Record<string, Partial<CanvasShape>>; // Shape ID -> overridden properties
}

// Design Tokens / Styles system
export interface ColorToken {
  id: string;
  name: string;
  value: string; // hex color
}

export interface TextStyle {
  id: string;
  name: string;
  fontSize: number;
  fontFamily: string;
  fontStyle: 'normal' | 'bold' | 'italic' | 'bold italic';
  letterSpacing?: number;
  lineHeight?: number;
}

export interface DesignTokens {
  colors: ColorToken[];
  textStyles: TextStyle[];
}

// Prototyping/Interaction types (Tier 3 feature)
export type InteractionTrigger = 'click' | 'hover' | 'drag';
export type InteractionAction = 'navigate' | 'open-overlay' | 'scroll-to' | 'back';

export interface Interaction {
  id: string;
  sourceShapeId: string;
  trigger: InteractionTrigger;
  action: InteractionAction;
  targetFrameId?: string; // Frame to navigate to
  animation?: 'instant' | 'dissolve' | 'slide-left' | 'slide-right' | 'slide-up' | 'slide-down';
  duration?: number; // ms
}

export interface PrototypeState {
  isPreviewMode: boolean;
  currentFrameId: string | null;
  navigationHistory: string[];
  interactions: Record<string, Interaction>;
}
