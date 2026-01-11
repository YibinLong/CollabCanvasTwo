'use client';

import React, { useRef, useState, useCallback, useEffect, useMemo } from 'react';
import { Stage, Layer } from 'react-konva';
import Konva from 'konva';
import { nanoid } from 'nanoid';
import { useCanvasStore } from '@/store/canvasStore';
import { useUserStore } from '@/store/userStore';
import { CanvasShape } from './CanvasShape';
import { MultiplayerCursor } from './MultiplayerCursor';
import { SelectionBox } from './SelectionBox';
import { Grid } from './Grid';
import type { CanvasShape as CanvasShapeType } from '@/types/canvas';

interface CanvasProps {
  width: number;
  height: number;
  onCursorMove?: (x: number, y: number) => void;
}

const MIN_SCALE = 0.1;
const MAX_SCALE = 5;
const SCALE_FACTOR = 1.1;

export const Canvas: React.FC<CanvasProps> = ({ width, height, onCursorMove }) => {
  const stageRef = useRef<Konva.Stage>(null);
  const [isDraggingStage, setIsDraggingStage] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawStart, setDrawStart] = useState<{ x: number; y: number } | null>(null);
  const [tempShape, setTempShape] = useState<CanvasShapeType | null>(null);

  const {
    shapes,
    selectedIds,
    selectionBox,
    currentTool,
    viewportX,
    viewportY,
    scale,
    gridEnabled,
    snapToGrid,
    gridSize,
    setViewport,
    setScale,
    setSelectedIds,
    addToSelection,
    clearSelection,
    setSelectionBox,
    addShape,
    updateShape,
    deleteShapes,
  } = useCanvasStore();

  const { currentUser, cursors } = useUserStore();

  // Sort shapes by zIndex for proper layering
  const sortedShapes = useMemo(() => {
    return Object.values(shapes).sort((a, b) => a.zIndex - b.zIndex);
  }, [shapes]);

  // Get pointer position relative to stage
  const getPointerPosition = useCallback(() => {
    const stage = stageRef.current;
    if (!stage) return { x: 0, y: 0 };

    const pointer = stage.getPointerPosition();
    if (!pointer) return { x: 0, y: 0 };

    // Transform to canvas coordinates
    const x = (pointer.x - viewportX) / scale;
    const y = (pointer.y - viewportY) / scale;

    return { x, y };
  }, [viewportX, viewportY, scale]);

  // Snap position to grid if enabled
  const snapPosition = useCallback(
    (x: number, y: number) => {
      if (!snapToGrid) return { x, y };
      return {
        x: Math.round(x / gridSize) * gridSize,
        y: Math.round(y / gridSize) * gridSize,
      };
    },
    [snapToGrid, gridSize]
  );

  // Handle wheel zoom
  const handleWheel = useCallback(
    (e: Konva.KonvaEventObject<WheelEvent>) => {
      e.evt.preventDefault();

      const stage = stageRef.current;
      if (!stage) return;

      const oldScale = scale;
      const pointer = stage.getPointerPosition();
      if (!pointer) return;

      // Calculate new scale
      const direction = e.evt.deltaY > 0 ? -1 : 1;
      const newScale = Math.min(
        MAX_SCALE,
        Math.max(MIN_SCALE, oldScale * Math.pow(SCALE_FACTOR, direction))
      );

      // Calculate new position to zoom towards pointer
      const mousePointTo = {
        x: (pointer.x - viewportX) / oldScale,
        y: (pointer.y - viewportY) / oldScale,
      };

      const newPos = {
        x: pointer.x - mousePointTo.x * newScale,
        y: pointer.y - mousePointTo.y * newScale,
      };

      setScale(newScale);
      setViewport(newPos.x, newPos.y, newScale);
    },
    [scale, viewportX, viewportY, setScale, setViewport]
  );

  // Handle mouse move for cursor tracking
  const handleMouseMove = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      const pos = getPointerPosition();

      // Broadcast cursor position
      if (onCursorMove) {
        onCursorMove(pos.x, pos.y);
      }

      // Handle drawing
      if (isDrawing && drawStart && currentTool.type !== 'select' && currentTool.type !== 'pan' && currentTool.type !== 'hand') {
        const snappedPos = snapPosition(pos.x, pos.y);
        const width = snappedPos.x - drawStart.x;
        const height = snappedPos.y - drawStart.y;

        if (tempShape) {
          setTempShape({
            ...tempShape,
            width: Math.abs(width),
            height: Math.abs(height),
            x: width < 0 ? snappedPos.x : drawStart.x,
            y: height < 0 ? snappedPos.y : drawStart.y,
          });
        }
      }

      // Handle selection box
      if (selectionBox && currentTool.type === 'select') {
        const snappedPos = snapPosition(pos.x, pos.y);
        setSelectionBox({
          x: Math.min(selectionBox.x, snappedPos.x),
          y: Math.min(selectionBox.y, snappedPos.y),
          width: Math.abs(snappedPos.x - selectionBox.x),
          height: Math.abs(snappedPos.y - selectionBox.y),
        });
      }
    },
    [
      getPointerPosition,
      onCursorMove,
      isDrawing,
      drawStart,
      currentTool,
      tempShape,
      selectionBox,
      snapPosition,
      setSelectionBox,
    ]
  );

  // Handle mouse down
  const handleMouseDown = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      const pos = getPointerPosition();
      const snappedPos = snapPosition(pos.x, pos.y);

      // Check if clicking on empty area
      const clickedOnEmpty = e.target === e.target.getStage();

      // Handle pan tool
      if (currentTool.type === 'pan' || currentTool.type === 'hand') {
        setIsDraggingStage(true);
        return;
      }

      // Handle selection tool
      if (currentTool.type === 'select') {
        if (clickedOnEmpty) {
          clearSelection();
          // Start selection box
          setSelectionBox({
            x: snappedPos.x,
            y: snappedPos.y,
            width: 0,
            height: 0,
          });
        }
        return;
      }

      // Handle shape creation tools
      if (['rectangle', 'circle', 'triangle', 'star', 'line', 'text'].includes(currentTool.type)) {
        setIsDrawing(true);
        setDrawStart(snappedPos);

        const defaultShape = createDefaultShape(currentTool.type, snappedPos);
        setTempShape(defaultShape);
      }
    },
    [currentTool, getPointerPosition, snapPosition, clearSelection, setSelectionBox]
  );

  // Handle mouse up
  const handleMouseUp = useCallback(() => {
    setIsDraggingStage(false);

    // Finalize shape creation
    if (isDrawing && tempShape) {
      if (tempShape.width > 5 && tempShape.height > 5) {
        addShape(tempShape);
        setSelectedIds([tempShape.id]);
      }
      setIsDrawing(false);
      setTempShape(null);
      setDrawStart(null);
    }

    // Finalize selection box
    if (selectionBox && selectionBox.width > 0 && selectionBox.height > 0) {
      // Find shapes within selection box
      const selectedShapeIds = Object.values(shapes)
        .filter((shape) => {
          const shapeRight = shape.x + shape.width * shape.scaleX;
          const shapeBottom = shape.y + shape.height * shape.scaleY;
          const boxRight = selectionBox.x + selectionBox.width;
          const boxBottom = selectionBox.y + selectionBox.height;

          return (
            shape.x < boxRight &&
            shapeRight > selectionBox.x &&
            shape.y < boxBottom &&
            shapeBottom > selectionBox.y
          );
        })
        .map((shape) => shape.id);

      setSelectedIds(selectedShapeIds);
    }
    setSelectionBox(null);
  }, [isDrawing, tempShape, selectionBox, shapes, addShape, setSelectedIds, setSelectionBox]);

  // Handle stage drag for panning
  const handleDragMove = useCallback(
    (e: Konva.KonvaEventObject<DragEvent>) => {
      if (isDraggingStage || currentTool.type === 'pan' || currentTool.type === 'hand') {
        const stage = e.target as Konva.Stage;
        setViewport(stage.x(), stage.y(), scale);
      }
    },
    [isDraggingStage, currentTool, scale, setViewport]
  );

  // Handle shape selection
  const handleShapeSelect = useCallback(
    (shapeId: string, e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
      if (currentTool.type !== 'select') return;

      e.cancelBubble = true;

      // Check for shift key (only available on mouse events)
      const shiftKey = 'shiftKey' in e.evt ? e.evt.shiftKey : false;

      if (shiftKey) {
        // Toggle selection with shift
        if (selectedIds.includes(shapeId)) {
          setSelectedIds(selectedIds.filter((id) => id !== shapeId));
        } else {
          addToSelection(shapeId);
        }
      } else {
        // Single select
        if (!selectedIds.includes(shapeId)) {
          setSelectedIds([shapeId]);
        }
      }
    },
    [currentTool, selectedIds, setSelectedIds, addToSelection]
  );

  // Handle shape update
  const handleShapeChange = useCallback(
    (shapeId: string, updates: Partial<CanvasShapeType>) => {
      updateShape(shapeId, {
        ...updates,
        lastEditedBy: currentUser?.id || '',
      });
    },
    [updateShape, currentUser]
  );

  // Create default shape based on tool type
  const createDefaultShape = (
    type: string,
    pos: { x: number; y: number }
  ): CanvasShapeType => {
    const baseShape = {
      id: nanoid(),
      x: pos.x,
      y: pos.y,
      width: 0,
      height: 0,
      rotation: 0,
      scaleX: 1,
      scaleY: 1,
      fill: '#3B82F6',
      stroke: '#1E40AF',
      strokeWidth: 2,
      opacity: 1,
      visible: true,
      locked: false,
      name: `${type.charAt(0).toUpperCase() + type.slice(1)}`,
      zIndex: Object.keys(shapes).length,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      createdBy: currentUser?.id || '',
      lastEditedBy: currentUser?.id || '',
    };

    switch (type) {
      case 'rectangle':
        return { ...baseShape, type: 'rectangle', cornerRadius: 0 };
      case 'circle':
        return { ...baseShape, type: 'circle' };
      case 'triangle':
        return { ...baseShape, type: 'triangle' };
      case 'star':
        return { ...baseShape, type: 'star', numPoints: 5, innerRadius: 20, outerRadius: 50 };
      case 'line':
        return { ...baseShape, type: 'line', points: [0, 0, 100, 100], fill: 'transparent' };
      case 'text':
        return {
          ...baseShape,
          type: 'text',
          text: 'Text',
          fontSize: 24,
          fontFamily: 'Arial',
          fontStyle: 'normal',
          textAlign: 'left',
          textDecoration: 'none',
          width: 200,
          height: 50,
        };
      default:
        return { ...baseShape, type: 'rectangle' } as CanvasShapeType;
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Delete selected shapes
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedIds.length > 0) {
        e.preventDefault();
        deleteShapes(selectedIds);
      }

      // Escape to deselect
      if (e.key === 'Escape') {
        clearSelection();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedIds, deleteShapes, clearSelection]);

  // Determine cursor style
  const getCursorStyle = () => {
    switch (currentTool.type) {
      case 'pan':
      case 'hand':
        return isDraggingStage ? 'grabbing' : 'grab';
      case 'select':
        return 'default';
      default:
        return 'crosshair';
    }
  };

  return (
    <div style={{ cursor: getCursorStyle() }}>
      <Stage
        ref={stageRef}
        width={width}
        height={height}
        x={viewportX}
        y={viewportY}
        scaleX={scale}
        scaleY={scale}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseMove={handleMouseMove}
        onTouchStart={handleMouseDown as unknown as (e: Konva.KonvaEventObject<TouchEvent>) => void}
        onTouchEnd={handleMouseUp as unknown as (e: Konva.KonvaEventObject<TouchEvent>) => void}
        onTouchMove={handleMouseMove as unknown as (e: Konva.KonvaEventObject<TouchEvent>) => void}
        draggable={currentTool.type === 'pan' || currentTool.type === 'hand'}
        onDragMove={handleDragMove}
      >
        {/* Grid Layer */}
        {gridEnabled && (
          <Layer listening={false}>
            <Grid
              width={width / scale}
              height={height / scale}
              gridSize={gridSize}
              scale={1}
              offsetX={-viewportX / scale}
              offsetY={-viewportY / scale}
            />
          </Layer>
        )}

        {/* Main Layer - Shapes */}
        <Layer>
          {sortedShapes.map((shape) => (
            <CanvasShape
              key={shape.id}
              shape={shape}
              isSelected={selectedIds.includes(shape.id)}
              onSelect={(e) => handleShapeSelect(shape.id, e)}
              onChange={(updates) => handleShapeChange(shape.id, updates)}
              onTransformEnd={(updates) => handleShapeChange(shape.id, updates)}
            />
          ))}

          {/* Temp shape while drawing */}
          {tempShape && (
            <CanvasShape
              shape={tempShape}
              isSelected={false}
              onSelect={() => {}}
              onChange={() => {}}
              onTransformEnd={() => {}}
            />
          )}

          {/* Selection box */}
          {selectionBox && selectionBox.width > 0 && selectionBox.height > 0 && (
            <SelectionBox
              x={selectionBox.x}
              y={selectionBox.y}
              width={selectionBox.width}
              height={selectionBox.height}
            />
          )}
        </Layer>

        {/* Cursors Layer */}
        <Layer listening={false}>
          {Object.values(cursors).map((cursor) => (
            <MultiplayerCursor key={cursor.odId} cursor={cursor} />
          ))}
        </Layer>
      </Stage>
    </div>
  );
};
