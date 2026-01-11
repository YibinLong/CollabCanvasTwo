import { useCanvasStore } from '@/store/canvasStore';
import type { CanvasShape } from '@/types/canvas';

describe('canvasStore', () => {
  beforeEach(() => {
    // Reset the store before each test
    useCanvasStore.getState().setShapes({});
    useCanvasStore.getState().clearSelection();
    useCanvasStore.getState().resetCanvas();
  });

  describe('shape management', () => {
    const mockShape: CanvasShape = {
      id: 'test-shape-1',
      type: 'rectangle',
      x: 100,
      y: 100,
      width: 200,
      height: 150,
      rotation: 0,
      scaleX: 1,
      scaleY: 1,
      fill: '#3B82F6',
      stroke: '#1E40AF',
      strokeWidth: 2,
      opacity: 1,
      visible: true,
      locked: false,
      name: 'Test Rectangle',
      zIndex: 0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      createdBy: 'user-1',
      lastEditedBy: 'user-1',
    };

    it('should add a shape', () => {
      useCanvasStore.getState().addShape(mockShape);
      const shapes = useCanvasStore.getState().shapes;
      expect(shapes[mockShape.id]).toEqual(mockShape);
    });

    it('should update a shape', () => {
      useCanvasStore.getState().addShape(mockShape);
      useCanvasStore.getState().updateShape(mockShape.id, { x: 200, y: 200 });

      const shapes = useCanvasStore.getState().shapes;
      expect(shapes[mockShape.id].x).toBe(200);
      expect(shapes[mockShape.id].y).toBe(200);
    });

    it('should delete shapes', () => {
      useCanvasStore.getState().addShape(mockShape);
      useCanvasStore.getState().deleteShapes([mockShape.id]);

      const shapes = useCanvasStore.getState().shapes;
      expect(shapes[mockShape.id]).toBeUndefined();
    });
  });

  describe('selection', () => {
    it('should set selected ids', () => {
      useCanvasStore.getState().setSelectedIds(['shape-1', 'shape-2']);
      expect(useCanvasStore.getState().selectedIds).toEqual(['shape-1', 'shape-2']);
    });

    it('should add to selection', () => {
      useCanvasStore.getState().setSelectedIds(['shape-1']);
      useCanvasStore.getState().addToSelection('shape-2');
      expect(useCanvasStore.getState().selectedIds).toEqual(['shape-1', 'shape-2']);
    });

    it('should clear selection', () => {
      useCanvasStore.getState().setSelectedIds(['shape-1', 'shape-2']);
      useCanvasStore.getState().clearSelection();
      expect(useCanvasStore.getState().selectedIds).toEqual([]);
    });
  });

  describe('viewport', () => {
    it('should set viewport position', () => {
      useCanvasStore.getState().setViewport(100, 200, 1.5);

      const state = useCanvasStore.getState();
      expect(state.viewportX).toBe(100);
      expect(state.viewportY).toBe(200);
      expect(state.scale).toBe(1.5);
    });

    it('should set scale', () => {
      useCanvasStore.getState().setScale(2);
      expect(useCanvasStore.getState().scale).toBe(2);
    });
  });

  describe('tools', () => {
    it('should set current tool', () => {
      useCanvasStore.getState().setCurrentTool({ type: 'circle' });
      expect(useCanvasStore.getState().currentTool.type).toBe('circle');
    });
  });

  describe('history (undo/redo)', () => {
    const shape1: CanvasShape = {
      id: 'shape-1',
      type: 'rectangle',
      x: 0,
      y: 0,
      width: 100,
      height: 100,
      rotation: 0,
      scaleX: 1,
      scaleY: 1,
      fill: '#000',
      stroke: '#000',
      strokeWidth: 1,
      opacity: 1,
      visible: true,
      locked: false,
      name: 'Shape 1',
      zIndex: 0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      createdBy: 'user-1',
      lastEditedBy: 'user-1',
    };

    it('should undo and redo shape changes', () => {
      // Add shape
      useCanvasStore.getState().addShape(shape1);
      expect(Object.keys(useCanvasStore.getState().shapes).length).toBe(1);

      // Undo
      useCanvasStore.getState().undo();
      expect(Object.keys(useCanvasStore.getState().shapes).length).toBe(0);

      // Redo
      useCanvasStore.getState().redo();
      expect(Object.keys(useCanvasStore.getState().shapes).length).toBe(1);
    });
  });

  describe('grid settings', () => {
    it('should toggle grid', () => {
      const initialState = useCanvasStore.getState().gridEnabled;
      useCanvasStore.getState().setGridEnabled(!initialState);
      expect(useCanvasStore.getState().gridEnabled).toBe(!initialState);
    });

    it('should toggle snap to grid', () => {
      const initialState = useCanvasStore.getState().snapToGrid;
      useCanvasStore.getState().setSnapToGrid(!initialState);
      expect(useCanvasStore.getState().snapToGrid).toBe(!initialState);
    });

    it('should set grid size', () => {
      useCanvasStore.getState().setGridSize(40);
      expect(useCanvasStore.getState().gridSize).toBe(40);
    });
  });
});
