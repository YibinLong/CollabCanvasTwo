import { usePrototypeStore } from '../store/prototypeStore';

describe('prototypeStore', () => {
  beforeEach(() => {
    // Reset store state before each test
    usePrototypeStore.setState({
      isPreviewMode: false,
      currentFrameId: null,
      navigationHistory: [],
      interactions: {},
    });
  });

  describe('Preview Mode', () => {
    it('should enable preview mode', () => {
      const { setPreviewMode } = usePrototypeStore.getState();

      setPreviewMode(true);

      const state = usePrototypeStore.getState();
      expect(state.isPreviewMode).toBe(true);
    });

    it('should disable preview mode', () => {
      const { setPreviewMode } = usePrototypeStore.getState();

      setPreviewMode(true);
      setPreviewMode(false);

      const state = usePrototypeStore.getState();
      expect(state.isPreviewMode).toBe(false);
    });

    it('should reset navigation when entering preview mode', () => {
      const { navigateToFrame, setPreviewMode } = usePrototypeStore.getState();

      // Simulate navigation
      navigateToFrame('frame-1');
      navigateToFrame('frame-2');

      // Enter preview mode
      setPreviewMode(true);

      const state = usePrototypeStore.getState();
      expect(state.navigationHistory).toEqual([]);
      expect(state.currentFrameId).toBeNull();
    });

    it('should reset navigation when exiting preview mode', () => {
      const { navigateToFrame, setPreviewMode } = usePrototypeStore.getState();

      setPreviewMode(true);
      navigateToFrame('frame-1');
      setPreviewMode(false);

      const state = usePrototypeStore.getState();
      expect(state.navigationHistory).toEqual([]);
      expect(state.currentFrameId).toBeNull();
    });
  });

  describe('Navigation', () => {
    it('should navigate to a frame', () => {
      const { navigateToFrame } = usePrototypeStore.getState();

      navigateToFrame('frame-1');

      const state = usePrototypeStore.getState();
      expect(state.currentFrameId).toBe('frame-1');
    });

    it('should add previous frame to history when navigating', () => {
      const { navigateToFrame } = usePrototypeStore.getState();

      navigateToFrame('frame-1');
      navigateToFrame('frame-2');

      const state = usePrototypeStore.getState();
      expect(state.currentFrameId).toBe('frame-2');
      expect(state.navigationHistory).toEqual(['frame-1']);
    });

    it('should build navigation history correctly', () => {
      const { navigateToFrame } = usePrototypeStore.getState();

      navigateToFrame('frame-1');
      navigateToFrame('frame-2');
      navigateToFrame('frame-3');

      const state = usePrototypeStore.getState();
      expect(state.currentFrameId).toBe('frame-3');
      expect(state.navigationHistory).toEqual(['frame-1', 'frame-2']);
    });

    it('should go back to previous frame', () => {
      const { navigateToFrame, goBack } = usePrototypeStore.getState();

      navigateToFrame('frame-1');
      navigateToFrame('frame-2');
      navigateToFrame('frame-3');

      goBack();

      const state = usePrototypeStore.getState();
      expect(state.currentFrameId).toBe('frame-2');
      expect(state.navigationHistory).toEqual(['frame-1']);
    });

    it('should not go back when history is empty', () => {
      const { goBack } = usePrototypeStore.getState();

      goBack();

      const state = usePrototypeStore.getState();
      expect(state.currentFrameId).toBeNull();
      expect(state.navigationHistory).toEqual([]);
    });

    it('should reset navigation', () => {
      const { navigateToFrame, resetNavigation } = usePrototypeStore.getState();

      navigateToFrame('frame-1');
      navigateToFrame('frame-2');

      resetNavigation();

      const state = usePrototypeStore.getState();
      expect(state.currentFrameId).toBeNull();
      expect(state.navigationHistory).toEqual([]);
    });
  });

  describe('Interaction Management', () => {
    it('should add an interaction', () => {
      const { addInteraction } = usePrototypeStore.getState();

      const id = addInteraction('shape-1', 'click', 'navigate', 'frame-2');

      const state = usePrototypeStore.getState();
      expect(state.interactions[id]).toBeDefined();
      expect(state.interactions[id].sourceShapeId).toBe('shape-1');
      expect(state.interactions[id].trigger).toBe('click');
      expect(state.interactions[id].action).toBe('navigate');
      expect(state.interactions[id].targetFrameId).toBe('frame-2');
    });

    it('should add interaction with animation', () => {
      const { addInteraction } = usePrototypeStore.getState();

      const id = addInteraction('shape-1', 'click', 'navigate', 'frame-2', 'slide-left');

      const state = usePrototypeStore.getState();
      expect(state.interactions[id].animation).toBe('slide-left');
      expect(state.interactions[id].duration).toBe(300);
    });

    it('should add instant interaction with zero duration', () => {
      const { addInteraction } = usePrototypeStore.getState();

      const id = addInteraction('shape-1', 'click', 'navigate', 'frame-2', 'instant');

      const state = usePrototypeStore.getState();
      expect(state.interactions[id].animation).toBe('instant');
      expect(state.interactions[id].duration).toBe(0);
    });

    it('should update an interaction', () => {
      const { addInteraction, updateInteraction } = usePrototypeStore.getState();

      const id = addInteraction('shape-1', 'click', 'navigate', 'frame-2');

      updateInteraction(id, { targetFrameId: 'frame-3', animation: 'dissolve' });

      const state = usePrototypeStore.getState();
      expect(state.interactions[id].targetFrameId).toBe('frame-3');
      expect(state.interactions[id].animation).toBe('dissolve');
    });

    it('should not update non-existent interaction', () => {
      const { updateInteraction } = usePrototypeStore.getState();

      updateInteraction('non-existent', { targetFrameId: 'frame-2' });

      const state = usePrototypeStore.getState();
      expect(Object.keys(state.interactions)).toHaveLength(0);
    });

    it('should remove an interaction', () => {
      const { addInteraction, removeInteraction } = usePrototypeStore.getState();

      const id = addInteraction('shape-1', 'click', 'navigate', 'frame-2');
      removeInteraction(id);

      const state = usePrototypeStore.getState();
      expect(state.interactions[id]).toBeUndefined();
    });

    it('should get interactions for a shape', () => {
      const { addInteraction, getInteractionsForShape } = usePrototypeStore.getState();

      addInteraction('shape-1', 'click', 'navigate', 'frame-2');
      addInteraction('shape-1', 'hover', 'open-overlay', 'frame-3');
      addInteraction('shape-2', 'click', 'back');

      const shape1Interactions = getInteractionsForShape('shape-1');
      expect(shape1Interactions).toHaveLength(2);
      expect(shape1Interactions.every(i => i.sourceShapeId === 'shape-1')).toBe(true);

      const shape2Interactions = getInteractionsForShape('shape-2');
      expect(shape2Interactions).toHaveLength(1);
      expect(shape2Interactions[0].action).toBe('back');
    });

    it('should return empty array for shape with no interactions', () => {
      const { getInteractionsForShape } = usePrototypeStore.getState();

      const interactions = getInteractionsForShape('no-interactions-shape');
      expect(interactions).toEqual([]);
    });

    it('should clear all interactions', () => {
      const { addInteraction, clearInteractions } = usePrototypeStore.getState();

      addInteraction('shape-1', 'click', 'navigate', 'frame-2');
      addInteraction('shape-2', 'hover', 'open-overlay', 'frame-3');

      clearInteractions();

      const state = usePrototypeStore.getState();
      expect(Object.keys(state.interactions)).toHaveLength(0);
    });
  });

  describe('Interaction Triggers', () => {
    it('should support click trigger', () => {
      const { addInteraction } = usePrototypeStore.getState();

      const id = addInteraction('shape-1', 'click', 'navigate', 'frame-2');

      const state = usePrototypeStore.getState();
      expect(state.interactions[id].trigger).toBe('click');
    });

    it('should support hover trigger', () => {
      const { addInteraction } = usePrototypeStore.getState();

      const id = addInteraction('shape-1', 'hover', 'open-overlay', 'frame-2');

      const state = usePrototypeStore.getState();
      expect(state.interactions[id].trigger).toBe('hover');
    });

    it('should support drag trigger', () => {
      const { addInteraction } = usePrototypeStore.getState();

      const id = addInteraction('shape-1', 'drag', 'scroll-to', 'frame-2');

      const state = usePrototypeStore.getState();
      expect(state.interactions[id].trigger).toBe('drag');
    });
  });

  describe('Interaction Actions', () => {
    it('should support navigate action', () => {
      const { addInteraction } = usePrototypeStore.getState();

      const id = addInteraction('shape-1', 'click', 'navigate', 'frame-2');

      const state = usePrototypeStore.getState();
      expect(state.interactions[id].action).toBe('navigate');
    });

    it('should support open-overlay action', () => {
      const { addInteraction } = usePrototypeStore.getState();

      const id = addInteraction('shape-1', 'click', 'open-overlay', 'frame-2');

      const state = usePrototypeStore.getState();
      expect(state.interactions[id].action).toBe('open-overlay');
    });

    it('should support scroll-to action', () => {
      const { addInteraction } = usePrototypeStore.getState();

      const id = addInteraction('shape-1', 'click', 'scroll-to', 'frame-2');

      const state = usePrototypeStore.getState();
      expect(state.interactions[id].action).toBe('scroll-to');
    });

    it('should support back action', () => {
      const { addInteraction } = usePrototypeStore.getState();

      const id = addInteraction('shape-1', 'click', 'back');

      const state = usePrototypeStore.getState();
      expect(state.interactions[id].action).toBe('back');
      expect(state.interactions[id].targetFrameId).toBeUndefined();
    });
  });

  describe('Animation Types', () => {
    const animations = ['instant', 'dissolve', 'slide-left', 'slide-right', 'slide-up', 'slide-down'] as const;

    animations.forEach(animation => {
      it(`should support ${animation} animation`, () => {
        const { addInteraction } = usePrototypeStore.getState();

        const id = addInteraction('shape-1', 'click', 'navigate', 'frame-2', animation);

        const state = usePrototypeStore.getState();
        expect(state.interactions[id].animation).toBe(animation);
      });
    });
  });

  describe('Integration Scenarios', () => {
    it('should handle complete navigation flow', () => {
      const { addInteraction, navigateToFrame, goBack, setPreviewMode, getInteractionsForShape } = usePrototypeStore.getState();

      // Set up interactions
      addInteraction('button-1', 'click', 'navigate', 'page-2', 'slide-left');
      addInteraction('button-2', 'click', 'navigate', 'page-3', 'slide-left');
      addInteraction('back-button', 'click', 'back', undefined, 'slide-right');

      // Start preview
      setPreviewMode(true);

      // Navigate to first page
      navigateToFrame('page-1');

      // Navigate using the interaction
      const interactions = getInteractionsForShape('button-1');
      expect(interactions).toHaveLength(1);
      navigateToFrame(interactions[0].targetFrameId!);

      let state = usePrototypeStore.getState();
      expect(state.currentFrameId).toBe('page-2');
      expect(state.navigationHistory).toEqual(['page-1']);

      // Go back
      goBack();
      state = usePrototypeStore.getState();
      expect(state.currentFrameId).toBe('page-1');
      expect(state.navigationHistory).toEqual([]);

      // Exit preview
      setPreviewMode(false);
      state = usePrototypeStore.getState();
      expect(state.isPreviewMode).toBe(false);
    });

    it('should maintain interactions across preview mode changes', () => {
      const { addInteraction, setPreviewMode } = usePrototypeStore.getState();

      const id = addInteraction('shape-1', 'click', 'navigate', 'frame-2');

      setPreviewMode(true);
      setPreviewMode(false);

      const state = usePrototypeStore.getState();
      expect(state.interactions[id]).toBeDefined();
    });
  });
});
