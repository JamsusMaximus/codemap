# Multi-Floor Hotel Plan

## Goals
1. Use git history to determine hot folders (not real-time tracking)
2. Multi-floor vertical layout instead of horizontal sprawl
3. One computer per room showing active file
4. Performant: 5 floors × 10 rooms = 50 rooms without lag

---

## Phase 1: Git-Based Folder Ranking

**Files**: `server/src/git-activity.ts` (new), `server/src/index.ts`

### New module: `git-activity.ts`
```typescript
// Get folder activity scores from git history
async function getHotFolders(projectRoot: string, limit: number): Promise<FolderScore[]>
```

### Implementation
- Run `git log --name-only --pretty=format: -n 500` to get recently changed files
- Aggregate by parent folder, count occurrences
- Return sorted list: `[{ folder: 'src/components', score: 47 }, ...]`
- Cache results for 30 seconds (don't re-run git on every request)

### New API endpoint
- `GET /api/hot-folders?limit=50` — returns ranked folders

---

## Phase 2: Multi-Floor Layout Engine

**Files**: `client/src/layout/multi-floor.ts` (new)

### Data structures
```typescript
interface FloorLayout {
  floor: number;           // 0 = ground, higher = up
  rooms: RoomLayout[];     // 2-10 rooms per floor
  y: number;               // vertical position in tiles
}

interface RoomLayout {
  // Existing fields...
  floor: number;
  gridX: number;           // position within floor (0-9)
}
```

### Layout algorithm
1. Fetch hot folders from server
2. Sort by activity score (descending)
3. Assign to floors:
   - Floor 0 (ground): top 10 most active
   - Floor 1: next 10
   - etc.
4. Within each floor: arrange rooms left-to-right
5. All rooms same size (simplified from current variable sizing)

### Constants
```typescript
const ROOM_WIDTH = 8;      // tiles
const ROOM_HEIGHT = 6;     // tiles
const FLOOR_HEIGHT = 8;    // tiles (room + ceiling gap)
const ROOMS_PER_FLOOR = 10;
const MAX_FLOORS = 5;
```

---

## Phase 3: Simplified Room Rendering

**Files**: `client/src/drawing/room.ts`, `client/src/drawing/furniture.ts`

### One computer per room
- Remove per-file desk grid
- Single workstation centered in room
- Computer screen shows:
  - Idle: folder name
  - Active: "reading foo.ts" or "writing bar.tsx"

### Room contents
- Floor (themed by folder name, keep existing logic)
- Back wall + side wall
- One desk with monitor
- Optional: 1-2 small decorations (plant, lamp)

---

## Phase 4: Performance Architecture

### Layer separation (offscreen canvases)
```
Layer 0: Static background (floors, walls) — redraw only on layout change
Layer 1: Furniture (desks, decorations) — redraw only on layout change
Layer 2: Dynamic (agents, screen content, glows) — redraw every frame
```

### Main canvas compositing
```typescript
function render() {
  // Only redraw static layers if layout changed
  if (layoutChanged) {
    renderStaticLayers();
    layoutChanged = false;
  }

  // Always redraw dynamic layer
  clearDynamicCanvas();
  renderAgents();
  renderScreenContent();
  renderActivityGlows();

  // Composite all layers to main canvas
  mainCtx.drawImage(staticCanvas, 0, 0);
  mainCtx.drawImage(dynamicCanvas, 0, 0);
}
```

### Drawing optimizations
- Batch similar operations (all floors, then all walls, then all furniture)
- Pre-calculate isometric positions once, store in layout
- Use `ctx.save()`/`ctx.restore()` sparingly
- Integer coordinates for crisp pixels: `Math.round(x)`

### Animation loop
- Target 30fps (33ms per frame) — plenty for pixel art
- Adaptive framerate:
  - 30fps when agents moving or activity happening
  - 10fps (or pause) when idle for 2+ seconds
- Skip frames entirely if nothing changed

```typescript
const TARGET_FPS = 30;
const IDLE_FPS = 10;
const FRAME_TIME = 1000 / TARGET_FPS;

let lastActivity = Date.now();
let isIdle = false;

function animate(timestamp: number) {
  const timeSinceActivity = Date.now() - lastActivity;
  isIdle = timeSinceActivity > 2000;

  const currentFrameTime = isIdle ? (1000 / IDLE_FPS) : FRAME_TIME;

  if (timestamp - lastFrameTime >= currentFrameTime) {
    render();
    lastFrameTime = timestamp;
  }

  requestAnimationFrame(animate);
}
```

---

## Phase 5: Screen Content Display

**Files**: `client/src/drawing/furniture.ts`

### Computer screen states
1. **Idle**: Show folder name in retro terminal style
2. **Reading**: Yellow tint, show "reading: filename.ts"
3. **Writing**: Green tint, show "writing: filename.ts"

### Implementation
```typescript
function drawComputerScreen(
  ctx: CanvasRenderingContext2D,
  x: number, y: number,
  folderName: string,
  activeFile: { name: string; operation: 'read' | 'write' } | null
) {
  // Draw CRT monitor frame
  // Draw screen with appropriate color
  // Draw text (folder name or active file)
}
```

---

## Phase 6: Agent Behavior Updates

**Files**: `client/src/components/HabboRoom.tsx`

### Agent movement
- When agent accesses a file, find which room contains that folder
- Move agent to that room's desk position
- Agent "sits" at desk while operation is active

### Multiple agents in same room
- Offset positions slightly so they don't overlap
- Or: one agent at desk, others standing nearby

---

## File Changes Summary

| File | Change |
|------|--------|
| `server/src/git-activity.ts` | NEW - git log parsing |
| `server/src/index.ts` | Add `/api/hot-folders` endpoint |
| `client/src/layout/multi-floor.ts` | NEW - floor layout engine |
| `client/src/components/HabboRoom.tsx` | Use new layout, layer rendering |
| `client/src/drawing/room.ts` | Simplified room drawing |
| `client/src/drawing/furniture.ts` | One computer per room, screen content |
| `client/src/drawing/types.ts` | Add floor-related types |

---

## Performance Targets

- 30fps with 50 rooms visible (adaptive: 10fps when idle)
- < 100ms layout recalculation
- < 33ms per frame render
- Pixel-art-appropriate agent movement

---

## Implementation Order

1. Git activity module + API endpoint
2. Multi-floor layout algorithm
3. Layer-based rendering architecture
4. Simplified room drawing
5. Computer screen content
6. Agent behavior updates
7. Polish (transitions, effects)
