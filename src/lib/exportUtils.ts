import type { CanvasShape, TextShape, Frame, ImageShape } from '@/types/canvas';

/**
 * Converts canvas shapes to SVG format
 */
export function shapesToSVG(
  shapes: CanvasShape[],
  options: { width?: number; height?: number; background?: string } = {}
): string {
  const { width = 1920, height = 1080, background = 'white' } = options;

  // Calculate bounding box
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  shapes.forEach((shape) => {
    const x = shape.x;
    const y = shape.y;
    const w = shape.width * shape.scaleX;
    const h = shape.height * shape.scaleY;

    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    maxX = Math.max(maxX, x + w);
    maxY = Math.max(maxY, y + h);
  });

  // Add padding
  const padding = 50;
  minX -= padding;
  minY -= padding;
  maxX += padding;
  maxY += padding;

  const viewBoxWidth = maxX - minX;
  const viewBoxHeight = maxY - minY;

  const svgElements = shapes
    .sort((a, b) => a.zIndex - b.zIndex)
    .filter((shape) => shape.visible)
    .map((shape) => shapeToSVGElement(shape))
    .join('\n    ');

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg"
     width="${width}"
     height="${height}"
     viewBox="${minX} ${minY} ${viewBoxWidth} ${viewBoxHeight}">
  <rect x="${minX}" y="${minY}" width="${viewBoxWidth}" height="${viewBoxHeight}" fill="${background}"/>
  <g>
    ${svgElements}
  </g>
</svg>`;
}

function shapeToSVGElement(shape: CanvasShape): string {
  const transform = buildTransform(shape);
  const blendMode = shape.blendMode && shape.blendMode !== 'normal' ? ` style="mix-blend-mode: ${shape.blendMode}"` : '';
  const baseAttrs = `opacity="${shape.opacity}"${transform ? ` transform="${transform}"` : ''}${blendMode}`;

  switch (shape.type) {
    case 'rectangle':
      return renderRectangle(shape, baseAttrs);
    case 'circle':
      return renderCircle(shape, baseAttrs);
    case 'triangle':
      return renderTriangle(shape, baseAttrs);
    case 'star':
      return renderStar(shape, baseAttrs);
    case 'line':
      return renderLine(shape, baseAttrs);
    case 'text':
      return renderText(shape as TextShape, baseAttrs);
    case 'frame':
      return renderFrame(shape as Frame, baseAttrs);
    case 'image':
      return renderImage(shape as ImageShape, baseAttrs);
    default:
      return '';
  }
}

function buildTransform(shape: CanvasShape): string {
  const transforms: string[] = [];

  if (shape.rotation !== 0) {
    const cx = shape.x + (shape.width * shape.scaleX) / 2;
    const cy = shape.y + (shape.height * shape.scaleY) / 2;
    transforms.push(`rotate(${shape.rotation} ${cx} ${cy})`);
  }

  return transforms.join(' ');
}

function renderRectangle(shape: CanvasShape, baseAttrs: string): string {
  const cornerRadius = (shape as { cornerRadius?: number }).cornerRadius || 0;
  const rx = cornerRadius > 0 ? ` rx="${cornerRadius}" ry="${cornerRadius}"` : '';

  return `<rect x="${shape.x}" y="${shape.y}" width="${shape.width * shape.scaleX}" height="${shape.height * shape.scaleY}"${rx} fill="${shape.fill}" stroke="${shape.stroke}" stroke-width="${shape.strokeWidth}" ${baseAttrs}/>`;
}

function renderCircle(shape: CanvasShape, baseAttrs: string): string {
  const rx = (shape.width * shape.scaleX) / 2;
  const ry = (shape.height * shape.scaleY) / 2;
  const cx = shape.x + rx;
  const cy = shape.y + ry;

  return `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${shape.fill}" stroke="${shape.stroke}" stroke-width="${shape.strokeWidth}" ${baseAttrs}/>`;
}

function renderTriangle(shape: CanvasShape, baseAttrs: string): string {
  const w = shape.width * shape.scaleX;
  const h = shape.height * shape.scaleY;
  const x = shape.x;
  const y = shape.y;

  const points = `${x + w/2},${y} ${x + w},${y + h} ${x},${y + h}`;

  return `<polygon points="${points}" fill="${shape.fill}" stroke="${shape.stroke}" stroke-width="${shape.strokeWidth}" ${baseAttrs}/>`;
}

function renderStar(shape: CanvasShape, baseAttrs: string): string {
  const starShape = shape as { numPoints?: number; innerRadius?: number; outerRadius?: number } & CanvasShape;
  const numPoints = starShape.numPoints || 5;
  const cx = shape.x + (shape.width * shape.scaleX) / 2;
  const cy = shape.y + (shape.height * shape.scaleY) / 2;
  const outerRadius = Math.min(shape.width * shape.scaleX, shape.height * shape.scaleY) / 2;
  const innerRadius = outerRadius * 0.4;

  const points: string[] = [];
  for (let i = 0; i < numPoints * 2; i++) {
    const radius = i % 2 === 0 ? outerRadius : innerRadius;
    const angle = (i * Math.PI) / numPoints - Math.PI / 2;
    const x = cx + radius * Math.cos(angle);
    const y = cy + radius * Math.sin(angle);
    points.push(`${x},${y}`);
  }

  return `<polygon points="${points.join(' ')}" fill="${shape.fill}" stroke="${shape.stroke}" stroke-width="${shape.strokeWidth}" ${baseAttrs}/>`;
}

function renderLine(shape: CanvasShape, baseAttrs: string): string {
  const lineShape = shape as { points?: number[] } & CanvasShape;
  const points = lineShape.points || [0, 0, shape.width, shape.height];

  if (points.length >= 4) {
    const x1 = shape.x + points[0];
    const y1 = shape.y + points[1];
    const x2 = shape.x + points[2];
    const y2 = shape.y + points[3];

    return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${shape.stroke}" stroke-width="${shape.strokeWidth}" ${baseAttrs}/>`;
  }

  // If more than 4 points, render as polyline
  const polylinePoints = [];
  for (let i = 0; i < points.length; i += 2) {
    polylinePoints.push(`${shape.x + points[i]},${shape.y + points[i + 1]}`);
  }

  return `<polyline points="${polylinePoints.join(' ')}" fill="none" stroke="${shape.stroke}" stroke-width="${shape.strokeWidth}" ${baseAttrs}/>`;
}

function renderText(shape: TextShape, baseAttrs: string): string {
  const fontWeight = shape.fontStyle.includes('bold') ? 'bold' : 'normal';
  const fontStyle = shape.fontStyle.includes('italic') ? 'italic' : 'normal';
  const textDecoration = shape.textDecoration === 'underline' ? 'text-decoration="underline"' : '';

  // Calculate text anchor based on alignment
  let textAnchor = 'start';
  let xOffset = 0;
  if (shape.textAlign === 'center') {
    textAnchor = 'middle';
    xOffset = (shape.width * shape.scaleX) / 2;
  } else if (shape.textAlign === 'right') {
    textAnchor = 'end';
    xOffset = shape.width * shape.scaleX;
  }

  // Escape special characters
  const escapedText = escapeXml(shape.text);

  return `<text x="${shape.x + xOffset}" y="${shape.y + shape.fontSize}" font-family="${shape.fontFamily}" font-size="${shape.fontSize}" font-weight="${fontWeight}" font-style="${fontStyle}" fill="${shape.fill}" text-anchor="${textAnchor}" ${textDecoration} ${baseAttrs}>${escapedText}</text>`;
}

function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function renderFrame(shape: Frame, baseAttrs: string): string {
  const width = shape.width * shape.scaleX;
  const height = shape.height * shape.scaleY;

  // Frame is rendered as a rectangle with a label
  const rect = `<rect x="${shape.x}" y="${shape.y}" width="${width}" height="${height}" fill="${shape.fill}" stroke="${shape.stroke}" stroke-width="${shape.strokeWidth}" ${baseAttrs}/>`;

  // Add frame name as a label above the frame
  const label = `<text x="${shape.x}" y="${shape.y - 8}" font-family="Arial" font-size="12" fill="#6B7280">${escapeXml(shape.name)}</text>`;

  return `<g class="frame">
    ${label}
    ${rect}
  </g>`;
}

function renderImage(shape: ImageShape, baseAttrs: string): string {
  const width = shape.width * shape.scaleX;
  const height = shape.height * shape.scaleY;

  // Render image with xlink:href for the data URL
  return `<image x="${shape.x}" y="${shape.y}" width="${width}" height="${height}" href="${shape.src}" preserveAspectRatio="xMidYMid slice" ${baseAttrs}/>`;
}

/**
 * Downloads an SVG string as a file
 */
export function downloadSVG(svgString: string, filename: string): void {
  const blob = new Blob([svgString], { type: 'image/svg+xml' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.download = filename;
  link.href = url;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Exports canvas state to JSON format with metadata
 */
export function exportToJSON(
  shapes: Record<string, CanvasShape>,
  canvasId: string,
  metadata?: { name?: string; description?: string }
): string {
  const exportData = {
    version: '1.0',
    exportedAt: new Date().toISOString(),
    canvasId,
    metadata: metadata || {},
    shapes: Object.values(shapes),
    shapeCount: Object.keys(shapes).length,
  };

  return JSON.stringify(exportData, null, 2);
}

/**
 * Downloads canvas state as a JSON file
 */
export function downloadJSON(
  shapes: Record<string, CanvasShape>,
  canvasId: string,
  filename: string,
  metadata?: { name?: string; description?: string }
): void {
  const jsonString = exportToJSON(shapes, canvasId, metadata);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.download = filename.endsWith('.json') ? filename : `${filename}.json`;
  link.href = url;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Downloads canvas as PNG using Konva stage
 */
export function downloadPNG(dataUrl: string, filename: string): void {
  const link = document.createElement('a');
  link.download = filename.endsWith('.png') ? filename : `${filename}.png`;
  link.href = dataUrl;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
