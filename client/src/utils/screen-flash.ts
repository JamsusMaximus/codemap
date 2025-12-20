// Screen flash utilities - extracted for testability

export const SCREEN_GLOW_HOLD = 5000;    // 5 seconds at full glow
export const SCREEN_FADE_DURATION = 3000; // 3 second fade out after hold

export interface ScreenFlash {
  type: 'read' | 'write' | 'search' | 'bash';
  startTime: number;
}

/**
 * Extract filename from a file path (handles both absolute and relative paths)
 */
export function extractFilename(filePath: string): string {
  return filePath.split('/').pop() || '';
}

/**
 * Find a matching file ID from a set of known file IDs
 * Uses a priority-based matching strategy:
 * 1. Exact path match (best)
 * 2. Path suffix match (e.g., "src/index.ts" matches "client/src/index.ts")
 * 3. Filename-only match (fallback for ambiguous cases)
 */
export function findMatchingFileId(
  filePath: string,
  knownFileIds: string[]
): string | undefined {
  if (!filePath) return undefined;

  // Priority 1: Exact match
  if (knownFileIds.includes(filePath)) {
    return filePath;
  }

  // Priority 2: Path suffix match (handles partial paths)
  // e.g., "server/src/index.ts" should match if filePath is "server/src/index.ts"
  const suffixMatch = knownFileIds.find(id =>
    id.endsWith('/' + filePath) || id === filePath
  );
  if (suffixMatch) {
    return suffixMatch;
  }

  // Priority 3: Filename-only match (last resort)
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
