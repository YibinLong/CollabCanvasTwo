'use client';

import React from 'react';
import { Group, Line, Text, Tag, Label } from 'react-konva';
import type { CursorPosition } from '@/types/canvas';

interface MultiplayerCursorProps {
  cursor: CursorPosition;
}

export const MultiplayerCursor: React.FC<MultiplayerCursorProps> = ({ cursor }) => {
  const cursorPath = [
    0, 0,
    0, 16,
    4, 13,
    7, 19,
    9, 18,
    6, 12,
    11, 12,
  ];

  return (
    <Group x={cursor.x} y={cursor.y}>
      {/* Cursor pointer */}
      <Line
        points={cursorPath}
        fill={cursor.userColor}
        stroke="#ffffff"
        strokeWidth={1}
        closed={true}
        shadowColor="rgba(0,0,0,0.3)"
        shadowBlur={3}
        shadowOffset={{ x: 1, y: 1 }}
      />

      {/* User name label */}
      <Label x={12} y={16}>
        <Tag
          fill={cursor.userColor}
          cornerRadius={4}
          pointerDirection="left"
          pointerWidth={6}
          pointerHeight={8}
          shadowColor="rgba(0,0,0,0.2)"
          shadowBlur={3}
          shadowOffset={{ x: 1, y: 1 }}
        />
        <Text
          text={cursor.userName}
          fontSize={12}
          fontFamily="system-ui, -apple-system, sans-serif"
          fill="#ffffff"
          padding={4}
        />
      </Label>
    </Group>
  );
};
