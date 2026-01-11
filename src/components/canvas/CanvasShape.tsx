'use client';

/* eslint-disable react-hooks/set-state-in-effect, @typescript-eslint/no-unused-vars */
import React, { useRef, useEffect, useCallback, useState } from 'react';
import {
  Rect,
  Circle,
  Line,
  Text,
  RegularPolygon,
  Star,
  Transformer,
  Image as KonvaImage,
  Group,
  Path,
} from 'react-konva';
import Konva from 'konva';
import type { CanvasShape as CanvasShapeType, Frame, ImageShape } from '@/types/canvas';

interface CanvasShapeProps {
  shape: CanvasShapeType;
  isSelected: boolean;
  onSelect: (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => void;
  onChange: (updates: Partial<CanvasShapeType>) => void;
  onTransformEnd: (updates: Partial<CanvasShapeType>) => void;
}

// Custom hook for loading images
const useImage = (src: string | undefined): HTMLImageElement | undefined => {
  const [image, setImage] = useState<HTMLImageElement | undefined>(undefined);

  useEffect(() => {
    if (!src) {
      setImage(undefined);
      return;
    }

    const img = new window.Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => setImage(img);
    img.onerror = () => setImage(undefined);
    img.src = src;

    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [src]);

  return image;
};

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

  // Load image if this is an image shape
  const imageShape = shape.type === 'image' ? (shape as ImageShape) : undefined;
  const loadedImage = useImage(imageShape?.src);

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

  // Map CSS blend modes to Konva globalCompositeOperation
  const getBlendModeOperation = (blendMode?: string): GlobalCompositeOperation => {
    const blendModeMap: Record<string, GlobalCompositeOperation> = {
      'normal': 'source-over',
      'multiply': 'multiply',
      'screen': 'screen',
      'overlay': 'overlay',
      'darken': 'darken',
      'lighten': 'lighten',
      'color-dodge': 'color-dodge',
      'color-burn': 'color-burn',
      'hard-light': 'hard-light',
      'soft-light': 'soft-light',
      'difference': 'difference',
      'exclusion': 'exclusion',
      'hue': 'hue',
      'saturation': 'saturation',
      'color': 'color',
      'luminosity': 'luminosity',
    };
    return blendModeMap[blendMode || 'normal'] || 'source-over';
  };

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
    globalCompositeOperation: getBlendModeOperation(shape.blendMode),
    // Shadow support
    ...(shape.shadowEnabled && {
      shadowColor: shape.shadowColor || '#000000',
      shadowBlur: shape.shadowBlur || 10,
      shadowOffsetX: shape.shadowOffsetX || 5,
      shadowOffsetY: shape.shadowOffsetY || 5,
      shadowOpacity: 0.5,
    }),
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

      case 'image':
        if (!loadedImage) {
          // Placeholder while loading
          return (
            <Rect
              {...commonProps}
              width={shape.width}
              height={shape.height}
              fill="#F3F4F6"
              stroke="#D1D5DB"
              strokeWidth={1}
            />
          );
        }
        return (
          <KonvaImage
            {...commonProps}
            image={loadedImage}
            width={shape.width}
            height={shape.height}
          />
        );

      case 'frame':
        // Frame is a container with optional auto-layout
        const frameShape = shape as unknown as Frame;
        return (
          <Group
            ref={shapeRef}
            x={shape.x}
            y={shape.y}
            rotation={shape.rotation}
            scaleX={shape.scaleX}
            scaleY={shape.scaleY}
            opacity={shape.opacity}
            visible={shape.visible}
            draggable={!shape.locked}
            onClick={onSelect as (e: Konva.KonvaEventObject<MouseEvent>) => void}
            onTap={onSelect as (e: Konva.KonvaEventObject<TouchEvent>) => void}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onTransformEnd={handleTransformEnd}
          >
            {/* Frame background */}
            <Rect
              width={shape.width}
              height={shape.height}
              fill={shape.fill || '#FFFFFF'}
              stroke={shape.stroke || '#E5E7EB'}
              strokeWidth={shape.strokeWidth || 1}
              cornerRadius={4}
            />
            {/* Frame label */}
            <Text
              x={0}
              y={-20}
              text={shape.name || 'Frame'}
              fontSize={12}
              fontFamily="Arial"
              fill="#6B7280"
            />
          </Group>
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
