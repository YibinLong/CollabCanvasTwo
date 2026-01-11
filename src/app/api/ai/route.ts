import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || 'YOUR_OPENAI_API_KEY_HERE',
});

// Canvas action tools for AI
const canvasTools: OpenAI.ChatCompletionTool[] = [
  {
    type: 'function',
    function: {
      name: 'createShape',
      description: 'Create a new shape on the canvas',
      parameters: {
        type: 'object',
        properties: {
          type: {
            type: 'string',
            enum: ['rectangle', 'circle', 'triangle', 'star', 'line'],
            description: 'Type of shape to create',
          },
          x: { type: 'number', description: 'X position on the canvas' },
          y: { type: 'number', description: 'Y position on the canvas' },
          width: { type: 'number', description: 'Width of the shape' },
          height: { type: 'number', description: 'Height of the shape' },
          color: { type: 'string', description: 'Fill color (hex format)' },
          name: { type: 'string', description: 'Optional name for the shape' },
        },
        required: ['type', 'x', 'y', 'width', 'height'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'createText',
      description: 'Create a text element on the canvas',
      parameters: {
        type: 'object',
        properties: {
          text: { type: 'string', description: 'The text content' },
          x: { type: 'number', description: 'X position' },
          y: { type: 'number', description: 'Y position' },
          fontSize: { type: 'number', description: 'Font size in pixels' },
          color: { type: 'string', description: 'Text color (hex)' },
        },
        required: ['text', 'x', 'y'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'moveShape',
      description: 'Move a shape to a new position',
      parameters: {
        type: 'object',
        properties: {
          shapeId: { type: 'string', description: 'ID or name of the shape to move' },
          x: { type: 'number', description: 'New X position' },
          y: { type: 'number', description: 'New Y position' },
        },
        required: ['shapeId', 'x', 'y'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'resizeShape',
      description: 'Resize a shape',
      parameters: {
        type: 'object',
        properties: {
          shapeId: { type: 'string', description: 'ID or name of the shape' },
          width: { type: 'number', description: 'New width' },
          height: { type: 'number', description: 'New height' },
        },
        required: ['shapeId', 'width', 'height'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'rotateShape',
      description: 'Rotate a shape',
      parameters: {
        type: 'object',
        properties: {
          shapeId: { type: 'string', description: 'ID or name of the shape' },
          degrees: { type: 'number', description: 'Rotation in degrees' },
        },
        required: ['shapeId', 'degrees'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'changeShapeColor',
      description: 'Change the fill color of a shape',
      parameters: {
        type: 'object',
        properties: {
          shapeId: { type: 'string', description: 'ID or name of the shape' },
          color: { type: 'string', description: 'New color (hex)' },
        },
        required: ['shapeId', 'color'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'deleteShape',
      description: 'Delete a shape',
      parameters: {
        type: 'object',
        properties: {
          shapeId: { type: 'string', description: 'ID or name of the shape' },
        },
        required: ['shapeId'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'arrangeInGrid',
      description: 'Create a grid of shapes',
      parameters: {
        type: 'object',
        properties: {
          rows: { type: 'number', description: 'Number of rows' },
          columns: { type: 'number', description: 'Number of columns' },
          shapeType: { type: 'string', enum: ['rectangle', 'circle', 'triangle', 'star'] },
          startX: { type: 'number' },
          startY: { type: 'number' },
          shapeSize: { type: 'number' },
          gap: { type: 'number' },
          color: { type: 'string' },
        },
        required: ['rows', 'columns', 'shapeType'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'arrangeInRow',
      description: 'Arrange shapes in a horizontal row',
      parameters: {
        type: 'object',
        properties: {
          shapeIds: { type: 'array', items: { type: 'string' } },
          startX: { type: 'number' },
          y: { type: 'number' },
          gap: { type: 'number' },
        },
        required: ['shapeIds'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'createLoginForm',
      description: 'Create a login form with username, password, and submit button',
      parameters: {
        type: 'object',
        properties: {
          x: { type: 'number' },
          y: { type: 'number' },
        },
        required: [],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'createNavbar',
      description: 'Create a navigation bar',
      parameters: {
        type: 'object',
        properties: {
          items: { type: 'array', items: { type: 'string' } },
          x: { type: 'number' },
          y: { type: 'number' },
        },
        required: ['items'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'createCard',
      description: 'Create a card component',
      parameters: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          description: { type: 'string' },
          x: { type: 'number' },
          y: { type: 'number' },
        },
        required: ['title'],
      },
    },
  },
];

export async function POST(request: NextRequest) {
  try {
    const { command, canvasState } = await request.json();

    if (!command) {
      return NextResponse.json({ error: 'Command is required' }, { status: 400 });
    }

    const shapeSummary = canvasState
      ? Object.values(canvasState as Record<string, { name: string; type: string; x: number; y: number }>)
          .map((s) => `${s.name} (${s.type}) at (${Math.round(s.x)}, ${Math.round(s.y)})`)
          .join(', ')
      : 'empty';

    const messages: OpenAI.ChatCompletionMessageParam[] = [
      {
        role: 'system',
        content: `You are an AI assistant that helps users create and manipulate shapes on a collaborative canvas.
You have access to tools to create shapes, text, and complex components.
Current canvas state: ${shapeSummary}

Guidelines:
- Use reasonable default positions (x: 200-400, y: 200-400) if not specified
- Use appealing colors (blues, greens, etc.) as defaults
- For complex commands like "create a login form", use the specialized functions
- Explain what you did after executing commands`,
      },
      {
        role: 'user',
        content: command,
      },
    ];

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages,
      tools: canvasTools,
      tool_choice: 'auto',
    });

    const message = response.choices[0].message;

    return NextResponse.json({
      content: message.content,
      toolCalls: message.tool_calls?.filter((tc) => tc.type === 'function').map((tc) => ({
        name: (tc as OpenAI.ChatCompletionMessageToolCall & { function: { name: string; arguments: string } }).function.name,
        arguments: JSON.parse((tc as OpenAI.ChatCompletionMessageToolCall & { function: { name: string; arguments: string } }).function.arguments),
      })),
    });
  } catch (error: unknown) {
    console.error('AI API error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to process AI command';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
