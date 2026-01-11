import OpenAI from 'openai';
import { nanoid } from 'nanoid';
import type { CanvasShape, TextShape } from '@/types/canvas';

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
          x: {
            type: 'number',
            description: 'X position on the canvas',
          },
          y: {
            type: 'number',
            description: 'Y position on the canvas',
          },
          width: {
            type: 'number',
            description: 'Width of the shape',
          },
          height: {
            type: 'number',
            description: 'Height of the shape',
          },
          color: {
            type: 'string',
            description: 'Fill color of the shape (hex format like #FF0000)',
          },
          name: {
            type: 'string',
            description: 'Optional name for the shape',
          },
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
          text: {
            type: 'string',
            description: 'The text content',
          },
          x: {
            type: 'number',
            description: 'X position on the canvas',
          },
          y: {
            type: 'number',
            description: 'Y position on the canvas',
          },
          fontSize: {
            type: 'number',
            description: 'Font size in pixels',
          },
          color: {
            type: 'string',
            description: 'Text color (hex format)',
          },
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
          shapeId: {
            type: 'string',
            description: 'ID of the shape to move',
          },
          x: {
            type: 'number',
            description: 'New X position',
          },
          y: {
            type: 'number',
            description: 'New Y position',
          },
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
          shapeId: {
            type: 'string',
            description: 'ID of the shape to resize',
          },
          width: {
            type: 'number',
            description: 'New width',
          },
          height: {
            type: 'number',
            description: 'New height',
          },
        },
        required: ['shapeId', 'width', 'height'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'rotateShape',
      description: 'Rotate a shape by a specified number of degrees',
      parameters: {
        type: 'object',
        properties: {
          shapeId: {
            type: 'string',
            description: 'ID of the shape to rotate',
          },
          degrees: {
            type: 'number',
            description: 'Rotation in degrees',
          },
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
          shapeId: {
            type: 'string',
            description: 'ID of the shape to modify',
          },
          color: {
            type: 'string',
            description: 'New color (hex format)',
          },
        },
        required: ['shapeId', 'color'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'deleteShape',
      description: 'Delete a shape from the canvas',
      parameters: {
        type: 'object',
        properties: {
          shapeId: {
            type: 'string',
            description: 'ID of the shape to delete',
          },
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
          rows: {
            type: 'number',
            description: 'Number of rows',
          },
          columns: {
            type: 'number',
            description: 'Number of columns',
          },
          shapeType: {
            type: 'string',
            enum: ['rectangle', 'circle', 'triangle', 'star'],
            description: 'Type of shapes to create',
          },
          startX: {
            type: 'number',
            description: 'Starting X position',
          },
          startY: {
            type: 'number',
            description: 'Starting Y position',
          },
          shapeSize: {
            type: 'number',
            description: 'Size of each shape',
          },
          gap: {
            type: 'number',
            description: 'Gap between shapes',
          },
          color: {
            type: 'string',
            description: 'Color of the shapes',
          },
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
          shapeIds: {
            type: 'array',
            items: { type: 'string' },
            description: 'IDs of shapes to arrange',
          },
          startX: {
            type: 'number',
            description: 'Starting X position',
          },
          y: {
            type: 'number',
            description: 'Y position for the row',
          },
          gap: {
            type: 'number',
            description: 'Gap between shapes',
          },
        },
        required: ['shapeIds'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'createLoginForm',
      description: 'Create a login form with username field, password field, and submit button',
      parameters: {
        type: 'object',
        properties: {
          x: {
            type: 'number',
            description: 'X position of the form',
          },
          y: {
            type: 'number',
            description: 'Y position of the form',
          },
        },
        required: [],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'createNavbar',
      description: 'Create a navigation bar with menu items',
      parameters: {
        type: 'object',
        properties: {
          items: {
            type: 'array',
            items: { type: 'string' },
            description: 'Menu item labels',
          },
          x: {
            type: 'number',
            description: 'X position',
          },
          y: {
            type: 'number',
            description: 'Y position',
          },
        },
        required: ['items'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'createCard',
      description: 'Create a card component with title and optional description',
      parameters: {
        type: 'object',
        properties: {
          title: {
            type: 'string',
            description: 'Card title',
          },
          description: {
            type: 'string',
            description: 'Card description',
          },
          x: {
            type: 'number',
            description: 'X position',
          },
          y: {
            type: 'number',
            description: 'Y position',
          },
        },
        required: ['title'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'getCanvasState',
      description: 'Get the current state of all shapes on the canvas for context',
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
      name: 'arrangeInColumn',
      description: 'Arrange shapes in a vertical column',
      parameters: {
        type: 'object',
        properties: {
          shapeIds: {
            type: 'array',
            items: { type: 'string' },
            description: 'IDs or names of shapes to arrange',
          },
          x: {
            type: 'number',
            description: 'X position for the column',
          },
          startY: {
            type: 'number',
            description: 'Starting Y position',
          },
          gap: {
            type: 'number',
            description: 'Gap between shapes',
          },
        },
        required: ['shapeIds'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'spaceEvenly',
      description: 'Space shapes evenly in a horizontal or vertical direction',
      parameters: {
        type: 'object',
        properties: {
          shapeIds: {
            type: 'array',
            items: { type: 'string' },
            description: 'IDs or names of shapes to space',
          },
          direction: {
            type: 'string',
            enum: ['horizontal', 'vertical'],
            description: 'Direction to space shapes',
          },
        },
        required: ['shapeIds', 'direction'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'scaleShape',
      description: 'Scale a shape by a multiplier',
      parameters: {
        type: 'object',
        properties: {
          shapeId: {
            type: 'string',
            description: 'ID or name of the shape to scale',
          },
          scale: {
            type: 'number',
            description: 'Scale multiplier (e.g., 2 for twice as big, 0.5 for half)',
          },
        },
        required: ['shapeId', 'scale'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'duplicateShape',
      description: 'Duplicate a shape with an offset',
      parameters: {
        type: 'object',
        properties: {
          shapeId: {
            type: 'string',
            description: 'ID or name of the shape to duplicate',
          },
          offsetX: {
            type: 'number',
            description: 'X offset for the duplicate',
          },
          offsetY: {
            type: 'number',
            description: 'Y offset for the duplicate',
          },
        },
        required: ['shapeId'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'alignShapes',
      description: 'Align multiple shapes to a common edge or center',
      parameters: {
        type: 'object',
        properties: {
          shapeIds: {
            type: 'array',
            items: { type: 'string' },
            description: 'IDs or names of shapes to align',
          },
          alignment: {
            type: 'string',
            enum: ['left', 'right', 'center', 'top', 'bottom', 'middle'],
            description: 'Alignment direction',
          },
        },
        required: ['shapeIds', 'alignment'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'distributeShapes',
      description: 'Distribute shapes evenly with equal spacing',
      parameters: {
        type: 'object',
        properties: {
          shapeIds: {
            type: 'array',
            items: { type: 'string' },
            description: 'IDs or names of shapes to distribute',
          },
          direction: {
            type: 'string',
            enum: ['horizontal', 'vertical'],
            description: 'Distribution direction',
          },
        },
        required: ['shapeIds', 'direction'],
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
          shapeId: {
            type: 'string',
            description: 'ID or name of the shape',
          },
          opacity: {
            type: 'number',
            description: 'Opacity value from 0 (transparent) to 1 (opaque)',
          },
        },
        required: ['shapeId', 'opacity'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'changeStroke',
      description: 'Change the stroke (border) of a shape',
      parameters: {
        type: 'object',
        properties: {
          shapeId: {
            type: 'string',
            description: 'ID or name of the shape',
          },
          strokeColor: {
            type: 'string',
            description: 'Stroke color (hex format)',
          },
          strokeWidth: {
            type: 'number',
            description: 'Stroke width in pixels',
          },
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
      name: 'createButton',
      description: 'Create a styled button component',
      parameters: {
        type: 'object',
        properties: {
          text: {
            type: 'string',
            description: 'Button text',
          },
          x: {
            type: 'number',
            description: 'X position',
          },
          y: {
            type: 'number',
            description: 'Y position',
          },
          style: {
            type: 'string',
            enum: ['primary', 'secondary', 'danger', 'success'],
            description: 'Button style variant',
          },
        },
        required: ['text'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'createFrame',
      description: 'Create a frame/artboard for organizing designs',
      parameters: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            description: 'Frame name',
          },
          x: {
            type: 'number',
            description: 'X position',
          },
          y: {
            type: 'number',
            description: 'Y position',
          },
          width: {
            type: 'number',
            description: 'Frame width',
          },
          height: {
            type: 'number',
            description: 'Frame height',
          },
        },
        required: ['name'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'changeBlendMode',
      description: 'Change the blend mode of a shape for visual effects',
      parameters: {
        type: 'object',
        properties: {
          shapeId: {
            type: 'string',
            description: 'ID or name of the shape',
          },
          blendMode: {
            type: 'string',
            enum: ['normal', 'multiply', 'screen', 'overlay', 'darken', 'lighten', 'color-dodge', 'color-burn', 'hard-light', 'soft-light', 'difference', 'exclusion', 'hue', 'saturation', 'color', 'luminosity'],
            description: 'The blend mode to apply',
          },
        },
        required: ['shapeId', 'blendMode'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'listShapes',
      description: 'List all shapes currently on the canvas with their details',
      parameters: {
        type: 'object',
        properties: {},
        required: [],
      },
    },
  },
];

export interface AIAgentConfig {
  apiKey: string;
  shapes: Record<string, CanvasShape>;
  userId: string;
  onAddShape: (shape: CanvasShape) => void;
  onUpdateShape: (id: string, updates: Partial<CanvasShape>) => void;
  onDeleteShape: (id: string) => void;
}

export class AICanvasAgent {
  private openai: OpenAI;
  private shapes: Record<string, CanvasShape>;
  private userId: string;
  private onAddShape: (shape: CanvasShape) => void;
  private onUpdateShape: (id: string, updates: Partial<CanvasShape>) => void;
  private onDeleteShape: (id: string) => void;

  constructor(config: AIAgentConfig) {
    this.openai = new OpenAI({
      apiKey: config.apiKey,
      dangerouslyAllowBrowser: true,
    });
    this.shapes = config.shapes;
    this.userId = config.userId;
    this.onAddShape = config.onAddShape;
    this.onUpdateShape = config.onUpdateShape;
    this.onDeleteShape = config.onDeleteShape;
  }

  updateShapes(shapes: Record<string, CanvasShape>) {
    this.shapes = shapes;
  }

  async processCommand(command: string): Promise<string> {
    try {
      const messages: OpenAI.ChatCompletionMessageParam[] = [
        {
          role: 'system',
          content: `You are an AI assistant that helps users create and manipulate shapes on a collaborative canvas.
You have access to tools to create shapes, text, and complex components like forms and navigation bars.
When creating shapes, use reasonable default positions (around x:200-400, y:200-400) if not specified.
Default colors should be visually appealing (blues, greens, etc.).
For complex commands like "create a login form", use the specialized functions.
Always explain what you did after executing commands.`,
        },
        {
          role: 'user',
          content: command,
        },
      ];

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o',
        messages,
        tools: canvasTools,
        tool_choice: 'auto',
      });

      const message = response.choices[0].message;

      // If no tool calls, return the text response
      if (!message.tool_calls || message.tool_calls.length === 0) {
        return message.content || 'I understood your request, but I\'m not sure how to help with that.';
      }

      // Process tool calls
      const results: string[] = [];
      for (const toolCall of message.tool_calls) {
        const result = await this.executeToolCall(toolCall);
        results.push(result);
      }

      return results.join('\n');
    } catch (error: unknown) {
      console.error('AI Agent error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to process command: ${errorMessage}`);
    }
  }

  private async executeToolCall(
    toolCall: OpenAI.ChatCompletionMessageToolCall
  ): Promise<string> {
    // Handle function type tool calls
    if (toolCall.type !== 'function') {
      return `Unsupported tool call type: ${toolCall.type}`;
    }
    const funcCall = toolCall as OpenAI.ChatCompletionMessageToolCall & { function: { name: string; arguments: string } };
    const { name, arguments: argsString } = funcCall.function;
    const args = JSON.parse(argsString);

    switch (name) {
      case 'createShape':
        return this.createShape(args);
      case 'createText':
        return this.createText(args);
      case 'moveShape':
        return this.moveShape(args);
      case 'resizeShape':
        return this.resizeShape(args);
      case 'rotateShape':
        return this.rotateShape(args);
      case 'changeShapeColor':
        return this.changeShapeColor(args);
      case 'deleteShape':
        return this.deleteShapeById(args);
      case 'arrangeInGrid':
        return this.arrangeInGrid(args);
      case 'arrangeInRow':
        return this.arrangeInRow(args);
      case 'createLoginForm':
        return this.createLoginForm(args);
      case 'createNavbar':
        return this.createNavbar(args);
      case 'createCard':
        return this.createCard(args);
      case 'getCanvasState':
        return this.getCanvasState();
      case 'arrangeInColumn':
        return this.arrangeInColumn(args);
      case 'spaceEvenly':
        return this.spaceEvenly(args);
      case 'scaleShape':
        return this.scaleShape(args);
      case 'duplicateShape':
        return this.duplicateShapeByAI(args);
      case 'alignShapes':
        return this.alignShapes(args);
      case 'distributeShapes':
        return this.distributeShapes(args);
      case 'changeOpacity':
        return this.changeOpacity(args);
      case 'changeStroke':
        return this.changeStroke(args);
      case 'clearCanvas':
        return this.clearCanvas();
      case 'createButton':
        return this.createButton(args);
      case 'createFrame':
        return this.createFrame(args);
      case 'changeBlendMode':
        return this.changeBlendMode(args);
      case 'listShapes':
        return this.listShapes();
      default:
        return `Unknown tool: ${name}`;
    }
  }

  private createBaseShape(type: string, overrides: Partial<CanvasShape> = {}): CanvasShape {
    const base = {
      id: nanoid(),
      x: 200,
      y: 200,
      width: 100,
      height: 100,
      rotation: 0,
      scaleX: 1,
      scaleY: 1,
      fill: '#3B82F6',
      stroke: '#1E40AF',
      strokeWidth: 2,
      opacity: 1,
      visible: true,
      locked: false,
      name: type.charAt(0).toUpperCase() + type.slice(1),
      zIndex: Object.keys(this.shapes).length,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      createdBy: this.userId,
      lastEditedBy: this.userId,
    };

    return { ...base, type, ...overrides } as CanvasShape;
  }

  private createShape(args: {
    type: string;
    x: number;
    y: number;
    width: number;
    height: number;
    color?: string;
    name?: string;
  }): string {
    const shape = this.createBaseShape(args.type, {
      x: args.x,
      y: args.y,
      width: args.width,
      height: args.height,
      fill: args.color || '#3B82F6',
      name: args.name || `${args.type.charAt(0).toUpperCase() + args.type.slice(1)}`,
    });

    this.onAddShape(shape);
    return `Created a ${args.type} at position (${args.x}, ${args.y}) with size ${args.width}x${args.height}.`;
  }

  private createText(args: {
    text: string;
    x: number;
    y: number;
    fontSize?: number;
    color?: string;
  }): string {
    const shape = this.createBaseShape('text', {
      x: args.x,
      y: args.y,
      width: 200,
      height: 50,
      fill: args.color || '#1F2937',
      stroke: 'transparent',
      strokeWidth: 0,
      name: 'Text',
    }) as TextShape;

    shape.text = args.text;
    shape.fontSize = args.fontSize || 24;
    shape.fontFamily = 'Arial';
    shape.fontStyle = 'normal';
    shape.textAlign = 'left';
    shape.textDecoration = 'none';

    this.onAddShape(shape);
    return `Created text "${args.text}" at position (${args.x}, ${args.y}).`;
  }

  private moveShape(args: { shapeId: string; x: number; y: number }): string {
    const shape = this.findShapeByIdOrName(args.shapeId);
    if (!shape) {
      return `Could not find shape with ID or name "${args.shapeId}".`;
    }
    this.onUpdateShape(shape.id, { x: args.x, y: args.y });
    return `Moved "${shape.name}" to position (${args.x}, ${args.y}).`;
  }

  private resizeShape(args: { shapeId: string; width: number; height: number }): string {
    const shape = this.findShapeByIdOrName(args.shapeId);
    if (!shape) {
      return `Could not find shape with ID or name "${args.shapeId}".`;
    }
    this.onUpdateShape(shape.id, { width: args.width, height: args.height });
    return `Resized "${shape.name}" to ${args.width}x${args.height}.`;
  }

  private rotateShape(args: { shapeId: string; degrees: number }): string {
    const shape = this.findShapeByIdOrName(args.shapeId);
    if (!shape) {
      return `Could not find shape with ID or name "${args.shapeId}".`;
    }
    this.onUpdateShape(shape.id, { rotation: args.degrees });
    return `Rotated "${shape.name}" by ${args.degrees} degrees.`;
  }

  private changeShapeColor(args: { shapeId: string; color: string }): string {
    const shape = this.findShapeByIdOrName(args.shapeId);
    if (!shape) {
      return `Could not find shape with ID or name "${args.shapeId}".`;
    }
    this.onUpdateShape(shape.id, { fill: args.color });
    return `Changed color of "${shape.name}" to ${args.color}.`;
  }

  private deleteShapeById(args: { shapeId: string }): string {
    const shape = this.findShapeByIdOrName(args.shapeId);
    if (!shape) {
      return `Could not find shape with ID or name "${args.shapeId}".`;
    }
    this.onDeleteShape(shape.id);
    return `Deleted "${shape.name}".`;
  }

  private arrangeInGrid(args: {
    rows: number;
    columns: number;
    shapeType: string;
    startX?: number;
    startY?: number;
    shapeSize?: number;
    gap?: number;
    color?: string;
  }): string {
    const startX = args.startX || 100;
    const startY = args.startY || 100;
    const size = args.shapeSize || 60;
    const gap = args.gap || 20;
    const color = args.color || '#3B82F6';

    for (let row = 0; row < args.rows; row++) {
      for (let col = 0; col < args.columns; col++) {
        const x = startX + col * (size + gap);
        const y = startY + row * (size + gap);

        const shape = this.createBaseShape(args.shapeType, {
          x,
          y,
          width: size,
          height: size,
          fill: color,
          name: `${args.shapeType} ${row * args.columns + col + 1}`,
        });

        this.onAddShape(shape);
      }
    }

    return `Created a ${args.rows}x${args.columns} grid of ${args.shapeType}s.`;
  }

  private arrangeInRow(args: {
    shapeIds: string[];
    startX?: number;
    y?: number;
    gap?: number;
  }): string {
    const startX = args.startX || 100;
    const y = args.y || 200;
    const gap = args.gap || 20;

    let currentX = startX;
    let count = 0;

    for (const id of args.shapeIds) {
      const shape = this.findShapeByIdOrName(id);
      if (shape) {
        this.onUpdateShape(shape.id, { x: currentX, y });
        currentX += shape.width + gap;
        count++;
      }
    }

    return `Arranged ${count} shapes in a horizontal row.`;
  }

  private createLoginForm(args: { x?: number; y?: number }): string {
    const x = args.x || 200;
    const y = args.y || 150;
    const width = 300;

    // Form background
    const formBg = this.createBaseShape('rectangle', {
      x: x - 20,
      y: y - 20,
      width: width + 40,
      height: 280,
      fill: '#FFFFFF',
      stroke: '#E5E7EB',
      strokeWidth: 1,
      name: 'Login Form Background',
      cornerRadius: 12,
    });
    this.onAddShape(formBg);

    // Title
    const title = this.createBaseShape('text', {
      x,
      y,
      width,
      height: 40,
      fill: '#1F2937',
      stroke: 'transparent',
      strokeWidth: 0,
      name: 'Login Title',
    }) as TextShape;
    title.text = 'Login';
    title.fontSize = 28;
    title.fontFamily = 'Arial';
    title.fontStyle = 'bold';
    title.textAlign = 'center';
    title.textDecoration = 'none';
    this.onAddShape(title);

    // Username label
    const usernameLabel = this.createBaseShape('text', {
      x,
      y: y + 50,
      width,
      height: 20,
      fill: '#4B5563',
      stroke: 'transparent',
      strokeWidth: 0,
      name: 'Username Label',
    }) as TextShape;
    usernameLabel.text = 'Username';
    usernameLabel.fontSize = 14;
    usernameLabel.fontFamily = 'Arial';
    usernameLabel.fontStyle = 'normal';
    usernameLabel.textAlign = 'left';
    usernameLabel.textDecoration = 'none';
    this.onAddShape(usernameLabel);

    // Username input
    const usernameInput = this.createBaseShape('rectangle', {
      x,
      y: y + 75,
      width,
      height: 40,
      fill: '#F9FAFB',
      stroke: '#D1D5DB',
      strokeWidth: 1,
      name: 'Username Input',
      cornerRadius: 6,
    });
    this.onAddShape(usernameInput);

    // Password label
    const passwordLabel = this.createBaseShape('text', {
      x,
      y: y + 130,
      width,
      height: 20,
      fill: '#4B5563',
      stroke: 'transparent',
      strokeWidth: 0,
      name: 'Password Label',
    }) as TextShape;
    passwordLabel.text = 'Password';
    passwordLabel.fontSize = 14;
    passwordLabel.fontFamily = 'Arial';
    passwordLabel.fontStyle = 'normal';
    passwordLabel.textAlign = 'left';
    passwordLabel.textDecoration = 'none';
    this.onAddShape(passwordLabel);

    // Password input
    const passwordInput = this.createBaseShape('rectangle', {
      x,
      y: y + 155,
      width,
      height: 40,
      fill: '#F9FAFB',
      stroke: '#D1D5DB',
      strokeWidth: 1,
      name: 'Password Input',
      cornerRadius: 6,
    });
    this.onAddShape(passwordInput);

    // Submit button
    const submitButton = this.createBaseShape('rectangle', {
      x,
      y: y + 210,
      width,
      height: 44,
      fill: '#3B82F6',
      stroke: '#2563EB',
      strokeWidth: 0,
      name: 'Submit Button',
      cornerRadius: 6,
    });
    this.onAddShape(submitButton);

    // Button text
    const buttonText = this.createBaseShape('text', {
      x,
      y: y + 220,
      width,
      height: 24,
      fill: '#FFFFFF',
      stroke: 'transparent',
      strokeWidth: 0,
      name: 'Button Text',
    }) as TextShape;
    buttonText.text = 'Sign In';
    buttonText.fontSize = 16;
    buttonText.fontFamily = 'Arial';
    buttonText.fontStyle = 'bold';
    buttonText.textAlign = 'center';
    buttonText.textDecoration = 'none';
    this.onAddShape(buttonText);

    return 'Created a login form with title, username field, password field, and submit button.';
  }

  private createNavbar(args: { items: string[]; x?: number; y?: number }): string {
    const x = args.x || 50;
    const y = args.y || 20;
    const itemWidth = 100;
    const height = 50;
    const gap = 10;

    // Navbar background
    const navBg = this.createBaseShape('rectangle', {
      x: x - 20,
      y: y - 10,
      width: args.items.length * (itemWidth + gap) + 30,
      height: height + 20,
      fill: '#1F2937',
      stroke: 'transparent',
      strokeWidth: 0,
      name: 'Navbar Background',
      cornerRadius: 8,
    });
    this.onAddShape(navBg);

    // Menu items
    args.items.forEach((item, index) => {
      const itemX = x + index * (itemWidth + gap);

      // Item background (hover state representation)
      const itemBg = this.createBaseShape('rectangle', {
        x: itemX,
        y,
        width: itemWidth,
        height: height,
        fill: index === 0 ? '#3B82F6' : 'transparent',
        stroke: 'transparent',
        strokeWidth: 0,
        name: `Nav Item Bg ${index + 1}`,
        cornerRadius: 6,
      });
      this.onAddShape(itemBg);

      // Item text
      const itemText = this.createBaseShape('text', {
        x: itemX,
        y: y + 15,
        width: itemWidth,
        height: 20,
        fill: '#FFFFFF',
        stroke: 'transparent',
        strokeWidth: 0,
        name: `Nav Item ${index + 1}`,
      }) as TextShape;
      itemText.text = item;
      itemText.fontSize = 14;
      itemText.fontFamily = 'Arial';
      itemText.fontStyle = 'normal';
      itemText.textAlign = 'center';
      itemText.textDecoration = 'none';
      this.onAddShape(itemText);
    });

    return `Created a navigation bar with ${args.items.length} menu items: ${args.items.join(', ')}.`;
  }

  private createCard(args: {
    title: string;
    description?: string;
    x?: number;
    y?: number;
  }): string {
    const x = args.x || 200;
    const y = args.y || 200;
    const width = 280;
    const height = args.description ? 180 : 120;

    // Card background
    const cardBg = this.createBaseShape('rectangle', {
      x,
      y,
      width,
      height,
      fill: '#FFFFFF',
      stroke: '#E5E7EB',
      strokeWidth: 1,
      name: 'Card Background',
      cornerRadius: 12,
    });
    this.onAddShape(cardBg);

    // Image placeholder
    const imagePlaceholder = this.createBaseShape('rectangle', {
      x: x + 16,
      y: y + 16,
      width: width - 32,
      height: 80,
      fill: '#F3F4F6',
      stroke: '#E5E7EB',
      strokeWidth: 1,
      name: 'Image Placeholder',
      cornerRadius: 8,
    });
    this.onAddShape(imagePlaceholder);

    // Title
    const titleText = this.createBaseShape('text', {
      x: x + 16,
      y: y + 110,
      width: width - 32,
      height: 24,
      fill: '#1F2937',
      stroke: 'transparent',
      strokeWidth: 0,
      name: 'Card Title',
    }) as TextShape;
    titleText.text = args.title;
    titleText.fontSize = 18;
    titleText.fontFamily = 'Arial';
    titleText.fontStyle = 'bold';
    titleText.textAlign = 'left';
    titleText.textDecoration = 'none';
    this.onAddShape(titleText);

    // Description (if provided)
    if (args.description) {
      const descText = this.createBaseShape('text', {
        x: x + 16,
        y: y + 140,
        width: width - 32,
        height: 40,
        fill: '#6B7280',
        stroke: 'transparent',
        strokeWidth: 0,
        name: 'Card Description',
      }) as TextShape;
      descText.text = args.description;
      descText.fontSize = 14;
      descText.fontFamily = 'Arial';
      descText.fontStyle = 'normal';
      descText.textAlign = 'left';
      descText.textDecoration = 'none';
      this.onAddShape(descText);
    }

    return `Created a card with title "${args.title}"${args.description ? ` and description "${args.description}"` : ''}.`;
  }

  private getCanvasState(): string {
    const shapeList = Object.values(this.shapes);
    if (shapeList.length === 0) {
      return 'The canvas is empty.';
    }

    const summary = shapeList.map((shape) => ({
      id: shape.id,
      name: shape.name,
      type: shape.type,
      position: `(${Math.round(shape.x)}, ${Math.round(shape.y)})`,
      size: `${Math.round(shape.width)}x${Math.round(shape.height)}`,
      color: shape.fill,
    }));

    return `Canvas has ${shapeList.length} shapes:\n${JSON.stringify(summary, null, 2)}`;
  }

  private findShapeByIdOrName(idOrName: string): CanvasShape | undefined {
    // Try exact ID match first
    if (this.shapes[idOrName]) {
      return this.shapes[idOrName];
    }

    // Try name match (case-insensitive)
    const lowerName = idOrName.toLowerCase();
    return Object.values(this.shapes).find(
      (shape) => shape.name.toLowerCase() === lowerName || shape.name.toLowerCase().includes(lowerName)
    );
  }

  private arrangeInColumn(args: {
    shapeIds: string[];
    x?: number;
    startY?: number;
    gap?: number;
  }): string {
    const x = args.x || 200;
    const startY = args.startY || 100;
    const gap = args.gap || 20;

    let currentY = startY;
    let count = 0;

    for (const id of args.shapeIds) {
      const shape = this.findShapeByIdOrName(id);
      if (shape) {
        this.onUpdateShape(shape.id, { x, y: currentY });
        currentY += shape.height + gap;
        count++;
      }
    }

    return `Arranged ${count} shapes in a vertical column.`;
  }

  private spaceEvenly(args: {
    shapeIds: string[];
    direction: 'horizontal' | 'vertical';
  }): string {
    const foundShapes = args.shapeIds
      .map((id) => this.findShapeByIdOrName(id))
      .filter(Boolean) as CanvasShape[];

    if (foundShapes.length < 3) {
      return 'Need at least 3 shapes to space evenly.';
    }

    if (args.direction === 'horizontal') {
      const sorted = [...foundShapes].sort((a, b) => a.x - b.x);
      const first = sorted[0];
      const last = sorted[sorted.length - 1];
      const totalSpace = (last.x + last.width) - first.x;
      const totalShapeWidth = sorted.reduce((sum, s) => sum + s.width, 0);
      const gap = (totalSpace - totalShapeWidth) / (sorted.length - 1);

      let currentX = first.x;
      sorted.forEach((shape) => {
        this.onUpdateShape(shape.id, { x: currentX });
        currentX += shape.width + gap;
      });
    } else {
      const sorted = [...foundShapes].sort((a, b) => a.y - b.y);
      const first = sorted[0];
      const last = sorted[sorted.length - 1];
      const totalSpace = (last.y + last.height) - first.y;
      const totalShapeHeight = sorted.reduce((sum, s) => sum + s.height, 0);
      const gap = (totalSpace - totalShapeHeight) / (sorted.length - 1);

      let currentY = first.y;
      sorted.forEach((shape) => {
        this.onUpdateShape(shape.id, { y: currentY });
        currentY += shape.height + gap;
      });
    }

    return `Spaced ${foundShapes.length} shapes evenly ${args.direction}ly.`;
  }

  private scaleShape(args: { shapeId: string; scale: number }): string {
    const shape = this.findShapeByIdOrName(args.shapeId);
    if (!shape) {
      return `Could not find shape with ID or name "${args.shapeId}".`;
    }
    this.onUpdateShape(shape.id, {
      width: shape.width * args.scale,
      height: shape.height * args.scale,
    });
    return `Scaled "${shape.name}" by ${args.scale}x.`;
  }

  private duplicateShapeByAI(args: {
    shapeId: string;
    offsetX?: number;
    offsetY?: number;
  }): string {
    const shape = this.findShapeByIdOrName(args.shapeId);
    if (!shape) {
      return `Could not find shape with ID or name "${args.shapeId}".`;
    }

    const offsetX = args.offsetX || 20;
    const offsetY = args.offsetY || 20;

    const newShape = {
      ...shape,
      id: nanoid(),
      x: shape.x + offsetX,
      y: shape.y + offsetY,
      name: `${shape.name} (copy)`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    this.onAddShape(newShape);
    return `Duplicated "${shape.name}" with offset (${offsetX}, ${offsetY}).`;
  }

  private alignShapes(args: {
    shapeIds: string[];
    alignment: 'left' | 'right' | 'center' | 'top' | 'bottom' | 'middle';
  }): string {
    const foundShapes = args.shapeIds
      .map((id) => this.findShapeByIdOrName(id))
      .filter(Boolean) as CanvasShape[];

    if (foundShapes.length < 2) {
      return 'Need at least 2 shapes to align.';
    }

    const bounds = {
      left: Math.min(...foundShapes.map((s) => s.x)),
      right: Math.max(...foundShapes.map((s) => s.x + s.width)),
      top: Math.min(...foundShapes.map((s) => s.y)),
      bottom: Math.max(...foundShapes.map((s) => s.y + s.height)),
    };

    foundShapes.forEach((shape) => {
      let newX = shape.x;
      let newY = shape.y;

      switch (args.alignment) {
        case 'left':
          newX = bounds.left;
          break;
        case 'right':
          newX = bounds.right - shape.width;
          break;
        case 'center':
          newX = bounds.left + (bounds.right - bounds.left) / 2 - shape.width / 2;
          break;
        case 'top':
          newY = bounds.top;
          break;
        case 'bottom':
          newY = bounds.bottom - shape.height;
          break;
        case 'middle':
          newY = bounds.top + (bounds.bottom - bounds.top) / 2 - shape.height / 2;
          break;
      }

      this.onUpdateShape(shape.id, { x: newX, y: newY });
    });

    return `Aligned ${foundShapes.length} shapes to ${args.alignment}.`;
  }

  private distributeShapes(args: {
    shapeIds: string[];
    direction: 'horizontal' | 'vertical';
  }): string {
    const foundShapes = args.shapeIds
      .map((id) => this.findShapeByIdOrName(id))
      .filter(Boolean) as CanvasShape[];

    if (foundShapes.length < 3) {
      return 'Need at least 3 shapes to distribute.';
    }

    if (args.direction === 'horizontal') {
      const sorted = [...foundShapes].sort((a, b) => a.x - b.x);
      const first = sorted[0];
      const last = sorted[sorted.length - 1];
      const totalWidth = sorted.reduce((sum, s) => sum + s.width, 0);
      const availableSpace = (last.x + last.width) - first.x - totalWidth;
      const gap = availableSpace / (sorted.length - 1);

      let currentX = first.x;
      sorted.forEach((shape) => {
        this.onUpdateShape(shape.id, { x: currentX });
        currentX += shape.width + gap;
      });
    } else {
      const sorted = [...foundShapes].sort((a, b) => a.y - b.y);
      const first = sorted[0];
      const last = sorted[sorted.length - 1];
      const totalHeight = sorted.reduce((sum, s) => sum + s.height, 0);
      const availableSpace = (last.y + last.height) - first.y - totalHeight;
      const gap = availableSpace / (sorted.length - 1);

      let currentY = first.y;
      sorted.forEach((shape) => {
        this.onUpdateShape(shape.id, { y: currentY });
        currentY += shape.height + gap;
      });
    }

    return `Distributed ${foundShapes.length} shapes ${args.direction}ly.`;
  }

  private changeOpacity(args: { shapeId: string; opacity: number }): string {
    const shape = this.findShapeByIdOrName(args.shapeId);
    if (!shape) {
      return `Could not find shape with ID or name "${args.shapeId}".`;
    }
    const opacity = Math.max(0, Math.min(1, args.opacity));
    this.onUpdateShape(shape.id, { opacity });
    return `Changed opacity of "${shape.name}" to ${opacity}.`;
  }

  private changeStroke(args: {
    shapeId: string;
    strokeColor?: string;
    strokeWidth?: number;
  }): string {
    const shape = this.findShapeByIdOrName(args.shapeId);
    if (!shape) {
      return `Could not find shape with ID or name "${args.shapeId}".`;
    }

    const updates: Partial<CanvasShape> = {};
    if (args.strokeColor) updates.stroke = args.strokeColor;
    if (args.strokeWidth !== undefined) updates.strokeWidth = args.strokeWidth;

    this.onUpdateShape(shape.id, updates);
    return `Changed stroke of "${shape.name}".`;
  }

  private clearCanvas(): string {
    const shapeIds = Object.keys(this.shapes);
    shapeIds.forEach((id) => this.onDeleteShape(id));
    return `Cleared ${shapeIds.length} shapes from the canvas.`;
  }

  private createButton(args: {
    text: string;
    x?: number;
    y?: number;
    style?: 'primary' | 'secondary' | 'danger' | 'success';
  }): string {
    const x = args.x || 200;
    const y = args.y || 200;
    const style = args.style || 'primary';

    const styleColors = {
      primary: { bg: '#3B82F6', text: '#FFFFFF' },
      secondary: { bg: '#6B7280', text: '#FFFFFF' },
      danger: { bg: '#EF4444', text: '#FFFFFF' },
      success: { bg: '#10B981', text: '#FFFFFF' },
    };

    const colors = styleColors[style];
    const width = Math.max(120, args.text.length * 12);

    // Button background
    const buttonBg = this.createBaseShape('rectangle', {
      x,
      y,
      width,
      height: 44,
      fill: colors.bg,
      stroke: 'transparent',
      strokeWidth: 0,
      name: `${args.text} Button`,
      cornerRadius: 8,
    });
    this.onAddShape(buttonBg);

    // Button text
    const buttonText = this.createBaseShape('text', {
      x,
      y: y + 10,
      width,
      height: 24,
      fill: colors.text,
      stroke: 'transparent',
      strokeWidth: 0,
      name: `${args.text} Button Text`,
    }) as TextShape;
    buttonText.text = args.text;
    buttonText.fontSize = 16;
    buttonText.fontFamily = 'Arial';
    buttonText.fontStyle = 'bold';
    buttonText.textAlign = 'center';
    buttonText.textDecoration = 'none';
    this.onAddShape(buttonText);

    return `Created a ${style} button with text "${args.text}".`;
  }

  private createFrame(args: {
    name: string;
    x?: number;
    y?: number;
    width?: number;
    height?: number;
  }): string {
    const x = args.x || 100;
    const y = args.y || 100;
    const width = args.width || 400;
    const height = args.height || 300;

    const frame = {
      id: nanoid(),
      type: 'frame' as const,
      x,
      y,
      width,
      height,
      rotation: 0,
      scaleX: 1,
      scaleY: 1,
      fill: '#FFFFFF',
      stroke: '#E5E7EB',
      strokeWidth: 1,
      opacity: 1,
      visible: true,
      locked: false,
      name: args.name,
      zIndex: Object.keys(this.shapes).length,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      createdBy: this.userId,
      lastEditedBy: this.userId,
      childIds: [],
    };

    this.onAddShape(frame as unknown as CanvasShape);
    return `Created frame "${args.name}" at (${x}, ${y}) with size ${width}x${height}.`;
  }

  private changeBlendMode(args: { shapeId: string; blendMode: string }): string {
    const shape = this.findShapeByIdOrName(args.shapeId);
    if (!shape) {
      return `Could not find shape with ID or name "${args.shapeId}".`;
    }
    this.onUpdateShape(shape.id, { blendMode: args.blendMode as CanvasShape['blendMode'] });
    return `Changed blend mode of "${shape.name}" to ${args.blendMode}.`;
  }

  private listShapes(): string {
    const shapeList = Object.values(this.shapes);
    if (shapeList.length === 0) {
      return 'The canvas is empty.';
    }

    const list = shapeList
      .sort((a, b) => a.zIndex - b.zIndex)
      .map((s) => `- ${s.name} (${s.type}): id="${s.id}", position=(${Math.round(s.x)}, ${Math.round(s.y)}), size=${Math.round(s.width)}x${Math.round(s.height)}, color=${s.fill}`)
      .join('\n');

    return `Canvas has ${shapeList.length} shapes:\n${list}`;
  }
}
