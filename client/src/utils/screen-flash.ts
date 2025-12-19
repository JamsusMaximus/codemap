// Screen flash utilities - extracted for testability

export const SCREEN_GLOW_HOLD = 5000;    // 5 seconds at full glow
export const SCREEN_FADE_DURATION = 3000; // 3 second fade out after hold

export interface ScreenFlash {
  type: 'read' | 'write';
  startTime: number;
}

/**
 * Extract filename from a file path (handles both absolute and relative paths)
 */
export function extractFilename(filePath: string): string {
  return filePath.split('/').pop() || '';
}

/**
 * Find a matching file ID from a set of known file IDs by filename
 * Handles the case where activity events use absolute paths but
 * layout uses relative paths
 */
export function findMatchingFileId(
  filePath: string,
  knownFileIds: string[]
): string | undefined {
  const fileName = extractFilename(filePath);
  if (!fileName) return undefined;

  return knownFileIds.find(id =>
    id.endsWith('/' + fileName) || id === fileName
  );
}

/**
 * Calculate the opacity of a screen flash based on elapsed time
 * Returns 1 during hold period, fades to 0 during fade period, then 0
 */
export function calculateFlashOpacity(
  flash: ScreenFlash,
  currentTime: number
): number {
  const elapsed = currentTime - flash.startTime;
  const totalDuration = SCREEN_GLOW_HOLD + SCREEN_FADE_DURATION;

  if (elapsed < 0) {
    return 0; // Flash hasn't started yet
  } else if (elapsed < SCREEN_GLOW_HOLD) {
    return 1; // Full brightness during hold period
  } else if (elapsed < totalDuration) {
    // Fade out after hold
    return 1 - ((elapsed - SCREEN_GLOW_HOLD) / SCREEN_FADE_DURATION);
  } else {
    return 0; // Flash has ended
  }
}

/**
 * Check if a flash should be removed (has completed its full duration)
 */
export function isFlashExpired(
  flash: ScreenFlash,
  currentTime: number
): boolean {
  const elapsed = currentTime - flash.startTime;
  const totalDuration = SCREEN_GLOW_HOLD + SCREEN_FADE_DURATION;
  return elapsed >= totalDuration;
}
