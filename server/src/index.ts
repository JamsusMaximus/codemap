import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { createServer } from 'http';
import { WebSocketManager } from './websocket.js';
import { ActivityStore } from './activity-store.js';
import { getHotFolders, clearCache as clearGitCache } from './git-activity.js';
import { FileActivityEvent, ThinkingEvent, AgentThinkingState } from './types.js';

const PORT = parseInt(process.env.PORT || '5174', 10);

// PROJECT_ROOT: Use env var, command line arg, or detect from cwd
// If running from server/ subdirectory, go up to find the actual project root
function detectProjectRoot(): string {
  if (process.env.PROJECT_ROOT) return process.env.PROJECT_ROOT;
  if (process.argv[2]) return process.argv[2];

  const cwd = process.cwd();
  // If we're in a 'server' subdirectory of a workspace, go up one level
  if (cwd.endsWith('/server') || cwd.endsWith('\\server')) {
    return path.dirname(cwd);
  }
  return cwd;
}

const PROJECT_ROOT = detectProjectRoot();

// Convert absolute file paths to relative (for client matching)
function toRelativePath(absolutePath: string): string {
  // Must match PROJECT_ROOT exactly (followed by / or end of string)
  if (absolutePath === PROJECT_ROOT) {
    return '.';
  }
  const prefix = PROJECT_ROOT + '/';
  if (absolutePath.startsWith(prefix)) {
    return absolutePath.slice(prefix.length) || '.';
  }
  return absolutePath;
}

const app = express();
app.use(cors());
app.use(express.json());

const server = createServer(app);
const wsManager = new WebSocketManager(server);
const activityStore = new ActivityStore(PROJECT_ROOT);

// Broadcast graph updates when files are created/deleted
activityStore.onGraphChange((graphData) => {
  wsManager.broadcast('graph', graphData);
});

// Track thinking state per agent
const agentStates = new Map<string, AgentThinkingState>();
const AGENT_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes
const MAX_AGENTS = 10; // HARD LIMIT - never allow more than this
const AGENT_CREATION_COOLDOWN_MS = 500; // Minimum time between new agent registrations
let lastAgentCreationTime = 0;

// Permission prompt detection - if PreToolUse received but no PostToolUse after this time,
// agent is likely waiting for user permission. Use a high threshold (60s) to avoid false
// positives from slow-running tools (npm test, builds, long bash commands, etc.)
// For immediate detection, AskUserQuestion is handled separately.
const WAITING_FOR_INPUT_THRESHOLD_MS = 60000;

// Debug/observability tracking
const SERVER_START_TIME = Date.now();
const recentActivityBuffer: Array<{ type: string; filePath: string; agentId?: string; timestamp: number }> = [];
const MAX_ACTIVITY_BUFFER = 50;

// Agent state persistence — configurable to avoid writing into the watched project
const STATE_FILE = process.env.CODEMAP_STATE_FILE || path.join(PROJECT_ROOT, '.codemap-state.json');

function saveAgentState(): void {
  try {
    const state = {
      savedAt: Date.now(),
      agents: Array.from(agentStates.values()),
    };
    fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
  } catch (err) {
    console.error('Failed to save agent state:', err);
  }
}

function loadAgentState(): void {
  try {
    if (fs.existsSync(STATE_FILE)) {
      const data = JSON.parse(fs.readFileSync(STATE_FILE, 'utf-8'));
      const now = Date.now();

      // Only restore agents that haven't timed out
      for (const agent of data.agents || []) {
        if (now - agent.lastActivity < AGENT_TIMEOUT_MS) {
          agentStates.set(agent.agentId, agent);
        }
      }

      console.log(`[${new Date().toISOString()}] Restored ${agentStates.size} agents from state file`);
    }
  } catch (err) {
    console.error('Failed to load agent state:', err);
  }
}

// Save state every 30 seconds
setInterval(saveAgentState, 30000);

// Validate agent ID format - must be a valid UUID (session_id format)
function isValidAgentId(id: string): boolean {
  if (!id || typeof id !== 'string') return false;
  // UUID format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
}

// Find the next available number for a source (fills gaps from removed agents)
function getNextAgentNumber(source: 'claude' | 'cursor' | 'unknown'): number {
  const usedNumbers = new Set<number>();
  for (const state of agentStates.values()) {
    if (state.source === source) {
      const match = state.displayName.match(/(\d+)$/);
      if (match) {
        usedNumbers.add(parseInt(match[1], 10));
      }
    }
  }
  // Find the lowest available number starting from 1
  let num = 1;
  while (usedNumbers.has(num)) {
    num++;
  }
  return num;
}

// Safe agent registration with multiple protections
function registerAgent(
  agentId: string,
  timestamp: number,
  eventSource: string,  // Where this event came from (activity/thinking)
  agentSource: 'claude' | 'cursor' | 'unknown' = 'unknown'  // Which tool (Claude/Cursor)
): AgentThinkingState | null {
  // PROTECTION 1: Validate agent ID format
  if (!isValidAgentId(agentId)) {
    console.log(`[${new Date().toISOString()}] REJECTED invalid agent ID: ${agentId} (${eventSource})`);
    return null;
  }

  // Check if agent already exists
  let state = agentStates.get(agentId);
  if (state) {
    return state; // Already registered, return existing
  }

  // PROTECTION 2: Hard limit on total agents
  if (agentStates.size >= MAX_AGENTS) {
    console.log(`[${new Date().toISOString()}] REJECTED new agent - at max capacity (${MAX_AGENTS}): ${agentId}`);
    return null;
  }

  // PROTECTION 3: Rate limiting - prevent rapid agent creation
  const now = Date.now();
  if (now - lastAgentCreationTime < AGENT_CREATION_COOLDOWN_MS) {
    console.log(`[${new Date().toISOString()}] REJECTED new agent - rate limited: ${agentId}`);
    return null;
  }

  // All checks passed - create the agent with source-specific name
  lastAgentCreationTime = now;
  const agentNumber = getNextAgentNumber(agentSource);

  // Name based on source: "Claude Code 1", "Cursor 1", etc.
  const sourceName = agentSource === 'claude' ? 'Claude Code' :
                     agentSource === 'cursor' ? 'Cursor' : 'Agent';
  const displayName = `${sourceName} ${agentNumber}`;

  state = {
    agentId,
    source: agentSource,
    isThinking: false,
    lastActivity: timestamp,
    displayName,
    currentCommand: undefined
  };
  agentStates.set(agentId, state);
  console.log(`[${new Date().toISOString()}] New agent registered: ${displayName} (${agentId.slice(0, 8)}) [${eventSource}]`);
  return state;
}

// Cleanup stale agents periodically
setInterval(() => {
  const now = Date.now();
  let removedAny = false;
  for (const [agentId, state] of agentStates) {
    if (now - state.lastActivity > AGENT_TIMEOUT_MS) {
      console.log(`[${new Date().toISOString()}] Removing stale agent: ${state.displayName} (${agentId})`);
      agentStates.delete(agentId);
      removedAny = true;
    }
  }
  // Broadcast updated state if any agents were removed
  if (removedAny) {
    wsManager.broadcast('thinking', getAgentStatesArray());
  }
}, 60000); // Check every minute

// Periodic sync broadcast - ensures client stays in sync even if events are missed
// Also detects agents waiting for permission (stuck in PreToolUse state)
setInterval(() => {
  if (agentStates.size > 0) {
    const now = Date.now();

    // Check for agents stuck waiting for permission
    for (const state of agentStates.values()) {
      if (state.pendingToolStart && !state.waitingForInput) {
        const waitTime = now - state.pendingToolStart;
        if (waitTime > WAITING_FOR_INPUT_THRESHOLD_MS) {
          state.waitingForInput = true;
          console.log(`[${new Date().toISOString()}] Agent ${state.displayName} appears to be waiting for permission (${waitTime}ms)`);
        }
      }
    }

    wsManager.broadcast('thinking', getAgentStatesArray());
  }
}, 2000); // Sync every 2 seconds

function getAgentStatesArray(): AgentThinkingState[] {
  return Array.from(agentStates.values());
}

// Receive activity events from hook script
app.post('/api/activity', (req, res) => {
  const event: FileActivityEvent = req.body;
  console.log(`[${new Date().toISOString()}] ${event.type.toUpperCase()}: ${event.filePath}${event.agentId ? ` (${event.agentId.slice(0, 8)})` : ''}`);

  // Track in debug buffer
  recentActivityBuffer.push({
    type: event.type,
    filePath: toRelativePath(event.filePath),
    agentId: event.agentId,
    timestamp: Date.now()
  });
  if (recentActivityBuffer.length > MAX_ACTIVITY_BUFFER) {
    recentActivityBuffer.shift();
  }

  // Register or get existing agent using safe registration
  if (event.agentId) {
    const now = Date.now();
    const state = registerAgent(event.agentId, now, 'activity', event.source || 'unknown');
    if (state) {
      // Always update last activity timestamp to keep agent alive
      // Use server time (Date.now()), not hook timestamp which can be stale
      state.lastActivity = now;

      // Update current command and thinking state based on activity type
      if (event.type.endsWith('-start')) {
        state.currentCommand = event.type.startsWith('read') ? 'Read' :
                               event.type.startsWith('write') ? 'Write' : 'Grep';
        state.isThinking = true;
      } else if (event.type.endsWith('-end')) {
        // Keep command visible but mark as not actively thinking
        state.isThinking = false;
      }

      // Always broadcast agent state on activity to keep client in sync
      wsManager.broadcast('thinking', getAgentStatesArray());
    }
  }

  const graphData = activityStore.addActivity(event);

  // Broadcast to all connected clients with relative path for client matching
  const clientEvent = {
    ...event,
    filePath: toRelativePath(event.filePath)
  };
  wsManager.broadcast('activity', clientEvent);
  wsManager.broadcast('graph', graphData);

  res.status(200).json({ success: true });
});

// Receive thinking events
app.post('/api/thinking', (req, res) => {
  const event: ThinkingEvent = req.body;
  const { agentId, type, toolName, toolInput, agentType, model, duration, status } = event;
  const now = Date.now();

  // Register or get existing agent using safe registration
  const state = registerAgent(agentId, now, 'thinking', event.source || 'unknown');
  if (!state) {
    // Agent registration was rejected - still return success to not block hooks
    res.status(200).json({ success: true, rejected: true });
    return;
  }

  // Handle agent-stop events (from Cursor stop hook)
  if (type === 'agent-stop') {
    if (status) {
      state.status = status;
      state.statusTimestamp = now;
      state.isThinking = false;
      console.log(`[${new Date().toISOString()}] AGENT-STOP: ${state.displayName} status=${status}`);
    }
    wsManager.broadcast('thinking', getAgentStatesArray());
    res.status(200).json({ success: true });
    return;
  }

  state.isThinking = type === 'thinking-start';
  // Use server time (Date.now()), not hook timestamp which can be stale
  state.lastActivity = now;

  // Update current command on BOTH events:
  // - thinking-end (PreToolUse): tool is STARTING - set command so we show it during execution
  // - thinking-start (PostToolUse): tool has COMPLETED - update to show what just finished
  if (toolName) {
    state.currentCommand = toolName;
  }

  // Update tool input for display in bubble
  if (toolInput) {
    state.toolInput = toolInput;
  } else if (type === 'thinking-start') {
    // Clear tool input when tool completes
    state.toolInput = undefined;
  }

  // Update agent type if provided (persists for agent lifetime)
  if (agentType) {
    state.agentType = agentType;
    // Update display name to include agent type: "Claude Code Plan 1" instead of "Claude Code 1"
    const sourceName = state.source === 'claude' ? 'Claude Code' :
                       state.source === 'cursor' ? 'Cursor' : 'Agent';
    const typeLabel = agentType.charAt(0).toUpperCase() + agentType.slice(1);
    const num = state.displayName.match(/\d+$/)?.[0] || '1';
    state.displayName = `${sourceName} ${typeLabel} ${num}`;
  }

  // Update model if provided (Cursor provides this, persists for agent lifetime)
  if (model && !state.model) {
    state.model = model;
    console.log(`[${new Date().toISOString()}] Agent ${state.displayName} using model: ${model}`);
  }

  // Update duration if provided (from afterShellExecution, afterMCPExecution)
  if (duration !== undefined && duration !== null) {
    state.lastDuration = duration;
  }

  // Clear status after activity resumes (agent is working again)
  if (state.status && type === 'thinking-end') {
    state.status = undefined;
    state.statusTimestamp = undefined;
  }

  // Track pending tool execution for permission prompt detection
  if (type === 'thinking-end') {
    // PreToolUse - tool is starting, track when it started
    state.pendingToolStart = now;
    // Immediately set waitingForInput for AskUserQuestion (user must answer)
    if (toolName === 'AskUserQuestion') {
      state.waitingForInput = true;
      console.log(`[${new Date().toISOString()}] Agent ${state.displayName} waiting for user input (AskUserQuestion)`);
    }
  } else if (type === 'thinking-start') {
    // PostToolUse - tool completed, clear pending state
    state.pendingToolStart = undefined;
    state.waitingForInput = false;
  }

  const durationStr = duration ? ` (${duration}ms)` : '';
  console.log(`[${new Date().toISOString()}] ${type.toUpperCase()}: ${state.displayName} ${toolName ? `(${toolName})` : ''}${toolInput ? ` [${toolInput}]` : ''}${durationStr}`);

  // Broadcast all agent states to connected clients
  wsManager.broadcast('thinking', getAgentStatesArray());

  res.status(200).json({ success: true });
});

// Get all agent thinking states
app.get('/api/thinking', (_req, res) => {
  res.json(getAgentStatesArray());
});

// Get current graph state
app.get('/api/graph', (_req, res) => {
  res.json(activityStore.getGraphData());
});

// Get hot folders based on git history + live activity
app.get('/api/hot-folders', async (req, res) => {
  const limit = parseInt(req.query.limit as string) || 50;
  try {
    // Get git-based hot folders
    const hotFolders = await getHotFolders(PROJECT_ROOT, limit);

    // Get recently active files from live activity (last 10 minutes)
    const recentlyActive = activityStore.getRecentlyActiveFiles(10 * 60 * 1000);

    // Merge live activity into hot folders - prioritize recent files
    for (const folder of hotFolders) {
      const liveFiles = recentlyActive.get(folder.folder);
      if (liveFiles && liveFiles.length > 0) {
        // Prepend live files, remove duplicates, keep max 8
        const merged = [...liveFiles];
        for (const file of folder.recentFiles) {
          if (!merged.includes(file)) {
            merged.push(file);
          }
        }
        folder.recentFiles = merged.slice(0, 8);
      }
    }

    // Also add any folders with live activity that aren't in git history
    for (const [folderPath, files] of recentlyActive) {
      if (!hotFolders.find(f => f.folder === folderPath)) {
        hotFolders.push({
          folder: folderPath,
          score: files.length * 10, // Give live folders a decent score
          recentFiles: files.slice(0, 8)
        });
      }
    }

    // Re-sort by score (git activity + boost for live activity)
    hotFolders.sort((a, b) => b.score - a.score);

    res.json(hotFolders.slice(0, limit));
  } catch (error) {
    console.error('Error getting hot folders:', error);
    res.status(500).json({ error: 'Failed to get hot folders' });
  }
});

// Health check
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    clients: wsManager.getClientCount(),
    projectRoot: PROJECT_ROOT
  });
});

// Debug endpoint - comprehensive system state for troubleshooting
app.get('/api/debug', (_req, res) => {
  const now = Date.now();
  res.json({
    server: {
      uptime: Math.floor((now - SERVER_START_TIME) / 1000),
      uptimeFormatted: `${Math.floor((now - SERVER_START_TIME) / 60000)}m ${Math.floor(((now - SERVER_START_TIME) % 60000) / 1000)}s`,
      projectRoot: PROJECT_ROOT,
      wsClients: wsManager.getClientCount(),
    },
    agents: Array.from(agentStates.values()).map(agent => ({
      ...agent,
      agentId: agent.agentId.slice(0, 8) + '...', // Truncate for readability
      lastActivityAgo: `${Math.floor((now - agent.lastActivity) / 1000)}s ago`,
      willTimeoutIn: `${Math.floor((AGENT_TIMEOUT_MS - (now - agent.lastActivity)) / 1000)}s`,
    })),
    agentCount: agentStates.size,
    maxAgents: MAX_AGENTS,
    recentActivity: recentActivityBuffer.slice(-20).map(a => ({
      ...a,
      agentId: a.agentId ? a.agentId.slice(0, 8) + '...' : undefined,
      ago: `${Math.floor((now - a.timestamp) / 1000)}s ago`,
    })),
    config: {
      agentTimeoutMs: AGENT_TIMEOUT_MS,
      agentCreationCooldownMs: AGENT_CREATION_COOLDOWN_MS,
    }
  });
});

// Clear graph
app.post('/api/clear', (_req, res) => {
  activityStore.clear();
  wsManager.broadcast('graph', activityStore.getGraphData());
  res.json({ success: true });
});

// Handle git commit notification - refresh layout for all clients
app.post('/api/git-commit', async (_req, res) => {
  console.log(`[${new Date().toISOString()}] Git commit detected - refreshing layout`);

  // Clear the git activity cache to force fresh data
  clearGitCache(PROJECT_ROOT);

  // Fetch updated hot folders
  try {
    const hotFolders = await getHotFolders(PROJECT_ROOT, 50);

    // Broadcast layout update to all connected clients
    wsManager.broadcast('layout-update', { hotFolders, timestamp: Date.now() });

    res.json({ success: true, foldersUpdated: hotFolders.length });
  } catch (error) {
    console.error('Failed to refresh layout after git commit:', error);
    res.status(500).json({ error: 'Failed to refresh layout' });
  }
});

// Serve client build in production (Express serves everything from one port)
const clientDist = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../client/dist');
if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));
  // Catch-all for React Router (/, /hotel)
  app.get('*', (_req, res) => {
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

// Load persisted state before starting server
loadAgentState();

server.listen(PORT, () => {
  console.log(`
  CodeMap Server
  ==============
  HTTP:      http://localhost:${PORT}
  WebSocket: ws://localhost:${PORT}/ws
  Project:   ${PROJECT_ROOT}
  Agents:    ${agentStates.size} restored
  `);
});
