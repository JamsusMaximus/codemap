#!/usr/bin/env node
/**
 * CodeMap Hotel Setup Script
 *
 * Generates Claude Code hooks configuration for the current project.
 * Run this in your project root: npx codemap-hotel setup
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawn, exec } from 'child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CODEMAP_ROOT = path.resolve(__dirname, '..');
const TARGET_DIR = process.cwd();
const SERVER_PORT = 5174;
const CLIENT_PORT = 5173;

// Hook paths (relative to codemap installation)
const FILE_HOOK = path.join(CODEMAP_ROOT, 'hooks', 'file-activity-hook.sh');
const THINKING_HOOK = path.join(CODEMAP_ROOT, 'hooks', 'thinking-hook.sh');

// Claude settings to merge
const hooksConfig = {
  hooks: {
    PreToolUse: [
      {
        matcher: "Read",
        hooks: [{ type: "command", command: `${FILE_HOOK} read-start` }]
      },
      {
        matcher: "Edit|Write|MultiEdit",
        hooks: [{ type: "command", command: `${FILE_HOOK} write-start` }]
      },
      {
        matcher: ".*",
        hooks: [{ type: "command", command: `${THINKING_HOOK} thinking-end` }]
      }
    ],
    PostToolUse: [
      {
        matcher: "Read",
        hooks: [{ type: "command", command: `${FILE_HOOK} read-end` }]
      },
      {
        matcher: "Edit|Write|MultiEdit",
        hooks: [{ type: "command", command: `${FILE_HOOK} write-end` }]
      },
      {
        matcher: ".*",
        hooks: [{ type: "command", command: `${THINKING_HOOK} thinking-start` }]
      }
    ],
    Notification: [
      {
        matcher: ".*",
        hooks: [{ type: "command", command: `${THINKING_HOOK} thinking-end` }]
      }
    ]
  }
};

// Permissions to add (allows hooks to run without prompting)
const permissionsConfig = {
  permissions: {
    allow: [
      `Bash(${FILE_HOOK} read:*)`,
      `Bash(${FILE_HOOK} write:*)`,
      `Bash(${THINKING_HOOK} thinking-start:*)`,
      `Bash(${THINKING_HOOK} thinking-end:*)`
    ]
  }
};

// Check if a port is in use
function isPortInUse(port) {
  return new Promise((resolve) => {
    exec(`lsof -i :${port} -t`, (err, stdout) => {
      resolve(stdout.trim().length > 0);
    });
  });
}

// Open URL in default browser
function openBrowser(url) {
  const cmd = process.platform === 'darwin' ? 'open' :
              process.platform === 'win32' ? 'start' : 'xdg-open';
  exec(`${cmd} ${url}`);
}

// Start the dev server
function startServer() {
  return new Promise((resolve, reject) => {
    console.log('🚀 Starting CodeMap server...\n');

    const child = spawn('npm', ['run', 'dev'], {
      cwd: CODEMAP_ROOT,
      stdio: 'inherit',
      shell: true,
      env: { ...process.env, PROJECT_ROOT: TARGET_DIR }
    });

    // Wait a bit for server to start, then resolve
    setTimeout(() => resolve(child), 3000);

    child.on('error', reject);
  });
}

// Main "run" command - does everything automatically
async function run() {
  console.log('🏨 CodeMap Hotel\n');
  console.log(`Project: ${TARGET_DIR}\n`);

  // Step 1: Setup hooks if not already configured
  const settingsPath = path.join(TARGET_DIR, '.claude', 'settings.local.json');
  const needsSetup = !fs.existsSync(settingsPath) ||
    !fs.readFileSync(settingsPath, 'utf8').includes('file-activity-hook');

  if (needsSetup) {
    console.log('📝 Setting up hooks...');
    setupHooks();
    console.log('');
  } else {
    console.log('✓ Hooks already configured\n');
  }

  // Step 2: Check if server is already running
  const serverRunning = await isPortInUse(SERVER_PORT);
  const clientRunning = await isPortInUse(CLIENT_PORT);

  if (serverRunning && clientRunning) {
    console.log('✓ Server already running\n');
    console.log('🌐 Opening http://localhost:5173/hotel\n');
    openBrowser('http://localhost:5173/hotel');
    console.log('Start Claude Code in your project to see agents appear! 🎮');
    return;
  }

  // Step 3: Start server
  console.log('Starting visualization server...\n');
  await startServer();

  // Step 4: Open browser
  console.log('\n🌐 Opening http://localhost:5173/hotel\n');
  setTimeout(() => openBrowser('http://localhost:5173/hotel'), 2000);

  console.log('Start Claude Code in your project to see agents appear! 🎮\n');
}

// Setup hooks only (extracted for reuse)
function setupHooks() {
  // Ensure .claude directory exists
  const claudeDir = path.join(TARGET_DIR, '.claude');
  if (!fs.existsSync(claudeDir)) {
    fs.mkdirSync(claudeDir, { recursive: true });
  }

  // Read or create settings.local.json
  const settingsPath = path.join(claudeDir, 'settings.local.json');
  let settings = {};

  if (fs.existsSync(settingsPath)) {
    try {
      settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
    } catch (e) {
      // Ignore parse errors, start fresh
    }
  }

  // Merge hooks
  settings.hooks = hooksConfig.hooks;

  // Merge permissions
  if (!settings.permissions) settings.permissions = {};
  if (!settings.permissions.allow) settings.permissions.allow = [];

  settings.permissions.allow = settings.permissions.allow.filter(
    p => !p.includes('file-activity-hook') && !p.includes('thinking-hook')
  );
  settings.permissions.allow.push(...permissionsConfig.permissions.allow);

  // Write settings
  fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
  console.log('✓ Configured .claude/settings.local.json');
}

function setup() {
  console.log('🏨 CodeMap Hotel Setup\n');
  console.log(`CodeMap installed at: ${CODEMAP_ROOT}`);
  console.log(`Target project: ${TARGET_DIR}\n`);

  setupHooks();

  console.log('\nSetup complete! To start visualization:\n');
  console.log(`  cd ${TARGET_DIR}`);
  console.log('  codemap-hotel\n');
}

// CLI
const command = process.argv[2];

if (command === 'setup') {
  setup();
} else if (command === 'start') {
  // Legacy start command
  run();
} else if (!command) {
  // Default: run everything
  run();
} else {
  console.log('CodeMap Hotel - Visualize Claude Code agents\n');
  console.log('Usage:');
  console.log('  codemap-hotel         - Setup hooks, start server, open browser');
  console.log('  codemap-hotel setup   - Only configure hooks for current project');
  console.log('');
}
