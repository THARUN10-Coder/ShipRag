"use client";

import React, { useState } from "react";
import { RepositoryFileNode } from "@/types/copilot";
import {
  Folder,
  FolderOpen,
  FileCode,
  Search,
  CheckSquare,
  Square,
  Plus,
  Layers,
  ChevronRight,
  ChevronDown,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface FileExplorerProps {
  files: RepositoryFileNode[];
  selectedFiles: string[];
  onToggleFileContext: (path: string) => void;
  onSelectFilePreview?: (path: string) => void;
}

export function FileExplorer({
  files,
  selectedFiles,
  onToggleFileContext,
  onSelectFilePreview,
}: FileExplorerProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [openFolders, setOpenFolders] = useState<Record<string, boolean>>({
    src: true,
    "src/auth": true,
    "src/api": true,
    docs: true,
  });

  const toggleFolder = (path: string) => {
    setOpenFolders((prev) => ({ ...prev, [path]: !prev[path] }));
  };

  const renderTree = (nodes: RepositoryFileNode[]) => {
    return nodes
      .filter((n) =>
        searchTerm ? n.path.toLowerCase().includes(searchTerm.toLowerCase()) : true
      )
      .map((node) => {
        const isFolder = node.type === "folder";
        const isOpen = openFolders[node.path] ?? false;
        const isSelected = selectedFiles.includes(node.path);

        return (
          <div key={node.id} className="select-none font-mono text-xs">
            <div
              className={`flex items-center justify-between py-1 px-1.5 rounded-md hover:bg-white/5 cursor-pointer group ${
                isSelected ? "bg-indigo-600/15 text-indigo-300" : "text-gray-300"
              }`}
              onClick={() => {
                if (isFolder) {
                  toggleFolder(node.path);
                } else {
                  onSelectFilePreview?.(node.path);
                }
              }}
            >
              <div className="flex items-center gap-1.5 truncate">
                {isFolder ? (
                  <>
                    {isOpen ? (
                      <ChevronDown className="w-3.5 h-3.5 text-gray-500 shrink-0" />
                    ) : (
                      <ChevronRight className="w-3.5 h-3.5 text-gray-500 shrink-0" />
                    )}
                    <Folder className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                  </>
                ) : (
                  <>
                    <span className="w-3.5 shrink-0" />
                    <FileCode className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                  </>
                )}
                <span className="truncate">{node.name}</span>
              </div>

              {!isFolder && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleFileContext(node.path);
                  }}
                  className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-white p-0.5"
                  title="Add to Context"
                >
                  {isSelected ? (
                    <CheckSquare className="w-3.5 h-3.5 text-indigo-400" />
                  ) : (
                    <Plus className="w-3.5 h-3.5 text-gray-400" />
                  )}
                </button>
              )}
            </div>

            {/* Render sub-tree if folder is open */}
            {isFolder && isOpen && node.children && (
              <div className="pl-3 border-l border-white/5 ml-2">
                {renderTree(node.children)}
              </div>
            )}
          </div>
        );
      });
  };

  return (
    <div className="h-full flex flex-col space-y-3 pr-1 text-xs">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-white/10 shrink-0">
        <div className="flex items-center gap-2 font-mono font-bold text-white text-sm">
          <Layers className="w-4 h-4 text-indigo-400" />
          Repository Explorer
        </div>
      </div>

      {/* Search files */}
      <div className="relative shrink-0">
        <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-500" />
        <input
          type="text"
          placeholder="Search files..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-8 pr-2 py-1.5 rounded-lg border border-white/10 bg-[#060913] text-xs font-mono text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
        />
      </div>

      {/* Selected File Context Badges */}
      {selectedFiles.length > 0 && (
        <div className="p-2 rounded-lg bg-indigo-950/20 border border-indigo-500/20 space-y-1.5 shrink-0">
          <div className="text-[10px] font-mono text-indigo-300 font-bold uppercase tracking-wider">
            Active Pinned Context ({selectedFiles.length})
          </div>
          <div className="flex flex-wrap gap-1">
            {selectedFiles.map((sf) => (
              <span
                key={sf}
                onClick={() => onToggleFileContext(sf)}
                className="px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 text-[10px] font-mono cursor-pointer hover:bg-red-500/20 hover:text-red-300 transition-colors"
                title="Click to remove"
              >
                {sf.split("/").pop()} ×
              </span>
            ))}
          </div>
        </div>
      )}

      {/* File Tree List */}
      <div className="flex-1 overflow-y-auto space-y-0.5">
        {renderTree(files)}
      </div>
    </div>
  );
}
