"use client";

import React, { memo } from "react";
import { Handle, Position, NodeProps } from "@xyflow/react";
import {
  FolderGit2,
  FileCode,
  Box,
  Code2,
  Layers,
  Cpu,
  Variable,
  Maximize2,
  Minimize2,
  Crosshair,
  Plus,
  Minus,
} from "lucide-react";
import { ASTGraphNode } from "@/types/ast-graph";

export interface ASTCustomNodeData {
  rawNode: ASTGraphNode;
  isSelected?: boolean;
  isDimmed?: boolean;
  isHighlighted?: boolean;
  isExpanded?: boolean;
  isFocused?: boolean;
  directNeighborsCount?: number;
  inDegree?: number;
  outDegree?: number;
  onExpandNode?: (nodeId: string) => void;
  onCollapseNode?: (nodeId: string) => void;
  onFocusNode?: (nodeId: string) => void;
}

const TYPE_CONFIG: Record<
  string,
  {
    icon: React.ComponentType<{ className?: string }>;
    badgeBg: string;
    badgeText: string;
    badgeBorder: string;
    accentColor: string;
  }
> = {
  repository: {
    icon: FolderGit2,
    badgeBg: "bg-[#F62440]/10",
    badgeText: "text-[#F62440]",
    badgeBorder: "border-[#F62440]/25",
    accentColor: "#F62440",
  },
  directory: {
    icon: Layers,
    badgeBg: "bg-[#FFE5BF]",
    badgeText: "text-[#9A5B00]",
    badgeBorder: "border-[#FFE5BF]",
    accentColor: "#E2931D",
  },
  file: {
    icon: FileCode,
    badgeBg: "bg-[#FFF2DB]",
    badgeText: "text-[#6B625B]",
    badgeBorder: "border-[#FFE5BF]",
    accentColor: "#5B7083",
  },
  class: {
    icon: Box,
    badgeBg: "bg-emerald-50 text-emerald-700",
    badgeText: "text-emerald-700",
    badgeBorder: "border-emerald-200",
    accentColor: "#10B981",
  },
  function: {
    icon: Code2,
    badgeBg: "bg-purple-50 text-purple-700",
    badgeText: "text-purple-700",
    badgeBorder: "border-purple-200",
    accentColor: "#8B5CF6",
  },
  method: {
    icon: Code2,
    badgeBg: "bg-indigo-50 text-indigo-700",
    badgeText: "text-indigo-700",
    badgeBorder: "border-indigo-200",
    accentColor: "#6366F1",
  },
  interface: {
    icon: Layers,
    badgeBg: "bg-amber-50 text-amber-700",
    badgeText: "text-amber-700",
    badgeBorder: "border-amber-200",
    accentColor: "#F59E0B",
  },
  variable: {
    icon: Variable,
    badgeBg: "bg-slate-100 text-slate-700",
    badgeText: "text-slate-700",
    badgeBorder: "border-slate-200",
    accentColor: "#64748B",
  },
  module: {
    icon: Cpu,
    badgeBg: "bg-blue-50 text-blue-700",
    badgeText: "text-blue-700",
    badgeBorder: "border-blue-200",
    accentColor: "#3B82F6",
  },
};

export const ASTCustomNode = memo(function ASTCustomNode({
  data,
  selected,
}: NodeProps) {
  const nodeData = data as unknown as ASTCustomNodeData;
  const rawNode = nodeData?.rawNode;
  if (!rawNode) return null;

  const nodeType = (rawNode.type || "file").toLowerCase();
  const config = TYPE_CONFIG[nodeType] || TYPE_CONFIG.file;
  const IconComponent = config.icon;

  const isSelected = selected || nodeData.isSelected;
  const isDimmed = nodeData.isDimmed;
  const isHighlighted = nodeData.isHighlighted;
  const isExpanded = nodeData.isExpanded;
  const isFocused = nodeData.isFocused;
  const directNeighbors = nodeData.directNeighborsCount || 0;

  return (
    <div
      className={`relative min-w-[220px] max-w-[300px] rounded-2xl border bg-white p-3.5 shadow-xs transition-all duration-200 cursor-pointer select-none group ${
        isFocused
          ? "ring-2 ring-[#F62440] border-[#F62440] bg-[#FFF2DB]/60 shadow-lg scale-[1.03]"
          : isSelected
          ? "ring-2 ring-[#F62440] border-[#F62440] bg-[#FFF2DB]/35 shadow-md scale-[1.02]"
          : isHighlighted
          ? "ring-2 ring-amber-400 border-amber-400 bg-[#FFF2DB]/20"
          : "border-[#FFE5BF] hover:border-[#F62440]/60 hover:shadow-sm"
      } ${isDimmed ? "opacity-20 pointer-events-none" : "opacity-100"}`}
    >
      {/* Target input handle (top) */}
      <Handle
        type="target"
        position={Position.Top}
        className="!w-2.5 !h-2.5 !bg-[#FFE5BF] group-hover:!bg-[#F62440] !border-white transition-colors"
      />

      {/* Node Header: Icon + Name + Type Badge */}
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <div
            className="w-7 h-7 rounded-xl flex items-center justify-center shrink-0 border"
            style={{
              backgroundColor: `${config.accentColor}15`,
              borderColor: `${config.accentColor}30`,
              color: config.accentColor,
            }}
          >
            <IconComponent className="w-4 h-4" />
          </div>

          <div className="min-w-0 flex-1">
            <span
              className="font-bold text-xs text-[#211c1d] font-mono truncate block"
              title={rawNode.name}
            >
              {rawNode.name}
            </span>
            {rawNode.filePath && (
              <span
                className="text-[10px] text-[#73666b] font-mono truncate block"
                title={rawNode.filePath}
              >
                {rawNode.filePath.split("/").slice(-2).join("/")}
              </span>
            )}
          </div>
        </div>

        {/* Type Badge */}
        <span
          className={`px-2 py-0.5 rounded-md text-[9px] font-mono font-bold uppercase tracking-wider border shrink-0 ${config.badgeBg} ${config.badgeText} ${config.badgeBorder}`}
        >
          {rawNode.type}
        </span>
      </div>

      {/* Metadata Pill Bar */}
      <div className="flex items-center justify-between text-[10px] font-mono text-[#73666b] pt-1.5 border-t border-[#FFE5BF]/60 mt-1">
        <div className="flex items-center gap-2">
          {rawNode.lineStart !== undefined && rawNode.lineStart !== null && (
            <span className="text-[10px] text-[#8C827A]">
              L{rawNode.lineStart}
              {rawNode.lineEnd ? `–${rawNode.lineEnd}` : ""}
            </span>
          )}
          {rawNode.language && (
            <span className="text-[10px] text-[#73666b] bg-[#FFF2DB] px-1 rounded border border-[#FFE5BF]/60 font-semibold">
              {rawNode.language}
            </span>
          )}
        </div>

        {/* Quick Node Action Toolbar on Hover/Select */}
        <div className="flex items-center gap-1">
          {directNeighbors > 0 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (isExpanded) {
                  nodeData.onCollapseNode?.(rawNode.id);
                } else {
                  nodeData.onExpandNode?.(rawNode.id);
                }
              }}
              className={`h-5 px-1.5 rounded-md flex items-center gap-1 text-[9px] font-bold transition-all cursor-pointer ${
                isExpanded
                  ? "bg-[#FFE5BF] text-[#F62440] hover:bg-[#F62440] hover:text-white"
                  : "bg-[#FFF2DB] text-[#211c1d] hover:bg-[#FFE5BF] border border-[#FFE5BF]"
              }`}
              title={isExpanded ? "Collapse child dependencies" : `Expand ${directNeighbors} dependencies`}
            >
              {isExpanded ? <Minus className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
              <span>{directNeighbors}</span>
            </button>
          )}

          <button
            onClick={(e) => {
              e.stopPropagation();
              nodeData.onFocusNode?.(rawNode.id);
            }}
            className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] transition-colors cursor-pointer ${
              isFocused
                ? "bg-[#F62440] text-white"
                : "bg-[#FFF2DB] text-[#73666b] hover:bg-[#FFE5BF] hover:text-[#211c1d] border border-[#FFE5BF]"
            }`}
            title={isFocused ? "Exit Focus" : "Focus on this node"}
          >
            <Crosshair className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Source output handle (bottom) */}
      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-2.5 !h-2.5 !bg-[#FFE5BF] group-hover:!bg-[#F62440] !border-white transition-colors"
      />
    </div>
  );
});
