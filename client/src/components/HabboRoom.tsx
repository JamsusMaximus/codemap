import { useEffect, useRef } from 'react';
import { useFileActivity } from '../hooks/useFileActivity';
import { GraphNode } from '../types';
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

  // Agent trails - stores recent footprint positions
  const agentTrailsRef = useRef<Array<{
    x: number; y: number; timestamp: number; colorIndex: number;
  }>>([]);
  const lastTrailPosRef = useRef<Map<string, { x: number; y: number }>>(new Map());

  // Room activity tracking for pulse effect
  const roomActivityRef = useRef<Map<string, number>>(new Map());  // roomName -> lastActivityTimestamp

  // Build layout - generates rooms from folder structure + adds lobby
  const buildLayout = (nodes: GraphNode[]): RoomLayout | null => {
    if (nodes.length === 0) return null;
    const root = nodes.find(n => n.depth === -1);
    if (!root) return null;

    const childrenMap = new Map<string, GraphNode[]>();
    nodes.forEach(n => childrenMap.set(n.id, []));
    nodes.forEach(n => {
      if (n.id === root.id) return;
      const parentPath = n.id.substring(0, n.id.lastIndexOf('/'));
      if (childrenMap.has(parentPath)) childrenMap.get(parentPath)!.push(n);
    });

    const layoutRoom = (node: GraphNode, x: number, y: number, depth: number): RoomLayout => {
      const children = childrenMap.get(node.id) || [];
      const folders = children.filter(c => c.isFolder);
      const files = children.filter(c => !c.isFolder);

      const fileCols = Math.min(4, Math.max(1, files.length));
      const fileRows = Math.ceil(files.length / fileCols);
      const baseWidth = Math.max(10, fileCols * 5 + 4);
      const baseHeight = Math.max(7, fileRows * 4 + 5);

      const floorStyle = getFloorStyle(node.name, depth);

      const fileLayouts: FileLayout[] = files.map((file, i) => {
        const col = i % fileCols;
        const row = Math.floor(i / fileCols);
        const fx = x + 3 + col * 5;
        const fy = y + 3 + row * 4;
        filePositionsRef.current.set(file.id, {
          x: fx * TILE_SIZE + TILE_SIZE * 1.5,
          y: fy * TILE_SIZE + TILE_SIZE
        });
        // Calculate heat level based on activity (0-1 scale, maxes out at 10 accesses)
        const totalActivity = (file.activityCount?.reads || 0) + (file.activityCount?.writes || 0);
        const heatLevel = Math.min(1, totalActivity / 10);
        return {
          x: fx, y: fy, name: file.name, id: file.id,
          isActive: file.activeOperation === 'read' || file.activeOperation === 'write',
          isWriting: file.activeOperation === 'write',
          deskStyle: Math.floor(seededRandom(x * 53 + y * 97 + i * 13) * 3),
          heatLevel
        };
      });

      const ROOM_GAP = 1;
      let childX = x;
      let childY = y + baseHeight + ROOM_GAP;
      let maxChildHeight = 0;
      const childLayouts: RoomLayout[] = [];

      folders.forEach((folder, i) => {
        if (i > 0) childX += ROOM_GAP;
        const childRoom = layoutRoom(folder, childX, childY, depth + 1);
        childLayouts.push(childRoom);
        childX += childRoom.width;
        maxChildHeight = Math.max(maxChildHeight, childRoom.height);
      });

      return {
        x, y,
        width: Math.max(baseWidth, childX - x),
        height: baseHeight + (folders.length > 0 ? maxChildHeight + ROOM_GAP : 0),
        name: node.name, files: fileLayouts, children: childLayouts,
        depth, floorStyle
      };
    };

    const mainLayout = layoutRoom(root, 1, 1, 0);

    const lobbyWidth = 12;
    const lobbyHeight = 8;
    const lobbyRoom: RoomLayout = {
      x: 1,
      y: mainLayout.y + mainLayout.height + 1,
      width: lobbyWidth,
      height: lobbyHeight,
      name: 'Lobby',
      files: [],
      children: [],
      depth: 0,
      floorStyle: 'wood'
    };

    return {
      x: 1,
      y: 1,
      width: Math.max(mainLayout.width, lobbyWidth),
      height: mainLayout.height + 1 + lobbyHeight,
      name: root.name,
      files: mainLayout.files,
      children: [...mainLayout.children, lobbyRoom],
      depth: -1,
      floorStyle: mainLayout.floorStyle
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

  // Draw a complete room with all elements
  const drawRoom = (ctx: CanvasRenderingContext2D, room: RoomLayout, now: number, frame: number) => {
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

    drawRoomSign(ctx, room);
    room.children.forEach(child => drawRoom(ctx, child, now, frame));
    drawDoorFrames(ctx, room);
  };

  // Animation loop - ALL logic runs here, no useEffects that trigger re-renders
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    let running = true;
    let frame = 0;

    const render = () => {
      if (!running) return;
      const now = performance.now();
      frame++;

      // === SYNC AGENTS (replaces useEffect) ===
      if (thinkingVersionRef.current !== lastThinkingVersionRef.current) {
        lastThinkingVersionRef.current = thinkingVersionRef.current;
        const agents = agentCharactersRef.current;
        const thinkingAgents = thinkingAgentsRef.current;

        // Add new agents or update existing ones
        for (const agent of thinkingAgents) {
          const existing = agents.get(agent.agentId);
          if (existing) {
            existing.currentCommand = agent.currentCommand;
            existing.displayName = agent.displayName;
            existing.waitingForInput = agent.waitingForInput ?? false;
            existing.lastActivity = agent.lastActivity;
            existing.isThinking = agent.isThinking;
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

        // Remove agents no longer in list
        const activeIds = new Set(thinkingAgents.map(a => a.agentId));
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
          // Handle screen flashes for operation end events
          if (recentActivity.type === 'read-end') {
            screenFlashesRef.current.set(recentActivity.filePath, {
              type: 'read',
              startTime: now
            });
          }
          if (recentActivity.type === 'write-end') {
            screenFlashesRef.current.set(recentActivity.filePath, {
              type: 'write',
              startTime: now
            });
          }

          // Move agents on operation start
          if (recentActivity.type.endsWith('-start')) {
            const agentId = recentActivity.agentId;
            if (agentId) {
              lastActivityByAgentRef.current.set(agentId, {
                filePath: recentActivity.filePath,
                timestamp: Date.now()
              });

              const filePos = filePositionsRef.current.get(recentActivity.filePath);
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

        const offsetX = (canvas.width - totalSceneW) / 2 + borderSize * TILE_SIZE;
        const offsetY = (canvas.height - totalSceneH) / 2 + borderSize * TILE_SIZE;

        ctx.save();
        ctx.translate(offsetX - layout.x * TILE_SIZE, offsetY - layout.y * TILE_SIZE);

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

      animationRef.current = requestAnimationFrame(render);
    };

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);
    render();

    return () => {
      running = false;
      window.removeEventListener('resize', resize);
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
