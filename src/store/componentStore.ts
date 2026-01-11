import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { nanoid } from 'nanoid';
import type { Component, CanvasShape, ColorToken, TextStyle, DesignTokens } from '@/types/canvas';

interface ComponentStore {
  // Components
  components: Record<string, Component>;

  // Design Tokens
  designTokens: DesignTokens;

  // Component actions
  createComponent: (name: string, shapes: CanvasShape[], userId: string) => string;
  updateComponent: (id: string, updates: Partial<Component>) => void;
  deleteComponent: (id: string) => void;
  getComponent: (id: string) => Component | undefined;
  instantiateComponent: (
    componentId: string,
    x: number,
    y: number
  ) => CanvasShape[] | null;

  // Color token actions
  addColorToken: (name: string, value: string) => string;
  updateColorToken: (id: string, updates: Partial<ColorToken>) => void;
  deleteColorToken: (id: string) => void;

  // Text style actions
  addTextStyle: (style: Omit<TextStyle, 'id'>) => string;
  updateTextStyle: (id: string, updates: Partial<TextStyle>) => void;
  deleteTextStyle: (id: string) => void;

  // Utility
  getColorByName: (name: string) => string | undefined;
  getTextStyleByName: (name: string) => TextStyle | undefined;
}

const defaultDesignTokens: DesignTokens = {
  colors: [
    { id: 'primary', name: 'Primary', value: '#3B82F6' },
    { id: 'secondary', name: 'Secondary', value: '#6B7280' },
    { id: 'success', name: 'Success', value: '#10B981' },
    { id: 'warning', name: 'Warning', value: '#F59E0B' },
    { id: 'danger', name: 'Danger', value: '#EF4444' },
    { id: 'background', name: 'Background', value: '#FFFFFF' },
    { id: 'surface', name: 'Surface', value: '#F9FAFB' },
    { id: 'text-primary', name: 'Text Primary', value: '#1F2937' },
    { id: 'text-secondary', name: 'Text Secondary', value: '#6B7280' },
    { id: 'border', name: 'Border', value: '#E5E7EB' },
  ],
  textStyles: [
    {
      id: 'heading-1',
      name: 'Heading 1',
      fontSize: 32,
      fontFamily: 'Arial',
      fontStyle: 'bold',
    },
    {
      id: 'heading-2',
      name: 'Heading 2',
      fontSize: 24,
      fontFamily: 'Arial',
      fontStyle: 'bold',
    },
    {
      id: 'heading-3',
      name: 'Heading 3',
      fontSize: 20,
      fontFamily: 'Arial',
      fontStyle: 'bold',
    },
    {
      id: 'body',
      name: 'Body',
      fontSize: 16,
      fontFamily: 'Arial',
      fontStyle: 'normal',
    },
    {
      id: 'caption',
      name: 'Caption',
      fontSize: 12,
      fontFamily: 'Arial',
      fontStyle: 'normal',
    },
    {
      id: 'button',
      name: 'Button',
      fontSize: 14,
      fontFamily: 'Arial',
      fontStyle: 'bold',
    },
  ],
};

export const useComponentStore = create<ComponentStore>()(
  subscribeWithSelector((set, get) => ({
    components: {},
    designTokens: defaultDesignTokens,

    createComponent: (name, shapes, userId) => {
      if (shapes.length === 0) return '';

      // Calculate bounding box
      const minX = Math.min(...shapes.map((s) => s.x));
      const minY = Math.min(...shapes.map((s) => s.y));
      const maxX = Math.max(...shapes.map((s) => s.x + s.width * s.scaleX));
      const maxY = Math.max(...shapes.map((s) => s.y + s.height * s.scaleY));

      // Normalize shape positions relative to top-left
      const normalizedShapes = shapes.map((shape) => ({
        ...shape,
        x: shape.x - minX,
        y: shape.y - minY,
      }));

      const componentId = nanoid();
      const component: Component = {
        id: componentId,
        name,
        shapes: normalizedShapes,
        width: maxX - minX,
        height: maxY - minY,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        createdBy: userId,
      };

      set((state) => ({
        components: { ...state.components, [componentId]: component },
      }));

      return componentId;
    },

    updateComponent: (id, updates) => {
      const { components } = get();
      const component = components[id];
      if (!component) return;

      set({
        components: {
          ...components,
          [id]: {
            ...component,
            ...updates,
            updatedAt: Date.now(),
          },
        },
      });
    },

    deleteComponent: (id) => {
      const { components } = get();
      const newComponents = { ...components };
      delete newComponents[id];
      set({ components: newComponents });
    },

    getComponent: (id) => {
      return get().components[id];
    },

    instantiateComponent: (componentId, x, y) => {
      const component = get().components[componentId];
      if (!component) return null;

      // Create new shapes with new IDs and offset positions
      const newShapes = component.shapes.map((shape) => ({
        ...shape,
        id: nanoid(),
        x: shape.x + x,
        y: shape.y + y,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }));

      return newShapes;
    },

    addColorToken: (name, value) => {
      const id = nanoid();
      set((state) => ({
        designTokens: {
          ...state.designTokens,
          colors: [...state.designTokens.colors, { id, name, value }],
        },
      }));
      return id;
    },

    updateColorToken: (id, updates) => {
      set((state) => ({
        designTokens: {
          ...state.designTokens,
          colors: state.designTokens.colors.map((color) =>
            color.id === id ? { ...color, ...updates } : color
          ),
        },
      }));
    },

    deleteColorToken: (id) => {
      set((state) => ({
        designTokens: {
          ...state.designTokens,
          colors: state.designTokens.colors.filter((color) => color.id !== id),
        },
      }));
    },

    addTextStyle: (style) => {
      const id = nanoid();
      set((state) => ({
        designTokens: {
          ...state.designTokens,
          textStyles: [...state.designTokens.textStyles, { ...style, id }],
        },
      }));
      return id;
    },

    updateTextStyle: (id, updates) => {
      set((state) => ({
        designTokens: {
          ...state.designTokens,
          textStyles: state.designTokens.textStyles.map((style) =>
            style.id === id ? { ...style, ...updates } : style
          ),
        },
      }));
    },

    deleteTextStyle: (id) => {
      set((state) => ({
        designTokens: {
          ...state.designTokens,
          textStyles: state.designTokens.textStyles.filter(
            (style) => style.id !== id
          ),
        },
      }));
    },

    getColorByName: (name) => {
      const color = get().designTokens.colors.find(
        (c) => c.name.toLowerCase() === name.toLowerCase()
      );
      return color?.value;
    },

    getTextStyleByName: (name) => {
      return get().designTokens.textStyles.find(
        (s) => s.name.toLowerCase() === name.toLowerCase()
      );
    },
  }))
);
