'use client';

import React from 'react';
import { useCanvasStore } from '@/store/canvasStore';
import type { CanvasTool } from '@/types/canvas';

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
  const { currentTool, setCurrentTool, undo, redo, canUndo, canRedo } = useCanvasStore();

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
        case 'h':
          setCurrentTool({ type: 'hand' });
          break;
        case 'r':
          setCurrentTool({ type: 'rectangle' });
          break;
        case 'o':
          setCurrentTool({ type: 'circle' });
          break;
        case 'l':
          setCurrentTool({ type: 'line' });
          break;
        case 't':
          setCurrentTool({ type: 'text' });
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setCurrentTool, undo, redo, canUndo, canRedo]);

  return (
    <div className="flex items-center gap-1 p-2 bg-white rounded-xl shadow-lg border border-gray-200">
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
          isActive={currentTool.type === 'triangle'}
          onClick={() => setCurrentTool({ type: 'triangle' })}
        />
        <ToolButton
          tool="star"
          icon={<StarIcon />}
          label="Star"
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
