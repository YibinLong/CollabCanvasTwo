'use client';

import React, { useMemo } from 'react';
import { useCanvasStore } from '@/store/canvasStore';
import { usePrototypeStore } from '@/store/prototypeStore';
import type { Frame, Interaction, InteractionTrigger, InteractionAction } from '@/types/canvas';

export const InteractionPanel: React.FC = () => {
  const { shapes, selectedIds } = useCanvasStore();
  const {
    addInteraction,
    updateInteraction,
    removeInteraction,
    getInteractionsForShape,
  } = usePrototypeStore();

  // Get all frames for target selection
  const frames = useMemo(() => {
    return Object.values(shapes).filter((s): s is Frame => s.type === 'frame');
  }, [shapes]);

  // Get selected shape
  const selectedShape = selectedIds.length === 1 ? shapes[selectedIds[0]] : null;

  // Get interactions for selected shape
  const shapeInteractions = useMemo(() => {
    if (!selectedShape) return [];
    return getInteractionsForShape(selectedShape.id);
  }, [selectedShape, getInteractionsForShape]);

  // Handle adding new interaction
  const handleAddInteraction = () => {
    if (!selectedShape) return;
    addInteraction(selectedShape.id, 'click', 'navigate', frames[0]?.id, 'dissolve');
  };

  // Handle trigger change
  const handleTriggerChange = (id: string, trigger: InteractionTrigger) => {
    updateInteraction(id, { trigger });
  };

  // Handle action change
  const handleActionChange = (id: string, action: InteractionAction) => {
    updateInteraction(id, { action });
  };

  // Handle target change
  const handleTargetChange = (id: string, targetFrameId: string) => {
    updateInteraction(id, { targetFrameId });
  };

  // Handle animation change
  const handleAnimationChange = (id: string, animation: Interaction['animation']) => {
    updateInteraction(id, { animation });
  };

  if (!selectedShape) {
    return (
      <div className="p-3 text-sm text-gray-500">
        Select a shape to add interactions
      </div>
    );
  }

  return (
    <div className="p-3 space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-gray-700">Interactions</h4>
        <button
          onClick={handleAddInteraction}
          className="p-1 text-blue-500 hover:bg-blue-50 rounded"
          title="Add Interaction"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </div>

      {shapeInteractions.length === 0 ? (
        <p className="text-xs text-gray-400">
          No interactions. Click + to add one.
        </p>
      ) : (
        <div className="space-y-3">
          {shapeInteractions.map((interaction) => (
            <div
              key={interaction.id}
              className="p-2 bg-gray-50 rounded-lg border border-gray-200 space-y-2"
            >
              {/* Trigger */}
              <div className="flex items-center gap-2">
                <label className="text-xs text-gray-500 w-16">Trigger:</label>
                <select
                  value={interaction.trigger}
                  onChange={(e) => handleTriggerChange(interaction.id, e.target.value as InteractionTrigger)}
                  className="flex-1 text-xs px-2 py-1 border border-gray-200 rounded"
                >
                  <option value="click">On Click</option>
                  <option value="hover">On Hover</option>
                  <option value="drag">On Drag</option>
                </select>
              </div>

              {/* Action */}
              <div className="flex items-center gap-2">
                <label className="text-xs text-gray-500 w-16">Action:</label>
                <select
                  value={interaction.action}
                  onChange={(e) => handleActionChange(interaction.id, e.target.value as InteractionAction)}
                  className="flex-1 text-xs px-2 py-1 border border-gray-200 rounded"
                >
                  <option value="navigate">Navigate</option>
                  <option value="back">Go Back</option>
                  <option value="open-overlay">Open Overlay</option>
                  <option value="scroll-to">Scroll To</option>
                </select>
              </div>

              {/* Target (for navigate action) */}
              {(interaction.action === 'navigate' || interaction.action === 'open-overlay') && (
                <div className="flex items-center gap-2">
                  <label className="text-xs text-gray-500 w-16">Target:</label>
                  <select
                    value={interaction.targetFrameId || ''}
                    onChange={(e) => handleTargetChange(interaction.id, e.target.value)}
                    className="flex-1 text-xs px-2 py-1 border border-gray-200 rounded"
                  >
                    <option value="">Select frame...</option>
                    {frames.map((frame) => (
                      <option key={frame.id} value={frame.id}>
                        {frame.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Animation */}
              <div className="flex items-center gap-2">
                <label className="text-xs text-gray-500 w-16">Anim:</label>
                <select
                  value={interaction.animation || 'instant'}
                  onChange={(e) => handleAnimationChange(interaction.id, e.target.value as Interaction['animation'])}
                  className="flex-1 text-xs px-2 py-1 border border-gray-200 rounded"
                >
                  <option value="instant">Instant</option>
                  <option value="dissolve">Dissolve</option>
                  <option value="slide-left">Slide Left</option>
                  <option value="slide-right">Slide Right</option>
                  <option value="slide-up">Slide Up</option>
                  <option value="slide-down">Slide Down</option>
                </select>
              </div>

              {/* Remove button */}
              <div className="flex justify-end">
                <button
                  onClick={() => removeInteraction(interaction.id)}
                  className="text-xs text-red-500 hover:text-red-700"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Help text */}
      <p className="text-xs text-gray-400 mt-2">
        Add interactions to make shapes clickable in preview mode. Use frames as navigation destinations.
      </p>
    </div>
  );
};
