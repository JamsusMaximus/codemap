// Room drawing functions - floors, walls, windows, fixtures
import { TILE_SIZE, RoomLayout, TileColors, FloorStyle } from './types';
import { PALETTE } from './palette';
import { seededRandom, adjustBrightness } from './utils';

// Get wall colors based on floor style
export const getWallColors = (floorStyle: FloorStyle): { light: string; mid: string; dark: string; baseboard: string } => {
  switch (floorStyle) {
    case 'green':
      return { light: '#E8F0E8', mid: '#D8E4D8', dark: '#C8D8C8', baseboard: '#5A6A5A' };
    case 'blue':
      return { light: '#E8EDF2', mid: '#D8E0EA', dark: '#C8D4E0', baseboard: '#5A6680' };
    case 'cream':
      return { light: '#F5F0E8', mid: '#E8E0D8', dark: '#DCD4CC', baseboard: '#706050' };
    case 'lavender':
      return { light: '#F0ECF4', mid: '#E4DEE8', dark: '#D8D0DC', baseboard: '#685878' };
    case 'peach':
      return { light: '#F8F0EC', mid: '#ECE0D8', dark: '#E0D4CC', baseboard: '#806050' };
    default:
      return { light: '#F0EBE4', mid: '#E4DDD4', dark: '#D8D0C8', baseboard: '#6A5A4A' };
  }
};

// Draw wood floor with beveled planks
export const drawWoodFloor = (ctx: CanvasRenderingContext2D, room: RoomLayout) => {
  const colors = PALETTE.woodFloor;

  for (let dy = 0; dy < room.height; dy++) {
    for (let dx = 0; dx < room.width; dx++) {
      const px = (room.x + dx) * TILE_SIZE;
      const py = (room.y + dy) * TILE_SIZE;
      const seed = (room.x + dx) * 127 + (room.y + dy) * 311;

      const variant = Math.floor(seededRandom(seed) * 8);
      let variation = 0;
      let hasWeathering = false;
      let hueShift = 0;

      switch (variant) {
        case 0: case 1: case 2: case 3:
          variation = seededRandom(seed + 10) * 0.02 - 0.01;
          break;
        case 4: variation = -0.05; break;
        case 5: variation = 0.05; break;
        case 6: hueShift = 0.02; break;
        case 7: hasWeathering = true; variation = -0.03; break;
      }

      const baseColor = adjustBrightness(colors.base, variation + hueShift);

      ctx.fillStyle = baseColor;
      ctx.fillRect(px + 1, py + 1, TILE_SIZE - 1, TILE_SIZE - 1);

      ctx.fillStyle = colors.highlight;
      ctx.fillRect(px + 1, py + 1, TILE_SIZE - 2, 1);

      const stagger = dy % 2 === 0;
      const isPlankStart = (stagger && dx % 2 === 0) || (!stagger && dx % 2 === 1);
      if (isPlankStart || dx === 0) {
        ctx.fillRect(px + 1, py + 1, 1, TILE_SIZE - 2);
      }

      ctx.fillStyle = colors.shadowDark;
      ctx.fillRect(px + 1, py + TILE_SIZE - 2, TILE_SIZE - 1, 1);
      ctx.fillStyle = colors.shadowLight;
      ctx.fillRect(px + 1, py + TILE_SIZE - 3, TILE_SIZE - 1, 1);

      const isPlankEnd = (stagger && dx % 2 === 1) || (!stagger && dx % 2 === 0);
      if (isPlankEnd) {
        ctx.fillStyle = colors.shadowLight;
        ctx.fillRect(px + TILE_SIZE - 1, py + 1, 1, TILE_SIZE - 2);
      }

      ctx.globalAlpha = 0.12;
      ctx.strokeStyle = colors.shadowLight;
      ctx.lineWidth = 1;

      if (seededRandom(seed + 1) > 0.4) {
        ctx.beginPath();
        const grainY = py + 4 + seededRandom(seed + 2) * 3;
        ctx.moveTo(px + 2, grainY);
        ctx.lineTo(px + TILE_SIZE - 1, grainY + (seededRandom(seed + 3) - 0.5) * 1.5);
        ctx.stroke();
      }
      if (seededRandom(seed + 4) > 0.6) {
        ctx.beginPath();
        const grainY = py + 10 + seededRandom(seed + 5) * 3;
        ctx.moveTo(px + 3, grainY);
        ctx.lineTo(px + TILE_SIZE - 2, grainY + (seededRandom(seed + 6) - 0.5) * 1.5);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;

      if (hasWeathering) {
        ctx.fillStyle = colors.shadowDark;
        ctx.globalAlpha = 0.3;
        const spotX = px + 4 + seededRandom(seed + 20) * 8;
        const spotY = py + 4 + seededRandom(seed + 21) * 8;
        ctx.fillRect(spotX, spotY, 2, 2);
        ctx.globalAlpha = 1;
      }

      ctx.fillStyle = colors.gap;
      ctx.fillRect(px, py, TILE_SIZE, 1);

      if (isPlankStart && dx > 0) {
        ctx.fillRect(px, py, 1, TILE_SIZE);
      }

      ctx.fillStyle = adjustBrightness(colors.gap, -0.1);
      ctx.globalAlpha = 0.5;
      ctx.fillRect(px, py, TILE_SIZE, 1);
      ctx.globalAlpha = 1;
    }
  }
};

// Draw beveled tile floor
export const drawTileFloor = (ctx: CanvasRenderingContext2D, room: RoomLayout, colors: TileColors) => {
  const seed = room.x * 127 + room.y * 311;

  for (let dy = 0; dy < room.height; dy++) {
    for (let dx = 0; dx < room.width; dx++) {
      const px = (room.x + dx) * TILE_SIZE;
      const py = (room.y + dy) * TILE_SIZE;
      const tileSeed = seed + dx * 17 + dy * 31;

      const isAlt = (dx + dy) % 2 === 0;
      const variation = seededRandom(tileSeed) * 0.06 - 0.03;

      const baseColor = isAlt ? colors.base : colors.highlight;
      const tileBase = adjustBrightness(baseColor, variation);

      ctx.fillStyle = tileBase;
      ctx.fillRect(px + 1, py + 1, TILE_SIZE - 2, TILE_SIZE - 2);

      ctx.fillStyle = isAlt ? colors.highlight : adjustBrightness(colors.highlight, 0.05);
      ctx.fillRect(px + 1, py + 1, TILE_SIZE - 2, 1);
      ctx.fillRect(px + 1, py + 1, 1, TILE_SIZE - 2);

      ctx.fillStyle = isAlt ? colors.shadowDark : colors.shadowLight;
      ctx.fillRect(px + 1, py + TILE_SIZE - 3, TILE_SIZE - 2, 2);

      ctx.fillStyle = colors.shadowLight;
      ctx.fillRect(px + TILE_SIZE - 2, py + 1, 1, TILE_SIZE - 3);

      ctx.fillStyle = colors.grout;
      ctx.fillRect(px, py, TILE_SIZE, 1);
      ctx.fillRect(px, py, 1, TILE_SIZE);

      ctx.fillStyle = adjustBrightness(colors.grout, 0.1);
      ctx.globalAlpha = 0.5;
      ctx.fillRect(px + 1, py, TILE_SIZE - 1, 1);
      ctx.globalAlpha = 1;
    }
  }
};

// Get depth-based darkening factor
// Root (depth -1 or 0): 0% darkening
// Level 1: 5% darkening
// Level 2: 10% darkening
// Level 3+: 15% darkening
const getDepthDarkening = (depth: number): number => {
  if (depth <= 0) return 0;
  if (depth === 1) return 0.05;
  if (depth === 2) return 0.10;
  return 0.15;
};

// Draw floor based on style
export const drawFloor = (ctx: CanvasRenderingContext2D, room: RoomLayout) => {
  switch (room.floorStyle) {
    case 'wood': drawWoodFloor(ctx, room); break;
    case 'green': drawTileFloor(ctx, room, PALETTE.greenTile); break;
    case 'blue': drawTileFloor(ctx, room, PALETTE.blueTile); break;
    case 'cream': drawTileFloor(ctx, room, PALETTE.creamTile); break;
    case 'lavender': drawTileFloor(ctx, room, PALETTE.lavenderTile); break;
    case 'peach': drawTileFloor(ctx, room, PALETTE.peachTile); break;
  }

  // Apply depth-based darkening overlay for visual hierarchy
  const darkening = getDepthDarkening(room.depth);
  if (darkening > 0) {
    const px = room.x * TILE_SIZE;
    const py = room.y * TILE_SIZE;
    const w = room.width * TILE_SIZE;
    const h = room.height * TILE_SIZE;
    ctx.fillStyle = `rgba(40, 30, 50, ${darkening})`;
    ctx.fillRect(px, py, w, h);
  }
};

// Draw walls with shadows
export const drawWalls = (ctx: CanvasRenderingContext2D, room: RoomLayout) => {
  const px = room.x * TILE_SIZE;
  const py = room.y * TILE_SIZE;
  const w = room.width * TILE_SIZE;
  const h = room.height * TILE_SIZE;
  const wallH = 16;

  const colors = getWallColors(room.floorStyle);

  ctx.fillStyle = 'rgba(70, 50, 80, 0.1)';
  ctx.fillRect(px + 5, py + 5, w - 5, 8);
  ctx.fillRect(px + 5, py + 5, 10, h - 5);

  ctx.fillStyle = colors.light;
  ctx.fillRect(px, py - wallH, w, wallH);

  ctx.strokeStyle = colors.mid;
  ctx.lineWidth = 1;
  ctx.globalAlpha = 0.25;
  for (let i = 20; i < w; i += 20) {
    ctx.beginPath();
    ctx.moveTo(px + i, py - wallH + 2);
    ctx.lineTo(px + i, py - 2);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;

  ctx.fillStyle = '#FAFAF8';
  ctx.fillRect(px, py - wallH, w, 2);

  ctx.fillStyle = colors.mid;
  ctx.fillRect(px, py - 4, w, 4);
  ctx.fillStyle = colors.dark;
  ctx.fillRect(px, py - 2, w, 2);

  ctx.fillStyle = colors.baseboard;
  ctx.fillRect(px, py, w, 5);
  ctx.fillStyle = adjustBrightness(colors.baseboard, 0.2);
  ctx.fillRect(px, py, w, 1);
  ctx.fillStyle = adjustBrightness(colors.baseboard, -0.1);
  ctx.fillRect(px, py + 4, w, 1);

  ctx.fillStyle = colors.mid;
  ctx.fillRect(px - 12, py - wallH, 12, h + wallH);

  ctx.fillStyle = colors.light;
  ctx.fillRect(px - 12, py - wallH, 2, h + wallH);

  ctx.fillStyle = colors.dark;
  ctx.fillRect(px - 2, py - wallH, 2, h + wallH);

  ctx.globalAlpha = 0.2;
  ctx.strokeStyle = colors.dark;
  for (let i = 20; i < h + wallH; i += 20) {
    ctx.beginPath();
    ctx.moveTo(px - 10, py - wallH + i);
    ctx.lineTo(px - 2, py - wallH + i);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;

  ctx.fillStyle = colors.baseboard;
  ctx.fillRect(px, py, 5, h);
  ctx.fillStyle = adjustBrightness(colors.baseboard, 0.2);
  ctx.fillRect(px, py, 1, h);

  ctx.fillStyle = 'rgba(70, 50, 80, 0.12)';
  ctx.fillRect(px, py, 12, 12);

  const southWallH = 8;
  ctx.fillStyle = colors.dark;
  ctx.fillRect(px, py + h, w, southWallH);
  ctx.fillStyle = colors.baseboard;
  ctx.fillRect(px, py + h, w, 2);
  ctx.fillStyle = adjustBrightness(colors.dark, -0.15);
  ctx.fillRect(px, py + h + southWallH - 2, w, 2);

  const rightWallW = 6;
  ctx.fillStyle = colors.mid;
  ctx.fillRect(px + w, py, rightWallW, h + southWallH);
  ctx.fillStyle = colors.light;
  ctx.fillRect(px + w, py, 1, h);
  ctx.fillStyle = colors.dark;
  ctx.fillRect(px + w + rightWallW - 1, py, 1, h + southWallH);

  ctx.fillStyle = adjustBrightness(colors.dark, -0.2);
  ctx.fillRect(px + w, py + h, rightWallW, southWallH);
};

// Draw windows on exterior walls
export const drawWindows = (ctx: CanvasRenderingContext2D, room: RoomLayout) => {
  if (room.depth !== 0) return;
  const px = room.x * TILE_SIZE;
  const py = room.y * TILE_SIZE;
  const w = room.width * TILE_SIZE;
  const wallH = 16;
  const windowW = 20, windowH = 14;

  const windowCount = Math.min(3, Math.floor(w / 120));
  if (windowCount === 0) return;
  const spacing = w / (windowCount + 1);

  for (let i = 1; i <= windowCount; i++) {
    const wx = px + spacing * i - windowW / 2;
    const windowY = py - wallH + 1;
    ctx.fillStyle = '#E0D8C8';
    ctx.fillRect(wx - 1, windowY - 1, windowW + 2, windowH + 2);
    ctx.fillStyle = '#A8D0E8';
    ctx.fillRect(wx, windowY, windowW, windowH);
    ctx.fillStyle = 'rgba(255, 255, 240, 0.4)';
    ctx.fillRect(wx + 4, windowY + 3, windowW - 8, windowH - 6);
    ctx.fillStyle = '#D0C8B8';
    ctx.fillRect(wx + windowW / 2 - 1, windowY, 2, windowH);
    ctx.fillRect(wx, windowY + windowH / 2 - 1, windowW, 2);
    ctx.fillStyle = '#B8B0A0';
    ctx.fillRect(wx, windowY + windowH - 1, windowW, 1);
    ctx.fillRect(wx + windowW - 1, windowY, 1, windowH);
  }
};

// Draw light fixtures on walls
export const drawLightFixtures = (ctx: CanvasRenderingContext2D, room: RoomLayout) => {
  const px = room.x * TILE_SIZE;
  const py = room.y * TILE_SIZE;
  const w = room.width * TILE_SIZE;
  const wallH = 16;

  for (let fx = px + 28; fx < px + w - 20; fx += 56) {
    const fixtureY = py - wallH + 3;
    ctx.fillStyle = '#E8E0D0';
    ctx.fillRect(fx, fixtureY, 6, 3);
    ctx.fillStyle = '#F8F0E0';
    ctx.fillRect(fx, fixtureY, 6, 1);
    ctx.fillStyle = 'rgba(255, 248, 224, 0.08)';
    ctx.beginPath();
    ctx.moveTo(fx, fixtureY + 3);
    ctx.lineTo(fx - 6, py + 6);
    ctx.lineTo(fx + 12, py + 6);
    ctx.lineTo(fx + 6, fixtureY + 3);
    ctx.closePath();
    ctx.fill();
  }
};

// Draw room lighting (no-op for performance)
export const drawRoomLighting = (_ctx: CanvasRenderingContext2D, _room: RoomLayout) => {
  // No-op for performance
};
