"use client";

import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  Node,
  Edge,
  MarkerType,
  ReactFlowProvider,
  useReactFlow,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import { useRepository } from "@/context/repository-context";
import { useSettings } from "@/context/settings-context";
import { apiClient } from "@/lib/api/client";
import { ASTGraphNode, ASTGraphEdge, RepositoryGraphData } from "@/types/ast-graph";
import { ASTCustomNode, ASTCustomNodeData } from "@/components/graph/ast-custom-node";
import { ASTCustomEdge } from "@/components/graph/ast-custom-edge";
import { ASTTreeView } from "@/components/graph/ast-tree-view";
import { ASTNodeDetailsPanel } from "@/components/graph/ast-node-details-panel";
import { getLayoutedElements } from "@/lib/graph/layout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Network,
  GitFork,
  Search,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  RefreshCw,
  Sparkles,
  Layers,
  Filter,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Crosshair,
  SlidersHorizontal,
  ChevronRight,
  ArrowLeft,
  ArrowRight,
  RotateCcw,
  Plus,
  Minus,
  Info,
  ExternalLink,
} from "lucide-react";

const nodeTypes = {
  customNode: ASTCustomNode,
  repositoryNode: ASTCustomNode,
  fileNode: ASTCustomNode,
  classNode: ASTCustomNode,
  functionNode: ASTCustomNode,
};

const edgeTypes = {
  customEdge: ASTCustomEdge,
};

type GraphScope = "full" | "selected" | "1-hop" | "2-hops" | "3-hops";

function CodeGraphCanvas() {
  const { selectedRepoId, setSelectedRepoId, repositories } = useRepository();
  const { settings } = useSettings();
  const { fitView, zoomIn, zoomOut, setCenter } = useReactFlow();

  const [rawNodes, setRawNodes] = useState<ASTGraphNode[]>([]);
  const [rawEdges, setRawEdges] = useState<ASTGraphEdge[]>([]);
  const [graphStats, setGraphStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // View & Scope modes
  const [viewMode, setViewMode] = useState<"graph" | "tree">("graph");
  const [layoutDirection, setLayoutDirection] = useState<"TB" | "LR">("TB");
  const [showEdgeLabels, setShowEdgeLabels] = useState(true);
  const [graphScope, setGraphScope] = useState<GraphScope>("1-hop");
  const [hideUnrelated, setHideUnrelated] = useState(true);

  // Progressive Expansion & Focus state
  const [expandedNodeIds, setExpandedNodeIds] = useState<Set<string>>(new Set());
  const [focusNodeId, setFocusNodeId] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<ASTGraphNode | null>(null);

  // Navigation history & Breadcrumbs
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const [searchQuery, setSearchQuery] = useState("");

  // Large graph confirmation modal
  const [showLargeGraphWarning, setShowLargeGraphWarning] = useState(false);

  // Type Filters connected to settings
  const [typeFilters, setTypeFilters] = useState<Record<string, boolean>>({
    repository: true,
    file: settings.codeIntelligence.showFileNodes,
    class: settings.codeIntelligence.showClassNodes,
    function: settings.codeIntelligence.showFunctionNodes,
    method: settings.codeIntelligence.showFunctionNodes,
    interface: settings.codeIntelligence.showClassNodes,
    module: true,
  });

  // Relationship Filters connected to settings
  const [relFilters, setRelFilters] = useState<Record<string, boolean>>({
    CONTAINS: true,
    IMPORTS: settings.codeIntelligence.showImportEdges,
    CALLS: settings.codeIntelligence.showCallEdges,
    EXTENDS: settings.codeIntelligence.showDependencyEdges,
    DEPENDS_ON: settings.codeIntelligence.showDependencyEdges,
  });

  // React Flow state
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

  // 1. Fetch live AST graph from backend Tree-sitter endpoint
  const loadGraphData = useCallback(async (repoId: string) => {
    setLoading(true);
    try {
      const target = repoId === "all" ? (repositories[0]?.id || "opengym") : repoId;
      const res: RepositoryGraphData = await apiClient.getRepositoryGraph(target);
      if (res && res.nodes && res.nodes.length > 0) {
        setRawNodes(res.nodes);
        setRawEdges(res.edges || []);
        setGraphStats(res.stats || { total_nodes: res.nodes.length, total_edges: res.edges?.length || 0 });

        // Initial default selection: root repository node or first file node
        const defaultNode = res.nodes.find((n) => n.type === "repository") || res.nodes[0];
        setSelectedNode(defaultNode || null);
        if (defaultNode) {
          setExpandedNodeIds(new Set([defaultNode.id]));
          setHistory([defaultNode.id]);
          setHistoryIndex(0);
        }
      } else {
        setRawNodes([]);
        setRawEdges([]);
        setGraphStats(null);
        setSelectedNode(null);
        setExpandedNodeIds(new Set());
      }
    } catch (err) {
      console.error("[AST Graph Load Error]:", err);
      setRawNodes([]);
      setRawEdges([]);
    } finally {
      setLoading(false);
    }
  }, [repositories]);

  useEffect(() => {
    loadGraphData(selectedRepoId);
  }, [selectedRepoId, loadGraphData]);

  // Handle AST Refresh action
  const handleRefreshAST = async () => {
    setRefreshing(true);
    await loadGraphData(selectedRepoId);
    setRefreshing(false);
  };

  // Center node smoothly in canvas
  const centerNode = useCallback((nodeId: string) => {
    setTimeout(() => {
      // Look up element
      const targetNode = nodes.find((n) => n.id === nodeId);
      if (targetNode) {
        setCenter(targetNode.position.x + 120, targetNode.position.y + 40, {
          zoom: 1.1,
          duration: 600,
        });
      } else {
        fitView({ padding: 0.2, duration: 400 });
      }
    }, 100);
  }, [nodes, setCenter, fitView]);

  // Select node with history update
  const handleSelectNode = useCallback((node: ASTGraphNode, updateHist = true) => {
    setSelectedNode(node);
    if (updateHist) {
      setHistory((prev) => {
        const next = [...prev.slice(0, historyIndex + 1), node.id];
        return next;
      });
      setHistoryIndex((prev) => prev + 1);
    }
  }, [historyIndex]);

  // Expand Node: Add direct connected neighbors
  const handleExpandNode = useCallback((nodeId: string) => {
    setExpandedNodeIds((prev) => {
      const next = new Set(prev);
      next.add(nodeId);
      return next;
    });
  }, []);

  // Collapse Node: Remove node and its descendants from expanded set
  const handleCollapseNode = useCallback((nodeId: string) => {
    setExpandedNodeIds((prev) => {
      const next = new Set(prev);
      next.delete(nodeId);
      return next;
    });
  }, []);

  // Focus Mode Toggle
  const handleToggleFocus = useCallback((nodeId: string) => {
    setFocusNodeId((prev) => {
      if (prev === nodeId) {
        return null;
      } else {
        const target = rawNodes.find((n) => n.id === nodeId);
        if (target) setSelectedNode(target);
        return nodeId;
      }
    });
  }, [rawNodes]);

  // Expand All with Large Graph Warning Check
  const handleExpandAll = () => {
    if (rawNodes.length > 300) {
      setShowLargeGraphWarning(true);
    } else {
      setGraphScope("full");
      setExpandedNodeIds(new Set(rawNodes.map((n) => n.id)));
    }
  };

  const handleCollapseAll = () => {
    setGraphScope("selected");
    if (selectedNode) {
      setExpandedNodeIds(new Set([selectedNode.id]));
    } else {
      setExpandedNodeIds(new Set());
    }
    setFocusNodeId(null);
  };

  // Back / Forward in Graph History
  const handleHistoryBack = () => {
    if (historyIndex > 0) {
      const prevId = history[historyIndex - 1];
      const target = rawNodes.find((n) => n.id === prevId);
      if (target) {
        setSelectedNode(target);
        setHistoryIndex(historyIndex - 1);
      }
    }
  };

  const handleHistoryForward = () => {
    if (historyIndex < history.length - 1) {
      const nextId = history[historyIndex + 1];
      const target = rawNodes.find((n) => n.id === nextId);
      if (target) {
        setSelectedNode(target);
        setHistoryIndex(historyIndex + 1);
      }
    }
  };

  // 2. Compute Visible Node & Edge Sets based on Scope, Expand, and Focus
  const { visibleNodes, visibleEdges } = useMemo(() => {
    if (rawNodes.length === 0) return { visibleNodes: [], visibleEdges: [] };

    // Adjacency map for fast traversal
    const outgoingMap = new Map<string, string[]>();
    const incomingMap = new Map<string, string[]>();
    const neighborsMap = new Map<string, Set<string>>();

    rawEdges.forEach((e) => {
      if (!outgoingMap.has(e.source)) outgoingMap.set(e.source, []);
      outgoingMap.get(e.source)!.push(e.target);

      if (!incomingMap.has(e.target)) incomingMap.set(e.target, []);
      incomingMap.get(e.target)!.push(e.source);

      if (!neighborsMap.has(e.source)) neighborsMap.set(e.source, new Set());
      neighborsMap.get(e.source)!.add(e.target);

      if (!neighborsMap.has(e.target)) neighborsMap.set(e.target, new Set());
      neighborsMap.get(e.target)!.add(e.source);
    });

    const activeNodeIds = new Set<string>();

    // CASE 1: Focus Mode Active -> Strictly focus node + direct neighbors
    if (focusNodeId) {
      activeNodeIds.add(focusNodeId);
      const neighbors = neighborsMap.get(focusNodeId) || new Set();
      neighbors.forEach((nid) => activeNodeIds.add(nid));
    }
    // CASE 2: Graph Scope = full
    else if (graphScope === "full") {
      rawNodes.forEach((n) => activeNodeIds.add(n.id));
    }
    // CASE 3: Progressive Expansion & Hops Scope
    else {
      // Start with root / selected node
      const rootNode = selectedNode || rawNodes.find((n) => n.type === "repository") || rawNodes[0];
      if (rootNode) {
        activeNodeIds.add(rootNode.id);
      }

      // Add all explicitly expanded nodes and their direct children
      expandedNodeIds.forEach((expId) => {
        activeNodeIds.add(expId);
        const children = outgoingMap.get(expId) || [];
        children.forEach((cid) => activeNodeIds.add(cid));
      });

      // Add N-Hop neighbors around selected node
      if (selectedNode && graphScope !== "selected") {
        const hops = graphScope === "1-hop" ? 1 : graphScope === "2-hops" ? 2 : 3;
        let currentLevel = new Set<string>([selectedNode.id]);
        for (let h = 0; h < hops; h++) {
          const nextLevel = new Set<string>();
          currentLevel.forEach((currId) => {
            const neighbors = neighborsMap.get(currId) || new Set();
            neighbors.forEach((nid) => {
              activeNodeIds.add(nid);
              nextLevel.add(nid);
            });
          });
          currentLevel = nextLevel;
        }
      }
    }

    // Filter by type filters
    const finalNodes = rawNodes.filter((n) => {
      if (!activeNodeIds.has(n.id)) return false;
      const t = (n.type || "file").toLowerCase();
      return typeFilters[t] !== false;
    });

    const finalNodeIdSet = new Set(finalNodes.map((n) => n.id));

    // Filter edges
    const finalEdges = rawEdges.filter((e) => {
      const relType = (e.type || "CONTAINS").toUpperCase();
      return (
        relFilters[relType] !== false &&
        finalNodeIdSet.has(e.source) &&
        finalNodeIdSet.has(e.target)
      );
    });

    return { visibleNodes: finalNodes, visibleEdges: finalEdges };
  }, [
    rawNodes,
    rawEdges,
    focusNodeId,
    graphScope,
    selectedNode,
    expandedNodeIds,
    typeFilters,
    relFilters,
  ]);

  // 3. Build Layouted React Flow Elements
  useEffect(() => {
    if (visibleNodes.length === 0) {
      setNodes([]);
      setEdges([]);
      return;
    }

    const connectedToSelected = new Set<string>();
    if (selectedNode) {
      connectedToSelected.add(selectedNode.id);
      rawEdges.forEach((e) => {
        if (e.source === selectedNode.id) connectedToSelected.add(e.target);
        if (e.target === selectedNode.id) connectedToSelected.add(e.source);
      });
    }

    const searchLower = searchQuery.trim().toLowerCase();

    // Outgoing degree map
    const outDegreeMap = new Map<string, number>();
    rawEdges.forEach((e) => {
      outDegreeMap.set(e.source, (outDegreeMap.get(e.source) || 0) + 1);
    });

    const flowNodes: Node[] = visibleNodes.map((n) => {
      const isSelected = selectedNode?.id === n.id;
      const isSearchHit = searchLower
        ? n.name.toLowerCase().includes(searchLower) || (n.filePath && n.filePath.toLowerCase().includes(searchLower))
        : true;
      const isConnected = connectedToSelected.has(n.id);
      const isDimmed = hideUnrelated && selectedNode && !isConnected && !isSearchHit;
      const isHighlighted = (Boolean(searchLower) && isSearchHit) || (Boolean(selectedNode) && isConnected && !isSelected);

      return {
        id: n.id,
        type: "customNode",
        position: { x: 0, y: 0 },
        data: {
          rawNode: n,
          isSelected,
          isDimmed,
          isHighlighted,
          isExpanded: expandedNodeIds.has(n.id),
          isFocused: focusNodeId === n.id,
          directNeighborsCount: outDegreeMap.get(n.id) || 0,
          onExpandNode: handleExpandNode,
          onCollapseNode: handleCollapseNode,
          onFocusNode: handleToggleFocus,
        } as unknown as Record<string, unknown>,
      };
    });

    const flowEdges: Edge[] = visibleEdges.map((e) => {
      const isConnected =
        (selectedNode && (e.source === selectedNode.id || e.target === selectedNode.id)) ||
        (focusNodeId && (e.source === focusNodeId || e.target === focusNodeId));

      return {
        id: e.id,
        source: e.source,
        target: e.target,
        type: "customEdge",
        label: showEdgeLabels ? e.label || e.type.toLowerCase() : undefined,
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: isConnected ? "#F62440" : "#D4C2B0",
          width: 14,
          height: 14,
        },
        data: {
          type: e.type,
          showLabels: showEdgeLabels,
          isHighlighted: Boolean(isConnected),
          isDimmed: hideUnrelated && selectedNode && !isConnected,
        },
      };
    });

    // Dagre Layout Calculation
    const layouted = getLayoutedElements(flowNodes, flowEdges, {
      direction: layoutDirection,
      rankSep: layoutDirection === "TB" ? 90 : 120,
      nodeSep: 60,
    });

    setNodes(layouted.nodes);
    setEdges(layouted.edges);

    setTimeout(() => {
      fitView({ padding: 0.25, duration: 400 });
    }, 50);
  }, [
    visibleNodes,
    visibleEdges,
    rawEdges,
    layoutDirection,
    showEdgeLabels,
    focusNodeId,
    selectedNode,
    searchQuery,
    hideUnrelated,
    expandedNodeIds,
    handleExpandNode,
    handleCollapseNode,
    handleToggleFocus,
    setNodes,
    setEdges,
    fitView,
  ]);

  // Handle node selection from canvas click
  const onNodeClick = useCallback(
    (_: any, node: Node) => {
      const nodeData = node.data as unknown as ASTCustomNodeData;
      if (nodeData?.rawNode) {
        handleSelectNode(nodeData.rawNode);
      }
    },
    [handleSelectNode]
  );

  // Navigate to Copilot
  const handleAskCopilot = (node: ASTGraphNode) => {
    const repoName = node.repositoryId || node.repository || selectedRepoId;
    const filePath = node.filePath || "";
    const prompt = `Explain the architecture, callers, and dependencies of ${node.name} in ${repoName}${filePath ? ` (${filePath})` : ""}: ${node.description || ""}`;
    window.location.href = `/dashboard/copilot?q=${encodeURIComponent(prompt)}`;
  };

  const handleSelectNodeById = (nodeId: string) => {
    const target = rawNodes.find((n) => n.id === nodeId);
    if (target) {
      handleSelectNode(target);
      handleExpandNode(nodeId);
      centerNode(nodeId);
    }
  };

  // Search Submit: select and center match
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    const searchLower = searchQuery.toLowerCase();
    const match = rawNodes.find(
      (n) =>
        n.name.toLowerCase().includes(searchLower) ||
        (n.filePath && n.filePath.toLowerCase().includes(searchLower))
    );
    if (match) {
      handleSelectNode(match);
      handleExpandNode(match.id);
      centerNode(match.id);
    }
  };

  // Build Breadcrumb path for selected node
  const breadcrumbs = useMemo(() => {
    if (!selectedNode) return [];
    const items: { label: string; id: string; type: string }[] = [];
    const repoName = selectedNode.repositoryId || selectedRepoId;
    items.push({ label: repoName, id: `repo:${repoName}`, type: "repository" });

    if (selectedNode.filePath) {
      const fileName = selectedNode.filePath.split("/").pop() || selectedNode.filePath;
      items.push({ label: fileName, id: `file:${repoName}:${selectedNode.filePath}`, type: "file" });
    }

    if (selectedNode.type !== "repository" && selectedNode.type !== "file") {
      items.push({ label: selectedNode.name, id: selectedNode.id, type: selectedNode.type });
    }

    return items;
  }, [selectedNode, selectedRepoId]);

  return (
    <div className="space-y-4">
      {/* Top Header & Interactive Toolbar */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 bg-white p-4 rounded-2xl border border-[#FFE5BF] shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#FFF2DB] text-[#F62440] border border-[#FFE5BF] flex items-center justify-center shadow-xs">
              <Network className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-[#211c1d] flex items-center gap-2 font-mono">
                Code Graph & AST Architecture
                <Badge variant="brand" className="text-[10px] font-mono uppercase bg-[#FFE5BF] text-[#F62440] border-[#FFE5BF]">
                  Tree-Sitter Live
                </Badge>
              </h1>
              <p className="text-xs text-[#73666b]">
                Explore how your code is connected with progressive expansion and focus mode.
              </p>
            </div>
          </div>
        </div>

        {/* Toolbar Controls */}
        <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
          {/* History Back / Forward */}
          <div className="flex items-center gap-1 bg-[#FFFAF3] p-1 rounded-xl border border-[#FFE5BF]">
            <button
              onClick={handleHistoryBack}
              disabled={historyIndex <= 0}
              className="p-1.5 rounded-lg hover:bg-[#FFF2DB] text-[#73666b] disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed"
              title="Back"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleHistoryForward}
              disabled={historyIndex >= history.length - 1}
              className="p-1.5 rounded-lg hover:bg-[#FFF2DB] text-[#73666b] disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed"
              title="Forward"
            >
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Repository Selector */}
          <div className="flex items-center gap-1.5 bg-[#FFFAF3] px-2.5 py-1.5 rounded-xl border border-[#FFE5BF]">
            <span className="text-[#73666b]">Repo:</span>
            <select
              value={selectedRepoId}
              onChange={(e) => setSelectedRepoId(e.target.value)}
              className="bg-transparent text-[#211c1d] font-bold focus:outline-none cursor-pointer"
            >
              <option value="all">🌐 All Repositories</option>
              {repositories.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </div>

          {/* Graph Scope Dropdown */}
          <div className="flex items-center gap-1.5 bg-[#FFFAF3] px-2.5 py-1.5 rounded-xl border border-[#FFE5BF]">
            <span className="text-[#73666b]">Scope:</span>
            <select
              value={graphScope}
              onChange={(e) => setGraphScope(e.target.value as GraphScope)}
              className="bg-transparent text-[#211c1d] font-bold focus:outline-none cursor-pointer"
            >
              <option value="selected">Selected Node</option>
              <option value="1-hop">1 Hop (Default)</option>
              <option value="2-hops">2 Hops</option>
              <option value="3-hops">3 Hops</option>
              <option value="full">Full Repository</option>
            </select>
          </div>

          {/* Expand All / Collapse All */}
          <Button
            onClick={handleExpandAll}
            variant="outline"
            size="sm"
            className="rounded-xl border-[#FFE5BF] bg-[#FFFAF3] hover:bg-[#FFF2DB] text-xs font-semibold text-[#211c1d] cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 mr-1 text-[#F62440]" />
            Expand All
          </Button>

          <Button
            onClick={handleCollapseAll}
            variant="outline"
            size="sm"
            className="rounded-xl border-[#FFE5BF] bg-[#FFFAF3] hover:bg-[#FFF2DB] text-xs font-semibold text-[#211c1d] cursor-pointer"
          >
            <Minus className="w-3.5 h-3.5 mr-1 text-[#73666b]" />
            Collapse All
          </Button>

          {/* Fit View */}
          <Button
            onClick={() => fitView({ padding: 0.25, duration: 400 })}
            variant="outline"
            size="sm"
            className="rounded-xl border-[#FFE5BF] bg-[#FFFAF3] hover:bg-[#FFF2DB] text-xs font-semibold text-[#211c1d] cursor-pointer"
            title="Fit View"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </Button>

          {/* Refresh AST */}
          <Button
            onClick={handleRefreshAST}
            disabled={refreshing}
            variant="outline"
            size="sm"
            className="rounded-xl border-[#FFE5BF] bg-[#FFFAF3] hover:bg-[#FFF2DB] text-xs font-semibold text-[#211c1d] cursor-pointer"
            title="Rebuild AST Graph"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin text-[#F62440]" : ""}`} />
          </Button>
        </div>
      </div>

      {/* Breadcrumb Hierarchy Navigation */}
      {breadcrumbs.length > 0 && (
        <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl border border-[#FFE5BF] text-xs font-mono overflow-x-auto shadow-xs">
          <span className="text-[#73666b] font-bold uppercase text-[10px]">Hierarchy:</span>
          {breadcrumbs.map((b, i) => (
            <React.Fragment key={b.id}>
              {i > 0 && <ChevronRight className="w-3.5 h-3.5 text-[#73666b]" />}
              <button
                onClick={() => handleSelectNodeById(b.id)}
                className={`px-2 py-0.5 rounded-md hover:bg-[#FFF2DB] transition-colors cursor-pointer font-semibold ${
                  i === breadcrumbs.length - 1 ? "bg-[#FFE5BF] text-[#F62440] font-bold" : "text-[#211c1d]"
                }`}
              >
                {b.label}
              </button>
            </React.Fragment>
          ))}
        </div>
      )}

      {/* Large Graph Warning Modal */}
      {showLargeGraphWarning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl border border-[#FFE5BF] bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#211c1d]">Expand Entire Repository?</h3>
                <p className="text-xs text-[#73666b] mt-1 leading-relaxed">
                  This repository contains <span className="font-bold text-[#211c1d]">{rawNodes.length} graph nodes</span> and <span className="font-bold text-[#211c1d]">{rawEdges.length} relationships</span>. Expanding all at once may reduce readability.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-[#FFE5BF]/60">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowLargeGraphWarning(false)}
                className="rounded-xl border-[#FFE5BF] text-xs cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  setGraphScope("full");
                  setExpandedNodeIds(new Set(rawNodes.map((n) => n.id)));
                  setShowLargeGraphWarning(false);
                }}
                className="rounded-xl bg-[#F62440] hover:bg-[#de1832] text-white text-xs font-semibold cursor-pointer"
              >
                Expand Anyway
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Main 3-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        
        {/* Left Column: Search & Filters (3 Cols) */}
        <div className="lg:col-span-3 space-y-3">
          {/* Node Search Box */}
          <Card className="p-4 rounded-2xl border-[#FFE5BF] bg-white shadow-xs space-y-3">
            <div className="font-bold text-xs text-[#211c1d] font-mono flex items-center gap-1.5">
              <Search className="w-3.5 h-3.5 text-[#F62440]" />
              Search Graph Symbols
            </div>
            <form onSubmit={handleSearchSubmit} className="relative">
              <input
                type="text"
                placeholder="Search function, class, file..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-2 rounded-xl border border-[#FFE5BF] bg-[#FFFAF3] text-xs font-mono text-[#211c1d] placeholder:text-[#a8999e] focus:outline-none focus:border-[#F62440]"
              />
              <Search className="w-3.5 h-3.5 text-[#73666b] absolute left-2.5 top-2.5" />
            </form>

            {/* Quick Search Match Suggestions */}
            {searchQuery.trim().length > 1 && (
              <div className="max-h-40 overflow-y-auto space-y-1 pt-1">
                {rawNodes
                  .filter((n) =>
                    n.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    (n.filePath && n.filePath.toLowerCase().includes(searchQuery.toLowerCase()))
                  )
                  .slice(0, 5)
                  .map((n) => (
                    <div
                      key={n.id}
                      onClick={() => handleSelectNodeById(n.id)}
                      className="p-2 rounded-lg bg-[#FFFAF3] hover:bg-[#FFF2DB] border border-[#FFE5BF]/60 text-xs font-mono flex items-center justify-between cursor-pointer"
                    >
                      <span className="truncate max-w-[160px] font-bold text-[#211c1d]">
                        {n.name}
                      </span>
                      <span className="text-[9px] uppercase px-1 rounded bg-white text-[#73666b] border border-[#FFE5BF]">
                        {n.type}
                      </span>
                    </div>
                  ))}
              </div>
            )}
          </Card>

          {/* Graph View Options (Direction, Labels, Dimming) */}
          <Card className="p-4 rounded-2xl border-[#FFE5BF] bg-white shadow-xs space-y-3 text-xs font-mono">
            <div className="font-bold text-[#211c1d] flex items-center gap-1.5">
              <SlidersHorizontal className="w-3.5 h-3.5 text-[#F62440]" />
              Graph View & Focus Options
            </div>

            <div className="space-y-2.5">
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-[#73666b]">Hide Unrelated Nodes</span>
                <input
                  type="checkbox"
                  checked={hideUnrelated}
                  onChange={(e) => setHideUnrelated(e.target.checked)}
                  className="w-4 h-4 rounded text-[#F62440] focus:ring-[#F62440]"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-[#73666b]">Show Edge Relationship Labels</span>
                <input
                  type="checkbox"
                  checked={showEdgeLabels}
                  onChange={(e) => setShowEdgeLabels(e.target.checked)}
                  className="w-4 h-4 rounded text-[#F62440] focus:ring-[#F62440]"
                />
              </label>

              <div className="flex items-center justify-between pt-2 border-t border-[#FFE5BF]/50">
                <span className="text-[#73666b]">Layout Direction</span>
                <div className="flex gap-1">
                  <button
                    onClick={() => setLayoutDirection("TB")}
                    className={`px-2 py-1 rounded-lg text-[10px] font-bold cursor-pointer ${
                      layoutDirection === "TB" ? "bg-[#FFE5BF] text-[#F62440] border border-[#FFE5BF]" : "bg-[#FFFAF3] text-[#73666b]"
                    }`}
                  >
                    Top-Down
                  </button>
                  <button
                    onClick={() => setLayoutDirection("LR")}
                    className={`px-2 py-1 rounded-lg text-[10px] font-bold cursor-pointer ${
                      layoutDirection === "LR" ? "bg-[#FFE5BF] text-[#F62440] border border-[#FFE5BF]" : "bg-[#FFFAF3] text-[#73666b]"
                    }`}
                  >
                    Left-Right
                  </button>
                </div>
              </div>
            </div>
          </Card>

          {/* Node Type Filters */}
          <Card className="p-4 rounded-2xl border-[#FFE5BF] bg-white shadow-xs space-y-3 text-xs font-mono">
            <div className="font-bold text-[#211c1d] flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Filter className="w-3.5 h-3.5 text-[#F62440]" />
                Node Type Filters
              </span>
              <span className="text-[10px] text-[#73666b]">
                {visibleNodes.length} / {rawNodes.length}
              </span>
            </div>

            <div className="space-y-1.5">
              {[
                { key: "repository", label: "Repository Root", color: "text-[#F62440]" },
                { key: "file", label: "Files", color: "text-[#5B7083]" },
                { key: "class", label: "Classes & Structs", color: "text-emerald-600" },
                { key: "function", label: "Functions & Methods", color: "text-purple-600" },
              ].map(({ key, label, color }) => (
                <label
                  key={key}
                  className="flex items-center justify-between p-2 rounded-xl bg-[#FFFAF3] hover:bg-[#FFF2DB]/60 cursor-pointer border border-[#FFE5BF]/60"
                >
                  <span className={`font-semibold ${color}`}>{label}</span>
                  <input
                    type="checkbox"
                    checked={typeFilters[key] !== false}
                    onChange={(e) =>
                      setTypeFilters((prev) => ({ ...prev, [key]: e.target.checked }))
                    }
                    className="w-3.5 h-3.5 rounded text-[#F62440]"
                  />
                </label>
              ))}
            </div>
          </Card>

          {/* Graph Legend */}
          <Card className="p-4 rounded-2xl border-[#FFE5BF] bg-[#FFFAF3] text-xs font-mono space-y-2">
            <div className="font-bold text-[#211c1d] text-[11px] uppercase tracking-wider">
              Legend & Relationship Types
            </div>
            <div className="space-y-1.5 text-[11px] text-[#73666b]">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#5B7083]" />
                <span>File (Contains functions & classes)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#8B5CF6]" />
                <span>Function / Method Invocations</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
                <span>Class / Interface Declarations</span>
              </div>
              <div className="flex items-center gap-2 pt-1 border-t border-[#FFE5BF]/60 text-[10px]">
                <span className="font-bold text-[#5B7083]">---- IMPORTS</span>
                <span className="font-bold text-[#8B5CF6]">···· CALLS</span>
                <span className="font-bold text-emerald-600">──── CONTAINS</span>
              </div>
            </div>
          </Card>
        </div>

        {/* Center Canvas: Interactive React Flow Graph (6 Cols) */}
        <div className="lg:col-span-6 space-y-3">
          <Card className="rounded-2xl border-[#FFE5BF] bg-[#FFFAF3] overflow-hidden shadow-sm relative min-h-[640px] flex flex-col">
            {loading ? (
              <div className="flex-1 flex flex-col items-center justify-center p-12 text-center space-y-3">
                <div className="w-10 h-10 border-3 border-[#FFE5BF] border-t-[#F62440] rounded-full animate-spin" />
                <div className="font-mono text-xs font-bold text-[#211c1d]">
                  Extracting Tree-Sitter AST & Resolving Code Graph...
                </div>
                <div className="text-[11px] font-mono text-[#73666b]">
                  Parsing files • Extracting classes & functions • Linking imports
                </div>
              </div>
            ) : rawNodes.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center p-12 text-center space-y-4">
                <AlertCircle className="w-10 h-10 text-[#F62440]" />
                <h3 className="font-bold text-sm text-[#211c1d] font-mono">
                  No AST nodes available for this repository.
                </h3>
                <p className="text-xs text-[#73666b] max-w-sm">
                  Ingest or sync repository source files from the dashboard so that SHIPRAG can extract AST symbols.
                </p>
                <Button
                  onClick={handleRefreshAST}
                  size="sm"
                  className="rounded-xl bg-[#F62440] hover:bg-[#de1832] text-white text-xs font-semibold"
                >
                  Build AST Graph
                </Button>
              </div>
            ) : (
              <div className="w-full h-[640px] relative">
                <ReactFlow
                  nodes={nodes}
                  edges={edges}
                  onNodesChange={onNodesChange}
                  onEdgesChange={onEdgesChange}
                  onNodeClick={onNodeClick}
                  nodeTypes={nodeTypes}
                  edgeTypes={edgeTypes}
                  fitView
                  minZoom={0.15}
                  maxZoom={2}
                  defaultEdgeOptions={{ type: "customEdge" }}
                  proOptions={{ hideAttribution: true }}
                >
                  <Background color="#FFE5BF" gap={20} size={1} />
                  <Controls
                    showInteractive={false}
                    className="!bg-white !border-[#FFE5BF] !rounded-xl !shadow-xs !text-[#211c1d]"
                  />
                  <MiniMap
                    nodeColor={(n: any) => {
                      const type = n.data?.rawNode?.type;
                      if (type === "repository") return "#F62440";
                      if (type === "file") return "#5B7083";
                      if (type === "class") return "#10B981";
                      return "#8B5CF6";
                    }}
                    maskColor="rgba(255, 250, 243, 0.7)"
                    className="!bg-white !border-[#FFE5BF] !rounded-xl overflow-hidden"
                  />
                </ReactFlow>

                {/* Focus mode indicator overlay */}
                {focusNodeId && (
                  <div className="absolute top-3 left-3 z-10 bg-[#FFF2DB] border border-[#F62440] px-3.5 py-2 rounded-xl text-xs font-mono text-[#F62440] flex items-center gap-2.5 shadow-md">
                    <Crosshair className="w-4 h-4 animate-pulse" />
                    <div>
                      <div className="font-bold">FOCUS MODE ACTIVE</div>
                      <div className="text-[10px] text-[#73666b]">
                        Focused on: {selectedNode?.name}
                      </div>
                    </div>
                    <button
                      onClick={() => setFocusNodeId(null)}
                      className="ml-2 px-2 py-0.5 rounded-lg bg-[#F62440] text-white text-[10px] font-bold hover:bg-[#de1832] cursor-pointer"
                    >
                      Exit Focus
                    </button>
                  </div>
                )}

                {/* Scoped Node Counter Banner */}
                <div className="absolute bottom-3 right-3 z-10 bg-white/90 backdrop-blur-xs border border-[#FFE5BF] px-3 py-1.5 rounded-xl text-[11px] font-mono text-[#73666b] shadow-xs">
                  Showing <span className="font-bold text-[#211c1d]">{visibleNodes.length}</span> of <span className="font-bold text-[#211c1d]">{rawNodes.length}</span> nodes
                  {graphScope !== "full" && ` · Scope: ${graphScope}`}
                </div>
              </div>
            )}
          </Card>
        </div>

        {/* Right Column: Node Details Inspector (3 Cols) */}
        <div className="lg:col-span-3 space-y-3">
          {selectedNode ? (
            <ASTNodeDetailsPanel
              node={selectedNode}
              edges={rawEdges}
              isExpanded={expandedNodeIds.has(selectedNode.id)}
              isFocused={focusNodeId === selectedNode.id}
              onClose={() => setSelectedNode(null)}
              onSelectNodeById={handleSelectNodeById}
              onExpandNode={handleExpandNode}
              onCollapseNode={handleCollapseNode}
              onToggleFocus={handleToggleFocus}
              onAskCopilot={handleAskCopilot}
            />
          ) : (
            <Card className="p-8 rounded-2xl border-[#FFE5BF] bg-white text-center text-xs text-[#73666b] font-mono shadow-xs">
              Click any AST node in the canvas or search list to inspect dependencies, callers, line ranges, and expand connected subgraphs.
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

export default function CodeGraphPage() {
  return (
    <ReactFlowProvider>
      <CodeGraphCanvas />
    </ReactFlowProvider>
  );
}
