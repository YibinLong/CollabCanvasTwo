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

  describe('clipboard', () => {
    const shape1: CanvasShape = {
      id: 'clipboard-shape-1',
      type: 'rectangle',
      x: 100,
      y: 100,
      width: 100,
      height: 100,
      rotation: 0,
      scaleX: 1,
      scaleY: 1,
      fill: '#FF0000',
      stroke: '#000',
      strokeWidth: 1,
      opacity: 1,
      visible: true,
      locked: false,
      name: 'Clipboard Shape',
      zIndex: 0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      createdBy: 'user-1',
      lastEditedBy: 'user-1',
    };

    it('should copy shapes to clipboard', () => {
      useCanvasStore.getState().addShape(shape1);
      useCanvasStore.getState().copyShapes([shape1.id]);

      expect(useCanvasStore.getState().clipboard.length).toBe(1);
      expect(useCanvasStore.getState().hasClipboard()).toBe(true);
    });

    it('should paste shapes from clipboard', () => {
      useCanvasStore.getState().addShape(shape1);
      useCanvasStore.getState().copyShapes([shape1.id]);
      const pastedIds = useCanvasStore.getState().pasteShapes();

      expect(pastedIds.length).toBe(1);
      const shapes = useCanvasStore.getState().shapes;
      expect(Object.keys(shapes).length).toBe(2);
    });

    it('should cut shapes (copy + delete)', () => {
      useCanvasStore.getState().addShape(shape1);
      useCanvasStore.getState().cutShapes([shape1.id]);

      expect(useCanvasStore.getState().clipboard.length).toBe(1);
      expect(useCanvasStore.getState().shapes[shape1.id]).toBeUndefined();
    });

    it('should paste with offset', () => {
      useCanvasStore.getState().addShape(shape1);
      useCanvasStore.getState().copyShapes([shape1.id]);
      const pastedIds = useCanvasStore.getState().pasteShapes(50, 50);

      const pastedShape = useCanvasStore.getState().shapes[pastedIds[0]];
      expect(pastedShape.x).toBe(shape1.x + 50);
      expect(pastedShape.y).toBe(shape1.y + 50);
    });
  });

  describe('version history', () => {
    const shape1: CanvasShape = {
      id: 'version-shape-1',
      type: 'circle',
      x: 50,
      y: 50,
      width: 80,
      height: 80,
      rotation: 0,
      scaleX: 1,
      scaleY: 1,
      fill: '#00FF00',
      stroke: '#000',
      strokeWidth: 1,
      opacity: 1,
      visible: true,
      locked: false,
      name: 'Version Shape',
      zIndex: 0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      createdBy: 'user-1',
      lastEditedBy: 'user-1',
    };

    it('should save a version', () => {
      useCanvasStore.getState().addShape(shape1);
      const versionId = useCanvasStore.getState().saveVersion('v1', 'user-1', 'Test User');

      expect(versionId).toBeDefined();
      const versions = useCanvasStore.getState().getVersions();
      expect(versions.length).toBe(1);
      expect(versions[0].name).toBe('v1');
    });

    it('should restore a version', () => {
      useCanvasStore.getState().addShape(shape1);
      const versionId = useCanvasStore.getState().saveVersion('v1', 'user-1', 'Test User');

      // Modify the canvas
      useCanvasStore.getState().updateShape(shape1.id, { x: 200 });

      // Restore
      const result = useCanvasStore.getState().restoreVersion(versionId);
      expect(result).toBe(true);

      const restoredShape = useCanvasStore.getState().shapes[shape1.id];
      expect(restoredShape.x).toBe(50); // Original position
    });

    it('should delete a version', () => {
      useCanvasStore.getState().addShape(shape1);
      const initialCount = useCanvasStore.getState().getVersions().length;
      const versionId = useCanvasStore.getState().saveVersion('v1', 'user-1', 'Test User');

      expect(useCanvasStore.getState().getVersions().length).toBe(initialCount + 1);
      useCanvasStore.getState().deleteVersion(versionId);
      expect(useCanvasStore.getState().getVersions().length).toBe(initialCount);
    });
  });

  describe('clearShapes', () => {
    it('should clear all shapes from canvas', () => {
      const shape1: CanvasShape = {
        id: 'clear-shape-1',
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
        name: 'Clear Shape 1',
        zIndex: 0,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        createdBy: 'user-1',
        lastEditedBy: 'user-1',
      };

      const shape2: CanvasShape = {
        ...shape1,
        id: 'clear-shape-2',
        name: 'Clear Shape 2',
      };

      useCanvasStore.getState().addShape(shape1);
      useCanvasStore.getState().addShape(shape2);
      expect(Object.keys(useCanvasStore.getState().shapes).length).toBe(2);

      useCanvasStore.getState().clearShapes();
      expect(Object.keys(useCanvasStore.getState().shapes).length).toBe(0);
    });

    it('should be undoable', () => {
      const shape1: CanvasShape = {
        id: 'undo-clear-shape',
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
        name: 'Undo Clear Shape',
        zIndex: 0,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        createdBy: 'user-1',
        lastEditedBy: 'user-1',
      };

      useCanvasStore.getState().addShape(shape1);
      useCanvasStore.getState().clearShapes();
      expect(Object.keys(useCanvasStore.getState().shapes).length).toBe(0);

      useCanvasStore.getState().undo();
      expect(Object.keys(useCanvasStore.getState().shapes).length).toBe(1);
    });
  });

  describe('grouping', () => {
    const shape1: CanvasShape = {
      id: 'group-shape-1',
      type: 'rectangle',
      x: 0,
      y: 0,
      width: 50,
      height: 50,
      rotation: 0,
      scaleX: 1,
      scaleY: 1,
      fill: '#FF0000',
      stroke: '#000',
      strokeWidth: 1,
      opacity: 1,
      visible: true,
      locked: false,
      name: 'Group Shape 1',
      zIndex: 0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      createdBy: 'user-1',
      lastEditedBy: 'user-1',
    };

    const shape2: CanvasShape = {
      ...shape1,
      id: 'group-shape-2',
      x: 100,
      name: 'Group Shape 2',
    };

    it('should group shapes', () => {
      useCanvasStore.getState().addShape(shape1);
      useCanvasStore.getState().addShape(shape2);

      const groupId = useCanvasStore.getState().groupShapes([shape1.id, shape2.id]);

      expect(groupId).toBeDefined();
      const groups = useCanvasStore.getState().groups;
      expect(groups[groupId!]).toBeDefined();
      expect(groups[groupId!].shapeIds).toContain(shape1.id);
      expect(groups[groupId!].shapeIds).toContain(shape2.id);
    });

    it('should ungroup shapes', () => {
      useCanvasStore.getState().addShape(shape1);
      useCanvasStore.getState().addShape(shape2);

      const groupId = useCanvasStore.getState().groupShapes([shape1.id, shape2.id]);
      useCanvasStore.getState().ungroupShapes(groupId!);

      const groups = useCanvasStore.getState().groups;
      expect(groups[groupId!]).toBeUndefined();
    });
  });

  describe('layer operations', () => {
    const createShape = (id: string, zIndex: number): CanvasShape => ({
      id,
      type: 'rectangle',
      x: 0,
      y: 0,
      width: 50,
      height: 50,
      rotation: 0,
      scaleX: 1,
      scaleY: 1,
      fill: '#FF0000',
      stroke: '#000',
      strokeWidth: 1,
      opacity: 1,
      visible: true,
      locked: false,
      name: `Shape ${id}`,
      zIndex,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      createdBy: 'user-1',
      lastEditedBy: 'user-1',
    });

    it('should bring to front', () => {
      const shape1 = createShape('layer-1', 0);
      const shape2 = createShape('layer-2', 1);
      const shape3 = createShape('layer-3', 2);

      useCanvasStore.getState().addShapeWithoutHistory(shape1);
      useCanvasStore.getState().addShapeWithoutHistory(shape2);
      useCanvasStore.getState().addShapeWithoutHistory(shape3);

      useCanvasStore.getState().bringToFront([shape1.id]);

      const updatedShape1 = useCanvasStore.getState().shapes[shape1.id];
      expect(updatedShape1.zIndex).toBeGreaterThan(shape3.zIndex);
    });

    it('should send to back', () => {
      const shape1 = createShape('back-1', 0);
      const shape2 = createShape('back-2', 1);
      const shape3 = createShape('back-3', 2);

      useCanvasStore.getState().addShapeWithoutHistory(shape1);
      useCanvasStore.getState().addShapeWithoutHistory(shape2);
      useCanvasStore.getState().addShapeWithoutHistory(shape3);

      useCanvasStore.getState().sendToBack([shape3.id]);

      const updatedShape3 = useCanvasStore.getState().shapes[shape3.id];
      expect(updatedShape3.zIndex).toBeLessThan(shape1.zIndex);
    });
  });

  describe('duplicate shapes', () => {
    const shape1: CanvasShape = {
      id: 'dup-shape-1',
      type: 'rectangle',
      x: 100,
      y: 100,
      width: 100,
      height: 100,
      rotation: 0,
      scaleX: 1,
      scaleY: 1,
      fill: '#0000FF',
      stroke: '#000',
      strokeWidth: 1,
      opacity: 1,
      visible: true,
      locked: false,
      name: 'Duplicate Shape',
      zIndex: 0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      createdBy: 'user-1',
      lastEditedBy: 'user-1',
    };

    it('should duplicate shapes with offset', () => {
      useCanvasStore.getState().addShape(shape1);
      const duplicatedIds = useCanvasStore.getState().duplicateShapes([shape1.id]);

      expect(duplicatedIds.length).toBe(1);
      const duplicatedShape = useCanvasStore.getState().shapes[duplicatedIds[0]];
      expect(duplicatedShape.x).toBe(shape1.x + 20);
      expect(duplicatedShape.y).toBe(shape1.y + 20);
      expect(duplicatedShape.fill).toBe(shape1.fill);
    });
  });
});
