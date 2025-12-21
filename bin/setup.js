#!/usr/bin/env node
/**
 * CodeMap Hotel Setup Script
 *
 * Universal setup for BOTH Claude Code AND Cursor.
 * Configures hooks for whichever tool(s) are present.
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

// Hook paths (absolute - works for both tools)
const FILE_HOOK = path.join(CODEMAP_ROOT, 'hooks', 'file-activity-hook.sh');
const THINKING_HOOK = path.join(CODEMAP_ROOT, 'hooks', 'thinking-hook.sh');
const GIT_POST_COMMIT_HOOK = path.join(CODEMAP_ROOT, 'hooks', 'git-post-commit.sh');

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

// Cursor hooks configuration (.cursor/hooks.json)
const cursorHooksConfig = {
  version: 1,
  hooks: {
    // File operations
    beforeReadFile: [{ command: `${FILE_HOOK} read-start` }],
    afterFileEdit: [{ command: `${FILE_HOOK} write-end` }],
    // Shell/command operations
    beforeShellExecution: [{ command: `${THINKING_HOOK} thinking-end` }],
    afterShellExecution: [{ command: `${THINKING_HOOK} thinking-start` }],
    // MCP tool operations
    beforeMCPExecution: [{ command: `${THINKING_HOOK} thinking-end` }],
    afterMCPExecution: [{ command: `${THINKING_HOOK} thinking-start` }],
    // Agent thinking
    afterAgentThought: [{ command: `${THINKING_HOOK} thinking-start` }],
    // Prompt submission
    beforeSubmitPrompt: [{ command: `${THINKING_HOOK} thinking-end` }]
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
    console.log('Start Claude Code or Cursor in your project to see agents! 🎮');
    return;
  }

  // Step 3: Start server
  console.log('Starting visualization server...\n');
  await startServer();

  // Step 4: Open browser
  console.log('\n🌐 Opening http://localhost:5173/hotel\n');
  setTimeout(() => openBrowser('http://localhost:5173/hotel'), 2000);

  console.log('Start Claude Code or Cursor in your project to see agents! 🎮\n');
}

// Setup Claude Code hooks
function setupClaudeHooks() {
  const claudeDir = path.join(TARGET_DIR, '.claude');
  if (!fs.existsSync(claudeDir)) {
    fs.mkdirSync(claudeDir, { recursive: true });
  }

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

  fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
  console.log('✓ Configured .claude/settings.local.json (Claude Code)');
}

// Setup Cursor hooks
function setupCursorHooks() {
  const cursorDir = path.join(TARGET_DIR, '.cursor');
  if (!fs.existsSync(cursorDir)) {
    fs.mkdirSync(cursorDir, { recursive: true });
  }

  const hooksPath = path.join(cursorDir, 'hooks.json');
  fs.writeFileSync(hooksPath, JSON.stringify(cursorHooksConfig, null, 2));
  console.log('✓ Configured .cursor/hooks.json (Cursor)');
}

// Setup git post-commit hook for layout refresh
function setupGitHook() {
  const gitDir = path.join(TARGET_DIR, '.git');
  if (!fs.existsSync(gitDir)) {
    console.log('⚠ No .git directory found - skipping git hook');
    return;
  }

  const hooksDir = path.join(gitDir, 'hooks');
  if (!fs.existsSync(hooksDir)) {
    fs.mkdirSync(hooksDir, { recursive: true });
  }

  const postCommitPath = path.join(hooksDir, 'post-commit');

  // Check if post-commit hook already exists
  if (fs.existsSync(postCommitPath)) {
    const existing = fs.readFileSync(postCommitPath, 'utf8');
    // Check if our hook is already integrated
    if (existing.includes('codemap') || existing.includes('git-post-commit.sh')) {
      console.log('✓ Git post-commit hook already configured');
      return;
    }
    // Append to existing hook
    const updated = existing + `\n\n# CodeMap Hotel - refresh layout on commit\n${GIT_POST_COMMIT_HOOK}\n`;
    fs.writeFileSync(postCommitPath, updated);
    console.log('✓ Added CodeMap to existing git post-commit hook');
  } else {
    // Create new hook
    const hookContent = `#!/bin/bash
# Git post-commit hook
# Auto-generated by CodeMap Hotel setup

# CodeMap Hotel - refresh layout on commit
${GIT_POST_COMMIT_HOOK}
`;
    fs.writeFileSync(postCommitPath, hookContent);
    fs.chmodSync(postCommitPath, '755');
    console.log('✓ Created git post-commit hook (layout refreshes on commit)');
  }
}

// Setup hooks for ALL detected tools
function setupHooks() {
  // Always setup Claude Code (it's our primary target)
  setupClaudeHooks();

  // Also setup Cursor (universal support)
  setupCursorHooks();

  // Setup git hook for layout refresh on commits
  setupGitHook();

  // Make hooks executable
  try {
    fs.chmodSync(FILE_HOOK, '755');
    fs.chmodSync(THINKING_HOOK, '755');
    fs.chmodSync(GIT_POST_COMMIT_HOOK, '755');
  } catch (e) {
    // Ignore chmod errors
  }
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
