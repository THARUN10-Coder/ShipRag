"use client";

import React from "react";
import {
  ChevronRight,
  ChevronDown,
  FolderGit2,
  FileCode,
  Box,
  Code2,
  Layers,
  Sparkles,
} from "lucide-react";
import { ASTGraphNode, ASTGraphEdge } from "@/types/ast-graph";

interface ASTTreeViewProps {
  nodes: ASTGraphNode[];
  edges: ASTGraphEdge[];
  selectedNodeId: string | null;
  onSelectNode: (node: ASTGraphNode) => void;
  onAskCopilot: (node: ASTGraphNode) => void;
}

interface TreeNodeItem {
  node: ASTGraphNode;
  children: TreeNodeItem[];
}

export function ASTTreeView({
  nodes,
  edges,
  selectedNodeId,
  onSelectNode,
  onAskCopilot,
}: ASTTreeViewProps) {
  const [collapsedMap, setCollapsedMap] = React.useState<Record<string, boolean>>({});

  const toggleCollapse = (id: string) => {
    setCollapsedMap((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Build hierarchy from CONTAINS edges
  const treeData = React.useMemo(() => {
    const nodeMap = new Map<string, ASTGraphNode>();
    nodes.forEach((n) => nodeMap.set(n.id, n));

    const childrenMap = new Map<string, string[]>();
    const childIds = new Set<string>();

    edges.forEach((e) => {
      const type = (e.type || "").toUpperCase();
      if (type === "CONTAINS" || type === "DEFINES" || type === "DECLARES") {
        if (!childrenMap.has(e.source)) childrenMap.set(e.source, []);
        childrenMap.get(e.source)!.push(e.target);
        childIds.add(e.target);
      }
    });

    // Root nodes are nodes without a parent CONTAINS edge
    const rootNodes = nodes.filter((n) => !childIds.has(n.id) || n.type === "repository");

    function buildTreeItem(node: ASTGraphNode): TreeNodeItem {
      const targetIds = childrenMap.get(node.id) || [];
      const children = targetIds
        .map((tid) => nodeMap.get(tid))
        .filter((n): n is ASTGraphNode => Boolean(n))
        .map(buildTreeItem);

      return { node, children };
    }

    return rootNodes.map(buildTreeItem);
  }, [nodes, edges]);

  const renderTreeItem = (item: TreeNodeItem, depth: number = 0) => {
    const { node, children } = item;
    const isSelected = selectedNodeId === node.id;
    const isCollapsed = Boolean(collapsedMap[node.id]);
    const hasChildren = children.length > 0;

    const getNodeIcon = () => {
      switch (node.type) {
        case "repository":
          return <FolderGit2 className="w-4 h-4 text-[#F62440]" />;
        case "file":
          return <FileCode className="w-4 h-4 text-[#5B7083]" />;
        case "class":
          return <Box className="w-4 h-4 text-emerald-600" />;
        case "function":
        case "method":
          return <Code2 className="w-4 h-4 text-purple-600" />;
        default:
          return <Layers className="w-4 h-4 text-amber-600" />;
      }
    };

    return (
      <div key={node.id} className="select-none text-xs font-mono">
        <div
          onClick={() => onSelectNode(node)}
          style={{ paddingLeft: `${depth * 16 + 8}px` }}
          className={`flex items-center justify-between py-1.5 pr-2 rounded-lg cursor-pointer transition-colors group ${
            isSelected
              ? "bg-[#FFF2DB] text-[#F62440] font-bold border border-[#FFE5BF]"
              : "text-[#171717] hover:bg-[#FFF2DB]/40"
          }`}
        >
          <div className="flex items-center gap-2 min-w-0 flex-1">
            {hasChildren ? (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleCollapse(node.id);
                }}
                className="p-0.5 hover:bg-[#FFE5BF] rounded text-[#6B625B]"
              >
                {isCollapsed ? (
                  <ChevronRight className="w-3.5 h-3.5" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5" />
                )}
              </button>
            ) : (
              <span className="w-4.5" />
            )}

            {getNodeIcon()}
            <span className="truncate" title={node.name}>
              {node.name}
            </span>
          </div>

          <div className="flex items-center gap-1.5 opacity-80 group-hover:opacity-100">
            <span className="px-1.5 py-0.2 rounded text-[9px] bg-white border border-[#EBDCC8] text-[#6B625B] uppercase">
              {node.type}
            </span>
          </div>
        </div>

        {!isCollapsed && hasChildren && (
          <div className="border-l border-[#EBDCC8]/60 ml-4">
            {children.map((child) => renderTreeItem(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="p-4 space-y-1 overflow-y-auto max-h-[600px]">
      {treeData.length > 0 ? (
        treeData.map((item) => renderTreeItem(item, 0))
      ) : (
        <div className="p-6 text-center text-xs text-[#6B625B]">
          No hierarchical AST nodes available.
        </div>
      )}
    </div>
  );
}
