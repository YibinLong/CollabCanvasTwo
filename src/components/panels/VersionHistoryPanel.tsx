'use client';

import React, { useState, useCallback } from 'react';
import { useCanvasStore } from '@/store/canvasStore';
import { useUserStore } from '@/store/userStore';

interface VersionHistoryPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export const VersionHistoryPanel: React.FC<VersionHistoryPanelProps> = ({ isOpen, onClose }) => {
  const { versions, saveVersion, restoreVersion, deleteVersion } = useCanvasStore();
  const { currentUser } = useUserStore();
  const [versionName, setVersionName] = useState('');
  const [confirmRestore, setConfirmRestore] = useState<string | null>(null);

  const handleSaveVersion = useCallback(() => {
    if (!currentUser) return;

    saveVersion(
      versionName || `Version ${versions.length + 1}`,
      currentUser.id,
      currentUser.displayName
    );
    setVersionName('');
  }, [saveVersion, versionName, versions.length, currentUser]);

  const handleRestoreVersion = useCallback(
    (versionId: string) => {
      if (confirmRestore === versionId) {
        restoreVersion(versionId);
        setConfirmRestore(null);
      } else {
        setConfirmRestore(versionId);
        // Reset confirm after 3 seconds
        setTimeout(() => setConfirmRestore(null), 3000);
      }
    },
    [confirmRestore, restoreVersion]
  );

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Version History</h2>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Save new version */}
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <label className="block text-sm font-medium text-gray-700 mb-2">Save Current State</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={versionName}
              onChange={(e) => setVersionName(e.target.value)}
              placeholder="Version name (optional)"
              className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={handleSaveVersion}
              disabled={!currentUser}
              className="px-4 py-2 bg-blue-500 text-white text-sm font-medium rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              Save
            </button>
          </div>
        </div>

        {/* Version list */}
        <div className="flex-1 overflow-y-auto p-2">
          {versions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <svg
                className="w-12 h-12 mx-auto mb-3 text-gray-300"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm">No saved versions yet</p>
              <p className="text-xs text-gray-400 mt-1">
                Save your canvas state to create restore points
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {versions.map((version) => (
                <div
                  key={version.id}
                  className="p-3 bg-white border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-gray-900 truncate">{version.name}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-gray-500">{formatDate(version.timestamp)}</span>
                        <span className="text-gray-300">•</span>
                        <span className="text-xs text-gray-500">by {version.createdByName}</span>
                      </div>
                      <div className="text-xs text-gray-400 mt-1">
                        {Object.keys(version.shapes).length} objects
                      </div>
                    </div>

                    <div className="flex items-center gap-1 ml-2">
                      <button
                        onClick={() => handleRestoreVersion(version.id)}
                        className={`px-2 py-1 text-xs rounded ${
                          confirmRestore === version.id
                            ? 'bg-orange-500 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {confirmRestore === version.id ? 'Confirm?' : 'Restore'}
                      </button>
                      <button
                        onClick={() => deleteVersion(version.id)}
                        className="p-1 text-gray-400 hover:text-red-500 rounded hover:bg-gray-100"
                        title="Delete version"
                      >
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-gray-200 bg-gray-50">
          <p className="text-xs text-gray-500 text-center">
            {versions.length} of 20 versions saved
          </p>
        </div>
      </div>
    </div>
  );
};
