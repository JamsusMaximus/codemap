// Agent character drawing function
import { AgentCharacter } from './types';
import { CHARACTER_PALETTES, SKIN, OUTLINE } from './palette';

// Draw a single agent character with animations
export const drawAgentCharacter = (ctx: CanvasRenderingContext2D, char: AgentCharacter) => {
  const cx = char.x;
  const jumpOffset = char.waitingForInput ? Math.abs(Math.sin(char.frame * 0.15)) * 8 : 0;
  const cy = char.y - jumpOffset;
  const palette = CHARACTER_PALETTES[char.colorIndex % CHARACTER_PALETTES.length];
  const scale = 1.5;

  const blinkCycle = (char.frame % 180);
  const isBlinking = blinkCycle > 168 && blinkCycle < 180;

  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(scale, scale);

  const headTop = -32;
  const bodyTop = -16;
  const legsTop = -4;
  const feetBottom = 4;

  // Ground shadow
  ctx.fillStyle = 'rgba(60, 40, 20, 0.3)';
  ctx.beginPath();
  ctx.ellipse(0, feetBottom + 2, 10, 3, 0, 0, Math.PI * 2);
  ctx.fill();

  // Walking animation - subtle leg offset when moving
  const walkCycle = char.isMoving ? Math.sin(char.frame * 0.3) * 1.5 : 0;
  const leftLegOffset = walkCycle;
  const rightLegOffset = -walkCycle;

  // Legs
  ctx.fillStyle = palette.pants.shadow;
  ctx.fillRect(-5, legsTop + leftLegOffset, 4, 8);
  ctx.fillStyle = palette.pants.base;
  ctx.fillRect(-5, legsTop + leftLegOffset, 3, 7);
  ctx.fillStyle = palette.pants.shadow;
  ctx.fillRect(1, legsTop + rightLegOffset, 4, 8);
  ctx.fillStyle = palette.pants.base;
  ctx.fillRect(1, legsTop + rightLegOffset, 3, 7);

  // Feet
  ctx.fillStyle = OUTLINE;
  ctx.fillRect(-6, feetBottom - 3 + leftLegOffset, 5, 3);
  ctx.fillRect(1, feetBottom - 3 + rightLegOffset, 5, 3);

  // Body/Torso
  ctx.fillStyle = palette.shirt.dark;
  ctx.fillRect(-7, bodyTop, 14, 12);
  ctx.fillStyle = palette.shirt.mid;
  ctx.fillRect(-6, bodyTop + 1, 12, 10);
  ctx.fillStyle = palette.shirt.light;
  ctx.fillRect(-5, bodyTop + 1, 4, 3);

  // Arms
  ctx.fillStyle = palette.shirt.dark;
  ctx.fillRect(-10, bodyTop + 1, 4, 9);
  ctx.fillStyle = palette.shirt.mid;
  ctx.fillRect(-10, bodyTop + 1, 3, 8);
  ctx.fillStyle = SKIN.shadow;
  ctx.fillRect(-10, bodyTop + 9, 3, 3);
  ctx.fillStyle = SKIN.base;
  ctx.fillRect(-10, bodyTop + 9, 2, 2);

  ctx.fillStyle = palette.shirt.dark;
  ctx.fillRect(6, bodyTop + 1, 4, 9);
  ctx.fillStyle = palette.shirt.mid;
  ctx.fillRect(6, bodyTop + 1, 3, 8);
  ctx.fillStyle = SKIN.shadow;
  ctx.fillRect(7, bodyTop + 9, 3, 3);
  ctx.fillStyle = SKIN.base;
  ctx.fillRect(7, bodyTop + 9, 2, 2);

  // Head - hair
  const hairStyle = char.colorIndex % 5;
  ctx.fillStyle = palette.hair.dark;

  if (hairStyle === 0) {
    ctx.fillRect(-7, headTop, 14, 12);
    ctx.fillRect(-8, headTop + 2, 2, 5);
    ctx.fillRect(6, headTop + 1, 2, 6);
    ctx.fillRect(-3, headTop - 2, 3, 3);
    ctx.fillRect(1, headTop - 1, 2, 2);
  } else if (hairStyle === 1) {
    ctx.fillRect(-8, headTop, 16, 16);
    ctx.fillRect(-9, headTop + 4, 2, 12);
    ctx.fillRect(7, headTop + 4, 2, 12);
  } else if (hairStyle === 2) {
    ctx.fillRect(-6, headTop, 12, 10);
    ctx.fillRect(-7, headTop + 2, 14, 6);
  } else if (hairStyle === 3) {
    ctx.fillRect(-7, headTop, 14, 11);
    ctx.fillRect(-5, headTop - 3, 3, 4);
    ctx.fillRect(2, headTop - 2, 3, 3);
    ctx.fillRect(-8, headTop + 1, 3, 6);
    ctx.fillRect(5, headTop, 4, 7);
  } else {
    ctx.fillRect(-7, headTop, 14, 12);
    ctx.fillRect(-9, headTop + 2, 4, 7);
    ctx.fillRect(4, headTop - 1, 4, 5);
  }

  ctx.fillStyle = palette.hair.mid;
  ctx.fillRect(-5, headTop + 3, 10, 7);
  ctx.fillStyle = palette.hair.light;
  ctx.fillRect(-3, headTop + 3, 4, 2);

  // Face
  ctx.fillStyle = SKIN.base;
  ctx.fillRect(-5, headTop + 6, 10, 9);
  ctx.fillStyle = SKIN.shadow;
  ctx.fillRect(3, headTop + 7, 2, 7);

  // Bangs
  ctx.fillStyle = palette.hair.mid;
  if (hairStyle === 1) {
    ctx.fillRect(-5, headTop + 5, 8, 2);
    ctx.fillRect(-6, headTop + 6, 3, 2);
  } else {
    ctx.fillRect(-4, headTop + 5, 8, 2);
  }

  // Eyes
  const eyeY = headTop + 10;
  const eyesClosed = isBlinking || char.isIdle;
  if (eyesClosed) {
    ctx.fillStyle = '#282828';
    ctx.fillRect(-4, eyeY + 1, 2, 1);
    ctx.fillRect(2, eyeY + 1, 2, 1);
  } else {
    ctx.fillStyle = '#282828';
    ctx.fillRect(-4, eyeY, 2, 2);
    ctx.fillRect(2, eyeY, 2, 2);
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(-4, eyeY, 1, 1);
    ctx.fillRect(2, eyeY, 1, 1);
  }

  // Mouth
  ctx.fillStyle = SKIN.shadow;
  ctx.fillRect(-1, headTop + 13, 2, 1);

  // Outline
  ctx.fillStyle = OUTLINE;
  ctx.fillRect(-6, headTop + 5, 1, 10);
  ctx.fillRect(5, headTop + 5, 1, 10);
  ctx.fillRect(-5, headTop + 15, 10, 1);

  ctx.restore();

  // Name label (not scaled)
  ctx.font = 'bold 10px monospace';
  ctx.textAlign = 'center';
  ctx.fillStyle = 'rgba(0,0,0,0.5)';
  ctx.fillText(char.displayName, cx + 1, cy - 50);
  ctx.fillStyle = '#FFFFFF';
  ctx.fillText(char.displayName, cx, cy - 51);

  // ZZZ animation when idle
  if (char.isIdle) {
    ctx.font = 'bold 12px monospace';
    const zzzPhase = (char.frame * 0.05) % 3;
    const baseX = cx + 15;
    const baseY = cy - 60;

    for (let i = 0; i < 3; i++) {
      const offset = (zzzPhase + i) % 3;
      const zx = baseX + offset * 6;
      const zy = baseY - offset * 8;
      const alpha = 0.4 + (offset * 0.3);
      const size = 8 + offset * 2;

      ctx.font = `bold ${size}px monospace`;
      ctx.fillStyle = `rgba(100, 100, 180, ${alpha})`;
      ctx.fillText('z', zx + 1, zy + 1);
      ctx.fillStyle = `rgba(180, 180, 255, ${alpha})`;
      ctx.fillText('z', zx, zy);
    }
  }

  // Speech bubble
  const showBubble = char.waitingForInput || char.currentCommand;
  if (showBubble) {
    const bubbleText = char.waitingForInput ? "Hey! I'm stuck!" : char.currentCommand!;
    const isStuck = char.waitingForInput;
    const bubbleColor = isStuck ? '#FFE040' : '#FFFFFF';
    const borderColor = isStuck ? '#D0A000' : '#A0A0A0';
    const textColor = isStuck ? '#604000' : '#333333';

    ctx.font = 'bold 10px monospace';
    const tw = ctx.measureText(bubbleText).width;
    const bubblePadX = 8;
    const bubbleW = tw + bubblePadX * 2;
    const bubbleH = 18;
    const bubbleX = cx - bubbleW / 2;
    const bubbleY = cy - 85 - jumpOffset;
    const tailSize = 6;

    // Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
    ctx.beginPath();
    ctx.roundRect(bubbleX + 2, bubbleY + 2, bubbleW, bubbleH, 6);
    ctx.fill();

    // Bubble
    ctx.fillStyle = bubbleColor;
    ctx.beginPath();
    ctx.roundRect(bubbleX, bubbleY, bubbleW, bubbleH, 6);
    ctx.fill();

    ctx.strokeStyle = borderColor;
    ctx.lineWidth = isStuck ? 2 : 1;
    ctx.stroke();

    // Tail
    ctx.fillStyle = bubbleColor;
    ctx.beginPath();
    ctx.moveTo(cx - tailSize / 2, bubbleY + bubbleH);
    ctx.lineTo(cx, bubbleY + bubbleH + tailSize);
    ctx.lineTo(cx + tailSize / 2, bubbleY + bubbleH);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = borderColor;
    ctx.beginPath();
    ctx.moveTo(cx - tailSize / 2, bubbleY + bubbleH);
    ctx.lineTo(cx, bubbleY + bubbleH + tailSize);
    ctx.lineTo(cx + tailSize / 2, bubbleY + bubbleH);
    ctx.stroke();

    // Cover tail join
    ctx.fillStyle = bubbleColor;
    ctx.fillRect(cx - tailSize / 2 + 1, bubbleY + bubbleH - 1, tailSize - 2, 2);

    // Text
    ctx.fillStyle = textColor;
    ctx.textAlign = 'center';
    ctx.fillText(bubbleText, cx, bubbleY + 13);
  }
};
