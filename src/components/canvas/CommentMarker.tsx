'use client';

import React, { useState, useCallback } from 'react';
import { Group, Circle, Text, Rect } from 'react-konva';
import type { Comment } from '@/types/canvas';

interface CommentMarkerProps {
  comment: Comment;
  isActive: boolean;
  onClick: () => void;
  onDragEnd?: (x: number, y: number) => void;
}

export const CommentMarker: React.FC<CommentMarkerProps> = ({
  comment,
  isActive,
  onClick,
  onDragEnd,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const size = 28;
  const showPreview = isHovered && !isActive;

  const handleDragEnd = useCallback(
    (e: { target: { x: () => number; y: () => number } }) => {
      if (onDragEnd) {
        onDragEnd(e.target.x(), e.target.y());
      }
    },
    [onDragEnd]
  );

  return (
    <Group
      x={comment.x}
      y={comment.y}
      draggable={!!onDragEnd}
      onDragEnd={handleDragEnd}
      onClick={onClick}
      onTap={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Comment marker circle */}
      <Circle
        radius={size / 2}
        fill={comment.resolved ? '#10B981' : comment.userColor}
        stroke={isActive ? '#1E40AF' : '#FFFFFF'}
        strokeWidth={isActive ? 3 : 2}
        shadowColor="rgba(0,0,0,0.3)"
        shadowBlur={isActive ? 8 : 4}
        shadowOffset={{ x: 0, y: 2 }}
        opacity={comment.resolved ? 0.7 : 1}
      />

      {/* Comment icon or checkmark */}
      {comment.resolved ? (
        <Text
          text="✓"
          fontSize={14}
          fill="#FFFFFF"
          fontStyle="bold"
          align="center"
          verticalAlign="middle"
          width={size}
          height={size}
          offsetX={size / 2}
          offsetY={size / 2}
        />
      ) : (
        <Text
          text={comment.replies.length > 0 ? String(comment.replies.length + 1) : '💬'}
          fontSize={comment.replies.length > 0 ? 12 : 14}
          fill="#FFFFFF"
          align="center"
          verticalAlign="middle"
          width={size}
          height={size}
          offsetX={size / 2}
          offsetY={size / 2}
        />
      )}

      {/* Preview tooltip on hover */}
      {showPreview && (
        <Group y={-50}>
          <Rect
            width={180}
            height={60}
            fill="#1F2937"
            cornerRadius={8}
            offsetX={90}
            shadowColor="rgba(0,0,0,0.2)"
            shadowBlur={10}
            shadowOffset={{ x: 0, y: 4 }}
          />
          {/* Arrow */}
          <Rect
            x={-5}
            y={55}
            width={10}
            height={10}
            fill="#1F2937"
            rotation={45}
          />
          {/* User name */}
          <Text
            text={comment.userName}
            fontSize={11}
            fontStyle="bold"
            fill="#FFFFFF"
            x={-82}
            y={8}
            width={164}
          />
          {/* Comment preview */}
          <Text
            text={
              comment.text.length > 50
                ? comment.text.substring(0, 50) + '...'
                : comment.text
            }
            fontSize={11}
            fill="#9CA3AF"
            x={-82}
            y={26}
            width={164}
            height={28}
          />
        </Group>
      )}
    </Group>
  );
};

export default CommentMarker;
