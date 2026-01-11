'use client';

import React, { useRef } from 'react';
import { useCanvasStore } from '@/store/canvasStore';
import { useUserStore } from '@/store/userStore';
import type { CanvasTool, ImageShape } from '@/types/canvas';
import { nanoid } from 'nanoid';

interface ToolButtonProps {
  tool: CanvasTool['type'];
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  onClick: () => void;
  shortcut?: string;
}

const ToolButton: React.FC<ToolButtonProps> = ({
  icon,
  label,
  isActive,
  onClick,
  shortcut,
}) => (
  <button
    onClick={onClick}
    className={`
      relative flex flex-col items-center justify-center w-10 h-10 rounded-lg
      transition-all duration-150 group
      ${isActive
        ? 'bg-blue-500 text-white shadow-md'
        : 'bg-white text-gray-600 hover:bg-gray-100 hover:text-gray-900'
      }
    `}
    title={`${label}${shortcut ? ` (${shortcut})` : ''}`}
  >
    {icon}
    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
      {label}
      {shortcut && <span className="ml-1 text-gray-400">({shortcut})</span>}
    </div>
  </button>
);

export const Toolbar: React.FC = () => {
  const { currentTool, setCurrentTool, undo, redo, canUndo, canRedo, addShape, shapes } = useCanvasStore();
  const { currentUser } = useUserStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const imageShape: ImageShape = {
          id: nanoid(),
          type: 'image',
          x: 200,
          y: 200,
          width: Math.min(img.width, 400),
          height: Math.min(img.height, 400) * (img.height / img.width),
          rotation: 0,
          scaleX: 1,
          scaleY: 1,
          fill: 'transparent',
          stroke: 'transparent',
          strokeWidth: 0,
          opacity: 1,
          visible: true,
          locked: false,
          name: file.name,
          zIndex: Object.keys(shapes).length,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          createdBy: currentUser?.id || '',
          lastEditedBy: currentUser?.id || '',
          src: event.target?.result as string,
        };
        addShape(imageShape);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Tool keyboard shortcuts
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      const key = e.key.toLowerCase();
      const isMod = e.metaKey || e.ctrlKey;

      // Undo/Redo
      if (isMod && key === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          if (canRedo()) redo();
        } else {
          if (canUndo()) undo();
        }
        return;
      }

      // Tool shortcuts
      switch (key) {
        case 'v':
          setCurrentTool({ type: 'select' });
          break;
        case 'q':
          setCurrentTool({ type: 'lasso' });
          break;
        case 'h':
          setCurrentTool({ type: 'hand' });
          break;
        case 'r':
          setCurrentTool({ type: 'rectangle' });
          break;
        case 'o':
          setCurrentTool({ type: 'circle' });
          break;
        case 'a':
          setCurrentTool({ type: 'triangle' });
          break;
        case 's':
          if (!isMod) setCurrentTool({ type: 'star' });
          break;
        case 'l':
          setCurrentTool({ type: 'line' });
          break;
        case 't':
          setCurrentTool({ type: 'text' });
          break;
        case 'f':
          setCurrentTool({ type: 'frame' });
          break;
        case 'p':
          if (!isMod) setCurrentTool({ type: 'pen' });
          break;
        case 'c':
          if (!isMod) setCurrentTool({ type: 'comment' });
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setCurrentTool, undo, redo, canUndo, canRedo]);

  return (
    <div data-testid="toolbar" className="flex items-center gap-1 p-2 bg-white rounded-xl shadow-lg border border-gray-200">
      {/* Selection Tools */}
      <div className="flex items-center gap-1 pr-2 border-r border-gray-200">
        <ToolButton
          tool="select"
          icon={<SelectIcon />}
          label="Select"
          shortcut="V"
          isActive={currentTool.type === 'select'}
          onClick={() => setCurrentTool({ type: 'select' })}
        />
        <ToolButton
          tool="lasso"
          icon={<LassoIcon />}
          label="Lasso Select"
          shortcut="Q"
          isActive={currentTool.type === 'lasso'}
          onClick={() => setCurrentTool({ type: 'lasso' })}
        />
        <ToolButton
          tool="hand"
          icon={<HandIcon />}
          label="Hand"
          shortcut="H"
          isActive={currentTool.type === 'hand' || currentTool.type === 'pan'}
          onClick={() => setCurrentTool({ type: 'hand' })}
        />
      </div>

      {/* Shape Tools */}
      <div className="flex items-center gap-1 px-2 border-r border-gray-200">
        <ToolButton
          tool="rectangle"
          icon={<RectangleIcon />}
          label="Rectangle"
          shortcut="R"
          isActive={currentTool.type === 'rectangle'}
          onClick={() => setCurrentTool({ type: 'rectangle' })}
        />
        <ToolButton
          tool="circle"
          icon={<CircleIcon />}
          label="Circle"
          shortcut="O"
          isActive={currentTool.type === 'circle'}
          onClick={() => setCurrentTool({ type: 'circle' })}
        />
        <ToolButton
          tool="triangle"
          icon={<TriangleIcon />}
          label="Triangle"
          shortcut="A"
          isActive={currentTool.type === 'triangle'}
          onClick={() => setCurrentTool({ type: 'triangle' })}
        />
        <ToolButton
          tool="star"
          icon={<StarIcon />}
          label="Star"
          shortcut="S"
          isActive={currentTool.type === 'star'}
          onClick={() => setCurrentTool({ type: 'star' })}
        />
        <ToolButton
          tool="line"
          icon={<LineIcon />}
          label="Line"
          shortcut="L"
          isActive={currentTool.type === 'line'}
          onClick={() => setCurrentTool({ type: 'line' })}
        />
        <ToolButton
          tool="text"
          icon={<TextIcon />}
          label="Text"
          shortcut="T"
          isActive={currentTool.type === 'text'}
          onClick={() => setCurrentTool({ type: 'text' })}
        />
      </div>

      {/* Advanced Tools */}
      <div className="flex items-center gap-1 px-2 border-r border-gray-200">
        <ToolButton
          tool="frame"
          icon={<FrameIcon />}
          label="Frame"
          shortcut="F"
          isActive={currentTool.type === 'frame'}
          onClick={() => setCurrentTool({ type: 'frame' })}
        />
        <ToolButton
          tool="pen"
          icon={<PenIcon />}
          label="Pen"
          shortcut="P"
          isActive={currentTool.type === 'pen'}
          onClick={() => setCurrentTool({ type: 'pen' })}
        />
        <ToolButton
          tool="comment"
          icon={<CommentIcon />}
          label="Comment"
          shortcut="C"
          isActive={currentTool.type === 'comment'}
          onClick={() => setCurrentTool({ type: 'comment' })}
        />
        {/* Image Upload Button */}
        <button
          onClick={() => fileInputRef.current?.click()}
          className="relative flex flex-col items-center justify-center w-10 h-10 rounded-lg transition-all duration-150 group bg-white text-gray-600 hover:bg-gray-100 hover:text-gray-900"
          title="Upload Image"
        >
          <ImageIcon />
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
            Upload Image
          </div>
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          className="hidden"
        />
      </div>

      {/* History */}
      <div className="flex items-center gap-1 pl-2">
        <button
          onClick={() => undo()}
          disabled={!canUndo()}
          className={`
            flex items-center justify-center w-10 h-10 rounded-lg
            transition-all duration-150
            ${canUndo()
              ? 'bg-white text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              : 'bg-gray-50 text-gray-300 cursor-not-allowed'
            }
          `}
          title="Undo (Cmd+Z)"
        >
          <UndoIcon />
        </button>
        <button
          onClick={() => redo()}
          disabled={!canRedo()}
          className={`
            flex items-center justify-center w-10 h-10 rounded-lg
            transition-all duration-150
            ${canRedo()
              ? 'bg-white text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              : 'bg-gray-50 text-gray-300 cursor-not-allowed'
            }
          `}
          title="Redo (Cmd+Shift+Z)"
        >
          <RedoIcon />
        </button>
      </div>
    </div>
  );
};

// Icon Components
const SelectIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z" />
    <path d="M13 13l6 6" />
  </svg>
);

const HandIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M18 11V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v0" />
    <path d="M14 10V4a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v6" />
    <path d="M10 10.5V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v8" />
    <path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15" />
  </svg>
);

const RectangleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="3" width="18" height="18" rx="2" />
  </svg>
);

const CircleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10" />
  </svg>
);

const TriangleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 2L2 22h20L12 2z" />
  </svg>
);

const StarIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);

const LineIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="4" y1="20" x2="20" y2="4" />
  </svg>
);

const TextIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="4 7 4 4 20 4 20 7" />
    <line x1="9" y1="20" x2="15" y2="20" />
    <line x1="12" y1="4" x2="12" y2="20" />
  </svg>
);

const UndoIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M3 7v6h6" />
    <path d="M21 17a9 9 0 00-9-9 9 9 0 00-6 2.3L3 13" />
  </svg>
);

const RedoIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 7v6h-6" />
    <path d="M3 17a9 9 0 019-9 9 9 0 016 2.3l3 2.7" />
  </svg>
);

const FrameIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="2" y="2" width="20" height="20" rx="2" strokeDasharray="4 2" />
    <path d="M7 2v20" />
    <path d="M17 2v20" />
    <path d="M2 7h20" />
    <path d="M2 17h20" />
  </svg>
);

const CommentIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
);

const ImageIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
    <circle cx="8.5" cy="8.5" r="1.5" />
    <polyline points="21 15 16 10 5 21" />
  </svg>
);

const LassoIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M7 22a5 5 0 0 1-2-4" />
    <path d="M7 16.93c.96.43 1.96.74 2.99.91" />
    <path d="M3.34 14A6.8 6.8 0 0 1 2 10c0-4.42 4.48-8 10-8s10 3.58 10 8a7.19 7.19 0 0 1-.33 2" />
    <path d="M5 18a2 2 0 1 0 0-4 2 2 0 0 0 0 4z" />
    <path d="M14.33 22h-.09a.35.35 0 0 1-.24-.32v-10a.34.34 0 0 1 .33-.34c.08 0 .15.03.21.08l7.34 6a.33.33 0 0 1-.21.59h-4.49l-2.57 3.85a.35.35 0 0 1-.28.14v0z" />
  </svg>
);

const PenIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 19l7-7 3 3-7 7-3-3z" />
    <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" />
    <path d="M2 2l7.586 7.586" />
    <circle cx="11" cy="11" r="2" />
  </svg>
);
