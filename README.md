# CodeMap Hotel

Real-time pixel-art visualization of AI coding agents (Claude Code & Cursor).
Watch agents read files, write code, and move around a cozy multi-floor hotel workspace.

![CodeMap Hotel](https://img.shields.io/badge/status-active-success)
![License](https://img.shields.io/badge/license-MIT-blue)

---

## Quick Start

**1. Clone and install** (one time)
```bash
git clone https://github.com/JamsusMaximus/codemap.git
cd codemap
npm install
```

**2. Navigate to your project**
```bash
cd ~/code/my-other-project
```

**3. Run the setup script**
```bash
node /path/to/codemap/bin/setup.js
```

This will:
- Configure hooks for Claude Code and/or Cursor
- Start the visualization server (if not already running)
- Open your browser to `http://localhost:5173/hotel`

> **Examples:**
> - If codemap is at `~/code/codemap`: `node ~/code/codemap/bin/setup.js`
> - If codemap is a sibling folder: `node ../codemap/bin/setup.js`
> - Setup hooks only (no server): `node /path/to/codemap/bin/setup.js setup`

---

## How It Works

```
AI Agent      →  Hook Scripts  →  Server (:5174)  →  Client (:5173)
(Claude/Cursor)      │               │                  │
  triggers         capture        tracks &           renders
  hooks           events         broadcasts        pixel-art
```

| Component | Role |
|-----------|------|
| **Hooks** | Bash scripts that fire on file read/write operations and tool usage |
| **Server** | Express + WebSocket server that tracks file activity, agent states, and git history |
| **Client** | React app with canvas rendering showing the hotel visualization |

### Data Flow

1. **Agent Activity**: When an AI agent reads or writes a file, hooks capture the event
2. **Server Processing**: Server receives events via HTTP, tracks activity, and analyzes git history
3. **Real-time Updates**: WebSocket broadcasts updates to all connected clients
4. **Visualization**: Client renders agents moving between rooms, with activity indicators on screens

---

## Features

### Visualization Modes

| View | Description |
|------|-------------|
| **Hotel** | Multi-floor pixel-art hotel where each folder is a room. Agents move between rooms as they work. |
| **Tree** | Force-directed graph showing file relationships and activity. |

### Hotel View Features

- **Multi-floor Layout**: Rooms arranged vertically based on git activity (hottest folders on ground floor)
- **Room Themes**: Different floor colors based on folder type:
  - 🟦 Blue: Components, UI, Views
  - 🟩 Green: Server, API, Routes
  - 🟪 Lavender: Hooks, Utils, Lib
  - 🟧 Peach: Tests, Specs
  - 🟨 Cream: Styles, CSS, Themes
  - 🟫 Wood: Default
- **Activity Indicators**: 
  - 💻 Computer screens show current file being read/written
  - 🟡 Yellow glow = reading
  - 🟢 Green glow = writing
  - ⚪ Idle = folder name displayed
- **Multi-agent Support**: See multiple agents working simultaneously (up to 10)
- **Agent States**: 
  - 🟡 Thinking indicator above agent
  - Name tags for each agent
  - Walking animations when moving between rooms

### Navigation

- **Zoom**: Scroll wheel or `⌘/Ctrl +` / `⌘/Ctrl -`
- **Pan**: Click and drag, or arrow keys
- **Adaptive Performance**: Automatically reduces framerate when idle (30fps → 10fps)

### Compatibility

- ✅ **Claude Code**: Full support via `.claude/settings.local.json`
- ✅ **Cursor**: Full support via `.cursor/hooks.json`
- Universal hooks work with both tools automatically

---

## Architecture

### Server (`server/`)

- **Port**: 5174 (fixed)
- **Endpoints**:
  - `POST /api/activity` - Receives file read/write events
  - `POST /api/thinking` - Receives agent thinking state
  - `GET /api/thinking` - Returns all agent states
  - `GET /api/graph` - Returns file tree data
  - `GET /api/hot-folders` - Returns folders ranked by git activity
  - `GET /api/health` - Health check
- **WebSocket**: Broadcasts real-time updates to clients
- **Git Integration**: Analyzes git history to rank folder activity

### Client (`client/`)

- **Port**: 5173 (fixed)
- **Routes**:
  - `/` - Tree view (force-directed graph)
  - `/hotel` - Hotel view (multi-floor visualization)
- **Rendering**: Layered canvas system for performance
  - Static layer: Floors, walls, furniture (redraws only on layout change)
  - Dynamic layer: Agents, screen content, activity glows (redraws every frame)

### Hooks (`hooks/`)

- **`file-activity-hook.sh`**: Captures file operations (read/write start/end)
- **`thinking-hook.sh`**: Captures agent thinking state and tool usage
- Both hooks work with Claude Code and Cursor automatically

---

## Troubleshooting

### Server Not Starting

```bash
# Check if ports are in use
lsof -i :5174  # Server
lsof -i :5173  # Client

# Check server health
curl http://localhost:5174/api/health
```

### Hooks Not Firing

```bash
# Verify hook configuration
cat .claude/settings.local.json  # Claude Code
cat .cursor/hooks.json            # Cursor

# Check hook logs
tail -f /tmp/codemap-hook.log

# Verify hooks are executable
ls -la /path/to/codemap/hooks/
```

### No Agents Appearing

1. **Check agent registration**: `curl http://localhost:5174/api/thinking | jq`
2. **Verify hooks are running**: Check `/tmp/codemap-hook.log`
3. **Check WebSocket connection**: Open browser console, look for "WebSocket connected"
4. **Agent limits**: Maximum 10 agents (hard limit for performance)

### Visualization Issues

- **No rooms showing**: Project may not have git history. Hotel will show a default root room.
- **Agents not moving**: Check that file paths match folder structure in hotel layout
- **Performance issues**: Adaptive framerate should help. Check browser console for errors.

### Common Issues

| Problem | Solution |
|---------|----------|
| Server already running | Kill existing process or use existing instance |
| Hooks blocked | Check permissions in `.claude/settings.local.json` |
| WebSocket disconnected | Server may have restarted, refresh browser |
| No git history | Hotel will still work but with limited room data |

---

## Development

### Running Locally

```bash
# Install dependencies
npm install

# Start both server and client
npm run dev

# Or start individually
npm run dev:server  # Server only
npm run dev:client  # Client only
```

### Project Structure

```
codemap/
├── bin/
│   └── setup.js          # Setup script for hooks and server
├── hooks/
│   ├── file-activity-hook.sh
│   └── thinking-hook.sh
├── server/
│   └── src/
│       ├── index.ts      # Express server + WebSocket
│       ├── activity-store.ts
│       ├── git-activity.ts
│       └── websocket.ts
└── client/
    └── src/
        ├── App.tsx
        ├── components/
        │   ├── MultiFloorHotel.tsx
        │   └── FileGraph.tsx
        └── hooks/
            └── useFileActivity.ts
```

### Testing

Run all tests:

```bash
# Run all tests (client + server)
npm test --workspaces

# Run client tests only
npm test --workspace=client

# Run server tests only
npm test --workspace=server

# Run tests in watch mode (client)
npm run test --workspace=client

# Run tests in watch mode (server)
npm run test:watch --workspace=server
```

#### Test Coverage

| Test File | What It Tests |
|-----------|---------------|
| `client/src/utils/screen-flash.test.ts` | Screen flash timing, path matching, opacity calculations |
| `client/src/utils/agent-movement.test.ts` | Agent positioning, movement logic, idle detection, validation |
| `client/src/utils/integration.test.ts` | End-to-end data flow: file paths → screen flashes → agent movement |
| `server/src/index.test.ts` | Path conversion, relative path handling |
| `server/src/integration.test.ts` | Server event processing, agent registration |

#### Critical Integration Tests

The `integration.test.ts` files verify the core data flow:

```
Hook Event → Server → Client → Visualization
```

These tests ensure:
- File paths from hooks correctly match file IDs in the visualization
- Agents spawn at the right locations when activity is detected
- Screen flashes trigger on the correct desks
- Agent movement and idle behavior work correctly

---

## License

MIT
