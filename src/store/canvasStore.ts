import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { nanoid } from 'nanoid';
import type {
  CanvasShape,
  CanvasTool,
  HistoryEntry,
  ShapeGroup,
  SnapGuide,
} from '@/types/canvas';

interface CanvasStore {
  // Canvas state
  shapes: Record<string, CanvasShape>;
  groups: Record<string, ShapeGroup>;

  // Viewport
  viewportX: number;
  viewportY: number;
  scale: number;

  // Selection
  selectedIds: string[];
  selectionBox: { x: number; y: number; width: number; height: number } | null;

  // Tool
  currentTool: CanvasTool;

  // Grid & Snapping
  gridEnabled: boolean;
  snapToGrid: boolean;
  gridSize: number;
  snapGuides: SnapGuide[];

  // History (undo/redo)
  history: HistoryEntry[];
  historyIndex: number;

  // Canvas metadata
  canvasId: string;
  canvasName: string;

  // Actions
  setShapes: (shapes: Record<string, CanvasShape>) => void;
  addShape: (shape: CanvasShape) => void;
  updateShape: (id: string, updates: Partial<CanvasShape>) => void;
  deleteShape: (id: string) => void;
  deleteShapes: (ids: string[]) => void;

  setViewport: (x: number, y: number, scale: number) => void;
  setScale: (scale: number) => void;
  pan: (deltaX: number, deltaY: number) => void;

  setSelectedIds: (ids: string[]) => void;
  addToSelection: (id: string) => void;
  removeFromSelection: (id: string) => void;
  clearSelection: () => void;
  selectAll: () => void;
  setSelectionBox: (box: { x: number; y: number; width: number; height: number } | null) => void;

  setCurrentTool: (tool: CanvasTool) => void;

  setGridEnabled: (enabled: boolean) => void;
  setSnapToGrid: (enabled: boolean) => void;
  setGridSize: (size: number) => void;
  setSnapGuides: (guides: SnapGuide[]) => void;

  // History actions
  pushToHistory: (entry: Omit<HistoryEntry, 'id' | 'timestamp'>) => void;
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;

  // Group actions
  groupShapes: (ids: string[]) => string | null;
  ungroupShapes: (groupId: string) => void;

  // Bulk operations
  duplicateShapes: (ids: string[]) => string[];
  bringToFront: (ids: string[]) => void;
  sendToBack: (ids: string[]) => void;
  bringForward: (ids: string[]) => void;
  sendBackward: (ids: string[]) => void;

  // Alignment
  alignShapes: (ids: string[], alignment: 'left' | 'right' | 'center' | 'top' | 'bottom' | 'middle') => void;
  distributeShapes: (ids: string[], direction: 'horizontal' | 'vertical') => void;

  // Canvas state
  setCanvasId: (id: string) => void;
  setCanvasName: (name: string) => void;
  resetCanvas: () => void;
}

const MAX_HISTORY = 50;

export const useCanvasStore = create<CanvasStore>()(
  subscribeWithSelector((set, get) => ({
    // Initial state
    shapes: {},
    groups: {},
    viewportX: 0,
    viewportY: 0,
    scale: 1,
    selectedIds: [],
    selectionBox: null,
    currentTool: { type: 'select' },
    gridEnabled: true,
    snapToGrid: true,
    gridSize: 20,
    snapGuides: [],
    history: [],
    historyIndex: -1,
    canvasId: '',
    canvasName: 'Untitled Canvas',

    // Shape actions
    setShapes: (shapes) => set({ shapes }),

    addShape: (shape) => {
      const { shapes, pushToHistory } = get();
      pushToHistory({
        action: 'create',
        shapes: [shape],
        userId: shape.createdBy,
      });
      set({ shapes: { ...shapes, [shape.id]: shape } });
    },

    updateShape: (id, updates) => {
      const { shapes, pushToHistory } = get();
      const shape = shapes[id];
      if (!shape) return;

      const previousShape = { ...shape };
      const updatedShape = {
        ...shape,
        ...updates,
        updatedAt: Date.now(),
      } as CanvasShape;

      pushToHistory({
        action: 'update',
        shapes: [updatedShape],
        previousShapes: [previousShape],
        userId: updatedShape.lastEditedBy,
      });

      set({ shapes: { ...shapes, [id]: updatedShape } });
    },

    deleteShape: (id) => {
      const { shapes, selectedIds, pushToHistory } = get();
      const shape = shapes[id];
      if (!shape) return;

      pushToHistory({
        action: 'delete',
        shapes: [shape],
        userId: shape.lastEditedBy,
      });

      const newShapes = { ...shapes };
      delete newShapes[id];

      set({
        shapes: newShapes,
        selectedIds: selectedIds.filter((sid) => sid !== id),
      });
    },

    deleteShapes: (ids) => {
      const { shapes, selectedIds, pushToHistory } = get();
      const shapesToDelete = ids.map((id) => shapes[id]).filter(Boolean) as CanvasShape[];

      if (shapesToDelete.length === 0) return;

      pushToHistory({
        action: 'delete',
        shapes: shapesToDelete,
        userId: shapesToDelete[0]?.lastEditedBy || '',
      });

      const newShapes = { ...shapes };
      ids.forEach((id) => delete newShapes[id]);

      set({
        shapes: newShapes,
        selectedIds: selectedIds.filter((id) => !ids.includes(id)),
      });
    },

    // Viewport actions
    setViewport: (x, y, scale) => set({ viewportX: x, viewportY: y, scale }),
    setScale: (scale) => set({ scale: Math.min(Math.max(scale, 0.1), 5) }),
    pan: (deltaX, deltaY) => {
      const { viewportX, viewportY } = get();
      set({ viewportX: viewportX + deltaX, viewportY: viewportY + deltaY });
    },

    // Selection actions
    setSelectedIds: (ids) => set({ selectedIds: ids }),
    addToSelection: (id) => {
      const { selectedIds } = get();
      if (!selectedIds.includes(id)) {
        set({ selectedIds: [...selectedIds, id] });
      }
    },
    removeFromSelection: (id) => {
      const { selectedIds } = get();
      set({ selectedIds: selectedIds.filter((sid) => sid !== id) });
    },
    clearSelection: () => set({ selectedIds: [], selectionBox: null }),
    selectAll: () => {
      const { shapes } = get();
      set({ selectedIds: Object.keys(shapes) });
    },
    setSelectionBox: (box) => set({ selectionBox: box }),

    // Tool actions
    setCurrentTool: (tool) => set({ currentTool: tool }),

    // Grid actions
    setGridEnabled: (enabled) => set({ gridEnabled: enabled }),
    setSnapToGrid: (enabled) => set({ snapToGrid: enabled }),
    setGridSize: (size) => set({ gridSize: size }),
    setSnapGuides: (guides) => set({ snapGuides: guides }),

    // History actions
    pushToHistory: (entry) => {
      const { history, historyIndex } = get();
      const newEntry: HistoryEntry = {
        ...entry,
        id: nanoid(),
        timestamp: Date.now(),
      };

      // Remove any entries after current index (for redo)
      const newHistory = history.slice(0, historyIndex + 1);
      newHistory.push(newEntry);

      // Limit history size
      if (newHistory.length > MAX_HISTORY) {
        newHistory.shift();
      }

      set({
        history: newHistory,
        historyIndex: newHistory.length - 1,
      });
    },

    undo: () => {
      const { history, historyIndex, shapes } = get();
      if (historyIndex < 0) return;

      const entry = history[historyIndex];
      if (!entry) return;

      const newShapes = { ...shapes };

      if (entry.action === 'create') {
        // Undo create = delete
        entry.shapes.forEach((shape) => delete newShapes[shape.id]);
      } else if (entry.action === 'delete') {
        // Undo delete = restore
        entry.shapes.forEach((shape) => (newShapes[shape.id] = shape));
      } else if (entry.action === 'update' && entry.previousShapes) {
        // Undo update = restore previous
        entry.previousShapes.forEach((shape) => (newShapes[shape.id] = shape));
      }

      set({ shapes: newShapes, historyIndex: historyIndex - 1 });
    },

    redo: () => {
      const { history, historyIndex, shapes } = get();
      if (historyIndex >= history.length - 1) return;

      const entry = history[historyIndex + 1];
      if (!entry) return;

      const newShapes = { ...shapes };

      if (entry.action === 'create') {
        // Redo create = add
        entry.shapes.forEach((shape) => (newShapes[shape.id] = shape));
      } else if (entry.action === 'delete') {
        // Redo delete = remove
        entry.shapes.forEach((shape) => delete newShapes[shape.id]);
      } else if (entry.action === 'update') {
        // Redo update = apply new
        entry.shapes.forEach((shape) => (newShapes[shape.id] = shape));
      }

      set({ shapes: newShapes, historyIndex: historyIndex + 1 });
    },

    canUndo: () => get().historyIndex >= 0,
    canRedo: () => get().historyIndex < get().history.length - 1,

    // Group actions
    groupShapes: (ids) => {
      if (ids.length < 2) return null;

      const { shapes, groups } = get();
      const groupId = nanoid();
      const groupName = `Group ${Object.keys(groups).length + 1}`;

      const group: ShapeGroup = {
        id: groupId,
        name: groupName,
        shapeIds: ids,
        createdAt: Date.now(),
        createdBy: shapes[ids[0]]?.createdBy || '',
      };

      const newShapes = { ...shapes };
      ids.forEach((id) => {
        if (newShapes[id]) {
          newShapes[id] = { ...newShapes[id], groupId };
        }
      });

      set({
        shapes: newShapes,
        groups: { ...groups, [groupId]: group },
      });

      return groupId;
    },

    ungroupShapes: (groupId) => {
      const { shapes, groups } = get();
      const group = groups[groupId];
      if (!group) return;

      const newShapes = { ...shapes };
      group.shapeIds.forEach((id) => {
        if (newShapes[id]) {
          const { groupId: _, ...shapeWithoutGroup } = newShapes[id];
          newShapes[id] = shapeWithoutGroup as CanvasShape;
        }
      });

      const newGroups = { ...groups };
      delete newGroups[groupId];

      set({ shapes: newShapes, groups: newGroups });
    },

    // Bulk operations
    duplicateShapes: (ids) => {
      const { shapes } = get();
      const newIds: string[] = [];
      const newShapes = { ...shapes };
      const timestamp = Date.now();

      ids.forEach((id) => {
        const shape = shapes[id];
        if (!shape) return;

        const newId = nanoid();
        newIds.push(newId);

        newShapes[newId] = {
          ...shape,
          id: newId,
          x: shape.x + 20,
          y: shape.y + 20,
          name: `${shape.name} (copy)`,
          createdAt: timestamp,
          updatedAt: timestamp,
          groupId: undefined,
        };
      });

      set({ shapes: newShapes, selectedIds: newIds });
      return newIds;
    },

    bringToFront: (ids) => {
      const { shapes } = get();
      const maxZIndex = Math.max(...Object.values(shapes).map((s) => s.zIndex), 0);
      const newShapes = { ...shapes };

      ids.forEach((id, index) => {
        if (newShapes[id]) {
          newShapes[id] = {
            ...newShapes[id],
            zIndex: maxZIndex + index + 1,
            updatedAt: Date.now(),
          };
        }
      });

      set({ shapes: newShapes });
    },

    sendToBack: (ids) => {
      const { shapes } = get();
      const minZIndex = Math.min(...Object.values(shapes).map((s) => s.zIndex), 0);
      const newShapes = { ...shapes };

      ids.forEach((id, index) => {
        if (newShapes[id]) {
          newShapes[id] = {
            ...newShapes[id],
            zIndex: minZIndex - ids.length + index,
            updatedAt: Date.now(),
          };
        }
      });

      set({ shapes: newShapes });
    },

    bringForward: (ids) => {
      const { shapes } = get();
      const newShapes = { ...shapes };

      ids.forEach((id) => {
        if (newShapes[id]) {
          newShapes[id] = {
            ...newShapes[id],
            zIndex: newShapes[id].zIndex + 1,
            updatedAt: Date.now(),
          };
        }
      });

      set({ shapes: newShapes });
    },

    sendBackward: (ids) => {
      const { shapes } = get();
      const newShapes = { ...shapes };

      ids.forEach((id) => {
        if (newShapes[id]) {
          newShapes[id] = {
            ...newShapes[id],
            zIndex: Math.max(0, newShapes[id].zIndex - 1),
            updatedAt: Date.now(),
          };
        }
      });

      set({ shapes: newShapes });
    },

    // Alignment
    alignShapes: (ids, alignment) => {
      const { shapes } = get();
      if (ids.length < 2) return;

      const selectedShapes = ids.map((id) => shapes[id]).filter(Boolean) as CanvasShape[];
      if (selectedShapes.length < 2) return;

      const bounds = {
        left: Math.min(...selectedShapes.map((s) => s.x)),
        right: Math.max(...selectedShapes.map((s) => s.x + s.width * s.scaleX)),
        top: Math.min(...selectedShapes.map((s) => s.y)),
        bottom: Math.max(...selectedShapes.map((s) => s.y + s.height * s.scaleY)),
      };

      const newShapes = { ...shapes };

      selectedShapes.forEach((shape) => {
        let newX = shape.x;
        let newY = shape.y;
        const shapeWidth = shape.width * shape.scaleX;
        const shapeHeight = shape.height * shape.scaleY;

        switch (alignment) {
          case 'left':
            newX = bounds.left;
            break;
          case 'right':
            newX = bounds.right - shapeWidth;
            break;
          case 'center':
            newX = bounds.left + (bounds.right - bounds.left) / 2 - shapeWidth / 2;
            break;
          case 'top':
            newY = bounds.top;
            break;
          case 'bottom':
            newY = bounds.bottom - shapeHeight;
            break;
          case 'middle':
            newY = bounds.top + (bounds.bottom - bounds.top) / 2 - shapeHeight / 2;
            break;
        }

        newShapes[shape.id] = {
          ...shape,
          x: newX,
          y: newY,
          updatedAt: Date.now(),
        };
      });

      set({ shapes: newShapes });
    },

    distributeShapes: (ids, direction) => {
      const { shapes } = get();
      if (ids.length < 3) return;

      const selectedShapes = ids
        .map((id) => shapes[id])
        .filter(Boolean) as CanvasShape[];
      if (selectedShapes.length < 3) return;

      const newShapes = { ...shapes };

      if (direction === 'horizontal') {
        const sorted = [...selectedShapes].sort((a, b) => a.x - b.x);
        const first = sorted[0];
        const last = sorted[sorted.length - 1];
        const totalWidth = sorted.reduce((sum, s) => sum + s.width * s.scaleX, 0);
        const availableSpace = (last.x + last.width * last.scaleX) - first.x - totalWidth;
        const gap = availableSpace / (sorted.length - 1);

        let currentX = first.x;
        sorted.forEach((shape) => {
          newShapes[shape.id] = {
            ...shape,
            x: currentX,
            updatedAt: Date.now(),
          };
          currentX += shape.width * shape.scaleX + gap;
        });
      } else {
        const sorted = [...selectedShapes].sort((a, b) => a.y - b.y);
        const first = sorted[0];
        const last = sorted[sorted.length - 1];
        const totalHeight = sorted.reduce((sum, s) => sum + s.height * s.scaleY, 0);
        const availableSpace = (last.y + last.height * last.scaleY) - first.y - totalHeight;
        const gap = availableSpace / (sorted.length - 1);

        let currentY = first.y;
        sorted.forEach((shape) => {
          newShapes[shape.id] = {
            ...shape,
            y: currentY,
            updatedAt: Date.now(),
          };
          currentY += shape.height * shape.scaleY + gap;
        });
      }

      set({ shapes: newShapes });
    },

    // Canvas state
    setCanvasId: (id) => set({ canvasId: id }),
    setCanvasName: (name) => set({ canvasName: name }),
    resetCanvas: () =>
      set({
        shapes: {},
        groups: {},
        selectedIds: [],
        selectionBox: null,
        history: [],
        historyIndex: -1,
      }),
  }))
);
