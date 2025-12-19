// Agent source - which tool the agent is from
export type AgentSource = 'claude' | 'cursor' | 'unknown';

// Types for file activity tracking
export interface FileActivityEvent {
  type: 'read-start' | 'read-end' | 'write-start' | 'write-end';
  filePath: string;
  agentId?: string;  // Which agent triggered this activity
  source?: AgentSource;  // Which tool (claude/cursor)
  timestamp: number;
}

export interface ThinkingEvent {
  type: 'thinking-start' | 'thinking-end';
  agentId: string;
  source?: AgentSource;  // Which tool (claude/cursor)
  timestamp: number;
  toolName?: string;  // Current tool being used (e.g., "Read", "Edit", "Bash")
}

export interface AgentThinkingState {
  agentId: string;
  source: AgentSource;  // Which tool this agent is from
  isThinking: boolean;
  lastActivity: number;
  displayName: string;
  currentCommand?: string;  // Current tool/command being executed
  waitingForInput?: boolean;  // True when agent is waiting for user input (AskUserQuestion only)
}

export interface GraphNode {
  id: string;
  name: string;
  isFolder: boolean;
  depth: number;
  lastActivity?: {
    type: 'read' | 'write';
    timestamp: number;
  };
  activeOperation?: 'read' | 'write';  // Currently active operation
  activityCount: {
    reads: number;
    writes: number;
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
