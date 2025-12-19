import { useEffect, useRef } from 'react';
import { useFileActivity } from '../hooks/useFileActivity';
import { GraphNode, FolderScore } from '../types';
import { playReadSound, playWriteSound, playWaitingSound, initAudio } from '../sounds';

const API_URL = 'http://localhost:5174/api';

// Multi-floor layout - symmetric diamond shape
// Expands in middle, tapers at top and bottom for balanced look
// Floor widths calculated so each floor fills same total width
const FLOOR_CONFIG = [
  { rooms: 2, filesPerRoom: 8, roomWidth: 23, roomHeight: 14 },  // Ground floor - 2 big rooms (fill width)
  { rooms: 4, filesPerRoom: 2, roomWidth: 11, roomHeight: 10 },  // Floor 1 - 4 medium rooms
  { rooms: 4, filesPerRoom: 1, roomWidth: 11, roomHeight: 8 },   // Floor 2 - 4 small rooms
  { rooms: 2, filesPerRoom: 1, roomWidth: 23, roomHeight: 8 },   // Floor 3 (top) - 2 small rooms (fill width)
];
const MAX_FLOORS = FLOOR_CONFIG.length;
const FLOOR_GAP = 1;
import {
  TILE_SIZE,
  RoomLayout,
  FileLayout,
  AgentCharacter,
  ScreenFlash,
  seededRandom,
  getFloorStyle,
  drawFloor,
  drawWalls,
  drawWindows,
  drawLightFixtures,
  drawRoomLighting,
  drawDesk,
  drawLabel,
  drawRug,
  drawCableRuns,
  drawFloorVents,
  drawScatter,
  drawRoomSign,
  drawRoomThemedDecorations,
  drawOutdoor,
  drawAgentCharacter,
  drawCoffeeShop,
} from '../drawing';

export function HabboRoom() {
  // All data comes via refs - NO STATE, NO RE-RENDERS
  const {
    graphDataRef,
    recentActivityRef,
    thinkingAgentsRef,
    activityVersionRef,
    thinkingVersionRef
  } = useFileActivity();

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const agentCharactersRef = useRef<Map<string, AgentCharacter>>(new Map());
  const filePositionsRef = useRef<Map<string, { x: number; y: number }>>(new Map());
  const screenFlashesRef = useRef<Map<string, ScreenFlash>>(new Map());
  const animationRef = useRef<number>();
  const layoutInitializedRef = useRef(false);
  const agentColorCounterRef = useRef(0);
  const coffeeShopPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const layoutRef = useRef<RoomLayout | null>(null);
  const lastActivityByAgentRef = useRef<Map<string, { filePath: string; timestamp: number }>>(new Map());
  const lastProjectRootRef = useRef<string | null>(null);
  const lastNodeCountRef = useRef<number>(0);
  const lastActivityVersionRef = useRef(0);
  const lastThinkingVersionRef = useRef(0);
  const hotFoldersRef = useRef<FolderScore[]>([]);

  // Agent trails - stores recent footprint positions
  const agentTrailsRef = useRef<Array<{
    x: number; y: number; timestamp: number; colorIndex: number;
  }>>([]);
  const lastTrailPosRef = useRef<Map<string, { x: number; y: number }>>(new Map());

  // Room activity tracking for pulse effect
  const roomActivityRef = useRef<Map<string, number>>(new Map());  // roomName -> lastActivityTimestamp

  // Performance metrics tracking
  const lastFrameTimeRef = useRef<number>(0);
  const frameTimesRef = useRef<number[]>([]);
  const fpsRef = useRef<number>(0);

  // Zoom and pan state
  const zoomRef = useRef(1);
  const panRef = useRef({ x: 0, y: 0 });
  const isDraggingRef = useRef(false);
  const lastDragPosRef = useRef({ x: 0, y: 0 });
  const keysDownRef = useRef<Set<string>>(new Set());

  // Build multi-floor layout from hot folders (pyramid structure)
  const buildLayout = (nodes: GraphNode[]): RoomLayout | null => {
    const hotFolders = hotFoldersRef.current;
    if (hotFolders.length === 0 && nodes.length === 0) return null;

    const root = nodes.find(n => n.depth === -1);
    const rootName = root?.name || 'Project';

    // Calculate total rooms needed
    const totalRooms = FLOOR_CONFIG.reduce((sum, cfg) => sum + cfg.rooms, 0);
    const foldersToShow = hotFolders.length > 0
      ? hotFolders.slice(0, totalRooms)
      : nodes.filter(n => n.isFolder && n.depth === 0).slice(0, totalRooms);

    const roomChildren: RoomLayout[] = [];
    let folderIndex = 0;

    // Calculate max width (widest floor)
    const maxFloorWidth = Math.max(...FLOOR_CONFIG.map(cfg => cfg.rooms * (cfg.roomWidth + 1) - 1));

    // Calculate floor Y positions (bottom to top)
    const floorYPositions: number[] = [];
    let currentY = 1;
    for (let f = MAX_FLOORS - 1; f >= 0; f--) {
      floorYPositions[f] = currentY;
      currentY += FLOOR_CONFIG[f].roomHeight + FLOOR_GAP;
    }

    // Create rooms for each floor
    for (let floorNum = 0; floorNum < MAX_FLOORS && folderIndex < foldersToShow.length; floorNum++) {
      const config = FLOOR_CONFIG[floorNum];
      const floorWidth = config.rooms * (config.roomWidth + 1) - 1;
      const floorStartX = 1 + Math.floor((maxFloorWidth - floorWidth) / 2); // Center the floor

      for (let roomInFloor = 0; roomInFloor < config.rooms && folderIndex < foldersToShow.length; roomInFloor++) {
        const folder = foldersToShow[folderIndex];
        folderIndex++;

        const roomX = floorStartX + roomInFloor * (config.roomWidth + 1);
        const roomY = floorYPositions[floorNum];

        const folderName = 'folder' in folder
          ? (folder as FolderScore).folder.split('/').pop() || (folder as FolderScore).folder
          : (folder as GraphNode).name;
        const folderId = 'folder' in folder ? (folder as FolderScore).folder : (folder as GraphNode).id;

        const floorStyle = getFloorStyle(folderName, floorNum);
        const recentFiles = 'recentFiles' in folder ? (folder as FolderScore).recentFiles : [];
        const score = 'score' in folder ? (folder as FolderScore).score : 0;

        // Create file layouts (multiple desks per room based on config)
        const fileLayouts: FileLayout[] = [];
        const filesToShow = Math.min(config.filesPerRoom, recentFiles.length || 1);
        // Allow up to 4 columns for wider rooms (roomWidth >= 20), otherwise 2
        const maxCols = config.roomWidth >= 20 ? 4 : 2;
        const fileCols = Math.min(maxCols, filesToShow);

        for (let fileIdx = 0; fileIdx < filesToShow; fileIdx++) {
          const col = fileIdx % fileCols;
          const row = Math.floor(fileIdx / fileCols);
          const deskX = roomX + 2 + col * 5;
          const deskY = roomY + 3 + row * 4;

          const fileName = recentFiles[fileIdx] || folderName;
          const fileId = `${folderId}/${fileName}`;

          // Register position for agent movement
          filePositionsRef.current.set(fileId, {
            x: deskX * TILE_SIZE + TILE_SIZE * 1.5,
            y: deskY * TILE_SIZE + TILE_SIZE
          });

          fileLayouts.push({
            x: deskX,
            y: deskY,
            name: fileName,
            id: fileId,
            isActive: false,
            isWriting: false,
            deskStyle: Math.floor(seededRandom(deskX * 53 + deskY * 97 + fileIdx * 13) * 3),
            heatLevel: Math.min(1, score / 20)
          });
        }

        // Also register the folder itself for agent routing
        const centerDeskX = roomX + Math.floor(config.roomWidth / 2) - 2;
        const centerDeskY = roomY + Math.floor(config.roomHeight / 2);
        filePositionsRef.current.set(folderId, {
          x: centerDeskX * TILE_SIZE + TILE_SIZE * 1.5,
          y: centerDeskY * TILE_SIZE + TILE_SIZE
        });

        roomChildren.push({
          x: roomX,
          y: roomY,
          width: config.roomWidth,
          height: config.roomHeight,
          name: folderName,
          files: fileLayouts,
          children: [],
          depth: floorNum,
          floorStyle
        });
      }
    }

    // Add lobby at the bottom
    const lobbyY = currentY;
    const lobbyRoom: RoomLayout = {
      x: 1,
      y: lobbyY,
      width: maxFloorWidth,
      height: 8,
      name: 'Lobby',
      files: [],
      children: [],
      depth: 0,
      floorStyle: 'wood'
    };
    roomChildren.push(lobbyRoom);

    const totalHeight = lobbyY + 8;

    return {
      x: 1,
      y: 1,
      width: maxFloorWidth,
      height: totalHeight,
      name: rootName,
      files: [],
      children: roomChildren,
      depth: -1,
      floorStyle: 'wood'
    };
  };

  // Draw wall art/posters based on room type
  const drawWallArt = (ctx: CanvasRenderingContext2D, room: RoomLayout) => {
    const px = room.x * TILE_SIZE;
    const py = room.y * TILE_SIZE;
    const w = room.width * TILE_SIZE;
    const wallH = 16;
    const seed = room.x * 73 + room.y * 137;
    if (room.width < 8) return;
    const roomName = room.name.toLowerCase();
    let artType: 'technical' | 'colorful' | 'corporate' | 'minimal' = 'minimal';
    if (roomName.includes('server') || roomName.includes('api')) artType = 'technical';
    else if (roomName.includes('component') || roomName.includes('ui')) artType = 'colorful';
    else if (room.depth === 0) artType = 'corporate';
    const artX = px + 12 + seededRandom(seed + 50) * 20;
    const artY = py - wallH + 2;
    if (artType === 'technical') {
      ctx.fillStyle = '#404040';
      ctx.fillRect(artX - 1, artY - 1, 18, 14);
      ctx.fillStyle = '#F0F0E8';
      ctx.fillRect(artX, artY, 16, 12);
      ctx.strokeStyle = '#C0C0B8';
      ctx.lineWidth = 1;
      for (let gx = 0; gx < 16; gx += 4) {
        ctx.beginPath();
        ctx.moveTo(artX + gx, artY);
        ctx.lineTo(artX + gx, artY + 12);
        ctx.stroke();
      }
      ctx.fillStyle = '#E8A830';
      ctx.fillRect(artX, artY + 10, 16, 2);
    } else if (artType === 'colorful') {
      ctx.fillStyle = '#303030';
      ctx.fillRect(artX - 1, artY - 1, 14, 14);
      ['#E85050', '#50A8E8', '#E8C850', '#50C878'].forEach((color, i) => {
        ctx.fillStyle = color;
        ctx.fillRect(artX + (i % 2) * 6, artY + Math.floor(i / 2) * 6, 6, 6);
      });
    } else if (artType === 'corporate') {
      const clockX = px + w - 30;
      const clockY = py - wallH + 3;
      ctx.fillStyle = '#F8F8F0';
      ctx.beginPath();
      ctx.arc(clockX, clockY + 5, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#8B7355';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.strokeStyle = '#404040';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(clockX, clockY + 5);
      ctx.lineTo(clockX + 3, clockY + 3);
      ctx.moveTo(clockX, clockY + 5);
      ctx.lineTo(clockX, clockY + 2);
      ctx.stroke();
      ctx.fillStyle = '#606060';
      ctx.fillRect(artX - 1, artY - 1, 14, 12);
      ctx.fillStyle = '#4080C0';
      ctx.fillRect(artX, artY, 12, 10);
      ctx.fillStyle = '#F8F8F0';
      ctx.fillRect(artX + 3, artY + 3, 6, 4);
    }
    ctx.lineWidth = 1;
  };

  // Draw door frames where child rooms connect
  const drawDoorFrames = (ctx: CanvasRenderingContext2D, room: RoomLayout) => {
    room.children.forEach(child => {
      const gapX = child.x * TILE_SIZE + (child.width * TILE_SIZE) / 2 - 12;
      const gapY = child.y * TILE_SIZE - 4;
      ctx.fillStyle = '#D4C4A8';
      ctx.fillRect(gapX, gapY, 24, 6);
    });
  };

  // Get room furniture density based on importance
  const getRoomDensity = (room: RoomLayout): 'low' | 'medium' | 'medium-high' | 'high' => {
    const name = room.name.toLowerCase();
    if (name.includes('client') || name.includes('app')) return 'high';
    if (name.includes('component') || name.includes('ui')) return 'medium-high';
    if (name.includes('server') || name.includes('api')) return 'medium';
    if (name.includes('hook') || name.includes('util')) return 'low';
    return room.depth === 0 ? 'medium' : 'medium';
  };

  // Draw room structure (floors, walls, furniture) - NOT signs
  const drawRoomStructure = (ctx: CanvasRenderingContext2D, room: RoomLayout, now: number, frame: number) => {
    drawFloor(ctx, room);
    drawFloorVents(ctx, room);
    drawCableRuns(ctx, room);
    drawRoomLighting(ctx, room);
    drawWalls(ctx, room);
    drawWindows(ctx, room);
    drawLightFixtures(ctx, room);
    drawWallArt(ctx, room);
    drawRug(ctx, room);
    drawScatter(ctx, room, getRoomDensity(room));
    drawRoomThemedDecorations(ctx, room, frame);

    room.files.forEach(file => {
      drawDesk(ctx, file, now, frame, screenFlashesRef.current);
      drawLabel(ctx, file);
    });

    // Room activity pulse - glow effect for recently active rooms
    const lastActivity = roomActivityRef.current.get(room.name);
    if (lastActivity) {
      const timeSince = now - lastActivity;
      const pulseDuration = 3000;  // Pulse fades over 3 seconds
      if (timeSince < pulseDuration) {
        const pulseProgress = timeSince / pulseDuration;
        const pulseAlpha = (1 - pulseProgress) * 0.15;
        const pulsePhase = Math.sin(frame * 0.1) * 0.5 + 0.5;  // Oscillating pulse
        const finalAlpha = pulseAlpha * (0.7 + pulsePhase * 0.3);

        const px = room.x * TILE_SIZE;
        const py = room.y * TILE_SIZE;
        const pw = room.width * TILE_SIZE;
        const ph = room.height * TILE_SIZE;

        ctx.fillStyle = `rgba(100, 200, 255, ${finalAlpha})`;
        ctx.fillRect(px, py, pw, ph);
      }
    }

    // Recursively draw child room structures
    room.children.forEach(child => drawRoomStructure(ctx, child, now, frame));
    drawDoorFrames(ctx, room);
  };

  // Draw all room signs (separate pass so they render on top of all floors)
  const drawAllRoomSigns = (ctx: CanvasRenderingContext2D, room: RoomLayout) => {
    drawRoomSign(ctx, room);
    room.children.forEach(child => drawAllRoomSigns(ctx, child));
  };

  // Draw a complete room with all elements
  const drawRoom = (ctx: CanvasRenderingContext2D, room: RoomLayout, now: number, frame: number) => {
    // First pass: draw all room structures (floors, walls, furniture)
    drawRoomStructure(ctx, room, now, frame);
    // Second pass: draw all room signs on top
    drawAllRoomSigns(ctx, room);
  };

  // Animation loop - ALL logic runs here, no useEffects that trigger re-renders
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    // Fetch hot folders on mount
    fetch(`${API_URL}/hot-folders?limit=${FLOOR_CONFIG.reduce((sum, cfg) => sum + cfg.rooms, 0)}`)
      .then(res => res.json())
      .then((data: FolderScore[]) => {
        hotFoldersRef.current = data;
        layoutRef.current = null;  // Force layout rebuild
        layoutInitializedRef.current = false;
      })
      .catch(err => console.error('Failed to fetch hot folders:', err));

    let running = true;
    let frame = 0;

    const render = () => {
      if (!running) return;
      const now = performance.now();
      frame++;

      // Calculate FPS
      if (lastFrameTimeRef.current > 0) {
        const frameTime = now - lastFrameTimeRef.current;
        frameTimesRef.current.push(frameTime);
        // Keep last 60 frame times for averaging
        if (frameTimesRef.current.length > 60) {
          frameTimesRef.current.shift();
        }
        // Calculate average FPS every 10 frames
        if (frame % 10 === 0 && frameTimesRef.current.length > 0) {
          const avgFrameTime = frameTimesRef.current.reduce((a, b) => a + b, 0) / frameTimesRef.current.length;
          fpsRef.current = Math.round(1000 / avgFrameTime);
        }
      }
      lastFrameTimeRef.current = now;

      // Arrow key panning (smooth, runs every frame)
      const panSpeed = 8;
      const keys = keysDownRef.current;
      if (keys.has('ArrowLeft')) panRef.current.x += panSpeed;
      if (keys.has('ArrowRight')) panRef.current.x -= panSpeed;
      if (keys.has('ArrowUp')) panRef.current.y += panSpeed;
      if (keys.has('ArrowDown')) panRef.current.y -= panSpeed;

      // === SYNC AGENTS (replaces useEffect) ===
      if (thinkingVersionRef.current !== lastThinkingVersionRef.current) {
        lastThinkingVersionRef.current = thinkingVersionRef.current;
        const agents = agentCharactersRef.current;
        const thinkingAgents = thinkingAgentsRef.current;

        // CLIENT-SIDE PROTECTION: Hard limit on agents
        const MAX_CLIENT_AGENTS = 10;

        // CLIENT-SIDE PROTECTION: Validate agent ID format (must be UUID)
        const isValidAgentId = (id: string): boolean => {
          if (!id || typeof id !== 'string') return false;
          const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
          return uuidRegex.test(id);
        };

        // Filter to only valid agents
        const validAgents = thinkingAgents.filter(a => isValidAgentId(a.agentId));

        // Add new agents or update existing ones
        for (const agent of validAgents) {
          // Skip if we're at max capacity and this is a new agent
          if (agents.size >= MAX_CLIENT_AGENTS && !agents.has(agent.agentId)) {
            console.warn(`Client: Rejecting agent ${agent.agentId} - at max capacity`);
            continue;
          }

          const existing = agents.get(agent.agentId);
          if (existing) {
            existing.currentCommand = agent.currentCommand;
            existing.displayName = agent.displayName;
            existing.lastActivity = agent.lastActivity;
            existing.isThinking = agent.isThinking;
            // Play sound when agent starts waiting for input
            const newWaitingState = agent.waitingForInput ?? false;
            if (newWaitingState && !existing.waitingForInput) {
              playWaitingSound();
            }
            existing.waitingForInput = newWaitingState;
          } else {
            const index = agents.size;
            const layout = layoutRef.current;
            const colorIndex = agentColorCounterRef.current++;
            let baseX: number, baseY: number;
            let spawnedAtFile = false;

            const lastActivity = lastActivityByAgentRef.current.get(agent.agentId);
            if (lastActivity && Date.now() - lastActivity.timestamp < 5000) {
              const filePos = filePositionsRef.current.get(lastActivity.filePath);
              if (filePos) {
                const xOffset = ((colorIndex % 3) - 1) * 10;
                const yOffset = Math.floor(colorIndex / 3) * 8;
                baseX = filePos.x + xOffset;
                baseY = filePos.y - 28 + yOffset;
                spawnedAtFile = true;
              }
            }

            if (!spawnedAtFile) {
              if (layout) {
                baseX = (layout.x + layout.width / 2 - 2 + (index % 4) * 2) * TILE_SIZE;
                baseY = (layout.y + layout.height - 4 - Math.floor(index / 4) * 2) * TILE_SIZE;
              } else {
                baseX = 300 + (index % 4) * 50;
                baseY = 400 + Math.floor(index / 4) * 50;
              }
            }

            agents.set(agent.agentId, {
              agentId: agent.agentId,
              displayName: agent.displayName,
              x: baseX!,
              y: baseY!,
              targetX: baseX!,
              targetY: baseY!,
              isMoving: false,
              frame: 0,
              colorIndex,
              currentCommand: agent.currentCommand,
              waitingForInput: agent.waitingForInput ?? false,
              lastActivity: agent.lastActivity,
              isThinking: agent.isThinking,
            });
          }
        }

        // Remove agents no longer in list (use validAgents to ensure consistency)
        const activeIds = new Set(validAgents.map(a => a.agentId));
        for (const [id] of agents) {
          if (!activeIds.has(id)) {
            agents.delete(id);
          }
        }
      }

      // === HANDLE ACTIVITY (replaces useEffect) ===
      if (activityVersionRef.current !== lastActivityVersionRef.current) {
        lastActivityVersionRef.current = activityVersionRef.current;
        const recentActivity = recentActivityRef.current;

        if (recentActivity) {
          // Extract filename for matching (handles absolute vs relative paths)
          const fileName = recentActivity.filePath.split('/').pop() || '';

          // Find matching file in layout and set flash by file.id
          const matchingFileId = Array.from(filePositionsRef.current.keys())
            .find(id => id.endsWith('/' + fileName) || id === fileName);

          // Handle screen flashes for operation end events
          if (recentActivity.type === 'read-end') {
            if (matchingFileId) {
              screenFlashesRef.current.set(matchingFileId, {
                type: 'read',
                startTime: now
              });
            }
            playReadSound();
          }
          if (recentActivity.type === 'write-end') {
            if (matchingFileId) {
              screenFlashesRef.current.set(matchingFileId, {
                type: 'write',
                startTime: now
              });
            }
            playWriteSound();
          }

          // Move agents on operation start
          if (recentActivity.type.endsWith('-start')) {
            const agentId = recentActivity.agentId;
            if (agentId) {
              lastActivityByAgentRef.current.set(agentId, {
                filePath: recentActivity.filePath,
                timestamp: Date.now()
              });

              // Try file path first, then parent folders
              let filePos = filePositionsRef.current.get(recentActivity.filePath);
              if (!filePos) {
                // Extract folder path and try to find matching room
                const pathParts = recentActivity.filePath.split('/');
                pathParts.pop(); // Remove filename
                while (pathParts.length > 0 && !filePos) {
                  const folderPath = pathParts.join('/') || '.';
                  filePos = filePositionsRef.current.get(folderPath);
                  if (!filePos) pathParts.pop();
                }
                // Try root folder
                if (!filePos) filePos = filePositionsRef.current.get('.');
              }

              if (filePos) {
                const char = agentCharactersRef.current.get(agentId);
                if (char) {
                  const xOffset = ((char.colorIndex % 3) - 1) * 10;
                  const yOffset = Math.floor(char.colorIndex / 3) * 8;
                  char.targetX = filePos.x + xOffset;
                  char.targetY = filePos.y - 28 + yOffset;
                  char.isMoving = true;
                }
              }
            }
          }

          // Track room activity for pulse effect
          const filePath = recentActivity.filePath;
          const pathParts = filePath.split('/');
          // Get parent folder name (second to last part of path)
          if (pathParts.length >= 2) {
            const folderName = pathParts[pathParts.length - 2];
            roomActivityRef.current.set(folderName, now);
          }
        }
      }

      // Update all agent characters - frame and movement
      const MOVE_SPEED = 6;
      for (const [, char] of agentCharactersRef.current) {
        char.frame = frame;

        // Check if agent should go to coffee shop (inactive for 30+ seconds)
        const timeSinceActivity = Date.now() - char.lastActivity;

        const shouldGoToCoffeeShop = timeSinceActivity > 30000 && !char.isThinking && !char.waitingForInput;

        // Set target to coffee shop if inactive
        if (shouldGoToCoffeeShop && coffeeShopPosRef.current.x !== 0) {
          const coffeeOffsetX = (char.colorIndex % 3 - 1) * 20;
          const coffeeOffsetY = Math.floor(char.colorIndex / 3) * 15;
          const coffeeX = coffeeShopPosRef.current.x + coffeeOffsetX;
          const coffeeY = coffeeShopPosRef.current.y + coffeeOffsetY;

          if (Math.abs(char.targetX - coffeeX) > 5 || Math.abs(char.targetY - coffeeY) > 5) {
            char.targetX = coffeeX;
            char.targetY = coffeeY;
          }
        }

        // Grid-based movement
        const dx = char.targetX - char.x;
        const dy = char.targetY - char.y;

        if (Math.abs(dx) > MOVE_SPEED || Math.abs(dy) > MOVE_SPEED) {
          char.isMoving = true;

          // Record trail footprint every ~20 pixels of movement
          const lastPos = lastTrailPosRef.current.get(char.agentId);
          if (!lastPos || Math.abs(char.x - lastPos.x) > 20 || Math.abs(char.y - lastPos.y) > 20) {
            agentTrailsRef.current.push({
              x: char.x, y: char.y, timestamp: now, colorIndex: char.colorIndex
            });
            lastTrailPosRef.current.set(char.agentId, { x: char.x, y: char.y });
            // Keep only last 100 footprints
            if (agentTrailsRef.current.length > 100) {
              agentTrailsRef.current = agentTrailsRef.current.slice(-100);
            }
          }

          if (Math.abs(dx) > MOVE_SPEED) {
            char.x += dx > 0 ? MOVE_SPEED : -MOVE_SPEED;
          } else if (Math.abs(dy) > MOVE_SPEED) {
            char.y += dy > 0 ? MOVE_SPEED : -MOVE_SPEED;
          }
        } else if (Math.abs(dx) > 0.5 || Math.abs(dy) > 0.5) {
          char.x = char.targetX;
          char.y = char.targetY;
          char.isMoving = false;
        } else {
          char.isMoving = false;
        }

        // Only show idle/sleep animation when at coffee shop (not moving)
        char.isIdle = shouldGoToCoffeeShop && !char.isMoving;
      }

      // Only rebuild layout when nodes change
      const currentGraphData = graphDataRef.current;
      const nodeCount = currentGraphData.nodes.length;
      if (nodeCount !== lastNodeCountRef.current || !layoutRef.current) {
        lastNodeCountRef.current = nodeCount;
        layoutRef.current = buildLayout(currentGraphData.nodes);

        const projectRoot = currentGraphData.nodes.find(n => n.depth === -1)?.id || null;
        if (projectRoot !== lastProjectRootRef.current) {
          lastProjectRootRef.current = projectRoot;
          layoutInitializedRef.current = false;
        }
      }

      // Draw sky background
      ctx.fillStyle = '#C8E8F8';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const layout = layoutRef.current;
      if (layout) {
        const hotelW = layout.width * TILE_SIZE;
        const hotelH = layout.height * TILE_SIZE;

        const borderSize = 4;
        const waterWidth = 6;
        const totalSceneW = hotelW + (borderSize * 2 + waterWidth) * TILE_SIZE;
        const totalSceneH = hotelH + borderSize * 2 * TILE_SIZE;

        const baseOffsetX = (canvas.width - totalSceneW) / 2 + borderSize * TILE_SIZE;
        const baseOffsetY = (canvas.height - totalSceneH) / 2 + borderSize * TILE_SIZE;

        // Apply zoom (centered on canvas) and pan transforms
        const zoom = zoomRef.current;
        const pan = panRef.current;
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;

        ctx.save();
        // Translate to center, scale, translate back - this zooms from center
        ctx.translate(centerX, centerY);
        ctx.scale(zoom, zoom);
        ctx.translate(-centerX + pan.x, -centerY + pan.y);
        // Apply the base offset to position the hotel
        ctx.translate(baseOffsetX - layout.x * TILE_SIZE, baseOffsetY - layout.y * TILE_SIZE);

        const hotelPxX = layout.x * TILE_SIZE;
        const hotelPxY = layout.y * TILE_SIZE;

        // Update coffee shop position for idle agents (right side near the cafe table)
        coffeeShopPosRef.current = {
          x: hotelPxX + hotelW * 0.68 + 100,  // Right side, near cafe table
          y: hotelPxY + hotelH * 0.84 + 25,
        };

        // Draw outdoor environment
        drawOutdoor(ctx, hotelPxX, hotelPxY, hotelW, hotelH, frame);

        // Initialize or reposition agents
        if (agentCharactersRef.current.size > 0) {
          let index = 0;
          for (const [, char] of agentCharactersRef.current) {
            const isOutsideBounds = char.x < hotelPxX - TILE_SIZE * 2 ||
                                   char.x > hotelPxX + hotelW + TILE_SIZE * 2 ||
                                   char.y < hotelPxY - TILE_SIZE * 2 ||
                                   char.y > hotelPxY + hotelH + TILE_SIZE * 4;

            if (!layoutInitializedRef.current || isOutsideBounds) {
              char.x = (layout.x + layout.width / 2 - 2 + (index % 4) * 2) * TILE_SIZE;
              char.y = (layout.y + layout.height - 4 - Math.floor(index / 4) * 2) * TILE_SIZE;
              char.targetX = char.x;
              char.targetY = char.y;
              char.isMoving = false;
            }
            index++;
          }
          layoutInitializedRef.current = true;
        }

        // Draw hotel rooms
        drawRoom(ctx, layout, now, frame);

        // Draw coffee shop
        drawCoffeeShop(ctx, layout, hotelPxX, hotelPxY, hotelW, hotelH);

        // Draw agent trails (fading footprints)
        const trailMaxAge = 5000;  // Trails fade over 5 seconds
        const trails = agentTrailsRef.current;
        for (let i = trails.length - 1; i >= 0; i--) {
          const trail = trails[i];
          const age = now - trail.timestamp;
          if (age > trailMaxAge) {
            trails.splice(i, 1);  // Remove old trails
            continue;
          }
          const alpha = 0.3 * (1 - age / trailMaxAge);
          const palette = ['#C83030', '#3070C8', '#30A830', '#C8C8C8', '#D8A010'];
          const color = palette[trail.colorIndex % palette.length];
          ctx.fillStyle = color;
          ctx.globalAlpha = alpha;
          // Draw small footprint dots
          ctx.beginPath();
          ctx.ellipse(trail.x - 3, trail.y + 4, 3, 2, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.beginPath();
          ctx.ellipse(trail.x + 3, trail.y + 4, 3, 2, 0, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.globalAlpha = 1;

        // Draw all agent characters
        for (const [, char] of agentCharactersRef.current) {
          drawAgentCharacter(ctx, char);
        }

        ctx.restore();
      } else {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.08)';
        ctx.font = '14px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('Waiting for file activity...', canvas.width / 2 + 1, canvas.height / 2 + 1);
        ctx.fillStyle = '#6A7A8A';
        ctx.fillText('Waiting for file activity...', canvas.width / 2, canvas.height / 2);
      }

      // Draw performance metrics in top left
      const fps = fpsRef.current;
      const avgFrameTime = frameTimesRef.current.length > 0
        ? (frameTimesRef.current.reduce((a, b) => a + b, 0) / frameTimesRef.current.length).toFixed(1)
        : '0.0';
      const agentCount = agentCharactersRef.current.size;
      const roomCount = layoutRef.current?.children?.length ?? 0;

      const metricsX = 12;
      const metricsY = 58;

      // Background
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(metricsX - 6, metricsY - 12, 130, 62);

      // Text
      ctx.fillStyle = fps >= 55 ? '#4ADE80' : fps >= 30 ? '#FACC15' : '#F87171';
      ctx.font = 'bold 11px monospace';
      ctx.textAlign = 'left';
      ctx.fillText(`FPS: ${fps}`, metricsX, metricsY);

      ctx.fillStyle = '#E5E5E5';
      ctx.font = '10px monospace';
      ctx.fillText(`Frame: ${avgFrameTime}ms`, metricsX, metricsY + 14);
      ctx.fillText(`Agents: ${agentCount}`, metricsX, metricsY + 28);
      ctx.fillText(`Rooms: ${roomCount}`, metricsX, metricsY + 42);

      // Draw zoom indicator when zoomed or panned
      const zoom = zoomRef.current;
      const pan = panRef.current;
      const hasPan = Math.abs(pan.x) > 1 || Math.abs(pan.y) > 1;
      if (zoom !== 1 || hasPan) {
        const indicatorX = canvas.width - 90;
        const indicatorY = 20;

        // Background
        ctx.fillStyle = 'rgba(255, 252, 248, 0.9)';
        ctx.fillRect(indicatorX - 8, indicatorY - 4, 82, 24);
        ctx.strokeStyle = 'rgba(160, 150, 140, 0.4)';
        ctx.lineWidth = 1;
        ctx.strokeRect(indicatorX - 8, indicatorY - 4, 82, 24);

        // Zoom text
        ctx.fillStyle = '#4A5A6A';
        ctx.font = 'bold 12px sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(`🔍 ${Math.round(zoom * 100)}%`, indicatorX, indicatorY + 12);

        // Reset hint
        ctx.fillStyle = 'rgba(100, 120, 140, 0.6)';
        ctx.font = '10px sans-serif';
        ctx.fillText('⌘0 reset | drag/←→↑↓', indicatorX - 6, indicatorY + 34);
      }

      animationRef.current = requestAnimationFrame(render);
    };

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    // Zoom with mouse wheel (zooms toward mouse position)
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const zoomSpeed = 0.1;
      const delta = e.deltaY > 0 ? -zoomSpeed : zoomSpeed;
      const oldZoom = zoomRef.current;
      const newZoom = Math.max(0.5, Math.min(4, oldZoom + delta));

      if (newZoom !== oldZoom) {
        const rect = canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        // Convert mouse position to be relative to canvas center
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const mouseFromCenterX = mouseX - centerX;
        const mouseFromCenterY = mouseY - centerY;

        // Adjust pan to keep point under mouse stationary
        const zoomRatio = newZoom / oldZoom;
        panRef.current.x -= mouseFromCenterX * (zoomRatio - 1) / newZoom;
        panRef.current.y -= mouseFromCenterY * (zoomRatio - 1) / newZoom;

        zoomRef.current = newZoom;
      }
    };
    canvas.addEventListener('wheel', handleWheel, { passive: false });

    // Keyboard controls
    const handleKeyDown = (e: KeyboardEvent) => {
      // Zoom with Cmd/Ctrl + / -
      if ((e.metaKey || e.ctrlKey) && (e.key === '=' || e.key === '+')) {
        e.preventDefault();
        zoomRef.current = Math.min(4, zoomRef.current + 0.25);
      } else if ((e.metaKey || e.ctrlKey) && e.key === '-') {
        e.preventDefault();
        zoomRef.current = Math.max(0.5, zoomRef.current - 0.25);
      } else if ((e.metaKey || e.ctrlKey) && e.key === '0') {
        e.preventDefault();
        zoomRef.current = 1;
        panRef.current = { x: 0, y: 0 };
      }
      // Track arrow keys for smooth panning
      if (e.key.startsWith('Arrow')) {
        e.preventDefault();
        keysDownRef.current.add(e.key);
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      keysDownRef.current.delete(e.key);
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    // Drag to pan
    const handleMouseDown = (e: MouseEvent) => {
      initAudio(); // Initialize audio on first user interaction
      isDraggingRef.current = true;
      lastDragPosRef.current = { x: e.clientX, y: e.clientY };
      canvas.style.cursor = 'grabbing';
    };
    const handleMouseMove = (e: MouseEvent) => {
      if (isDraggingRef.current) {
        const dx = e.clientX - lastDragPosRef.current.x;
        const dy = e.clientY - lastDragPosRef.current.y;
        panRef.current.x += dx / zoomRef.current;
        panRef.current.y += dy / zoomRef.current;
        lastDragPosRef.current = { x: e.clientX, y: e.clientY };
      }
    };
    const handleMouseUp = () => {
      isDraggingRef.current = false;
      canvas.style.cursor = 'grab';
    };
    canvas.style.cursor = 'grab';
    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseup', handleMouseUp);
    canvas.addEventListener('mouseleave', handleMouseUp);

    render();

    return () => {
      running = false;
      window.removeEventListener('resize', resize);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      canvas.removeEventListener('wheel', handleWheel);
      canvas.removeEventListener('mousedown', handleMouseDown);
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mouseup', handleMouseUp);
      canvas.removeEventListener('mouseleave', handleMouseUp);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div style={{ width: '100vw', height: '100vh', overflow: 'hidden', backgroundColor: '#C8E8F8' }}>
      <div style={{
        position: 'absolute', top: 16, left: 16, zIndex: 10,
        color: '#4A5A6A', fontSize: '16px', fontWeight: 'bold',
        textShadow: '1px 1px 2px rgba(255,255,255,0.6)',
        backgroundColor: 'rgba(255, 252, 248, 0.85)',
        padding: '6px 12px',
        borderRadius: '6px',
        border: '1px solid rgba(160, 150, 140, 0.3)'
      }}>
        CodeMap
      </div>
      <canvas
        ref={canvasRef}
        style={{
          display: 'block',
          imageRendering: 'pixelated'
        }}
      />
    </div>
  );
}
