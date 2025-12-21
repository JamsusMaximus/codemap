// WebSocket manager for real-time client communication
import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';
import { GraphData, FileActivityEvent, AgentThinkingState, LayoutUpdateData } from './types.js';

interface ExtendedWebSocket extends WebSocket {
  isAlive?: boolean;
}

export class WebSocketManager {
  private wss: WebSocketServer;
  private clients: Set<ExtendedWebSocket> = new Set();
  private pingInterval: ReturnType<typeof setInterval>;

  constructor(server: Server) {
    this.wss = new WebSocketServer({ server, path: '/ws' });

    this.wss.on('connection', (ws: ExtendedWebSocket) => {
      ws.isAlive = true;
      this.clients.add(ws);
      console.log(`Client connected. Total: ${this.clients.size}`);

      ws.on('pong', () => {
        ws.isAlive = true;
      });

      ws.on('close', () => {
        this.clients.delete(ws);
        console.log(`Client disconnected. Total: ${this.clients.size}`);
      });

      ws.on('error', (err) => {
        console.error('WebSocket error:', err);
        this.clients.delete(ws);
      });
    });

    // Ping clients every 30 seconds to detect dead connections
    this.pingInterval = setInterval(() => {
      this.clients.forEach((ws) => {
        if (ws.isAlive === false) {
          console.log('Terminating dead connection');
          this.clients.delete(ws);
          return ws.terminate();
        }
        ws.isAlive = false;
        ws.ping();
      });
    }, 30000);
  }

  broadcast(type: string, data: GraphData | FileActivityEvent | AgentThinkingState[] | LayoutUpdateData): void {
    const message = JSON.stringify({ type, data });
    const toRemove: ExtendedWebSocket[] = [];

    for (const client of this.clients) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      } else if (client.readyState === WebSocket.CLOSED || client.readyState === WebSocket.CLOSING) {
        // Mark for removal
        toRemove.push(client);
      }
    }

    // Clean up closed connections
    for (const client of toRemove) {
      this.clients.delete(client);
      console.log(`Cleaned up closed connection. Total: ${this.clients.size}`);
    }
  }

  getClientCount(): number {
    return this.clients.size;
  }

  close(): void {
    clearInterval(this.pingInterval);
    this.wss.close();
  }
}
