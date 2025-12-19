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
    drawHooksDecorations(ctx, px, py, w, h);
  }

  // COMPONENTS FOLDER THEME
  if (name.includes('component')) {
    drawComponentsDecorations(ctx, px, py, w, h);
  }

  // SRC FOLDER
  if (name === 'src') {
    drawSrcDecorations(ctx, px, py, w, h);
  }

  // UTILS/TYPES folders
  if (name.includes('util') || name.includes('type') || name.includes('style')) {
    drawUtilsDecorations(ctx, px, py, w, h);
  }
};

const drawLobbyDecorations = (
  ctx: CanvasRenderingContext2D,
  px: number, py: number, w: number, h: number,
  room: RoomLayout, frame: number
) => {
  // Coat rack
  const crX = px + 20;
  const crY = py + 20;
  ctx.fillStyle = 'rgba(60, 40, 20, 0.25)';
  ctx.beginPath();
  ctx.ellipse(crX + 3, crY + 22, 6, 2, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#806848';
  ctx.fillRect(crX + 1, crY + 2, 4, 20);
  ctx.fillStyle = '#907858';
  ctx.fillRect(crX + 1, crY + 2, 2, 19);
  ctx.fillStyle = '#705838';
  ctx.fillRect(crX - 2, crY + 19, 10, 3);
  ctx.fillStyle = '#505050';
  ctx.fillRect(crX - 2, crY + 3, 4, 2);
  ctx.fillRect(crX + 4, crY + 3, 4, 2);
  ctx.fillStyle = '#4060A0';
  ctx.fillRect(crX - 3, crY + 4, 6, 8);
  ctx.fillStyle = '#5070B0';
  ctx.fillRect(crX - 3, crY + 4, 3, 7);

  // Umbrella stand
  const usX = px + 40;
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
};

const drawHooksDecorations = (
  ctx: CanvasRenderingContext2D,
  px: number, py: number, w: number, h: number
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
};

const drawComponentsDecorations = (
  ctx: CanvasRenderingContext2D,
  px: number, py: number, w: number, h: number
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
};

const drawSrcDecorations = (
  ctx: CanvasRenderingContext2D,
  px: number, py: number, w: number, h: number
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
};

const drawUtilsDecorations = (
  ctx: CanvasRenderingContext2D,
  px: number, py: number, w: number, h: number
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
};
