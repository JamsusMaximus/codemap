// Multi-floor hotel visualization
// Renders a vertical hotel with rooms based on git activity

import { useEffect, useRef, useCallback } from 'react';
import { useFileActivity } from '../hooks/useFileActivity';
import { FolderScore } from '../types';
import {
  buildHotelLayout,
  findRoomForFile,
  HotelLayout,
  HotelRoom,
  LAYOUT_CONFIG,
} from '../layout/multi-floor';
import { PALETTE, CHARACTER_PALETTES, SKIN } from '../drawing/palette';
import { FloorStyle, TileColors } from '../drawing/types';

// Get floor tile colors based on style
const getFloorColors = (style: FloorStyle): TileColors => {
  switch (style) {
    case 'green': return PALETTE.greenTile;
    case 'blue': return PALETTE.blueTile;
    case 'cream': return PALETTE.creamTile;
    case 'lavender': return PALETTE.lavenderTile;
    case 'peach': return PALETTE.peachTile;
    default: return {
      base: PALETTE.woodFloor.base,
      highlight: PALETTE.woodFloor.highlight,
      shadowLight: PALETTE.woodFloor.shadowLight,
      shadowDark: PALETTE.woodFloor.shadowDark,
      grout: PALETTE.woodFloor.gap,
    };
  }
};

const API_URL = 'http://localhost:5174/api';

// Adaptive framerate
const ACTIVE_FPS = 30;
const IDLE_FPS = 10;
const IDLE_TIMEOUT = 2000; // ms before switching to idle fps

interface AgentCharacter {
  agentId: string;
  displayName: string;
  colorIndex: number;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  targetRoom: HotelRoom | null;
  isMoving: boolean;
  frame: number;
  lastActivity: number;
  isThinking: boolean;
  currentFile?: string;
  currentOperation?: 'read' | 'write';
}

interface RoomActivity {
  file: string;
  operation: 'read' | 'write';
  timestamp: number;
}

export function MultiFloorHotel() {
  const {
    recentActivityRef,
    thinkingAgentsRef,
    activityVersionRef,
    thinkingVersionRef,
  } = useFileActivity();

  // Canvas refs - layered rendering
  const containerRef = useRef<HTMLDivElement>(null);
  const staticCanvasRef = useRef<HTMLCanvasElement>(null);
  const dynamicCanvasRef = useRef<HTMLCanvasElement>(null);

  // State refs (no re-renders)
  const layoutRef = useRef<HotelLayout | null>(null);
  const agentsRef = useRef<Map<string, AgentCharacter>>(new Map());
  const roomActivityRef = useRef<Map<string, RoomActivity>>(new Map());
  const agentColorCounterRef = useRef(0);

  // Animation state
  const animationRef = useRef<number>();
  const lastFrameTimeRef = useRef(0);
  const lastActivityTimeRef = useRef(Date.now());
  const frameCountRef = useRef(0);
  const staticDirtyRef = useRef(true);

  // Viewport state
  const zoomRef = useRef(2); // Start at 2x zoom for pixel art
  const panRef = useRef({ x: 0, y: 0 });
  const isDraggingRef = useRef(false);
  const lastDragPosRef = useRef({ x: 0, y: 0 });

  // Version tracking
  const lastActivityVersionRef = useRef(0);
  const lastThinkingVersionRef = useRef(0);

  // Fetch hot folders and build layout
  const fetchAndBuildLayout = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/hot-folders?limit=25`);
      const hotFolders: FolderScore[] = await response.json();

      if (hotFolders.length === 0) {
        // No git history - show a default room
        hotFolders.push({ folder: '.', score: 1, recentFiles: [] });
      }

      const layout = buildHotelLayout(hotFolders);
      layoutRef.current = layout;
      staticDirtyRef.current = true;

      // Center viewport on the hotel
      if (containerRef.current) {
        const containerWidth = containerRef.current.clientWidth;
        const containerHeight = containerRef.current.clientHeight;
        panRef.current = {
          x: containerWidth / 2 - (layout.totalWidth * zoomRef.current) / 2,
          y: containerHeight - 100, // Ground floor near bottom
        };
      }
    } catch (error) {
      console.error('Failed to fetch hot folders:', error);
    }
  }, []);

  // Draw static layer (floors, walls, furniture)
  const drawStaticLayer = useCallback((ctx: CanvasRenderingContext2D, layout: HotelLayout) => {
    ctx.imageSmoothingEnabled = false;

    // Clear
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    // Draw each floor from bottom to top
    for (const floor of layout.floors) {
      for (const room of floor.rooms) {
        drawRoom(ctx, room);
      }
    }
  }, []);

  // Draw a single room
  const drawRoom = (ctx: CanvasRenderingContext2D, room: HotelRoom) => {
    const { TILE_SIZE, ROOM_WIDTH, ROOM_HEIGHT, WALL_HEIGHT } = LAYOUT_CONFIG;
    const px = room.pixelX;
    const py = room.pixelY;
    const w = ROOM_WIDTH * TILE_SIZE;
    const h = ROOM_HEIGHT * TILE_SIZE;
    const wallH = WALL_HEIGHT * TILE_SIZE;

    // Get floor colors
    const colors = getFloorColors(room.floorStyle);

    // Draw floor
    ctx.fillStyle = colors.base;
    ctx.fillRect(px, py, w, h);

    // Checkered pattern
    for (let tx = 0; tx < ROOM_WIDTH; tx++) {
      for (let ty = 0; ty < ROOM_HEIGHT; ty++) {
        if ((tx + ty) % 2 === 0) {
          ctx.fillStyle = colors.highlight;
          ctx.fillRect(px + tx * TILE_SIZE, py + ty * TILE_SIZE, TILE_SIZE, TILE_SIZE);
        }
      }
    }

    // Draw back wall
    ctx.fillStyle = PALETTE.wall.light;
    ctx.fillRect(px, py - wallH, w, wallH);

    // Wall shadow line
    ctx.fillStyle = PALETTE.wall.dark;
    ctx.fillRect(px, py - 2, w, 2);

    // Draw side wall (left)
    ctx.fillStyle = PALETTE.wall.mid;
    ctx.fillRect(px - TILE_SIZE, py - wallH, TILE_SIZE, h + wallH);

    // Room label on wall
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 10px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(room.name, px + w / 2, py - wallH + 14);

    // Draw desk with computer (centered in room)
    const deskX = px + w / 2 - TILE_SIZE * 1.5;
    const deskY = py + h / 2 - TILE_SIZE;
    drawDesk(ctx, deskX, deskY, room);

    // Draw floor number indicator
    if (room.gridX === 0) {
      ctx.fillStyle = '#666';
      ctx.font = 'bold 12px monospace';
      ctx.textAlign = 'right';
      ctx.fillText(`F${room.floor}`, px - TILE_SIZE - 4, py + h / 2);
    }
  };

  // Draw desk with computer
  const drawDesk = (ctx: CanvasRenderingContext2D, x: number, y: number, _room: HotelRoom) => {
    const TILE_SIZE = LAYOUT_CONFIG.TILE_SIZE;

    // Desk surface
    ctx.fillStyle = '#8B5A2B';
    ctx.fillRect(x, y + TILE_SIZE, TILE_SIZE * 3, TILE_SIZE);

    // Desk legs
    ctx.fillStyle = '#654321';
    ctx.fillRect(x + 2, y + TILE_SIZE * 2, 4, TILE_SIZE / 2);
    ctx.fillRect(x + TILE_SIZE * 3 - 6, y + TILE_SIZE * 2, 4, TILE_SIZE / 2);

    // Monitor base
    ctx.fillStyle = '#333';
    ctx.fillRect(x + TILE_SIZE * 1.25, y + TILE_SIZE - 2, TILE_SIZE * 0.5, 4);

    // Monitor stand
    ctx.fillRect(x + TILE_SIZE * 1.4, y + TILE_SIZE - 6, TILE_SIZE * 0.2, 6);

    // Monitor frame
    ctx.fillStyle = '#222';
    ctx.fillRect(x + TILE_SIZE * 0.5, y - TILE_SIZE * 0.5, TILE_SIZE * 2, TILE_SIZE * 1.5);

    // Screen (will be drawn in dynamic layer for activity)
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(x + TILE_SIZE * 0.6, y - TILE_SIZE * 0.4, TILE_SIZE * 1.8, TILE_SIZE * 1.3);

    // Chair
    const chairX = x + TILE_SIZE * 0.5;
    const chairY = y + TILE_SIZE * 1.5;
    ctx.fillStyle = '#4a4a4a';
    ctx.fillRect(chairX, chairY, TILE_SIZE, TILE_SIZE * 0.8);
    ctx.fillStyle = '#3a3a3a';
    ctx.fillRect(chairX, chairY - TILE_SIZE * 0.5, TILE_SIZE, TILE_SIZE * 0.6);
  };

  // Draw dynamic layer (agents, screen content, activity glows)
  const drawDynamicLayer = useCallback((ctx: CanvasRenderingContext2D, layout: HotelLayout, frame: number) => {
    const { TILE_SIZE, ROOM_WIDTH, ROOM_HEIGHT } = LAYOUT_CONFIG;

    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    const now = Date.now();

    // Draw screen content for each room
    for (const floor of layout.floors) {
      for (const room of floor.rooms) {
        const activity = roomActivityRef.current.get(room.id);
        drawScreenContent(ctx, room, activity, frame);

        // Activity glow
        if (activity && now - activity.timestamp < 2000) {
          const alpha = Math.max(0, 1 - (now - activity.timestamp) / 2000);
          const glowColor = activity.operation === 'write' ? '76, 175, 80' : '33, 150, 243';
          ctx.fillStyle = `rgba(${glowColor}, ${alpha * 0.3})`;
          const px = room.pixelX;
          const py = room.pixelY;
          ctx.fillRect(px, py, ROOM_WIDTH * TILE_SIZE, ROOM_HEIGHT * TILE_SIZE);
        }
      }
    }

    // Draw agents
    for (const agent of agentsRef.current.values()) {
      drawAgent(ctx, agent, frame);
    }
  }, []);

  // Draw screen content
  const drawScreenContent = (
    ctx: CanvasRenderingContext2D,
    room: HotelRoom,
    activity: RoomActivity | undefined,
    frame: number
  ) => {
    const { TILE_SIZE, ROOM_WIDTH, ROOM_HEIGHT } = LAYOUT_CONFIG;
    const px = room.pixelX;
    const py = room.pixelY;
    const w = ROOM_WIDTH * TILE_SIZE;
    const h = ROOM_HEIGHT * TILE_SIZE;

    // Screen position (same as in drawDesk)
    const deskX = px + w / 2 - TILE_SIZE * 1.5;
    const deskY = py + h / 2 - TILE_SIZE;
    const screenX = deskX + TILE_SIZE * 0.6;
    const screenY = deskY - TILE_SIZE * 0.4;
    const screenW = TILE_SIZE * 1.8;
    const screenH = TILE_SIZE * 1.3;

    // Screen background color based on activity
    if (activity && Date.now() - activity.timestamp < 3000) {
      const isWrite = activity.operation === 'write';
      ctx.fillStyle = isWrite ? '#0d2818' : '#0d1b2a';
      ctx.fillRect(screenX, screenY, screenW, screenH);

      // Activity indicator
      ctx.fillStyle = isWrite ? '#4CAF50' : '#2196F3';
      ctx.font = '6px monospace';
      ctx.textAlign = 'left';
      ctx.fillText(isWrite ? 'WRITE' : 'READ', screenX + 2, screenY + 7);

      // Filename
      ctx.fillStyle = '#CCC';
      const filename = activity.file.split('/').pop() || activity.file;
      const truncated = filename.length > 12 ? filename.slice(0, 10) + '..' : filename;
      ctx.fillText(truncated, screenX + 2, screenY + 15);

      // Blinking cursor
      if (frame % 30 < 15) {
        ctx.fillStyle = isWrite ? '#4CAF50' : '#2196F3';
        ctx.fillRect(screenX + 2, screenY + 18, 4, 2);
      }
    } else {
      // Idle screen - show folder name
      ctx.fillStyle = '#1a1a2e';
      ctx.fillRect(screenX, screenY, screenW, screenH);

      ctx.fillStyle = '#666';
      ctx.font = '5px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(room.name, screenX + screenW / 2, screenY + screenH / 2 + 2);

      // Subtle scanlines
      ctx.fillStyle = 'rgba(0,0,0,0.1)';
      for (let i = 0; i < screenH; i += 2) {
        ctx.fillRect(screenX, screenY + i, screenW, 1);
      }
    }
  };

  // Draw agent character
  const drawAgent = (ctx: CanvasRenderingContext2D, agent: AgentCharacter, frame: number) => {
    const palette = CHARACTER_PALETTES[agent.colorIndex % CHARACTER_PALETTES.length];
    const x = Math.round(agent.x);
    const y = Math.round(agent.y);

    // Walking animation
    const walkFrame = agent.isMoving ? Math.floor(frame / 4) % 4 : 0;
    const bobY = agent.isMoving ? Math.sin(frame * 0.3) * 2 : 0;

    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    ctx.beginPath();
    ctx.ellipse(x + 8, y + 24, 6, 3, 0, 0, Math.PI * 2);
    ctx.fill();

    // Body
    ctx.fillStyle = palette.shirt.mid;
    ctx.fillRect(x + 4, y + 10 + bobY, 8, 10);

    // Head
    ctx.fillStyle = SKIN.base;
    ctx.fillRect(x + 4, y + 2 + bobY, 8, 8);

    // Hair
    ctx.fillStyle = palette.hair.mid;
    ctx.fillRect(x + 3, y + bobY, 10, 4);

    // Legs (animated)
    ctx.fillStyle = palette.pants.base;
    const legOffset = walkFrame === 1 || walkFrame === 3 ? 2 : 0;
    ctx.fillRect(x + 4, y + 20 + bobY, 3, 4 + (walkFrame === 1 ? -legOffset : legOffset));
    ctx.fillRect(x + 9, y + 20 + bobY, 3, 4 + (walkFrame === 3 ? -legOffset : legOffset));

    // Thinking indicator
    if (agent.isThinking) {
      const dotY = y - 4 + Math.sin(frame * 0.15) * 2;
      ctx.fillStyle = '#FFD700';
      ctx.beginPath();
      ctx.arc(x + 8, dotY, 3, 0, Math.PI * 2);
      ctx.fill();
    }

    // Name tag
    ctx.fillStyle = '#FFF';
    ctx.font = '7px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(agent.displayName, x + 8, y - 6);
  };

  // Update agent positions
  const updateAgents = useCallback(() => {
    const now = Date.now();

    for (const agent of agentsRef.current.values()) {
      if (agent.isMoving) {
        // Move towards target
        const dx = agent.targetX - agent.x;
        const dy = agent.targetY - agent.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 2) {
          agent.x = agent.targetX;
          agent.y = agent.targetY;
          agent.isMoving = false;
        } else {
          const speed = 3;
          agent.x += (dx / dist) * speed;
          agent.y += (dy / dist) * speed;
        }

        lastActivityTimeRef.current = now;
      }

      agent.frame++;
    }
  }, []);

  // Process activity events
  const processEvents = useCallback(() => {
    if (!layoutRef.current) return;

    const layout = layoutRef.current;
    const now = Date.now();
    let hasChanges = false;

    // Check for new activity
    if (activityVersionRef.current !== lastActivityVersionRef.current) {
      lastActivityVersionRef.current = activityVersionRef.current;

      const activity = recentActivityRef.current;
      if (activity && activity.agentId) {
        // Find or create agent
        let agent = agentsRef.current.get(activity.agentId);
        if (!agent) {
          agentColorCounterRef.current++;
          agent = {
            agentId: activity.agentId,
            displayName: `Agent ${agentsRef.current.size + 1}`,
            colorIndex: agentColorCounterRef.current,
            x: layout.floors[0]?.rooms[0]?.pixelX ?? 0 + 50,
            y: layout.floors[0]?.rooms[0]?.pixelY ?? 0 + 50,
            targetX: 0,
            targetY: 0,
            targetRoom: null,
            isMoving: false,
            frame: 0,
            lastActivity: now,
            isThinking: false,
          };
          agentsRef.current.set(activity.agentId, agent);
        }

        // Find room for this file
        const room = findRoomForFile(layout, activity.filePath);
        if (room) {
          // Update room activity
          const operation = activity.type.startsWith('write') ? 'write' : 'read';
          if (activity.type.endsWith('-start')) {
            roomActivityRef.current.set(room.id, {
              file: activity.filePath,
              operation,
              timestamp: now,
            });
            agent.currentFile = activity.filePath;
            agent.currentOperation = operation;
          }

          // Move agent to room
          const { TILE_SIZE, ROOM_WIDTH, ROOM_HEIGHT } = LAYOUT_CONFIG;
          const targetX = room.pixelX + (ROOM_WIDTH * TILE_SIZE) / 2 - 8;
          const targetY = room.pixelY + (ROOM_HEIGHT * TILE_SIZE) / 2 + TILE_SIZE;

          if (agent.targetX !== targetX || agent.targetY !== targetY) {
            agent.targetX = targetX;
            agent.targetY = targetY;
            agent.targetRoom = room;
            agent.isMoving = true;
          }
        }

        agent.lastActivity = now;
        hasChanges = true;
        lastActivityTimeRef.current = now;
      }
    }

    // Check for thinking state changes
    if (thinkingVersionRef.current !== lastThinkingVersionRef.current) {
      lastThinkingVersionRef.current = thinkingVersionRef.current;

      const agents = thinkingAgentsRef.current;
      for (const state of agents) {
        let agent = agentsRef.current.get(state.agentId);
        if (!agent) {
          agentColorCounterRef.current++;
          agent = {
            agentId: state.agentId,
            displayName: state.displayName,
            colorIndex: agentColorCounterRef.current,
            x: layout.floors[0]?.rooms[0]?.pixelX ?? 0 + 50,
            y: layout.floors[0]?.rooms[0]?.pixelY ?? 0 + 50,
            targetX: 0,
            targetY: 0,
            targetRoom: null,
            isMoving: false,
            frame: 0,
            lastActivity: now,
            isThinking: state.isThinking,
          };
          agentsRef.current.set(state.agentId, agent);
        } else {
          agent.isThinking = state.isThinking;
          agent.displayName = state.displayName;
        }
      }

      hasChanges = true;
    }

    return hasChanges;
  }, [activityVersionRef, thinkingVersionRef, recentActivityRef, thinkingAgentsRef]);

  // Main render loop
  const render = useCallback(() => {
    const staticCanvas = staticCanvasRef.current;
    const dynamicCanvas = dynamicCanvasRef.current;
    const layout = layoutRef.current;

    if (!staticCanvas || !dynamicCanvas || !layout) return;

    const staticCtx = staticCanvas.getContext('2d');
    const dynamicCtx = dynamicCanvas.getContext('2d');
    if (!staticCtx || !dynamicCtx) return;

    // Apply viewport transform
    staticCtx.setTransform(zoomRef.current, 0, 0, zoomRef.current, panRef.current.x, panRef.current.y);
    dynamicCtx.setTransform(zoomRef.current, 0, 0, zoomRef.current, panRef.current.x, panRef.current.y);

    // Draw static layer only when dirty
    if (staticDirtyRef.current) {
      drawStaticLayer(staticCtx, layout);
      staticDirtyRef.current = false;
    }

    // Always draw dynamic layer
    drawDynamicLayer(dynamicCtx, layout, frameCountRef.current);
  }, [drawStaticLayer, drawDynamicLayer]);

  // Animation loop with adaptive framerate
  const animate = useCallback((timestamp: number) => {
    const now = Date.now();
    const timeSinceActivity = now - lastActivityTimeRef.current;
    const isIdle = timeSinceActivity > IDLE_TIMEOUT;

    const targetFps = isIdle ? IDLE_FPS : ACTIVE_FPS;
    const frameTime = 1000 / targetFps;

    if (timestamp - lastFrameTimeRef.current >= frameTime) {
      // Process events
      processEvents();

      // Update agent positions
      updateAgents();

      // Render
      render();

      lastFrameTimeRef.current = timestamp;
      frameCountRef.current++;
    }

    animationRef.current = requestAnimationFrame(animate);
  }, [processEvents, updateAgents, render]);

  // Handle canvas resize
  const handleResize = useCallback(() => {
    const container = containerRef.current;
    const staticCanvas = staticCanvasRef.current;
    const dynamicCanvas = dynamicCanvasRef.current;

    if (!container || !staticCanvas || !dynamicCanvas) return;

    const width = container.clientWidth;
    const height = container.clientHeight;

    staticCanvas.width = width;
    staticCanvas.height = height;
    dynamicCanvas.width = width;
    dynamicCanvas.height = height;

    staticDirtyRef.current = true;
  }, []);

  // Mouse handlers for pan/zoom
  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();

    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    const newZoom = Math.max(0.5, Math.min(4, zoomRef.current * delta));

    // Zoom towards mouse position
    const rect = (e.target as HTMLCanvasElement).getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    panRef.current.x = mouseX - (mouseX - panRef.current.x) * (newZoom / zoomRef.current);
    panRef.current.y = mouseY - (mouseY - panRef.current.y) * (newZoom / zoomRef.current);

    zoomRef.current = newZoom;
    staticDirtyRef.current = true;
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    isDraggingRef.current = true;
    lastDragPosRef.current = { x: e.clientX, y: e.clientY };
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDraggingRef.current) return;

    const dx = e.clientX - lastDragPosRef.current.x;
    const dy = e.clientY - lastDragPosRef.current.y;

    panRef.current.x += dx;
    panRef.current.y += dy;

    lastDragPosRef.current = { x: e.clientX, y: e.clientY };
    staticDirtyRef.current = true;
  }, []);

  const handleMouseUp = useCallback(() => {
    isDraggingRef.current = false;
  }, []);

  // Initialize
  useEffect(() => {
    fetchAndBuildLayout();
    handleResize();

    window.addEventListener('resize', handleResize);
    animationRef.current = requestAnimationFrame(animate);

    // Refresh layout periodically
    const refreshInterval = setInterval(fetchAndBuildLayout, 60000);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      clearInterval(refreshInterval);
    };
  }, [fetchAndBuildLayout, handleResize, animate]);

  // Add wheel listener
  useEffect(() => {
    const canvas = dynamicCanvasRef.current;
    if (!canvas) return;

    canvas.addEventListener('wheel', handleWheel, { passive: false });
    return () => canvas.removeEventListener('wheel', handleWheel);
  }, [handleWheel]);

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        height: '100vh',
        backgroundColor: '#1a1a2e',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <canvas
        ref={staticCanvasRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          imageRendering: 'pixelated',
        }}
      />
      <canvas
        ref={dynamicCanvasRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          imageRendering: 'pixelated',
          cursor: isDraggingRef.current ? 'grabbing' : 'grab',
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      />
      <div
        style={{
          position: 'absolute',
          bottom: 10,
          left: 10,
          color: '#666',
          fontSize: '12px',
          fontFamily: 'monospace',
        }}
      >
        Scroll to zoom • Drag to pan
      </div>
    </div>
  );
}
