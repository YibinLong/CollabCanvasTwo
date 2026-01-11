'use client';

import React, { useState, useCallback } from 'react';
import { useCanvasStore } from '@/store/canvasStore';
import { useUserStore } from '@/store/userStore';
import { useAuth } from '@/hooks/useAuth';
import { PresencePanel } from '../panels/PresencePanel';
import { VersionHistoryPanel } from '../panels/VersionHistoryPanel';
import { PrototypePreview } from '../prototype/PrototypePreview';

interface HeaderProps {
  canvasName?: string;
  onExport?: (format: 'png' | 'svg' | 'json') => void;
}

export const Header: React.FC<HeaderProps> = ({ canvasName, onExport }) => {
  const { scale, setScale, canvasName: storeName, setCanvasName, gridEnabled, setGridEnabled, snapToGrid, setSnapToGrid } = useCanvasStore();
  const { currentUser } = useUserStore();
  const { logout } = useAuth();
  const [showMenu, setShowMenu] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(canvasName || storeName);

  const handleZoomIn = useCallback(() => {
    setScale(Math.min(scale * 1.2, 5));
  }, [scale, setScale]);

  const handleZoomOut = useCallback(() => {
    setScale(Math.max(scale / 1.2, 0.1));
  }, [scale, setScale]);

  const handleZoomReset = useCallback(() => {
    setScale(1);
  }, [setScale]);

  const handleNameSubmit = useCallback(() => {
    if (editName.trim()) {
      setCanvasName(editName.trim());
    }
    setIsEditing(false);
  }, [editName, setCanvasName]);

  const handleLogout = async () => {
    await logout();
  };

  return (
    <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-4 z-50">
      {/* Left section */}
      <div className="flex items-center gap-4">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
            <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <path d="M21 15l-5-5L5 21" />
            </svg>
          </div>
        </div>

        {/* Canvas name */}
        <div className="flex items-center gap-2">
          {isEditing ? (
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onBlur={handleNameSubmit}
              onKeyDown={(e) => e.key === 'Enter' && handleNameSubmit()}
              className="px-2 py-1 text-sm font-medium border border-blue-500 rounded focus:outline-none"
              autoFocus
            />
          ) : (
            <button
              onClick={() => setIsEditing(true)}
              className="text-sm font-medium text-gray-900 hover:text-blue-600 transition-colors"
            >
              {canvasName || storeName}
            </button>
          )}
        </div>
      </div>

      {/* Center section - Zoom controls */}
      <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
        <button
          onClick={handleZoomOut}
          className="p-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded transition-colors"
          title="Zoom Out"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
            <line x1="8" y1="11" x2="14" y2="11" />
          </svg>
        </button>
        <button
          onClick={handleZoomReset}
          className="px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-200 rounded transition-colors min-w-[50px]"
          title="Reset Zoom"
        >
          {Math.round(scale * 100)}%
        </button>
        <button
          onClick={handleZoomIn}
          className="p-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded transition-colors"
          title="Zoom In"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
            <line x1="11" y1="8" x2="11" y2="14" />
            <line x1="8" y1="11" x2="14" y2="11" />
          </svg>
        </button>
      </div>

      {/* Right section */}
      <div className="flex items-center gap-4">
        {/* Preview/Prototype button */}
        <button
          onClick={() => setShowPreview(true)}
          className="px-3 py-1.5 bg-purple-500 text-white text-sm font-medium rounded-lg hover:bg-purple-600 transition-colors flex items-center gap-2"
          title="Preview Prototype (P)"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polygon points="5 3 19 12 5 21 5 3" />
          </svg>
          Preview
        </button>

        {/* Version History button */}
        <button
          onClick={() => setShowVersionHistory(true)}
          className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          title="Version History"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </button>

        {/* Settings button */}
        <div className="relative">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            title="Settings"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
          </button>

          {showSettings && (
            <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
              <div className="px-4 py-2">
                <h4 className="text-xs font-medium text-gray-500 uppercase mb-2">Canvas Settings</h4>
                <label className="flex items-center justify-between py-2">
                  <span className="text-sm text-gray-700">Show Grid</span>
                  <input
                    type="checkbox"
                    checked={gridEnabled}
                    onChange={(e) => setGridEnabled(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 text-blue-500 focus:ring-blue-500"
                  />
                </label>
                <label className="flex items-center justify-between py-2">
                  <span className="text-sm text-gray-700">Snap to Grid</span>
                  <input
                    type="checkbox"
                    checked={snapToGrid}
                    onChange={(e) => setSnapToGrid(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 text-blue-500 focus:ring-blue-500"
                  />
                </label>
              </div>
            </div>
          )}
        </div>

        {/* Export button */}
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="px-3 py-1.5 bg-blue-500 text-white text-sm font-medium rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2"
          >
            Export
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 9l6 6 6-6" />
            </svg>
          </button>

          {showMenu && (
            <div className="absolute right-0 mt-2 w-40 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
              <button
                onClick={() => {
                  onExport?.('png');
                  setShowMenu(false);
                }}
                className="w-full px-4 py-2 text-sm text-left text-gray-700 hover:bg-gray-100"
              >
                Export as PNG
              </button>
              <button
                onClick={() => {
                  onExport?.('svg');
                  setShowMenu(false);
                }}
                className="w-full px-4 py-2 text-sm text-left text-gray-700 hover:bg-gray-100"
              >
                Export as SVG
              </button>
              <button
                onClick={() => {
                  onExport?.('json');
                  setShowMenu(false);
                }}
                className="w-full px-4 py-2 text-sm text-left text-gray-700 hover:bg-gray-100"
              >
                Export as JSON
              </button>
            </div>
          )}
        </div>

        {/* Presence */}
        <PresencePanel />

        {/* User menu */}
        {currentUser && (
          <div className="flex items-center gap-2 pl-4 border-l border-gray-200">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium"
              style={{ backgroundColor: currentUser.color }}
            >
              {currentUser.displayName.charAt(0).toUpperCase()}
            </div>
            <button
              onClick={handleLogout}
              className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
              title="Sign Out"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
            </button>
          </div>
        )}
      </div>

      {/* Version History Modal */}
      <VersionHistoryPanel
        isOpen={showVersionHistory}
        onClose={() => setShowVersionHistory(false)}
      />

      {/* Prototype Preview Modal */}
      {showPreview && (
        <PrototypePreview onClose={() => setShowPreview(false)} />
      )}
    </header>
  );
};
