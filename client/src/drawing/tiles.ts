// Tile drawing functions for grass, water, path
// Used for outdoor environment around the hotel
import { TILE_SIZE } from './types';
import { PALETTE } from './palette';
import { seededRandom, adjustBrightness } from './utils';

// Draw grass tile with variants and animation
export const drawGrassTile = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  seed: number,
  frame: number
) => {
  const colors = PALETTE.grass;
  const roll = seededRandom(seed);

  let variant: number;
  if (roll < 0.55) variant = 1;      // Plain grass (55%)
  else if (roll < 0.72) variant = 2; // Light grass (17%)
  else if (roll < 0.85) variant = 3; // Dark grass (13%)
  else if (roll < 0.94) variant = 4; // Flower (9%)
  else if (roll < 0.97) variant = 5; // Mushroom (3% - reduced)
  else variant = 6;                  // Rock (3%)

  // PERFORMANCE: Only animate 25% of tiles
  const shouldAnimate = (seed % 4) === 0;
  const slowFrame = Math.floor(frame / 3);
  const tilePhaseOffset = seededRandom(seed) * Math.PI * 2;
  const swayPhase = shouldAnimate ? (slowFrame * 0.08 + tilePhaseOffset) % (Math.PI * 2) : tilePhaseOffset;
  const swayOffset = Math.sin(swayPhase) * 1.5;

  let baseColor = colors.base;
  if (variant === 2) baseColor = '#90E068';
  else if (variant === 3) baseColor = '#58A030';

  ctx.fillStyle = baseColor;
  ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);

  // Grass tufts (simplified - fewer and sparser)
  ctx.fillStyle = colors.darkest;
  ctx.globalAlpha = 0.45;

  if (seededRandom(seed + 1) > 0.5) {
    ctx.fillRect(x + 2 + swayOffset, y + 4, 2, 7);
  }
  if (seededRandom(seed + 2) > 0.5) {
    ctx.fillRect(x + 11 + swayOffset, y + 3, 2, 8);
  }
  ctx.globalAlpha = 1;

  // Light highlights
  ctx.fillStyle = colors.light;
  ctx.globalAlpha = 0.5;
  if (seededRandom(seed + 4) > 0.45) ctx.fillRect(x + 4, y, 5, 4);
  if (seededRandom(seed + 5) > 0.55) ctx.fillRect(x + 8, y + 9, 5, 4);
  ctx.globalAlpha = 1;

  // Flower variant
  if (variant === 4) {
    const flowerColors = ['#FF5080', '#FFD020', '#6090FF'];
    const fc = flowerColors[Math.floor(seededRandom(seed + 10) * flowerColors.length)];
    ctx.fillStyle = '#308020';
    ctx.fillRect(x + 6, y + 6, 2, 8);
    ctx.fillStyle = '#48A030';
    ctx.fillRect(x + 3, y + 8, 4, 2);
    ctx.fillRect(x + 7, y + 9, 4, 2);
    ctx.fillStyle = fc;
    ctx.fillRect(x + 4, y, 7, 7);
    ctx.fillStyle = '#FFE040';
    ctx.fillRect(x + 5, y + 1, 5, 5);
    ctx.fillStyle = '#D07010';
    ctx.fillRect(x + 6, y + 2, 3, 3);
  }

  // Mushroom variant
  if (variant === 5) {
    ctx.fillStyle = 'rgba(40, 30, 20, 0.35)';
    ctx.beginPath();
    ctx.ellipse(x + 8, y + 14, 6, 2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#F8F0E8';
    ctx.fillRect(x + 5, y + 7, 5, 7);
    ctx.fillStyle = '#E8E0D8';
    ctx.fillRect(x + 9, y + 7, 1, 7);
    ctx.fillStyle = '#D83020';
    ctx.beginPath();
    ctx.ellipse(x + 8, y + 5, 7, 6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#F04030';
    ctx.fillRect(x + 3, y + 2, 6, 3);
    ctx.fillStyle = '#FFF8F0';
    ctx.fillRect(x + 4, y + 2, 3, 3);
    ctx.fillRect(x + 9, y + 3, 3, 3);
    ctx.fillRect(x + 6, y + 6, 2, 2);
  }

  // Rock variant
  if (variant === 6) {
    ctx.fillStyle = 'rgba(60, 50, 40, 0.4)';
    ctx.beginPath();
    ctx.ellipse(x + 8, y + 14, 7, 2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#807870';
    ctx.fillRect(x + 1, y + 4, 14, 9);
    ctx.fillRect(x + 2, y + 3, 12, 10);
    ctx.fillStyle = '#A8A098';
    ctx.fillRect(x + 2, y + 3, 9, 3);
    ctx.fillRect(x + 1, y + 4, 3, 6);
    ctx.fillStyle = '#585850';
    ctx.fillRect(x + 4, y + 11, 10, 2);
    ctx.fillRect(x + 12, y + 6, 3, 6);
    ctx.fillStyle = '#406030';
    ctx.fillRect(x + 4, y + 7, 4, 3);
  }
};

// Draw water tile with waves
export const drawWaterTile = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  seed: number,
  frame: number
) => {
  const colors = PALETTE.water;
  const slowFrame = Math.floor(frame / 2);

  ctx.fillStyle = colors.deep;
  ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);

  const waveOffset = Math.sin((slowFrame * 0.04) + seed * 0.1) * 2;
  ctx.fillStyle = colors.mid;
  ctx.fillRect(x, y + 4 + waveOffset, TILE_SIZE, 4);
  ctx.fillStyle = colors.light;
  ctx.fillRect(x, y + 10 + waveOffset * 0.7, TILE_SIZE, 3);

  if (seededRandom(seed + 20) > 0.95) {
    const sparkleVisible = Math.sin(slowFrame * 0.08 + seed) > 0.8;
    if (sparkleVisible) {
      ctx.fillStyle = colors.highlight;
      ctx.fillRect(x + 5 + seededRandom(seed + 21) * 6, y + 3 + seededRandom(seed + 22) * 8, 2, 2);
    }
  }
};

// Draw cobblestone path tile
export const drawPathTile = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  seed: number
) => {
  ctx.fillStyle = '#B8A898';
  ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);

  const stonePositions = [
    { sx: 1, sy: 1, sw: 6, sh: 6 },
    { sx: 8, sy: 1, sw: 7, sh: 5 },
    { sx: 1, sy: 8, sw: 5, sh: 7 },
    { sx: 7, sy: 7, sw: 8, sh: 8 },
  ];

  stonePositions.forEach((stone, i) => {
    const variation = seededRandom(seed + i * 17) * 0.1 - 0.05;
    const stoneColor = adjustBrightness('#C8B8A8', variation);
    ctx.fillStyle = stoneColor;
    ctx.fillRect(x + stone.sx, y + stone.sy, stone.sw, stone.sh);
    ctx.fillStyle = adjustBrightness(stoneColor, 0.12);
    ctx.fillRect(x + stone.sx, y + stone.sy, stone.sw, 1);
    ctx.fillRect(x + stone.sx, y + stone.sy, 1, stone.sh);
    ctx.fillStyle = adjustBrightness(stoneColor, -0.1);
    ctx.fillRect(x + stone.sx, y + stone.sy + stone.sh - 1, stone.sw, 1);
    ctx.fillRect(x + stone.sx + stone.sw - 1, y + stone.sy, 1, stone.sh);
  });

  ctx.fillStyle = '#988878';
  ctx.fillRect(x + 7, y, 1, TILE_SIZE);
  ctx.fillRect(x, y + 7, TILE_SIZE, 1);
};

// Draw welcome mat at entrance
export const drawWelcomeMat = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number
) => {
  const matW = TILE_SIZE * 3;
  const matH = TILE_SIZE * 1.5;

  ctx.fillStyle = 'rgba(60, 40, 20, 0.2)';
  ctx.fillRect(x + 2, y + 2, matW, matH);

  ctx.fillStyle = '#8B4040';
  ctx.fillRect(x, y, matW, matH);

  ctx.fillStyle = '#A85050';
  ctx.fillRect(x, y, matW, 2);
  ctx.fillRect(x, y, 2, matH);
  ctx.fillStyle = '#703030';
  ctx.fillRect(x, y + matH - 2, matW, 2);
  ctx.fillRect(x + matW - 2, y, 2, matH);

  ctx.fillStyle = '#A86060';
  ctx.fillRect(x + matW/2 - 8, y + matH/2 - 3, 16, 6);
  ctx.fillStyle = '#C87070';
  ctx.fillRect(x + matW/2 - 4, y + matH/2 - 1, 8, 2);

  ctx.fillStyle = '#A85050';
  for (let fx = 0; fx < matW; fx += 4) {
    ctx.fillRect(x + fx + 1, y + matH, 2, 3);
  }
};
