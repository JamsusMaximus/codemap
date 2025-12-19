import { useEffect, useRef, useState } from 'react';
import { useFileActivity } from '../hooks/useFileActivity';
import { GraphNode } from '../types';

const READ_COLOR = '#3b82f6';   // Blue
const WRITE_COLOR = '#f59e0b';  // Amber
const FOLDER_COLOR = '#4b5563'; // Darker gray for folders
const FILE_COLOR = '#9ca3af';   // Lighter gray for files
const FADE_DURATION = 1000;     // 1 second fade out

interface LayoutNode extends GraphNode {
  x: number;
  y: number;
}

interface FadingNode {
  type: 'read' | 'write';
  startTime: number;
}

export function FileGraph() {
  // All data comes via refs - NO STATE, NO RE-RENDERS
  const {
    graphDataRef,
    recentActivityRef,
    activityVersionRef,
    clearGraph
  } = useFileActivity();

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fadingNodesRef = useRef<Map<string, FadingNode>>(new Map());
  const animationRef = useRef<number>();
  const layoutNodesRef = useRef<LayoutNode[]>([]);
  const lastActivityVersionRef = useRef(0);
  const lastNodeCountRef = useRef(0);

  // Simple state for UI status display - updates periodically
  const [fileCount, setFileCount] = useState(0);
  const [isConnected] = useState(true); // WebSocket reconnects automatically

  // Periodically update UI status (cheap, every 500ms)
  useEffect(() => {
    const interval = setInterval(() => {
      const nodes = graphDataRef.current.nodes;
      const count = nodes.filter((n: GraphNode) => !n.isFolder).length;
      setFileCount(count);
    }, 500);
    return () => clearInterval(interval);
  }, [graphDataRef]);

  // Draw on canvas with animation loop - runs continuously
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let isAnimating = true;

    const draw = () => {
      if (!isAnimating) return;

      const now = performance.now();
      const currentGraphData = graphDataRef.current;
      const nodeCount = currentGraphData.nodes.length;

      // Only recalculate layout when node count changes
      if (nodeCount !== lastNodeCountRef.current) {
        lastNodeCountRef.current = nodeCount;
        layoutNodesRef.current = calculateTreeLayout(currentGraphData.nodes);
      }
      const layoutNodes = layoutNodesRef.current;

      // Handle activity updates (replaces useEffect)
      if (activityVersionRef.current !== lastActivityVersionRef.current) {
        lastActivityVersionRef.current = activityVersionRef.current;
        const recentActivity = recentActivityRef.current;

        if (recentActivity && (recentActivity.type === 'read-end' || recentActivity.type === 'write-end')) {
          const opType = recentActivity.type === 'read-end' ? 'read' : 'write';
          const filePath = recentActivity.filePath;

          // Add file to fading
          fadingNodesRef.current.set(filePath, { type: opType, startTime: now });

          // Also fade ancestor folders
          let parentPath = filePath.substring(0, filePath.lastIndexOf('/'));
          while (parentPath.length > 0) {
            fadingNodesRef.current.set(parentPath, { type: opType, startTime: now });
            const lastSlash = parentPath.lastIndexOf('/');
            if (lastSlash <= 0) break;
            parentPath = parentPath.substring(0, lastSlash);
          }
        }
      }

      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);

      // Clear expired fading nodes
      for (const [nodeId, fade] of fadingNodesRef.current) {
        if (now - fade.startTime > FADE_DURATION) {
          fadingNodesRef.current.delete(nodeId);
        }
      }

      // Clear
      ctx.fillStyle = '#1f2937';
      ctx.fillRect(0, 0, rect.width, rect.height);

      if (layoutNodes.length === 0) {
        ctx.fillStyle = '#6b7280';
        ctx.font = '16px system-ui';
        ctx.textAlign = 'center';
        ctx.fillText('Waiting for file activity...', rect.width / 2, rect.height / 2);
        animationRef.current = requestAnimationFrame(draw);
        return;
      }

    // Calculate bounds and scale to fit
    const padding = 60;
    const minX = Math.min(...layoutNodes.map(n => n.x));
    const maxX = Math.max(...layoutNodes.map(n => n.x));
    const minY = Math.min(...layoutNodes.map(n => n.y));
    const maxY = Math.max(...layoutNodes.map(n => n.y));

    const graphWidth = maxX - minX || 1;
    const graphHeight = maxY - minY || 1;
    const availWidth = rect.width - padding * 2;
    const availHeight = rect.height - padding * 2;

    const scale = Math.min(availWidth / graphWidth, availHeight / graphHeight, 2);
    const offsetX = padding + (availWidth - graphWidth * scale) / 2 - minX * scale;
    const offsetY = padding + (availHeight - graphHeight * scale) / 2 - minY * scale;

    const transform = (x: number, y: number) => ({
      x: x * scale + offsetX,
      y: y * scale + offsetY
    });

      // Helper to get fade opacity for a node
      const getFadeOpacity = (nodeId: string): number => {
        const fade = fadingNodesRef.current.get(nodeId);
        if (!fade) return 0;
        const elapsed = now - fade.startTime;
        return Math.max(0, 1 - elapsed / FADE_DURATION);
      };

      const getFadeType = (nodeId: string): 'read' | 'write' | null => {
        const fade = fadingNodesRef.current.get(nodeId);
        return fade ? fade.type : null;
      };

      // Draw links - highlight if both ends have active or fading operations
      for (const link of currentGraphData.links) {
        const sourceNode = layoutNodes.find(n => n.id === link.source);
        const targetNode = layoutNodes.find(n => n.id === link.target);
        if (sourceNode && targetNode) {
          const s = transform(sourceNode.x, sourceNode.y);
          const t = transform(targetNode.x, targetNode.y);

          // Check if both ends have active operations (part of active path)
          const sourceActive = sourceNode.activeOperation;
          const targetActive = targetNode.activeOperation;
          const sourceFadeOpacity = getFadeOpacity(sourceNode.id);
          const targetFadeOpacity = getFadeOpacity(targetNode.id);

          if (sourceActive && targetActive) {
            // This link is on the active path - highlight it
            const activeColor = sourceActive === 'write' ? WRITE_COLOR : READ_COLOR;

            // Glow effect for the link
            ctx.beginPath();
            ctx.moveTo(s.x, s.y);
            ctx.lineTo(t.x, t.y);
            ctx.strokeStyle = activeColor;
            ctx.lineWidth = 8;
            ctx.globalAlpha = 0.3;
            ctx.stroke();

            // Main highlighted link
            ctx.beginPath();
            ctx.moveTo(s.x, s.y);
            ctx.lineTo(t.x, t.y);
            ctx.strokeStyle = activeColor;
            ctx.lineWidth = 3;
            ctx.globalAlpha = 1;
            ctx.stroke();

            ctx.lineWidth = 1;
          } else if (sourceFadeOpacity > 0 && targetFadeOpacity > 0) {
            // Fading link
            const fadeType = getFadeType(sourceNode.id);
            const fadeColor = fadeType === 'write' ? WRITE_COLOR : READ_COLOR;
            const fadeOpacity = Math.min(sourceFadeOpacity, targetFadeOpacity);

            // Glow effect fading
            ctx.beginPath();
            ctx.moveTo(s.x, s.y);
            ctx.lineTo(t.x, t.y);
            ctx.strokeStyle = fadeColor;
            ctx.lineWidth = 8;
            ctx.globalAlpha = 0.3 * fadeOpacity;
            ctx.stroke();

            // Main link fading
            ctx.beginPath();
            ctx.moveTo(s.x, s.y);
            ctx.lineTo(t.x, t.y);
            ctx.strokeStyle = fadeColor;
            ctx.lineWidth = 3;
            ctx.globalAlpha = fadeOpacity;
            ctx.stroke();

            ctx.lineWidth = 1;
            ctx.globalAlpha = 1;
          } else {
            // Normal link
            ctx.beginPath();
            ctx.moveTo(s.x, s.y);
            ctx.lineTo(t.x, t.y);
            ctx.strokeStyle = 'rgba(107, 114, 128, 0.4)';
            ctx.lineWidth = 1;
            ctx.globalAlpha = 1;
            ctx.stroke();
          }
        }
      }

      // Draw nodes
      for (const node of layoutNodes) {
        const pos = transform(node.x, node.y);
        const size = node.isFolder ? 12 : 10;
        const activeOp = node.activeOperation;
        const fadeOpacity = getFadeOpacity(node.id);
        const fadeType = getFadeType(node.id);

        // Active or fading glow effect
        if (activeOp || fadeOpacity > 0) {
          const glowType = activeOp || fadeType;
          const activeColor = glowType === 'write' ? WRITE_COLOR : READ_COLOR;
          const opacity = activeOp ? 1 : fadeOpacity;

          // Outer glow
          ctx.beginPath();
          ctx.arc(pos.x, pos.y, size + 12, 0, Math.PI * 2);
          ctx.fillStyle = activeColor;
          ctx.globalAlpha = 0.3 * opacity;
          ctx.fill();

          // Inner glow
          ctx.beginPath();
          ctx.arc(pos.x, pos.y, size + 6, 0, Math.PI * 2);
          ctx.fillStyle = activeColor;
          ctx.globalAlpha = 0.5 * opacity;
          ctx.fill();

          ctx.globalAlpha = 1;
        }

        // Node circle - solid color when active, interpolate when fading
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, size, 0, Math.PI * 2);

        if (activeOp) {
          ctx.fillStyle = activeOp === 'write' ? WRITE_COLOR : READ_COLOR;
        } else if (fadeOpacity > 0) {
          // Interpolate between active color and base color
          const baseColor = node.isFolder ? FOLDER_COLOR : FILE_COLOR;
          const activeColor = fadeType === 'write' ? WRITE_COLOR : READ_COLOR;
          ctx.fillStyle = interpolateColor(activeColor, baseColor, 1 - fadeOpacity);
        } else {
          ctx.fillStyle = node.isFolder ? FOLDER_COLOR : FILE_COLOR;
        }
        ctx.fill();

        // Border
        if (activeOp) {
          ctx.strokeStyle = activeOp === 'write' ? WRITE_COLOR : READ_COLOR;
          ctx.lineWidth = 2;
        } else if (fadeOpacity > 0) {
          const activeColor = fadeType === 'write' ? WRITE_COLOR : READ_COLOR;
          ctx.strokeStyle = interpolateColor(activeColor, 'rgba(255,255,255,0.2)', 1 - fadeOpacity);
          ctx.lineWidth = 1 + fadeOpacity;
        } else {
          ctx.strokeStyle = 'rgba(255,255,255,0.2)';
          ctx.lineWidth = 1;
        }
        ctx.stroke();
        ctx.lineWidth = 1;

        // Label
        ctx.fillStyle = (activeOp || fadeOpacity > 0.5) ? '#ffffff' : '#e5e7eb';
        ctx.font = node.isFolder ? 'bold 13px system-ui' : '13px system-ui';
        ctx.textAlign = 'center';
        ctx.fillText(node.name, pos.x, pos.y + size + 14, 100);
      }

      // Continue animation loop
      animationRef.current = requestAnimationFrame(draw);
    };

    // Start animation
    draw();

    return () => {
      isAnimating = false;
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []); // Empty deps - animation loop runs continuously and reads from refs

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      {/* Status bar */}
      <div style={{
        position: 'absolute',
        top: 16,
        left: 16,
        zIndex: 10,
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        backgroundColor: 'rgba(17, 24, 39, 0.9)',
        padding: '10px 16px',
        borderRadius: '8px',
        border: '1px solid rgba(255, 255, 255, 0.1)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 10,
            height: 10,
            borderRadius: '50%',
            backgroundColor: isConnected ? '#10b981' : '#ef4444',
            boxShadow: isConnected ? '0 0 8px #10b981' : '0 0 8px #ef4444'
          }} />
          <span style={{ color: '#e5e7eb', fontSize: '13px', fontWeight: 500 }}>
            {isConnected ? 'Connected' : 'Disconnected'}
          </span>
        </div>
        <span style={{ color: '#9ca3af', fontSize: '13px' }}>
          {fileCount} files
        </span>
        <button
          onClick={clearGraph}
          style={{
            background: 'rgba(239, 68, 68, 0.2)',
            border: '1px solid rgba(239, 68, 68, 0.4)',
            color: '#fca5a5',
            padding: '4px 12px',
            borderRadius: '4px',
            fontSize: '12px',
            cursor: 'pointer'
          }}
        >
          Clear
        </button>
      </div>

      {/* Title */}
      <div style={{
        position: 'absolute',
        top: 16,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 10,
        color: '#f9fafb',
        fontSize: '18px',
        fontWeight: 600
      }}>
        CodeMap
      </div>

      <canvas
        ref={canvasRef}
        style={{ width: '100%', height: '100%', display: 'block' }}
      />
    </div>
  );
}

// Simple tree layout algorithm
function calculateTreeLayout(nodes: GraphNode[]): LayoutNode[] {
  if (nodes.length === 0) return [];

  // Build parent-child relationships
  const childrenMap = new Map<string, GraphNode[]>();
  const nodeMap = new Map<string, GraphNode>();

  for (const node of nodes) {
    nodeMap.set(node.id, node);
    childrenMap.set(node.id, []);
  }

  // Find root (depth -1 or minimum depth)
  let root: GraphNode | null = null;
  let minDepth = Infinity;
  for (const node of nodes) {
    if (node.depth < minDepth) {
      minDepth = node.depth;
      root = node;
    }
  }

  if (!root) return [];

  // Build tree
  for (const node of nodes) {
    if (node.id === root.id) continue;
    // Find parent by checking if parent path exists
    const parentPath = node.id.substring(0, node.id.lastIndexOf('/'));
    if (childrenMap.has(parentPath)) {
      childrenMap.get(parentPath)!.push(node);
    } else if (root) {
      // Orphan nodes attach to root
      childrenMap.get(root.id)?.push(node);
    }
  }

  // Sort children alphabetically, folders first
  for (const [, children] of childrenMap) {
    children.sort((a, b) => {
      if (a.isFolder !== b.isFolder) return a.isFolder ? -1 : 1;
      return a.name.localeCompare(b.name);
    });
  }

  // Layout using simple recursive positioning
  const layoutNodes: LayoutNode[] = [];
  const nodeSpacingX = 180;
  const nodeSpacingY = 50;

  let currentY = 0;

  function layoutSubtree(node: GraphNode, depth: number): { minY: number; maxY: number } {
    const children = childrenMap.get(node.id) || [];

    if (children.length === 0) {
      // Leaf node
      const y = currentY;
      currentY += nodeSpacingY;
      layoutNodes.push({ ...node, x: depth * nodeSpacingX, y });
      return { minY: y, maxY: y };
    }

    // Layout children first
    const childBounds: { minY: number; maxY: number }[] = [];
    for (const child of children) {
      childBounds.push(layoutSubtree(child, depth + 1));
    }

    // Position parent at center of children
    const minY = Math.min(...childBounds.map(b => b.minY));
    const maxY = Math.max(...childBounds.map(b => b.maxY));
    const y = (minY + maxY) / 2;

    layoutNodes.push({ ...node, x: depth * nodeSpacingX, y });
    return { minY, maxY };
  }

  layoutSubtree(root, 0);
  return layoutNodes;
}

// Helper to interpolate between two hex colors
function interpolateColor(color1: string, color2: string, t: number): string {
  // Parse hex colors
  const parseHex = (hex: string): [number, number, number] => {
    const h = hex.replace('#', '');
    return [
      parseInt(h.substring(0, 2), 16),
      parseInt(h.substring(2, 4), 16),
      parseInt(h.substring(4, 6), 16)
    ];
  };

  // Handle rgba format for color2 (the base color)
  if (color2.startsWith('rgba')) {
    // Just return color1 with adjusted opacity for simplicity
    const [r, g, b] = parseHex(color1);
    return `rgba(${r}, ${g}, ${b}, ${1 - t})`;
  }

  const [r1, g1, b1] = parseHex(color1);
  const [r2, g2, b2] = parseHex(color2);

  const r = Math.round(r1 + (r2 - r1) * t);
  const g = Math.round(g1 + (g2 - g1) * t);
  const b = Math.round(b1 + (b2 - b1) * t);

  return `rgb(${r}, ${g}, ${b})`;
}
