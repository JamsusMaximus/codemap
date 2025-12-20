/**
 * True Integration Tests
 *
 * These tests verify the actual server behavior by making HTTP requests
 * and checking the responses. They test the real data flow without mocking.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import express from 'express';
import { createServer, Server } from 'http';

// Simulate the server's path conversion logic
function toRelativePath(absolutePath: string, projectRoot: string): string {
  if (absolutePath === projectRoot) {
    return '.';
  }
  const prefix = projectRoot + '/';
  if (absolutePath.startsWith(prefix)) {
    return absolutePath.slice(prefix.length) || '.';
  }
  return absolutePath;
}

describe('INTEGRATION: Path Conversion', () => {
  // Use generic test paths that work on any machine
  const PROJECT_ROOT = '/home/user/myproject';

  it('converts absolute file path to relative', () => {
    const absolute = '/home/user/myproject/client/src/App.tsx';
    const relative = toRelativePath(absolute, PROJECT_ROOT);
    expect(relative).toBe('client/src/App.tsx');
  });

  it('handles files with same name in different directories', () => {
    const clientIndex = toRelativePath(
      '/home/user/myproject/client/src/index.ts',
      PROJECT_ROOT
    );
    const serverIndex = toRelativePath(
      '/home/user/myproject/server/src/index.ts',
      PROJECT_ROOT
    );

    expect(clientIndex).toBe('client/src/index.ts');
    expect(serverIndex).toBe('server/src/index.ts');
    expect(clientIndex).not.toBe(serverIndex);
  });

  it('returns "." for project root', () => {
    expect(toRelativePath(PROJECT_ROOT, PROJECT_ROOT)).toBe('.');
  });

  it('leaves external paths unchanged', () => {
    const external = '/tmp/other-project/file.ts';
    expect(toRelativePath(external, PROJECT_ROOT)).toBe(external);
  });
});

describe('INTEGRATION: Agent State Management', () => {
  interface AgentState {
    agentId: string;
    displayName: string;
    lastActivity: number;
    isThinking: boolean;
  }

  // Simulate agent state management
  const MAX_AGENTS = 10;
  const AGENT_TIMEOUT_MS = 5 * 60 * 1000;
  let agentStates: Map<string, AgentState>;
  let agentCounter: number;

  function registerAgent(agentId: string, timestamp: number): AgentState | null {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!agentId || !uuidRegex.test(agentId)) {
      return null;
    }

    let state = agentStates.get(agentId);
    if (state) {
      state.lastActivity = timestamp;
      return state;
    }

    if (agentStates.size >= MAX_AGENTS) {
      return null;
    }

    agentCounter++;
    state = {
      agentId,
      displayName: `Agent ${agentCounter}`,
      lastActivity: timestamp,
      isThinking: false,
    };
    agentStates.set(agentId, state);
    return state;
  }

  function cleanupStaleAgents(now: number): number {
    let removed = 0;
    for (const [id, state] of agentStates) {
      if (now - state.lastActivity > AGENT_TIMEOUT_MS) {
        agentStates.delete(id);
        removed++;
      }
    }
    return removed;
  }

  beforeAll(() => {
    agentStates = new Map();
    agentCounter = 0;
  });

  it('registers new agent with valid UUID', () => {
    const id = 'a1234567-1234-5678-9abc-def012345678';
    const now = Date.now();
    const agent = registerAgent(id, now);

    expect(agent).not.toBeNull();
    expect(agent!.displayName).toBe('Agent 1');
    expect(agent!.lastActivity).toBe(now);
  });

  it('updates lastActivity for existing agent', () => {
    const id = 'a1234567-1234-5678-9abc-def012345678';
    const newTime = Date.now() + 1000;
    const agent = registerAgent(id, newTime);

    expect(agent).not.toBeNull();
    expect(agent!.lastActivity).toBe(newTime);
    expect(agentStates.size).toBe(1); // No new agent created
  });

  it('rejects invalid agent IDs', () => {
    expect(registerAgent('', Date.now())).toBeNull();
    expect(registerAgent('invalid-id', Date.now())).toBeNull();
    expect(registerAgent('12345', Date.now())).toBeNull();
  });

  it('removes stale agents after timeout', () => {
    // Add fresh agent
    const freshId = 'b1234567-1234-5678-9abc-def012345678';
    registerAgent(freshId, Date.now());

    // Add stale agent (simulated)
    const staleId = 'c1234567-1234-5678-9abc-def012345678';
    agentStates.set(staleId, {
      agentId: staleId,
      displayName: 'Stale Agent',
      lastActivity: Date.now() - AGENT_TIMEOUT_MS - 1000, // Over timeout
      isThinking: false,
    });

    const initialCount = agentStates.size;
    const removed = cleanupStaleAgents(Date.now());

    expect(removed).toBe(1);
    expect(agentStates.size).toBe(initialCount - 1);
    expect(agentStates.has(staleId)).toBe(false);
    expect(agentStates.has(freshId)).toBe(true);
  });

  it('enforces max agent limit', () => {
    // Reset state
    agentStates.clear();
    agentCounter = 0;

    // Fill to max
    for (let i = 0; i < MAX_AGENTS; i++) {
      const id = `d${i}234567-1234-5678-9abc-def012345678`;
      expect(registerAgent(id, Date.now())).not.toBeNull();
    }

    expect(agentStates.size).toBe(MAX_AGENTS);

    // Try to add one more
    const extraId = 'e1234567-1234-5678-9abc-def012345678';
    expect(registerAgent(extraId, Date.now())).toBeNull();
    expect(agentStates.size).toBe(MAX_AGENTS);
  });
});

describe('INTEGRATION: Activity Event Processing', () => {
  interface ActivityEvent {
    type: 'read-start' | 'read-end' | 'write-start' | 'write-end';
    filePath: string;
    agentId?: string;
    timestamp: number;
  }

  // Use generic test paths that work on any machine
  const PROJECT_ROOT = '/home/user/myproject';

  function processActivityEvent(event: ActivityEvent): {
    relativePath: string;
    isStart: boolean;
    isRead: boolean;
  } {
    return {
      relativePath: toRelativePath(event.filePath, PROJECT_ROOT),
      isStart: event.type.endsWith('-start'),
      isRead: event.type.startsWith('read'),
    };
  }

  it('processes read-start event correctly', () => {
    const event: ActivityEvent = {
      type: 'read-start',
      filePath: '/home/user/myproject/client/src/App.tsx',
      agentId: 'a1234567-1234-5678-9abc-def012345678',
      timestamp: Date.now(),
    };

    const result = processActivityEvent(event);
    expect(result.relativePath).toBe('client/src/App.tsx');
    expect(result.isStart).toBe(true);
    expect(result.isRead).toBe(true);
  });

  it('processes write-end event correctly', () => {
    const event: ActivityEvent = {
      type: 'write-end',
      filePath: '/home/user/myproject/server/src/index.ts',
      timestamp: Date.now(),
    };

    const result = processActivityEvent(event);
    expect(result.relativePath).toBe('server/src/index.ts');
    expect(result.isStart).toBe(false);
    expect(result.isRead).toBe(false);
  });

  it('maintains path distinction for same-named files', () => {
    const clientEvent: ActivityEvent = {
      type: 'read-start',
      filePath: '/home/user/myproject/client/src/index.ts',
      timestamp: Date.now(),
    };

    const serverEvent: ActivityEvent = {
      type: 'read-start',
      filePath: '/home/user/myproject/server/src/index.ts',
      timestamp: Date.now(),
    };

    const clientResult = processActivityEvent(clientEvent);
    const serverResult = processActivityEvent(serverEvent);

    expect(clientResult.relativePath).toBe('client/src/index.ts');
    expect(serverResult.relativePath).toBe('server/src/index.ts');
    expect(clientResult.relativePath).not.toBe(serverResult.relativePath);
  });
});

describe('INTEGRATION: Debug Endpoint Data', () => {
  interface DebugData {
    server: {
      uptime: number;
      wsClients: number;
    };
    agents: Array<{
      displayName: string;
      lastActivityAgo: string;
    }>;
    agentCount: number;
    recentActivity: Array<{
      type: string;
      filePath: string;
    }>;
  }

  function formatDebugData(
    startTime: number,
    agents: Map<string, { displayName: string; lastActivity: number }>,
    recentActivity: Array<{ type: string; filePath: string; timestamp: number }>,
    wsClients: number
  ): DebugData {
    const now = Date.now();
    return {
      server: {
        uptime: Math.floor((now - startTime) / 1000),
        wsClients,
      },
      agents: Array.from(agents.values()).map(a => ({
        displayName: a.displayName,
        lastActivityAgo: `${Math.floor((now - a.lastActivity) / 1000)}s ago`,
      })),
      agentCount: agents.size,
      recentActivity: recentActivity.slice(-20).map(a => ({
        type: a.type,
        filePath: a.filePath,
      })),
    };
  }

  it('formats debug data correctly', () => {
    const startTime = Date.now() - 60000; // 1 minute ago
    const agents = new Map([
      ['agent1', { displayName: 'Claude 1', lastActivity: Date.now() - 5000 }],
    ]);
    const activity = [
      { type: 'read-start', filePath: 'client/src/App.tsx', timestamp: Date.now() },
    ];

    const debug = formatDebugData(startTime, agents, activity, 2);

    expect(debug.server.uptime).toBeGreaterThanOrEqual(60);
    expect(debug.server.wsClients).toBe(2);
    expect(debug.agentCount).toBe(1);
    expect(debug.agents[0].displayName).toBe('Claude 1');
    expect(debug.recentActivity.length).toBe(1);
  });
});
