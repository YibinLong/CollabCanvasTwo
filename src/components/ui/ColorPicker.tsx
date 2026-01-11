'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';

interface ColorPickerProps {
  color: string;
  onChange: (color: string) => void;
  label?: string;
  showRecentColors?: boolean;
}

// Default color palette
const DEFAULT_PALETTE = [
  '#FF6B6B', '#FF8E72', '#FFD93D', '#6BCB77', '#4D96FF',
  '#845EC2', '#FF6F91', '#FFC75F', '#F9F871', '#2C73D2',
  '#1E40AF', '#3B82F6', '#10B981', '#F59E0B', '#EF4444',
  '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16', '#F97316',
];

// Local storage key for recent colors
const RECENT_COLORS_KEY = 'collabcanvas-recent-colors';
const MAX_RECENT_COLORS = 10;

const getRecentColors = (): string[] => {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(RECENT_COLORS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

const saveRecentColor = (color: string) => {
  if (typeof window === 'undefined') return;
  try {
    const recent = getRecentColors();
    const normalized = color.toUpperCase();
    const filtered = recent.filter((c) => c.toUpperCase() !== normalized);
    const updated = [color, ...filtered].slice(0, MAX_RECENT_COLORS);
    localStorage.setItem(RECENT_COLORS_KEY, JSON.stringify(updated));
  } catch {
    // Ignore storage errors
  }
};

export const ColorPicker: React.FC<ColorPickerProps> = ({
  color,
  onChange,
  label,
  showRecentColors = true,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [recentColors, setRecentColors] = useState<string[]>([]);
  const [inputValue, setInputValue] = useState(color);
  const pickerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load recent colors on mount
  useEffect(() => {
    setRecentColors(getRecentColors());
  }, []);

  // Update input when color prop changes
  useEffect(() => {
    setInputValue(color);
  }, [color]);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleColorSelect = useCallback(
    (newColor: string) => {
      onChange(newColor);
      saveRecentColor(newColor);
      setRecentColors(getRecentColors());
    },
    [onChange]
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setInputValue(value);

      // Validate hex color
      if (/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(value)) {
        onChange(value);
      }
    },
    [onChange]
  );

  const handleInputBlur = useCallback(() => {
    // If input is valid, save to recent
    if (/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(inputValue)) {
      saveRecentColor(inputValue);
      setRecentColors(getRecentColors());
    } else {
      // Reset to current color if invalid
      setInputValue(color);
    }
  }, [inputValue, color]);

  const handleNativeColorChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newColor = e.target.value;
      handleColorSelect(newColor);
      setInputValue(newColor);
    },
    [handleColorSelect]
  );

  return (
    <div className="relative" ref={pickerRef}>
      {label && (
        <label className="block text-xs font-medium text-gray-500 uppercase mb-1">
          {label}
        </label>
      )}

      <div className="flex items-center gap-2">
        {/* Color preview button */}
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="relative w-8 h-8 rounded border border-gray-300 overflow-hidden cursor-pointer hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          style={{ backgroundColor: color }}
          title="Pick a color"
        >
          {/* Checkered pattern for transparency */}
          <div
            className="absolute inset-0 -z-10"
            style={{
              backgroundImage:
                'linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)',
              backgroundSize: '8px 8px',
              backgroundPosition: '0 0, 0 4px, 4px -4px, -4px 0',
            }}
          />
        </button>

        {/* Hex input */}
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onBlur={handleInputBlur}
          className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
          placeholder="#000000"
        />

        {/* Native color picker */}
        <input
          type="color"
          value={color}
          onChange={handleNativeColorChange}
          className="w-6 h-6 cursor-pointer opacity-0 absolute right-0"
          title="Open color picker"
        />
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 mt-2 p-3 bg-white rounded-lg shadow-xl border border-gray-200 w-56">
          {/* Recent colors */}
          {showRecentColors && recentColors.length > 0 && (
            <div className="mb-3">
              <div className="text-xs text-gray-500 mb-1">Recent</div>
              <div className="flex flex-wrap gap-1">
                {recentColors.map((c, i) => (
                  <button
                    key={`recent-${i}`}
                    type="button"
                    onClick={() => handleColorSelect(c)}
                    className={`w-6 h-6 rounded border-2 transition-all ${
                      color.toUpperCase() === c.toUpperCase()
                        ? 'border-blue-500 scale-110'
                        : 'border-transparent hover:border-gray-300'
                    }`}
                    style={{ backgroundColor: c }}
                    title={c}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Palette */}
          <div>
            <div className="text-xs text-gray-500 mb-1">Palette</div>
            <div className="grid grid-cols-5 gap-1">
              {DEFAULT_PALETTE.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => handleColorSelect(c)}
                  className={`w-8 h-8 rounded border-2 transition-all ${
                    color.toUpperCase() === c.toUpperCase()
                      ? 'border-blue-500 scale-110'
                      : 'border-transparent hover:border-gray-300'
                  }`}
                  style={{ backgroundColor: c }}
                  title={c}
                />
              ))}
            </div>
          </div>

          {/* Grayscale */}
          <div className="mt-3">
            <div className="flex gap-1">
              {['#FFFFFF', '#E5E5E5', '#A3A3A3', '#525252', '#000000'].map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => handleColorSelect(c)}
                  className={`flex-1 h-6 rounded border-2 transition-all ${
                    color.toUpperCase() === c.toUpperCase()
                      ? 'border-blue-500'
                      : 'border-gray-200 hover:border-gray-400'
                  }`}
                  style={{ backgroundColor: c }}
                  title={c}
                />
              ))}
            </div>
          </div>

          {/* Transparent option */}
          <button
            type="button"
            onClick={() => handleColorSelect('transparent')}
            className="mt-3 w-full py-1 text-xs text-gray-600 hover:bg-gray-100 rounded border border-dashed border-gray-300"
          >
            Transparent
          </button>
        </div>
      )}
    </div>
  );
};

export default ColorPicker;
