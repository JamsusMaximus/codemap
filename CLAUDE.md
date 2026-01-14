# CodeMap Hotel

Real-time pixel-art visualization of Claude Code and Cursor agents. Shows agents as characters moving around a hotel, working at desks that represent files.

## Agent Quick Start

**Working on hooks?** → Edit `hooks/thinking-hook.sh` or `hooks/file-activity-hook.sh`
**Working on visualization?** → Edit `client/src/drawing/agent.ts` (sprites) or `client/src/components/HabboRoom.tsx` (main loop)
**Working on server?** → Edit `server/src/index.ts` (endpoints) or `server/src/types.ts` (data structures)

Key files to understand first:
1. `server/src/types.ts` - All shared interfaces
2. `client/src/drawing/types.ts` - Client-side types
3. `hooks/thinking-hook.sh` - How hook data flows in

Run tests: `cd server && npm test` and `cd client && npm test`

## Quick Reference

| Resource | URL |
|----------|-----|
| Server | `http://localhost:5174` |
| Client | `http://localhost:5173/hotel` |
| Start both | `npm run dev` |
| Run tests | `npm test` (from client/ or server/) |
| Hook logs | `tail -f /tmp/codemap-hook.log` |

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        DATA FLOW                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Claude Code / Cursor                                            │
│       │                                                          │
│       ▼                                                          │
│  ┌─────────────────┐                                             │
│  │  hooks/ (bash)  │  file-activity-hook.sh, thinking-hook.sh   │
│  └────────┬────────┘                                             │
│           │ POST /api/activity, /api/thinking                    │
│           ▼                                                      │
│  ┌─────────────────┐                                             │
│  │ server/ (node)  │  Express + WebSocket on port 5174          │
│  └────────┬────────┘                                             │
│           │ WebSocket broadcast                                  │
│           ▼                                                      │
│  ┌─────────────────┐                                             │
│  │ client/ (react) │  Canvas visualization on port 5173         │
│  └─────────────────┘                                             │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Directory Structure

```
codemap/
├── bin/
│   └── setup.js           # Universal setup script for any project
├── hooks/
│   ├── file-activity-hook.sh   # Tracks Read/Write/Edit operations
│   └── thinking-hook.sh        # Tracks agent thinking state
├── server/
│   └── src/
│       ├── index.ts            # Express server + API endpoints
│       ├── activity-store.ts   # File tree and activity tracking
│       ├── git-activity.ts     # Git-based folder ranking
│       ├── websocket.ts        # WebSocket client management
│       ├── types.ts            # Shared TypeScript interfaces
│       └── *.test.ts           # Test files (126 tests)
├── client/
│   └── src/
│       ├── components/
│       │   └── HabboRoom.tsx   # Main visualization (1200+ lines)
│       ├── drawing/            # Pixel art rendering modules
│       │   ├── agent.ts        # Character sprites
│       │   ├── furniture.ts    # Desks, monitors
│       │   ├── decorations.ts  # Themed room items
│       │   └── ...
│       ├── hooks/
│       │   └── useFileActivity.ts  # WebSocket connection
│       ├── utils/
│       │   ├── agent-movement.ts   # Movement calculations
│       │   ├── screen-flash.ts     # Activity indicators
│       │   └── *.test.ts           # Test files (122 tests)
│       └── layout/
│           └── multi-floor.ts      # Floor layout algorithm
├── CLAUDE.md              # This file (agent reference)
├── README.md              # User documentation
└── package.json           # Workspace root
```

## Server API Reference

### Endpoints

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/api/activity` | Receive file read/write events |
| POST | `/api/thinking` | Receive agent thinking state |
| GET | `/api/thinking` | Return all agent states (JSON) |
| GET | `/api/graph` | Return file tree data |
| GET | `/api/hot-folders` | Git-ranked folders |
| GET | `/api/health` | Health check |
| GET | `/api/debug` | Debug info (uptime, clients, activity) |

### WebSocket

- Path: `ws://localhost:5174/ws`
- Messages: `{ type: 'activity' | 'graph' | 'thinking', data: ... }`

### Event Types

```typescript
// Activity events (from file-activity-hook.sh)
type ActivityEvent = {
  type: 'read-start' | 'read-end' | 'write-start' | 'write-end' | 'search-start' | 'search-end';
  filePath: string;      // Relative to project root
  agentId?: string;      // UUID of the agent
  source?: 'claude' | 'cursor';
  timestamp: number;
};

// Thinking events (from thinking-hook.sh)
type ThinkingEvent = {
  type: 'thinking-start' | 'thinking-end';
  agentId: string;
  toolName?: string;     // Current tool being used (Read, Write, Bash, etc.)
  toolInput?: string;    // Abbreviated input (filename, command preview, pattern)
  agentType?: string;    // Agent type (Plan, Explore, Bash) - updates displayName
  source: 'claude' | 'cursor';
};
```

## Client Components

### HabboRoom.tsx (Main Visualization)

The core visualization component. Key sections:

1. **Agent State Management** (lines 450-540)
   - Syncs with server agent states
   - Creates/updates agent characters
   - 30-second grace period before removing inactive agents

2. **Activity Handling** (lines 540-670)
   - Matches file paths to desk positions
   - Triggers screen flashes (read=yellow, write=green)
   - Moves agents to file desks

3. **Agent Movement** (lines 670-730)
   - Grid-based movement (6px/frame)
   - Idle agents go to coffee shop after 30s
   - Trail footprints for movement

4. **Layout & Drawing** (lines 730-900)
   - Canvas transforms for zoom/pan
   - Room rendering with themed decorations
   - Agent character drawing

### Key Data Structures

```typescript
// Agent character (client-side)
interface AgentCharacter {
  agentId: string;
  displayName: string;    // "Claude 1", "Claude Plan 1", "Cursor 2", etc.
  x: number;              // Current position
  y: number;
  targetX: number;        // Destination position
  targetY: number;
  isMoving: boolean;
  colorIndex: number;     // For sprite palette
  currentCommand?: string;  // Tool name shown in bubble (Read, Write, Bash)
  toolInput?: string;     // File/command shown in bubble below tool name
  isThinking: boolean;
  waitingForInput: boolean;  // Shows "Hey! I'm stuck!" bubble + jump animation
  lastActivity: number;   // Timestamp
  agentType?: string;     // Agent type (Plan, Explore, Bash)
}

// File position mapping
filePositionsRef: Map<string, { x: number; y: number }>
// Key: relative file path (e.g., "client/src/App.tsx")
// Value: pixel coordinates of the desk
```

## Testing

### Test Coverage

| Module | Tests | Coverage |
|--------|-------|----------|
| server/index.ts | 29 | Path conversion, agent validation |
| server/integration.ts | 13 | End-to-end event processing |
| server/activity-store.ts | 13 | File tree, activity tracking |
| server/websocket.ts | 15 | Broadcast, client management |
| server/git-activity.ts | 14 | Git log parsing, scoring |
| client/agent-movement.ts | 45 | Movement, positioning |
| client/screen-flash.ts | 38 | Flash timing, path matching |
| client/integration.ts | 39 | Data flow validation |
| **Total** | **248** | |

### Running Tests

```bash
# Server tests
cd server && npm test

# Client tests
cd client && npm test

# Watch mode
npm test -- --watch

# All tests run automatically on git push (pre-push hook)
```

### Critical Integration Tests

The integration tests verify the complete data flow:

```
Hook Event → Server → WebSocket → Client → Visualization
```

Key test files:
- `server/src/integration.test.ts` - Server event processing
- `client/src/utils/integration.test.ts` - Client visualization

## Common Tasks

### Adding Room Decorations

Edit `client/src/drawing/decorations.ts`:

```typescript
// In drawRoomThemedDecorations()
if (roomName.includes('components')) {
  // Draw component-specific decorations
  drawReactLogo(ctx, x + 50, y + 30, frame);
}
```

### Adding Animations

Use the `frame` parameter (increments each render):

```typescript
// Cycling animation (3 frames, changes every 20 frames)
const animFrame = Math.floor(frame / 20) % 3;

// Smooth oscillation
const offset = Math.sin(frame * 0.1) * 5;

// Bouncing
const bounce = Math.abs(Math.sin(frame * 0.15)) * 10;
```

### Changing Agent Colors

Edit `CHARACTER_PALETTES` in `client/src/drawing/agent.ts`:

```typescript
const CHARACTER_PALETTES = [
  { skin: '#FFD5B5', hair: '#4A3C31', shirt: '#C83030' }, // Red
  { skin: '#FFD5B5', hair: '#2C2C2C', shirt: '#3070C8' }, // Blue
  // Add new palettes here
];
```

### Adding New API Endpoints

In `server/src/index.ts`:

```typescript
app.get('/api/new-endpoint', (req, res) => {
  res.json({ data: 'response' });
});
```

### Modifying Agent Behavior

Movement logic is in `client/src/utils/agent-movement.ts`:
- `moveTowardsTarget()` - Step-by-step movement
- `shouldAgentGoIdle()` - Idle detection
- `findFilePositionWithFallback()` - File → position mapping

## Debugging

### Hook Issues

```bash
# Watch hook logs in real-time
tail -f /tmp/codemap-hook.log

# Test activity endpoint manually
curl -X POST http://localhost:5174/api/activity \
  -H "Content-Type: application/json" \
  -d '{"type":"read-start","filePath":"test.ts","agentId":"test-123"}'
```

### Agent Issues

```bash
# Get all agent states
curl http://localhost:5174/api/thinking | jq

# Get debug info
curl http://localhost:5174/api/debug | jq
```

### Client Issues

- Open browser DevTools console
- Check WebSocket connection in Network tab
- Agent positions logged when `DEBUG=true`

## Setup for Other Projects

```bash
# From any project directory
node /path/to/codemap/bin/setup.js

# This will:
# 1. Configure .claude/settings.local.json with hooks
# 2. Start the visualization server
# 3. Open browser to http://localhost:5173/hotel
```

## Key Design Decisions

1. **Fixed Ports (5173/5174)**: Never change. Hooks and client hardcode these.

2. **Relative Paths**: Server converts absolute paths to relative before broadcasting. Client matches files by relative path.

3. **Agent Grace Period**: Agents persist 30s after last activity to prevent flicker during brief pauses.

4. **Canvas Rendering**: Used instead of DOM for performance with many elements.

5. **WebSocket Broadcasting**: All clients receive all updates. No per-client filtering.

6. **Git-Based Layout**: Hot folders (most git commits) get priority in room layout.

7. **No Teleporting**: Agents always walk to destinations. Never set x/y directly except for new agents.

## Coordinate Systems

```
Layout Coordinates (tiles)     Pixel Coordinates
┌────────────────────────┐    ┌────────────────────────┐
│ layout.x, layout.y     │ →  │ * TILE_SIZE (16px)     │
│ layout.width, height   │    │                        │
└────────────────────────┘    └────────────────────────┘

Agent positions are in pixel coordinates.
File positions (filePositionsRef) are in pixel coordinates.
Room layout is in tile coordinates, converted when drawing.
```

## Performance Notes

- Target: 30fps during activity, 10fps when idle
- Canvas redraws entire scene each frame
- ~100 trail footprints max (older ones removed)
- Git activity cached for 30 seconds
- WebSocket ping every 30 seconds to detect dead connections
