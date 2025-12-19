import { describe, it, expect } from 'vitest';
import {
  extractFilename,
  findMatchingFileId,
  calculateFlashOpacity,
  isFlashExpired,
  SCREEN_GLOW_HOLD,
  SCREEN_FADE_DURATION,
  ScreenFlash,
} from './screen-flash';

describe('extractFilename', () => {
  it('extracts filename from absolute path', () => {
    expect(extractFilename('/Users/james/code/project/src/file.ts')).toBe('file.ts');
  });

  it('extracts filename from relative path', () => {
    expect(extractFilename('src/components/App.tsx')).toBe('App.tsx');
  });

  it('handles single filename', () => {
    expect(extractFilename('file.ts')).toBe('file.ts');
  });

  it('returns empty string for empty path', () => {
    expect(extractFilename('')).toBe('');
  });

  it('handles path ending with slash', () => {
    expect(extractFilename('/path/to/dir/')).toBe('');
  });
});

describe('findMatchingFileId', () => {
  const knownFileIds = [
    'client/src/components/HabboRoom.tsx',
    'client/src/drawing/furniture.ts',
    'server/src/index.ts',
    'hooks/thinking-hook.sh',
  ];

  it('matches absolute path to relative file ID', () => {
    const result = findMatchingFileId(
      '/Users/james/code/codemap/client/src/components/HabboRoom.tsx',
      knownFileIds
    );
    expect(result).toBe('client/src/components/HabboRoom.tsx');
  });

  it('matches relative path to file ID', () => {
    const result = findMatchingFileId(
      'client/src/drawing/furniture.ts',
      knownFileIds
    );
    expect(result).toBe('client/src/drawing/furniture.ts');
  });

  it('matches by filename only when path differs', () => {
    const result = findMatchingFileId(
      '/different/path/furniture.ts',
      knownFileIds
    );
    expect(result).toBe('client/src/drawing/furniture.ts');
  });

  it('returns undefined for non-existent file', () => {
    const result = findMatchingFileId(
      '/path/to/unknown-file.ts',
      knownFileIds
    );
    expect(result).toBeUndefined();
  });

  it('returns undefined for empty path', () => {
    const result = findMatchingFileId('', knownFileIds);
    expect(result).toBeUndefined();
  });

  it('handles empty knownFileIds array', () => {
    const result = findMatchingFileId('/path/to/file.ts', []);
    expect(result).toBeUndefined();
  });
});

describe('calculateFlashOpacity', () => {
  const createFlash = (startTime: number): ScreenFlash => ({
    type: 'read',
    startTime,
  });

  it('returns 1 at the start of flash', () => {
    const flash = createFlash(1000);
    expect(calculateFlashOpacity(flash, 1000)).toBe(1);
  });

  it('returns 1 during hold period', () => {
    const flash = createFlash(1000);
    expect(calculateFlashOpacity(flash, 1000 + SCREEN_GLOW_HOLD - 1)).toBe(1);
  });

  it('returns 1 at exact end of hold period', () => {
    const flash = createFlash(1000);
    // At exactly SCREEN_GLOW_HOLD, it should start fading (so just under 1)
    const opacity = calculateFlashOpacity(flash, 1000 + SCREEN_GLOW_HOLD);
    expect(opacity).toBe(1); // Still 1 at the boundary
  });

  it('returns ~0.5 at midpoint of fade', () => {
    const flash = createFlash(1000);
    const midFade = 1000 + SCREEN_GLOW_HOLD + (SCREEN_FADE_DURATION / 2);
    const opacity = calculateFlashOpacity(flash, midFade);
    expect(opacity).toBeCloseTo(0.5, 1);
  });

  it('returns 0 after fade completes', () => {
    const flash = createFlash(1000);
    const afterFade = 1000 + SCREEN_GLOW_HOLD + SCREEN_FADE_DURATION + 1;
    expect(calculateFlashOpacity(flash, afterFade)).toBe(0);
  });

  it('returns 0 for flash that hasnt started', () => {
    const flash = createFlash(1000);
    expect(calculateFlashOpacity(flash, 500)).toBe(0);
  });

  it('fades linearly during fade period', () => {
    const flash = createFlash(0);
    const quarterFade = SCREEN_GLOW_HOLD + (SCREEN_FADE_DURATION * 0.25);
    const halfFade = SCREEN_GLOW_HOLD + (SCREEN_FADE_DURATION * 0.5);
    const threeQuarterFade = SCREEN_GLOW_HOLD + (SCREEN_FADE_DURATION * 0.75);

    expect(calculateFlashOpacity(flash, quarterFade)).toBeCloseTo(0.75, 2);
    expect(calculateFlashOpacity(flash, halfFade)).toBeCloseTo(0.5, 2);
    expect(calculateFlashOpacity(flash, threeQuarterFade)).toBeCloseTo(0.25, 2);
  });
});

describe('isFlashExpired', () => {
  const createFlash = (startTime: number): ScreenFlash => ({
    type: 'write',
    startTime,
  });

  it('returns false during hold period', () => {
    const flash = createFlash(1000);
    expect(isFlashExpired(flash, 1000 + SCREEN_GLOW_HOLD - 1)).toBe(false);
  });

  it('returns false during fade period', () => {
    const flash = createFlash(1000);
    const duringFade = 1000 + SCREEN_GLOW_HOLD + (SCREEN_FADE_DURATION / 2);
    expect(isFlashExpired(flash, duringFade)).toBe(false);
  });

  it('returns true after total duration', () => {
    const flash = createFlash(1000);
    const afterTotal = 1000 + SCREEN_GLOW_HOLD + SCREEN_FADE_DURATION;
    expect(isFlashExpired(flash, afterTotal)).toBe(true);
  });

  it('returns true well after duration', () => {
    const flash = createFlash(1000);
    expect(isFlashExpired(flash, 100000)).toBe(true);
  });
});

describe('timing constants', () => {
  it('SCREEN_GLOW_HOLD is 5 seconds', () => {
    expect(SCREEN_GLOW_HOLD).toBe(5000);
  });

  it('SCREEN_FADE_DURATION is 3 seconds', () => {
    expect(SCREEN_FADE_DURATION).toBe(3000);
  });

  it('total duration is 8 seconds', () => {
    expect(SCREEN_GLOW_HOLD + SCREEN_FADE_DURATION).toBe(8000);
  });
});

// Additional edge case tests for file matching with relative paths
describe('findMatchingFileId - relative path edge cases', () => {
  it('matches root file with ./ prefix', () => {
    const knownFileIds = ['./README.md', './package.json', 'client/src/App.tsx'];
    const result = findMatchingFileId('README.md', knownFileIds);
    expect(result).toBe('./README.md');
  });

  it('matches file when server sends relative path directly', () => {
    const knownFileIds = ['client/src/App.tsx', 'server/src/index.ts'];
    const result = findMatchingFileId('client/src/App.tsx', knownFileIds);
    expect(result).toBe('client/src/App.tsx');
  });

  it('matches first file when multiple have same name', () => {
    const knownFileIds = [
      'client/src/index.ts',
      'server/src/index.ts',
    ];
    // Should match the first one found
    const result = findMatchingFileId('/any/path/index.ts', knownFileIds);
    expect(result).toBe('client/src/index.ts');
  });

  it('handles deeply nested paths', () => {
    const knownFileIds = ['a/b/c/d/e/f/deep-file.ts'];
    const result = findMatchingFileId('deep-file.ts', knownFileIds);
    expect(result).toBe('a/b/c/d/e/f/deep-file.ts');
  });

  it('matches files with special characters in name', () => {
    const knownFileIds = ['src/file-with-dashes.ts', 'src/file.test.ts'];
    expect(findMatchingFileId('file-with-dashes.ts', knownFileIds)).toBe('src/file-with-dashes.ts');
    expect(findMatchingFileId('file.test.ts', knownFileIds)).toBe('src/file.test.ts');
  });

  it('does not match partial filenames', () => {
    const knownFileIds = ['src/App.tsx', 'src/AppContainer.tsx'];
    // Should not match 'App.tsx' when looking for just 'App'
    const result = findMatchingFileId('/path/App', knownFileIds);
    expect(result).toBeUndefined();
  });

  it('handles files with no extension', () => {
    const knownFileIds = ['Makefile', 'src/Dockerfile'];
    expect(findMatchingFileId('/project/Makefile', knownFileIds)).toBe('Makefile');
    expect(findMatchingFileId('Dockerfile', knownFileIds)).toBe('src/Dockerfile');
  });
});

// Tests for flash type differentiation
describe('ScreenFlash types', () => {
  it('read flash has type read', () => {
    const flash: ScreenFlash = { type: 'read', startTime: 1000 };
    expect(flash.type).toBe('read');
  });

  it('write flash has type write', () => {
    const flash: ScreenFlash = { type: 'write', startTime: 1000 };
    expect(flash.type).toBe('write');
  });

  it('type does not affect opacity calculation', () => {
    const readFlash: ScreenFlash = { type: 'read', startTime: 1000 };
    const writeFlash: ScreenFlash = { type: 'write', startTime: 1000 };

    expect(calculateFlashOpacity(readFlash, 1500)).toBe(calculateFlashOpacity(writeFlash, 1500));
  });
});
