/**
 * Agent Movement Utilities
 *
 * Core algorithms for agent positioning and movement in the visualization.
 * These functions are pure and extracted for testability.
 *
 * Key concepts:
 * - Agents have a current position (x, y) and a target position (targetX, targetY)
 * - Movement is grid-based, prioritizing the larger axis
 * - Agents go to "coffee shop" when idle for 30+ seconds
 * - Multiple agents at same location are offset by colorIndex
 */

/** 2D position in pixel coordinates */
export interface Position {
  x: number;
  y: number;
}

/** Result of a movement step, includes new position and movement state */
export interface MovementResult {
  x: number;
  y: number;
  isMoving: boolean;
}

/**
 * Calculate color-based offset for multiple agents at same location
 * Creates a 3-column grid pattern
 */
export function getAgentColorOffset(colorIndex: number): Position {
  const xOffset = ((colorIndex % 3) - 1) * 10;  // -10, 0, or 10
  const yOffset = Math.floor(colorIndex / 3) * 8;
  return { x: xOffset, y: yOffset };
}

/**
 * Calculate spawn position for an agent in the lobby area
 */
export function getSpawnPositionInLobby(
  layoutX: number,
  layoutY: number,
  layoutWidth: number,
  layoutHeight: number,
  agentIndex: number,
  tileSize: number
): Position {
  const baseX = (layoutX + layoutWidth / 2 - 2 + (agentIndex % 4) * 2) * tileSize;
  const baseY = (layoutY + layoutHeight - 4 - Math.floor(agentIndex / 4) * 2) * tileSize;
  return { x: baseX, y: baseY };
}

/**
 * Calculate spawn position near a file's desk
 */
export function getSpawnPositionAtFile(
  filePos: Position,
  colorIndex: number
): Position {
  const offset = getAgentColorOffset(colorIndex);
  return {
    x: filePos.x + offset.x,
    y: filePos.y - 28 + offset.y
  };
}

/**
 * Move one step towards a target position
 * Returns new position and whether still moving
 */
export function moveTowardsTarget(
  currentX: number,
  currentY: number,
  targetX: number,
  targetY: number,
  speed: number,
  arrivalThreshold: number = 0.5
): MovementResult {
  const dx = targetX - currentX;
  const dy = targetY - currentY;
  const distance = Math.sqrt(dx * dx + dy * dy);

  if (distance < arrivalThreshold) {
    return {
      x: targetX,
      y: targetY,
      isMoving: false
    };
  }

  // Move in grid-like fashion (prioritize larger axis)
  let newX = currentX;
  let newY = currentY;

  if (Math.abs(dx) > Math.abs(dy)) {
    newX += Math.sign(dx) * Math.min(speed, Math.abs(dx));
  } else {
    newY += Math.sign(dy) * Math.min(speed, Math.abs(dy));
  }

  return {
    x: newX,
    y: newY,
    isMoving: true
  };
}

/**
 * Check if agent has reached target
 */
export function hasReachedTarget(
  currentX: number,
  currentY: number,
  targetX: number,
  targetY: number,
  threshold: number = 0.5
): boolean {
  const dx = targetX - currentX;
  const dy = targetY - currentY;
  const distance = Math.sqrt(dx * dx + dy * dy);
  return distance < threshold;
}

/**
 * Determine if agent should go idle (move to coffee shop)
 */
export function shouldAgentGoIdle(
  timeSinceActivityMs: number,
  isThinking: boolean,
  waitingForInput: boolean,
  idleThresholdMs: number = 30000
): boolean {
  if (isThinking || waitingForInput) {
    return false;
  }
  return timeSinceActivityMs > idleThresholdMs;
}

/**
 * Calculate coffee shop position offset for idle agents
 */
export function getCoffeeShopOffset(colorIndex: number): Position {
  return {
    x: (colorIndex % 3) * 15,
    y: Math.floor(colorIndex / 3) * 12
  };
}

/**
 * Check if an agent should be removed based on grace period
 */
export function shouldRemoveAgent(
  lastSeenMs: number,
  currentTimeMs: number,
  gracePeriodMs: number = 30000
): boolean {
  return currentTimeMs - lastSeenMs > gracePeriodMs;
}

/**
 * Validate agent ID format (UUID-like)
 */
export function isValidAgentId(agentId: string): boolean {
  if (!agentId || typeof agentId !== 'string') return false;
  // Must be at least 8 chars (short UUID prefix)
  if (agentId.length < 8) return false;
  // Must contain only valid hex chars and dashes
  if (!/^[a-f0-9-]+$/i.test(agentId)) return false;
  // Reject obvious garbage
  if (agentId === '00000000' || agentId === 'undefined' || agentId === 'null') return false;
  return true;
}

/**
 * Find file position with fallback to parent folders
 */
export function findFilePositionWithFallback(
  filePath: string,
  filePositions: Map<string, Position>
): Position | undefined {
  // Try exact path first
  let pos = filePositions.get(filePath);
  if (pos) return pos;

  // Try parent folders
  const pathParts = filePath.split('/');
  pathParts.pop(); // Remove filename

  while (pathParts.length > 0) {
    const folderPath = pathParts.join('/') || '.';
    pos = filePositions.get(folderPath);
    if (pos) return pos;
    pathParts.pop();
  }

  // Try root folder
  return filePositions.get('.');
}
