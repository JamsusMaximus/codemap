// Coffee shop drawing
import { RoomLayout } from './types';

// Draw coffee shop in corridor area
export const drawCoffeeShop = (
  ctx: CanvasRenderingContext2D,
  _layout: RoomLayout,
  hotelX: number, hotelY: number,
  hotelW: number, hotelH: number
) => {
  const coffeeX = hotelX + hotelW * 0.68;
  const coffeeY = hotelY + hotelH * 0.84;

  // Coffee shop floor area
  ctx.fillStyle = '#C8A888';
  ctx.fillRect(coffeeX - 10, coffeeY - 5, 140, 55);
  ctx.fillStyle = '#D8B898';
  for (let ty = 0; ty < 4; ty++) {
    for (let tx = 0; tx < 9; tx++) {
      if ((tx + ty) % 2 === 0) {
        ctx.fillRect(coffeeX - 10 + tx * 16, coffeeY - 5 + ty * 14, 15, 13);
      }
    }
  }

  // Coffee counter
  const barX = coffeeX;
  const barY = coffeeY;
  ctx.fillStyle = 'rgba(60, 40, 20, 0.25)';
  ctx.fillRect(barX + 2, barY + 22, 70, 5);
  ctx.fillStyle = '#5C4033';
  ctx.fillRect(barX, barY, 70, 22);
  ctx.fillStyle = '#6B4C3A';
  ctx.fillRect(barX, barY, 70, 3);
  ctx.fillStyle = '#D8C8B8';
  ctx.fillRect(barX - 2, barY - 3, 74, 5);
  ctx.fillStyle = '#E8D8C8';
  ctx.fillRect(barX - 2, barY - 3, 74, 2);

  // Espresso machine
  const espX = barX + 8;
  const espY = barY - 15;
  ctx.fillStyle = '#404040';
  ctx.fillRect(espX, espY, 18, 14);
  ctx.fillStyle = '#505050';
  ctx.fillRect(espX, espY, 18, 3);
  ctx.fillStyle = '#303030';
  ctx.fillRect(espX, espY + 11, 18, 3);
  ctx.fillStyle = '#C0C0C0';
  ctx.fillRect(espX + 3, espY + 6, 5, 6);
  ctx.fillRect(espX + 10, espY + 6, 5, 6);
  ctx.fillStyle = '#F0F0E0';
  ctx.beginPath();
  ctx.arc(espX + 9, espY + 3, 2, 0, Math.PI * 2);
  ctx.fill();

  // Coffee cups
  const cupX = barX + 32;
  const cupY = barY - 10;
  ctx.fillStyle = '#F0F0E8';
  ctx.fillRect(cupX, cupY, 5, 7);
  ctx.fillRect(cupX + 7, cupY + 1, 5, 6);
  ctx.fillRect(cupX + 14, cupY, 5, 7);

  // Pastry display
  const pastryX = barX + 52;
  const pastryY = barY - 12;
  ctx.fillStyle = '#E8E8E0';
  ctx.fillRect(pastryX, pastryY, 18, 12);
  ctx.fillStyle = 'rgba(200, 230, 255, 0.4)';
  ctx.fillRect(pastryX + 2, pastryY + 2, 14, 8);
  ctx.fillStyle = '#D4A574';
  ctx.fillRect(pastryX + 3, pastryY + 5, 4, 3);
  ctx.fillStyle = '#8B4513';
  ctx.fillRect(pastryX + 9, pastryY + 5, 4, 4);

  // Menu board
  const menuX = barX + 20;
  const menuY = barY - 30;
  ctx.fillStyle = '#2C1810';
  ctx.fillRect(menuX, menuY, 40, 18);
  ctx.fillStyle = '#3C2820';
  ctx.fillRect(menuX + 2, menuY + 2, 36, 14);
  ctx.fillStyle = '#F0E8D8';
  ctx.font = '5px sans-serif';
  ctx.fillText('COFFEE $3', menuX + 5, menuY + 8);
  ctx.fillText('LATTE  $4', menuX + 5, menuY + 14);

  // Cafe table
  const t1X = coffeeX + 85;
  const t1Y = coffeeY + 5;
  ctx.fillStyle = 'rgba(60, 40, 20, 0.2)';
  ctx.beginPath();
  ctx.ellipse(t1X + 8, t1Y + 14, 10, 3, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#8B7355';
  ctx.fillRect(t1X + 5, t1Y + 6, 5, 10);
  ctx.fillStyle = '#A08060';
  ctx.beginPath();
  ctx.arc(t1X + 8, t1Y + 5, 10, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#B09070';
  ctx.beginPath();
  ctx.arc(t1X + 8, t1Y + 3, 8, 0, Math.PI * 2);
  ctx.fill();

  // Coffee cup on table
  ctx.fillStyle = '#F0F0E8';
  ctx.fillRect(t1X + 4, t1Y - 1, 5, 4);
  ctx.fillStyle = '#6B4423';
  ctx.fillRect(t1X + 5, t1Y, 3, 2);

  // Chairs
  ctx.fillStyle = '#604020';
  ctx.fillRect(t1X - 8, t1Y, 8, 6);
  ctx.fillRect(t1X + 18, t1Y, 8, 6);

  // Coffee shop sign
  const signX = coffeeX + 20;
  const signY = coffeeY - 40;
  ctx.fillStyle = '#8B4513';
  ctx.fillRect(signX, signY, 35, 12);
  ctx.fillStyle = '#A0522D';
  ctx.fillRect(signX + 2, signY + 2, 31, 8);
  ctx.fillStyle = '#FFE4B5';
  ctx.font = 'bold 7px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('CAFE', signX + 17, signY + 9);
  ctx.textAlign = 'left';
};
