// Utility functions for drawing
import { FloorStyle } from './types';

// Seeded random number generator
export const seededRandom = (seed: number): number => {
  const x = Math.sin(seed * 9999) * 10000;
  return x - Math.floor(x);
};

// Shadow drift - simulates slow sun movement (1-2px over ~45 seconds)
export const getShadowOffset = (frame: number): { x: number; y: number } => {
  const cycleFrames = 2700; // ~45 seconds at 60fps
  const progress = (frame % cycleFrames) / cycleFrames;
  const angle = progress * Math.PI * 2;
  return {
    x: Math.sin(angle) * 1.5,
    y: Math.cos(angle) * 0.8,
  };
};

// Get floor style based on folder name
export const getFloorStyle = (name: string, depth: number): FloorStyle => {
  const lowerName = name.toLowerCase();
  if (depth === 0) return 'wood';
  if (lowerName.includes('client')) return 'green';
  if (lowerName.includes('server')) return 'blue';
  if (lowerName.includes('src')) return 'cream';
  if (lowerName.includes('component') || lowerName.includes('hook') || lowerName.includes('util')) return 'lavender';
  if (lowerName.includes('hooks')) return 'peach';
  const styles: FloorStyle[] = ['wood', 'green', 'blue', 'cream', 'lavender'];
  return styles[depth % styles.length];
};

// Adjust brightness of hex color
export function adjustBrightness(hex: string, percent: number): string {
  const num = parseInt(hex.slice(1), 16);
  const r = Math.min(255, Math.max(0, (num >> 16) + Math.round(255 * percent)));
  const g = Math.min(255, Math.max(0, ((num >> 8) & 0x00FF) + Math.round(255 * percent)));
  const b = Math.min(255, Math.max(0, (num & 0x0000FF) + Math.round(255 * percent)));
  return `#${(r << 16 | g << 8 | b).toString(16).padStart(6, '0')}`;
}

// Shift hue, saturation, and lightness of hex color
export function adjustHSL(hex: string, hueDeg: number, satPercent: number, lightPercent: number): string {
  const num = parseInt(hex.slice(1), 16);
  let r = (num >> 16) / 255;
  let g = ((num >> 8) & 0xFF) / 255;
  let b = (num & 0xFF) / 255;

  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0, l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }

  h = (h + hueDeg / 360) % 1;
  if (h < 0) h += 1;
  s = Math.min(1, Math.max(0, s + satPercent / 100));
  l = Math.min(1, Math.max(0, l + lightPercent / 100));

  const hue2rgb = (p: number, q: number, t: number) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1/6) return p + (q - p) * 6 * t;
    if (t < 1/2) return q;
    if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
    return p;
  };

  if (s === 0) {
    r = g = b = l;
  } else {
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1/3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1/3);
  }

  return `#${(Math.round(r * 255) << 16 | Math.round(g * 255) << 8 | Math.round(b * 255)).toString(16).padStart(6, '0')}`;
}
