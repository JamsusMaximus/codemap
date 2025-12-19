// Room-themed decorations based on folder names
import { TILE_SIZE, RoomLayout } from './types';
import { seededRandom, adjustBrightness } from './utils';

// Draw room-specific themed decorations based on folder name
export const drawRoomThemedDecorations = (ctx: CanvasRenderingContext2D, room: RoomLayout, frame: number) => {
  const px = room.x * TILE_SIZE;
  const py = room.y * TILE_SIZE;
  const w = room.width * TILE_SIZE;
  const h = room.height * TILE_SIZE;
  const name = room.name.toLowerCase();

  // ROOT/LOBBY THEME
  if (room.depth === 0 || name.includes('codemap')) {
    drawLobbyDecorations(ctx, px, py, w, h, room, frame);
  }

  // CLIENT FOLDER THEME
  if (name.includes('client')) {
    drawClientDecorations(ctx, px, py, w, h, frame);
  }

  // SERVER FOLDER THEME
  if (name.includes('server')) {
    drawServerDecorations(ctx, px, py, w, h, frame);
  }

  // HOOKS FOLDER THEME
  if (name.includes('hook')) {
    drawHooksDecorations(ctx, px, py, w, h, frame);
  }

  // COMPONENTS FOLDER THEME
  if (name.includes('component')) {
    drawComponentsDecorations(ctx, px, py, w, h, frame);
  }

  // SRC FOLDER
  if (name === 'src') {
    drawSrcDecorations(ctx, px, py, w, h, frame);
  }

  // UTILS/TYPES folders
  if (name.includes('util') || name.includes('type') || name.includes('style')) {
    drawUtilsDecorations(ctx, px, py, w, h, frame);
  }
};

const drawLobbyDecorations = (
  ctx: CanvasRenderingContext2D,
  px: number, py: number, w: number, h: number,
  room: RoomLayout, frame: number
) => {
  // Reception desk with bell
  const rdX = px + 15;
  const rdY = py + 15;
  ctx.fillStyle = 'rgba(60, 40, 20, 0.2)';
  ctx.fillRect(rdX + 2, rdY + 14, 28, 4);
  ctx.fillStyle = '#8A6A4A';
  ctx.fillRect(rdX, rdY + 4, 28, 12);
  ctx.fillStyle = '#9A7A5A';
  ctx.fillRect(rdX, rdY, 28, 6);
  ctx.fillStyle = '#7A5A3A';
  ctx.fillRect(rdX, rdY + 12, 28, 4);
  // Bell on desk
  ctx.fillStyle = '#D4AF37';
  ctx.beginPath();
  ctx.arc(rdX + 22, rdY - 2, 4, Math.PI, 0, false);
  ctx.fill();
  ctx.fillStyle = '#FFD700';
  ctx.beginPath();
  ctx.arc(rdX + 22, rdY - 2, 3, Math.PI, 0, false);
  ctx.fill();
  ctx.fillStyle = '#B8860B';
  ctx.fillRect(rdX + 19, rdY - 2, 6, 2);
  // Bell button
  ctx.fillStyle = '#C0C0C0';
  ctx.beginPath();
  ctx.arc(rdX + 22, rdY - 5, 1.5, 0, Math.PI * 2);
  ctx.fill();

  // Guest book
  ctx.fillStyle = '#4A3020';
  ctx.fillRect(rdX + 4, rdY - 3, 10, 6);
  ctx.fillStyle = '#F8F0E0';
  ctx.fillRect(rdX + 5, rdY - 2, 8, 4);
  ctx.fillStyle = '#303030';
  ctx.fillRect(rdX + 6, rdY - 1, 6, 1);
  ctx.fillRect(rdX + 6, rdY + 1, 4, 1);

  // Umbrella stand
  const usX = px + 50;
  const usY = py + 26;
  ctx.fillStyle = 'rgba(60, 40, 20, 0.2)';
  ctx.beginPath();
  ctx.ellipse(usX + 4, usY + 14, 5, 2, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#484848';
  ctx.fillRect(usX, usY + 2, 8, 12);
  ctx.fillStyle = '#585858';
  ctx.fillRect(usX, usY + 2, 8, 2);
  ctx.fillStyle = '#383838';
  ctx.fillRect(usX, usY + 12, 8, 2);
  ctx.fillStyle = '#E04040';
  ctx.fillRect(usX + 1, usY - 4, 2, 6);
  ctx.fillStyle = '#4080E0';
  ctx.fillRect(usX + 4, usY - 2, 2, 4);

  // Waiting bench
  if (room.width >= 12) {
    const bX = px + w - 45;
    const bY = py + h - 30;
    ctx.fillStyle = 'rgba(60, 40, 20, 0.2)';
    ctx.fillRect(bX + 2, bY + 12, 24, 3);
    ctx.fillStyle = '#705838';
    ctx.fillRect(bX + 2, bY + 6, 3, 8);
    ctx.fillRect(bX + 19, bY + 6, 3, 8);
    ctx.fillStyle = '#A08060';
    ctx.fillRect(bX, bY + 2, 24, 6);
    ctx.fillStyle = '#B09070';
    ctx.fillRect(bX, bY + 2, 24, 2);
    ctx.fillStyle = '#907050';
    ctx.fillRect(bX, bY + 6, 24, 2);
  }

  // Wall clock with animated hands
  const clkX = px + w / 2;
  const clkY = py + 8;
  ctx.fillStyle = '#F8F0E0';
  ctx.beginPath();
  ctx.arc(clkX, clkY + 4, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#806040';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.lineWidth = 1;
  ctx.strokeStyle = '#404040';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(clkX, clkY + 4);
  ctx.lineTo(clkX + 2, clkY + 2);
  ctx.stroke();
  const minuteAngle = (frame * 0.001) % (Math.PI * 2);
  ctx.beginPath();
  ctx.moveTo(clkX, clkY + 4);
  ctx.lineTo(clkX + Math.sin(minuteAngle) * 4, clkY + 4 - Math.cos(minuteAngle) * 4);
  ctx.stroke();
  ctx.strokeStyle = '#C04040';
  ctx.lineWidth = 0.5;
  const secondAngle = (frame * 0.1) % (Math.PI * 2);
  ctx.beginPath();
  ctx.moveTo(clkX, clkY + 4);
  ctx.lineTo(clkX + Math.sin(secondAngle) * 5, clkY + 4 - Math.cos(secondAngle) * 5);
  ctx.stroke();
  ctx.lineWidth = 1;
  ctx.fillStyle = '#404040';
  ctx.beginPath();
  ctx.arc(clkX, clkY + 4, 1, 0, Math.PI * 2);
  ctx.fill();

  // Welcome rug
  const rugX = px + w / 2 - 30;
  const rugY = py + h / 2 - 15;
  ctx.fillStyle = '#8B4513';
  ctx.fillRect(rugX - 2, rugY - 2, 64, 34);
  ctx.fillStyle = '#B8860B';
  ctx.fillRect(rugX, rugY, 60, 30);
  ctx.fillStyle = '#DAA520';
  ctx.fillRect(rugX + 4, rugY + 4, 52, 22);
  ctx.fillStyle = '#CD853F';
  ctx.fillRect(rugX + 8, rugY + 8, 44, 14);
  ctx.fillStyle = '#8B4513';
  ctx.fillRect(rugX + 28, rugY + 6, 4, 18);
  ctx.fillRect(rugX + 10, rugY + 13, 40, 4);

  // Large plant
  const dpX = px + w - 35;
  const dpY = py + h - 55;
  ctx.fillStyle = 'rgba(40, 60, 30, 0.3)';
  ctx.beginPath();
  ctx.ellipse(dpX + 10, dpY + 36, 14, 4, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#6A4A3A';
  ctx.fillRect(dpX + 2, dpY + 22, 16, 14);
  ctx.fillStyle = '#7A5A4A';
  ctx.fillRect(dpX, dpY + 20, 20, 4);
  ctx.fillStyle = '#2A6A2A';
  ctx.beginPath();
  ctx.ellipse(dpX + 10, dpY + 8, 16, 16, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#3A8A3A';
  ctx.beginPath();
  ctx.ellipse(dpX + 8, dpY + 4, 12, 12, 0, 0, Math.PI * 2);
  ctx.fill();

  // Magazine rack
  const mrX = px + w - 80;
  const mrY = py + h - 35;
  ctx.fillStyle = 'rgba(60, 40, 20, 0.2)';
  ctx.fillRect(mrX + 2, mrY + 20, 18, 3);
  ctx.fillStyle = '#705838';
  ctx.fillRect(mrX, mrY + 4, 4, 18);
  ctx.fillRect(mrX + 16, mrY + 4, 4, 18);
  ctx.fillStyle = '#A08060';
  ctx.fillRect(mrX, mrY + 18, 20, 4);
  ctx.fillStyle = '#E84848';
  ctx.fillRect(mrX + 4, mrY + 2, 6, 16);
  ctx.fillStyle = '#4888E8';
  ctx.fillRect(mrX + 10, mrY + 4, 6, 14);

  // Side table with lamp
  const stX = px + w - 50;
  const stY = py + 35;
  ctx.fillStyle = 'rgba(60, 40, 20, 0.2)';
  ctx.fillRect(stX + 2, stY + 18, 16, 3);
  ctx.fillStyle = '#705838';
  ctx.fillRect(stX, stY + 8, 16, 12);
  ctx.fillStyle = '#806848';
  ctx.fillRect(stX - 2, stY + 6, 20, 4);
  ctx.fillStyle = '#C0B090';
  ctx.fillRect(stX + 6, stY - 8, 4, 14);
  ctx.fillStyle = '#F8E8C0';
  ctx.beginPath();
  ctx.moveTo(stX + 2, stY - 6);
  ctx.lineTo(stX + 14, stY - 6);
  ctx.lineTo(stX + 12, stY - 16);
  ctx.lineTo(stX + 4, stY - 16);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#FFF8E0';
  ctx.beginPath();
  ctx.moveTo(stX + 4, stY - 8);
  ctx.lineTo(stX + 12, stY - 8);
  ctx.lineTo(stX + 11, stY - 14);
  ctx.lineTo(stX + 5, stY - 14);
  ctx.closePath();
  ctx.fill();

  // Information board with scrolling text effect
  const ibX = px + 90;
  const ibY = py + 10;
  ctx.fillStyle = '#303030';
  ctx.fillRect(ibX, ibY, 36, 20);
  ctx.fillStyle = '#404040';
  ctx.fillRect(ibX, ibY, 36, 3);
  // LED display
  ctx.fillStyle = '#001020';
  ctx.fillRect(ibX + 2, ibY + 4, 32, 12);
  // Scrolling dots animation
  const scrollOffset = Math.floor(frame * 0.1) % 40;
  ctx.fillStyle = '#40FF90';
  for (let dx = 0; dx < 6; dx++) {
    const dotX = ibX + 4 + ((dx * 5 + scrollOffset) % 30);
    ctx.fillRect(dotX, ibY + 8, 2, 4);
  }
  // "WELCOME" static text dots
  ctx.fillStyle = '#60FFB0';
  ctx.fillRect(ibX + 6, ibY + 6, 2, 2);
  ctx.fillRect(ibX + 10, ibY + 6, 2, 2);
  ctx.fillRect(ibX + 16, ibY + 6, 2, 2);
  ctx.fillRect(ibX + 22, ibY + 6, 2, 2);
  ctx.fillRect(ibX + 28, ibY + 6, 2, 2);

  // Vending machine
  const vmX = px + w - 30;
  const vmY = py + h - 50;
  ctx.fillStyle = 'rgba(40, 30, 50, 0.25)';
  ctx.fillRect(vmX + 2, vmY + 36, 18, 4);
  ctx.fillStyle = '#E04040';
  ctx.fillRect(vmX, vmY, 18, 36);
  ctx.fillStyle = '#F05050';
  ctx.fillRect(vmX, vmY, 18, 4);
  ctx.fillStyle = '#C03030';
  ctx.fillRect(vmX, vmY + 32, 18, 4);
  // Glass window
  ctx.fillStyle = '#406080';
  ctx.fillRect(vmX + 2, vmY + 6, 14, 18);
  ctx.fillStyle = '#5080A0';
  ctx.fillRect(vmX + 2, vmY + 6, 14, 3);
  // Snacks inside
  ctx.fillStyle = '#F0D020';
  ctx.fillRect(vmX + 4, vmY + 10, 4, 3);
  ctx.fillStyle = '#60B0E0';
  ctx.fillRect(vmX + 9, vmY + 10, 4, 3);
  ctx.fillStyle = '#80E060';
  ctx.fillRect(vmX + 4, vmY + 15, 4, 3);
  ctx.fillStyle = '#E080C0';
  ctx.fillRect(vmX + 9, vmY + 15, 4, 3);
  // Coin slot
  ctx.fillStyle = '#202020';
  ctx.fillRect(vmX + 14, vmY + 26, 3, 4);
  // Dispenser
  ctx.fillStyle = '#303030';
  ctx.fillRect(vmX + 2, vmY + 26, 10, 6);
};

const drawClientDecorations = (
  ctx: CanvasRenderingContext2D,
  px: number, py: number, w: number, h: number, frame: number
) => {
  // Whiteboard
  const wbX = px + 60;
  const wbY = py + 8;
  ctx.fillStyle = '#E0D8C8';
  ctx.fillRect(wbX - 2, wbY - 2, 36, 24);
  ctx.fillStyle = '#F0F0E8';
  ctx.fillRect(wbX, wbY, 32, 20);
  ctx.strokeStyle = '#A09080';
  ctx.lineWidth = 2;
  ctx.strokeRect(wbX, wbY, 32, 20);
  ctx.lineWidth = 1;
  ctx.strokeStyle = '#4080C0';
  ctx.beginPath();
  ctx.moveTo(wbX + 4, wbY + 5);
  ctx.lineTo(wbX + 20, wbY + 5);
  ctx.moveTo(wbX + 4, wbY + 9);
  ctx.lineTo(wbX + 26, wbY + 9);
  ctx.moveTo(wbX + 4, wbY + 13);
  ctx.lineTo(wbX + 18, wbY + 13);
  ctx.stroke();
  ctx.fillStyle = '#C0B8A8';
  ctx.fillRect(wbX + 4, wbY + 18, 24, 3);

  // Coffee machine with steam
  const cmX = px + w - 30;
  const cmY = py + 20;
  ctx.fillStyle = 'rgba(40, 30, 20, 0.25)';
  ctx.fillRect(cmX + 2, cmY + 18, 12, 3);
  ctx.fillStyle = '#404040';
  ctx.fillRect(cmX, cmY, 12, 16);
  ctx.fillStyle = '#505050';
  ctx.fillRect(cmX, cmY, 12, 3);
  ctx.fillStyle = '#303030';
  ctx.fillRect(cmX, cmY + 13, 12, 3);
  ctx.fillStyle = frame % 60 < 30 ? '#FF3030' : '#801010';
  ctx.fillRect(cmX + 9, cmY + 2, 2, 2);
  ctx.fillStyle = frame % 90 < 60 ? '#40FF40' : '#204020';
  ctx.fillRect(cmX + 9, cmY + 5, 2, 2);
  ctx.fillStyle = '#282828';
  ctx.fillRect(cmX + 3, cmY + 6, 6, 6);
  for (let s = 0; s < 3; s++) {
    const steamPhase = ((frame * 0.03) + s * 0.8) % 1;
    const steamY = cmY - 2 - steamPhase * 10;
    const steamX = cmX + 4 + s * 2 + Math.sin(frame * 0.05 + s) * 1.5;
    const steamOpacity = (1 - steamPhase) * 0.4;
    ctx.fillStyle = `rgba(255, 255, 255, ${steamOpacity})`;
    ctx.beginPath();
    ctx.arc(steamX, steamY, 1.5 - steamPhase * 0.5, 0, Math.PI * 2);
    ctx.fill();
  }

  // Water cooler with bubbles
  const wcX = px + w - 50;
  const wcY = py + 18;
  ctx.fillStyle = 'rgba(40, 30, 20, 0.2)';
  ctx.beginPath();
  ctx.ellipse(wcX + 5, wcY + 20, 6, 2, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#D0D0D0';
  ctx.fillRect(wcX, wcY + 6, 10, 14);
  ctx.fillStyle = '#E0E0E0';
  ctx.fillRect(wcX, wcY + 6, 10, 2);
  ctx.fillStyle = '#B0B0B0';
  ctx.fillRect(wcX, wcY + 18, 10, 2);
  ctx.fillStyle = '#88C8E8';
  ctx.fillRect(wcX + 1, wcY - 2, 8, 10);
  ctx.fillStyle = '#A8E0F8';
  ctx.fillRect(wcX + 1, wcY - 2, 4, 9);
  for (let b = 0; b < 2; b++) {
    const bubblePhase = ((frame * 0.02) + b * 0.5) % 1;
    const bubbleY = wcY + 6 - bubblePhase * 8;
    const bubbleX = wcX + 3 + b * 3 + Math.sin(frame * 0.03 + b * 2) * 1;
    ctx.fillStyle = '#A8D8F0';
    ctx.beginPath();
    ctx.arc(bubbleX, bubbleY, 1 + b * 0.5, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = '#808080';
  ctx.fillRect(wcX + 3, wcY + 8, 4, 2);

  // Meeting table
  const mtX = px + w - 90;
  const mtY = py + h - 50;
  ctx.fillStyle = 'rgba(40, 60, 30, 0.2)';
  ctx.fillRect(mtX + 4, mtY + 22, 42, 5);
  ctx.fillStyle = '#6B9B6B';
  ctx.fillRect(mtX + 2, mtY + 8, 46, 16);
  ctx.fillStyle = '#5A8A5A';
  ctx.fillRect(mtX + 2, mtY + 20, 46, 4);
  ctx.fillStyle = '#7CAC7C';
  ctx.fillRect(mtX + 4, mtY + 10, 42, 4);
  ctx.fillStyle = '#4A6A4A';
  ctx.fillRect(mtX + 8, mtY + 18, 4, 8);
  ctx.fillRect(mtX + 38, mtY + 18, 4, 8);

  // Chairs
  const ch1X = mtX - 10;
  const ch1Y = mtY + 8;
  ctx.fillStyle = '#505050';
  ctx.fillRect(ch1X, ch1Y + 12, 12, 2);
  ctx.fillRect(ch1X + 2, ch1Y + 14, 2, 6);
  ctx.fillRect(ch1X + 8, ch1Y + 14, 2, 6);
  ctx.fillStyle = '#404040';
  ctx.fillRect(ch1X, ch1Y, 12, 14);
  ctx.fillStyle = '#484848';
  ctx.fillRect(ch1X + 2, ch1Y + 2, 8, 10);

  const ch2X = mtX + 48;
  const ch2Y = mtY + 8;
  ctx.fillStyle = '#505050';
  ctx.fillRect(ch2X, ch2Y + 12, 12, 2);
  ctx.fillRect(ch2X + 2, ch2Y + 14, 2, 6);
  ctx.fillRect(ch2X + 8, ch2Y + 14, 2, 6);
  ctx.fillStyle = '#404040';
  ctx.fillRect(ch2X, ch2Y, 12, 14);
  ctx.fillStyle = '#484848';
  ctx.fillRect(ch2X + 2, ch2Y + 2, 8, 10);

  ctx.fillStyle = '#F0F0E8';
  ctx.fillRect(mtX + 15, mtY + 12, 10, 8);
  ctx.fillStyle = '#E8E8E0';
  ctx.fillRect(mtX + 26, mtY + 11, 8, 9);

  // Phone/tablet mockup on stand
  const pmX = px + 20;
  const pmY = py + h - 45;
  // Stand
  ctx.fillStyle = 'rgba(50, 50, 60, 0.2)';
  ctx.fillRect(pmX + 4, pmY + 28, 10, 3);
  ctx.fillStyle = '#606060';
  ctx.fillRect(pmX + 6, pmY + 20, 6, 10);
  ctx.fillStyle = '#505050';
  ctx.fillRect(pmX + 4, pmY + 18, 10, 4);
  // Phone
  ctx.fillStyle = '#303030';
  ctx.fillRect(pmX, pmY, 16, 22);
  ctx.fillStyle = '#404040';
  ctx.fillRect(pmX, pmY, 16, 2);
  // Screen with UI
  ctx.fillStyle = '#4080C0';
  ctx.fillRect(pmX + 2, pmY + 3, 12, 16);
  // UI elements
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(pmX + 3, pmY + 5, 10, 2);
  ctx.fillStyle = '#80C0E0';
  ctx.fillRect(pmX + 3, pmY + 9, 4, 4);
  ctx.fillRect(pmX + 8, pmY + 9, 4, 4);
  ctx.fillStyle = '#60A0D0';
  ctx.fillRect(pmX + 3, pmY + 15, 10, 2);

  // Wireframe poster
  const wpX = px + w - 35;
  const wpY = py + 12;
  ctx.fillStyle = '#F8F8F0';
  ctx.fillRect(wpX, wpY, 22, 18);
  ctx.strokeStyle = '#C0C0B0';
  ctx.lineWidth = 1;
  ctx.strokeRect(wpX, wpY, 22, 18);
  // Wireframe elements
  ctx.strokeStyle = '#808080';
  ctx.strokeRect(wpX + 2, wpY + 2, 18, 3);
  ctx.strokeRect(wpX + 2, wpY + 6, 8, 8);
  ctx.strokeRect(wpX + 11, wpY + 6, 9, 4);
  ctx.strokeRect(wpX + 11, wpY + 11, 9, 3);
  ctx.fillStyle = '#E0E0D8';
  ctx.fillRect(wpX + 3, wpY + 7, 6, 6);

  // Sticky notes cluster
  const snX = px + 40;
  const snY = py + 10;
  // Yellow sticky
  ctx.fillStyle = '#FFF080';
  ctx.fillRect(snX, snY, 10, 10);
  ctx.fillStyle = '#E0D060';
  ctx.fillRect(snX, snY + 8, 10, 2);
  // Pink sticky
  ctx.fillStyle = '#FFB0C0';
  ctx.fillRect(snX + 8, snY + 3, 10, 10);
  ctx.fillStyle = '#E090A0';
  ctx.fillRect(snX + 8, snY + 11, 10, 2);
  // Blue sticky
  ctx.fillStyle = '#A0D8FF';
  ctx.fillRect(snX + 4, snY + 8, 10, 10);
  ctx.fillStyle = '#80B8E0';
  ctx.fillRect(snX + 4, snY + 16, 10, 2);
  // Scribble marks
  ctx.fillStyle = '#606060';
  ctx.fillRect(snX + 2, snY + 3, 5, 1);
  ctx.fillRect(snX + 2, snY + 5, 4, 1);
  ctx.fillRect(snX + 10, snY + 6, 5, 1);
  ctx.fillRect(snX + 6, snY + 11, 5, 1);
};

const drawServerDecorations = (
  ctx: CanvasRenderingContext2D,
  px: number, py: number, w: number, h: number, frame: number
) => {
  // Server rack with blinking lights
  const srX = px + 20;
  const srY = py + 15;
  ctx.fillStyle = 'rgba(40, 30, 50, 0.3)';
  ctx.fillRect(srX + 3, srY + 30, 20, 4);
  ctx.fillStyle = '#404048';
  ctx.fillRect(srX, srY, 20, 28);
  ctx.fillStyle = '#484850';
  ctx.fillRect(srX, srY, 20, 3);
  ctx.fillStyle = '#303038';
  ctx.fillRect(srX, srY + 25, 20, 3);

  for (let i = 0; i < 4; i++) {
    ctx.fillStyle = '#383840';
    ctx.fillRect(srX + 2, srY + 4 + i * 6, 16, 5);
    ctx.fillStyle = '#484850';
    ctx.fillRect(srX + 2, srY + 4 + i * 6, 16, 1);

    const led1Period = 24 + i * 12;
    const led1OnTime = 14 + i * 6;
    const led1Phase = (frame + i * 17) % led1Period;
    const led1On = led1Phase < led1OnTime;
    const showRed1 = seededRandom(Math.floor(frame / 300) + i * 7) < 0.15;
    ctx.fillStyle = showRed1 ? (led1On ? '#FF6868' : '#401818') : (led1On ? '#88FF88' : '#204020');
    ctx.fillRect(srX + 14, srY + 5 + i * 6, 2, 2);

    const led2Period = 30 + i * 10;
    const led2OnTime = 18 + i * 4;
    const led2Phase = (frame + i * 23 + 11) % led2Period;
    const led2On = led2Phase < led2OnTime;
    const showYellow = seededRandom(i * 3 + 0.5) > 0.4;
    ctx.fillStyle = showYellow ? (led2On ? '#E8E848' : '#404020') : (led2On ? '#88FF88' : '#204020');
    ctx.fillRect(srX + 16, srY + 5 + i * 6, 2, 2);

    const led3Period = 8 + (i % 2) * 4;
    const led3On = (frame + i * 7) % led3Period < led3Period / 2;
    ctx.fillStyle = led3On ? '#88FF88' : '#183018';
    ctx.fillRect(srX + 4, srY + 6 + i * 6, 1, 1);
  }

  ctx.fillStyle = '#282830';
  for (let i = 0; i < 3; i++) {
    ctx.fillRect(srX + 4 + i * 4, srY + 26, 2, 1);
  }

  // Network cables
  ctx.strokeStyle = '#E8D848';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(srX + 20, srY + 8);
  ctx.lineTo(srX + 35, srY + 8);
  ctx.lineTo(srX + 35, srY + 20);
  ctx.stroke();
  ctx.strokeStyle = '#4888E8';
  ctx.beginPath();
  ctx.moveTo(srX + 20, srY + 14);
  ctx.lineTo(srX + 40, srY + 14);
  ctx.stroke();
  ctx.lineWidth = 1;

  // Temperature monitor
  const tmX = px + 70;
  const tmY = py + 12;
  ctx.fillStyle = '#303030';
  ctx.fillRect(tmX, tmY, 14, 10);
  ctx.fillStyle = '#88E888';
  ctx.fillRect(tmX + 2, tmY + 2, 10, 6);
  ctx.fillStyle = '#40A040';
  ctx.font = '6px monospace';
  ctx.fillText('72°', tmX + 3, tmY + 7);

  // Caution sign
  const csX = px + w - 35;
  const csY = py + 15;
  ctx.fillStyle = '#F0D020';
  ctx.fillRect(csX, csY, 20, 12);
  ctx.fillStyle = '#202020';
  ctx.fillRect(csX + 2, csY + 2, 16, 8);
  ctx.fillStyle = '#F0D020';
  ctx.font = 'bold 6px sans-serif';
  ctx.fillText('⚠', csX + 6, csY + 9);

  // UPS
  const upsX = px + 50;
  const upsY = py + h - 35;
  ctx.fillStyle = 'rgba(40, 30, 50, 0.25)';
  ctx.fillRect(upsX + 2, upsY + 20, 26, 4);
  ctx.fillStyle = '#303038';
  ctx.fillRect(upsX, upsY, 26, 20);
  ctx.fillStyle = '#404048';
  ctx.fillRect(upsX, upsY, 26, 3);
  ctx.fillStyle = '#252530';
  ctx.fillRect(upsX, upsY + 17, 26, 3);
  ctx.fillStyle = '#202028';
  ctx.fillRect(upsX + 4, upsY + 5, 18, 8);
  ctx.fillStyle = '#40C040';
  ctx.fillRect(upsX + 6, upsY + 7, 6, 4);
  ctx.font = '5px monospace';
  ctx.fillStyle = '#60FF60';
  ctx.fillText('OK', upsX + 14, upsY + 11);
  ctx.fillStyle = frame % 120 < 100 ? '#40FF40' : '#204020';
  ctx.fillRect(upsX + 22, upsY + 6, 2, 2);

  // Second server rack
  const sr2X = px + w - 50;
  const sr2Y = py + h - 45;
  ctx.fillStyle = 'rgba(40, 30, 50, 0.3)';
  ctx.fillRect(sr2X + 2, sr2Y + 32, 18, 4);
  ctx.fillStyle = '#404048';
  ctx.fillRect(sr2X, sr2Y, 18, 30);
  ctx.fillStyle = '#484850';
  ctx.fillRect(sr2X, sr2Y, 18, 2);
  ctx.fillStyle = '#303038';
  ctx.fillRect(sr2X, sr2Y + 28, 18, 2);
  for (let i = 0; i < 4; i++) {
    ctx.fillStyle = '#383840';
    ctx.fillRect(sr2X + 2, sr2Y + 3 + i * 7, 14, 5);
    ctx.fillStyle = (frame + i * 25) % 60 < 30 ? '#40FF40' : '#204020';
    ctx.fillRect(sr2X + 13, sr2Y + 4 + i * 7, 2, 2);
  }

  // Cable management
  const cmtX = px + 85;
  const cmtY = py + h - 25;
  ctx.fillStyle = '#484850';
  ctx.fillRect(cmtX, cmtY, 30, 6);
  ctx.fillStyle = '#383840';
  ctx.fillRect(cmtX + 2, cmtY + 2, 26, 4);
  ctx.strokeStyle = '#E8D848';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(cmtX + 4, cmtY + 3);
  ctx.lineTo(cmtX + 26, cmtY + 3);
  ctx.stroke();
  ctx.strokeStyle = '#4888E8';
  ctx.beginPath();
  ctx.moveTo(cmtX + 4, cmtY + 5);
  ctx.lineTo(cmtX + 26, cmtY + 5);
  ctx.stroke();
  ctx.lineWidth = 1;

  // Cooling fan unit with animated blades
  const cfX = px + w - 80;
  const cfY = py + 20;
  ctx.fillStyle = '#505860';
  ctx.fillRect(cfX, cfY, 20, 20);
  ctx.fillStyle = '#606870';
  ctx.fillRect(cfX, cfY, 20, 3);
  ctx.fillStyle = '#404850';
  ctx.fillRect(cfX, cfY + 17, 20, 3);
  // Fan grille
  ctx.fillStyle = '#303840';
  ctx.beginPath();
  ctx.arc(cfX + 10, cfY + 10, 7, 0, Math.PI * 2);
  ctx.fill();
  // Animated fan blades
  const fanAngle = (frame * 0.15) % (Math.PI * 2);
  ctx.fillStyle = '#708090';
  for (let blade = 0; blade < 4; blade++) {
    const bladeAngle = fanAngle + (blade * Math.PI / 2);
    ctx.save();
    ctx.translate(cfX + 10, cfY + 10);
    ctx.rotate(bladeAngle);
    ctx.fillRect(-1, -6, 2, 6);
    ctx.restore();
  }
  // Fan center
  ctx.fillStyle = '#404850';
  ctx.beginPath();
  ctx.arc(cfX + 10, cfY + 10, 2, 0, Math.PI * 2);
  ctx.fill();

  // Fire extinguisher
  const feX = px + 15;
  const feY = py + h - 40;
  ctx.fillStyle = 'rgba(60, 30, 30, 0.2)';
  ctx.beginPath();
  ctx.ellipse(feX + 5, feY + 26, 6, 2, 0, 0, Math.PI * 2);
  ctx.fill();
  // Tank
  ctx.fillStyle = '#D03030';
  ctx.fillRect(feX, feY + 6, 10, 20);
  ctx.fillStyle = '#E04040';
  ctx.fillRect(feX, feY + 6, 5, 18);
  ctx.fillStyle = '#B02020';
  ctx.fillRect(feX + 8, feY + 6, 2, 18);
  // Top
  ctx.fillStyle = '#404040';
  ctx.fillRect(feX + 2, feY + 2, 6, 6);
  ctx.fillStyle = '#505050';
  ctx.fillRect(feX + 2, feY + 2, 6, 2);
  // Handle
  ctx.fillStyle = '#303030';
  ctx.fillRect(feX + 8, feY + 3, 4, 2);
  // Hose
  ctx.strokeStyle = '#202020';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(feX + 2, feY + 4);
  ctx.quadraticCurveTo(feX - 4, feY + 8, feX - 2, feY + 16);
  ctx.stroke();
  ctx.lineWidth = 1;
  // Label
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(feX + 2, feY + 12, 6, 6);
  ctx.fillStyle = '#D03030';
  ctx.fillRect(feX + 3, feY + 14, 4, 2);

  // Server status panel
  const spX = px + 45;
  const spY = py + 10;
  ctx.fillStyle = '#404850';
  ctx.fillRect(spX, spY, 24, 16);
  ctx.fillStyle = '#505860';
  ctx.fillRect(spX, spY, 24, 3);
  // Display
  ctx.fillStyle = '#001820';
  ctx.fillRect(spX + 2, spY + 4, 20, 10);
  // Status indicators
  ctx.fillStyle = frame % 80 < 70 ? '#40FF40' : '#204020';
  ctx.fillRect(spX + 4, spY + 6, 4, 3);
  ctx.fillStyle = frame % 100 < 90 ? '#40FF40' : '#204020';
  ctx.fillRect(spX + 10, spY + 6, 4, 3);
  ctx.fillStyle = frame % 120 < 100 ? '#FFFF40' : '#404020';
  ctx.fillRect(spX + 16, spY + 6, 4, 3);
  // Labels
  ctx.fillStyle = '#40A0FF';
  ctx.fillRect(spX + 4, spY + 10, 3, 1);
  ctx.fillRect(spX + 10, spY + 10, 3, 1);
  ctx.fillRect(spX + 16, spY + 10, 3, 1);
};

const drawHooksDecorations = (
  ctx: CanvasRenderingContext2D,
  px: number, py: number, w: number, h: number, frame: number
) => {
  // Tool board
  const tbX = px + 25;
  const tbY = py + 10;
  ctx.fillStyle = '#C8B898';
  ctx.fillRect(tbX, tbY, 24, 16);
  ctx.fillStyle = '#A89878';
  for (let ty = 0; ty < 3; ty++) {
    for (let tx = 0; tx < 5; tx++) {
      ctx.fillRect(tbX + 3 + tx * 4, tbY + 3 + ty * 5, 2, 2);
    }
  }
  ctx.fillStyle = '#606060';
  ctx.fillRect(tbX + 4, tbY + 4, 2, 8);
  ctx.fillStyle = '#C04040';
  ctx.fillRect(tbX + 3, tbY + 2, 4, 3);
  ctx.fillStyle = '#606060';
  ctx.fillRect(tbX + 10, tbY + 3, 6, 2);
  ctx.fillRect(tbX + 10, tbY + 3, 2, 6);
  ctx.fillStyle = '#806040';
  ctx.fillRect(tbX + 18, tbY + 4, 3, 8);
  ctx.fillStyle = '#505050';
  ctx.fillRect(tbX + 17, tbY + 2, 5, 4);

  // Ladder
  const ldX = px + w - 25;
  const ldY = py + 8;
  ctx.fillStyle = '#C8A868';
  ctx.fillRect(ldX, ldY, 2, 28);
  ctx.fillRect(ldX + 6, ldY, 2, 28);
  ctx.fillStyle = '#B89858';
  for (let i = 0; i < 5; i++) {
    ctx.fillRect(ldX, ldY + 4 + i * 6, 8, 2);
  }

  // Storage boxes
  const bxX = px + 50;
  const bxY = py + h - 35;
  ctx.fillStyle = '#C8B898';
  ctx.fillRect(bxX, bxY + 8, 14, 10);
  ctx.fillStyle = '#D8C8A8';
  ctx.fillRect(bxX, bxY + 8, 14, 2);
  ctx.fillStyle = '#B8A888';
  ctx.fillRect(bxX + 16, bxY + 4, 12, 14);
  ctx.fillStyle = '#C8B898';
  ctx.fillRect(bxX + 16, bxY + 4, 12, 2);
  ctx.fillStyle = '#D0C0A0';
  ctx.fillRect(bxX + 4, bxY, 10, 8);
  ctx.fillStyle = '#E0D0B0';
  ctx.fillRect(bxX + 4, bxY, 10, 2);

  // Wall shelf
  const wsX = px + w - 50;
  const wsY = py + 35;
  ctx.fillStyle = '#606060';
  ctx.fillRect(wsX, wsY + 8, 3, 8);
  ctx.fillRect(wsX + 27, wsY + 8, 3, 8);
  ctx.fillStyle = '#A08060';
  ctx.fillRect(wsX - 2, wsY + 4, 34, 5);
  ctx.fillStyle = '#B09070';
  ctx.fillRect(wsX - 2, wsY + 4, 34, 2);
  ctx.fillStyle = '#E04040';
  ctx.fillRect(wsX + 2, wsY - 4, 6, 8);
  ctx.fillStyle = '#4080E0';
  ctx.fillRect(wsX + 10, wsY - 6, 5, 10);
  ctx.fillStyle = '#E0E040';
  ctx.fillRect(wsX + 18, wsY - 2, 8, 6);
  ctx.fillStyle = '#808080';
  ctx.fillRect(wsX + 28, wsY - 1, 3, 5);

  // Workbench
  const wbkX = px + 70;
  const wbkY = py + h - 45;
  ctx.fillStyle = 'rgba(60, 40, 20, 0.2)';
  ctx.fillRect(wbkX + 2, wbkY + 16, 28, 4);
  ctx.fillStyle = '#705838';
  ctx.fillRect(wbkX, wbkY + 10, 4, 10);
  ctx.fillRect(wbkX + 24, wbkY + 10, 4, 10);
  ctx.fillStyle = '#907050';
  ctx.fillRect(wbkX - 2, wbkY + 6, 32, 6);
  ctx.fillStyle = '#A08060';
  ctx.fillRect(wbkX - 2, wbkY + 6, 32, 2);
  ctx.fillStyle = '#404040';
  ctx.fillRect(wbkX + 4, wbkY + 2, 10, 4);
  ctx.fillStyle = '#C08040';
  ctx.fillRect(wbkX + 18, wbkY + 4, 8, 2);

  // Broom
  const brX = px + 15;
  const brY = py + h - 38;
  ctx.fillStyle = '#B09060';
  ctx.fillRect(brX + 2, brY, 2, 30);
  ctx.fillStyle = '#C8A868';
  ctx.fillRect(brX, brY + 26, 6, 8);
  ctx.fillStyle = '#A89050';
  ctx.fillRect(brX, brY + 30, 6, 4);

  // Fishing rod leaning against wall (it's "hooks"!)
  const frX = px + w - 20;
  const frY = py + 10;
  ctx.strokeStyle = '#8B5A2B';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(frX, frY + 35);
  ctx.lineTo(frX + 3, frY);
  ctx.stroke();
  // Rod handle
  ctx.fillStyle = '#4A3020';
  ctx.fillRect(frX - 2, frY + 30, 4, 8);
  ctx.fillStyle = '#5A4030';
  ctx.fillRect(frX - 1, frY + 30, 2, 7);
  // Reel
  ctx.fillStyle = '#606060';
  ctx.beginPath();
  ctx.arc(frX, frY + 28, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#808080';
  ctx.beginPath();
  ctx.arc(frX, frY + 28, 1.5, 0, Math.PI * 2);
  ctx.fill();
  // Fishing line with animated hook
  ctx.strokeStyle = '#C0C0C0';
  ctx.lineWidth = 0.5;
  const hookSway = Math.sin(frame * 0.02) * 2;
  ctx.beginPath();
  ctx.moveTo(frX + 3, frY);
  ctx.lineTo(frX + 5 + hookSway, frY + 8);
  ctx.stroke();
  // Hook
  ctx.strokeStyle = '#808080';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(frX + 5 + hookSway, frY + 8);
  ctx.lineTo(frX + 5 + hookSway, frY + 12);
  ctx.arc(frX + 3 + hookSway, frY + 12, 2, 0, Math.PI, false);
  ctx.stroke();
  ctx.lineWidth = 1;

  // Tackle box
  const txX = px + w - 45;
  const txY = py + h - 30;
  ctx.fillStyle = 'rgba(40, 60, 40, 0.2)';
  ctx.fillRect(txX + 2, txY + 16, 22, 3);
  ctx.fillStyle = '#2A6A4A';
  ctx.fillRect(txX, txY, 22, 16);
  ctx.fillStyle = '#3A8A5A';
  ctx.fillRect(txX, txY, 22, 3);
  ctx.fillStyle = '#1A5A3A';
  ctx.fillRect(txX, txY + 13, 22, 3);
  // Handle
  ctx.fillStyle = '#505050';
  ctx.fillRect(txX + 8, txY - 2, 6, 3);
  // Latches
  ctx.fillStyle = '#C0C0C0';
  ctx.fillRect(txX + 2, txY + 7, 3, 2);
  ctx.fillRect(txX + 17, txY + 7, 3, 2);

  // Pipe wrench
  const pwX = px + 90;
  const pwY = py + h - 25;
  ctx.fillStyle = '#C04040';
  ctx.fillRect(pwX, pwY, 4, 16);
  ctx.fillStyle = '#D05050';
  ctx.fillRect(pwX, pwY, 2, 15);
  ctx.fillStyle = '#606060';
  ctx.fillRect(pwX - 2, pwY + 12, 8, 6);
  ctx.fillStyle = '#707070';
  ctx.fillRect(pwX - 2, pwY + 12, 8, 2);
  // Jaw
  ctx.fillStyle = '#505050';
  ctx.fillRect(pwX - 3, pwY + 14, 3, 4);
  ctx.fillRect(pwX + 4, pwY + 15, 3, 3);

  // Wall-mounted hooks (literal hooks!)
  for (let i = 0; i < 3; i++) {
    const hkX = px + 60 + i * 12;
    const hkY = py + 12;
    ctx.fillStyle = '#808080';
    ctx.fillRect(hkX, hkY, 2, 4);
    ctx.strokeStyle = '#808080';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(hkX + 1, hkY + 4);
    ctx.lineTo(hkX + 1, hkY + 8);
    ctx.arc(hkX + 3, hkY + 8, 2, Math.PI, 0, true);
    ctx.stroke();
    ctx.lineWidth = 1;
  }
};

const drawComponentsDecorations = (
  ctx: CanvasRenderingContext2D,
  px: number, py: number, w: number, h: number, frame: number
) => {
  // Design posters
  const posterColors = ['#E86868', '#68B8E8', '#E8C848', '#88D868'];
  posterColors.forEach((color, i) => {
    const ppX = px + 20 + i * 18;
    const ppY = py + 8;
    ctx.fillStyle = color;
    ctx.fillRect(ppX, ppY, 12, 16);
    ctx.fillStyle = adjustBrightness(color, 0.15);
    ctx.fillRect(ppX, ppY, 12, 3);
    ctx.fillStyle = adjustBrightness(color, -0.2);
    if (i % 2 === 0) {
      ctx.beginPath();
      ctx.arc(ppX + 6, ppY + 10, 4, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.fillRect(ppX + 3, ppY + 6, 6, 6);
    }
  });

  // Mood board
  const mbX = px + w - 40;
  const mbY = py + 10;
  ctx.fillStyle = '#E8E0D8';
  ctx.fillRect(mbX, mbY, 20, 16);
  ctx.strokeStyle = '#A89880';
  ctx.strokeRect(mbX, mbY, 20, 16);
  const swatchColors = ['#FF6060', '#60B0FF', '#60FF60', '#FFFF60', '#FF60FF', '#60FFFF'];
  swatchColors.forEach((color, i) => {
    ctx.fillStyle = color;
    ctx.fillRect(mbX + 2 + (i % 3) * 6, mbY + 2 + Math.floor(i / 3) * 6, 5, 5);
  });

  // Plant
  const epX = px + w - 25;
  const epY = py + h - 40;
  ctx.fillStyle = 'rgba(40, 60, 30, 0.25)';
  ctx.beginPath();
  ctx.ellipse(epX + 8, epY + 26, 10, 3, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#906040';
  ctx.fillRect(epX + 2, epY + 16, 12, 10);
  ctx.fillStyle = '#A07050';
  ctx.fillRect(epX, epY + 14, 16, 4);
  ctx.fillStyle = '#48A038';
  ctx.beginPath();
  ctx.ellipse(epX + 8, epY + 8, 12, 10, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#58B048';
  ctx.beginPath();
  ctx.ellipse(epX + 6, epY + 6, 8, 7, 0, 0, Math.PI * 2);
  ctx.fill();

  // Bean bag
  const bbX = px + 25;
  const bbY = py + h - 35;
  ctx.fillStyle = 'rgba(40, 30, 60, 0.2)';
  ctx.beginPath();
  ctx.ellipse(bbX + 12, bbY + 18, 14, 4, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#C87868';
  ctx.beginPath();
  ctx.ellipse(bbX + 12, bbY + 10, 14, 12, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#D88878';
  ctx.beginPath();
  ctx.ellipse(bbX + 10, bbY + 6, 10, 8, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#E89888';
  ctx.beginPath();
  ctx.ellipse(bbX + 8, bbY + 4, 6, 5, 0, 0, Math.PI * 2);
  ctx.fill();

  // Lego-style building blocks stack
  const lbX = px + 60;
  const lbY = py + h - 40;
  // Bottom block (red)
  ctx.fillStyle = '#C03030';
  ctx.fillRect(lbX, lbY + 16, 20, 10);
  ctx.fillStyle = '#D04040';
  ctx.fillRect(lbX, lbY + 16, 20, 3);
  ctx.fillStyle = '#A02020';
  ctx.fillRect(lbX, lbY + 23, 20, 3);
  // Studs on red
  ctx.fillStyle = '#E05050';
  ctx.fillRect(lbX + 3, lbY + 13, 4, 3);
  ctx.fillRect(lbX + 13, lbY + 13, 4, 3);
  // Middle block (blue)
  ctx.fillStyle = '#3060B0';
  ctx.fillRect(lbX + 2, lbY + 6, 16, 10);
  ctx.fillStyle = '#4080D0';
  ctx.fillRect(lbX + 2, lbY + 6, 16, 3);
  ctx.fillStyle = '#2050A0';
  ctx.fillRect(lbX + 2, lbY + 13, 16, 3);
  // Studs on blue
  ctx.fillStyle = '#50A0F0';
  ctx.fillRect(lbX + 5, lbY + 3, 4, 3);
  ctx.fillRect(lbX + 11, lbY + 3, 4, 3);
  // Top block (yellow)
  ctx.fillStyle = '#D0A020';
  ctx.fillRect(lbX + 4, lbY - 4, 12, 10);
  ctx.fillStyle = '#E0C040';
  ctx.fillRect(lbX + 4, lbY - 4, 12, 3);
  ctx.fillStyle = '#B09010';
  ctx.fillRect(lbX + 4, lbY + 3, 12, 3);
  // Studs on yellow
  ctx.fillStyle = '#F0E060';
  ctx.fillRect(lbX + 7, lbY - 7, 4, 3);

  // Component diagram on wall
  const cdX = px + w - 60;
  const cdY = py + 35;
  ctx.fillStyle = '#F8F8F0';
  ctx.fillRect(cdX, cdY, 30, 22);
  ctx.strokeStyle = '#C0C0B0';
  ctx.lineWidth = 1;
  ctx.strokeRect(cdX, cdY, 30, 22);
  // Component boxes
  ctx.fillStyle = '#A0D0F0';
  ctx.fillRect(cdX + 3, cdY + 3, 8, 6);
  ctx.fillStyle = '#F0A0A0';
  ctx.fillRect(cdX + 19, cdY + 3, 8, 6);
  ctx.fillStyle = '#A0F0A0';
  ctx.fillRect(cdX + 11, cdY + 13, 8, 6);
  // Connecting lines
  ctx.strokeStyle = '#606060';
  ctx.beginPath();
  ctx.moveTo(cdX + 11, cdY + 6);
  ctx.lineTo(cdX + 19, cdY + 6);
  ctx.moveTo(cdX + 7, cdY + 9);
  ctx.lineTo(cdX + 7, cdY + 16);
  ctx.lineTo(cdX + 11, cdY + 16);
  ctx.moveTo(cdX + 23, cdY + 9);
  ctx.lineTo(cdX + 23, cdY + 16);
  ctx.lineTo(cdX + 19, cdY + 16);
  ctx.stroke();
  // Animated pulse on connection
  const pulseOffset = (frame * 0.05) % 1;
  ctx.fillStyle = '#4080FF';
  ctx.beginPath();
  ctx.arc(cdX + 11 + 8 * pulseOffset, cdY + 6, 1.5, 0, Math.PI * 2);
  ctx.fill();

  // Puzzle pieces decoration
  const pzX = px + 90;
  const pzY = py + 10;
  // First piece (blue)
  ctx.fillStyle = '#4080C0';
  ctx.fillRect(pzX, pzY, 10, 10);
  ctx.fillStyle = '#5090D0';
  ctx.beginPath();
  ctx.arc(pzX + 10, pzY + 5, 3, -Math.PI/2, Math.PI/2);
  ctx.fill();
  ctx.fillStyle = '#3070B0';
  ctx.beginPath();
  ctx.arc(pzX + 5, pzY + 10, 3, 0, Math.PI);
  ctx.fill();
  // Second piece (green) - connected
  ctx.fillStyle = '#40A040';
  ctx.fillRect(pzX + 13, pzY, 10, 10);
  ctx.fillStyle = '#50B050';
  ctx.beginPath();
  ctx.arc(pzX + 23, pzY + 5, 3, -Math.PI/2, Math.PI/2);
  ctx.fill();
  // Notch cut out
  ctx.fillStyle = '#F8F8F0';  // Same as wall
  ctx.beginPath();
  ctx.arc(pzX + 13, pzY + 5, 3, Math.PI/2, -Math.PI/2);
  ctx.fill();
};

const drawSrcDecorations = (
  ctx: CanvasRenderingContext2D,
  px: number, py: number, w: number, h: number, frame: number
) => {
  // Large plant
  const lpX = px + w - 30;
  const lpY = py + 25;
  ctx.fillStyle = 'rgba(40, 60, 30, 0.3)';
  ctx.beginPath();
  ctx.ellipse(lpX + 8, lpY + 28, 12, 4, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#8A6A4A';
  ctx.fillRect(lpX, lpY + 16, 16, 12);
  ctx.fillStyle = '#9A7A5A';
  ctx.fillRect(lpX - 2, lpY + 14, 20, 4);
  ctx.fillStyle = '#38882A';
  ctx.beginPath();
  ctx.ellipse(lpX + 8, lpY + 4, 14, 14, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#48A838';
  ctx.beginPath();
  ctx.ellipse(lpX + 6, lpY, 10, 10, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#58B848';
  ctx.beginPath();
  ctx.ellipse(lpX + 10, lpY - 2, 6, 6, 0, 0, Math.PI * 2);
  ctx.fill();

  // Filing cabinets
  const fcX = px + 20;
  const fcY = py + h - 45;
  ctx.fillStyle = 'rgba(60, 60, 70, 0.2)';
  ctx.fillRect(fcX + 2, fcY + 28, 18, 4);
  ctx.fillStyle = '#606870';
  ctx.fillRect(fcX, fcY, 18, 28);
  ctx.fillStyle = '#707880';
  ctx.fillRect(fcX, fcY, 18, 3);
  ctx.fillStyle = '#505860';
  ctx.fillRect(fcX, fcY + 25, 18, 3);
  for (let d = 0; d < 3; d++) {
    ctx.fillStyle = '#585060';
    ctx.fillRect(fcX + 2, fcY + 4 + d * 8, 14, 6);
    ctx.fillStyle = '#C0C0C0';
    ctx.fillRect(fcX + 7, fcY + 6 + d * 8, 4, 2);
  }

  const fc2X = fcX + 22;
  ctx.fillStyle = 'rgba(60, 60, 70, 0.2)';
  ctx.fillRect(fc2X + 2, fcY + 28, 18, 4);
  ctx.fillStyle = '#606870';
  ctx.fillRect(fc2X, fcY, 18, 28);
  ctx.fillStyle = '#707880';
  ctx.fillRect(fc2X, fcY, 18, 3);
  ctx.fillStyle = '#505860';
  ctx.fillRect(fc2X, fcY + 25, 18, 3);
  for (let d = 0; d < 3; d++) {
    ctx.fillStyle = '#585060';
    ctx.fillRect(fc2X + 2, fcY + 4 + d * 8, 14, 6);
    ctx.fillStyle = '#C0C0C0';
    ctx.fillRect(fc2X + 7, fcY + 6 + d * 8, 4, 2);
  }

  // Supply shelf
  const ssX = px + 60;
  const ssY = py + 12;
  ctx.fillStyle = '#A08060';
  ctx.fillRect(ssX, ssY, 40, 4);
  ctx.fillStyle = '#B09070';
  ctx.fillRect(ssX, ssY, 40, 2);
  ctx.fillStyle = '#4080C0';
  ctx.fillRect(ssX + 4, ssY - 10, 6, 10);
  ctx.fillStyle = '#C04040';
  ctx.fillRect(ssX + 12, ssY - 12, 6, 12);
  ctx.fillStyle = '#40A040';
  ctx.fillRect(ssX + 20, ssY - 8, 6, 8);
  ctx.fillStyle = '#E0A020';
  ctx.fillRect(ssX + 28, ssY - 10, 6, 10);

  // Trash can
  const tcX = px + w - 55;
  const tcY = py + h - 30;
  ctx.fillStyle = 'rgba(50, 50, 60, 0.2)';
  ctx.beginPath();
  ctx.ellipse(tcX + 6, tcY + 16, 8, 3, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#505860';
  ctx.fillRect(tcX, tcY, 12, 16);
  ctx.fillStyle = '#606870';
  ctx.fillRect(tcX - 1, tcY, 14, 3);
  ctx.fillStyle = '#404850';
  ctx.fillRect(tcX, tcY + 13, 12, 3);

  // Code documentation binder
  const bdX = px + 50;
  const bdY = py + 10;
  ctx.fillStyle = '#3050A0';
  ctx.fillRect(bdX, bdY, 16, 20);
  ctx.fillStyle = '#4060B0';
  ctx.fillRect(bdX, bdY, 16, 3);
  ctx.fillStyle = '#2040A0';
  ctx.fillRect(bdX, bdY + 17, 16, 3);
  // Spine
  ctx.fillStyle = '#203080';
  ctx.fillRect(bdX, bdY, 3, 20);
  // Ring holes
  ctx.fillStyle = '#C0C0C0';
  ctx.fillRect(bdX + 1, bdY + 4, 2, 2);
  ctx.fillRect(bdX + 1, bdY + 9, 2, 2);
  ctx.fillRect(bdX + 1, bdY + 14, 2, 2);
  // Label
  ctx.fillStyle = '#F0F0E0';
  ctx.fillRect(bdX + 5, bdY + 6, 8, 8);
  ctx.fillStyle = '#404040';
  ctx.fillRect(bdX + 6, bdY + 8, 6, 1);
  ctx.fillRect(bdX + 6, bdY + 10, 4, 1);

  // Monitor showing code with animated cursor
  const cmX = px + 75;
  const cmY = py + 15;
  // Monitor stand
  ctx.fillStyle = '#505050';
  ctx.fillRect(cmX + 8, cmY + 22, 8, 6);
  ctx.fillStyle = '#404040';
  ctx.fillRect(cmX + 4, cmY + 26, 16, 3);
  // Monitor frame
  ctx.fillStyle = '#404040';
  ctx.fillRect(cmX, cmY, 24, 22);
  ctx.fillStyle = '#484848';
  ctx.fillRect(cmX, cmY, 24, 2);
  // Screen
  ctx.fillStyle = '#1E1E2E';
  ctx.fillRect(cmX + 2, cmY + 2, 20, 18);
  // Code lines (syntax highlighted)
  ctx.fillStyle = '#C586C0';  // Purple (keyword)
  ctx.fillRect(cmX + 4, cmY + 4, 6, 1);
  ctx.fillStyle = '#9CDCFE';  // Blue (variable)
  ctx.fillRect(cmX + 11, cmY + 4, 8, 1);
  ctx.fillStyle = '#DCDCAA';  // Yellow (function)
  ctx.fillRect(cmX + 4, cmY + 7, 10, 1);
  ctx.fillStyle = '#CE9178';  // Orange (string)
  ctx.fillRect(cmX + 6, cmY + 10, 12, 1);
  ctx.fillStyle = '#608B4E';  // Green (comment)
  ctx.fillRect(cmX + 4, cmY + 13, 14, 1);
  ctx.fillStyle = '#9CDCFE';
  ctx.fillRect(cmX + 4, cmY + 16, 8, 1);
  // Animated cursor
  const cursorVisible = Math.floor(frame * 0.03) % 2 === 0;
  if (cursorVisible) {
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(cmX + 13, cmY + 16, 1, 2);
  }

  // Stack of papers
  const ppX = px + w - 35;
  const ppY = py + h - 45;
  // Shadow
  ctx.fillStyle = 'rgba(60, 60, 70, 0.2)';
  ctx.fillRect(ppX + 3, ppY + 18, 16, 3);
  // Papers
  for (let p = 0; p < 3; p++) {
    ctx.fillStyle = '#F8F8F0';
    ctx.fillRect(ppX + p, ppY + p * 2, 14, 16);
    ctx.fillStyle = '#E8E8E0';
    ctx.fillRect(ppX + p, ppY + p * 2 + 14, 14, 2);
    // Text lines
    ctx.fillStyle = '#A0A0A0';
    ctx.fillRect(ppX + p + 2, ppY + p * 2 + 3, 10, 1);
    ctx.fillRect(ppX + p + 2, ppY + p * 2 + 6, 8, 1);
    ctx.fillRect(ppX + p + 2, ppY + p * 2 + 9, 10, 1);
  }

  // Coffee mug
  const mgX = px + 105;
  const mgY = py + 12;
  ctx.fillStyle = 'rgba(40, 30, 20, 0.2)';
  ctx.beginPath();
  ctx.ellipse(mgX + 4, mgY + 12, 5, 2, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#E8E0D0';
  ctx.fillRect(mgX, mgY, 8, 12);
  ctx.fillStyle = '#F0E8E0';
  ctx.fillRect(mgX, mgY, 8, 2);
  ctx.fillStyle = '#D8D0C0';
  ctx.fillRect(mgX, mgY + 10, 8, 2);
  // Handle
  ctx.strokeStyle = '#E8E0D0';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(mgX + 10, mgY + 6, 3, -Math.PI/2, Math.PI/2);
  ctx.stroke();
  ctx.lineWidth = 1;
  // Coffee inside
  ctx.fillStyle = '#4A3020';
  ctx.fillRect(mgX + 1, mgY + 1, 6, 2);
  // Steam
  const steamPhase = (frame * 0.04) % 1;
  const steamOpacity = (1 - steamPhase) * 0.3;
  ctx.fillStyle = `rgba(255, 255, 255, ${steamOpacity})`;
  ctx.beginPath();
  ctx.arc(mgX + 3 + Math.sin(frame * 0.03) * 1, mgY - 2 - steamPhase * 6, 1.5, 0, Math.PI * 2);
  ctx.fill();
};

const drawUtilsDecorations = (
  ctx: CanvasRenderingContext2D,
  px: number, py: number, w: number, h: number, frame: number
) => {
  // Small bookshelf
  const bsX = px + 15;
  const bsY = py + 15;
  ctx.fillStyle = '#8A7A6A';
  ctx.fillRect(bsX, bsY, 24, 18);
  ctx.fillStyle = '#9A8A7A';
  ctx.fillRect(bsX, bsY, 24, 2);
  ctx.fillStyle = '#7A6A5A';
  ctx.fillRect(bsX, bsY + 8, 24, 2);
  ctx.fillRect(bsX, bsY + 16, 24, 2);
  ctx.fillStyle = '#B04040';
  ctx.fillRect(bsX + 2, bsY + 2, 4, 6);
  ctx.fillStyle = '#4080B0';
  ctx.fillRect(bsX + 7, bsY + 2, 5, 6);
  ctx.fillStyle = '#40A040';
  ctx.fillRect(bsX + 13, bsY + 3, 4, 5);
  ctx.fillStyle = '#B0A040';
  ctx.fillRect(bsX + 18, bsY + 2, 4, 6);
  ctx.fillStyle = '#8040A0';
  ctx.fillRect(bsX + 3, bsY + 10, 6, 6);
  ctx.fillStyle = '#A08040';
  ctx.fillRect(bsX + 10, bsY + 11, 5, 5);
  ctx.fillStyle = '#406080';
  ctx.fillRect(bsX + 16, bsY + 10, 5, 6);

  // Small plant
  const spX = px + w - 25;
  const spY = py + h - 30;
  ctx.fillStyle = 'rgba(40, 60, 30, 0.2)';
  ctx.beginPath();
  ctx.ellipse(spX + 5, spY + 16, 6, 2, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#806040';
  ctx.fillRect(spX + 2, spY + 10, 6, 6);
  ctx.fillStyle = '#38882A';
  ctx.beginPath();
  ctx.ellipse(spX + 5, spY + 5, 7, 7, 0, 0, Math.PI * 2);
  ctx.fill();

  // Calculator
  const clcX = px + 50;
  const clcY = py + 12;
  ctx.fillStyle = '#404040';
  ctx.fillRect(clcX, clcY, 16, 22);
  ctx.fillStyle = '#484848';
  ctx.fillRect(clcX, clcY, 16, 2);
  ctx.fillStyle = '#303030';
  ctx.fillRect(clcX, clcY + 20, 16, 2);
  // Display
  ctx.fillStyle = '#90B090';
  ctx.fillRect(clcX + 2, clcY + 3, 12, 5);
  ctx.fillStyle = '#506050';
  // Animated display number
  const calcNum = Math.floor(frame * 0.01) % 1000;
  ctx.font = '4px monospace';
  ctx.fillText(String(calcNum).padStart(4, ' '), clcX + 3, clcY + 7);
  // Buttons
  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 4; col++) {
      ctx.fillStyle = row === 0 && col === 3 ? '#C04040' : '#606060';
      ctx.fillRect(clcX + 2 + col * 3.5, clcY + 10 + row * 3, 3, 2);
    }
  }

  // Reference card / cheat sheet
  const rcX = px + 70;
  const rcY = py + 8;
  ctx.fillStyle = '#F0E8D0';
  ctx.fillRect(rcX, rcY, 20, 28);
  ctx.fillStyle = '#E0D8C0';
  ctx.fillRect(rcX, rcY + 26, 20, 2);
  // Header
  ctx.fillStyle = '#4080C0';
  ctx.fillRect(rcX, rcY, 20, 5);
  ctx.fillStyle = '#F0F0F0';
  ctx.fillRect(rcX + 3, rcY + 2, 14, 1);
  // Content lines
  ctx.fillStyle = '#606060';
  for (let line = 0; line < 6; line++) {
    ctx.fillRect(rcX + 2, rcY + 8 + line * 3, 8 + (line % 2) * 4, 1);
    ctx.fillStyle = '#A0A0A0';
    ctx.fillRect(rcX + 12, rcY + 8 + line * 3, 6, 1);
    ctx.fillStyle = '#606060';
  }

  // Ruler
  const ruX = px + w - 50;
  const ruY = py + 15;
  ctx.fillStyle = '#E8D880';
  ctx.fillRect(ruX, ruY, 30, 6);
  ctx.fillStyle = '#D0C070';
  ctx.fillRect(ruX, ruY + 4, 30, 2);
  // Measurement marks
  ctx.fillStyle = '#404040';
  for (let mark = 0; mark < 10; mark++) {
    const markH = mark % 5 === 0 ? 3 : 2;
    ctx.fillRect(ruX + 3 + mark * 2.5, ruY + 1, 1, markH);
  }

  // Tape dispenser
  const tdX = px + w - 40;
  const tdY = py + h - 35;
  ctx.fillStyle = 'rgba(40, 30, 30, 0.2)';
  ctx.fillRect(tdX + 2, tdY + 12, 14, 3);
  ctx.fillStyle = '#505050';
  ctx.fillRect(tdX, tdY, 14, 12);
  ctx.fillStyle = '#606060';
  ctx.fillRect(tdX, tdY, 14, 2);
  ctx.fillStyle = '#404040';
  ctx.fillRect(tdX, tdY + 10, 14, 2);
  // Tape roll
  ctx.fillStyle = '#C8B888';
  ctx.beginPath();
  ctx.arc(tdX + 7, tdY + 6, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#8B6914';
  ctx.beginPath();
  ctx.arc(tdX + 7, tdY + 6, 2, 0, Math.PI * 2);
  ctx.fill();
  // Cutter edge
  ctx.fillStyle = '#808080';
  ctx.fillRect(tdX + 12, tdY + 4, 3, 4);
  // Tape strip
  ctx.fillStyle = '#DDD090';
  ctx.fillRect(tdX + 11, tdY + 5, 5, 1);

  // Stapler
  const stpX = px + 95;
  const stpY = py + h - 25;
  ctx.fillStyle = 'rgba(40, 30, 40, 0.2)';
  ctx.fillRect(stpX + 1, stpY + 8, 14, 3);
  ctx.fillStyle = '#303030';
  ctx.fillRect(stpX, stpY + 4, 14, 6);
  ctx.fillStyle = '#E04040';
  ctx.fillRect(stpX, stpY, 14, 6);
  ctx.fillStyle = '#F05050';
  ctx.fillRect(stpX, stpY, 14, 2);
  ctx.fillStyle = '#C03030';
  ctx.fillRect(stpX, stpY + 4, 14, 2);

  // Pen holder with pens
  const phX = px + w - 65;
  const phY = py + h - 40;
  ctx.fillStyle = 'rgba(40, 40, 50, 0.2)';
  ctx.beginPath();
  ctx.ellipse(phX + 6, phY + 18, 7, 2, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#505860';
  ctx.fillRect(phX, phY + 6, 12, 12);
  ctx.fillStyle = '#606870';
  ctx.fillRect(phX, phY + 6, 12, 2);
  // Pens
  ctx.fillStyle = '#3060A0';
  ctx.fillRect(phX + 2, phY - 2, 2, 10);
  ctx.fillStyle = '#A03030';
  ctx.fillRect(phX + 5, phY - 4, 2, 12);
  ctx.fillStyle = '#303030';
  ctx.fillRect(phX + 8, phY, 2, 8);
  // Pen tips
  ctx.fillStyle = '#808080';
  ctx.fillRect(phX + 2, phY - 4, 2, 2);
  ctx.fillRect(phX + 5, phY - 6, 2, 2);
  ctx.fillRect(phX + 8, phY - 2, 2, 2);
};
