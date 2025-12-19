import { GraphData, ForceGraphNode, ForceGraphLink } from '../types';

export function transformForGraph(data: GraphData): {
  nodes: ForceGraphNode[];
  links: ForceGraphLink[];
} {
  const nodes: ForceGraphNode[] = data.nodes.map(node => ({
    ...node
  }));

  const links: ForceGraphLink[] = data.links.map(link => ({
    source: link.source,
    target: link.target
  }));

  return { nodes, links };
}

export function calculateNodeSize(node: ForceGraphNode): number {
  if (node.isFolder) {
    return 8;
  }
  const activityTotal = node.activityCount.reads + node.activityCount.writes;
  return Math.min(4 + activityTotal * 0.5, 12);
}
