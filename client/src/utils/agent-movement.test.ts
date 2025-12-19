import { describe, it, expect } from 'vitest';
import {
  getAgentColorOffset,
  getSpawnPositionInLobby,
  getSpawnPositionAtFile,
  moveTowardsTarget,
  hasReachedTarget,
  shouldAgentGoIdle,
  getCoffeeShopOffset,
  shouldRemoveAgent,
  isValidAgentId,
  findFilePositionWithFallback,
} from './agent-movement';

describe('getAgentColorOffset', () => {
  it('returns negative x offset for colorIndex 0', () => {
    const offset = getAgentColorOffset(0);
    expect(offset.x).toBe(-10);
    expect(offset.y).toBe(0);
  });

  it('returns zero x offset for colorIndex 1', () => {
    const offset = getAgentColorOffset(1);
    expect(offset.x).toBe(0);
    expect(offset.y).toBe(0);
  });

  it('returns positive x offset for colorIndex 2', () => {
    const offset = getAgentColorOffset(2);
    expect(offset.x).toBe(10);
    expect(offset.y).toBe(0);
  });

  it('wraps to second row at colorIndex 3', () => {
    const offset = getAgentColorOffset(3);
    expect(offset.x).toBe(-10);
    expect(offset.y).toBe(8);
  });

  it('handles multiple rows correctly', () => {
    const offset = getAgentColorOffset(7); // row 2, col 1
    expect(offset.x).toBe(0);
    expect(offset.y).toBe(16);
  });
});

describe('getSpawnPositionInLobby', () => {
  const TILE_SIZE = 16;

  it('spawns first agent at center-left of layout', () => {
    const pos = getSpawnPositionInLobby(0, 0, 40, 30, 0, TILE_SIZE);
    expect(pos.x).toBe((0 + 40 / 2 - 2) * TILE_SIZE);
    expect(pos.y).toBe((0 + 30 - 4) * TILE_SIZE);
  });

  it('spreads agents horizontally in groups of 4', () => {
    const pos0 = getSpawnPositionInLobby(0, 0, 40, 30, 0, TILE_SIZE);
    const pos1 = getSpawnPositionInLobby(0, 0, 40, 30, 1, TILE_SIZE);
    expect(pos1.x - pos0.x).toBe(2 * TILE_SIZE);
    expect(pos1.y).toBe(pos0.y);
  });

  it('moves to next row after 4 agents', () => {
    const pos0 = getSpawnPositionInLobby(0, 0, 40, 30, 0, TILE_SIZE);
    const pos4 = getSpawnPositionInLobby(0, 0, 40, 30, 4, TILE_SIZE);
    expect(pos4.x).toBe(pos0.x); // Same column
    expect(pos4.y).toBe(pos0.y - 2 * TILE_SIZE); // Row above
  });
});

describe('getSpawnPositionAtFile', () => {
  it('applies color offset to file position', () => {
    const filePos = { x: 100, y: 200 };
    const pos = getSpawnPositionAtFile(filePos, 0);
    expect(pos.x).toBe(100 - 10); // colorIndex 0 has x offset -10
    expect(pos.y).toBe(200 - 28); // Always 28 pixels above desk
  });

  it('centers agent at colorIndex 1', () => {
    const filePos = { x: 100, y: 200 };
    const pos = getSpawnPositionAtFile(filePos, 1);
    expect(pos.x).toBe(100); // No x offset
    expect(pos.y).toBe(200 - 28);
  });
});

describe('moveTowardsTarget', () => {
  const SPEED = 6;

  it('moves horizontally when dx > dy', () => {
    const result = moveTowardsTarget(0, 0, 100, 10, SPEED);
    expect(result.x).toBe(SPEED);
    expect(result.y).toBe(0);
    expect(result.isMoving).toBe(true);
  });

  it('moves vertically when dy > dx', () => {
    const result = moveTowardsTarget(0, 0, 10, 100, SPEED);
    expect(result.x).toBe(0);
    expect(result.y).toBe(SPEED);
    expect(result.isMoving).toBe(true);
  });

  it('stops when within threshold of target', () => {
    const result = moveTowardsTarget(99.8, 99.8, 100, 100, SPEED, 0.5);
    expect(result.x).toBe(100);
    expect(result.y).toBe(100);
    expect(result.isMoving).toBe(false);
  });

  it('moves in negative direction correctly', () => {
    const result = moveTowardsTarget(100, 100, 0, 50, SPEED);
    expect(result.x).toBe(100 - SPEED);
    expect(result.y).toBe(100);
  });

  it('does not overshoot target', () => {
    const result = moveTowardsTarget(98, 0, 100, 0, SPEED);
    expect(result.x).toBe(100); // Only moves 2, not 6
    expect(result.isMoving).toBe(true); // Still moving until threshold check
  });
});

describe('hasReachedTarget', () => {
  it('returns true when at exact target', () => {
    expect(hasReachedTarget(100, 100, 100, 100)).toBe(true);
  });

  it('returns true when within threshold', () => {
    expect(hasReachedTarget(100.3, 100.3, 100, 100, 0.5)).toBe(true);
  });

  it('returns false when outside threshold', () => {
    expect(hasReachedTarget(101, 101, 100, 100, 0.5)).toBe(false);
  });
});

describe('shouldAgentGoIdle', () => {
  const IDLE_THRESHOLD = 30000;

  it('returns false when recently active', () => {
    expect(shouldAgentGoIdle(5000, false, false, IDLE_THRESHOLD)).toBe(false);
  });

  it('returns true after idle threshold', () => {
    expect(shouldAgentGoIdle(35000, false, false, IDLE_THRESHOLD)).toBe(true);
  });

  it('returns false when thinking even if idle', () => {
    expect(shouldAgentGoIdle(60000, true, false, IDLE_THRESHOLD)).toBe(false);
  });

  it('returns false when waiting for input even if idle', () => {
    expect(shouldAgentGoIdle(60000, false, true, IDLE_THRESHOLD)).toBe(false);
  });

  it('returns false at exact threshold', () => {
    expect(shouldAgentGoIdle(30000, false, false, IDLE_THRESHOLD)).toBe(false);
  });

  it('returns true just past threshold', () => {
    expect(shouldAgentGoIdle(30001, false, false, IDLE_THRESHOLD)).toBe(true);
  });
});

describe('getCoffeeShopOffset', () => {
  it('returns origin for colorIndex 0', () => {
    const offset = getCoffeeShopOffset(0);
    expect(offset.x).toBe(0);
    expect(offset.y).toBe(0);
  });

  it('spreads horizontally in groups of 3', () => {
    const offset0 = getCoffeeShopOffset(0);
    const offset1 = getCoffeeShopOffset(1);
    expect(offset1.x - offset0.x).toBe(15);
    expect(offset1.y).toBe(offset0.y);
  });

  it('moves to next row after 3 agents', () => {
    const offset0 = getCoffeeShopOffset(0);
    const offset3 = getCoffeeShopOffset(3);
    expect(offset3.x).toBe(offset0.x);
    expect(offset3.y).toBe(offset0.y + 12);
  });
});

describe('shouldRemoveAgent', () => {
  const GRACE_PERIOD = 30000;

  it('returns false when recently seen', () => {
    expect(shouldRemoveAgent(95000, 100000, GRACE_PERIOD)).toBe(false);
  });

  it('returns true after grace period expires', () => {
    expect(shouldRemoveAgent(60000, 100000, GRACE_PERIOD)).toBe(true);
  });

  it('returns false at exact grace period boundary', () => {
    expect(shouldRemoveAgent(70000, 100000, GRACE_PERIOD)).toBe(false);
  });

  it('returns true just past grace period', () => {
    expect(shouldRemoveAgent(69999, 100000, GRACE_PERIOD)).toBe(true);
  });
});

describe('isValidAgentId', () => {
  it('accepts valid UUID format', () => {
    expect(isValidAgentId('a1b2c3d4-e5f6-7890-abcd-ef1234567890')).toBe(true);
  });

  it('accepts short UUID prefix', () => {
    expect(isValidAgentId('a1b2c3d4')).toBe(true);
  });

  it('rejects empty string', () => {
    expect(isValidAgentId('')).toBe(false);
  });

  it('rejects null-like strings', () => {
    expect(isValidAgentId('null')).toBe(false);
    expect(isValidAgentId('undefined')).toBe(false);
  });

  it('rejects all-zeros', () => {
    expect(isValidAgentId('00000000')).toBe(false);
  });

  it('rejects short strings', () => {
    expect(isValidAgentId('abc')).toBe(false);
  });

  it('rejects invalid characters', () => {
    expect(isValidAgentId('agent_123')).toBe(false);
    expect(isValidAgentId('hello world')).toBe(false);
  });

  it('accepts uppercase hex', () => {
    expect(isValidAgentId('A1B2C3D4')).toBe(true);
  });
});

describe('findFilePositionWithFallback', () => {
  const positions = new Map([
    ['client/src/App.tsx', { x: 100, y: 100 }],
    ['client/src', { x: 50, y: 50 }],
    ['client', { x: 25, y: 25 }],
    ['.', { x: 0, y: 0 }],
  ]);

  it('finds exact file match', () => {
    const pos = findFilePositionWithFallback('client/src/App.tsx', positions);
    expect(pos).toEqual({ x: 100, y: 100 });
  });

  it('falls back to parent folder when file not found', () => {
    const pos = findFilePositionWithFallback('client/src/Unknown.tsx', positions);
    expect(pos).toEqual({ x: 50, y: 50 });
  });

  it('falls back to grandparent when parent not found', () => {
    const pos = findFilePositionWithFallback('client/other/File.tsx', positions);
    expect(pos).toEqual({ x: 25, y: 25 });
  });

  it('falls back to root when no parents found', () => {
    const pos = findFilePositionWithFallback('unknown/path/File.tsx', positions);
    expect(pos).toEqual({ x: 0, y: 0 });
  });

  it('returns undefined when no root exists', () => {
    const noRoot = new Map([['client/src', { x: 50, y: 50 }]]);
    const pos = findFilePositionWithFallback('unknown/File.tsx', noRoot);
    expect(pos).toBeUndefined();
  });

  it('handles root file correctly', () => {
    const pos = findFilePositionWithFallback('README.md', positions);
    expect(pos).toEqual({ x: 0, y: 0 }); // Falls back to '.'
  });
});
