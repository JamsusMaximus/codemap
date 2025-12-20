/**
 * Activity Store Tests
 *
 * Tests the core file tree tracking and activity counting logic.
 * The ActivityStore is responsible for:
 * - Maintaining an in-memory file tree
 * - Tracking read/write activity counts
 * - Providing graph data for visualization
 */

import { describe, it, expect, beforeEach } from 'vitest';
import path from 'path';

// We test the logic without filesystem dependencies
// by simulating the core algorithms

interface MockNode {
  id: string;
  name: string;
  isFolder: boolean;
  depth: number;
  activityCount: { reads: number; writes: number; searches: number };
  activeOperation?: 'read' | 'write';
  lastActivity?: { type: string; timestamp: number };
}

interface MockGraphData {
  nodes: MockNode[];
  links: { source: string; target: string }[];
}

/**
 * Simulates ActivityStore.addActivity logic
 */
function addActivity(
  nodes: Map<string, MockNode>,
  projectRoot: string,
  event: { filePath: string; type: string; timestamp: number }
): MockGraphData {
  // Search events return current state
  if (event.type.startsWith('search')) {
    return getGraphData(nodes, projectRoot);
  }

  const relativePath = path.relative(projectRoot, event.filePath);

  // Skip files outside project root
  if (relativePath.startsWith('..')) {
    return getGraphData(nodes, projectRoot);
  }

  const parts = relativePath.split(path.sep);

  // Ensure all parent folders exist as nodes
  let currentPath = projectRoot;
  for (let i = 0; i < parts.length; i++) {
    currentPath = path.join(currentPath, parts[i]);
    const isFile = i === parts.length - 1;

    if (!nodes.has(currentPath)) {
      nodes.set(currentPath, {
        id: currentPath,
        name: parts[i],
        isFolder: !isFile,
        depth: i,
        activityCount: { reads: 0, writes: 0, searches: 0 }
      });
    }

    if (isFile) {
      const node = nodes.get(currentPath)!;
      const baseType = event.type.startsWith('read') ? 'read' : 'write';
      const isStart = event.type.endsWith('-start');

      if (isStart) {
        node.activeOperation = baseType;
        node.lastActivity = { type: baseType, timestamp: event.timestamp };
      } else {
        node.activeOperation = undefined;
        if (baseType === 'read') {
          node.activityCount.reads++;
        } else {
          node.activityCount.writes++;
        }
      }
    }
  }

  return getGraphData(nodes, projectRoot);
}

function getGraphData(nodes: Map<string, MockNode>, projectRoot: string): MockGraphData {
  const nodeArray = Array.from(nodes.values());
  const links: { source: string; target: string }[] = [];

  for (const node of nodeArray) {
    if (node.id !== projectRoot) {
      const parentPath = path.dirname(node.id);
      if (nodes.has(parentPath)) {
        links.push({ source: node.id, target: parentPath });
      }
    }
  }

  return { nodes: nodeArray, links };
}

describe('ActivityStore: Node Management', () => {
  let nodes: Map<string, MockNode>;
  const PROJECT_ROOT = '/home/user/project';

  beforeEach(() => {
    nodes = new Map();
    // Initialize with root node
    nodes.set(PROJECT_ROOT, {
      id: PROJECT_ROOT,
      name: 'project',
      isFolder: true,
      depth: -1,
      activityCount: { reads: 0, writes: 0, searches: 0 }
    });
  });

  it('creates parent folders when adding deeply nested file', () => {
    addActivity(nodes, PROJECT_ROOT, {
      filePath: '/home/user/project/src/components/Button.tsx',
      type: 'read-start',
      timestamp: Date.now()
    });

    expect(nodes.has('/home/user/project/src')).toBe(true);
    expect(nodes.has('/home/user/project/src/components')).toBe(true);
    expect(nodes.has('/home/user/project/src/components/Button.tsx')).toBe(true);

    const srcNode = nodes.get('/home/user/project/src')!;
    expect(srcNode.isFolder).toBe(true);
    expect(srcNode.depth).toBe(0);

    const componentsNode = nodes.get('/home/user/project/src/components')!;
    expect(componentsNode.isFolder).toBe(true);
    expect(componentsNode.depth).toBe(1);

    const buttonNode = nodes.get('/home/user/project/src/components/Button.tsx')!;
    expect(buttonNode.isFolder).toBe(false);
    expect(buttonNode.depth).toBe(2);
  });

  it('ignores files outside project root', () => {
    const initialCount = nodes.size;

    addActivity(nodes, PROJECT_ROOT, {
      filePath: '/tmp/other/file.ts',
      type: 'read-start',
      timestamp: Date.now()
    });

    expect(nodes.size).toBe(initialCount);
  });

  it('reuses existing nodes on repeated access', () => {
    addActivity(nodes, PROJECT_ROOT, {
      filePath: '/home/user/project/src/index.ts',
      type: 'read-start',
      timestamp: Date.now()
    });

    const initialSize = nodes.size;

    addActivity(nodes, PROJECT_ROOT, {
      filePath: '/home/user/project/src/index.ts',
      type: 'read-end',
      timestamp: Date.now()
    });

    expect(nodes.size).toBe(initialSize);
  });
});

describe('ActivityStore: Activity Tracking', () => {
  let nodes: Map<string, MockNode>;
  const PROJECT_ROOT = '/home/user/project';

  beforeEach(() => {
    nodes = new Map();
    nodes.set(PROJECT_ROOT, {
      id: PROJECT_ROOT,
      name: 'project',
      isFolder: true,
      depth: -1,
      activityCount: { reads: 0, writes: 0, searches: 0 }
    });
  });

  it('marks node as active during read-start', () => {
    addActivity(nodes, PROJECT_ROOT, {
      filePath: '/home/user/project/src/file.ts',
      type: 'read-start',
      timestamp: Date.now()
    });

    const node = nodes.get('/home/user/project/src/file.ts')!;
    expect(node.activeOperation).toBe('read');
  });

  it('clears active state and increments count on read-end', () => {
    addActivity(nodes, PROJECT_ROOT, {
      filePath: '/home/user/project/src/file.ts',
      type: 'read-start',
      timestamp: Date.now()
    });

    addActivity(nodes, PROJECT_ROOT, {
      filePath: '/home/user/project/src/file.ts',
      type: 'read-end',
      timestamp: Date.now()
    });

    const node = nodes.get('/home/user/project/src/file.ts')!;
    expect(node.activeOperation).toBeUndefined();
    expect(node.activityCount.reads).toBe(1);
  });

  it('tracks write operations separately', () => {
    addActivity(nodes, PROJECT_ROOT, {
      filePath: '/home/user/project/src/file.ts',
      type: 'write-start',
      timestamp: Date.now()
    });

    addActivity(nodes, PROJECT_ROOT, {
      filePath: '/home/user/project/src/file.ts',
      type: 'write-end',
      timestamp: Date.now()
    });

    const node = nodes.get('/home/user/project/src/file.ts')!;
    expect(node.activityCount.writes).toBe(1);
    expect(node.activityCount.reads).toBe(0);
  });

  it('accumulates multiple operations', () => {
    for (let i = 0; i < 5; i++) {
      addActivity(nodes, PROJECT_ROOT, {
        filePath: '/home/user/project/src/file.ts',
        type: 'read-start',
        timestamp: Date.now()
      });
      addActivity(nodes, PROJECT_ROOT, {
        filePath: '/home/user/project/src/file.ts',
        type: 'read-end',
        timestamp: Date.now()
      });
    }

    for (let i = 0; i < 3; i++) {
      addActivity(nodes, PROJECT_ROOT, {
        filePath: '/home/user/project/src/file.ts',
        type: 'write-start',
        timestamp: Date.now()
      });
      addActivity(nodes, PROJECT_ROOT, {
        filePath: '/home/user/project/src/file.ts',
        type: 'write-end',
        timestamp: Date.now()
      });
    }

    const node = nodes.get('/home/user/project/src/file.ts')!;
    expect(node.activityCount.reads).toBe(5);
    expect(node.activityCount.writes).toBe(3);
  });

  it('records lastActivity timestamp', () => {
    const timestamp = 1234567890;

    addActivity(nodes, PROJECT_ROOT, {
      filePath: '/home/user/project/src/file.ts',
      type: 'read-start',
      timestamp
    });

    const node = nodes.get('/home/user/project/src/file.ts')!;
    expect(node.lastActivity?.timestamp).toBe(timestamp);
    expect(node.lastActivity?.type).toBe('read');
  });

  it('ignores search events', () => {
    const initialCount = nodes.size;

    addActivity(nodes, PROJECT_ROOT, {
      filePath: '*.ts',
      type: 'search-start',
      timestamp: Date.now()
    });

    expect(nodes.size).toBe(initialCount);
  });
});

describe('ActivityStore: Graph Data Generation', () => {
  let nodes: Map<string, MockNode>;
  const PROJECT_ROOT = '/home/user/project';

  beforeEach(() => {
    nodes = new Map();
    nodes.set(PROJECT_ROOT, {
      id: PROJECT_ROOT,
      name: 'project',
      isFolder: true,
      depth: -1,
      activityCount: { reads: 0, writes: 0, searches: 0 }
    });
  });

  it('creates links from children to parents', () => {
    addActivity(nodes, PROJECT_ROOT, {
      filePath: '/home/user/project/src/file.ts',
      type: 'read-end',
      timestamp: Date.now()
    });

    const graph = getGraphData(nodes, PROJECT_ROOT);

    // Should have links: file -> src, src -> project
    expect(graph.links).toHaveLength(2);

    const fileLink = graph.links.find(l => l.source === '/home/user/project/src/file.ts');
    expect(fileLink?.target).toBe('/home/user/project/src');

    const srcLink = graph.links.find(l => l.source === '/home/user/project/src');
    expect(srcLink?.target).toBe('/home/user/project');
  });

  it('includes all nodes in graph data', () => {
    addActivity(nodes, PROJECT_ROOT, {
      filePath: '/home/user/project/a/b/c.ts',
      type: 'read-end',
      timestamp: Date.now()
    });

    const graph = getGraphData(nodes, PROJECT_ROOT);

    // Root + a + b + c.ts = 4 nodes
    expect(graph.nodes).toHaveLength(4);
  });

  it('root node has no outgoing links', () => {
    addActivity(nodes, PROJECT_ROOT, {
      filePath: '/home/user/project/file.ts',
      type: 'read-end',
      timestamp: Date.now()
    });

    const graph = getGraphData(nodes, PROJECT_ROOT);

    const rootLink = graph.links.find(l => l.source === PROJECT_ROOT);
    expect(rootLink).toBeUndefined();
  });
});

describe('ActivityStore: Recently Active Files', () => {
  it('filters files by timestamp', () => {
    const nodes = new Map<string, MockNode>();
    const PROJECT_ROOT = '/home/user/project';
    const now = Date.now();

    nodes.set(PROJECT_ROOT, {
      id: PROJECT_ROOT,
      name: 'project',
      isFolder: true,
      depth: -1,
      activityCount: { reads: 0, writes: 0, searches: 0 }
    });

    // Recent file
    nodes.set('/home/user/project/recent.ts', {
      id: '/home/user/project/recent.ts',
      name: 'recent.ts',
      isFolder: false,
      depth: 0,
      activityCount: { reads: 1, writes: 0, searches: 0 },
      lastActivity: { type: 'read', timestamp: now - 1000 } // 1 second ago
    });

    // Old file
    nodes.set('/home/user/project/old.ts', {
      id: '/home/user/project/old.ts',
      name: 'old.ts',
      isFolder: false,
      depth: 0,
      activityCount: { reads: 1, writes: 0, searches: 0 },
      lastActivity: { type: 'read', timestamp: now - 20 * 60 * 1000 } // 20 minutes ago
    });

    // Simulate getRecentlyActiveFiles with 10 minute window
    const maxAgeMs = 10 * 60 * 1000;
    const recentFiles: string[] = [];

    for (const node of nodes.values()) {
      if (!node.isFolder && node.lastActivity) {
        if (now - node.lastActivity.timestamp < maxAgeMs) {
          recentFiles.push(node.name);
        }
      }
    }

    expect(recentFiles).toContain('recent.ts');
    expect(recentFiles).not.toContain('old.ts');
  });
});
