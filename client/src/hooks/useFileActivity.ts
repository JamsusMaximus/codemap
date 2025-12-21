import { useEffect, useRef, useCallback, MutableRefObject } from 'react';
import { GraphData, FileActivityEvent, AgentThinkingState } from '../types';

const WS_URL = 'ws://localhost:5174/ws';
const API_URL = 'http://localhost:5174/api';
const MAX_ACTIVITY_HISTORY = 50;

export type ConnectionStatus = 'connected' | 'connecting' | 'disconnected';

// Enriched activity entry with display info for the feed
export interface ActivityFeedEntry {
  id: number;
  type: 'read' | 'write';
  filePath: string;
  fileName: string;
  agentName: string;
  timestamp: number;
}

// Ref-based hook that NEVER triggers React re-renders
// All data is stored in refs and read directly by the animation loop
export function useFileActivity(): {
  graphDataRef: MutableRefObject<GraphData>;
  recentActivityRef: MutableRefObject<FileActivityEvent | null>;
  thinkingAgentsRef: MutableRefObject<AgentThinkingState[]>;
  activityHistoryRef: MutableRefObject<ActivityFeedEntry[]>;
  activityVersionRef: MutableRefObject<number>;
  thinkingVersionRef: MutableRefObject<number>;
  layoutVersionRef: MutableRefObject<number>;
  connectionStatusRef: MutableRefObject<ConnectionStatus>;
  clearGraph: () => void;
} {
  const graphDataRef = useRef<GraphData>({ nodes: [], links: [] });
  const recentActivityRef = useRef<FileActivityEvent | null>(null);
  const thinkingAgentsRef = useRef<AgentThinkingState[]>([]);
  const activityHistoryRef = useRef<ActivityFeedEntry[]>([]);
  const activityIdCounterRef = useRef(0);
  // Version counters to detect changes without re-rendering
  const activityVersionRef = useRef(0);
  const thinkingVersionRef = useRef(0);
  const layoutVersionRef = useRef(0);
  // Connection status for UI indicator
  const connectionStatusRef = useRef<ConnectionStatus>('connecting');

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<number>();

  const connect = useCallback(() => {
    connectionStatusRef.current = 'connecting';

    // Fetch initial graph state
    fetch(`${API_URL}/graph`)
      .then(res => res.json())
      .then(data => {
        graphDataRef.current = data;
      })
      .catch(console.error);

    // Fetch initial thinking agents state
    fetch(`${API_URL}/thinking`)
      .then(res => res.json())
      .then((data: AgentThinkingState[]) => {
        thinkingAgentsRef.current = data;
        thinkingVersionRef.current++;
      })
      .catch(console.error);

    // Establish WebSocket connection
    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('WebSocket connected');
      connectionStatusRef.current = 'connected';
    };

    ws.onclose = () => {
      console.log('WebSocket disconnected');
      connectionStatusRef.current = 'disconnected';
      // Reconnect after 2 seconds
      reconnectTimeoutRef.current = window.setTimeout(connect, 2000);
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      connectionStatusRef.current = 'disconnected';
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        if (message.type === 'graph') {
          graphDataRef.current = message.data;
        } else if (message.type === 'activity') {
          const event = message.data as FileActivityEvent;
          recentActivityRef.current = event;
          activityVersionRef.current++;

          // Only log end events to avoid duplicates (start+end for same action)
          if (event.type.endsWith('-end')) {
            // Find agent display name
            const agent = thinkingAgentsRef.current.find(a => a.agentId === event.agentId);
            const agentName = agent?.displayName || 'Unknown';

            // Extract filename from path
            const fileName = event.filePath.split('/').pop() || event.filePath;

            // Add to history
            const entry: ActivityFeedEntry = {
              id: activityIdCounterRef.current++,
              type: event.type.startsWith('read') ? 'read' : 'write',
              filePath: event.filePath,
              fileName,
              agentName,
              timestamp: event.timestamp || Date.now(),
            };

            activityHistoryRef.current = [
              entry,
              ...activityHistoryRef.current.slice(0, MAX_ACTIVITY_HISTORY - 1)
            ];
          }
        } else if (message.type === 'thinking') {
          thinkingAgentsRef.current = message.data as AgentThinkingState[];
          thinkingVersionRef.current++;
        } else if (message.type === 'layout-update') {
          // Git commit triggered a layout refresh
          console.log('Layout update received from server');
          layoutVersionRef.current++;
        }
      } catch (err) {
        console.error('Failed to parse message:', err);
      }
    };
  }, []);

  useEffect(() => {
    connect();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [connect]);

  const clearGraph = useCallback(() => {
    fetch(`${API_URL}/clear`, { method: 'POST' })
      .catch(console.error);
  }, []);

  return {
    graphDataRef,
    recentActivityRef,
    thinkingAgentsRef,
    activityHistoryRef,
    activityVersionRef,
    thinkingVersionRef,
    layoutVersionRef,
    connectionStatusRef,
    clearGraph
  };
}
