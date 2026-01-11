'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import dynamic from 'next/dynamic';
import { useCanvasStore } from '@/store/canvasStore';
import { useUserStore } from '@/store/userStore';
import { useRealtimeSync } from '@/hooks/useRealtimeSync';
import { useAIAgent } from '@/hooks/useAIAgent';
import { Header } from './layout/Header';
import { Toolbar } from './toolbar/Toolbar';
import { PropertyPanel } from './toolbar/PropertyPanel';
import { LayersPanel } from './panels/LayersPanel';
import { AIChat } from './ai/AIChat';

// Dynamic import Canvas to prevent SSR issues with Konva
const Canvas = dynamic(() => import('./canvas/Canvas').then((mod) => mod.Canvas), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full bg-gray-100">
      <div className="text-gray-500">Loading canvas...</div>
    </div>
  ),
});

interface CanvasPageProps {
  canvasId: string;
}

export const CanvasPage: React.FC<CanvasPageProps> = ({ canvasId }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [showLayers, setShowLayers] = useState(true);
  const [showProperties, setShowProperties] = useState(true);

  const { shapes, setCanvasId } = useCanvasStore();
  const { currentUser, connectionStatus } = useUserStore();
  const { processCommand, isProcessing } = useAIAgent();

  // Set canvas ID on mount
  useEffect(() => {
    setCanvasId(canvasId);
  }, [canvasId, setCanvasId]);

  // Real-time sync
  const syncOptions = currentUser
    ? {
        canvasId,
        userId: currentUser.id,
        userName: currentUser.displayName,
        userColor: currentUser.color,
      }
    : null;

  const { updateCursorPosition } = useRealtimeSync(syncOptions);

  // Handle window resize
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setDimensions({
          width: rect.width,
          height: rect.height,
        });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, [showLayers, showProperties]);

  // Handle cursor movement
  const handleCursorMove = useCallback(
    (x: number, y: number) => {
      updateCursorPosition(x, y);
    },
    [updateCursorPosition]
  );

  // Handle export
  const handleExport = useCallback(
    (format: 'png' | 'svg' | 'json') => {
      if (format === 'json') {
        const data = JSON.stringify({ shapes, canvasId }, null, 2);
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `canvas-${canvasId}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } else {
        // For PNG/SVG, we need to access the Konva stage
        // This would be implemented with a ref to the stage
        console.log(`Exporting as ${format}...`);
        alert(`${format.toUpperCase()} export would be implemented with Konva stage.toDataURL()`);
      }
    },
    [shapes, canvasId]
  );

  // Handle AI commands
  const handleAIMessage = useCallback(
    async (message: string) => {
      try {
        const result = await processCommand(message);
        return result;
      } catch (error) {
        console.error('AI command error:', error);
        throw error;
      }
    },
    [processCommand]
  );

  // Keyboard shortcuts for panels
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      // Toggle layers panel
      if (e.key === '\\' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setShowLayers((prev) => !prev);
      }

      // Toggle properties panel
      if (e.key === 'p' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setShowProperties((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="h-screen flex flex-col bg-gray-100 overflow-hidden">
      {/* Header */}
      <Header onExport={handleExport} />

      <div className="flex-1 flex overflow-hidden">
        {/* Left sidebar - Layers */}
        {showLayers && (
          <div className="w-64 flex-shrink-0 bg-white border-r border-gray-200 flex flex-col">
            <div className="flex items-center justify-between p-2 border-b border-gray-200">
              <button
                onClick={() => setShowLayers(false)}
                className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
                title="Hide Layers"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M11 19l-7-7 7-7" />
                  <path d="M18 19l-7-7 7-7" />
                </svg>
              </button>
            </div>
            <LayersPanel />
          </div>
        )}

        {/* Main canvas area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Toolbar */}
          <div className="flex justify-center p-3 bg-gray-50 border-b border-gray-200">
            <Toolbar />
          </div>

          {/* Canvas container */}
          <div ref={containerRef} className="flex-1 relative overflow-hidden bg-gray-200">
            {/* Show panel toggles if panels are hidden */}
            {!showLayers && (
              <button
                onClick={() => setShowLayers(true)}
                className="absolute left-2 top-2 p-2 bg-white rounded-lg shadow-md text-gray-600 hover:text-gray-900 z-10"
                title="Show Layers"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polygon points="12 2 2 7 12 12 22 7 12 2" />
                  <polyline points="2 17 12 22 22 17" />
                  <polyline points="2 12 12 17 22 12" />
                </svg>
              </button>
            )}

            {!showProperties && (
              <button
                onClick={() => setShowProperties(true)}
                className="absolute right-2 top-2 p-2 bg-white rounded-lg shadow-md text-gray-600 hover:text-gray-900 z-10"
                title="Show Properties"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                  <line x1="9" y1="9" x2="15" y2="9" />
                  <line x1="9" y1="15" x2="15" y2="15" />
                </svg>
              </button>
            )}

            {/* Connection status indicator */}
            {connectionStatus !== 'connected' && (
              <div className="absolute top-2 left-1/2 -translate-x-1/2 px-3 py-1 bg-yellow-100 text-yellow-800 text-sm rounded-full z-10">
                {connectionStatus === 'connecting' && 'Connecting...'}
                {connectionStatus === 'reconnecting' && 'Reconnecting...'}
                {connectionStatus === 'disconnected' && 'Disconnected'}
              </div>
            )}

            <Canvas
              width={dimensions.width}
              height={dimensions.height}
              onCursorMove={handleCursorMove}
            />
          </div>
        </div>

        {/* Right sidebar - Properties */}
        {showProperties && (
          <div className="flex-shrink-0 flex flex-col">
            <div className="flex items-center justify-between p-2 border-b border-gray-200 bg-white">
              <button
                onClick={() => setShowProperties(false)}
                className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded ml-auto"
                title="Hide Properties"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M13 5l7 7-7 7" />
                  <path d="M6 5l7 7-7 7" />
                </svg>
              </button>
            </div>
            <PropertyPanel />
          </div>
        )}
      </div>

      {/* AI Chat */}
      <AIChat onSendMessage={handleAIMessage} isProcessing={isProcessing} />
    </div>
  );
};
