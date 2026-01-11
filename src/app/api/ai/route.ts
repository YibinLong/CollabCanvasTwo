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
      name: 'arrangeInColumn',
      description: 'Arrange shapes in a vertical column',
      parameters: {
        type: 'object',
        properties: {
          shapeIds: { type: 'array', items: { type: 'string' } },
          x: { type: 'number' },
          startY: { type: 'number' },
          gap: { type: 'number' },
        },
        required: ['shapeIds'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'spaceEvenly',
      description: 'Space selected shapes evenly between the first and last shape',
      parameters: {
        type: 'object',
        properties: {
          shapeIds: { type: 'array', items: { type: 'string' } },
          direction: { type: 'string', enum: ['horizontal', 'vertical'] },
        },
        required: ['shapeIds', 'direction'],
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
  {
    type: 'function',
    function: {
      name: 'scaleShape',
      description: 'Scale a shape by a factor',
      parameters: {
        type: 'object',
        properties: {
          shapeId: { type: 'string', description: 'ID or name of the shape' },
          scaleX: { type: 'number', description: 'Horizontal scale factor (1 = 100%)' },
          scaleY: { type: 'number', description: 'Vertical scale factor (1 = 100%)' },
        },
        required: ['shapeId', 'scaleX', 'scaleY'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'duplicateShape',
      description: 'Create a copy of a shape with an optional offset',
      parameters: {
        type: 'object',
        properties: {
          shapeId: { type: 'string', description: 'ID or name of the shape to duplicate' },
          offsetX: { type: 'number', description: 'X offset for the duplicate (default 20)' },
          offsetY: { type: 'number', description: 'Y offset for the duplicate (default 20)' },
        },
        required: ['shapeId'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'clearCanvas',
      description: 'Remove all shapes from the canvas',
      parameters: {
        type: 'object',
        properties: {},
        required: [],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'changeOpacity',
      description: 'Change the opacity of a shape',
      parameters: {
        type: 'object',
        properties: {
          shapeId: { type: 'string', description: 'ID or name of the shape' },
          opacity: { type: 'number', description: 'Opacity value from 0 to 1' },
        },
        required: ['shapeId', 'opacity'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'changeStroke',
      description: 'Change the stroke color and width of a shape',
      parameters: {
        type: 'object',
        properties: {
          shapeId: { type: 'string', description: 'ID or name of the shape' },
          strokeColor: { type: 'string', description: 'Stroke color (hex)' },
          strokeWidth: { type: 'number', description: 'Stroke width in pixels' },
        },
        required: ['shapeId'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'listShapes',
      description: 'List all shapes on the canvas with their properties',
      parameters: {
        type: 'object',
        properties: {},
        required: [],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'alignShapes',
      description: 'Align multiple shapes to a specified edge or center',
      parameters: {
        type: 'object',
        properties: {
          shapeIds: { type: 'array', items: { type: 'string' }, description: 'IDs or names of shapes to align' },
          alignment: { type: 'string', enum: ['left', 'right', 'top', 'bottom', 'centerH', 'centerV'], description: 'Alignment direction' },
        },
        required: ['shapeIds', 'alignment'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'distributeShapes',
      description: 'Distribute shapes evenly in horizontal or vertical direction',
      parameters: {
        type: 'object',
        properties: {
          shapeIds: { type: 'array', items: { type: 'string' }, description: 'IDs or names of shapes to distribute' },
          direction: { type: 'string', enum: ['horizontal', 'vertical'], description: 'Distribution direction' },
        },
        required: ['shapeIds', 'direction'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'createButton',
      description: 'Create a styled button component',
      parameters: {
        type: 'object',
        properties: {
          text: { type: 'string', description: 'Button text' },
          x: { type: 'number', description: 'X position' },
          y: { type: 'number', description: 'Y position' },
          variant: { type: 'string', enum: ['primary', 'secondary', 'outline', 'danger'], description: 'Button style variant' },
        },
        required: ['text'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'getCanvasState',
      description: 'Get the current state of all shapes on the canvas with their properties',
      parameters: {
        type: 'object',
        properties: {},
        required: [],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'changeBlendMode',
      description: 'Change the blend mode of a shape',
      parameters: {
        type: 'object',
        properties: {
          shapeId: { type: 'string', description: 'ID or name of the shape' },
          blendMode: {
            type: 'string',
            enum: ['normal', 'multiply', 'screen', 'overlay', 'darken', 'lighten', 'color-dodge', 'color-burn', 'hard-light', 'soft-light', 'difference', 'exclusion'],
            description: 'Blend mode to apply',
          },
        },
        required: ['shapeId', 'blendMode'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'createFrame',
      description: 'Create a frame/artboard to organize shapes',
      parameters: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Name of the frame' },
          x: { type: 'number', description: 'X position' },
          y: { type: 'number', description: 'Y position' },
          width: { type: 'number', description: 'Width of the frame' },
          height: { type: 'number', description: 'Height of the frame' },
        },
        required: [],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'createSignupForm',
      description: 'Create a signup/registration form with name, email, password fields and submit button',
      parameters: {
        type: 'object',
        properties: {
          x: { type: 'number', description: 'X position' },
          y: { type: 'number', description: 'Y position' },
        },
        required: [],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'createProfileCard',
      description: 'Create a user profile card with avatar, name, and description',
      parameters: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'User name to display' },
          title: { type: 'string', description: 'User title or role' },
          x: { type: 'number', description: 'X position' },
          y: { type: 'number', description: 'Y position' },
        },
        required: ['name'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'createSearchBar',
      description: 'Create a search input with icon and button',
      parameters: {
        type: 'object',
        properties: {
          placeholder: { type: 'string', description: 'Placeholder text' },
          x: { type: 'number', description: 'X position' },
          y: { type: 'number', description: 'Y position' },
          width: { type: 'number', description: 'Width of the search bar' },
        },
        required: [],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'createFooter',
      description: 'Create a page footer with links and copyright',
      parameters: {
        type: 'object',
        properties: {
          links: { type: 'array', items: { type: 'string' }, description: 'Footer link names' },
          copyright: { type: 'string', description: 'Copyright text' },
          x: { type: 'number', description: 'X position' },
          y: { type: 'number', description: 'Y position' },
        },
        required: [],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'createHeroSection',
      description: 'Create a hero section with headline, subtext, and CTA button',
      parameters: {
        type: 'object',
        properties: {
          headline: { type: 'string', description: 'Main headline text' },
          subtext: { type: 'string', description: 'Supporting text' },
          ctaText: { type: 'string', description: 'Call-to-action button text' },
          x: { type: 'number', description: 'X position' },
          y: { type: 'number', description: 'Y position' },
        },
        required: ['headline'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'centerShape',
      description: 'Move a shape to the center of the canvas',
      parameters: {
        type: 'object',
        properties: {
          shapeId: { type: 'string', description: 'ID or name of the shape to center' },
        },
        required: ['shapeId'],
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
