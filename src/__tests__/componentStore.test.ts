import { useComponentStore } from '@/store/componentStore';
import type { CanvasShape } from '@/types/canvas';

describe('Component Store', () => {
  beforeEach(() => {
    // Reset store state between tests
    useComponentStore.setState({
      components: {},
      designTokens: {
        colors: [
          { id: 'primary', name: 'Primary', value: '#3B82F6' },
          { id: 'secondary', name: 'Secondary', value: '#6B7280' },
        ],
        textStyles: [
          {
            id: 'heading-1',
            name: 'Heading 1',
            fontSize: 32,
            fontFamily: 'Arial',
            fontStyle: 'bold',
          },
        ],
      },
    });
  });

  describe('Component Management', () => {
    const mockShapes: CanvasShape[] = [
      {
        id: 'shape1',
        type: 'rectangle',
        x: 100,
        y: 100,
        width: 100,
        height: 50,
        rotation: 0,
        scaleX: 1,
        scaleY: 1,
        fill: '#3B82F6',
        stroke: '#1E40AF',
        strokeWidth: 2,
        opacity: 1,
        visible: true,
        locked: false,
        name: 'Rectangle 1',
        zIndex: 0,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        createdBy: 'user1',
        lastEditedBy: 'user1',
      },
      {
        id: 'shape2',
        type: 'text',
        x: 110,
        y: 120,
        width: 80,
        height: 30,
        rotation: 0,
        scaleX: 1,
        scaleY: 1,
        fill: '#1F2937',
        stroke: 'transparent',
        strokeWidth: 0,
        opacity: 1,
        visible: true,
        locked: false,
        name: 'Label',
        zIndex: 1,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        createdBy: 'user1',
        lastEditedBy: 'user1',
        text: 'Button',
        fontSize: 16,
        fontFamily: 'Arial',
        fontStyle: 'normal',
        textAlign: 'center',
        textDecoration: 'none',
      } as CanvasShape,
    ];

    it('should create a component from shapes', () => {
      const { createComponent, getComponent } = useComponentStore.getState();

      const componentId = createComponent('Button Component', mockShapes, 'user1');

      expect(componentId).toBeTruthy();

      const component = getComponent(componentId);
      expect(component).toBeDefined();
      expect(component?.name).toBe('Button Component');
      expect(component?.shapes.length).toBe(2);
      expect(component?.createdBy).toBe('user1');
    });

    it('should normalize shape positions relative to top-left', () => {
      const { createComponent, getComponent } = useComponentStore.getState();

      const componentId = createComponent('Test Component', mockShapes, 'user1');
      const component = getComponent(componentId);

      // First shape should be at (0, 0) since it was the top-left
      expect(component?.shapes[0].x).toBe(0);
      expect(component?.shapes[0].y).toBe(0);

      // Second shape should be offset from the first
      expect(component?.shapes[1].x).toBe(10);
      expect(component?.shapes[1].y).toBe(20);
    });

    it('should calculate component dimensions from bounding box', () => {
      const { createComponent, getComponent } = useComponentStore.getState();

      const componentId = createComponent('Test Component', mockShapes, 'user1');
      const component = getComponent(componentId);

      // Width should be from left edge of shape1 (100) to right edge of shape1 (200)
      // Height should be from top of shape1 (100) to bottom of shape2 (150)
      expect(component?.width).toBe(100); // 100 (shape1 width) since shape2 fits within
      expect(component?.height).toBe(50); // 120 + 30 - 100 = 50
    });

    it('should update component properties', () => {
      const { createComponent, updateComponent, getComponent } = useComponentStore.getState();

      const componentId = createComponent('Old Name', mockShapes, 'user1');
      updateComponent(componentId, { name: 'New Name', description: 'A button component' });

      const component = getComponent(componentId);
      expect(component?.name).toBe('New Name');
      expect(component?.description).toBe('A button component');
    });

    it('should delete a component', () => {
      const { createComponent, deleteComponent, getComponent, components } = useComponentStore.getState();

      const componentId = createComponent('To Delete', mockShapes, 'user1');
      expect(Object.keys(useComponentStore.getState().components).length).toBe(1);

      deleteComponent(componentId);
      expect(useComponentStore.getState().components[componentId]).toBeUndefined();
    });

    it('should instantiate a component at a given position', () => {
      const { createComponent, instantiateComponent } = useComponentStore.getState();

      const componentId = createComponent('Button', mockShapes, 'user1');
      const instances = instantiateComponent(componentId, 300, 400);

      expect(instances).toBeTruthy();
      expect(instances?.length).toBe(2);

      // Shapes should be offset by the instantiation position
      expect(instances?.[0].x).toBe(300); // 0 + 300
      expect(instances?.[0].y).toBe(400); // 0 + 400
      expect(instances?.[1].x).toBe(310); // 10 + 300
      expect(instances?.[1].y).toBe(420); // 20 + 400

      // Each instance should have a new unique ID
      expect(instances?.[0].id).not.toBe(mockShapes[0].id);
      expect(instances?.[1].id).not.toBe(mockShapes[1].id);
    });

    it('should return null when instantiating non-existent component', () => {
      const { instantiateComponent } = useComponentStore.getState();
      const instances = instantiateComponent('nonexistent', 0, 0);
      expect(instances).toBeNull();
    });

    it('should return empty string when creating component with no shapes', () => {
      const { createComponent } = useComponentStore.getState();
      const componentId = createComponent('Empty', [], 'user1');
      expect(componentId).toBe('');
    });
  });

  describe('Color Token Management', () => {
    it('should add a color token', () => {
      const { addColorToken, designTokens } = useComponentStore.getState();

      const id = addColorToken('Brand', '#FF5733');

      const updatedTokens = useComponentStore.getState().designTokens;
      const newColor = updatedTokens.colors.find((c) => c.id === id);

      expect(newColor).toBeDefined();
      expect(newColor?.name).toBe('Brand');
      expect(newColor?.value).toBe('#FF5733');
    });

    it('should update a color token', () => {
      const { updateColorToken, designTokens } = useComponentStore.getState();

      updateColorToken('primary', { value: '#FF0000' });

      const updatedTokens = useComponentStore.getState().designTokens;
      const primary = updatedTokens.colors.find((c) => c.id === 'primary');

      expect(primary?.value).toBe('#FF0000');
    });

    it('should delete a color token', () => {
      const { deleteColorToken, designTokens } = useComponentStore.getState();
      const initialCount = designTokens.colors.length;

      deleteColorToken('primary');

      const updatedTokens = useComponentStore.getState().designTokens;
      expect(updatedTokens.colors.length).toBe(initialCount - 1);
      expect(updatedTokens.colors.find((c) => c.id === 'primary')).toBeUndefined();
    });

    it('should get color by name', () => {
      const { getColorByName } = useComponentStore.getState();

      expect(getColorByName('Primary')).toBe('#3B82F6');
      expect(getColorByName('primary')).toBe('#3B82F6'); // case insensitive
      expect(getColorByName('NonExistent')).toBeUndefined();
    });
  });

  describe('Text Style Management', () => {
    it('should add a text style', () => {
      const { addTextStyle } = useComponentStore.getState();

      const id = addTextStyle({
        name: 'Display',
        fontSize: 48,
        fontFamily: 'Georgia',
        fontStyle: 'bold',
      });

      const updatedTokens = useComponentStore.getState().designTokens;
      const newStyle = updatedTokens.textStyles.find((s) => s.id === id);

      expect(newStyle).toBeDefined();
      expect(newStyle?.name).toBe('Display');
      expect(newStyle?.fontSize).toBe(48);
    });

    it('should update a text style', () => {
      const { updateTextStyle } = useComponentStore.getState();

      updateTextStyle('heading-1', { fontSize: 36 });

      const updatedTokens = useComponentStore.getState().designTokens;
      const heading1 = updatedTokens.textStyles.find((s) => s.id === 'heading-1');

      expect(heading1?.fontSize).toBe(36);
    });

    it('should delete a text style', () => {
      const { deleteTextStyle, designTokens } = useComponentStore.getState();
      const initialCount = designTokens.textStyles.length;

      deleteTextStyle('heading-1');

      const updatedTokens = useComponentStore.getState().designTokens;
      expect(updatedTokens.textStyles.length).toBe(initialCount - 1);
    });

    it('should get text style by name', () => {
      const { getTextStyleByName } = useComponentStore.getState();

      const style = getTextStyleByName('Heading 1');
      expect(style).toBeDefined();
      expect(style?.fontSize).toBe(32);
      expect(style?.fontStyle).toBe('bold');

      expect(getTextStyleByName('NonExistent')).toBeUndefined();
    });
  });
});
