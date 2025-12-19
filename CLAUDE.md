# CodeMap Hotel

Real-time pixel-art visualization of Claude Code agents. Shows agents as characters moving around a hotel room, working at desks that represent files.

## Quick Reference

- **Server**: `http://localhost:5174` (API + WebSocket)
- **Client**: `http://localhost:5173/hotel` (visualization)
- **Start**: `npm run dev` (runs both)

## Architecture

```
hooks/ ──▶ server/ ──▶ client/
(bash)     (express)   (react+canvas)
```

### Server (`server/src/`)

- **Port**: 5174 (fixed)
- **`index.ts`**: Express server + WebSocket
  - `POST /api/activity` - Receives file read/write events
  - `POST /api/thinking` - Receives agent thinking events
  - `GET /api/thinking` - Returns all agent states
  - `GET /api/graph` - Returns file tree data
  - WebSocket broadcasts updates to all clients
- **`activity-store.ts`**: Tracks file tree and activity counts

### Client (`client/src/`)

- **Port**: 5173 (fixed)
- **`components/HabboRoom.tsx`**: Main visualization (2800+ lines)
  - Renders pixel-art room with desks, agents, decorations
  - Each file = one desk with monitor
  - Agents move to desks when accessing files
  - Room themes based on folder names (client, server, hooks, etc.)
- **`hooks/useFileActivity.ts`**: WebSocket connection to server

### Hooks (`hooks/`)

- **`file-activity-hook.sh`**: Tracks file operations
  - Called on Read, Edit, Write tool use
  - Sends `read-start`, `read-end`, `write-start`, `write-end`
- **`thinking-hook.sh`**: Tracks agent thinking state
  - Called on all tool use (pre/post)
  - Sends `thinking-start`, `thinking-end`

## Key Data Flows

### Agent Registration
Agents are registered from TWO sources (for redundancy):
1. `POST /api/thinking` - thinking hook events
2. `POST /api/activity` - file activity events (if agent not already registered)

### File Activity
```
PreToolUse(Read) → read-start → server → broadcast → client highlights desk
PostToolUse(Read) → read-end → server → broadcast → client fades desk
```

### Agent Movement
When activity event received, client moves the corresponding agent character to that file's desk position.

## Making Changes

### Adding Room Decorations
Edit `drawRoomThemedDecorations()` in `HabboRoom.tsx`. Check room name with `name.includes('...')`.

### Adding Animations
Pass `frame` parameter to drawing functions. Use `frame % period` for cycling, `Math.sin(frame * speed)` for smooth oscillation.

### Changing Agent Appearance
Edit `drawCharacter()` function and `CHARACTER_PALETTES` array in `HabboRoom.tsx`.

## Setup for Other Projects

Single command from your project directory:
```bash
node /path/to/codemap-hotel/bin/setup.js
```

This will:
1. Configure `.claude/settings.local.json` with hooks
2. Start the visualization server (if not running)
3. Open the browser automatically

Or just setup hooks without starting:
```bash
node /path/to/codemap-hotel/bin/setup.js setup
```

## Debugging

- Hook logs: `tail -f /tmp/codemap-hook.log`
- Agent states: `curl http://localhost:5174/api/thinking | jq`
- Server health: `curl http://localhost:5174/api/health`
