import { getShapeBounds, calculateSnapGuides } from '@/lib/smartGuidesUtils';

describe('SmartGuides', () => {
  describe('getShapeBounds', () => {
    it('should calculate bounds correctly', () => {
      const shape = {
        id: 'shape-1',
        x: 100,
        y: 200,
        width: 50,
        height: 30,
        scaleX: 1,
        scaleY: 1,
      };

      const bounds = getShapeBounds(shape);

      expect(bounds.id).toBe('shape-1');
      expect(bounds.x).toBe(100);
      expect(bounds.y).toBe(200);
      expect(bounds.width).toBe(50);
      expect(bounds.height).toBe(30);
      expect(bounds.centerX).toBe(125);
      expect(bounds.centerY).toBe(215);
      expect(bounds.right).toBe(150);
      expect(bounds.bottom).toBe(230);
    });

    it('should account for scale', () => {
      const shape = {
        id: 'shape-1',
        x: 100,
        y: 200,
        width: 50,
        height: 30,
        scaleX: 2,
        scaleY: 1.5,
      };

      const bounds = getShapeBounds(shape);

      expect(bounds.width).toBe(100); // 50 * 2
      expect(bounds.height).toBe(45); // 30 * 1.5
      expect(bounds.right).toBe(200); // 100 + 100
      expect(bounds.bottom).toBe(245); // 200 + 45
    });
  });

  describe('calculateSnapGuides', () => {
    const createBounds = (
      id: string,
      x: number,
      y: number,
      width: number,
      height: number
    ) => ({
      id,
      x,
      y,
      width,
      height,
      centerX: x + width / 2,
      centerY: y + height / 2,
      right: x + width,
      bottom: y + height,
    });

    it('should snap left edge to left edge', () => {
      const moving = createBounds('moving', 98, 200, 50, 50);
      const others = [createBounds('target', 100, 100, 50, 50)];

      const result = calculateSnapGuides(moving, others, 5);

      expect(result.guides).toHaveLength(1);
      expect(result.guides[0].type).toBe('vertical');
      expect(result.guides[0].position).toBe(100);
      expect(result.offsetX).toBe(2);
    });

    it('should snap right edge to right edge', () => {
      // Position moving so only right-right alignment is within threshold
      // Moving: left = 100, right = 150 | Target: left = 50, right = 148
      // Left diff: |100 - 50| = 50 (NOT within 5px)
      // Right diff: |150 - 148| = 2 (within 5px)
      const moving = createBounds('moving', 100, 200, 50, 50); // right = 150
      const others = [createBounds('target', 50, 100, 98, 50)]; // right = 148

      const result = calculateSnapGuides(moving, others, 5);

      expect(result.guides.some((g) => g.type === 'vertical' && g.position === 148)).toBe(true);
    });

    it('should snap top edge to top edge', () => {
      const moving = createBounds('moving', 200, 98, 50, 50);
      const others = [createBounds('target', 100, 100, 50, 50)];

      const result = calculateSnapGuides(moving, others, 5);

      expect(result.guides.some((g) => g.type === 'horizontal' && g.position === 100)).toBe(true);
    });

    it('should snap bottom edge to bottom edge', () => {
      // Position moving so only bottom-bottom alignment is within threshold
      // Moving: top = 100, bottom = 150 | Target: top = 50, bottom = 148
      // Top diff: |100 - 50| = 50 (NOT within 5px)
      // Bottom diff: |150 - 148| = 2 (within 5px)
      const moving = createBounds('moving', 200, 100, 50, 50); // bottom = 150
      const others = [createBounds('target', 100, 50, 50, 98)]; // bottom = 148

      const result = calculateSnapGuides(moving, others, 5);

      expect(result.guides.some((g) => g.type === 'horizontal' && g.position === 148)).toBe(true);
    });

    it('should snap center to center horizontally', () => {
      // Position shapes so centers are close but edges are not
      const moving = createBounds('moving', 175, 200, 50, 50); // centerX = 200, left = 175
      const others = [createBounds('target', 75, 100, 50, 50)]; // centerX = 100, left = 75

      const result = calculateSnapGuides(moving, others, 5);

      // Left edges: 175 vs 75 = 100 pixels (not within threshold)
      // Centers: 200 vs 100 = 100 pixels (not within threshold either)
      // Let's create a test where centers align but edges don't
      const moving2 = createBounds('moving2', 72, 200, 56, 50); // centerX = 100, left = 72
      const others2 = [createBounds('target2', 85, 100, 30, 50)]; // centerX = 100, left = 85

      const result2 = calculateSnapGuides(moving2, others2, 5);

      // Centers both at 100 (exact match), edges differ by more than threshold
      expect(result2.guides.some((g) => g.type === 'vertical' && g.position === 100)).toBe(true);
    });

    it('should snap center to center vertically', () => {
      // Position shapes so centers match but edges don't
      const moving = createBounds('moving', 200, 72, 50, 56); // centerY = 100, top = 72
      const others = [createBounds('target', 100, 85, 50, 30)]; // centerY = 100, top = 85

      const result = calculateSnapGuides(moving, others, 5);

      // Centers both at 100 (exact match), edges differ by more than threshold
      expect(result.guides.some((g) => g.type === 'horizontal' && g.position === 100)).toBe(true);
    });

    it('should not snap if distance exceeds threshold', () => {
      const moving = createBounds('moving', 90, 200, 50, 50); // left = 90
      const others = [createBounds('target', 100, 100, 50, 50)]; // left = 100

      const result = calculateSnapGuides(moving, others, 5);

      // 10 pixel difference, threshold is 5
      expect(result.guides).toHaveLength(0);
    });

    it('should skip self when calculating guides', () => {
      const moving = createBounds('shape-1', 100, 200, 50, 50);
      const others = [
        createBounds('shape-1', 100, 200, 50, 50), // Same shape
        createBounds('shape-2', 200, 100, 50, 50),
      ];

      const result = calculateSnapGuides(moving, others, 5);

      // Should not snap to itself
      expect(result.guides.every((g) => g.position !== 100 && g.position !== 200)).toBe(true);
    });

    it('should generate multiple guides for multiple alignments', () => {
      const moving = createBounds('moving', 100, 100, 50, 50);
      const others = [
        createBounds('target1', 100, 200, 50, 50), // Same x
        createBounds('target2', 200, 100, 50, 50), // Same y
      ];

      const result = calculateSnapGuides(moving, others, 5);

      // Should have guides for both x and y alignment
      expect(result.guides.length).toBeGreaterThanOrEqual(2);
    });

    it('should provide correct snap position', () => {
      const moving = createBounds('moving', 97, 97, 50, 50);
      const others = [createBounds('target', 100, 100, 50, 50)];

      const result = calculateSnapGuides(moving, others, 5);

      expect(result.snapX).toBe(100);
      expect(result.snapY).toBe(100);
    });

    it('should handle empty others array', () => {
      const moving = createBounds('moving', 100, 100, 50, 50);

      const result = calculateSnapGuides(moving, [], 5);

      expect(result.guides).toHaveLength(0);
      expect(result.snapX).toBeNull();
      expect(result.snapY).toBeNull();
    });

    it('should snap left to right edge', () => {
      const moving = createBounds('moving', 148, 200, 50, 50); // left = 148
      const others = [createBounds('target', 50, 100, 100, 50)]; // right = 150

      const result = calculateSnapGuides(moving, others, 5);

      expect(result.guides.some((g) => g.type === 'vertical' && g.position === 150)).toBe(true);
    });

    it('should snap right to left edge', () => {
      const moving = createBounds('moving', 48, 200, 50, 50); // right = 98
      const others = [createBounds('target', 100, 100, 50, 50)]; // left = 100

      const result = calculateSnapGuides(moving, others, 5);

      expect(result.guides.some((g) => g.type === 'vertical' && g.position === 100)).toBe(true);
    });
  });
});
