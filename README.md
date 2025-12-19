# CodeMap Hotel

Real-time pixel-art visualization of Claude Code agents. Watch AI agents read files, write code, and move around a cozy hotel workspace.

## Quick Start

```bash
# 1. Clone and install (one time)
git clone https://github.com/JamsusMaximus/codemap.git
cd codemap
npm install

# 2. Go to the project you want to visualize
cd ~/code/my-other-project

# 3. Run the setup script (use absolute path to codemap)
node ~/code/codemap/bin/setup.js
```

That's it! The command will:
- Configure Claude Code hooks in your project
- Start the visualization server
- Open the browser automatically

### Example: Sibling Folders

If you have this folder structure:
```
~/code/
  ├── codemap/          # This repo
  └── my-app/           # Project you want to visualize
```

Run:
```bash
cd ~/code/my-app
node ../codemap/bin/setup.js
```

Then start Claude Code in `my-app` and watch the agents appear!

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
- Zoom & pan (scroll wheel, drag, arrow keys, ⌘+/−)

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
