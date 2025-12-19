# CodeMap Hotel

Real-time pixel-art visualization of Claude Code agents. Watch AI agents read files, write code, and move around a cozy hotel workspace.

## Quick Start

```bash
# 1. Install (one time)
cd /path/to/codemap-hotel
npm install

# 2. Run from your project (does everything automatically)
cd ~/your-project
node /path/to/codemap-hotel/bin/setup.js
```

That's it! The command will:
- Configure hooks in your project
- Start the visualization server
- Open the browser automatically

## How It Works

```
Claude Code → Hook Scripts → Server (5174) → Client (5173)
```

- Hooks fire on file read/write operations
- Server tracks file activity and agent states
- Client renders pixel-art hotel visualization

## Features

- Multiple agent support
- Pixel-art aesthetic (Habbo Hotel style)
- Animated environment (swaying grass, blinking LEDs, steam)
- Room theming by folder type
- File activity tracking (reads yellow, writes green)

## Troubleshooting

```bash
# Check server
curl http://localhost:5174/api/health

# Check hooks
cat .claude/settings.local.json

# View logs
tail -f /tmp/codemap-hook.log
```

## License

MIT
