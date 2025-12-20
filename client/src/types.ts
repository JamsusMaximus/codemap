// File activity event from Claude Code hooks
export interface FileActivityEvent {
  type: 'read-start' | 'read-end' | 'write-start' | 'write-end' | 'search-start' | 'search-end';
  filePath: string;  // For search: this is the search pattern (glob or regex)
  agentId?: string;  // Which agent triggered this activity
  timestamp: number;
}

export interface ThinkingEvent {
  type: 'thinking-start' | 'thinking-end';
  agentId: string;
  timestamp: number;
}

export interface AgentThinkingState {
  agentId: string;
  isThinking: boolean;
  lastActivity: number;
  displayName: string;
  currentCommand?: string;  // Current tool/command being executed
  waitingForInput?: boolean;  // True when agent is waiting for user input
}

export interface GraphNode {
  id: string;
  name: string;
  isFolder: boolean;
  depth: number;
  lastActivity?: {
    type: 'read' | 'write' | 'search';
    timestamp: number;
  };
  activeOperation?: 'read' | 'write' | 'search';
  activityCount: {
    reads: number;
    writes: number;
    searches: number;
  };
}

export interface GraphLink {
  source: string;
  target: string;
}

export interface GraphData {
  nodes: GraphNode[];
  links: GraphLink[];
}

export interface ForceGraphNode extends GraphNode {
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
  fx?: number | null;
  fy?: number | null;
}

export interface ForceGraphLink {
  source: string | ForceGraphNode;
  target: string | ForceGraphNode;
}

// Hot folders from git activity API
export interface FolderScore {
  folder: string;
  score: number;
  recentFiles: string[];
}
