'use client';

import React, { useRef, useEffect, useCallback } from 'react';
import {
  Rect,
  Circle,
  Line,
  Text,
  RegularPolygon,
  Star,
  Transformer,
} from 'react-konva';
import Konva from 'konva';
import type { CanvasShape as CanvasShapeType } from '@/types/canvas';

interface CanvasShapeProps {
  shape: CanvasShapeType;
  isSelected: boolean;
  onSelect: (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => void;
  onChange: (updates: Partial<CanvasShapeType>) => void;
  onTransformEnd: (updates: Partial<CanvasShapeType>) => void;
}

export const CanvasShape: React.FC<CanvasShapeProps> = ({
  shape,
  isSelected,
  onSelect,
  onChange,
  onTransformEnd,
}) => {
  // Using any for ref to avoid complex Konva type issues
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const shapeRef = useRef<any>(null);
  const transformerRef = useRef<Konva.Transformer>(null);

  useEffect(() => {
    if (isSelected && transformerRef.current && shapeRef.current) {
      transformerRef.current.nodes([shapeRef.current]);
      transformerRef.current.getLayer()?.batchDraw();
    }
  }, [isSelected]);

  const handleDragStart = useCallback(() => {
    // Optional: Add visual feedback
  }, []);

  const handleDragEnd = useCallback(
    (e: Konva.KonvaEventObject<DragEvent>) => {
      onTransformEnd({
        x: e.target.x(),
        y: e.target.y(),
      });
    },
    [onTransformEnd]
  );

  const handleTransformEnd = useCallback(() => {
    const node = shapeRef.current;
    if (!node) return;

    const scaleX = node.scaleX();
    const scaleY = node.scaleY();

    // Reset scale and apply to width/height
    node.scaleX(1);
    node.scaleY(1);

    onTransformEnd({
      x: node.x(),
      y: node.y(),
      width: Math.max(5, node.width() * scaleX),
      height: Math.max(5, node.height() * scaleY),
      rotation: node.rotation(),
    });
  }, [onTransformEnd]);

  const commonProps = {
    ref: shapeRef,
    x: shape.x,
    y: shape.y,
    rotation: shape.rotation,
    scaleX: shape.scaleX,
    scaleY: shape.scaleY,
    fill: shape.fill,
    stroke: shape.stroke,
    strokeWidth: shape.strokeWidth,
    opacity: shape.opacity,
    visible: shape.visible,
    draggable: !shape.locked,
    onClick: onSelect as (e: Konva.KonvaEventObject<MouseEvent>) => void,
    onTap: onSelect as (e: Konva.KonvaEventObject<TouchEvent>) => void,
    onDragStart: handleDragStart,
    onDragEnd: handleDragEnd,
    onTransformEnd: handleTransformEnd,
  };

  const renderShape = () => {
    switch (shape.type) {
      case 'rectangle':
        return (
          <Rect
            {...commonProps}
            width={shape.width}
            height={shape.height}
            cornerRadius={shape.cornerRadius || 0}
          />
        );

      case 'circle':
        return (
          <Circle
            {...commonProps}
            radiusX={shape.width / 2}
            radiusY={shape.height / 2}
          />
        );

      case 'line':
        return (
          <Line
            {...commonProps}
            points={shape.points || [0, 0, shape.width, shape.height]}
            lineCap="round"
            lineJoin="round"
          />
        );

      case 'text':
        return (
          <Text
            {...commonProps}
            text={shape.text}
            fontSize={shape.fontSize}
            fontFamily={shape.fontFamily}
            fontStyle={shape.fontStyle}
            align={shape.textAlign}
            textDecoration={shape.textDecoration}
            width={shape.width}
          />
        );

      case 'triangle':
        return (
          <RegularPolygon
            {...commonProps}
            sides={3}
            radius={Math.min(shape.width, shape.height) / 2}
          />
        );

      case 'star':
        return (
          <Star
            {...commonProps}
            numPoints={shape.numPoints || 5}
            innerRadius={shape.innerRadius || shape.width / 4}
            outerRadius={shape.outerRadius || shape.width / 2}
          />
        );

      default:
        return null;
    }
  };

  return (
    <>
      {renderShape()}
      {isSelected && !shape.locked && (
        <Transformer
          ref={transformerRef}
          boundBoxFunc={(oldBox, newBox) => {
            // Limit resize
            if (newBox.width < 5 || newBox.height < 5) {
              return oldBox;
            }
            return newBox;
          }}
          rotateEnabled={true}
          enabledAnchors={[
            'top-left',
            'top-right',
            'bottom-left',
            'bottom-right',
            'middle-left',
            'middle-right',
            'top-center',
            'bottom-center',
          ]}
        />
      )}
    </>
  );
};
