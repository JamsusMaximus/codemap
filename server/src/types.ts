/**
 * Shared TypeScript Types
 *
 * These types are used across the server for:
 * - Activity events from hooks (file read/write)
 * - Thinking events from hooks (agent state)
 * - Graph data for visualization (file tree)
 *
 * The client has its own copy of these types.
 */

/** Agent source - which tool the agent is from */
export type AgentSource = 'claude' | 'cursor' | 'unknown';

/**
 * File activity event from file-activity-hook.sh
 * Tracks when an agent reads or writes a file
 */
export interface FileActivityEvent {
  type: 'read-start' | 'read-end' | 'write-start' | 'write-end' | 'search-start' | 'search-end';
  filePath: string;  // For search: this is the search pattern (glob or regex)
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
  waitingForInput?: boolean;  // True when agent is waiting for user input
  pendingToolStart?: number;  // Timestamp when tool started (for detecting stuck permission prompts)
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
  activeOperation?: 'read' | 'write' | 'search';  // Currently active operation
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

/** Layout update data - sent when git commit triggers a layout refresh */
export interface LayoutUpdateData {
  hotFolders: Array<{
    folder: string;
    score: number;
    recentFiles: string[];
  }>;
  timestamp: number;
}
