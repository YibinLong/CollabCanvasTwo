import { create } from 'zustand';
import { nanoid } from 'nanoid';
import type { Interaction, InteractionTrigger, InteractionAction } from '@/types/canvas';

interface PrototypeStore {
  // State
  isPreviewMode: boolean;
  currentFrameId: string | null;
  navigationHistory: string[];
  interactions: Record<string, Interaction>;

  // Actions
  setPreviewMode: (enabled: boolean) => void;
  navigateToFrame: (frameId: string) => void;
  goBack: () => void;
  resetNavigation: () => void;

  // Interaction management
  addInteraction: (
    sourceShapeId: string,
    trigger: InteractionTrigger,
    action: InteractionAction,
    targetFrameId?: string,
    animation?: Interaction['animation']
  ) => string;
  updateInteraction: (id: string, updates: Partial<Interaction>) => void;
  removeInteraction: (id: string) => void;
  getInteractionsForShape: (shapeId: string) => Interaction[];
  clearInteractions: () => void;
}

export const usePrototypeStore = create<PrototypeStore>((set, get) => ({
  // Initial state
  isPreviewMode: false,
  currentFrameId: null,
  navigationHistory: [],
  interactions: {},

  // Preview mode
  setPreviewMode: (enabled) => {
    set({
      isPreviewMode: enabled,
      // Reset navigation when entering/exiting preview mode
      currentFrameId: null,
      navigationHistory: [],
    });
  },

  // Navigation
  navigateToFrame: (frameId) => {
    const { currentFrameId, navigationHistory } = get();
    set({
      currentFrameId: frameId,
      navigationHistory: currentFrameId
        ? [...navigationHistory, currentFrameId]
        : navigationHistory,
    });
  },

  goBack: () => {
    const { navigationHistory } = get();
    if (navigationHistory.length === 0) return;

    const newHistory = [...navigationHistory];
    const previousFrame = newHistory.pop();

    set({
      currentFrameId: previousFrame || null,
      navigationHistory: newHistory,
    });
  },

  resetNavigation: () => {
    set({
      currentFrameId: null,
      navigationHistory: [],
    });
  },

  // Interaction management
  addInteraction: (sourceShapeId, trigger, action, targetFrameId, animation = 'instant') => {
    const id = nanoid();
    const interaction: Interaction = {
      id,
      sourceShapeId,
      trigger,
      action,
      targetFrameId,
      animation,
      duration: animation === 'instant' ? 0 : 300,
    };

    set((state) => ({
      interactions: {
        ...state.interactions,
        [id]: interaction,
      },
    }));

    return id;
  },

  updateInteraction: (id, updates) => {
    set((state) => {
      const interaction = state.interactions[id];
      if (!interaction) return state;

      return {
        interactions: {
          ...state.interactions,
          [id]: { ...interaction, ...updates },
        },
      };
    });
  },

  removeInteraction: (id) => {
    set((state) => {
      const { [id]: _removed, ...rest } = state.interactions;
      void _removed; // Acknowledge unused variable
      return { interactions: rest };
    });
  },

  getInteractionsForShape: (shapeId) => {
    const { interactions } = get();
    return Object.values(interactions).filter(
      (interaction) => interaction.sourceShapeId === shapeId
    );
  },

  clearInteractions: () => {
    set({ interactions: {} });
  },
}));
