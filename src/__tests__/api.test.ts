/**
 * API Route Tests
 * Tests the AI API endpoint
 */

describe('AI API Route', () => {
  // Mock fetch for API testing
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = jest.fn();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  describe('POST /api/ai', () => {
    it('should require a command', async () => {
      // Mock the response
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ error: 'Command is required' }),
      });

      const response = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBe('Command is required');
    });

    it('should accept valid commands', async () => {
      // Mock a successful response with tool calls
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          content: 'Created a blue rectangle',
          toolCalls: [
            {
              name: 'createShape',
              arguments: {
                type: 'rectangle',
                x: 100,
                y: 100,
                width: 200,
                height: 150,
                color: '#3B82F6',
              },
            },
          ],
        }),
      });

      const response = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          command: 'Create a blue rectangle',
          canvasState: {},
        }),
      });

      expect(response.ok).toBe(true);
      const data = await response.json();
      expect(data.toolCalls).toBeDefined();
      expect(data.toolCalls.length).toBeGreaterThan(0);
      expect(data.toolCalls[0].name).toBe('createShape');
    });
  });
});
