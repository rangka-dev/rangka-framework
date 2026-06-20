import dagre from '@dagrejs/dagre';

type LayoutNode = {
  id: string;
  width: number;
  height: number;
};

type LayoutEdge = {
  source: string;
  target: string;
};

export function getLayoutedPositions(
  nodes: LayoutNode[],
  edges: LayoutEdge[],
  direction: 'LR' | 'TB' = 'LR',
) {
  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({ rankdir: direction, nodesep: 80, ranksep: 120 });

  for (const node of nodes) {
    g.setNode(node.id, { width: node.width, height: node.height });
  }

  for (const edge of edges) {
    g.setEdge(edge.source, edge.target);
  }

  dagre.layout(g);

  const positions: Record<string, { x: number; y: number }> = {};
  for (const node of nodes) {
    const pos = g.node(node.id);
    positions[node.id] = {
      x: pos.x - node.width / 2,
      y: pos.y - node.height / 2,
    };
  }

  return positions;
}
