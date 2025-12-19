// Multi-floor layout engine
// Arranges rooms in a vertical hotel layout based on activity scores

import { FloorStyle } from '../drawing/types';

export interface FolderScore {
  folder: string;
  score: number;
  recentFiles: string[];
}

export interface HotelRoom {
  id: string;              // folder path
  name: string;            // folder name (display)
  floor: number;           // 0 = ground, higher = up
  gridX: number;           // position within floor (0-based)
  score: number;           // activity score
  recentFiles: string[];   // recently edited files
  floorStyle: FloorStyle;  // visual style

  // Pixel positions (calculated once)
  pixelX: number;
  pixelY: number;
}

export interface HotelFloor {
  floor: number;
  rooms: HotelRoom[];
  pixelY: number;          // top of this floor in pixels
}

export interface HotelLayout {
  floors: HotelFloor[];
  totalWidth: number;      // pixels
  totalHeight: number;     // pixels
  roomWidth: number;       // tiles
  roomHeight: number;      // tiles
}

// Layout constants
export const LAYOUT_CONFIG = {
  TILE_SIZE: 16,
  ROOM_WIDTH: 10,          // tiles per room (width)
  ROOM_HEIGHT: 8,          // tiles per room (height)
  ROOM_GAP: 1,             // tiles between rooms
  FLOOR_GAP: 2,            // tiles between floors (for ceiling/floor)
  ROOMS_PER_FLOOR: 5,      // max rooms per floor
  MAX_FLOORS: 5,
  WALL_HEIGHT: 2,          // tiles for wall above room
};

// Get floor style based on folder name
function getFloorStyleForFolder(name: string): FloorStyle {
  const lower = name.toLowerCase();
  if (lower.includes('component') || lower.includes('ui') || lower.includes('view')) return 'blue';
  if (lower.includes('server') || lower.includes('api') || lower.includes('route')) return 'green';
  if (lower.includes('hook') || lower.includes('util') || lower.includes('lib')) return 'lavender';
  if (lower.includes('test') || lower.includes('spec')) return 'peach';
  if (lower.includes('style') || lower.includes('css') || lower.includes('theme')) return 'cream';
  return 'wood';
}

// Build hotel layout from hot folders
export function buildHotelLayout(hotFolders: FolderScore[]): HotelLayout {
  const { TILE_SIZE, ROOM_WIDTH, ROOM_HEIGHT, ROOM_GAP, FLOOR_GAP, ROOMS_PER_FLOOR, MAX_FLOORS, WALL_HEIGHT } = LAYOUT_CONFIG;

  const floors: HotelFloor[] = [];
  const roomWidthPx = ROOM_WIDTH * TILE_SIZE;
  const floorHeightPx = (ROOM_HEIGHT + WALL_HEIGHT + FLOOR_GAP) * TILE_SIZE;

  // Calculate how many rooms we can fit
  const maxRooms = MAX_FLOORS * ROOMS_PER_FLOOR;
  const foldersToShow = hotFolders.slice(0, maxRooms);

  // Distribute rooms across floors
  // Floor 0 (ground) gets the hottest folders
  for (let floorNum = 0; floorNum < MAX_FLOORS && foldersToShow.length > 0; floorNum++) {
    const startIdx = floorNum * ROOMS_PER_FLOOR;
    const floorFolders = foldersToShow.slice(startIdx, startIdx + ROOMS_PER_FLOOR);

    if (floorFolders.length === 0) break;

    // Position: floor 0 at bottom, higher floors go up (negative Y)
    const floorPixelY = -floorNum * floorHeightPx;

    const rooms: HotelRoom[] = floorFolders.map((folder, idx) => {
      const name = folder.folder === '.' ? 'root' : folder.folder.split('/').pop() || folder.folder;
      const pixelX = idx * (roomWidthPx + ROOM_GAP * TILE_SIZE);

      return {
        id: folder.folder,
        name,
        floor: floorNum,
        gridX: idx,
        score: folder.score,
        recentFiles: folder.recentFiles,
        floorStyle: getFloorStyleForFolder(name),
        pixelX,
        pixelY: floorPixelY,
      };
    });

    floors.push({
      floor: floorNum,
      rooms,
      pixelY: floorPixelY,
    });
  }

  // Calculate total dimensions
  const maxRoomsOnAnyFloor = Math.max(...floors.map(f => f.rooms.length), 1);
  const totalWidth = maxRoomsOnAnyFloor * (roomWidthPx + ROOM_GAP * TILE_SIZE);
  const totalHeight = floors.length * floorHeightPx;

  return {
    floors,
    totalWidth,
    totalHeight,
    roomWidth: ROOM_WIDTH,
    roomHeight: ROOM_HEIGHT,
  };
}

// Find which room contains a given file path
export function findRoomForFile(layout: HotelLayout, filePath: string): HotelRoom | null {
  // Extract relative folder path from file path
  const parts = filePath.split('/');
  parts.pop(); // Remove filename
  const folderPath = parts.join('/') || '.';

  // Find exact match first
  for (const floor of layout.floors) {
    for (const room of floor.rooms) {
      if (room.id === folderPath) {
        return room;
      }
    }
  }

  // If no exact match, find closest parent folder
  let searchPath = folderPath;
  while (searchPath.includes('/')) {
    searchPath = searchPath.substring(0, searchPath.lastIndexOf('/'));
    for (const floor of layout.floors) {
      for (const room of floor.rooms) {
        if (room.id === searchPath) {
          return room;
        }
      }
    }
  }

  // Check root folder
  for (const floor of layout.floors) {
    for (const room of floor.rooms) {
      if (room.id === '.') {
        return room;
      }
    }
  }

  return null;
}

// Get all rooms as flat array (useful for rendering)
export function getAllRooms(layout: HotelLayout): HotelRoom[] {
  return layout.floors.flatMap(f => f.rooms);
}

// Get room at a specific floor and position
export function getRoomAt(layout: HotelLayout, floor: number, gridX: number): HotelRoom | null {
  const floorData = layout.floors.find(f => f.floor === floor);
  if (!floorData) return null;
  return floorData.rooms.find(r => r.gridX === gridX) || null;
}
