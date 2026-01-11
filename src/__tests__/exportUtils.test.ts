import { shapesToSVG, exportToJSON } from '@/lib/exportUtils';
import type { CanvasShape, TextShape, RectangleShape, CircleShape, TriangleShape, StarShape, LineShape } from '@/types/canvas';

describe('exportUtils', () => {
  const createBaseProps = () => ({
    x: 100,
    y: 100,
    width: 200,
    height: 150,
    rotation: 0,
    scaleX: 1,
    scaleY: 1,
    fill: '#3B82F6',
    stroke: '#1E40AF',
    strokeWidth: 2,
    opacity: 1,
    visible: true,
    locked: false,
    name: 'Test Shape',
    zIndex: 0,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    createdBy: 'user-1',
    lastEditedBy: 'user-1',
  });

  const createRectangle = (overrides: Partial<RectangleShape> = {}): RectangleShape => ({
    id: 'shape-1',
    type: 'rectangle',
    ...createBaseProps(),
    ...overrides,
  });

  const createCircle = (overrides: Partial<CircleShape> = {}): CircleShape => ({
    id: 'shape-1',
    type: 'circle',
    ...createBaseProps(),
    ...overrides,
  });

  const createTriangle = (overrides: Partial<TriangleShape> = {}): TriangleShape => ({
    id: 'shape-1',
    type: 'triangle',
    ...createBaseProps(),
    ...overrides,
  });

  const createStar = (overrides: Partial<StarShape> = {}): StarShape => ({
    id: 'shape-1',
    type: 'star',
    numPoints: 5,
    innerRadius: 20,
    outerRadius: 50,
    ...createBaseProps(),
    ...overrides,
  });

  const createLine = (overrides: Partial<LineShape> = {}): LineShape => ({
    id: 'shape-1',
    type: 'line',
    points: [0, 0, 100, 100],
    ...createBaseProps(),
    ...overrides,
  });

  const createText = (overrides: Partial<TextShape> = {}): TextShape => ({
    id: 'shape-1',
    type: 'text',
    text: 'Hello World',
    fontSize: 24,
    fontFamily: 'Arial',
    fontStyle: 'normal',
    textAlign: 'left',
    textDecoration: 'none',
    ...createBaseProps(),
    ...overrides,
  });

  describe('shapesToSVG', () => {
    it('should generate valid SVG for rectangles', () => {
      const shapes: CanvasShape[] = [createRectangle()];
      const svg = shapesToSVG(shapes);

      expect(svg).toContain('<?xml version="1.0" encoding="UTF-8"?>');
      expect(svg).toContain('<svg xmlns="http://www.w3.org/2000/svg"');
      expect(svg).toContain('<rect');
      expect(svg).toContain('fill="#3B82F6"');
      expect(svg).toContain('stroke="#1E40AF"');
    });

    it('should generate valid SVG for circles', () => {
      const shapes: CanvasShape[] = [createCircle()];
      const svg = shapesToSVG(shapes);

      expect(svg).toContain('<ellipse');
    });

    it('should generate valid SVG for triangles', () => {
      const shapes: CanvasShape[] = [createTriangle()];
      const svg = shapesToSVG(shapes);

      expect(svg).toContain('<polygon');
    });

    it('should generate valid SVG for stars', () => {
      const shapes: CanvasShape[] = [createStar()];
      const svg = shapesToSVG(shapes);

      expect(svg).toContain('<polygon');
    });

    it('should generate valid SVG for lines', () => {
      const shapes: CanvasShape[] = [createLine()];
      const svg = shapesToSVG(shapes);

      expect(svg).toContain('<line');
    });

    it('should generate valid SVG for text', () => {
      const shapes: CanvasShape[] = [createText()];
      const svg = shapesToSVG(shapes);

      expect(svg).toContain('<text');
      expect(svg).toContain('Hello World');
      expect(svg).toContain('font-family="Arial"');
      expect(svg).toContain('font-size="24"');
    });

    it('should escape special XML characters in text', () => {
      const shapes: CanvasShape[] = [createText({ text: '<script>alert("XSS")</script>' })];
      const svg = shapesToSVG(shapes);

      expect(svg).not.toContain('<script>');
      expect(svg).toContain('&lt;script&gt;');
    });

    it('should apply rotation transform', () => {
      const shapes: CanvasShape[] = [createRectangle({ rotation: 45 })];
      const svg = shapesToSVG(shapes);

      expect(svg).toContain('transform="rotate(45');
    });

    it('should respect opacity', () => {
      const shapes: CanvasShape[] = [createRectangle({ opacity: 0.5 })];
      const svg = shapesToSVG(shapes);

      expect(svg).toContain('opacity="0.5"');
    });

    it('should exclude hidden shapes', () => {
      const shapes: CanvasShape[] = [
        createRectangle({ id: 'visible', visible: true }),
        createRectangle({ id: 'hidden', visible: false }),
      ];
      const svg = shapesToSVG(shapes);

      // Should only have one rect
      const rectMatches = svg.match(/<rect/g);
      expect(rectMatches).toHaveLength(2); // Background + 1 visible shape
    });

    it('should sort shapes by zIndex', () => {
      const shapes: CanvasShape[] = [
        createRectangle({ id: 'back', zIndex: 0, fill: '#FF0000' }),
        createRectangle({ id: 'front', zIndex: 1, fill: '#00FF00' }),
      ];
      const svg = shapesToSVG(shapes);

      // Back shape should appear before front shape
      const redIndex = svg.indexOf('#FF0000');
      const greenIndex = svg.indexOf('#00FF00');
      expect(redIndex).toBeLessThan(greenIndex);
    });

    it('should include corner radius for rectangles', () => {
      const shapes: CanvasShape[] = [createRectangle({ cornerRadius: 10 })];
      const svg = shapesToSVG(shapes);

      expect(svg).toContain('rx="10"');
      expect(svg).toContain('ry="10"');
    });

    it('should accept custom dimensions', () => {
      const shapes: CanvasShape[] = [createRectangle()];
      const svg = shapesToSVG(shapes, { width: 800, height: 600 });

      expect(svg).toContain('width="800"');
      expect(svg).toContain('height="600"');
    });

    it('should accept custom background color', () => {
      const shapes: CanvasShape[] = [createRectangle()];
      const svg = shapesToSVG(shapes, { background: '#f0f0f0' });

      expect(svg).toContain('fill="#f0f0f0"');
    });
  });

  describe('exportToJSON', () => {
    it('should export shapes with metadata', () => {
      const shapes: Record<string, CanvasShape> = {
        'shape-1': createRectangle({ id: 'shape-1' }),
        'shape-2': createRectangle({ id: 'shape-2' }),
      };

      const json = exportToJSON(shapes, 'canvas-123', { name: 'My Canvas' });
      const parsed = JSON.parse(json);

      expect(parsed.version).toBe('1.0');
      expect(parsed.canvasId).toBe('canvas-123');
      expect(parsed.metadata.name).toBe('My Canvas');
      expect(parsed.shapes).toHaveLength(2);
      expect(parsed.shapeCount).toBe(2);
      expect(parsed.exportedAt).toBeDefined();
    });

    it('should handle empty canvas', () => {
      const json = exportToJSON({}, 'canvas-empty');
      const parsed = JSON.parse(json);

      expect(parsed.shapes).toHaveLength(0);
      expect(parsed.shapeCount).toBe(0);
    });

    it('should preserve all shape properties', () => {
      const shapes: Record<string, CanvasShape> = {
        'shape-1': createRectangle({
          id: 'shape-1',
          name: 'My Rectangle',
          fill: '#FFFF00',
          rotation: 45,
        }),
      };

      const json = exportToJSON(shapes, 'canvas-123');
      const parsed = JSON.parse(json);
      const exportedShape = parsed.shapes[0];

      expect(exportedShape.id).toBe('shape-1');
      expect(exportedShape.name).toBe('My Rectangle');
      expect(exportedShape.fill).toBe('#FFFF00');
      expect(exportedShape.rotation).toBe(45);
    });

    it('should include timestamp', () => {
      const before = new Date().toISOString();
      const json = exportToJSON({}, 'canvas-123');
      const after = new Date().toISOString();
      const parsed = JSON.parse(json);

      expect(parsed.exportedAt >= before).toBe(true);
      expect(parsed.exportedAt <= after).toBe(true);
    });
  });
});
