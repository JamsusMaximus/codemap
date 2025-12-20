import { describe, it, expect, beforeEach } from 'vitest';

// Test the path conversion logic
describe('toRelativePath', () => {
  // Use a generic test path that works on any machine
  const PROJECT_ROOT = '/home/user/myproject';

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

  it('converts absolute path to relative', () => {
    expect(toRelativePath('/home/user/myproject/client/src/App.tsx'))
      .toBe('client/src/App.tsx');
  });

  it('converts nested folder path', () => {
    expect(toRelativePath('/home/user/myproject/server/src/index.ts'))
      .toBe('server/src/index.ts');
  });

  it('returns "." for project root itself', () => {
    expect(toRelativePath('/home/user/myproject')).toBe('.');
    expect(toRelativePath('/home/user/myproject/')).toBe('.');
  });

  it('leaves paths outside project root unchanged', () => {
    expect(toRelativePath('/tmp/some-file.txt')).toBe('/tmp/some-file.txt');
    expect(toRelativePath('/other/project/file.ts'))
      .toBe('/other/project/file.ts');
  });

  it('handles paths with similar prefixes correctly', () => {
    // Edge case: path starts similarly but is different project
    expect(toRelativePath('/home/user/myproject-other/file.ts'))
      .toBe('/home/user/myproject-other/file.ts');
  });

  it('handles single file in root', () => {
    expect(toRelativePath('/home/user/myproject/package.json'))
      .toBe('package.json');
  });
});

// Test agent ID validation
describe('isValidAgentId', () => {
  function isValidAgentId(id: string): boolean {
    if (!id || typeof id !== 'string') return false;
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(id);
  }

  it('accepts valid UUIDs', () => {
    expect(isValidAgentId('a7982537-1234-5678-9abc-def012345678')).toBe(true);
    expect(isValidAgentId('f40e4487-abcd-ef12-3456-7890abcdef12')).toBe(true);
  });

  it('accepts UUIDs with uppercase letters', () => {
    expect(isValidAgentId('A7982537-1234-5678-9ABC-DEF012345678')).toBe(true);
  });

  it('rejects empty strings', () => {
    expect(isValidAgentId('')).toBe(false);
  });

  it('rejects null/undefined', () => {
    expect(isValidAgentId(null as unknown as string)).toBe(false);
    expect(isValidAgentId(undefined as unknown as string)).toBe(false);
  });

  it('rejects non-UUID strings', () => {
    expect(isValidAgentId('not-a-uuid')).toBe(false);
    expect(isValidAgentId('12345')).toBe(false);
    expect(isValidAgentId('agent-1')).toBe(false);
  });

  it('rejects UUIDs with wrong format', () => {
    expect(isValidAgentId('a7982537123456789abcdef012345678')).toBe(false); // no dashes
    expect(isValidAgentId('a7982537-1234-5678-9abc')).toBe(false); // too short
    expect(isValidAgentId('a7982537-1234-5678-9abc-def012345678-extra')).toBe(false); // too long
  });

  it('rejects UUIDs with invalid characters', () => {
    expect(isValidAgentId('g7982537-1234-5678-9abc-def012345678')).toBe(false); // 'g' not valid
    expect(isValidAgentId('a7982537-1234-5678-9abc-def01234567!')).toBe(false); // '!' not valid
  });
});

// Test agent naming by source
describe('Agent naming by source', () => {
  interface AgentThinkingState {
    agentId: string;
    source: 'claude' | 'cursor' | 'unknown';
    displayName: string;
    isThinking: boolean;
    lastActivity: number;
  }

  let agentStates: Map<string, AgentThinkingState>;
  let agentCounterBySource: Record<string, number>;

  function registerAgent(
    agentId: string,
    timestamp: number,
    eventSource: string,
    agentSource: 'claude' | 'cursor' | 'unknown' = 'unknown'
  ): AgentThinkingState | null {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!agentId || !uuidRegex.test(agentId)) {
      return null;
    }

    let state = agentStates.get(agentId);
    if (state) {
      return state;
    }

    if (agentStates.size >= 10) {
      return null;
    }

    agentCounterBySource[agentSource]++;
    const sourceName = agentSource === 'claude' ? 'Claude' :
                       agentSource === 'cursor' ? 'Cursor' : 'Agent';
    const displayName = `${sourceName} ${agentCounterBySource[agentSource]}`;

    state = {
      agentId,
      source: agentSource,
      isThinking: false,
      lastActivity: timestamp,
      displayName,
    };
    agentStates.set(agentId, state);
    return state;
  }

  beforeEach(() => {
    agentStates = new Map();
    agentCounterBySource = { claude: 0, cursor: 0, unknown: 0 };
  });

  it('names Claude agents as "Claude 1", "Claude 2", etc.', () => {
    const agent1 = registerAgent('a7982537-1234-5678-9abc-def012345678', Date.now(), 'thinking', 'claude');
    const agent2 = registerAgent('b7982537-1234-5678-9abc-def012345678', Date.now(), 'thinking', 'claude');

    expect(agent1?.displayName).toBe('Claude 1');
    expect(agent2?.displayName).toBe('Claude 2');
  });

  it('names Cursor agents as "Cursor 1", "Cursor 2", etc.', () => {
    const agent1 = registerAgent('c7982537-1234-5678-9abc-def012345678', Date.now(), 'thinking', 'cursor');
    const agent2 = registerAgent('d7982537-1234-5678-9abc-def012345678', Date.now(), 'thinking', 'cursor');

    expect(agent1?.displayName).toBe('Cursor 1');
    expect(agent2?.displayName).toBe('Cursor 2');
  });

  it('names unknown agents as "Agent 1", "Agent 2", etc.', () => {
    const agent1 = registerAgent('e7982537-1234-5678-9abc-def012345678', Date.now(), 'thinking', 'unknown');
    const agent2 = registerAgent('f7982537-1234-5678-9abc-def012345678', Date.now(), 'thinking', 'unknown');

    expect(agent1?.displayName).toBe('Agent 1');
    expect(agent2?.displayName).toBe('Agent 2');
  });

  it('maintains separate counters per source', () => {
    const claude1 = registerAgent('a1982537-1234-5678-9abc-def012345678', Date.now(), 'thinking', 'claude');
    const cursor1 = registerAgent('b1982537-1234-5678-9abc-def012345678', Date.now(), 'thinking', 'cursor');
    const claude2 = registerAgent('c1982537-1234-5678-9abc-def012345678', Date.now(), 'thinking', 'claude');

    expect(claude1?.displayName).toBe('Claude 1');
    expect(cursor1?.displayName).toBe('Cursor 1');
    expect(claude2?.displayName).toBe('Claude 2');
  });

  it('returns existing agent on duplicate registration', () => {
    const agentId = 'a7982537-1234-5678-9abc-def012345678';
    const agent1 = registerAgent(agentId, Date.now(), 'thinking', 'claude');
    const agent2 = registerAgent(agentId, Date.now(), 'activity', 'claude');

    expect(agent1).toBe(agent2);
    expect(agent1?.displayName).toBe('Claude 1');
    expect(agentStates.size).toBe(1);
  });

  it('rejects agents when at max capacity', () => {
    // Fill up to max
    for (let i = 0; i < 10; i++) {
      const id = `a${i}982537-1234-5678-9abc-def012345678`;
      registerAgent(id, Date.now(), 'thinking', 'claude');
    }

    expect(agentStates.size).toBe(10);

    // Try to add one more
    const rejected = registerAgent('b0982537-1234-5678-9abc-def012345678', Date.now(), 'thinking', 'claude');
    expect(rejected).toBeNull();
    expect(agentStates.size).toBe(10);
  });

  it('rejects invalid agent IDs', () => {
    expect(registerAgent('', Date.now(), 'thinking', 'claude')).toBeNull();
    expect(registerAgent('invalid-id', Date.now(), 'thinking', 'claude')).toBeNull();
    expect(registerAgent('12345', Date.now(), 'thinking', 'claude')).toBeNull();
  });
});

// Test folder name extraction for room activity
describe('Folder name extraction', () => {
  function extractFolderName(filePath: string): string | null {
    const pathParts = filePath.split('/');
    if (pathParts.length >= 2) {
      return pathParts[pathParts.length - 2];
    }
    return null;
  }

  it('extracts folder name from relative path', () => {
    expect(extractFolderName('client/src/components/HabboRoom.tsx')).toBe('components');
  });

  it('extracts folder name from absolute path', () => {
    expect(extractFolderName('/home/user/project/server/src/index.ts')).toBe('src');
  });

  it('returns null for root-level files', () => {
    expect(extractFolderName('package.json')).toBeNull();
  });

  it('handles deeply nested paths', () => {
    expect(extractFolderName('a/b/c/d/e/file.ts')).toBe('e');
  });
});

// Test file position matching logic
describe('File position matching', () => {
  function findFilePosition(
    filePath: string,
    positions: Map<string, { x: number; y: number }>
  ): { x: number; y: number } | undefined {
    // Try exact file path first
    let pos = positions.get(filePath);
    if (pos) return pos;

    // Try parent folders
    const pathParts = filePath.split('/');
    pathParts.pop(); // Remove filename
    while (pathParts.length > 0 && !pos) {
      const folderPath = pathParts.join('/') || '.';
      pos = positions.get(folderPath);
      if (!pos) pathParts.pop();
    }

    // Try root folder
    if (!pos) pos = positions.get('.');
    return pos;
  }

  it('matches exact file path', () => {
    const positions = new Map([
      ['client/src/components/HabboRoom.tsx', { x: 100, y: 200 }],
    ]);
    expect(findFilePosition('client/src/components/HabboRoom.tsx', positions))
      .toEqual({ x: 100, y: 200 });
  });

  it('matches parent folder when file not found', () => {
    const positions = new Map([
      ['client/src/components', { x: 100, y: 200 }],
    ]);
    expect(findFilePosition('client/src/components/NewFile.tsx', positions))
      .toEqual({ x: 100, y: 200 });
  });

  it('walks up to find matching ancestor folder', () => {
    const positions = new Map([
      ['client', { x: 50, y: 100 }],
    ]);
    expect(findFilePosition('client/src/components/deep/File.tsx', positions))
      .toEqual({ x: 50, y: 100 });
  });

  it('falls back to root folder', () => {
    const positions = new Map([
      ['.', { x: 0, y: 0 }],
    ]);
    expect(findFilePosition('unknown/path/file.ts', positions))
      .toEqual({ x: 0, y: 0 });
  });

  it('returns undefined when no match found', () => {
    const positions = new Map<string, { x: number; y: number }>();
    expect(findFilePosition('unknown/path/file.ts', positions))
      .toBeUndefined();
  });
});
