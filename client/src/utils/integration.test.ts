/**
 * Mission-Critical Integration Tests
 *
 * These tests verify the core data flow that makes CodeMap Hotel work:
 * Hook Event → Server → Client → Visualization
 *
 * If any of these tests fail, the visualization is broken.
 */

import { describe, it, expect } from 'vitest';
import { findMatchingFileId, extractFilename } from './screen-flash';
import {
  findFilePositionWithFallback,
  shouldRemoveAgent,
  isValidAgentId,
  moveTowardsTarget,
  getSpawnPositionAtFile,
} from './agent-movement';

/**
 * CRITICAL TEST SUITE 1: File Path Resolution
 *
 * The server sends relative paths, the client has relative file IDs.
 * These must match correctly for screens to light up and agents to move.
 */
describe('CRITICAL: File Path Resolution', () => {
  // Simulates the real file structure of a typical project
  const projectFileIds = [
    'client/src/index.ts',
    'client/src/App.tsx',
    'client/src/components/HabboRoom.tsx',
    'client/src/utils/screen-flash.ts',
    'server/src/index.ts',
    'server/src/activity-store.ts',
    'hooks/file-activity-hook.sh',
    'hooks/thinking-hook.sh',
    './package.json',
    './README.md',
  ];

  describe('Same-named files in different directories', () => {
    it('MUST distinguish client/src/index.ts from server/src/index.ts', () => {
      // This is the bug that was reported - agent went to wrong index.ts
      expect(findMatchingFileId('client/src/index.ts', projectFileIds))
        .toBe('client/src/index.ts');
      expect(findMatchingFileId('server/src/index.ts', projectFileIds))
        .toBe('server/src/index.ts');
    });

    it('MUST match exact path before falling back to filename', () => {
      // Server sends "server/src/index.ts", must not match "client/src/index.ts"
      const result = findMatchingFileId('server/src/index.ts', projectFileIds);
      expect(result).not.toBe('client/src/index.ts');
      expect(result).toBe('server/src/index.ts');
    });
  });

  describe('Root-level files', () => {
    it('MUST match root files with ./ prefix', () => {
      expect(findMatchingFileId('package.json', projectFileIds)).toBe('./package.json');
      expect(findMatchingFileId('README.md', projectFileIds)).toBe('./README.md');
    });
  });

  describe('Hook script files', () => {
    it('MUST match hook scripts correctly', () => {
      expect(findMatchingFileId('hooks/file-activity-hook.sh', projectFileIds))
        .toBe('hooks/file-activity-hook.sh');
    });
  });

  describe('Deeply nested files', () => {
    it('MUST match deeply nested component files', () => {
      expect(findMatchingFileId('client/src/components/HabboRoom.tsx', projectFileIds))
        .toBe('client/src/components/HabboRoom.tsx');
    });
  });
});

/**
 * CRITICAL TEST SUITE 2: Agent Movement to Correct File
 *
 * When an activity event comes in, the agent must move to the correct desk.
 */
describe('CRITICAL: Agent Movement to Correct File', () => {
  // Simulates file positions as they would be in the visualization
  const filePositions = new Map([
    ['client/src/index.ts', { x: 100, y: 100 }],
    ['client/src/App.tsx', { x: 150, y: 100 }],
    ['server/src/index.ts', { x: 300, y: 100 }],
    ['server/src/activity-store.ts', { x: 350, y: 100 }],
    ['client/src', { x: 125, y: 150 }],  // Folder position
    ['server/src', { x: 325, y: 150 }],  // Folder position
    ['client', { x: 125, y: 200 }],
    ['server', { x: 325, y: 200 }],
    ['.', { x: 200, y: 250 }],  // Root
  ]);

  it('MUST find exact file position when file exists', () => {
    const pos = findFilePositionWithFallback('client/src/index.ts', filePositions);
    expect(pos).toEqual({ x: 100, y: 100 });
  });

  it('MUST distinguish same-named files in different folders', () => {
    const clientPos = findFilePositionWithFallback('client/src/index.ts', filePositions);
    const serverPos = findFilePositionWithFallback('server/src/index.ts', filePositions);

    expect(clientPos).not.toEqual(serverPos);
    expect(clientPos).toEqual({ x: 100, y: 100 });
    expect(serverPos).toEqual({ x: 300, y: 100 });
  });

  it('MUST fall back to parent folder when file not in layout', () => {
    // New file not in positions, should fall back to folder
    const pos = findFilePositionWithFallback('client/src/NewFile.tsx', filePositions);
    expect(pos).toEqual({ x: 125, y: 150 }); // client/src folder
  });

  it('MUST fall back to root when no parent matches', () => {
    const pos = findFilePositionWithFallback('unknown/path/file.ts', filePositions);
    expect(pos).toEqual({ x: 200, y: 250 }); // Root
  });
});

/**
 * CRITICAL TEST SUITE 3: Agent Lifecycle
 *
 * Agents must persist through brief disconnects but be removed after timeout.
 */
describe('CRITICAL: Agent Lifecycle', () => {
  const GRACE_PERIOD = 30000; // 30 seconds

  describe('Agent persistence during active session', () => {
    it('MUST NOT remove agent seen 1 second ago', () => {
      const now = 100000;
      const lastSeen = 99000; // 1 second ago
      expect(shouldRemoveAgent(lastSeen, now, GRACE_PERIOD)).toBe(false);
    });

    it('MUST NOT remove agent seen 29 seconds ago', () => {
      const now = 100000;
      const lastSeen = 71000; // 29 seconds ago
      expect(shouldRemoveAgent(lastSeen, now, GRACE_PERIOD)).toBe(false);
    });

    it('MUST NOT remove agent at exactly 30 seconds', () => {
      const now = 100000;
      const lastSeen = 70000; // exactly 30 seconds ago
      expect(shouldRemoveAgent(lastSeen, now, GRACE_PERIOD)).toBe(false);
    });
  });

  describe('Agent removal after timeout', () => {
    it('MUST remove agent after grace period expires', () => {
      const now = 100000;
      const lastSeen = 69999; // 30.001 seconds ago
      expect(shouldRemoveAgent(lastSeen, now, GRACE_PERIOD)).toBe(true);
    });

    it('MUST remove agent long after session ends', () => {
      const now = 100000;
      const lastSeen = 0; // Very old
      expect(shouldRemoveAgent(lastSeen, now, GRACE_PERIOD)).toBe(true);
    });
  });
});

/**
 * CRITICAL TEST SUITE 4: Agent ID Validation
 *
 * Only valid Claude/Cursor session IDs should create agents.
 * Invalid IDs could create ghost agents or security issues.
 */
describe('CRITICAL: Agent ID Validation', () => {
  describe('Valid session IDs', () => {
    it('MUST accept standard UUID format', () => {
      expect(isValidAgentId('a1b2c3d4-e5f6-7890-abcd-ef1234567890')).toBe(true);
    });

    it('MUST accept Claude session ID format', () => {
      // Claude uses UUID format
      expect(isValidAgentId('01234567-89ab-cdef-0123-456789abcdef')).toBe(true);
    });
  });

  describe('Invalid/malicious IDs', () => {
    it('MUST reject empty string', () => {
      expect(isValidAgentId('')).toBe(false);
    });

    it('MUST reject null-like strings', () => {
      expect(isValidAgentId('null')).toBe(false);
      expect(isValidAgentId('undefined')).toBe(false);
    });

    it('MUST reject all-zeros (invalid session)', () => {
      expect(isValidAgentId('00000000')).toBe(false);
    });

    it('MUST reject short garbage strings', () => {
      expect(isValidAgentId('abc')).toBe(false);
      expect(isValidAgentId('x')).toBe(false);
    });

    it('MUST reject strings with invalid characters', () => {
      expect(isValidAgentId('agent_with_underscores')).toBe(false);
      expect(isValidAgentId('has spaces in it')).toBe(false);
      expect(isValidAgentId('<script>alert(1)</script>')).toBe(false);
    });
  });
});

/**
 * CRITICAL TEST SUITE 5: Agent Movement Physics
 *
 * Agents must move smoothly and reach their targets.
 */
describe('CRITICAL: Agent Movement Physics', () => {
  const SPEED = 6;

  it('MUST move towards target', () => {
    const result = moveTowardsTarget(0, 0, 100, 0, SPEED);
    expect(result.x).toBeGreaterThan(0);
    expect(result.isMoving).toBe(true);
  });

  it('MUST stop when reaching target', () => {
    const result = moveTowardsTarget(99.9, 99.9, 100, 100, SPEED, 0.5);
    expect(result.isMoving).toBe(false);
    expect(result.x).toBe(100);
    expect(result.y).toBe(100);
  });

  it('MUST not overshoot target', () => {
    // Agent is 2 pixels away, speed is 6 - should not go past target
    const result = moveTowardsTarget(98, 0, 100, 0, SPEED);
    expect(result.x).toBeLessThanOrEqual(100);
  });

  it('MUST handle negative movement', () => {
    const result = moveTowardsTarget(100, 0, 0, 0, SPEED);
    expect(result.x).toBeLessThan(100);
  });
});

/**
 * CRITICAL TEST SUITE 6: Screen Flash File Matching End-to-End
 *
 * Simulates the full flow: activity event path → matched file ID → correct screen
 */
describe('CRITICAL: Screen Flash End-to-End Flow', () => {
  // These are the file IDs as they appear in the room layout
  const roomFileIds = [
    'client/src/components/HabboRoom.tsx',
    'client/src/hooks/useFileActivity.ts',
    'server/src/index.ts',
    'server/src/activity-store.ts',
  ];

  describe('Server sends relative path (after toRelativePath conversion)', () => {
    it('reading HabboRoom.tsx lights up correct screen', () => {
      // Server converts absolute path to relative before sending
      const serverPath = 'client/src/components/HabboRoom.tsx';
      const matchedId = findMatchingFileId(serverPath, roomFileIds);
      expect(matchedId).toBe('client/src/components/HabboRoom.tsx');
    });

    it('reading server/src/index.ts lights up server room, not client room', () => {
      const serverPath = 'server/src/index.ts';
      const matchedId = findMatchingFileId(serverPath, roomFileIds);
      expect(matchedId).toBe('server/src/index.ts');
      expect(matchedId).not.toContain('client');
    });
  });

  describe('Filename extraction for fallback matching', () => {
    it('extracts filename from relative path', () => {
      expect(extractFilename('client/src/components/HabboRoom.tsx')).toBe('HabboRoom.tsx');
    });

    it('extracts filename from absolute path', () => {
      expect(extractFilename('/home/user/project/client/src/App.tsx')).toBe('App.tsx');
    });

    it('handles edge cases', () => {
      expect(extractFilename('')).toBe('');
      expect(extractFilename('single-file.ts')).toBe('single-file.ts');
    });
  });
});

/**
 * CRITICAL TEST SUITE 7: Agent Spawn Position
 *
 * Agents must spawn at correct positions relative to files/desks.
 */
describe('CRITICAL: Agent Spawn Position', () => {
  it('MUST spawn agent near file desk', () => {
    const filePos = { x: 200, y: 300 };
    const spawnPos = getSpawnPositionAtFile(filePos, 0);

    // Should be near the file position
    expect(Math.abs(spawnPos.x - filePos.x)).toBeLessThan(50);
    expect(Math.abs(spawnPos.y - filePos.y)).toBeLessThan(50);
  });

  it('MUST offset multiple agents at same file', () => {
    const filePos = { x: 200, y: 300 };
    const spawn0 = getSpawnPositionAtFile(filePos, 0);
    const spawn1 = getSpawnPositionAtFile(filePos, 1);
    const spawn2 = getSpawnPositionAtFile(filePos, 2);

    // Each agent should have different position
    expect(spawn0.x).not.toBe(spawn1.x);
    expect(spawn1.x).not.toBe(spawn2.x);
  });
});

/**
 * CRITICAL TEST SUITE 8: Activity Feed Entry Creation
 *
 * Activity entries must be created correctly from events.
 */
describe('CRITICAL: Activity Feed Entry Creation', () => {
  // Simulates the entry creation logic from useFileActivity
  function createActivityEntry(
    event: { type: string; filePath: string; agentId?: string; timestamp?: number },
    agents: Array<{ agentId: string; displayName: string }>,
    idCounter: number
  ) {
    // Only process -end events
    if (!event.type.endsWith('-end')) {
      return null;
    }

    const agent = agents.find(a => a.agentId === event.agentId);
    const agentName = agent?.displayName || 'Unknown';
    const fileName = event.filePath.split('/').pop() || event.filePath;

    return {
      id: idCounter,
      type: event.type.startsWith('read') ? 'read' as const : 'write' as const,
      filePath: event.filePath,
      fileName,
      agentName,
      timestamp: event.timestamp || Date.now(),
    };
  }

  describe('Event filtering', () => {
    it('MUST only create entries for -end events', () => {
      const agents = [{ agentId: 'abc123', displayName: 'Claude 1' }];

      const readStart = createActivityEntry(
        { type: 'read-start', filePath: 'test.ts', agentId: 'abc123' },
        agents, 1
      );
      expect(readStart).toBeNull();

      const readEnd = createActivityEntry(
        { type: 'read-end', filePath: 'test.ts', agentId: 'abc123' },
        agents, 1
      );
      expect(readEnd).not.toBeNull();
    });

    it('MUST correctly identify read vs write events', () => {
      const agents = [{ agentId: 'abc123', displayName: 'Claude 1' }];

      const readEntry = createActivityEntry(
        { type: 'read-end', filePath: 'test.ts', agentId: 'abc123' },
        agents, 1
      );
      expect(readEntry?.type).toBe('read');

      const writeEntry = createActivityEntry(
        { type: 'write-end', filePath: 'test.ts', agentId: 'abc123' },
        agents, 1
      );
      expect(writeEntry?.type).toBe('write');
    });
  });

  describe('Agent name resolution', () => {
    it('MUST resolve agent display name from agents list', () => {
      const agents = [
        { agentId: 'agent-1', displayName: 'Claude 1' },
        { agentId: 'agent-2', displayName: 'Cursor 1' },
      ];

      const entry = createActivityEntry(
        { type: 'read-end', filePath: 'test.ts', agentId: 'agent-2' },
        agents, 1
      );
      expect(entry?.agentName).toBe('Cursor 1');
    });

    it('MUST fall back to "Unknown" for unregistered agent', () => {
      const agents = [{ agentId: 'known-agent', displayName: 'Claude 1' }];

      const entry = createActivityEntry(
        { type: 'read-end', filePath: 'test.ts', agentId: 'unknown-agent' },
        agents, 1
      );
      expect(entry?.agentName).toBe('Unknown');
    });

    it('MUST handle missing agentId', () => {
      const agents = [{ agentId: 'agent-1', displayName: 'Claude 1' }];

      const entry = createActivityEntry(
        { type: 'read-end', filePath: 'test.ts' },
        agents, 1
      );
      expect(entry?.agentName).toBe('Unknown');
    });
  });

  describe('Filename extraction', () => {
    it('MUST extract filename from path', () => {
      const agents: Array<{ agentId: string; displayName: string }> = [];

      const entry = createActivityEntry(
        { type: 'write-end', filePath: 'client/src/components/HabboRoom.tsx' },
        agents, 1
      );
      expect(entry?.fileName).toBe('HabboRoom.tsx');
    });

    it('MUST handle root-level files', () => {
      const agents: Array<{ agentId: string; displayName: string }> = [];

      const entry = createActivityEntry(
        { type: 'read-end', filePath: 'package.json' },
        agents, 1
      );
      expect(entry?.fileName).toBe('package.json');
    });
  });
});
