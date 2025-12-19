// Outdoor environment drawing - grass, water, trees, entrance
import { TILE_SIZE } from './types';
import { PALETTE } from './palette';
import { seededRandom, getShadowOffset } from './utils';
import { drawGrassTile, drawWaterTile, drawPathTile, drawWelcomeMat } from './tiles';

type TreeType = 'oak' | 'pine' | 'bush' | 'fruit';

// Draw tree with type, sway animation, and shading
const drawTree = (
  ctx: CanvasRenderingContext2D,
  x: number, y: number,
  type: TreeType,
  seed: number,
  frame: number
) => {
  const swayPhase = (frame * 0.003 + seed * 0.5) % (Math.PI * 2);
  const swayAngle = Math.sin(swayPhase) * 0.008;

  const canopyColors = {
    oak: { darkest: '#308028', dark: '#48A038', base: '#60C048', highlight: '#88E868' },
    pine: { darkest: '#285820', dark: '#408030', base: '#58A040', highlight: '#70B858' },
    bush: { darkest: '#308028', dark: '#48A038', base: '#60C048', highlight: '#88E868' },
    fruit: { darkest: '#308028', dark: '#48A038', base: '#60C048', highlight: '#88E868' },
  };
  const trunkColors = { shadow: '#584028', base: '#785838', highlight: '#987850' };
  const colors = canopyColors[type];

  if (type === 'oak' || type === 'fruit') {
    const shadowDrift = getShadowOffset(frame);
    ctx.fillStyle = 'rgba(40, 60, 30, 0.3)';
    ctx.beginPath();
    ctx.ellipse(x + 16 + shadowDrift.x, y + 42 + shadowDrift.y, 18, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = trunkColors.shadow;
    ctx.fillRect(x + 13, y + 24, 6, 18);
    ctx.fillStyle = trunkColors.base;
    ctx.fillRect(x + 13, y + 24, 4, 17);
    ctx.fillStyle = trunkColors.highlight;
    ctx.fillRect(x + 13, y + 24, 2, 16);

    ctx.fillStyle = trunkColors.shadow;
    ctx.fillRect(x + 11, y + 38, 10, 4);
    ctx.fillStyle = trunkColors.base;
    ctx.fillRect(x + 11, y + 38, 8, 3);

    ctx.save();
    ctx.translate(x + 16, y + 28);
    ctx.rotate(swayAngle);

    ctx.fillStyle = colors.darkest;
    ctx.beginPath();
    ctx.ellipse(2, -10, 14, 12, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = colors.dark;
    ctx.beginPath();
    ctx.ellipse(0, -12, 15, 13, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = colors.base;
    ctx.beginPath();
    ctx.ellipse(-1, -13, 13, 11, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = colors.highlight;
    ctx.beginPath();
    ctx.ellipse(-4, -16, 8, 7, 0, 0, Math.PI * 2);
    ctx.fill();

    if (type === 'fruit') {
      const fruitColors = ['#E85050', '#F86848', '#E83838'];
      for (let i = 0; i < 5; i++) {
        ctx.fillStyle = fruitColors[Math.floor(seededRandom(seed + i * 7) * fruitColors.length)];
        const fx = -8 + seededRandom(seed + i * 11) * 16;
        const fy = -20 + seededRandom(seed + i * 13) * 14;
        ctx.beginPath();
        ctx.arc(fx, fy, 2, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    ctx.restore();

  } else if (type === 'pine') {
    const shadowDrift = getShadowOffset(frame);
    ctx.fillStyle = 'rgba(40, 60, 30, 0.3)';
    ctx.beginPath();
    ctx.ellipse(x + 12 + shadowDrift.x, y + 46 + shadowDrift.y, 12, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = trunkColors.shadow;
    ctx.fillRect(x + 10, y + 30, 4, 16);
    ctx.fillStyle = trunkColors.base;
    ctx.fillRect(x + 10, y + 30, 3, 15);
    ctx.fillStyle = trunkColors.highlight;
    ctx.fillRect(x + 10, y + 30, 1, 14);

    ctx.save();
    ctx.translate(x + 12, y + 32);
    ctx.rotate(swayAngle);

    ctx.fillStyle = colors.darkest;
    ctx.beginPath();
    ctx.moveTo(0, 2);
    ctx.lineTo(-12, 2);
    ctx.lineTo(0, -10);
    ctx.lineTo(12, 2);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = colors.dark;
    ctx.beginPath();
    ctx.moveTo(0, -6);
    ctx.lineTo(-10, -6);
    ctx.lineTo(0, -18);
    ctx.lineTo(10, -6);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = colors.base;
    ctx.beginPath();
    ctx.moveTo(0, -14);
    ctx.lineTo(-7, -14);
    ctx.lineTo(0, -26);
    ctx.lineTo(7, -14);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = colors.highlight;
    ctx.beginPath();
    ctx.moveTo(0, -22);
    ctx.lineTo(-4, -22);
    ctx.lineTo(0, -32);
    ctx.lineTo(4, -22);
    ctx.closePath();
    ctx.fill();

    ctx.restore();

  } else if (type === 'bush') {
    const shadowDrift = getShadowOffset(frame);
    ctx.fillStyle = 'rgba(40, 60, 30, 0.25)';
    ctx.beginPath();
    ctx.ellipse(x + 8 + shadowDrift.x, y + 14 + shadowDrift.y, 10, 3, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.save();
    ctx.translate(x + 8, y + 12);
    ctx.rotate(swayAngle * 0.5);

    ctx.fillStyle = colors.darkest;
    ctx.beginPath();
    ctx.ellipse(1, -3, 9, 7, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = colors.dark;
    ctx.beginPath();
    ctx.ellipse(0, -4, 8, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = colors.base;
    ctx.beginPath();
    ctx.ellipse(-1, -5, 6, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = colors.highlight;
    ctx.beginPath();
    ctx.ellipse(-2, -6, 3, 2, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
};

// Draw the outdoor environment
export const drawOutdoor = (
  ctx: CanvasRenderingContext2D,
  hotelX: number, hotelY: number,
  hotelW: number, hotelH: number,
  frame: number
) => {
  const borderSize = 4;
  const waterWidth = 6;

  const startX = hotelX - borderSize * TILE_SIZE;
  const startY = hotelY - borderSize * TILE_SIZE;
  const totalW = hotelW + (borderSize * 2 + waterWidth) * TILE_SIZE;
  const totalH = hotelH + borderSize * 2 * TILE_SIZE;

  // Draw grass and water tiles
  for (let ty = 0; ty < Math.ceil(totalH / TILE_SIZE) + 2; ty++) {
    for (let tx = 0; tx < Math.ceil(totalW / TILE_SIZE) + 2; tx++) {
      const px = startX + tx * TILE_SIZE;
      const py = startY + ty * TILE_SIZE;
      const seed = tx * 127 + ty * 311;

      const isWaterZone = px >= hotelX + hotelW + borderSize * TILE_SIZE;
      const isInsideHotel = px >= hotelX && px < hotelX + hotelW &&
                           py >= hotelY && py < hotelY + hotelH;

      if (isWaterZone) {
        drawWaterTile(ctx, px, py, seed, frame);
      } else if (!isInsideHotel) {
        drawGrassTile(ctx, px, py, seed, frame);
      }
    }
  }

  // Draw trees
  const treePositions: Array<{ x: number; y: number; type: TreeType; seed: number }> = [
    { x: startX + TILE_SIZE * 0.5, y: startY + TILE_SIZE * 1.5, type: 'oak', seed: 1 },
    { x: startX + TILE_SIZE * 2.5, y: startY + totalH - TILE_SIZE * 4, type: 'pine', seed: 2 },
    { x: hotelX + hotelW + TILE_SIZE * 0.5, y: startY + TILE_SIZE * 2.5, type: 'fruit', seed: 3 },
    { x: startX + TILE_SIZE * 0.3, y: startY + totalH - TILE_SIZE * 2, type: 'bush', seed: 4 },
    { x: hotelX + hotelW + TILE_SIZE * 2, y: startY + totalH - TILE_SIZE * 3, type: 'bush', seed: 5 },
    { x: startX + TILE_SIZE * 1, y: startY + TILE_SIZE * 5, type: 'bush', seed: 6 },
  ];

  treePositions.forEach(pos => drawTree(ctx, pos.x, pos.y, pos.type, pos.seed, frame));

  // Water edge foam
  const foamX = hotelX + hotelW + borderSize * TILE_SIZE;
  ctx.fillStyle = PALETTE.water.foam;
  for (let fy = 0; fy < Math.ceil(totalH / TILE_SIZE); fy++) {
    const py = startY + fy * TILE_SIZE;
    const waveOffset = Math.sin((frame * 0.03) + fy * 0.5) * 3;
    ctx.fillRect(foamX + waveOffset, py, 4, TILE_SIZE);
  }

  // Entrance path
  const pathCenterX = hotelX + hotelW / 2;
  const pathWidth = 3;
  const pathStartY = hotelY + hotelH;
  const pathEndY = startY + totalH;

  for (let py = pathStartY; py < pathEndY; py += TILE_SIZE) {
    for (let px = 0; px < pathWidth; px++) {
      const tileX = pathCenterX - (pathWidth * TILE_SIZE) / 2 + px * TILE_SIZE;
      const seed = px * 127 + py * 311;
      drawPathTile(ctx, tileX, py, seed);
    }
  }

  // Path edge stones
  const edgeStones = [
    { dx: -1.3, dy: 0.5 }, { dx: -1.2, dy: 2.5 }, { dx: -1.1, dy: 4.2 },
    { dx: pathWidth + 0.2, dy: 1.0 }, { dx: pathWidth + 0.3, dy: 3.0 }, { dx: pathWidth + 0.1, dy: 4.8 },
  ];
  ctx.fillStyle = '#A89888';
  edgeStones.forEach((stone, i) => {
    const sx = pathCenterX - (pathWidth * TILE_SIZE) / 2 + stone.dx * TILE_SIZE;
    const sy = pathStartY + stone.dy * TILE_SIZE;
    if (sy < pathEndY - TILE_SIZE) {
      ctx.beginPath();
      ctx.ellipse(sx, sy, 3 + seededRandom(i * 17) * 2, 2 + seededRandom(i * 23) * 1.5, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  });

  // Welcome mat
  const matX = pathCenterX - TILE_SIZE * 1.5;
  const matY = hotelY + hotelH + TILE_SIZE * 0.3;
  drawWelcomeMat(ctx, matX, matY);

  // Main entrance
  drawEntrance(ctx, pathCenterX, hotelY + hotelH);
};

// Draw the grand hotel entrance
const drawEntrance = (ctx: CanvasRenderingContext2D, pathCenterX: number, hotelBottomY: number) => {
  const entranceX = pathCenterX - TILE_SIZE * 2.5;
  const entranceY = hotelBottomY + TILE_SIZE * 2;

  // Awning
  ctx.fillStyle = '#8B2020';
  ctx.fillRect(entranceX - 20, entranceY - 30, TILE_SIZE * 5 + 40, 12);
  ctx.fillStyle = '#A03030';
  ctx.fillRect(entranceX - 20, entranceY - 30, TILE_SIZE * 5 + 40, 4);
  ctx.fillStyle = '#701818';
  ctx.fillRect(entranceX - 20, entranceY - 20, TILE_SIZE * 5 + 40, 2);

  for (let stripe = 0; stripe < 8; stripe++) {
    ctx.fillStyle = stripe % 2 === 0 ? '#C84040' : '#A03030';
    ctx.fillRect(entranceX - 15 + stripe * 16, entranceY - 28, 14, 8);
  }

  // Entrance frame
  ctx.fillStyle = '#D0C8B8';
  ctx.fillRect(entranceX - 10, entranceY - 45, TILE_SIZE * 5 + 20, 50);
  ctx.fillStyle = '#E8E0D0';
  ctx.fillRect(entranceX - 8, entranceY - 43, TILE_SIZE * 5 + 16, 46);
  ctx.fillStyle = '#C8C0B0';
  ctx.fillRect(entranceX - 6, entranceY - 8, TILE_SIZE * 5 + 12, 10);

  // Pillars
  ctx.fillStyle = '#E8E0D0';
  ctx.fillRect(entranceX - 8, entranceY - 43, 8, 48);
  ctx.fillRect(entranceX + TILE_SIZE * 5, entranceY - 43, 8, 48);
  ctx.fillStyle = '#F0E8D8';
  ctx.fillRect(entranceX - 8, entranceY - 43, 4, 46);
  ctx.fillRect(entranceX + TILE_SIZE * 5, entranceY - 43, 4, 46);

  ctx.fillStyle = '#D0C8B8';
  ctx.fillRect(entranceX - 10, entranceY + 2, 12, 6);
  ctx.fillRect(entranceX + TILE_SIZE * 5 - 2, entranceY + 2, 12, 6);
  ctx.fillRect(entranceX - 10, entranceY - 46, 12, 4);
  ctx.fillRect(entranceX + TILE_SIZE * 5 - 2, entranceY - 46, 12, 4);

  // Doors
  const doorWidth = (TILE_SIZE * 5 - 12) / 2;

  // Left door
  ctx.fillStyle = '#8B4513';
  ctx.fillRect(entranceX, entranceY - 38, doorWidth, 40);
  ctx.fillStyle = '#A0522D';
  ctx.fillRect(entranceX + 2, entranceY - 36, doorWidth - 4, 36);
  ctx.fillStyle = '#CD853F';
  ctx.fillRect(entranceX + 4, entranceY - 34, doorWidth - 8, 12);
  ctx.fillRect(entranceX + 4, entranceY - 18, doorWidth - 8, 14);
  ctx.fillStyle = '#DEB887';
  ctx.fillRect(entranceX + 6, entranceY - 32, doorWidth - 12, 4);
  ctx.fillRect(entranceX + 6, entranceY - 16, doorWidth - 12, 4);
  ctx.fillStyle = '#FFD700';
  ctx.fillRect(entranceX + doorWidth - 10, entranceY - 22, 6, 4);
  ctx.fillStyle = '#DAA520';
  ctx.fillRect(entranceX + doorWidth - 10, entranceY - 20, 6, 2);

  // Right door
  ctx.fillStyle = '#8B4513';
  ctx.fillRect(entranceX + doorWidth + 4, entranceY - 38, doorWidth, 40);
  ctx.fillStyle = '#A0522D';
  ctx.fillRect(entranceX + doorWidth + 6, entranceY - 36, doorWidth - 4, 36);
  ctx.fillStyle = '#CD853F';
  ctx.fillRect(entranceX + doorWidth + 8, entranceY - 34, doorWidth - 8, 12);
  ctx.fillRect(entranceX + doorWidth + 8, entranceY - 18, doorWidth - 8, 14);
  ctx.fillStyle = '#DEB887';
  ctx.fillRect(entranceX + doorWidth + 10, entranceY - 32, doorWidth - 12, 4);
  ctx.fillRect(entranceX + doorWidth + 10, entranceY - 16, doorWidth - 12, 4);
  ctx.fillStyle = '#FFD700';
  ctx.fillRect(entranceX + doorWidth + 8, entranceY - 22, 6, 4);
  ctx.fillStyle = '#DAA520';
  ctx.fillRect(entranceX + doorWidth + 8, entranceY - 20, 6, 2);

  // Entrance sign
  ctx.fillStyle = '#2C1810';
  ctx.fillRect(entranceX + TILE_SIZE * 1.5, entranceY - 56, TILE_SIZE * 2, 10);
  ctx.fillStyle = '#FFD700';
  ctx.font = 'bold 8px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('CODEMAP', entranceX + TILE_SIZE * 2.5, entranceY - 49);
  ctx.textAlign = 'left';
};
