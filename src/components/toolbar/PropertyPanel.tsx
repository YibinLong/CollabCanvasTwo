'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { useCanvasStore } from '@/store/canvasStore';
import { useUserStore } from '@/store/userStore';
import type { CanvasShape, TextShape } from '@/types/canvas';

export const PropertyPanel: React.FC = () => {
  const { shapes, selectedIds, updateShape, alignShapes, distributeShapes } = useCanvasStore();
  const { currentUser } = useUserStore();

  const selectedShapes = selectedIds.map((id) => shapes[id]).filter(Boolean) as CanvasShape[];
  const singleShape = selectedShapes.length === 1 ? selectedShapes[0] : null;

  const [localValues, setLocalValues] = useState<Partial<CanvasShape>>({});

  useEffect(() => {
    if (singleShape) {
      setLocalValues({
        x: Math.round(singleShape.x),
        y: Math.round(singleShape.y),
        width: Math.round(singleShape.width),
        height: Math.round(singleShape.height),
        rotation: Math.round(singleShape.rotation),
        fill: singleShape.fill,
        stroke: singleShape.stroke,
        strokeWidth: singleShape.strokeWidth,
        opacity: singleShape.opacity,
        name: singleShape.name,
      });
    }
  }, [singleShape]);

  const handleUpdate = useCallback(
    (updates: Partial<CanvasShape>) => {
      if (singleShape) {
        updateShape(singleShape.id, {
          ...updates,
          lastEditedBy: currentUser?.id || '',
        });
      }
    },
    [singleShape, updateShape, currentUser]
  );

  const handleInputChange = useCallback(
    (key: keyof CanvasShape, value: string | number) => {
      setLocalValues((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  const handleInputBlur = useCallback(
    (key: keyof CanvasShape) => {
      const value = localValues[key];
      if (value !== undefined) {
        handleUpdate({ [key]: value });
      }
    },
    [localValues, handleUpdate]
  );

  if (selectedShapes.length === 0) {
    return (
      <div className="w-64 bg-white border-l border-gray-200 p-4">
        <p className="text-sm text-gray-500 text-center">
          Select an object to edit its properties
        </p>
      </div>
    );
  }

  // Multiple selection - show alignment tools
  if (selectedShapes.length > 1) {
    return (
      <div className="w-64 bg-white border-l border-gray-200 p-4 overflow-y-auto">
        <h3 className="text-sm font-medium text-gray-900 mb-4">
          {selectedShapes.length} objects selected
        </h3>

        {/* Alignment */}
        <div className="mb-6">
          <h4 className="text-xs font-medium text-gray-500 uppercase mb-2">Align</h4>
          <div className="grid grid-cols-3 gap-2">
            <AlignButton
              icon={<AlignLeftIcon />}
              label="Left"
              onClick={() => alignShapes(selectedIds, 'left')}
            />
            <AlignButton
              icon={<AlignCenterHIcon />}
              label="Center"
              onClick={() => alignShapes(selectedIds, 'center')}
            />
            <AlignButton
              icon={<AlignRightIcon />}
              label="Right"
              onClick={() => alignShapes(selectedIds, 'right')}
            />
            <AlignButton
              icon={<AlignTopIcon />}
              label="Top"
              onClick={() => alignShapes(selectedIds, 'top')}
            />
            <AlignButton
              icon={<AlignCenterVIcon />}
              label="Middle"
              onClick={() => alignShapes(selectedIds, 'middle')}
            />
            <AlignButton
              icon={<AlignBottomIcon />}
              label="Bottom"
              onClick={() => alignShapes(selectedIds, 'bottom')}
            />
          </div>
        </div>

        {/* Distribution */}
        {selectedShapes.length >= 3 && (
          <div className="mb-6">
            <h4 className="text-xs font-medium text-gray-500 uppercase mb-2">Distribute</h4>
            <div className="grid grid-cols-2 gap-2">
              <AlignButton
                icon={<DistributeHIcon />}
                label="Horizontal"
                onClick={() => distributeShapes(selectedIds, 'horizontal')}
              />
              <AlignButton
                icon={<DistributeVIcon />}
                label="Vertical"
                onClick={() => distributeShapes(selectedIds, 'vertical')}
              />
            </div>
          </div>
        )}
      </div>
    );
  }

  // Single selection - show properties
  return (
    <div className="w-64 bg-white border-l border-gray-200 p-4 overflow-y-auto">
      {/* Name */}
      <div className="mb-4">
        <label className="block text-xs font-medium text-gray-500 uppercase mb-1">
          Name
        </label>
        <input
          type="text"
          value={localValues.name || ''}
          onChange={(e) => handleInputChange('name', e.target.value)}
          onBlur={() => handleInputBlur('name')}
          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Position */}
      <div className="mb-4">
        <h4 className="text-xs font-medium text-gray-500 uppercase mb-2">Position</h4>
        <div className="grid grid-cols-2 gap-2">
          <PropertyInput
            label="X"
            value={localValues.x || 0}
            onChange={(v) => handleInputChange('x', v)}
            onBlur={() => handleInputBlur('x')}
          />
          <PropertyInput
            label="Y"
            value={localValues.y || 0}
            onChange={(v) => handleInputChange('y', v)}
            onBlur={() => handleInputBlur('y')}
          />
        </div>
      </div>

      {/* Size */}
      <div className="mb-4">
        <h4 className="text-xs font-medium text-gray-500 uppercase mb-2">Size</h4>
        <div className="grid grid-cols-2 gap-2">
          <PropertyInput
            label="W"
            value={localValues.width || 0}
            onChange={(v) => handleInputChange('width', Math.max(1, v))}
            onBlur={() => handleInputBlur('width')}
          />
          <PropertyInput
            label="H"
            value={localValues.height || 0}
            onChange={(v) => handleInputChange('height', Math.max(1, v))}
            onBlur={() => handleInputBlur('height')}
          />
        </div>
      </div>

      {/* Rotation */}
      <div className="mb-4">
        <h4 className="text-xs font-medium text-gray-500 uppercase mb-2">Rotation</h4>
        <PropertyInput
          label="°"
          value={localValues.rotation || 0}
          onChange={(v) => handleInputChange('rotation', v)}
          onBlur={() => handleInputBlur('rotation')}
          suffix
        />
      </div>

      {/* Colors */}
      <div className="mb-4">
        <h4 className="text-xs font-medium text-gray-500 uppercase mb-2">Fill</h4>
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={localValues.fill || '#3B82F6'}
            onChange={(e) => {
              handleInputChange('fill', e.target.value);
              handleUpdate({ fill: e.target.value });
            }}
            className="w-8 h-8 border border-gray-300 rounded cursor-pointer"
          />
          <input
            type="text"
            value={localValues.fill || '#3B82F6'}
            onChange={(e) => {
              handleInputChange('fill', e.target.value);
              handleUpdate({ fill: e.target.value });
            }}
            className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="mb-4">
        <h4 className="text-xs font-medium text-gray-500 uppercase mb-2">Stroke</h4>
        <div className="flex items-center gap-2 mb-2">
          <input
            type="color"
            value={localValues.stroke || '#1E40AF'}
            onChange={(e) => {
              handleInputChange('stroke', e.target.value);
              handleUpdate({ stroke: e.target.value });
            }}
            className="w-8 h-8 border border-gray-300 rounded cursor-pointer"
          />
          <input
            type="text"
            value={localValues.stroke || '#1E40AF'}
            onChange={(e) => {
              handleInputChange('stroke', e.target.value);
              handleUpdate({ stroke: e.target.value });
            }}
            className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <PropertyInput
          label="Width"
          value={localValues.strokeWidth || 0}
          onChange={(v) => handleInputChange('strokeWidth', Math.max(0, v))}
          onBlur={() => handleInputBlur('strokeWidth')}
        />
      </div>

      {/* Opacity */}
      <div className="mb-4">
        <h4 className="text-xs font-medium text-gray-500 uppercase mb-2">Opacity</h4>
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={localValues.opacity || 1}
          onChange={(e) => {
            const value = parseFloat(e.target.value);
            handleInputChange('opacity', value);
            handleUpdate({ opacity: value });
          }}
          className="w-full"
        />
        <span className="text-xs text-gray-500">
          {Math.round((localValues.opacity || 1) * 100)}%
        </span>
      </div>

      {/* Text properties */}
      {singleShape?.type === 'text' && (
        <div className="mb-4">
          <h4 className="text-xs font-medium text-gray-500 uppercase mb-2">Text</h4>
          <textarea
            value={(singleShape as TextShape).text}
            onChange={(e) => handleUpdate({ text: e.target.value } as Partial<TextShape>)}
            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            rows={3}
          />
          <div className="mt-2">
            <PropertyInput
              label="Size"
              value={(singleShape as TextShape).fontSize}
              onChange={(v) => handleUpdate({ fontSize: Math.max(8, v) } as Partial<TextShape>)}
              onBlur={() => {}}
            />
          </div>
        </div>
      )}
    </div>
  );
};

interface PropertyInputProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  onBlur: () => void;
  suffix?: boolean;
}

const PropertyInput: React.FC<PropertyInputProps> = ({
  label,
  value,
  onChange,
  onBlur,
  suffix,
}) => (
  <div className="flex items-center gap-1">
    {!suffix && (
      <span className="text-xs text-gray-500 w-4">{label}</span>
    )}
    <input
      type="number"
      value={value}
      onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
      onBlur={onBlur}
      className="flex-1 w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
    />
    {suffix && (
      <span className="text-xs text-gray-500">{label}</span>
    )}
  </div>
);

interface AlignButtonProps {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}

const AlignButton: React.FC<AlignButtonProps> = ({ icon, label, onClick }) => (
  <button
    onClick={onClick}
    className="flex items-center justify-center p-2 bg-gray-100 hover:bg-gray-200 rounded transition-colors"
    title={label}
  >
    {icon}
  </button>
);

// Alignment icons
const AlignLeftIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="4" y1="4" x2="4" y2="20" />
    <rect x="8" y="6" width="12" height="4" />
    <rect x="8" y="14" width="8" height="4" />
  </svg>
);

const AlignCenterHIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="12" y1="4" x2="12" y2="20" />
    <rect x="4" y="6" width="16" height="4" />
    <rect x="6" y="14" width="12" height="4" />
  </svg>
);

const AlignRightIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="20" y1="4" x2="20" y2="20" />
    <rect x="4" y="6" width="12" height="4" />
    <rect x="8" y="14" width="8" height="4" />
  </svg>
);

const AlignTopIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="4" y1="4" x2="20" y2="4" />
    <rect x="6" y="8" width="4" height="12" />
    <rect x="14" y="8" width="4" height="8" />
  </svg>
);

const AlignCenterVIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="4" y1="12" x2="20" y2="12" />
    <rect x="6" y="4" width="4" height="16" />
    <rect x="14" y="6" width="4" height="12" />
  </svg>
);

const AlignBottomIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="4" y1="20" x2="20" y2="20" />
    <rect x="6" y="4" width="4" height="12" />
    <rect x="14" y="8" width="4" height="8" />
  </svg>
);

const DistributeHIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="2" y="8" width="4" height="8" />
    <rect x="10" y="8" width="4" height="8" />
    <rect x="18" y="8" width="4" height="8" />
  </svg>
);

const DistributeVIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="8" y="2" width="8" height="4" />
    <rect x="8" y="10" width="8" height="4" />
    <rect x="8" y="18" width="8" height="4" />
  </svg>
);
