// Types for file activity tracking
export interface FileActivityEvent {
  type: 'read-start' | 'read-end' | 'write-start' | 'write-end';
  filePath: string;
  agentId?: string;  // Which agent triggered this activity
  timestamp: number;
}

export interface ThinkingEvent {
  type: 'thinking-start' | 'thinking-end';
  agentId: string;
  timestamp: number;
  toolName?: string;  // Current tool being used (e.g., "Read", "Edit", "Bash")
}

export interface AgentThinkingState {
  agentId: string;
  isThinking: boolean;
  lastActivity: number;
  displayName: string;
  currentCommand?: string;  // Current tool/command being executed
  waitingForInput?: boolean;  // True when agent is waiting for user input (e.g., AskUserQuestion)
  pendingToolStart?: number;  // Timestamp when tool started (for detecting permission waits)
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
