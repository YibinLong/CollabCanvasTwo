'use client';

import React, { useMemo } from 'react';
import { useCanvasStore } from '@/store/canvasStore';
import type { CanvasShape } from '@/types/canvas';

export const LayersPanel: React.FC = () => {
  const {
    shapes,
    selectedIds,
    setSelectedIds,
    updateShape,
    deleteShape,
    bringToFront,
    sendToBack,
    bringForward,
    sendBackward,
    duplicateShapes,
  } = useCanvasStore();

  // Sort layers by zIndex (reverse order - top layer first)
  const sortedLayers = useMemo(() => {
    return Object.values(shapes).sort((a, b) => b.zIndex - a.zIndex);
  }, [shapes]);

  const handleSelectLayer = (id: string, e: React.MouseEvent) => {
    if (e.shiftKey) {
      if (selectedIds.includes(id)) {
        setSelectedIds(selectedIds.filter((sid) => sid !== id));
      } else {
        setSelectedIds([...selectedIds, id]);
      }
    } else {
      setSelectedIds([id]);
    }
  };

  const handleToggleVisibility = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const shape = shapes[id];
    if (shape) {
      updateShape(id, { visible: !shape.visible });
    }
  };

  const handleToggleLock = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const shape = shapes[id];
    if (shape) {
      updateShape(id, { locked: !shape.locked });
    }
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    deleteShape(id);
  };

  const handleDuplicate = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    duplicateShapes([id]);
  };

  const getShapeIcon = (type: CanvasShape['type']) => {
    switch (type) {
      case 'rectangle':
        return <RectIcon />;
      case 'circle':
        return <CircleIcon />;
      case 'triangle':
        return <TriangleIcon />;
      case 'star':
        return <StarIcon />;
      case 'line':
        return <LineIcon />;
      case 'text':
        return <TextIcon />;
      default:
        return <RectIcon />;
    }
  };

  return (
    <div className="w-64 bg-white border-l border-gray-200 flex flex-col h-full">
      <div className="flex items-center justify-between p-3 border-b border-gray-200">
        <h3 className="text-sm font-medium text-gray-900">Layers</h3>
        <span className="text-xs text-gray-500">{sortedLayers.length} objects</span>
      </div>

      {/* Layer actions for selection */}
      {selectedIds.length > 0 && (
        <div className="flex items-center gap-1 p-2 border-b border-gray-200 bg-gray-50">
          <ActionButton
            icon={<BringToFrontIcon />}
            title="Bring to Front"
            onClick={() => bringToFront(selectedIds)}
          />
          <ActionButton
            icon={<BringForwardIcon />}
            title="Bring Forward"
            onClick={() => bringForward(selectedIds)}
          />
          <ActionButton
            icon={<SendBackwardIcon />}
            title="Send Backward"
            onClick={() => sendBackward(selectedIds)}
          />
          <ActionButton
            icon={<SendToBackIcon />}
            title="Send to Back"
            onClick={() => sendToBack(selectedIds)}
          />
        </div>
      )}

      {/* Layers list */}
      <div className="flex-1 overflow-y-auto">
        {sortedLayers.length === 0 ? (
          <div className="p-4 text-center text-sm text-gray-500">
            No objects on canvas
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {sortedLayers.map((shape) => (
              <LayerItem
                key={shape.id}
                shape={shape}
                isSelected={selectedIds.includes(shape.id)}
                onSelect={(e) => handleSelectLayer(shape.id, e)}
                onToggleVisibility={(e) => handleToggleVisibility(shape.id, e)}
                onToggleLock={(e) => handleToggleLock(shape.id, e)}
                onDelete={(e) => handleDelete(shape.id, e)}
                onDuplicate={(e) => handleDuplicate(shape.id, e)}
                icon={getShapeIcon(shape.type)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

interface LayerItemProps {
  shape: CanvasShape;
  isSelected: boolean;
  onSelect: (e: React.MouseEvent) => void;
  onToggleVisibility: (e: React.MouseEvent) => void;
  onToggleLock: (e: React.MouseEvent) => void;
  onDelete: (e: React.MouseEvent) => void;
  onDuplicate: (e: React.MouseEvent) => void;
  icon: React.ReactNode;
}

const LayerItem: React.FC<LayerItemProps> = ({
  shape,
  isSelected,
  onSelect,
  onToggleVisibility,
  onToggleLock,
  onDelete,
  onDuplicate,
  icon,
}) => {
  const [showActions, setShowActions] = React.useState(false);

  return (
    <div
      className={`
        flex items-center gap-2 px-3 py-2 cursor-pointer group
        ${isSelected ? 'bg-blue-50' : 'hover:bg-gray-50'}
        ${!shape.visible ? 'opacity-50' : ''}
      `}
      onClick={onSelect}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {/* Color indicator */}
      <div
        className="w-3 h-3 rounded-sm border border-gray-300"
        style={{ backgroundColor: shape.fill }}
      />

      {/* Icon */}
      <div className="text-gray-400">{icon}</div>

      {/* Name */}
      <span
        className={`flex-1 text-sm truncate ${
          isSelected ? 'text-blue-700 font-medium' : 'text-gray-700'
        }`}
      >
        {shape.name}
      </span>

      {/* Actions */}
      <div
        className={`flex items-center gap-1 ${showActions ? 'opacity-100' : 'opacity-0'} transition-opacity`}
      >
        <IconButton
          icon={shape.visible ? <EyeIcon /> : <EyeOffIcon />}
          onClick={onToggleVisibility}
          title={shape.visible ? 'Hide' : 'Show'}
        />
        <IconButton
          icon={shape.locked ? <LockIcon /> : <UnlockIcon />}
          onClick={onToggleLock}
          title={shape.locked ? 'Unlock' : 'Lock'}
        />
        <IconButton icon={<CopyIcon />} onClick={onDuplicate} title="Duplicate" />
        <IconButton icon={<TrashIcon />} onClick={onDelete} title="Delete" />
      </div>
    </div>
  );
};

interface IconButtonProps {
  icon: React.ReactNode;
  onClick: (e: React.MouseEvent) => void;
  title: string;
}

const IconButton: React.FC<IconButtonProps> = ({ icon, onClick, title }) => (
  <button
    onClick={onClick}
    className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
    title={title}
  >
    {icon}
  </button>
);

interface ActionButtonProps {
  icon: React.ReactNode;
  onClick: () => void;
  title: string;
}

const ActionButton: React.FC<ActionButtonProps> = ({ icon, onClick, title }) => (
  <button
    onClick={onClick}
    className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded transition-colors"
    title={title}
  >
    {icon}
  </button>
);

// Icons
const RectIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="3" width="18" height="18" rx="2" />
  </svg>
);

const CircleIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10" />
  </svg>
);

const TriangleIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 2L2 22h20L12 2z" />
  </svg>
);

const StarIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);

const LineIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="4" y1="20" x2="20" y2="4" />
  </svg>
);

const TextIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="4 7 4 4 20 4 20 7" />
    <line x1="9" y1="20" x2="15" y2="20" />
    <line x1="12" y1="4" x2="12" y2="20" />
  </svg>
);

const EyeIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const EyeOffIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </svg>
);

const LockIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

const UnlockIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 9.9-1" />
  </svg>
);

const CopyIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
  </svg>
);

const TrashIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
  </svg>
);

const BringToFrontIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="8" y="8" width="12" height="12" rx="2" />
    <path d="M4 16V4h12" />
  </svg>
);

const BringForwardIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="8" y="8" width="12" height="12" rx="2" />
    <rect x="4" y="4" width="8" height="8" rx="1" />
  </svg>
);

const SendBackwardIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="4" y="4" width="12" height="12" rx="2" />
    <rect x="12" y="12" width="8" height="8" rx="1" />
  </svg>
);

const SendToBackIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="4" y="4" width="12" height="12" rx="2" />
    <path d="M20 8v12H8" />
  </svg>
);
