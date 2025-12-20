// Furniture drawing functions - desks, chairs, labels, decorations
import { TILE_SIZE, FileLayout, RoomLayout, ScreenFlash } from './types';
import { PALETTE } from './palette';
import { seededRandom, adjustBrightness, adjustHSL, getShadowOffset } from './utils';
import { calculateFlashOpacity, isFlashExpired } from '../utils/screen-flash';

// Draw desk with monitor, chair, and accessories
export const drawDesk = (
  ctx: CanvasRenderingContext2D,
  file: FileLayout,
  now: number,
  frame: number,
  screenFlashes: Map<string, ScreenFlash>
) => {
  const px = file.x * TILE_SIZE;
  const py = file.y * TILE_SIZE;

  const deskColors = [PALETTE.desk.light, PALETTE.desk.white, PALETTE.desk.metal];
  const deskColor = deskColors[file.deskStyle];
  const deskHighlight = adjustBrightness(deskColor, 0.1);
  const deskShadowLight = adjustBrightness(deskColor, -0.1);
  const deskShadowDark = adjustBrightness(deskColor, -0.2);

  const shadowDrift = getShadowOffset(frame);

  // Desk shadow - simple ellipse
  const shadowX = px + TILE_SIZE * 1.5 + shadowDrift.x;
  const shadowY = py + TILE_SIZE * 2.6 + shadowDrift.y;
  ctx.fillStyle = 'rgba(70, 50, 80, 0.15)';
  ctx.beginPath();
  ctx.ellipse(shadowX, shadowY, TILE_SIZE * 1.4, 6, 0, 0, Math.PI * 2);
  ctx.fill();

  // Desk legs/underside
  ctx.fillStyle = deskShadowDark;
  ctx.fillRect(px + 6, py + TILE_SIZE + 14, TILE_SIZE * 3 - 12, TILE_SIZE - 8);

  // Desk top surface
  ctx.fillStyle = deskColor;
  ctx.fillRect(px + 2, py + TILE_SIZE + 6, TILE_SIZE * 3 - 4, 10);

  // Desk top highlight
  ctx.fillStyle = deskHighlight;
  ctx.fillRect(px + 2, py + TILE_SIZE + 6, TILE_SIZE * 3 - 4, 2);
  ctx.fillRect(px + 2, py + TILE_SIZE + 6, 2, 10);

  // Desk front edge
  ctx.fillStyle = deskShadowLight;
  ctx.fillRect(px + 2, py + TILE_SIZE + 14, TILE_SIZE * 3 - 4, 4);
  ctx.fillStyle = deskShadowDark;
  ctx.fillRect(px + 2, py + TILE_SIZE + 17, TILE_SIZE * 3 - 4, 1);
  ctx.fillStyle = deskColor;
  ctx.fillRect(px + 2, py + TILE_SIZE + 14, TILE_SIZE * 3 - 4, 1);

  // Monitor
  const monX = px + TILE_SIZE * 0.5;
  const monY = py + 2;
  const monW = TILE_SIZE * 2;
  const monH = TILE_SIZE * 1.4;

  // Monitor shadow
  ctx.fillStyle = 'rgba(70, 50, 80, 0.2)';
  ctx.fillRect(monX + 3, monY + 3, monW, monH);

  // Monitor frame
  ctx.fillStyle = '#484848';
  ctx.fillRect(monX, monY, monW, monH);
  ctx.fillStyle = '#585858';
  ctx.fillRect(monX, monY, monW, 2);
  ctx.fillRect(monX, monY, 2, monH);
  ctx.fillStyle = '#383838';
  ctx.fillRect(monX, monY + monH - 2, monW, 2);
  ctx.fillRect(monX + monW - 2, monY, 2, monH);

  // Screen
  const screenX = monX + 3;
  const screenY = monY + 3;
  const screenW = monW - 6;
  const screenH = monH - 6;

  // Check for fading flash (5s hold + 3s fade) - uses tested utility functions
  const flash = screenFlashes.get(file.id);
  let flashOpacity = 0;
  let flashType: 'read' | 'write' | 'search' | 'bash' | null = null;
  if (flash) {
    if (isFlashExpired(flash, now)) {
      screenFlashes.delete(file.id);
    } else {
      flashOpacity = calculateFlashOpacity(flash, now);
      flashType = flash.type;
    }
  }

  // Heat glow - subtle ambient glow based on activity frequency
  if (file.heatLevel > 0 && !file.isActive && flashOpacity <= 0) {
    const heatAlpha = file.heatLevel * 0.15;  // Max 0.15 opacity for subtlety
    const heatSize = 4 + file.heatLevel * 8;  // Glow size grows with heat
    ctx.fillStyle = `rgba(255, 140, 50, ${heatAlpha})`;
    ctx.fillRect(monX - heatSize, monY - heatSize, monW + heatSize * 2, monH + heatSize * 2);
  }

  // Screen glow when active or fading
  if (file.isWriting) {
    ctx.fillStyle = 'rgba(50, 255, 50, 0.3)';
    ctx.fillRect(monX - 8, monY - 8, monW + 16, monH + 16);
  } else if (file.isActive) {
    ctx.fillStyle = 'rgba(255, 230, 50, 0.3)';
    ctx.fillRect(monX - 8, monY - 8, monW + 16, monH + 16);
  } else if (flashOpacity > 0) {
    const alpha = 0.3 * flashOpacity;
    const glowColor = flashType === 'write' ? `rgba(50, 255, 50, ${alpha})` :
                      (flashType === 'search' || flashType === 'bash') ? `rgba(255, 255, 255, ${alpha})` :
                      `rgba(255, 230, 50, ${alpha})`;
    ctx.fillStyle = glowColor;
    ctx.fillRect(monX - 8, monY - 8, monW + 16, monH + 16);
  }

  // Screen fill
  if (file.isWriting) {
    ctx.fillStyle = '#40FF40';
  } else if (file.isActive) {
    ctx.fillStyle = '#FFEE00';
  } else if (flashOpacity > 0) {
    const darkR = 40, darkG = 45, darkB = 50;
    if (flashType === 'write') {
      // Green for writes
      const r = Math.round(64 * flashOpacity + darkR * (1 - flashOpacity));
      const g = Math.round(255 * flashOpacity + darkG * (1 - flashOpacity));
      const b = Math.round(64 * flashOpacity + darkB * (1 - flashOpacity));
      ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
    } else if (flashType === 'search' || flashType === 'bash') {
      // White for searches (Grep/Glob) and Bash commands
      const r = Math.round(255 * flashOpacity + darkR * (1 - flashOpacity));
      const g = Math.round(255 * flashOpacity + darkG * (1 - flashOpacity));
      const b = Math.round(255 * flashOpacity + darkB * (1 - flashOpacity));
      ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
    } else {
      // Yellow for reads
      const r = Math.round(255 * flashOpacity + darkR * (1 - flashOpacity));
      const g = Math.round(238 * flashOpacity + darkG * (1 - flashOpacity));
      const b = Math.round(0 * flashOpacity + darkB * (1 - flashOpacity));
      ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
    }
  } else {
    ctx.fillStyle = '#282D32';
  }
  ctx.fillRect(screenX, screenY, screenW, screenH);

  // Screen inner shadow
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.fillRect(screenX, screenY, screenW, 1);
  ctx.fillRect(screenX, screenY, 1, screenH);

  // Screen content lines
  if (!file.isActive && flashOpacity < 0.3) {
    ctx.fillStyle = '#3A4248';
    ctx.fillRect(screenX + 2, screenY + 3, screenW - 8, 2);
    ctx.fillRect(screenX + 2, screenY + 7, screenW - 4, 2);
    ctx.fillRect(screenX + 2, screenY + 11, screenW - 10, 2);

    const cursorOn = frame % 60 < 30;
    if (cursorOn) {
      ctx.fillStyle = '#68B0A0';
      ctx.fillRect(screenX + 4, screenY + 14, 2, 4);
    }
  }

  // Screen glare
  ctx.fillStyle = file.isActive || flashOpacity > 0.3 ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.15)';
  ctx.fillRect(screenX, screenY, screenW, 2);

  // Monitor stand
  ctx.fillStyle = '#484848';
  ctx.fillRect(monX + monW/2 - 4, monY + monH, 8, 6);
  ctx.fillStyle = '#585858';
  ctx.fillRect(monX + monW/2 - 4, monY + monH, 8, 1);
  ctx.fillStyle = '#383838';
  ctx.fillRect(monX + monW/2 - 8, monY + monH + 5, 16, 3);
  ctx.fillStyle = '#484848';
  ctx.fillRect(monX + monW/2 - 8, monY + monH + 5, 16, 1);

  // Paper stack
  const paperX = px + TILE_SIZE * 2.3;
  const paperY = py + TILE_SIZE + 2;
  const paperFlutter = seededRandom(Math.floor(frame / 180) + file.deskStyle) < 0.3;
  const flutterOffset = paperFlutter ? Math.sin(frame * 0.15) * 0.5 : 0;
  ctx.fillStyle = '#E8E4DC';
  ctx.fillRect(paperX + flutterOffset, paperY + 2, 8, 6);
  ctx.fillStyle = '#F0ECE4';
  ctx.fillRect(paperX + 0.5 + flutterOffset * 0.7, paperY + 1, 8, 6);
  ctx.fillStyle = '#F8F4EC';
  ctx.fillRect(paperX + 1 + flutterOffset * 0.3, paperY, 8, 6);
  ctx.fillStyle = '#C8C4BC';
  ctx.fillRect(paperX + 2 + flutterOffset * 0.3, paperY + 1, 5, 1);
  ctx.fillRect(paperX + 2 + flutterOffset * 0.3, paperY + 3, 4, 1);

  // Pencil cup
  const cupX = px + 6;
  const cupY = py + TILE_SIZE;
  ctx.fillStyle = '#585860';
  ctx.fillRect(cupX, cupY + 2, 6, 8);
  ctx.fillStyle = '#686870';
  ctx.fillRect(cupX, cupY + 2, 6, 2);
  ctx.fillStyle = '#484850';
  ctx.fillRect(cupX, cupY + 8, 6, 2);
  ctx.fillStyle = '#E8C060';
  ctx.fillRect(cupX + 1, cupY - 2, 2, 5);
  ctx.fillStyle = '#F8D870';
  ctx.fillRect(cupX + 1, cupY - 2, 1, 4);
  ctx.fillStyle = '#C8A848';
  ctx.fillRect(cupX + 1, cupY - 3, 2, 2);
  ctx.fillStyle = '#383030';
  ctx.fillRect(cupX + 1, cupY - 4, 1, 2);
  ctx.fillStyle = '#C84040';
  ctx.fillRect(cupX + 3, cupY - 1, 2, 4);
  ctx.fillStyle = '#E85050';
  ctx.fillRect(cupX + 3, cupY - 1, 1, 3);

  // Chair shadow
  ctx.fillStyle = 'rgba(70, 50, 80, 0.2)';
  ctx.beginPath();
  ctx.ellipse(px + TILE_SIZE * 1.5, py + TILE_SIZE * 2.9, 8, 4, 0, 0, Math.PI * 2);
  ctx.fill();

  // Chair seat
  const chairX = px + TILE_SIZE * 1.5;
  const chairY = py + TILE_SIZE * 2.8;
  ctx.fillStyle = '#454555';
  ctx.beginPath();
  ctx.ellipse(chairX, chairY, 7, 5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#555565';
  ctx.beginPath();
  ctx.ellipse(chairX - 1, chairY - 1, 5, 3, 0, 0, Math.PI * 2);
  ctx.fill();

  // Chair back
  ctx.fillStyle = '#454555';
  ctx.fillRect(chairX - 5, chairY - 10, 10, 8);
  ctx.fillStyle = '#555565';
  ctx.fillRect(chairX - 4, chairY - 9, 8, 2);
  ctx.fillStyle = '#353545';
  ctx.fillRect(chairX - 5, chairY - 3, 10, 1);
};

// Draw file label
export const drawLabel = (ctx: CanvasRenderingContext2D, file: FileLayout) => {
  const px = file.x * TILE_SIZE + TILE_SIZE * 1.5;
  const py = file.y * TILE_SIZE + TILE_SIZE * 3 + 4;

  ctx.font = '9px monospace';
  const text = file.name;
  const tw = ctx.measureText(text).width;
  const padX = 6;
  const height = 14;
  const width = tw + padX * 2;

  ctx.fillStyle = 'rgba(0, 0, 0, 0.12)';
  ctx.beginPath();
  ctx.roundRect(px - width/2 + 1, py + 2, width, height, 4);
  ctx.fill();

  ctx.fillStyle = file.isActive
    ? (file.isWriting ? 'rgba(255, 245, 220, 0.98)' : 'rgba(245, 250, 255, 0.98)')
    : 'rgba(255, 252, 245, 0.95)';
  ctx.beginPath();
  ctx.roundRect(px - width/2, py, width, height, 4);
  ctx.fill();

  ctx.strokeStyle = file.isActive
    ? (file.isWriting ? '#E8B84A' : '#7AA8D0')
    : '#C4B89C';
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.textAlign = 'center';
  ctx.fillStyle = file.isActive
    ? (file.isWriting ? '#8B6914' : '#3A6A9A')
    : '#4A4A48';
  ctx.fillText(text, px, py + 10);
};

// Draw rug under desk cluster
export const drawRug = (ctx: CanvasRenderingContext2D, room: RoomLayout) => {
  if (room.files.length === 0) return;

  const minX = Math.min(...room.files.map(f => f.x));
  const maxX = Math.max(...room.files.map(f => f.x));
  const minY = Math.min(...room.files.map(f => f.y));
  const maxY = Math.max(...room.files.map(f => f.y));

  const px = (minX - 0.5) * TILE_SIZE;
  const py = (minY - 0.3) * TILE_SIZE;
  const w = (maxX - minX + 4) * TILE_SIZE;
  const h = (maxY - minY + 4.5) * TILE_SIZE;

  const floorColors: Record<string, string> = {
    green: PALETTE.greenTile.base,
    blue: PALETTE.blueTile.base,
    cream: PALETTE.creamTile.base,
    lavender: PALETTE.lavenderTile.base,
    peach: PALETTE.peachTile.base,
    wood: PALETTE.woodFloor.base,
  };
  const floorBase = floorColors[room.floorStyle] || PALETTE.woodFloor.base;
  const rugColor = adjustHSL(floorBase, 15, 10, -10);
  const rugBorder = adjustHSL(floorBase, 15, 10, -18);
  const rugStripe = adjustHSL(floorBase, 15, 5, -14);

  ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
  ctx.beginPath();
  ctx.roundRect(px + 2, py + 2, w, h, 4);
  ctx.fill();

  ctx.fillStyle = rugColor;
  ctx.beginPath();
  ctx.roundRect(px, py, w, h, 4);
  ctx.fill();

  ctx.strokeStyle = rugBorder;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(px + 1, py + 1, w - 2, h - 2, 3);
  ctx.stroke();

  ctx.strokeStyle = rugStripe;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(px + 8, py + 8, w - 16, h - 16, 2);
  ctx.stroke();
  ctx.lineWidth = 1;
};

// Draw cable runs from desks to walls
export const drawCableRuns = (ctx: CanvasRenderingContext2D, room: RoomLayout) => {
  if (room.files.length === 0) return;

  ctx.strokeStyle = '#606060';
  ctx.lineWidth = 2;

  room.files.forEach((file, i) => {
    const deskX = file.x * TILE_SIZE + TILE_SIZE * 1.5;
    const deskY = file.y * TILE_SIZE + TILE_SIZE * 2;
    const wallY = room.y * TILE_SIZE + 8;
    const seed = file.x * 31 + file.y * 73 + i * 17;

    ctx.beginPath();
    ctx.moveTo(deskX, deskY);

    const midY = (deskY + wallY) / 2;
    const wave1 = seededRandom(seed) * 6 - 3;
    const wave2 = seededRandom(seed + 1) * 6 - 3;

    ctx.bezierCurveTo(
      deskX + wave1, midY,
      deskX + wave2, midY - 10,
      deskX + wave2, wallY
    );
    ctx.stroke();
  });

  ctx.lineWidth = 1;
};

// Draw floor vents near walls
export const drawFloorVents = (ctx: CanvasRenderingContext2D, room: RoomLayout) => {
  if (room.width < 6 || room.height < 6) return;

  const seed = room.x * 127 + room.y * 311;
  const ventCount = room.width > 12 ? 2 : 1;

  for (let v = 0; v < ventCount; v++) {
    const ventX = room.x * TILE_SIZE + 16 + seededRandom(seed + v * 100) * (room.width * TILE_SIZE - 48);
    const ventY = room.y * TILE_SIZE + room.height * TILE_SIZE - 20;

    ctx.fillStyle = '#505050';
    ctx.fillRect(ventX, ventY, 12, 6);

    ctx.fillStyle = '#383838';
    for (let s = 0; s < 3; s++) {
      ctx.fillRect(ventX + 1, ventY + 1 + s * 2, 10, 1);
    }

    ctx.fillStyle = '#686868';
    ctx.fillRect(ventX, ventY, 12, 1);
  }
};

// Draw scatter - plants, decorations, small items
export const drawScatter = (
  ctx: CanvasRenderingContext2D,
  room: RoomLayout,
  density: 'low' | 'medium' | 'medium-high' | 'high' = 'medium'
) => {
  const seed = room.x * 73 + room.y * 137;
  const plantVariant = Math.floor(seededRandom(seed + 300) * 4);
  const densityThreshold = density === 'low' ? 0.7 : density === 'medium' ? 0.4 : density === 'medium-high' ? 0.25 : 0.15;

  // Plant in corner
  if (room.width >= 8 && seededRandom(seed + 300) > densityThreshold) {
    const plantX = (room.x + room.width - 1.5) * TILE_SIZE;
    const plantY = (room.y + 1) * TILE_SIZE;

    ctx.fillStyle = PALETTE.shadow;
    ctx.beginPath();
    ctx.ellipse(plantX + 8, plantY + 22, 8, 3, 0, 0, Math.PI * 2);
    ctx.fill();

    if (plantVariant === 0) {
      ctx.fillStyle = '#A07050';
      ctx.fillRect(plantX + 2, plantY + 14, 12, 8);
      ctx.fillStyle = '#B08060';
      ctx.fillRect(plantX, plantY + 12, 16, 4);
      ctx.fillStyle = PALETTE.green.dark;
      ctx.beginPath();
      ctx.ellipse(plantX + 8, plantY + 6, 10, 8, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = PALETTE.green.base;
      ctx.beginPath();
      ctx.ellipse(plantX + 6, plantY + 4, 6, 5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = PALETTE.green.light;
      ctx.beginPath();
      ctx.ellipse(plantX + 10, plantY + 3, 4, 3, 0, 0, Math.PI * 2);
      ctx.fill();
    } else if (plantVariant === 1) {
      ctx.fillStyle = '#E8E0D8';
      ctx.fillRect(plantX + 3, plantY + 14, 10, 8);
      ctx.fillStyle = '#F0E8E0';
      ctx.fillRect(plantX + 2, plantY + 12, 12, 3);
      ctx.fillStyle = '#58A048';
      ctx.fillRect(plantX + 5, plantY + 2, 6, 12);
      ctx.fillStyle = '#68B058';
      ctx.fillRect(plantX + 5, plantY + 2, 3, 11);
      ctx.fillStyle = '#58A048';
      ctx.fillRect(plantX + 2, plantY + 5, 4, 4);
      ctx.fillRect(plantX + 10, plantY + 7, 4, 3);
    } else if (plantVariant === 2) {
      ctx.fillStyle = '#C8B8A0';
      ctx.fillRect(plantX + 3, plantY + 14, 10, 8);
      ctx.fillStyle = '#D8C8B0';
      ctx.fillRect(plantX + 2, plantY + 12, 12, 3);
      ctx.fillStyle = '#487038';
      ctx.fillRect(plantX + 4, plantY - 2, 3, 16);
      ctx.fillRect(plantX + 8, plantY + 0, 3, 14);
      ctx.fillRect(plantX + 6, plantY + 2, 2, 12);
      ctx.fillStyle = '#588048';
      ctx.fillRect(plantX + 4, plantY - 2, 1, 15);
      ctx.fillRect(plantX + 8, plantY + 0, 1, 13);
    } else {
      ctx.fillStyle = '#8A7060';
      ctx.fillRect(plantX + 3, plantY + 14, 10, 8);
      ctx.fillStyle = '#9A8070';
      ctx.fillRect(plantX + 2, plantY + 12, 12, 3);
      ctx.fillStyle = PALETTE.green.dark;
      ctx.beginPath();
      ctx.ellipse(plantX + 8, plantY + 8, 8, 6, 0, 0, Math.PI * 2);
      ctx.fill();
      const flowerColors = ['#F8A0A0', '#F8D888', '#A8C8F8', '#E8A8E8'];
      flowerColors.forEach((color, i) => {
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.ellipse(plantX + 4 + i * 3, plantY + 3 + (i % 2) * 3, 3, 3, 0, 0, Math.PI * 2);
        ctx.fill();
      });
    }
  }

  // Second corner decoration
  if (room.width >= 10 && room.height >= 8 && seededRandom(seed + 400) > 0.6) {
    const itemX = (room.x + 1) * TILE_SIZE;
    const itemY = (room.y + room.height - 2) * TILE_SIZE;
    const itemType = Math.floor(seededRandom(seed + 401) * 3);

    if (itemType === 0) {
      ctx.fillStyle = PALETTE.shadow;
      ctx.beginPath();
      ctx.ellipse(itemX + 8, itemY + 14, 8, 2, 0, 0, Math.PI * 2);
      ctx.fill();
      const bookColors = ['#C84040', '#4080C8', '#40A860', '#C8A040'];
      bookColors.forEach((color, i) => {
        ctx.fillStyle = color;
        ctx.fillRect(itemX + 2, itemY + 10 - i * 3, 12, 3);
        ctx.fillStyle = adjustBrightness(color, 0.15);
        ctx.fillRect(itemX + 2, itemY + 10 - i * 3, 12, 1);
      });
    } else if (itemType === 1) {
      ctx.fillStyle = PALETTE.shadow;
      ctx.beginPath();
      ctx.ellipse(itemX + 7, itemY + 14, 6, 2, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#606870';
      ctx.fillRect(itemX + 2, itemY + 4, 10, 10);
      ctx.fillStyle = '#707880';
      ctx.fillRect(itemX + 2, itemY + 4, 10, 2);
      ctx.fillStyle = '#505860';
      ctx.fillRect(itemX + 2, itemY + 12, 10, 2);
    } else {
      ctx.fillStyle = PALETTE.shadow;
      ctx.beginPath();
      ctx.ellipse(itemX + 8, itemY + 16, 7, 2, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#A0A8B0';
      ctx.fillRect(itemX + 2, itemY, 12, 16);
      ctx.fillStyle = '#B0B8C0';
      ctx.fillRect(itemX + 2, itemY, 12, 2);
      ctx.fillStyle = '#909098';
      ctx.fillRect(itemX + 2, itemY + 14, 12, 2);
      ctx.fillStyle = '#808890';
      ctx.fillRect(itemX + 3, itemY + 5, 10, 1);
      ctx.fillRect(itemX + 3, itemY + 10, 10, 1);
      ctx.fillStyle = '#606068';
      ctx.fillRect(itemX + 6, itemY + 3, 4, 1);
      ctx.fillRect(itemX + 6, itemY + 8, 4, 1);
      ctx.fillRect(itemX + 6, itemY + 12, 4, 1);
    }
  }

  // Coffee cup on desk
  if (room.files.length > 0 && seededRandom(seed + 200) > 0.5) {
    const file = room.files[Math.floor(seededRandom(seed + 201) * room.files.length)];
    const cx = file.x * TILE_SIZE + TILE_SIZE * 2.5;
    const cy = file.y * TILE_SIZE + TILE_SIZE + 10;

    ctx.fillStyle = PALETTE.shadow;
    ctx.beginPath();
    ctx.ellipse(cx + 1, cy + 5, 4, 2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#F0E8E0';
    ctx.fillRect(cx - 3, cy, 6, 5);
    ctx.fillStyle = '#4A3020';
    ctx.fillRect(cx - 2, cy + 1, 4, 2);
  }

  // Papers on desk
  if (room.files.length > 1 && seededRandom(seed + 250) > 0.5) {
    const fileIdx = Math.floor(seededRandom(seed + 251) * room.files.length);
    const file = room.files[(fileIdx + 1) % room.files.length];
    const px = file.x * TILE_SIZE + TILE_SIZE * 0.3;
    const py = file.y * TILE_SIZE + TILE_SIZE + 8;

    ctx.fillStyle = '#F8F0E8';
    ctx.fillRect(px, py, 8, 6);
    ctx.fillStyle = '#E8E0D8';
    ctx.fillRect(px + 1, py + 1, 7, 5);
    ctx.fillStyle = '#C8C0B8';
    ctx.fillRect(px + 2, py + 2, 4, 1);
    ctx.fillRect(px + 2, py + 4, 5, 1);
  }
};

// Get header color based on floor style
export const getHeaderColor = (floorStyle: string): { bg: string; dark: string; light: string } => {
  switch (floorStyle) {
    case 'green':
      return { bg: '#6B9B6B', dark: '#5A8A5A', light: '#7CAC7C' };
    case 'blue':
      return { bg: '#6B8B9B', dark: '#5A7A8A', light: '#7C9CAC' };
    case 'cream':
      return { bg: '#B8A890', dark: '#A89880', light: '#C8B8A0' };
    case 'lavender':
      return { bg: '#9888A8', dark: '#877898', light: '#A898B8' };
    case 'peach':
      return { bg: '#C8A090', dark: '#B89080', light: '#D8B0A0' };
    default:
      return { bg: '#A89070', dark: '#988060', light: '#B8A080' };
  }
};

// Draw room sign
export const drawRoomSign = (ctx: CanvasRenderingContext2D, room: RoomLayout) => {
  const px = (room.x + room.width / 2) * TILE_SIZE;
  const py = room.y * TILE_SIZE - 20;

  ctx.font = 'bold 10px monospace';
  const text = room.name;
  const tw = ctx.measureText(text).width;
  const padX = 10;
  const height = 18;
  const width = tw + padX * 2;

  const colors = getHeaderColor(room.floorStyle);

  ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
  ctx.beginPath();
  ctx.roundRect(px - width/2 + 2, py + 2, width, height, 4);
  ctx.fill();

  ctx.fillStyle = colors.bg;
  ctx.beginPath();
  ctx.roundRect(px - width/2, py, width, height, 4);
  ctx.fill();

  ctx.fillStyle = colors.light;
  ctx.beginPath();
  ctx.roundRect(px - width/2, py, width, 4, [4, 4, 0, 0]);
  ctx.fill();

  ctx.fillStyle = colors.dark;
  ctx.beginPath();
  ctx.roundRect(px - width/2, py + height - 4, width, 4, [0, 0, 4, 4]);
  ctx.fill();

  ctx.textAlign = 'center';
  ctx.fillStyle = '#FFFFFF';
  ctx.fillText(text, px, py + 13);
};
