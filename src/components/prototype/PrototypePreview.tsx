'use client';

import React, { useCallback, useEffect, useState, useMemo } from 'react';
import { Stage, Layer, Rect, Circle, RegularPolygon, Star, Line, Text } from 'react-konva';
import { useCanvasStore } from '@/store/canvasStore';
import { usePrototypeStore } from '@/store/prototypeStore';
import type { CanvasShape, Frame, TextShape, StarShape, LineShape } from '@/types/canvas';

interface PrototypePreviewProps {
  onClose: () => void;
  startFrameId?: string;
}

export const PrototypePreview: React.FC<PrototypePreviewProps> = ({ onClose, startFrameId }) => {
  const { shapes } = useCanvasStore();
  const {
    isPreviewMode,
    currentFrameId,
    navigationHistory,
    interactions,
    setPreviewMode,
    navigateToFrame,
    goBack,
    resetNavigation,
  } = usePrototypeStore();

  const [dimensions, setDimensions] = useState({ width: 1200, height: 800 });
  const [, setAnimatingFrameId] = useState<string | null>(null);
  const [, setAnimationDirection] = useState<string | null>(null);

  // Get all frames
  const frames = useMemo(() => {
    return Object.values(shapes).filter((s): s is Frame => s.type === 'frame');
  }, [shapes]);

  // Get current frame
  const currentFrame = useMemo(() => {
    if (currentFrameId) {
      return shapes[currentFrameId] as Frame | undefined;
    }
    // Default to first frame or the specified start frame
    if (startFrameId && shapes[startFrameId]) {
      return shapes[startFrameId] as Frame;
    }
    return frames[0];
  }, [currentFrameId, startFrameId, shapes, frames]);

  // Get shapes within the current frame
  const frameShapes = useMemo(() => {
    if (!currentFrame) return [];

    // Get direct children of the frame
    const childIds = currentFrame.childIds || [];
    const children = childIds.map((id) => shapes[id]).filter(Boolean) as CanvasShape[];

    // Also find shapes that are visually within the frame bounds
    const inBounds = Object.values(shapes).filter((shape) => {
      if (shape.id === currentFrame.id) return false;
      if (shape.type === 'frame') return false;
      if (childIds.includes(shape.id)) return false;

      // Check if shape is within frame bounds
      const frameRight = currentFrame.x + currentFrame.width;
      const frameBottom = currentFrame.y + currentFrame.height;

      return (
        shape.x >= currentFrame.x &&
        shape.y >= currentFrame.y &&
        shape.x + shape.width <= frameRight &&
        shape.y + shape.height <= frameBottom
      );
    });

    return [...children, ...inBounds].sort((a, b) => a.zIndex - b.zIndex);
  }, [currentFrame, shapes]);

  // Initialize preview mode
  useEffect(() => {
    setPreviewMode(true);
    if (startFrameId) {
      navigateToFrame(startFrameId);
    } else if (frames.length > 0) {
      navigateToFrame(frames[0].id);
    }

    return () => {
      setPreviewMode(false);
      resetNavigation();
    };
  }, [setPreviewMode, resetNavigation, navigateToFrame, startFrameId, frames]);

  // Handle window resize
  useEffect(() => {
    const updateDimensions = () => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'Backspace' || e.key === 'ArrowLeft') {
        goBack();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, goBack]);

  // Handle shape click for interactions
  const handleShapeClick = useCallback(
    (shapeId: string) => {
      const shapeInteractions = Object.values(interactions).filter(
        (i) => i.sourceShapeId === shapeId && i.trigger === 'click'
      );

      for (const interaction of shapeInteractions) {
        if (interaction.action === 'navigate' && interaction.targetFrameId) {
          // Apply animation
          if (interaction.animation && interaction.animation !== 'instant') {
            setAnimationDirection(interaction.animation);
            setAnimatingFrameId(interaction.targetFrameId);

            setTimeout(() => {
              navigateToFrame(interaction.targetFrameId!);
              setAnimatingFrameId(null);
              setAnimationDirection(null);
            }, interaction.duration || 300);
          } else {
            navigateToFrame(interaction.targetFrameId);
          }
        } else if (interaction.action === 'back') {
          goBack();
        }
      }
    },
    [interactions, navigateToFrame, goBack]
  );

  // Check if a shape has interactions
  const hasInteraction = useCallback(
    (shapeId: string) => {
      return Object.values(interactions).some(
        (i) => i.sourceShapeId === shapeId
      );
    },
    [interactions]
  );

  // Calculate scale to fit frame in viewport
  const { scale, offsetX, offsetY } = useMemo(() => {
    if (!currentFrame) return { scale: 1, offsetX: 0, offsetY: 0 };

    const padding = 60;
    const availableWidth = dimensions.width - padding * 2;
    const availableHeight = dimensions.height - padding * 2 - 60; // Account for header

    const scaleX = availableWidth / currentFrame.width;
    const scaleY = availableHeight / currentFrame.height;
    const fitScale = Math.min(scaleX, scaleY, 1); // Don't scale up

    const scaledWidth = currentFrame.width * fitScale;
    const scaledHeight = currentFrame.height * fitScale;

    return {
      scale: fitScale,
      offsetX: (dimensions.width - scaledWidth) / 2 - currentFrame.x * fitScale,
      offsetY: (dimensions.height - scaledHeight) / 2 - currentFrame.y * fitScale + 30,
    };
  }, [currentFrame, dimensions]);

  // Render a shape
  const renderShape = (shape: CanvasShape) => {
    const isInteractive = hasInteraction(shape.id);
    const commonProps = {
      key: shape.id,
      x: shape.x,
      y: shape.y,
      width: shape.width,
      height: shape.height,
      rotation: shape.rotation,
      scaleX: shape.scaleX,
      scaleY: shape.scaleY,
      fill: shape.fill,
      stroke: shape.stroke,
      strokeWidth: shape.strokeWidth,
      opacity: shape.opacity,
      onClick: isInteractive ? () => handleShapeClick(shape.id) : undefined,
      onTap: isInteractive ? () => handleShapeClick(shape.id) : undefined,
      // Visual cue for interactive elements
      shadowBlur: isInteractive ? 10 : shape.shadowBlur,
      shadowColor: isInteractive ? '#3B82F6' : shape.shadowColor,
      shadowEnabled: isInteractive || shape.shadowEnabled,
    };

    switch (shape.type) {
      case 'rectangle':
        return (
          <Rect
            {...commonProps}
            cornerRadius={(shape as { cornerRadius?: number }).cornerRadius || 0}
          />
        );
      case 'circle':
        return (
          <Circle
            key={shape.id}
            x={shape.x + (shape.width * shape.scaleX) / 2}
            y={shape.y + (shape.height * shape.scaleY) / 2}
            radiusX={(shape.width * shape.scaleX) / 2}
            radiusY={(shape.height * shape.scaleY) / 2}
            fill={shape.fill}
            stroke={shape.stroke}
            strokeWidth={shape.strokeWidth}
            opacity={shape.opacity}
            rotation={shape.rotation}
            onClick={isInteractive ? () => handleShapeClick(shape.id) : undefined}
            onTap={isInteractive ? () => handleShapeClick(shape.id) : undefined}
          />
        );
      case 'triangle':
        return (
          <RegularPolygon
            key={shape.id}
            x={shape.x + (shape.width * shape.scaleX) / 2}
            y={shape.y + (shape.height * shape.scaleY) / 2}
            sides={3}
            radius={Math.min(shape.width * shape.scaleX, shape.height * shape.scaleY) / 2}
            fill={shape.fill}
            stroke={shape.stroke}
            strokeWidth={shape.strokeWidth}
            opacity={shape.opacity}
            rotation={shape.rotation}
            onClick={isInteractive ? () => handleShapeClick(shape.id) : undefined}
            onTap={isInteractive ? () => handleShapeClick(shape.id) : undefined}
          />
        );
      case 'star': {
        const starShape = shape as StarShape;
        return (
          <Star
            key={shape.id}
            x={shape.x + (shape.width * shape.scaleX) / 2}
            y={shape.y + (shape.height * shape.scaleY) / 2}
            numPoints={starShape.numPoints || 5}
            innerRadius={starShape.innerRadius || 20}
            outerRadius={starShape.outerRadius || 50}
            fill={shape.fill}
            stroke={shape.stroke}
            strokeWidth={shape.strokeWidth}
            opacity={shape.opacity}
            rotation={shape.rotation}
            onClick={isInteractive ? () => handleShapeClick(shape.id) : undefined}
            onTap={isInteractive ? () => handleShapeClick(shape.id) : undefined}
          />
        );
      }
      case 'line': {
        const lineShape = shape as LineShape;
        return (
          <Line
            key={shape.id}
            x={shape.x}
            y={shape.y}
            points={lineShape.points || [0, 0, 100, 100]}
            stroke={shape.stroke}
            strokeWidth={shape.strokeWidth}
            opacity={shape.opacity}
            rotation={shape.rotation}
            onClick={isInteractive ? () => handleShapeClick(shape.id) : undefined}
            onTap={isInteractive ? () => handleShapeClick(shape.id) : undefined}
          />
        );
      }
      case 'text': {
        const textShape = shape as TextShape;
        return (
          <Text
            key={shape.id}
            x={shape.x}
            y={shape.y}
            width={shape.width * shape.scaleX}
            height={shape.height * shape.scaleY}
            text={textShape.text}
            fontSize={textShape.fontSize}
            fontFamily={textShape.fontFamily}
            fontStyle={textShape.fontStyle}
            fill={shape.fill}
            opacity={shape.opacity}
            align={textShape.textAlign}
            rotation={shape.rotation}
            onClick={isInteractive ? () => handleShapeClick(shape.id) : undefined}
            onTap={isInteractive ? () => handleShapeClick(shape.id) : undefined}
          />
        );
      }
      default:
        return null;
    }
  };

  if (!isPreviewMode) return null;

  return (
    <div className="fixed inset-0 bg-gray-900 z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-gray-800 border-b border-gray-700">
        <div className="flex items-center gap-4">
          <button
            onClick={goBack}
            disabled={navigationHistory.length === 0}
            className={`p-2 rounded-lg transition-colors ${
              navigationHistory.length > 0
                ? 'text-white hover:bg-gray-700'
                : 'text-gray-500 cursor-not-allowed'
            }`}
            title="Go Back (Backspace)"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <span className="text-white font-medium">
            {currentFrame?.name || 'Preview Mode'}
          </span>
        </div>

        {/* Frame navigation */}
        <div className="flex items-center gap-2">
          {frames.map((frame) => (
            <button
              key={frame.id}
              onClick={() => navigateToFrame(frame.id)}
              className={`px-3 py-1 rounded-md text-sm transition-colors ${
                currentFrame?.id === frame.id
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {frame.name}
            </button>
          ))}
        </div>

        <button
          onClick={onClose}
          className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
          title="Exit Preview (Escape)"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Canvas */}
      <div className="flex-1 flex items-center justify-center overflow-hidden">
        {currentFrame ? (
          <Stage
            width={dimensions.width}
            height={dimensions.height - 60}
            scaleX={scale}
            scaleY={scale}
            x={offsetX}
            y={offsetY}
          >
            <Layer>
              {/* Frame background */}
              <Rect
                x={currentFrame.x}
                y={currentFrame.y}
                width={currentFrame.width}
                height={currentFrame.height}
                fill={currentFrame.fill || '#FFFFFF'}
                stroke={currentFrame.stroke}
                strokeWidth={currentFrame.strokeWidth}
                cornerRadius={0}
                shadowColor="rgba(0,0,0,0.2)"
                shadowBlur={20}
                shadowOffsetX={0}
                shadowOffsetY={10}
              />
              {/* Frame contents */}
              {frameShapes.map(renderShape)}
            </Layer>
          </Stage>
        ) : (
          <div className="text-gray-400 text-center">
            <p className="text-lg mb-2">No frames to preview</p>
            <p className="text-sm">Create a frame (F) to start prototyping</p>
          </div>
        )}
      </div>

      {/* Footer hint */}
      <div className="px-4 py-2 bg-gray-800 border-t border-gray-700 text-center text-gray-400 text-sm">
        Press <kbd className="px-2 py-0.5 bg-gray-700 rounded">Esc</kbd> to exit •
        <kbd className="px-2 py-0.5 bg-gray-700 rounded ml-2">←</kbd> to go back •
        Click interactive elements to navigate
      </div>
    </div>
  );
};
