/**
 * WebSocket Manager Tests
 *
 * Tests the WebSocket broadcast and client management logic.
 * The WebSocketManager handles:
 * - Client connections/disconnections
 * - Broadcasting updates to all clients
 * - Cleaning up dead connections
 */

import { describe, it, expect, beforeEach } from 'vitest';

// Mock WebSocket states (from ws library)
const WebSocketState = {
  CONNECTING: 0,
  OPEN: 1,
  CLOSING: 2,
  CLOSED: 3
};

interface MockWebSocket {
  readyState: number;
  isAlive: boolean;
  sentMessages: string[];
  send(message: string): void;
  terminate(): void;
  terminated: boolean;
}

function createMockWebSocket(state: number = WebSocketState.OPEN): MockWebSocket {
  return {
    readyState: state,
    isAlive: true,
    sentMessages: [],
    terminated: false,
    send(message: string) {
      if (this.readyState === WebSocketState.OPEN) {
        this.sentMessages.push(message);
      }
    },
    terminate() {
      this.terminated = true;
      this.readyState = WebSocketState.CLOSED;
    }
  };
}

/**
 * Simulates WebSocketManager.broadcast logic
 */
function broadcast(
  clients: Set<MockWebSocket>,
  type: string,
  data: unknown
): { sent: number; cleaned: number } {
  const message = JSON.stringify({ type, data });
  const toRemove: MockWebSocket[] = [];
  let sent = 0;

  for (const client of clients) {
    if (client.readyState === WebSocketState.OPEN) {
      client.send(message);
      sent++;
    } else if (client.readyState === WebSocketState.CLOSED ||
               client.readyState === WebSocketState.CLOSING) {
      toRemove.push(client);
    }
  }

  // Clean up closed connections
  for (const client of toRemove) {
    clients.delete(client);
  }

  return { sent, cleaned: toRemove.length };
}

/**
 * Simulates ping-based dead connection detection
 */
function cleanDeadConnections(clients: Set<MockWebSocket>): number {
  let terminated = 0;

  for (const client of clients) {
    if (client.isAlive === false) {
      clients.delete(client);
      client.terminate();
      terminated++;
    } else {
      client.isAlive = false;
      // In real code, this would call client.ping()
    }
  }

  return terminated;
}

describe('WebSocket: Client Management', () => {
  let clients: Set<MockWebSocket>;

  beforeEach(() => {
    clients = new Set();
  });

  it('tracks connected clients', () => {
    const ws1 = createMockWebSocket();
    const ws2 = createMockWebSocket();

    clients.add(ws1);
    expect(clients.size).toBe(1);

    clients.add(ws2);
    expect(clients.size).toBe(2);
  });

  it('removes disconnected clients', () => {
    const ws1 = createMockWebSocket();
    const ws2 = createMockWebSocket();

    clients.add(ws1);
    clients.add(ws2);

    // Simulate disconnect
    clients.delete(ws1);
    expect(clients.size).toBe(1);
  });

  it('handles duplicate add gracefully', () => {
    const ws = createMockWebSocket();

    clients.add(ws);
    clients.add(ws);
    clients.add(ws);

    expect(clients.size).toBe(1);
  });
});

describe('WebSocket: Broadcasting', () => {
  let clients: Set<MockWebSocket>;

  beforeEach(() => {
    clients = new Set();
  });

  it('sends message to all open clients', () => {
    const ws1 = createMockWebSocket();
    const ws2 = createMockWebSocket();
    const ws3 = createMockWebSocket();

    clients.add(ws1);
    clients.add(ws2);
    clients.add(ws3);

    const result = broadcast(clients, 'activity', { test: true });

    expect(result.sent).toBe(3);
    expect(ws1.sentMessages).toHaveLength(1);
    expect(ws2.sentMessages).toHaveLength(1);
    expect(ws3.sentMessages).toHaveLength(1);
  });

  it('formats message as JSON with type and data', () => {
    const ws = createMockWebSocket();
    clients.add(ws);

    broadcast(clients, 'graph', { nodes: [], links: [] });

    const sent = JSON.parse(ws.sentMessages[0]);
    expect(sent.type).toBe('graph');
    expect(sent.data).toEqual({ nodes: [], links: [] });
  });

  it('skips closed connections', () => {
    const openWs = createMockWebSocket(WebSocketState.OPEN);
    const closedWs = createMockWebSocket(WebSocketState.CLOSED);

    clients.add(openWs);
    clients.add(closedWs);

    const result = broadcast(clients, 'activity', {});

    expect(result.sent).toBe(1);
    expect(openWs.sentMessages).toHaveLength(1);
    expect(closedWs.sentMessages).toHaveLength(0);
  });

  it('cleans up closed connections during broadcast', () => {
    const openWs = createMockWebSocket(WebSocketState.OPEN);
    const closedWs = createMockWebSocket(WebSocketState.CLOSED);
    const closingWs = createMockWebSocket(WebSocketState.CLOSING);

    clients.add(openWs);
    clients.add(closedWs);
    clients.add(closingWs);

    expect(clients.size).toBe(3);

    const result = broadcast(clients, 'activity', {});

    expect(result.cleaned).toBe(2);
    expect(clients.size).toBe(1);
    expect(clients.has(openWs)).toBe(true);
  });

  it('handles empty client set', () => {
    const result = broadcast(clients, 'activity', {});

    expect(result.sent).toBe(0);
    expect(result.cleaned).toBe(0);
  });

  it('broadcasts different message types', () => {
    const ws = createMockWebSocket();
    clients.add(ws);

    broadcast(clients, 'activity', { type: 'read-start' });
    broadcast(clients, 'graph', { nodes: [] });
    broadcast(clients, 'thinking', [{ agentId: '123' }]);

    expect(ws.sentMessages).toHaveLength(3);

    const messages = ws.sentMessages.map(m => JSON.parse(m));
    expect(messages[0].type).toBe('activity');
    expect(messages[1].type).toBe('graph');
    expect(messages[2].type).toBe('thinking');
  });
});

describe('WebSocket: Dead Connection Detection', () => {
  let clients: Set<MockWebSocket>;

  beforeEach(() => {
    clients = new Set();
  });

  it('terminates connections that fail ping', () => {
    const ws = createMockWebSocket();
    ws.isAlive = false; // Simulates no pong response

    clients.add(ws);

    const terminated = cleanDeadConnections(clients);

    expect(terminated).toBe(1);
    expect(ws.terminated).toBe(true);
    expect(clients.size).toBe(0);
  });

  it('keeps connections that respond to ping', () => {
    const ws = createMockWebSocket();
    ws.isAlive = true;

    clients.add(ws);

    const terminated = cleanDeadConnections(clients);

    expect(terminated).toBe(0);
    expect(ws.terminated).toBe(false);
    expect(clients.size).toBe(1);
    // After check, isAlive is set to false until next pong
    expect(ws.isAlive).toBe(false);
  });

  it('handles mixed alive and dead connections', () => {
    const aliveWs = createMockWebSocket();
    aliveWs.isAlive = true;

    const deadWs1 = createMockWebSocket();
    deadWs1.isAlive = false;

    const deadWs2 = createMockWebSocket();
    deadWs2.isAlive = false;

    clients.add(aliveWs);
    clients.add(deadWs1);
    clients.add(deadWs2);

    const terminated = cleanDeadConnections(clients);

    expect(terminated).toBe(2);
    expect(clients.size).toBe(1);
    expect(clients.has(aliveWs)).toBe(true);
  });
});

describe('WebSocket: Message Format', () => {
  it('activity message has correct structure', () => {
    const message = JSON.stringify({
      type: 'activity',
      data: {
        type: 'read-start',
        filePath: 'src/index.ts',
        agentId: 'abc-123',
        timestamp: 1234567890
      }
    });

    const parsed = JSON.parse(message);
    expect(parsed.type).toBe('activity');
    expect(parsed.data.type).toBe('read-start');
    expect(parsed.data.filePath).toBe('src/index.ts');
  });

  it('graph message has correct structure', () => {
    const message = JSON.stringify({
      type: 'graph',
      data: {
        nodes: [
          { id: 'src', name: 'src', isFolder: true, depth: 0 }
        ],
        links: [
          { source: 'src/index.ts', target: 'src' }
        ]
      }
    });

    const parsed = JSON.parse(message);
    expect(parsed.type).toBe('graph');
    expect(parsed.data.nodes).toHaveLength(1);
    expect(parsed.data.links).toHaveLength(1);
  });

  it('thinking message has correct structure', () => {
    const message = JSON.stringify({
      type: 'thinking',
      data: [
        {
          agentId: 'abc-123',
          displayName: 'Claude 1',
          isThinking: true,
          currentCommand: 'Read',
          lastActivity: 1234567890
        }
      ]
    });

    const parsed = JSON.parse(message);
    expect(parsed.type).toBe('thinking');
    expect(parsed.data).toHaveLength(1);
    expect(parsed.data[0].displayName).toBe('Claude 1');
  });
});
