'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { useCanvasStore } from '@/store/canvasStore';
import { useUserStore } from '@/store/userStore';
import { ColorPicker } from '@/components/ui/ColorPicker';
import type { CanvasShape, TextShape, BlendMode } from '@/types/canvas';

export const PropertyPanel: React.FC = () => {
  const {
    shapes,
    selectedIds,
    updateShape,
    alignShapes,
    distributeShapes,
    bringToFront,
    sendToBack,
    bringForward,
    sendBackward,
    groupShapes,
    ungroupShapes,
    groups,
  } = useCanvasStore();
  const { currentUser } = useUserStore();

  const selectedShapes = selectedIds.map((id) => shapes[id]).filter(Boolean) as CanvasShape[];
  const singleShape = selectedShapes.length === 1 ? selectedShapes[0] : null;

  const [localValues, setLocalValues] = useState<Partial<CanvasShape>>({});

  // Check if selected shapes are in a group
  const selectedGroupId = singleShape?.groupId;
  const canGroup = selectedIds.length >= 2;
  const canUngroup = selectedGroupId && groups[selectedGroupId];

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

  const handleBatchUpdate = useCallback(
    (updates: Partial<CanvasShape>) => {
      selectedIds.forEach((id) => {
        updateShape(id, {
          ...updates,
          lastEditedBy: currentUser?.id || '',
        });
      });
    },
    [selectedIds, updateShape, currentUser]
  );

  const handleInputChange = useCallback((key: keyof CanvasShape, value: string | number) => {
    setLocalValues((prev) => ({ ...prev, [key]: value }));
  }, []);

  const handleInputBlur = useCallback(
    (key: keyof CanvasShape) => {
      const value = localValues[key];
      if (value !== undefined) {
        handleUpdate({ [key]: value });
      }
    },
    [localValues, handleUpdate]
  );

  const handleGroup = useCallback(() => {
    if (canGroup) {
      groupShapes(selectedIds);
    }
  }, [canGroup, groupShapes, selectedIds]);

  const handleUngroup = useCallback(() => {
    if (selectedGroupId) {
      ungroupShapes(selectedGroupId);
    }
  }, [selectedGroupId, ungroupShapes]);

  if (selectedShapes.length === 0) {
    return (
      <div className="w-64 bg-white border-l border-gray-200 p-4">
        <p className="text-sm text-gray-500 text-center">
          Select an object to edit its properties
        </p>
      </div>
    );
  }

  // Multiple selection - show alignment and batch tools
  if (selectedShapes.length > 1) {
    return (
      <div className="w-64 bg-white border-l border-gray-200 p-4 overflow-y-auto max-h-full">
        <h3 className="text-sm font-medium text-gray-900 mb-4">
          {selectedShapes.length} objects selected
        </h3>

        {/* Group/Ungroup */}
        <div className="mb-4">
          <h4 className="text-xs font-medium text-gray-500 uppercase mb-2">Group</h4>
          <div className="flex gap-2">
            <button
              onClick={handleGroup}
              disabled={!canGroup}
              className={`flex-1 px-3 py-2 text-sm rounded ${
                canGroup
                  ? 'bg-blue-500 text-white hover:bg-blue-600'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
            >
              Group
            </button>
            <button
              onClick={handleUngroup}
              disabled={!canUngroup}
              className={`flex-1 px-3 py-2 text-sm rounded ${
                canUngroup
                  ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
            >
              Ungroup
            </button>
          </div>
        </div>

        {/* Alignment */}
        <div className="mb-4">
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
          <div className="mb-4">
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

        {/* Z-Index */}
        <div className="mb-4">
          <h4 className="text-xs font-medium text-gray-500 uppercase mb-2">Layer Order</h4>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => bringToFront(selectedIds)}
              className="px-2 py-1.5 text-xs bg-gray-100 hover:bg-gray-200 rounded text-gray-700"
            >
              Bring to Front
            </button>
            <button
              onClick={() => sendToBack(selectedIds)}
              className="px-2 py-1.5 text-xs bg-gray-100 hover:bg-gray-200 rounded text-gray-700"
            >
              Send to Back
            </button>
            <button
              onClick={() => bringForward(selectedIds)}
              className="px-2 py-1.5 text-xs bg-gray-100 hover:bg-gray-200 rounded text-gray-700"
            >
              Bring Forward
            </button>
            <button
              onClick={() => sendBackward(selectedIds)}
              className="px-2 py-1.5 text-xs bg-gray-100 hover:bg-gray-200 rounded text-gray-700"
            >
              Send Backward
            </button>
          </div>
        </div>

        {/* Batch Color Change */}
        <div className="mb-4">
          <h4 className="text-xs font-medium text-gray-500 uppercase mb-2">Apply to All</h4>
          <ColorPicker
            color={selectedShapes[0]?.fill || '#3B82F6'}
            onChange={(color) => handleBatchUpdate({ fill: color })}
            label="Fill Color"
          />
          <div className="mt-2">
            <ColorPicker
              color={selectedShapes[0]?.stroke || '#1E40AF'}
              onChange={(color) => handleBatchUpdate({ stroke: color })}
              label="Stroke Color"
            />
          </div>
        </div>

        {/* Batch Opacity */}
        <div className="mb-4">
          <h4 className="text-xs font-medium text-gray-500 uppercase mb-2">Opacity</h4>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            defaultValue={1}
            onChange={(e) => {
              const value = parseFloat(e.target.value);
              handleBatchUpdate({ opacity: value });
            }}
            className="w-full"
          />
        </div>
      </div>
    );
  }

  // Single selection - show full properties
  return (
    <div className="w-64 bg-white border-l border-gray-200 p-4 overflow-y-auto max-h-full">
      {/* Name */}
      <div className="mb-4">
        <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Name</label>
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

      {/* Colors with new ColorPicker */}
      <div className="mb-4">
        <ColorPicker
          color={localValues.fill || '#3B82F6'}
          onChange={(color) => {
            handleInputChange('fill', color);
            handleUpdate({ fill: color });
          }}
          label="Fill"
        />
      </div>

      <div className="mb-4">
        <ColorPicker
          color={localValues.stroke || '#1E40AF'}
          onChange={(color) => {
            handleInputChange('stroke', color);
            handleUpdate({ stroke: color });
          }}
          label="Stroke"
        />
        <div className="mt-2">
          <PropertyInput
            label="Width"
            value={localValues.strokeWidth || 0}
            onChange={(v) => handleInputChange('strokeWidth', Math.max(0, v))}
            onBlur={() => handleInputBlur('strokeWidth')}
          />
        </div>
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
        <span className="text-xs text-gray-500">{Math.round((localValues.opacity || 1) * 100)}%</span>
      </div>

      {/* Blend Mode */}
      <div className="mb-4">
        <h4 className="text-xs font-medium text-gray-500 uppercase mb-2">Blend Mode</h4>
        <select
          value={singleShape?.blendMode || 'normal'}
          onChange={(e) => handleUpdate({ blendMode: e.target.value as BlendMode })}
          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="normal">Normal</option>
          <option value="multiply">Multiply</option>
          <option value="screen">Screen</option>
          <option value="overlay">Overlay</option>
          <option value="darken">Darken</option>
          <option value="lighten">Lighten</option>
          <option value="color-dodge">Color Dodge</option>
          <option value="color-burn">Color Burn</option>
          <option value="hard-light">Hard Light</option>
          <option value="soft-light">Soft Light</option>
          <option value="difference">Difference</option>
          <option value="exclusion">Exclusion</option>
        </select>
      </div>

      {/* Shadow */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-xs font-medium text-gray-500 uppercase">Shadow</h4>
          <label className="flex items-center gap-1 cursor-pointer">
            <input
              type="checkbox"
              checked={singleShape?.shadowEnabled || false}
              onChange={(e) => handleUpdate({ shadowEnabled: e.target.checked })}
              className="w-4 h-4 rounded border-gray-300"
            />
          </label>
        </div>
        {singleShape?.shadowEnabled && (
          <div className="space-y-2">
            <div className="flex gap-2">
              <PropertyInput
                label="X"
                value={singleShape.shadowOffsetX || 5}
                onChange={(v) => handleUpdate({ shadowOffsetX: v })}
                onBlur={() => {}}
              />
              <PropertyInput
                label="Y"
                value={singleShape.shadowOffsetY || 5}
                onChange={(v) => handleUpdate({ shadowOffsetY: v })}
                onBlur={() => {}}
              />
            </div>
            <PropertyInput
              label="Blur"
              value={singleShape.shadowBlur || 10}
              onChange={(v) => handleUpdate({ shadowBlur: Math.max(0, v) })}
              onBlur={() => {}}
            />
            <div className="mt-2">
              <ColorPicker
                color={singleShape.shadowColor || '#000000'}
                onChange={(color) => handleUpdate({ shadowColor: color })}
                label="Shadow Color"
              />
            </div>
          </div>
        )}
      </div>

      {/* Corner Radius for rectangles */}
      {singleShape?.type === 'rectangle' && (
        <div className="mb-4">
          <h4 className="text-xs font-medium text-gray-500 uppercase mb-2">Corner Radius</h4>
          <input
            type="range"
            min="0"
            max="50"
            step="1"
            value={(singleShape as CanvasShape & { cornerRadius?: number }).cornerRadius || 0}
            onChange={(e) => {
              const value = parseInt(e.target.value);
              handleUpdate({ cornerRadius: value } as Partial<CanvasShape>);
            }}
            className="w-full"
          />
          <span className="text-xs text-gray-500">
            {(singleShape as CanvasShape & { cornerRadius?: number }).cornerRadius || 0}px
          </span>
        </div>
      )}

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
          <div className="mt-2 space-y-2">
            <PropertyInput
              label="Size"
              value={(singleShape as TextShape).fontSize}
              onChange={(v) => handleUpdate({ fontSize: Math.max(8, v) } as Partial<TextShape>)}
              onBlur={() => {}}
            />
            <select
              value={(singleShape as TextShape).fontFamily}
              onChange={(e) => handleUpdate({ fontFamily: e.target.value } as Partial<TextShape>)}
              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="Arial">Arial</option>
              <option value="Helvetica">Helvetica</option>
              <option value="Times New Roman">Times New Roman</option>
              <option value="Georgia">Georgia</option>
              <option value="Courier New">Courier New</option>
              <option value="Verdana">Verdana</option>
            </select>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  const current = (singleShape as TextShape).fontStyle;
                  const isBold = current.includes('bold');
                  const isItalic = current.includes('italic');
                  const newStyle = isBold
                    ? isItalic
                      ? 'italic'
                      : 'normal'
                    : isItalic
                      ? 'bold italic'
                      : 'bold';
                  handleUpdate({ fontStyle: newStyle } as Partial<TextShape>);
                }}
                className={`flex-1 px-2 py-1 text-sm rounded border ${
                  (singleShape as TextShape).fontStyle.includes('bold')
                    ? 'bg-blue-500 text-white border-blue-500'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
                }`}
              >
                <strong>B</strong>
              </button>
              <button
                onClick={() => {
                  const current = (singleShape as TextShape).fontStyle;
                  const isBold = current.includes('bold');
                  const isItalic = current.includes('italic');
                  const newStyle = isItalic
                    ? isBold
                      ? 'bold'
                      : 'normal'
                    : isBold
                      ? 'bold italic'
                      : 'italic';
                  handleUpdate({ fontStyle: newStyle } as Partial<TextShape>);
                }}
                className={`flex-1 px-2 py-1 text-sm rounded border ${
                  (singleShape as TextShape).fontStyle.includes('italic')
                    ? 'bg-blue-500 text-white border-blue-500'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
                }`}
              >
                <em>I</em>
              </button>
              <button
                onClick={() => {
                  const current = (singleShape as TextShape).textDecoration;
                  handleUpdate({
                    textDecoration: current === 'underline' ? 'none' : 'underline',
                  } as Partial<TextShape>);
                }}
                className={`flex-1 px-2 py-1 text-sm rounded border ${
                  (singleShape as TextShape).textDecoration === 'underline'
                    ? 'bg-blue-500 text-white border-blue-500'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
                }`}
              >
                <u>U</u>
              </button>
            </div>
            <div className="flex gap-2">
              {(['left', 'center', 'right'] as const).map((align) => (
                <button
                  key={align}
                  onClick={() => handleUpdate({ textAlign: align } as Partial<TextShape>)}
                  className={`flex-1 px-2 py-1 text-sm rounded border ${
                    (singleShape as TextShape).textAlign === align
                      ? 'bg-blue-500 text-white border-blue-500'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
                  }`}
                >
                  {align === 'left' && <AlignTextLeftIcon />}
                  {align === 'center' && <AlignTextCenterIcon />}
                  {align === 'right' && <AlignTextRightIcon />}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Layer Order */}
      {singleShape && (
        <div className="mb-4">
          <h4 className="text-xs font-medium text-gray-500 uppercase mb-2">Layer Order</h4>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => bringToFront([singleShape.id])}
              className="px-2 py-1.5 text-xs bg-gray-100 hover:bg-gray-200 rounded text-gray-700"
            >
              Bring to Front
            </button>
            <button
              onClick={() => sendToBack([singleShape.id])}
              className="px-2 py-1.5 text-xs bg-gray-100 hover:bg-gray-200 rounded text-gray-700"
            >
              Send to Back
            </button>
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

const PropertyInput: React.FC<PropertyInputProps> = ({ label, value, onChange, onBlur, suffix }) => (
  <div className="flex items-center gap-1">
    {!suffix && <span className="text-xs text-gray-500 w-4">{label}</span>}
    <input
      type="number"
      value={value}
      onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
      onBlur={onBlur}
      className="flex-1 w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
    />
    {suffix && <span className="text-xs text-gray-500">{label}</span>}
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

const AlignTextLeftIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="3" y1="6" x2="21" y2="6" />
    <line x1="3" y1="12" x2="15" y2="12" />
    <line x1="3" y1="18" x2="18" y2="18" />
  </svg>
);

const AlignTextCenterIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="3" y1="6" x2="21" y2="6" />
    <line x1="6" y1="12" x2="18" y2="12" />
    <line x1="4" y1="18" x2="20" y2="18" />
  </svg>
);

const AlignTextRightIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="3" y1="6" x2="21" y2="6" />
    <line x1="9" y1="12" x2="21" y2="12" />
    <line x1="6" y1="18" x2="21" y2="18" />
  </svg>
);
