"use client";

import React, { memo } from "react";
import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  getSmoothStepPath,
  EdgeProps,
} from "@xyflow/react";

export const ASTCustomEdge = memo(function ASTCustomEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  label,
  data,
  selected,
}: EdgeProps) {
  const edgeType = ((data?.type as string) || "CONTAINS").toUpperCase();
  const showLabels = Boolean(data?.showLabels);
  const isHighlighted = Boolean(data?.isHighlighted);
  const isDimmed = Boolean(data?.isDimmed);

  // Style variations based on relationship type
  let strokeColor = "#D4C2B0";
  let strokeDasharray = "";
  let strokeWidth = 1.5;

  if (edgeType === "IMPORTS") {
    strokeColor = "#5B7083";
    strokeDasharray = "4 4";
  } else if (edgeType === "CALLS") {
    strokeColor = "#8B5CF6";
    strokeDasharray = "3 3";
    strokeWidth = 1.8;
  } else if (edgeType === "EXTENDS" || edgeType === "IMPLEMENTS") {
    strokeColor = "#10B981";
    strokeWidth = 2;
  } else if (edgeType === "DEPENDS_ON") {
    strokeColor = "#F59E0B";
    strokeDasharray = "5 5";
  }

  if (isHighlighted || selected) {
    strokeColor = "#F62440";
    strokeWidth = 2.5;
  }

  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    borderRadius: 8,
  });

  return (
    <>
      <BaseEdge
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          ...style,
          stroke: strokeColor,
          strokeWidth,
          strokeDasharray,
          opacity: isDimmed ? 0.2 : 1,
          transition: "stroke 0.2s, stroke-width 0.2s, opacity 0.2s",
        }}
      />
      {showLabels && label && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: "absolute",
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              pointerEvents: "all",
            }}
            className={`px-1.5 py-0.5 rounded text-[9px] font-mono border transition-all ${
              isHighlighted || selected
                ? "bg-[#FFF2DB] text-[#F62440] border-[#F62440] font-bold shadow-xs"
                : "bg-white text-[#6B625B] border-[#EBDCC8]"
            }`}
          >
            {label}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
});
