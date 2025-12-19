# CodeMap Hotel

Real-time pixel-art visualization of Claude Code agents.
Watch AI agents read files, write code, and move around a cozy hotel workspace.

---

## Quick Start

**1. Clone and install** (one time)
```bash
git clone https://github.com/JamsusMaximus/codemap.git
cd codemap
npm install
```

**2. Go to the project you want to visualize**
```bash
cd ~/code/my-other-project
```

**3. Run the setup script**
```bash
node /path/to/codemap/bin/setup.js
```

This will configure hooks, start the server, and open your browser automatically.

> **Example:** If codemap is at `~/code/codemap`, run `node ~/code/codemap/bin/setup.js`
> **Example:** If codemap is a sibling folder, run `node ../codemap/bin/setup.js`

---

## How It Works

```
Claude Code  →  Hook Scripts  →  Server (:5174)  →  Client (:5173)
     │                │               │                  │
  triggers         capture        tracks &           renders
  hooks           events         broadcasts        pixel-art
```

| Component | Role |
|-----------|------|
| **Hooks** | Fire on file read/write operations |
| **Server** | Tracks file activity and agent states |
| **Client** | Renders the hotel visualization |

---

## Features

| Feature | Description |
|---------|-------------|
| Multi-agent | See multiple Claude agents working simultaneously |
| Pixel-art style | Habbo Hotel inspired aesthetic |
| Animations | Swaying grass, blinking LEDs, steam effects |
| Room themes | Different decor based on folder type |
| Activity tracking | Yellow = reading, Green = writing |
| Navigation | Zoom & pan with scroll wheel, drag, arrow keys, or ⌘+/− |

---

## Troubleshooting

| Issue | Command |
|-------|---------|
| Check server | `curl http://localhost:5174/api/health` |
| Check hooks | `cat .claude/settings.local.json` |
| View logs | `tail -f /tmp/codemap-hook.log` |

---

## License

MIT
