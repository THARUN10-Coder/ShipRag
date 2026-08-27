import dagre from "dagre";
import { Node, Edge, Position } from "@xyflow/react";
import { ASTGraphNode, ASTGraphEdge, ASTNodeType } from "@/types/ast-graph";

export interface LayoutOptions {
  direction?: "TB" | "LR" | "BT" | "RL";
  nodeWidth?: number;
  nodeHeight?: number;
  rankSep?: number;
  nodeSep?: number;
}

export function getLayoutedElements(
  nodes: Node[],
  edges: Edge[],
  options: LayoutOptions = {}
): { nodes: Node[]; edges: Edge[] } {
  const {
    direction = "TB",
    nodeWidth = 240,
    nodeHeight = 72,
    rankSep = 80,
    nodeSep = 50,
  } = options;

  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));
  dagreGraph.setGraph({
    rankdir: direction,
    ranksep: rankSep,
    nodesep: nodeSep,
    marginx: 30,
    marginy: 30,
  });

  nodes.forEach((node) => {
    // Dynamic dimensions depending on node type
    const width = node.type === "repositoryNode" ? 280 : node.type === "fileNode" ? 250 : 220;
    const height = node.type === "repositoryNode" ? 80 : node.type === "fileNode" ? 70 : 60;
    dagreGraph.setNode(node.id, { width, height });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  const layoutedNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    const width = node.type === "repositoryNode" ? 280 : node.type === "fileNode" ? 250 : 220;
    const height = node.type === "repositoryNode" ? 80 : node.type === "fileNode" ? 70 : 60;

    return {
      ...node,
      targetPosition: direction === "LR" ? Position.Left : Position.Top,
      sourcePosition: direction === "LR" ? Position.Right : Position.Bottom,
      position: {
        x: (nodeWithPosition?.x || 0) - width / 2,
        y: (nodeWithPosition?.y || 0) - height / 2,
      },
    };
  });

  return { nodes: layoutedNodes, edges };
}
