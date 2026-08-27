"use client";

import React from "react";
import {
  Sparkles,
  FolderGit2,
  FileCode,
  Box,
  Code2,
  Layers,
  ArrowRight,
  ArrowLeft,
  X,
  ExternalLink,
  Plus,
  Minus,
  Crosshair,
  Maximize2,
  Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ASTGraphNode, ASTGraphEdge } from "@/types/ast-graph";

interface ASTNodeDetailsPanelProps {
  node: ASTGraphNode;
  edges: ASTGraphEdge[];
  isExpanded?: boolean;
  isFocused?: boolean;
  onClose?: () => void;
  onSelectNodeById: (nodeId: string) => void;
  onExpandNode: (nodeId: string) => void;
  onCollapseNode: (nodeId: string) => void;
  onToggleFocus: (nodeId: string) => void;
  onAskCopilot: (node: ASTGraphNode) => void;
  onOpenSource?: (node: ASTGraphNode) => void;
}

export function ASTNodeDetailsPanel({
  node,
  edges,
  isExpanded,
  isFocused,
  onClose,
  onSelectNodeById,
  onExpandNode,
  onCollapseNode,
  onToggleFocus,
  onAskCopilot,
  onOpenSource,
}: ASTNodeDetailsPanelProps) {
  // Compute outgoing and incoming relationships
  const outgoingEdges = edges.filter((e) => e.source === node.id);
  const incomingEdges = edges.filter((e) => e.target === node.id);

  // Group outgoing by type
  const importsCount = outgoingEdges.filter((e) => e.type === "IMPORTS").length;
  const callsCount = outgoingEdges.filter((e) => e.type === "CALLS").length;
  const definesCount = outgoingEdges.filter((e) => e.type === "CONTAINS").length;

  const getNodeBadgeColor = () => {
    switch (node.type) {
      case "repository":
        return "bg-[#F62440]/10 text-[#F62440] border-[#F62440]/30";
      case "file":
        return "bg-[#FFF2DB] text-[#6B625B] border-[#FFE5BF]";
      case "class":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "function":
      case "method":
        return "bg-purple-50 text-purple-700 border-purple-200";
      default:
        return "bg-amber-50 text-amber-700 border-amber-200";
    }
  };

  return (
    <div className="rounded-2xl border border-[#FFE5BF] bg-white p-5 shadow-sm space-y-4 text-[#211c1d]">
      {/* Header */}
      <div className="flex items-start justify-between gap-2 pb-3 border-b border-[#FFE5BF]/80">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1.5">
            <span
              className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase border ${getNodeBadgeColor()}`}
            >
              {node.type}
            </span>
            {node.language && (
              <span className="text-[10px] font-mono text-[#73666b] bg-[#FFF2DB] px-1.5 py-0.5 rounded border border-[#FFE5BF] font-semibold">
                {node.language}
              </span>
            )}
          </div>

          <h3 className="font-bold text-sm font-mono truncate text-[#211c1d]" title={node.name}>
            {node.name}
          </h3>

          {node.filePath && (
            <p className="text-[11px] font-mono text-[#73666b] truncate mt-0.5" title={node.filePath}>
              {node.filePath}
              {node.lineStart ? ` (L${node.lineStart}–L${node.lineEnd || node.lineStart})` : ""}
            </p>
          )}
        </div>

        {onClose && (
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-[#FFF2DB] text-[#73666b] hover:text-[#211c1d] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Primary Action Buttons (Expand, Focus, Open Source) */}
      <div className="grid grid-cols-2 gap-2">
        <Button
          onClick={() => {
            if (isExpanded) {
              onCollapseNode(node.id);
            } else {
              onExpandNode(node.id);
            }
          }}
          variant="outline"
          size="sm"
          className="rounded-xl border-[#FFE5BF] bg-[#FFFAF3] hover:bg-[#FFF2DB] text-xs font-semibold text-[#211c1d] flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
        >
          {isExpanded ? <Minus className="w-3.5 h-3.5 text-[#F62440]" /> : <Plus className="w-3.5 h-3.5 text-[#F62440]" />}
          {isExpanded ? "Collapse" : "Expand"}
        </Button>

        <Button
          onClick={() => onToggleFocus(node.id)}
          variant="outline"
          size="sm"
          className={`rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer shadow-xs ${
            isFocused
              ? "bg-[#F62440] text-white border-[#F62440] hover:bg-[#de1832]"
              : "border-[#FFE5BF] bg-[#FFFAF3] hover:bg-[#FFF2DB] text-[#211c1d]"
          }`}
        >
          <Crosshair className="w-3.5 h-3.5" />
          {isFocused ? "Exit Focus" : "Focus"}
        </Button>
      </div>

      {/* Description / AST Summary */}
      {node.description && (
        <div className="p-3 rounded-xl bg-[#FFFAF3] border border-[#FFE5BF] text-xs text-[#73666b] leading-relaxed">
          {node.description}
        </div>
      )}

      {/* Symbol Metrics */}
      <div className="grid grid-cols-3 gap-2 text-xs font-mono text-center">
        <div className="p-2.5 rounded-xl bg-[#FFF2DB]/50 border border-[#FFE5BF]/60">
          <div className="text-[10px] text-[#73666b]">Imports</div>
          <div className="font-bold text-sm text-[#5B7083]">{importsCount}</div>
        </div>
        <div className="p-2.5 rounded-xl bg-[#FFF2DB]/50 border border-[#FFE5BF]/60">
          <div className="text-[10px] text-[#73666b]">Calls / Defs</div>
          <div className="font-bold text-sm text-[#8B5CF6]">{callsCount || definesCount}</div>
        </div>
        <div className="p-2.5 rounded-xl bg-[#FFF2DB]/50 border border-[#FFE5BF]/60">
          <div className="text-[10px] text-[#73666b]">Callers</div>
          <div className="font-bold text-sm text-[#F62440]">{incomingEdges.length}</div>
        </div>
      </div>

      {/* Outgoing Relationships */}
      <div className="space-y-1.5 text-xs font-mono">
        <div className="font-bold text-[#73666b] uppercase text-[10px] flex items-center justify-between">
          <span className="flex items-center gap-1">
            <ArrowRight className="w-3 h-3 text-[#F62440]" />
            Direct Dependencies ({outgoingEdges.length})
          </span>
          {outgoingEdges.length > 0 && !isExpanded && (
            <button
              onClick={() => onExpandNode(node.id)}
              className="text-[#F62440] hover:underline cursor-pointer text-[10px]"
            >
              Expand All
            </button>
          )}
        </div>
        {outgoingEdges.length > 0 ? (
          <div className="space-y-1 max-h-36 overflow-y-auto pr-1">
            {outgoingEdges.map((e) => {
              const targetName = e.target.split(":").slice(-1)[0] || e.target;
              return (
                <div
                  key={e.id}
                  onClick={() => onSelectNodeById(e.target)}
                  className="p-2 rounded-xl bg-[#FFFAF3] hover:bg-[#FFF2DB] border border-[#FFE5BF]/70 text-xs flex items-center justify-between cursor-pointer transition-colors"
                >
                  <span className="truncate max-w-[150px] text-[#211c1d] font-semibold" title={targetName}>
                    → {targetName}
                  </span>
                  <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-white text-[#73666b] border border-[#FFE5BF] font-bold">
                    {e.type}
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-[11px] text-[#a8999e] italic p-2 bg-[#FFFAF3] rounded-xl border border-[#FFE5BF]/40">
            No outgoing dependencies found.
          </div>
        )}
      </div>

      {/* Inbound Dependents */}
      <div className="space-y-1.5 text-xs font-mono">
        <div className="font-bold text-[#73666b] uppercase text-[10px] flex items-center gap-1">
          <ArrowLeft className="w-3 h-3 text-[#5B7083]" />
          Inbound Callers & Users ({incomingEdges.length})
        </div>
        {incomingEdges.length > 0 ? (
          <div className="space-y-1 max-h-36 overflow-y-auto pr-1">
            {incomingEdges.map((e) => {
              const sourceName = e.source.split(":").slice(-1)[0] || e.source;
              return (
                <div
                  key={e.id}
                  onClick={() => onSelectNodeById(e.source)}
                  className="p-2 rounded-xl bg-[#FFFAF3] hover:bg-[#FFF2DB] border border-[#FFE5BF]/70 text-xs flex items-center justify-between cursor-pointer transition-colors"
                >
                  <span className="truncate max-w-[150px] text-[#211c1d] font-semibold" title={sourceName}>
                    ← {sourceName}
                  </span>
                  <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-white text-[#73666b] border border-[#FFE5BF] font-bold">
                    {e.type}
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-[11px] text-[#a8999e] italic p-2 bg-[#FFFAF3] rounded-xl border border-[#FFE5BF]/40">
            No inbound callers found.
          </div>
        )}
      </div>

      {/* Action Footer: Source Viewer & Copilot */}
      <div className="pt-3 border-t border-[#FFE5BF]/80 space-y-2">
        {node.filePath && (
          <Button
            onClick={() => {
              if (onOpenSource) {
                onOpenSource(node);
              } else {
                const searchQ = `${node.name} path:${node.filePath}`;
                window.location.href = `/dashboard/search?q=${encodeURIComponent(searchQ)}`;
              }
            }}
            variant="outline"
            size="sm"
            className="w-full text-xs font-semibold rounded-xl border-[#FFE5BF] bg-[#FFF2DB]/40 hover:bg-[#FFE5BF] text-[#211c1d] flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
          >
            <ExternalLink className="w-3.5 h-3.5 text-[#5B7083]" />
            Open in Code Search
          </Button>
        )}

        <Button
          onClick={() => onAskCopilot(node)}
          size="sm"
          className="w-full text-xs font-semibold rounded-xl bg-[#F62440] hover:bg-[#de1832] text-white flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-[#F62440]/20"
        >
          <Sparkles className="w-3.5 h-3.5" />
          Ask Copilot About Node
        </Button>
      </div>
    </div>
  );
}
