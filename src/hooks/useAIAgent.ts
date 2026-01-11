'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { nanoid } from 'nanoid';
import { useCanvasStore } from '@/store/canvasStore';
import { useUserStore } from '@/store/userStore';
import type { CanvasShape, TextShape, RectangleShape } from '@/types/canvas';

interface ToolCall {
  name: string;
  arguments: Record<string, unknown>;
}

export const useAIAgent = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const { shapes, addShape, updateShape, deleteShape, clearShapes } = useCanvasStore();
  const { currentUser } = useUserStore();
  const shapesRef = useRef(shapes);

  useEffect(() => {
    shapesRef.current = shapes;
  }, [shapes]);

  const createBaseShape = useCallback((type: string, overrides: Partial<CanvasShape> = {}): CanvasShape => {
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
      zIndex: Object.keys(shapesRef.current).length,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      createdBy: currentUser?.id || '',
      lastEditedBy: currentUser?.id || '',
    };

    return { ...base, type, ...overrides } as CanvasShape;
  }, [currentUser]);

  const findShapeByIdOrName = useCallback((idOrName: string): CanvasShape | undefined => {
    if (shapesRef.current[idOrName]) {
      return shapesRef.current[idOrName];
    }
    const lowerName = idOrName.toLowerCase();
    return Object.values(shapesRef.current).find(
      (shape) => shape.name.toLowerCase() === lowerName || shape.name.toLowerCase().includes(lowerName)
    );
  }, []);

  const executeToolCall = useCallback((toolCall: ToolCall): string => {
    const { name, arguments: args } = toolCall;

    switch (name) {
      case 'createShape': {
        const shape = createBaseShape(args.type as string, {
          x: args.x as number,
          y: args.y as number,
          width: args.width as number,
          height: args.height as number,
          fill: (args.color as string) || '#3B82F6',
          name: (args.name as string) || `${(args.type as string).charAt(0).toUpperCase() + (args.type as string).slice(1)}`,
        });
        addShape(shape);
        return `Created a ${args.type} at (${args.x}, ${args.y}).`;
      }

      case 'createText': {
        const shape = createBaseShape('text', {
          x: args.x as number,
          y: args.y as number,
          width: 200,
          height: 50,
          fill: (args.color as string) || '#1F2937',
          stroke: 'transparent',
          strokeWidth: 0,
          name: 'Text',
        }) as TextShape;
        shape.text = args.text as string;
        shape.fontSize = (args.fontSize as number) || 24;
        shape.fontFamily = 'Arial';
        shape.fontStyle = 'normal';
        shape.textAlign = 'left';
        shape.textDecoration = 'none';
        addShape(shape);
        return `Created text "${args.text}" at (${args.x}, ${args.y}).`;
      }

      case 'moveShape': {
        const shape = findShapeByIdOrName(args.shapeId as string);
        if (!shape) return `Could not find shape "${args.shapeId}".`;
        updateShape(shape.id, { x: args.x as number, y: args.y as number });
        return `Moved "${shape.name}" to (${args.x}, ${args.y}).`;
      }

      case 'resizeShape': {
        const shape = findShapeByIdOrName(args.shapeId as string);
        if (!shape) return `Could not find shape "${args.shapeId}".`;
        updateShape(shape.id, { width: args.width as number, height: args.height as number });
        return `Resized "${shape.name}" to ${args.width}x${args.height}.`;
      }

      case 'rotateShape': {
        const shape = findShapeByIdOrName(args.shapeId as string);
        if (!shape) return `Could not find shape "${args.shapeId}".`;
        updateShape(shape.id, { rotation: args.degrees as number });
        return `Rotated "${shape.name}" by ${args.degrees} degrees.`;
      }

      case 'changeShapeColor': {
        const shape = findShapeByIdOrName(args.shapeId as string);
        if (!shape) return `Could not find shape "${args.shapeId}".`;
        updateShape(shape.id, { fill: args.color as string });
        return `Changed color of "${shape.name}" to ${args.color}.`;
      }

      case 'deleteShape': {
        const shape = findShapeByIdOrName(args.shapeId as string);
        if (!shape) return `Could not find shape "${args.shapeId}".`;
        deleteShape(shape.id);
        return `Deleted "${shape.name}".`;
      }

      case 'arrangeInColumn': {
        const shapeIds = args.shapeIds as string[];
        const gap = (args.gap as number) || 20;
        const startY = (args.startY as number) || 100;
        const x = args.x as number | undefined;

        const shapesToArrange = shapeIds
          .map((id) => findShapeByIdOrName(id))
          .filter((s): s is CanvasShape => s !== undefined);

        if (shapesToArrange.length < 2) return 'Need at least 2 shapes to arrange.';

        let currentY = startY;
        const targetX = x ?? shapesToArrange[0].x;

        shapesToArrange.forEach((shape) => {
          updateShape(shape.id, { x: targetX, y: currentY });
          currentY += shape.height * shape.scaleY + gap;
        });

        return `Arranged ${shapesToArrange.length} shapes in a column.`;
      }

      case 'spaceEvenly': {
        const shapeIds = args.shapeIds as string[];
        const direction = args.direction as string;
        const shapesToSpace = shapeIds
          .map((id) => findShapeByIdOrName(id))
          .filter((s): s is CanvasShape => s !== undefined);

        if (shapesToSpace.length < 3) return 'Need at least 3 shapes to space evenly.';

        if (direction === 'horizontal') {
          shapesToSpace.sort((a, b) => a.x - b.x);
          const first = shapesToSpace[0];
          const last = shapesToSpace[shapesToSpace.length - 1];
          const totalWidth = shapesToSpace.reduce((sum, s) => sum + s.width * s.scaleX, 0);
          const availableSpace = (last.x + last.width * last.scaleX) - first.x - totalWidth;
          const spacing = availableSpace / (shapesToSpace.length - 1);

          let currentX = first.x;
          shapesToSpace.forEach((shape) => {
            updateShape(shape.id, { x: currentX });
            currentX += shape.width * shape.scaleX + spacing;
          });
        } else {
          shapesToSpace.sort((a, b) => a.y - b.y);
          const first = shapesToSpace[0];
          const last = shapesToSpace[shapesToSpace.length - 1];
          const totalHeight = shapesToSpace.reduce((sum, s) => sum + s.height * s.scaleY, 0);
          const availableSpace = (last.y + last.height * last.scaleY) - first.y - totalHeight;
          const spacing = availableSpace / (shapesToSpace.length - 1);

          let currentY = first.y;
          shapesToSpace.forEach((shape) => {
            updateShape(shape.id, { y: currentY });
            currentY += shape.height * shape.scaleY + spacing;
          });
        }

        return `Spaced ${shapesToSpace.length} shapes evenly ${direction}ly.`;
      }

      case 'arrangeInGrid': {
        const startX = (args.startX as number) || 100;
        const startY = (args.startY as number) || 100;
        const size = (args.shapeSize as number) || 60;
        const gap = (args.gap as number) || 20;
        const color = (args.color as string) || '#3B82F6';
        const rows = args.rows as number;
        const columns = args.columns as number;
        const shapeType = args.shapeType as string;

        for (let row = 0; row < rows; row++) {
          for (let col = 0; col < columns; col++) {
            const x = startX + col * (size + gap);
            const y = startY + row * (size + gap);
            const shape = createBaseShape(shapeType, {
              x,
              y,
              width: size,
              height: size,
              fill: color,
              name: `${shapeType} ${row * columns + col + 1}`,
            });
            addShape(shape);
          }
        }
        return `Created a ${rows}x${columns} grid of ${shapeType}s.`;
      }

      case 'createLoginForm': {
        const x = (args.x as number) || 200;
        const y = (args.y as number) || 150;
        const width = 300;

        // Form background
        addShape(createBaseShape('rectangle', {
          x: x - 20, y: y - 20, width: width + 40, height: 280,
          fill: '#FFFFFF', stroke: '#E5E7EB', strokeWidth: 1, name: 'Login Form Background',
        }));

        // Title
        const title = createBaseShape('text', {
          x, y, width, height: 40, fill: '#1F2937', stroke: 'transparent', strokeWidth: 0, name: 'Login Title',
        }) as TextShape;
        title.text = 'Login';
        title.fontSize = 28;
        title.fontFamily = 'Arial';
        title.fontStyle = 'bold';
        title.textAlign = 'center';
        title.textDecoration = 'none';
        addShape(title);

        // Username label
        const usernameLabel = createBaseShape('text', {
          x, y: y + 50, width, height: 20, fill: '#4B5563', stroke: 'transparent', strokeWidth: 0, name: 'Username Label',
        }) as TextShape;
        usernameLabel.text = 'Username';
        usernameLabel.fontSize = 14;
        usernameLabel.fontFamily = 'Arial';
        usernameLabel.fontStyle = 'normal';
        usernameLabel.textAlign = 'left';
        usernameLabel.textDecoration = 'none';
        addShape(usernameLabel);

        // Username input
        addShape(createBaseShape('rectangle', {
          x, y: y + 75, width, height: 40, fill: '#F9FAFB', stroke: '#D1D5DB', strokeWidth: 1, name: 'Username Input',
        }));

        // Password label
        const passwordLabel = createBaseShape('text', {
          x, y: y + 130, width, height: 20, fill: '#4B5563', stroke: 'transparent', strokeWidth: 0, name: 'Password Label',
        }) as TextShape;
        passwordLabel.text = 'Password';
        passwordLabel.fontSize = 14;
        passwordLabel.fontFamily = 'Arial';
        passwordLabel.fontStyle = 'normal';
        passwordLabel.textAlign = 'left';
        passwordLabel.textDecoration = 'none';
        addShape(passwordLabel);

        // Password input
        addShape(createBaseShape('rectangle', {
          x, y: y + 155, width, height: 40, fill: '#F9FAFB', stroke: '#D1D5DB', strokeWidth: 1, name: 'Password Input',
        }));

        // Submit button
        addShape(createBaseShape('rectangle', {
          x, y: y + 210, width, height: 44, fill: '#3B82F6', stroke: '#2563EB', strokeWidth: 0, name: 'Submit Button',
        }));

        // Button text
        const buttonText = createBaseShape('text', {
          x, y: y + 220, width, height: 24, fill: '#FFFFFF', stroke: 'transparent', strokeWidth: 0, name: 'Button Text',
        }) as TextShape;
        buttonText.text = 'Sign In';
        buttonText.fontSize = 16;
        buttonText.fontFamily = 'Arial';
        buttonText.fontStyle = 'bold';
        buttonText.textAlign = 'center';
        buttonText.textDecoration = 'none';
        addShape(buttonText);

        return 'Created a login form with title, username field, password field, and submit button.';
      }

      case 'createNavbar': {
        const items = args.items as string[];
        const x = (args.x as number) || 50;
        const y = (args.y as number) || 20;
        const itemWidth = 100;
        const height = 50;
        const gap = 10;

        // Navbar background
        addShape(createBaseShape('rectangle', {
          x: x - 20, y: y - 10, width: items.length * (itemWidth + gap) + 30, height: height + 20,
          fill: '#1F2937', stroke: 'transparent', strokeWidth: 0, name: 'Navbar Background',
        }));

        items.forEach((item, index) => {
          const itemX = x + index * (itemWidth + gap);
          addShape(createBaseShape('rectangle', {
            x: itemX, y, width: itemWidth, height,
            fill: index === 0 ? '#3B82F6' : 'transparent', stroke: 'transparent', strokeWidth: 0, name: `Nav Item Bg ${index + 1}`,
          }));

          const itemText = createBaseShape('text', {
            x: itemX, y: y + 15, width: itemWidth, height: 20,
            fill: '#FFFFFF', stroke: 'transparent', strokeWidth: 0, name: `Nav Item ${index + 1}`,
          }) as TextShape;
          itemText.text = item;
          itemText.fontSize = 14;
          itemText.fontFamily = 'Arial';
          itemText.fontStyle = 'normal';
          itemText.textAlign = 'center';
          itemText.textDecoration = 'none';
          addShape(itemText);
        });

        return `Created a navigation bar with ${items.length} menu items.`;
      }

      case 'createCard': {
        const x = (args.x as number) || 200;
        const y = (args.y as number) || 200;
        const width = 280;
        const description = args.description as string | undefined;

        addShape(createBaseShape('rectangle', {
          x, y, width, height: description ? 180 : 120,
          fill: '#FFFFFF', stroke: '#E5E7EB', strokeWidth: 1, name: 'Card Background',
        }));

        addShape(createBaseShape('rectangle', {
          x: x + 16, y: y + 16, width: width - 32, height: 80,
          fill: '#F3F4F6', stroke: '#E5E7EB', strokeWidth: 1, name: 'Image Placeholder',
        }));

        const titleText = createBaseShape('text', {
          x: x + 16, y: y + 110, width: width - 32, height: 24,
          fill: '#1F2937', stroke: 'transparent', strokeWidth: 0, name: 'Card Title',
        }) as TextShape;
        titleText.text = args.title as string;
        titleText.fontSize = 18;
        titleText.fontFamily = 'Arial';
        titleText.fontStyle = 'bold';
        titleText.textAlign = 'left';
        titleText.textDecoration = 'none';
        addShape(titleText);

        if (description) {
          const descText = createBaseShape('text', {
            x: x + 16, y: y + 140, width: width - 32, height: 40,
            fill: '#6B7280', stroke: 'transparent', strokeWidth: 0, name: 'Card Description',
          }) as TextShape;
          descText.text = description;
          descText.fontSize = 14;
          descText.fontFamily = 'Arial';
          descText.fontStyle = 'normal';
          descText.textAlign = 'left';
          descText.textDecoration = 'none';
          addShape(descText);
        }

        return `Created a card with title "${args.title}"${description ? ` and description` : ''}.`;
      }

      case 'scaleShape': {
        const shape = findShapeByIdOrName(args.shapeId as string);
        if (!shape) return `Could not find shape "${args.shapeId}".`;
        updateShape(shape.id, { scaleX: args.scaleX as number, scaleY: args.scaleY as number });
        return `Scaled "${shape.name}" to ${args.scaleX}x${args.scaleY}.`;
      }

      case 'duplicateShape': {
        const shape = findShapeByIdOrName(args.shapeId as string);
        if (!shape) return `Could not find shape "${args.shapeId}".`;
        const offsetX = (args.offsetX as number) || 20;
        const offsetY = (args.offsetY as number) || 20;
        const newShape = {
          ...shape,
          id: nanoid(),
          x: shape.x + offsetX,
          y: shape.y + offsetY,
          name: `${shape.name} Copy`,
          zIndex: Object.keys(shapesRef.current).length,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        addShape(newShape);
        return `Duplicated "${shape.name}" to (${newShape.x}, ${newShape.y}).`;
      }

      case 'clearCanvas': {
        clearShapes();
        return 'Cleared all shapes from the canvas.';
      }

      case 'changeOpacity': {
        const shape = findShapeByIdOrName(args.shapeId as string);
        if (!shape) return `Could not find shape "${args.shapeId}".`;
        const opacity = Math.max(0, Math.min(1, args.opacity as number));
        updateShape(shape.id, { opacity });
        return `Changed opacity of "${shape.name}" to ${Math.round(opacity * 100)}%.`;
      }

      case 'changeStroke': {
        const shape = findShapeByIdOrName(args.shapeId as string);
        if (!shape) return `Could not find shape "${args.shapeId}".`;
        const updates: Partial<CanvasShape> = {};
        if (args.strokeColor) updates.stroke = args.strokeColor as string;
        if (args.strokeWidth !== undefined) updates.strokeWidth = args.strokeWidth as number;
        updateShape(shape.id, updates);
        return `Changed stroke of "${shape.name}".`;
      }

      case 'listShapes': {
        const shapeList = Object.values(shapesRef.current);
        if (shapeList.length === 0) return 'The canvas is empty.';
        const list = shapeList
          .map((s) => `- ${s.name} (${s.type}) at (${Math.round(s.x)}, ${Math.round(s.y)}), size: ${Math.round(s.width)}x${Math.round(s.height)}`)
          .join('\n');
        return `Canvas has ${shapeList.length} shapes:\n${list}`;
      }

      case 'alignShapes': {
        const shapeIds = args.shapeIds as string[];
        const alignment = args.alignment as string;
        const shapesToAlign = shapeIds
          .map((id) => findShapeByIdOrName(id))
          .filter((s): s is CanvasShape => s !== undefined);

        if (shapesToAlign.length < 2) return 'Need at least 2 shapes to align.';

        // Find bounds
        const minX = Math.min(...shapesToAlign.map((s) => s.x));
        const maxX = Math.max(...shapesToAlign.map((s) => s.x + s.width));
        const minY = Math.min(...shapesToAlign.map((s) => s.y));
        const maxY = Math.max(...shapesToAlign.map((s) => s.y + s.height));
        const centerX = (minX + maxX) / 2;
        const centerY = (minY + maxY) / 2;

        shapesToAlign.forEach((shape) => {
          switch (alignment) {
            case 'left':
              updateShape(shape.id, { x: minX });
              break;
            case 'right':
              updateShape(shape.id, { x: maxX - shape.width });
              break;
            case 'top':
              updateShape(shape.id, { y: minY });
              break;
            case 'bottom':
              updateShape(shape.id, { y: maxY - shape.height });
              break;
            case 'centerH':
              updateShape(shape.id, { x: centerX - shape.width / 2 });
              break;
            case 'centerV':
              updateShape(shape.id, { y: centerY - shape.height / 2 });
              break;
          }
        });

        return `Aligned ${shapesToAlign.length} shapes to ${alignment}.`;
      }

      case 'distributeShapes': {
        const shapeIds = args.shapeIds as string[];
        const direction = args.direction as string;
        const shapesToDistribute = shapeIds
          .map((id) => findShapeByIdOrName(id))
          .filter((s): s is CanvasShape => s !== undefined);

        if (shapesToDistribute.length < 3) return 'Need at least 3 shapes to distribute.';

        if (direction === 'horizontal') {
          shapesToDistribute.sort((a, b) => a.x - b.x);
          const minX = shapesToDistribute[0].x;
          const maxX = shapesToDistribute[shapesToDistribute.length - 1].x;
          const totalGap = maxX - minX;
          const gap = totalGap / (shapesToDistribute.length - 1);

          shapesToDistribute.forEach((shape, i) => {
            if (i > 0 && i < shapesToDistribute.length - 1) {
              updateShape(shape.id, { x: minX + gap * i });
            }
          });
        } else {
          shapesToDistribute.sort((a, b) => a.y - b.y);
          const minY = shapesToDistribute[0].y;
          const maxY = shapesToDistribute[shapesToDistribute.length - 1].y;
          const totalGap = maxY - minY;
          const gap = totalGap / (shapesToDistribute.length - 1);

          shapesToDistribute.forEach((shape, i) => {
            if (i > 0 && i < shapesToDistribute.length - 1) {
              updateShape(shape.id, { y: minY + gap * i });
            }
          });
        }

        return `Distributed ${shapesToDistribute.length} shapes ${direction}ly.`;
      }

      case 'createButton': {
        const x = (args.x as number) || 200;
        const y = (args.y as number) || 200;
        const text = args.text as string;
        const variant = (args.variant as string) || 'primary';
        const width = 120;
        const height = 40;

        const variants: Record<string, { fill: string; stroke: string; textColor: string }> = {
          primary: { fill: '#3B82F6', stroke: '#2563EB', textColor: '#FFFFFF' },
          secondary: { fill: '#6B7280', stroke: '#4B5563', textColor: '#FFFFFF' },
          outline: { fill: 'transparent', stroke: '#3B82F6', textColor: '#3B82F6' },
          danger: { fill: '#EF4444', stroke: '#DC2626', textColor: '#FFFFFF' },
        };

        const style = variants[variant] || variants.primary;

        const buttonBg = createBaseShape('rectangle', {
          x, y, width, height,
          fill: style.fill, stroke: style.stroke, strokeWidth: 2, name: `${text} Button`,
        }) as RectangleShape;
        buttonBg.cornerRadius = 6;
        addShape(buttonBg);

        const buttonText = createBaseShape('text', {
          x, y: y + 10, width, height: 20,
          fill: style.textColor, stroke: 'transparent', strokeWidth: 0, name: `${text} Button Text`,
        }) as TextShape;
        buttonText.text = text;
        buttonText.fontSize = 14;
        buttonText.fontFamily = 'Arial';
        buttonText.fontStyle = 'bold';
        buttonText.textAlign = 'center';
        buttonText.textDecoration = 'none';
        addShape(buttonText);

        return `Created a ${variant} button with text "${text}".`;
      }

      case 'arrangeInRow': {
        const shapeIds = args.shapeIds as string[];
        const gap = (args.gap as number) || 20;
        const startX = (args.startX as number) || 100;
        const y = args.y as number | undefined;

        const shapesToArrange = shapeIds
          .map((id) => findShapeByIdOrName(id))
          .filter((s): s is CanvasShape => s !== undefined);

        if (shapesToArrange.length < 2) return 'Need at least 2 shapes to arrange.';

        let currentX = startX;
        const targetY = y ?? shapesToArrange[0].y;

        shapesToArrange.forEach((shape) => {
          updateShape(shape.id, { x: currentX, y: targetY });
          currentX += shape.width * shape.scaleX + gap;
        });

        return `Arranged ${shapesToArrange.length} shapes in a row.`;
      }

      case 'changeBlendMode': {
        const shape = findShapeByIdOrName(args.shapeId as string);
        if (!shape) return `Could not find shape "${args.shapeId}".`;
        const blendMode = args.blendMode as string;
        updateShape(shape.id, { blendMode: blendMode as CanvasShape['blendMode'] });
        return `Changed blend mode of "${shape.name}" to ${blendMode}.`;
      }

      case 'createFrame': {
        const x = (args.x as number) || 100;
        const y = (args.y as number) || 100;
        const width = (args.width as number) || 400;
        const height = (args.height as number) || 300;
        const name = (args.name as string) || 'Frame';

        const frame = {
          ...createBaseShape('frame', {
            x, y, width, height,
            fill: '#FFFFFF',
            stroke: '#E5E7EB',
            strokeWidth: 1,
            name,
          }),
          childIds: [],
        };

        addShape(frame);
        return `Created frame "${name}" at (${x}, ${y}) with size ${width}x${height}.`;
      }

      case 'getCanvasState': {
        const shapeList = Object.values(shapesRef.current);
        if (shapeList.length === 0) return 'The canvas is empty.';
        const summary = shapeList
          .map((s) => `- ${s.name} (${s.type}): id="${s.id}", position=(${Math.round(s.x)}, ${Math.round(s.y)}), size=${Math.round(s.width)}x${Math.round(s.height)}, color=${s.fill}`)
          .join('\n');
        return `Canvas has ${shapeList.length} shapes:\n${summary}`;
      }

      case 'createSignupForm': {
        const x = (args.x as number) || 200;
        const y = (args.y as number) || 150;
        const width = 320;

        // Form background
        addShape(createBaseShape('rectangle', {
          x: x - 20, y: y - 20, width: width + 40, height: 380,
          fill: '#FFFFFF', stroke: '#E5E7EB', strokeWidth: 1, name: 'Signup Form Background',
        }));

        // Title
        const title = createBaseShape('text', {
          x, y, width, height: 40, fill: '#1F2937', stroke: 'transparent', strokeWidth: 0, name: 'Signup Title',
        }) as TextShape;
        title.text = 'Create Account';
        title.fontSize = 28;
        title.fontFamily = 'Arial';
        title.fontStyle = 'bold';
        title.textAlign = 'center';
        title.textDecoration = 'none';
        addShape(title);

        // Name label
        const nameLabel = createBaseShape('text', {
          x, y: y + 50, width, height: 20, fill: '#4B5563', stroke: 'transparent', strokeWidth: 0, name: 'Name Label',
        }) as TextShape;
        nameLabel.text = 'Full Name';
        nameLabel.fontSize = 14;
        nameLabel.fontFamily = 'Arial';
        nameLabel.fontStyle = 'normal';
        nameLabel.textAlign = 'left';
        nameLabel.textDecoration = 'none';
        addShape(nameLabel);

        // Name input
        addShape(createBaseShape('rectangle', {
          x, y: y + 75, width, height: 40, fill: '#F9FAFB', stroke: '#D1D5DB', strokeWidth: 1, name: 'Name Input',
        }));

        // Email label
        const emailLabel = createBaseShape('text', {
          x, y: y + 130, width, height: 20, fill: '#4B5563', stroke: 'transparent', strokeWidth: 0, name: 'Email Label',
        }) as TextShape;
        emailLabel.text = 'Email Address';
        emailLabel.fontSize = 14;
        emailLabel.fontFamily = 'Arial';
        emailLabel.fontStyle = 'normal';
        emailLabel.textAlign = 'left';
        emailLabel.textDecoration = 'none';
        addShape(emailLabel);

        // Email input
        addShape(createBaseShape('rectangle', {
          x, y: y + 155, width, height: 40, fill: '#F9FAFB', stroke: '#D1D5DB', strokeWidth: 1, name: 'Email Input',
        }));

        // Password label
        const passwordLabel = createBaseShape('text', {
          x, y: y + 210, width, height: 20, fill: '#4B5563', stroke: 'transparent', strokeWidth: 0, name: 'Password Label',
        }) as TextShape;
        passwordLabel.text = 'Password';
        passwordLabel.fontSize = 14;
        passwordLabel.fontFamily = 'Arial';
        passwordLabel.fontStyle = 'normal';
        passwordLabel.textAlign = 'left';
        passwordLabel.textDecoration = 'none';
        addShape(passwordLabel);

        // Password input
        addShape(createBaseShape('rectangle', {
          x, y: y + 235, width, height: 40, fill: '#F9FAFB', stroke: '#D1D5DB', strokeWidth: 1, name: 'Password Input',
        }));

        // Submit button
        addShape(createBaseShape('rectangle', {
          x, y: y + 300, width, height: 44, fill: '#10B981', stroke: '#059669', strokeWidth: 0, name: 'Signup Button',
        }));

        // Button text
        const buttonText = createBaseShape('text', {
          x, y: y + 310, width, height: 24, fill: '#FFFFFF', stroke: 'transparent', strokeWidth: 0, name: 'Signup Button Text',
        }) as TextShape;
        buttonText.text = 'Sign Up';
        buttonText.fontSize = 16;
        buttonText.fontFamily = 'Arial';
        buttonText.fontStyle = 'bold';
        buttonText.textAlign = 'center';
        buttonText.textDecoration = 'none';
        addShape(buttonText);

        return 'Created a signup form with name, email, password fields and submit button.';
      }

      case 'createProfileCard': {
        const x = (args.x as number) || 200;
        const y = (args.y as number) || 200;
        const name = args.name as string;
        const title = (args.title as string) || 'Team Member';
        const width = 240;

        // Card background
        addShape(createBaseShape('rectangle', {
          x, y, width, height: 200,
          fill: '#FFFFFF', stroke: '#E5E7EB', strokeWidth: 1, name: 'Profile Card Background',
        }));

        // Avatar placeholder
        addShape(createBaseShape('circle', {
          x: x + width / 2 - 40, y: y + 20, width: 80, height: 80,
          fill: '#6366F1', stroke: '#4F46E5', strokeWidth: 2, name: 'Avatar',
        }));

        // Avatar initial
        const initial = createBaseShape('text', {
          x: x + width / 2 - 40, y: y + 45, width: 80, height: 30,
          fill: '#FFFFFF', stroke: 'transparent', strokeWidth: 0, name: 'Avatar Initial',
        }) as TextShape;
        initial.text = name.charAt(0).toUpperCase();
        initial.fontSize = 32;
        initial.fontFamily = 'Arial';
        initial.fontStyle = 'bold';
        initial.textAlign = 'center';
        initial.textDecoration = 'none';
        addShape(initial);

        // Name
        const nameText = createBaseShape('text', {
          x: x + 16, y: y + 115, width: width - 32, height: 28,
          fill: '#1F2937', stroke: 'transparent', strokeWidth: 0, name: 'Profile Name',
        }) as TextShape;
        nameText.text = name;
        nameText.fontSize = 18;
        nameText.fontFamily = 'Arial';
        nameText.fontStyle = 'bold';
        nameText.textAlign = 'center';
        nameText.textDecoration = 'none';
        addShape(nameText);

        // Title
        const titleText = createBaseShape('text', {
          x: x + 16, y: y + 145, width: width - 32, height: 24,
          fill: '#6B7280', stroke: 'transparent', strokeWidth: 0, name: 'Profile Title',
        }) as TextShape;
        titleText.text = title;
        titleText.fontSize = 14;
        titleText.fontFamily = 'Arial';
        titleText.fontStyle = 'normal';
        titleText.textAlign = 'center';
        titleText.textDecoration = 'none';
        addShape(titleText);

        return `Created a profile card for "${name}".`;
      }

      case 'createSearchBar': {
        const x = (args.x as number) || 200;
        const y = (args.y as number) || 100;
        const width = (args.width as number) || 400;
        const placeholder = (args.placeholder as string) || 'Search...';

        // Search container
        addShape(createBaseShape('rectangle', {
          x, y, width, height: 44,
          fill: '#FFFFFF', stroke: '#D1D5DB', strokeWidth: 1, name: 'Search Container',
        }));

        // Search icon placeholder
        addShape(createBaseShape('circle', {
          x: x + 12, y: y + 12, width: 20, height: 20,
          fill: 'transparent', stroke: '#9CA3AF', strokeWidth: 2, name: 'Search Icon',
        }));

        // Placeholder text
        const placeholderText = createBaseShape('text', {
          x: x + 44, y: y + 12, width: width - 100, height: 20,
          fill: '#9CA3AF', stroke: 'transparent', strokeWidth: 0, name: 'Search Placeholder',
        }) as TextShape;
        placeholderText.text = placeholder;
        placeholderText.fontSize = 14;
        placeholderText.fontFamily = 'Arial';
        placeholderText.fontStyle = 'normal';
        placeholderText.textAlign = 'left';
        placeholderText.textDecoration = 'none';
        addShape(placeholderText);

        // Search button
        addShape(createBaseShape('rectangle', {
          x: x + width - 70, y: y + 6, width: 60, height: 32,
          fill: '#3B82F6', stroke: '#2563EB', strokeWidth: 0, name: 'Search Button',
        }));

        const buttonText = createBaseShape('text', {
          x: x + width - 70, y: y + 14, width: 60, height: 20,
          fill: '#FFFFFF', stroke: 'transparent', strokeWidth: 0, name: 'Search Button Text',
        }) as TextShape;
        buttonText.text = 'Search';
        buttonText.fontSize = 12;
        buttonText.fontFamily = 'Arial';
        buttonText.fontStyle = 'bold';
        buttonText.textAlign = 'center';
        buttonText.textDecoration = 'none';
        addShape(buttonText);

        return `Created a search bar with placeholder "${placeholder}".`;
      }

      case 'createFooter': {
        const x = (args.x as number) || 50;
        const y = (args.y as number) || 500;
        const links = (args.links as string[]) || ['Privacy', 'Terms', 'Contact', 'About'];
        const copyright = (args.copyright as string) || '© 2024 Company. All rights reserved.';
        const width = 700;

        // Footer background
        addShape(createBaseShape('rectangle', {
          x: x - 20, y: y - 10, width: width + 40, height: 80,
          fill: '#1F2937', stroke: 'transparent', strokeWidth: 0, name: 'Footer Background',
        }));

        // Links
        const linkWidth = 80;
        const totalLinksWidth = links.length * linkWidth + (links.length - 1) * 20;
        const startX = x + (width - totalLinksWidth) / 2;

        links.forEach((link, index) => {
          const linkText = createBaseShape('text', {
            x: startX + index * (linkWidth + 20), y: y + 5, width: linkWidth, height: 20,
            fill: '#D1D5DB', stroke: 'transparent', strokeWidth: 0, name: `Footer Link ${index + 1}`,
          }) as TextShape;
          linkText.text = link;
          linkText.fontSize = 14;
          linkText.fontFamily = 'Arial';
          linkText.fontStyle = 'normal';
          linkText.textAlign = 'center';
          linkText.textDecoration = 'none';
          addShape(linkText);
        });

        // Copyright
        const copyrightText = createBaseShape('text', {
          x, y: y + 35, width, height: 20,
          fill: '#6B7280', stroke: 'transparent', strokeWidth: 0, name: 'Copyright',
        }) as TextShape;
        copyrightText.text = copyright;
        copyrightText.fontSize = 12;
        copyrightText.fontFamily = 'Arial';
        copyrightText.fontStyle = 'normal';
        copyrightText.textAlign = 'center';
        copyrightText.textDecoration = 'none';
        addShape(copyrightText);

        return `Created a footer with ${links.length} links.`;
      }

      case 'createHeroSection': {
        const x = (args.x as number) || 100;
        const y = (args.y as number) || 100;
        const headline = args.headline as string;
        const subtext = (args.subtext as string) || 'Discover the power of our platform.';
        const ctaText = (args.ctaText as string) || 'Get Started';
        const width = 600;

        // Hero background
        addShape(createBaseShape('rectangle', {
          x: x - 40, y: y - 40, width: width + 80, height: 280,
          fill: '#F3F4F6', stroke: 'transparent', strokeWidth: 0, name: 'Hero Background',
        }));

        // Headline
        const headlineText = createBaseShape('text', {
          x, y, width, height: 60,
          fill: '#111827', stroke: 'transparent', strokeWidth: 0, name: 'Hero Headline',
        }) as TextShape;
        headlineText.text = headline;
        headlineText.fontSize = 48;
        headlineText.fontFamily = 'Arial';
        headlineText.fontStyle = 'bold';
        headlineText.textAlign = 'center';
        headlineText.textDecoration = 'none';
        addShape(headlineText);

        // Subtext
        const subtextEl = createBaseShape('text', {
          x, y: y + 80, width, height: 40,
          fill: '#6B7280', stroke: 'transparent', strokeWidth: 0, name: 'Hero Subtext',
        }) as TextShape;
        subtextEl.text = subtext;
        subtextEl.fontSize = 18;
        subtextEl.fontFamily = 'Arial';
        subtextEl.fontStyle = 'normal';
        subtextEl.textAlign = 'center';
        subtextEl.textDecoration = 'none';
        addShape(subtextEl);

        // CTA Button
        const buttonWidth = 160;
        addShape(createBaseShape('rectangle', {
          x: x + (width - buttonWidth) / 2, y: y + 150, width: buttonWidth, height: 50,
          fill: '#3B82F6', stroke: '#2563EB', strokeWidth: 0, name: 'Hero CTA Button',
        }));

        const ctaTextEl = createBaseShape('text', {
          x: x + (width - buttonWidth) / 2, y: y + 162, width: buttonWidth, height: 26,
          fill: '#FFFFFF', stroke: 'transparent', strokeWidth: 0, name: 'Hero CTA Text',
        }) as TextShape;
        ctaTextEl.text = ctaText;
        ctaTextEl.fontSize = 16;
        ctaTextEl.fontFamily = 'Arial';
        ctaTextEl.fontStyle = 'bold';
        ctaTextEl.textAlign = 'center';
        ctaTextEl.textDecoration = 'none';
        addShape(ctaTextEl);

        return `Created a hero section with headline "${headline}".`;
      }

      case 'centerShape': {
        const shape = findShapeByIdOrName(args.shapeId as string);
        if (!shape) return `Could not find shape "${args.shapeId}".`;
        // Center on canvas (assuming 1000x800 canvas size, adjusted for shape dimensions)
        const centerX = 500 - (shape.width * shape.scaleX) / 2;
        const centerY = 400 - (shape.height * shape.scaleY) / 2;
        updateShape(shape.id, { x: centerX, y: centerY });
        return `Centered "${shape.name}" on the canvas.`;
      }

      default:
        return `Unknown tool: ${name}`;
    }
  }, [createBaseShape, findShapeByIdOrName, addShape, updateShape, deleteShape, clearShapes]);

  const processCommand = useCallback(async (command: string): Promise<string> => {
    setIsProcessing(true);

    try {
      const response = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command, canvasState: shapesRef.current }),
      });

      if (!response.ok) {
        throw new Error('Failed to process AI command');
      }

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      // Execute tool calls
      if (data.toolCalls && data.toolCalls.length > 0) {
        const results: string[] = [];
        for (const toolCall of data.toolCalls) {
          const result = executeToolCall(toolCall);
          results.push(result);
        }
        return results.join('\n');
      }

      return data.content || 'Command processed.';
    } catch (error) {
      console.error('AI Agent error:', error);
      throw error;
    } finally {
      setIsProcessing(false);
    }
  }, [executeToolCall]);

  return {
    processCommand,
    isProcessing,
  };
};
