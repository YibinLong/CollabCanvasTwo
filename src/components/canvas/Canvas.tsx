'use client';

/* eslint-disable react-hooks/immutability, react-hooks/exhaustive-deps */
import React, { useRef, useState, useCallback, useEffect, useMemo, forwardRef, useImperativeHandle } from 'react';
import { Stage, Layer, Line, Circle as KonvaCircle } from 'react-konva';
import Konva from 'konva';
import { nanoid } from 'nanoid';
import { useCanvasStore } from '@/store/canvasStore';
import { useUserStore } from '@/store/userStore';
import { useCommentStore } from '@/store/commentStore';
import { CanvasShape } from './CanvasShape';
import { MultiplayerCursor } from './MultiplayerCursor';
import { SelectionBox } from './SelectionBox';
import { Grid } from './Grid';
import { CommentMarker } from './CommentMarker';
import { SmartGuides, getShapeBounds, calculateSnapGuides } from './SmartGuides';
import { LassoSelection, isShapeInLasso } from './LassoSelection';
import type { CanvasShape as CanvasShapeType, SnapGuide, PathPoint, PathShape } from '@/types/canvas';

interface CanvasProps {
  width: number;
  height: number;
  onCursorMove?: (x: number, y: number) => void;
}

export interface CanvasRef {
  exportToPNG: () => string | null;
  exportToSVG: () => string | null;
  getStage: () => Konva.Stage | null;
}

const MIN_SCALE = 0.1;
const MAX_SCALE = 5;
const SCALE_FACTOR = 1.1;

export const Canvas = forwardRef<CanvasRef, CanvasProps>(({ width, height, onCursorMove }, ref) => {
  const stageRef = useRef<Konva.Stage>(null);

  // Expose methods for export
  useImperativeHandle(ref, () => ({
    exportToPNG: () => {
      const stage = stageRef.current;
      if (!stage) return null;
      return stage.toDataURL({ pixelRatio: 2 });
    },
    exportToSVG: () => {
      // Konva doesn't have native SVG export, but we can convert to data URL
      const stage = stageRef.current;
      if (!stage) return null;
      // For SVG, we'd need a more complex approach - return PNG for now
      return stage.toDataURL({ pixelRatio: 2 });
    },
    getStage: () => stageRef.current,
  }));
  const [isDraggingStage, setIsDraggingStage] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawStart, setDrawStart] = useState<{ x: number; y: number } | null>(null);
  const [tempShape, setTempShape] = useState<CanvasShapeType | null>(null);
  const [activeGuides, setActiveGuides] = useState<SnapGuide[]>([]);
  const [lassoPoints, setLassoPoints] = useState<number[]>([]);
  const [isLassoDrawing, setIsLassoDrawing] = useState(false);
  const [penPoints, setPenPoints] = useState<PathPoint[]>([]);
  const [isPenDrawing, setIsPenDrawing] = useState(false);

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
    duplicateShapes,
    copyShapes,
    cutShapes,
    pasteShapes,
    hasClipboard,
    undo,
    redo,
    canUndo,
    canRedo,
    selectAll,
    bringToFront,
    sendToBack,
    groupShapes,
    ungroupShapes,
    groups,
  } = useCanvasStore();

  const { currentUser, cursors } = useUserStore();

  const {
    comments,
    activeCommentId,
    isAddingComment,
    setActiveCommentId,
    addComment,
    updateComment,
    setIsAddingComment,
  } = useCommentStore();

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
    () => {
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

      // Handle lasso selection
      if (isLassoDrawing && currentTool.type === 'lasso') {
        setLassoPoints((prev) => [...prev, pos.x, pos.y]);
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
      isLassoDrawing,
    ]
  );

  // Handle mouse down
  const handleMouseDown = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      const pos = getPointerPosition();
      const snappedPos = snapPosition(pos.x, pos.y);

      // Check if clicking on empty area
      const clickedOnEmpty = e.target === e.target.getStage();

      // Handle comment tool - add comment on click
      if (currentTool.type === 'comment' || isAddingComment) {
        if (clickedOnEmpty && currentUser) {
          addComment({
            x: pos.x,
            y: pos.y,
            text: 'New comment',
            userId: currentUser.id,
            userName: currentUser.displayName,
            userColor: currentUser.color,
          });
          setIsAddingComment(false);
        }
        return;
      }

      // Handle pan tool
      if (currentTool.type === 'pan' || currentTool.type === 'hand') {
        setIsDraggingStage(true);
        return;
      }

      // Handle selection tool
      if (currentTool.type === 'select') {
        if (clickedOnEmpty) {
          clearSelection();
          setActiveCommentId(null);
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

      // Handle lasso selection tool
      if (currentTool.type === 'lasso') {
        if (clickedOnEmpty) {
          clearSelection();
          setActiveCommentId(null);
          // Start lasso selection
          setIsLassoDrawing(true);
          setLassoPoints([pos.x, pos.y]);
        }
        return;
      }

      // Handle pen tool - add points on click
      if (currentTool.type === 'pen') {
        const newPoint: PathPoint = {
          x: snappedPos.x,
          y: snappedPos.y,
          type: 'corner',
        };

        // If clicking near the first point and we have at least 3 points, close the path
        if (penPoints.length >= 3) {
          const firstPoint = penPoints[0];
          const distance = Math.sqrt(
            Math.pow(snappedPos.x - firstPoint.x, 2) +
            Math.pow(snappedPos.y - firstPoint.y, 2)
          );

          if (distance < 15) {
            // Close the path and create the shape
            finalizePenPath(true);
            return;
          }
        }

        setPenPoints((prev) => [...prev, newPoint]);
        setIsPenDrawing(true);
        return;
      }

      // Handle shape creation tools
      if (['rectangle', 'circle', 'triangle', 'star', 'line', 'text', 'frame'].includes(currentTool.type)) {
        setIsDrawing(true);
        setDrawStart(snappedPos);

        const defaultShape = createDefaultShape(currentTool.type, snappedPos);
        setTempShape(defaultShape);
      }
    },
    [currentTool, getPointerPosition, snapPosition, clearSelection, setSelectionBox, isAddingComment, currentUser, addComment, setIsAddingComment, setActiveCommentId, penPoints]
  );

  // Finalize pen path into a shape
  const finalizePenPath = useCallback(
    (closed: boolean) => {
      if (penPoints.length < 2) {
        setPenPoints([]);
        setIsPenDrawing(false);
        return;
      }

      // Calculate bounding box
      const xs = penPoints.map((p) => p.x);
      const ys = penPoints.map((p) => p.y);
      const minX = Math.min(...xs);
      const minY = Math.min(...ys);
      const maxX = Math.max(...xs);
      const maxY = Math.max(...ys);

      // Normalize points relative to bounding box
      const normalizedPoints: PathPoint[] = penPoints.map((p) => ({
        ...p,
        x: p.x - minX,
        y: p.y - minY,
      }));

      const pathShape: PathShape = {
        id: nanoid(),
        type: 'path',
        x: minX,
        y: minY,
        width: maxX - minX || 10,
        height: maxY - minY || 10,
        rotation: 0,
        scaleX: 1,
        scaleY: 1,
        fill: closed ? '#3B82F6' : 'transparent',
        stroke: '#1E40AF',
        strokeWidth: 2,
        opacity: 1,
        visible: true,
        locked: false,
        name: 'Path',
        zIndex: Object.keys(shapes).length,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        createdBy: currentUser?.id || '',
        lastEditedBy: currentUser?.id || '',
        points: normalizedPoints,
        closed,
      };

      addShape(pathShape);
      setSelectedIds([pathShape.id]);
      setPenPoints([]);
      setIsPenDrawing(false);
    },
    [penPoints, shapes, currentUser, addShape, setSelectedIds]
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

    // Finalize lasso selection
    if (isLassoDrawing && lassoPoints.length >= 6) {
      // Find shapes within lasso path
      const selectedShapeIds = Object.values(shapes)
        .filter((shape) =>
          isShapeInLasso(
            shape.x,
            shape.y,
            shape.width,
            shape.height,
            shape.scaleX,
            shape.scaleY,
            lassoPoints
          )
        )
        .map((shape) => shape.id);

      setSelectedIds(selectedShapeIds);
    }
    setIsLassoDrawing(false);
    setLassoPoints([]);
  }, [isDrawing, tempShape, selectionBox, shapes, addShape, setSelectedIds, setSelectionBox, isLassoDrawing, lassoPoints]);

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
      if (currentTool.type !== 'select' && currentTool.type !== 'lasso') return;

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

  // Handle shape update with smart guides
  const handleShapeChange = useCallback(
    (shapeId: string, updates: Partial<CanvasShapeType>) => {
      updateShape(shapeId, {
        ...updates,
        lastEditedBy: currentUser?.id || '',
      });
    },
    [updateShape, currentUser]
  );

  // Handle shape drag with smart guides (prepared for drag snapping integration)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleShapeDrag = useCallback(
    (shapeId: string, x: number, y: number) => {
      const shape = shapes[shapeId];
      if (!shape || !snapToGrid) {
        setActiveGuides([]);
        return { x, y };
      }

      const movingBounds = getShapeBounds({
        id: shapeId,
        x,
        y,
        width: shape.width,
        height: shape.height,
        scaleX: shape.scaleX,
        scaleY: shape.scaleY,
      });

      const otherBounds = Object.values(shapes)
        .filter((s) => s.id !== shapeId && s.visible && !s.locked)
        .map((s) => getShapeBounds(s));

      const result = calculateSnapGuides(movingBounds, otherBounds);

      setActiveGuides(result.guides);

      return {
        x: result.snapX !== null ? result.snapX : x,
        y: result.snapY !== null ? result.snapY : y,
      };
    },
    [shapes, snapToGrid]
  );

  // Clear guides when drag ends (prepared for drag snapping integration)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleShapeDragEnd = useCallback(() => {
    setActiveGuides([]);
  }, []);

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
      case 'frame':
        return {
          ...baseShape,
          type: 'frame',
          fill: '#FFFFFF',
          stroke: '#E5E7EB',
          strokeWidth: 1,
          name: 'Frame',
          childIds: [],
        };
      default:
        return { ...baseShape, type: 'rectangle' } as CanvasShapeType;
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in input/textarea
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      const isMod = e.metaKey || e.ctrlKey;

      // Delete selected shapes
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedIds.length > 0) {
        e.preventDefault();
        deleteShapes(selectedIds);
        return;
      }

      // Escape to deselect or cancel pen drawing
      if (e.key === 'Escape') {
        if (isPenDrawing && penPoints.length > 0) {
          setPenPoints([]);
          setIsPenDrawing(false);
          return;
        }
        clearSelection();
        return;
      }

      // Enter to finalize pen path (open path)
      if (e.key === 'Enter' && isPenDrawing && penPoints.length >= 2) {
        e.preventDefault();
        finalizePenPath(false);
        return;
      }

      // Copy (Cmd/Ctrl + C)
      if (isMod && e.key === 'c' && selectedIds.length > 0) {
        e.preventDefault();
        copyShapes(selectedIds);
        return;
      }

      // Cut (Cmd/Ctrl + X)
      if (isMod && e.key === 'x' && selectedIds.length > 0) {
        e.preventDefault();
        cutShapes(selectedIds);
        return;
      }

      // Paste (Cmd/Ctrl + V)
      if (isMod && e.key === 'v' && hasClipboard()) {
        e.preventDefault();
        pasteShapes();
        return;
      }

      // Duplicate (Cmd/Ctrl + D)
      if (isMod && e.key === 'd' && selectedIds.length > 0) {
        e.preventDefault();
        duplicateShapes(selectedIds);
        return;
      }

      // Undo (Cmd/Ctrl + Z)
      if (isMod && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        if (canUndo()) undo();
        return;
      }

      // Redo (Cmd/Ctrl + Shift + Z or Cmd/Ctrl + Y)
      if ((isMod && e.shiftKey && e.key === 'z') || (isMod && e.key === 'y')) {
        e.preventDefault();
        if (canRedo()) redo();
        return;
      }

      // Select All (Cmd/Ctrl + A)
      if (isMod && e.key === 'a') {
        e.preventDefault();
        selectAll();
        return;
      }

      // Bring to Front (Cmd/Ctrl + ])
      if (isMod && e.key === ']' && selectedIds.length > 0) {
        e.preventDefault();
        bringToFront(selectedIds);
        return;
      }

      // Send to Back (Cmd/Ctrl + [)
      if (isMod && e.key === '[' && selectedIds.length > 0) {
        e.preventDefault();
        sendToBack(selectedIds);
        return;
      }

      // Group (Cmd/Ctrl + G)
      if (isMod && e.key === 'g' && !e.shiftKey && selectedIds.length >= 2) {
        e.preventDefault();
        groupShapes(selectedIds);
        return;
      }

      // Ungroup (Cmd/Ctrl + Shift + G)
      if (isMod && e.shiftKey && e.key === 'g') {
        e.preventDefault();
        const shape = selectedIds.length === 1 ? shapes[selectedIds[0]] : null;
        if (shape?.groupId && groups[shape.groupId]) {
          ungroupShapes(shape.groupId);
        }
        return;
      }

      // Arrow key nudging
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key) && selectedIds.length > 0) {
        e.preventDefault();
        const nudge = e.shiftKey ? 10 : 1;
        const dx = e.key === 'ArrowLeft' ? -nudge : e.key === 'ArrowRight' ? nudge : 0;
        const dy = e.key === 'ArrowUp' ? -nudge : e.key === 'ArrowDown' ? nudge : 0;

        selectedIds.forEach((id) => {
          const shape = shapes[id];
          if (shape) {
            updateShape(id, { x: shape.x + dx, y: shape.y + dy });
          }
        });
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    selectedIds,
    deleteShapes,
    clearSelection,
    copyShapes,
    cutShapes,
    pasteShapes,
    hasClipboard,
    duplicateShapes,
    undo,
    redo,
    canUndo,
    canRedo,
    selectAll,
    bringToFront,
    sendToBack,
    groupShapes,
    ungroupShapes,
    shapes,
    groups,
    updateShape,
    isPenDrawing,
    penPoints,
    finalizePenPath,
  ]);

  // Determine cursor style
  const getCursorStyle = () => {
    if (isAddingComment) return 'crosshair';
    switch (currentTool.type) {
      case 'pan':
      case 'hand':
        return isDraggingStage ? 'grabbing' : 'grab';
      case 'select':
        return 'default';
      case 'lasso':
        return isLassoDrawing ? 'crosshair' : 'default';
      case 'pen':
        return 'crosshair';
      case 'comment':
        return 'crosshair';
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

          {/* Lasso selection */}
          {lassoPoints.length >= 4 && (
            <LassoSelection points={lassoPoints} isDrawing={isLassoDrawing} />
          )}

          {/* Pen tool path preview */}
          {penPoints.length >= 1 && (
            <>
              {/* Draw path lines */}
              <Line
                points={penPoints.flatMap((p) => [p.x, p.y])}
                stroke="#3B82F6"
                strokeWidth={2}
                lineCap="round"
                lineJoin="round"
              />
              {/* Draw control points */}
              {penPoints.map((point, index) => (
                <KonvaCircle
                  key={index}
                  x={point.x}
                  y={point.y}
                  radius={4}
                  fill={index === 0 && penPoints.length >= 3 ? '#10B981' : '#3B82F6'}
                  stroke="#1E40AF"
                  strokeWidth={1}
                />
              ))}
            </>
          )}

          {/* Smart guides */}
          {activeGuides.length > 0 && (
            <SmartGuides
              guides={activeGuides}
              viewportWidth={width / scale}
              viewportHeight={height / scale}
            />
          )}
        </Layer>

        {/* Comments Layer */}
        <Layer>
          {Object.values(comments).map((comment) => (
            <CommentMarker
              key={comment.id}
              comment={comment}
              isActive={activeCommentId === comment.id}
              onClick={() => setActiveCommentId(comment.id)}
              onDragEnd={(x, y) => updateComment(comment.id, { x, y })}
            />
          ))}
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
});

Canvas.displayName = 'Canvas';
