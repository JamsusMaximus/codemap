// Drawing types for CodeMap Hotel visualization

export const TILE_SIZE = 16;

export interface Character {
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  isMoving: boolean;
  frame: number;
}

export interface AgentCharacter extends Character {
  agentId: string;
  displayName: string;
  colorIndex: number;
  currentCommand?: string;
  waitingForInput?: boolean;
  isIdle?: boolean;
  lastActivity: number;
  lastSeen: number;  // When agent was last seen in server's list (for grace period removal)
  isThinking?: boolean;
}

export interface RoomLayout {
  x: number;
  y: number;
  width: number;
  height: number;
  name: string;
  files: FileLayout[];
  children: RoomLayout[];
  depth: number;
  floorStyle: FloorStyle;
}

export interface FileLayout {
  x: number;
  y: number;
  name: string;
  id: string;
  isActive: boolean;
  isWriting: boolean;
  deskStyle: number;
  heatLevel: number;  // 0-1 based on activity count (reads + writes)
}

export interface ScreenFlash {
  type: 'read' | 'write' | 'search';
  startTime: number;
}

export type FloorStyle = 'wood' | 'green' | 'blue' | 'cream' | 'lavender' | 'peach';

export interface TileColors {
  base: string;
  highlight: string;
  shadowLight: string;
  shadowDark: string;
  grout: string;
}

export interface CharacterPalette {
  hair: { dark: string; mid: string; light: string };
  shirt: { dark: string; mid: string; light: string };
  pants: { base: string; shadow: string };
}
