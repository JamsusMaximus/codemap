import express from 'express';
import cors from 'cors';
import path from 'path';
import { createServer } from 'http';
import { WebSocketManager } from './websocket.js';
import { ActivityStore } from './activity-store.js';
import { FileActivityEvent, ThinkingEvent, AgentThinkingState } from './types.js';

const PORT = 5174; // Fixed port - never change

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
let agentCounter = 0;
const AGENT_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes

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
setInterval(() => {
  if (agentStates.size > 0) {
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

  // CRITICAL: Also register agent from file activity events
  // This ensures agents are tracked even if thinking events are missed
  if (event.agentId) {
    let state = agentStates.get(event.agentId);
    if (!state) {
      agentCounter++;
      state = {
        agentId: event.agentId,
        isThinking: false,
        lastActivity: event.timestamp,
        displayName: `Agent ${agentCounter}`,
        currentCommand: event.type.startsWith('read') ? 'Read' : 'Write'
      };
      agentStates.set(event.agentId, state);
      console.log(`[${new Date().toISOString()}] New agent registered from activity: ${state.displayName} (${event.agentId})`);
    }

    // Always update last activity timestamp to keep agent alive
    state.lastActivity = event.timestamp;

    // Update current command and thinking state based on activity type
    if (event.type.endsWith('-start')) {
      state.currentCommand = event.type.startsWith('read') ? 'Read' : 'Write';
      state.isThinking = true;
    } else if (event.type.endsWith('-end')) {
      // Keep command visible but mark as not actively thinking
      state.isThinking = false;
    }

    // Always broadcast agent state on activity to keep client in sync
    wsManager.broadcast('thinking', getAgentStatesArray());
  }

  const graphData = activityStore.addActivity(event);

  // Broadcast to all connected clients
  wsManager.broadcast('activity', event);
  wsManager.broadcast('graph', graphData);

  res.status(200).json({ success: true });
});

// Receive thinking events
app.post('/api/thinking', (req, res) => {
  const event: ThinkingEvent = req.body;
  const { agentId, type, timestamp, toolName } = event;

  // Register new agent or update existing
  let state = agentStates.get(agentId);
  if (!state) {
    agentCounter++;
    state = {
      agentId,
      isThinking: false,
      lastActivity: timestamp,
      displayName: `Agent ${agentCounter}`,
      currentCommand: undefined
    };
    agentStates.set(agentId, state);
    console.log(`[${new Date().toISOString()}] New agent registered: ${state.displayName} (${agentId})`);
  }

  state.isThinking = type === 'thinking-start';
  state.lastActivity = timestamp;

  // Update current command on BOTH events:
  // - thinking-end (PreToolUse): tool is STARTING - set command so we show it during execution
  // - thinking-start (PostToolUse): tool has COMPLETED - update to show what just finished
  if (toolName) {
    state.currentCommand = toolName;
  }

  // Set waitingForInput when AskUserQuestion starts (thinking-end = PreToolUse = tool starting)
  // Clear it when any tool completes (thinking-start = PostToolUse = tool finished)
  if (type === 'thinking-end' && toolName === 'AskUserQuestion') {
    state.waitingForInput = true;
    console.log(`[${new Date().toISOString()}] Agent ${state.displayName} waiting for user input`);
  } else if (type === 'thinking-start') {
    state.waitingForInput = false;
  }

  console.log(`[${new Date().toISOString()}] ${type.toUpperCase()}: ${state.displayName} ${toolName ? `(${toolName})` : ''}`);

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

// Health check
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    clients: wsManager.getClientCount(),
    projectRoot: PROJECT_ROOT
  });
});

// Clear graph
app.post('/api/clear', (_req, res) => {
  activityStore.clear();
  wsManager.broadcast('graph', activityStore.getGraphData());
  res.json({ success: true });
});

server.listen(PORT, () => {
  console.log(`
  CodeMap Server
  ==============
  HTTP:      http://localhost:${PORT}
  WebSocket: ws://localhost:${PORT}/ws
  Project:   ${PROJECT_ROOT}
  `);
});
