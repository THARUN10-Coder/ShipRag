"use client";

import React, { useState } from "react";
import { useSettings } from "@/context/settings-context";
import { useRepository } from "@/context/repository-context";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  SlidersHorizontal,
  Bot,
  Network,
  Search,
  GitPullRequest,
  FolderGit2,
  Bell,
  Palette,
  CheckCircle2,
  RotateCcw,
  Sparkles,
  FileCode,
  AlertTriangle,
  Plus,
  Trash2,
} from "lucide-react";

type SettingsNavTab =
  | "general"
  | "ai-copilot"
  | "code-intelligence"
  | "search-rag"
  | "pr-review"
  | "repositories"
  | "notifications"
  | "appearance";

const NAV_TABS: { id: SettingsNavTab; label: string; icon: any; desc: string }[] = [
  { id: "general", label: "General", icon: SlidersHorizontal, desc: "Workspace identity & defaults" },
  { id: "ai-copilot", label: "AI Copilot", icon: Bot, desc: "Model style, grounding & responses" },
  { id: "code-intelligence", label: "Code Intelligence", icon: Network, desc: "AST graph & symbol relationships" },
  { id: "search-rag", label: "Search & RAG", icon: Search, desc: "Hybrid search, dense/BM25 & citations" },
  { id: "pr-review", label: "PR Review", icon: GitPullRequest, desc: "Automated analysis & risk scores" },
  { id: "repositories", label: "Repositories", icon: FolderGit2, desc: "Indexing, patterns & token chunking" },
  { id: "notifications", label: "Notifications", icon: Bell, desc: "Event alerts & delivery methods" },
  { id: "appearance", label: "Appearance", icon: Palette, desc: "Theme, font typography & density" },
];

export default function SettingsPage() {
  const { settings, updateSection, resetSettings, saveSettings, isSaved } = useSettings();
  const { repositories } = useRepository();
  const [activeTab, setActiveTab] = useState<SettingsNavTab>("general");
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [newIgnorePattern, setNewIgnorePattern] = useState("");

  const handleAddIgnorePattern = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newIgnorePattern.trim()) return;
    const current = settings.repositoryIndexing.ignoredPatterns;
    if (!current.includes(newIgnorePattern.trim())) {
      updateSection("repositoryIndexing", {
        ignoredPatterns: [...current, newIgnorePattern.trim()],
      });
    }
    setNewIgnorePattern("");
  };

  const handleRemoveIgnorePattern = (pattern: string) => {
    updateSection("repositoryIndexing", {
      ignoredPatterns: settings.repositoryIndexing.ignoredPatterns.filter((p) => p !== pattern),
    });
  };

  return (
    <div className="w-full space-y-6 animate-in fade-in duration-300 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#FFE5BF]/70">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#211c1d] tracking-tight flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-[#FFF2DB] text-[#F62440] border border-[#FFE5BF] shadow-xs">
              <SlidersHorizontal className="w-5 h-5" />
            </span>
            Settings
          </h1>
          <p className="text-xs sm:text-sm text-[#73666b] mt-1">
            Customize how SHIPRAG understands, searches, and reviews your code.
          </p>
        </div>

        {/* Global Action Bar */}
        <div className="flex items-center gap-2.5">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowResetConfirm(true)}
            className="rounded-xl border-[#FFE5BF] bg-white hover:bg-[#FFF2DB] text-[#73666b] hover:text-[#211c1d] text-xs font-semibold shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset to Defaults
          </Button>

          <Button
            type="button"
            size="sm"
            onClick={saveSettings}
            className="rounded-xl bg-[#F62440] hover:bg-[#de1832] text-white px-5 text-xs font-semibold shadow-md shadow-[#F62440]/25 flex items-center gap-1.5 cursor-pointer"
          >
            {isSaved ? <CheckCircle2 className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
            {isSaved ? "Saved Successfully" : "Save Changes"}
          </Button>
        </div>
      </div>

      {/* Reset Confirmation Modal */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl border border-[#FFE5BF] bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#211c1d]">Reset All Settings?</h3>
                <p className="text-xs text-[#73666b] mt-1 leading-relaxed">
                  Reset all SHIPRAG developer preferences and AI configuration to their default values?
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-[#FFE5BF]/60">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowResetConfirm(false)}
                className="rounded-xl border-[#FFE5BF] text-xs"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  resetSettings();
                  setShowResetConfirm(false);
                }}
                className="rounded-xl bg-[#F62440] hover:bg-[#de1832] text-white text-xs font-semibold"
              >
                Confirm Reset
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Main 2-Column Responsive Layout using flex */}
      <div className="flex flex-col lg:flex-row gap-6 items-start w-full">
        
        {/* Left Side Settings Navigation */}
        <div className="w-full lg:w-[280px] shrink-0 bg-white p-2 rounded-2xl border border-[#FFE5BF] shadow-xs">
          <div className="px-3 py-2 text-[10px] font-bold text-[#73666b] uppercase tracking-wider">
            Preferences Navigation
          </div>

          {/* Navigation Items */}
          <div className="flex lg:flex-col gap-1.5 overflow-x-auto lg:overflow-visible pb-1 lg:pb-0 scrollbar-none">
            {NAV_TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-left transition-all shrink-0 cursor-pointer ${
                    isActive
                      ? "bg-[#FFE5BF] text-[#F62440] font-bold shadow-xs border border-[#FFE5BF]"
                      : "text-[#5e5356] hover:text-[#211c1d] hover:bg-[#FFF2DB]/60"
                  }`}
                >
                  <Icon
                    className={`w-4 h-4 shrink-0 transition-transform ${
                      isActive ? "text-[#F62440] scale-110" : "text-[#7a6e72]"
                    }`}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-bold truncate">{tab.label}</div>
                    <div className="text-[11px] text-[#73666b] font-normal truncate hidden lg:block">
                      {tab.desc}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Side Settings Content Cards */}
        <div className="flex-1 w-full min-w-0 space-y-6">

          {/* 1. GENERAL SETTINGS */}
          {activeTab === "general" && (
            <div className="space-y-5 animate-in fade-in">
              <Card className="p-6 sm:p-8 border-[#FFE5BF] bg-white shadow-xs space-y-6">
                <div className="border-b border-[#FFE5BF]/60 pb-3">
                  <h2 className="text-lg font-bold text-[#211c1d] flex items-center gap-2">
                    <SlidersHorizontal className="w-5 h-5 text-[#F62440]" />
                    General Settings
                  </h2>
                  <p className="text-xs text-[#73666b] mt-0.5">
                    Basic workspace configuration, default repositories, and branch scopes.
                  </p>
                </div>

                <div className="space-y-5 text-xs">
                  <div>
                    <label className="font-semibold text-[#211c1d] block mb-1.5 text-xs">
                      Workspace Name
                    </label>
                    <input
                      type="text"
                      value={settings.general.workspaceName}
                      onChange={(e) =>
                        updateSection("general", { workspaceName: e.target.value })
                      }
                      placeholder="e.g. SHIPRAG Production Workspace"
                      className="w-full p-3 rounded-xl border border-[#FFE5BF] bg-[#FFFAF3] text-[#211c1d] text-xs focus:outline-none focus:border-[#F62440]"
                    />
                    <span className="text-[11px] text-[#73666b] mt-1 block">
                      The display name of your code intelligence workspace.
                    </span>
                  </div>

                  <div>
                    <label className="font-semibold text-[#211c1d] block mb-1.5 text-xs">
                      Description
                    </label>
                    <input
                      type="text"
                      value={settings.general.description}
                      onChange={(e) =>
                        updateSection("general", { description: e.target.value })
                      }
                      placeholder="My development workspace"
                      className="w-full p-3 rounded-xl border border-[#FFE5BF] bg-[#FFFAF3] text-[#211c1d] text-xs focus:outline-none focus:border-[#F62440]"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="font-semibold text-[#211c1d] block mb-1.5 text-xs">
                        Default Repository
                      </label>
                      <select
                        value={settings.general.defaultRepository}
                        onChange={(e) =>
                          updateSection("general", { defaultRepository: e.target.value })
                        }
                        className="w-full p-3 rounded-xl border border-[#FFE5BF] bg-[#FFFAF3] text-[#211c1d] text-xs focus:outline-none focus:border-[#F62440] cursor-pointer"
                      >
                        <option value="all">All Workspace Repositories</option>
                        {repositories.map((repo) => (
                          <option key={repo.id} value={repo.id}>
                            {repo.name}
                          </option>
                        ))}
                      </select>
                      <span className="text-[11px] text-[#73666b] mt-1 block">
                        Repository focused on initial login.
                      </span>
                    </div>

                    <div>
                      <label className="font-semibold text-[#211c1d] block mb-1.5 text-xs">
                        Default Branch
                      </label>
                      <select
                        value={settings.general.defaultBranch}
                        onChange={(e) =>
                          updateSection("general", { defaultBranch: e.target.value })
                        }
                        className="w-full p-3 rounded-xl border border-[#FFE5BF] bg-[#FFFAF3] text-[#211c1d] text-xs focus:outline-none focus:border-[#F62440] cursor-pointer"
                      >
                        <option value="main">main</option>
                        <option value="master">master</option>
                        <option value="develop">develop</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="font-semibold text-[#211c1d] block mb-1.5 text-xs">
                      Default Language
                    </label>
                    <select
                      value={settings.general.defaultLanguage}
                      onChange={(e) =>
                        updateSection("general", { defaultLanguage: e.target.value })
                      }
                      className="w-full p-3 rounded-xl border border-[#FFE5BF] bg-[#FFFAF3] text-[#211c1d] text-xs focus:outline-none focus:border-[#F62440] cursor-pointer"
                    >
                      <option value="auto">Auto Detect</option>
                      <option value="TypeScript">TypeScript / JavaScript</option>
                      <option value="Python">Python</option>
                      <option value="Go">Go</option>
                      <option value="Rust">Rust</option>
                      <option value="Java">Java</option>
                    </select>
                  </div>

                  {/* Code Context Scope */}
                  <div className="pt-3 border-t border-[#FFE5BF]/40">
                    <label className="font-semibold text-[#211c1d] block mb-2 text-xs">
                      Code Context Scope
                    </label>
                    <div className="space-y-2.5">
                      <label className="flex items-start gap-3 p-3.5 rounded-xl border border-[#FFE5BF] bg-[#FFFAF3] hover:bg-[#FFF2DB]/60 cursor-pointer transition-colors">
                        <input
                          type="radio"
                          name="contextScope"
                          value="current"
                          checked={settings.general.contextScope === "current"}
                          onChange={() =>
                            updateSection("general", { contextScope: "current" })
                          }
                          className="w-4 h-4 mt-0.5 text-[#F62440] focus:ring-[#F62440]"
                        />
                        <div>
                          <div className="font-bold text-xs text-[#211c1d]">Current Repository</div>
                          <div className="text-[11px] text-[#73666b] mt-0.5">
                            Limit queries and search strictly to the currently selected active repository.
                          </div>
                        </div>
                      </label>

                      <label className="flex items-start gap-3 p-3.5 rounded-xl border border-[#FFE5BF] bg-[#FFFAF3] hover:bg-[#FFF2DB]/60 cursor-pointer transition-colors">
                        <input
                          type="radio"
                          name="contextScope"
                          value="all"
                          checked={settings.general.contextScope === "all"}
                          onChange={() =>
                            updateSection("general", { contextScope: "all" })
                          }
                          className="w-4 h-4 mt-0.5 text-[#F62440] focus:ring-[#F62440]"
                        />
                        <div>
                          <div className="font-bold text-xs text-[#211c1d]">All Workspace Repositories</div>
                          <div className="text-[11px] text-[#73666b] mt-0.5">
                            Allow cross-repository RAG retrieval across your entire connected organization.
                          </div>
                        </div>
                      </label>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-3 border-t border-[#FFE5BF]/60">
                  <Button
                    onClick={saveSettings}
                    size="sm"
                    className="rounded-xl bg-[#F62440] hover:bg-[#de1832] text-white text-xs font-semibold px-6 cursor-pointer"
                  >
                    {isSaved ? "Saved!" : "Save Changes"}
                  </Button>
                </div>
              </Card>
            </div>
          )}

          {/* 2. AI COPILOT SETTINGS */}
          {activeTab === "ai-copilot" && (
            <div className="space-y-5 animate-in fade-in">
              <Card className="p-6 sm:p-8 border-[#FFE5BF] bg-white shadow-xs space-y-6">
                <div className="border-b border-[#FFE5BF]/60 pb-3">
                  <h2 className="text-lg font-bold text-[#211c1d] flex items-center gap-2">
                    <Bot className="w-5 h-5 text-[#F62440]" />
                    AI Copilot Settings
                  </h2>
                  <p className="text-xs text-[#73666b] mt-0.5">
                    Customize response style, explanation depth, and grounding behavior.
                  </p>
                </div>

                <div className="space-y-5 text-xs">
                  {/* Response Style */}
                  <div>
                    <label className="font-semibold text-[#211c1d] block mb-2 text-xs">
                      Response Style
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {(["concise", "balanced", "detailed"] as const).map((style) => (
                        <button
                          key={style}
                          type="button"
                          onClick={() =>
                            updateSection("aiCopilot", { responseStyle: style })
                          }
                          className={`p-3 rounded-xl border text-center transition-all cursor-pointer capitalize font-bold text-xs ${
                            settings.aiCopilot.responseStyle === style
                              ? "bg-[#FFE5BF] border-[#F62440] text-[#F62440] shadow-xs"
                              : "border-[#FFE5BF] bg-[#FFFAF3] text-[#5e5356] hover:bg-[#FFF2DB]/70"
                          }`}
                        >
                          {style}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Explanation Level */}
                  <div>
                    <label className="font-semibold text-[#211c1d] block mb-2 text-xs">
                      Explanation Level
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {(["beginner", "developer", "expert"] as const).map((lvl) => (
                        <button
                          key={lvl}
                          type="button"
                          onClick={() =>
                            updateSection("aiCopilot", { explanationLevel: lvl })
                          }
                          className={`p-3 rounded-xl border text-center transition-all cursor-pointer capitalize font-bold text-xs ${
                            settings.aiCopilot.explanationLevel === lvl
                              ? "bg-[#FFE5BF] border-[#F62440] text-[#F62440] shadow-xs"
                              : "border-[#FFE5BF] bg-[#FFFAF3] text-[#5e5356] hover:bg-[#FFF2DB]/70"
                          }`}
                        >
                          {lvl}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Response Format Checkboxes */}
                  <div className="pt-2 border-t border-[#FFE5BF]/40">
                    <label className="font-semibold text-[#211c1d] block mb-2.5 text-xs">
                      Response Format & Content
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {[
                        { key: "includeCodeExamples", label: "Include code examples" },
                        { key: "explainReasoning", label: "Explain reasoning & architecture" },
                        { key: "showSourceFiles", label: "Show source files" },
                        { key: "showLineReferences", label: "Show line references" },
                        { key: "includeRelatedSymbols", label: "Include related symbols" },
                        { key: "suggestImprovements", label: "Suggest improvements" },
                        { key: "suggestFollowUp", label: "Suggest follow-up questions" },
                        { key: "allowCodeGeneration", label: "Allow code generation & refactoring" },
                      ].map((item) => (
                        <label
                          key={item.key}
                          className="flex items-center gap-2.5 p-3 rounded-xl border border-[#FFE5BF] bg-[#FFFAF3] hover:bg-[#FFF2DB]/50 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={!!(settings.aiCopilot as any)[item.key]}
                            onChange={(e) =>
                              updateSection("aiCopilot", {
                                [item.key]: e.target.checked,
                              })
                            }
                            className="w-4 h-4 rounded border-[#FFE5BF] text-[#F62440] focus:ring-[#F62440]"
                          />
                          <span className="text-[#211c1d] font-semibold text-xs">{item.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Grounding Mode */}
                  <div className="pt-2 border-t border-[#FFE5BF]/40">
                    <label className="font-semibold text-[#211c1d] block mb-2 text-xs">
                      Grounding Mode & Knowledge Source
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <label
                        className={`p-4 rounded-xl border cursor-pointer transition-all flex items-start gap-3 ${
                          settings.aiCopilot.groundingMode === "strict"
                            ? "bg-[#FFE5BF]/50 border-[#F62440] text-[#211c1d]"
                            : "bg-[#FFFAF3] border-[#FFE5BF] text-[#5e5356]"
                        }`}
                      >
                        <input
                          type="radio"
                          name="groundingMode"
                          value="strict"
                          checked={settings.aiCopilot.groundingMode === "strict"}
                          onChange={() =>
                            updateSection("aiCopilot", { groundingMode: "strict" })
                          }
                          className="mt-0.5 w-4 h-4 text-[#F62440]"
                        />
                        <div>
                          <div className="font-bold text-xs text-[#211c1d]">
                            Strict Grounding (Recommended)
                          </div>
                          <div className="text-[11px] text-[#73666b] mt-1 leading-relaxed">
                            Answer strictly using verified chunks from the indexed repository. Refuse hallucinated code.
                          </div>
                        </div>
                      </label>

                      <label
                        className={`p-4 rounded-xl border cursor-pointer transition-all flex items-start gap-3 ${
                          settings.aiCopilot.groundingMode === "balanced"
                            ? "bg-[#FFE5BF]/50 border-[#F62440] text-[#211c1d]"
                            : "bg-[#FFFAF3] border-[#FFE5BF] text-[#5e5356]"
                        }`}
                      >
                        <input
                          type="radio"
                          name="groundingMode"
                          value="balanced"
                          checked={settings.aiCopilot.groundingMode === "balanced"}
                          onChange={() =>
                            updateSection("aiCopilot", { groundingMode: "balanced" })
                          }
                          className="mt-0.5 w-4 h-4 text-[#F62440]"
                        />
                        <div>
                          <div className="font-bold text-xs text-[#211c1d]">
                            Balanced Grounding
                          </div>
                          <div className="text-[11px] text-[#73666b] mt-1 leading-relaxed">
                            Blend repository context with general programming knowledge and standard library patterns.
                          </div>
                        </div>
                      </label>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-3 border-t border-[#FFE5BF]/60">
                  <Button
                    onClick={saveSettings}
                    size="sm"
                    className="rounded-xl bg-[#F62440] hover:bg-[#de1832] text-white text-xs font-semibold px-6 cursor-pointer"
                  >
                    {isSaved ? "Saved!" : "Save Changes"}
                  </Button>
                </div>
              </Card>
            </div>
          )}

          {/* 3. CODE INTELLIGENCE SETTINGS */}
          {activeTab === "code-intelligence" && (
            <div className="space-y-5 animate-in fade-in">
              <Card className="p-6 sm:p-8 border-[#FFE5BF] bg-white shadow-xs space-y-6">
                <div className="border-b border-[#FFE5BF]/60 pb-3 flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-bold text-[#211c1d] flex items-center gap-2">
                      <Network className="w-5 h-5 text-[#F62440]" />
                      Code Intelligence & AST Analysis
                    </h2>
                    <p className="text-xs text-[#73666b] mt-0.5">
                      Control AST syntax parsing, graph layout, and symbol relationship extraction.
                    </p>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer font-bold text-xs">
                    <span className="text-[#211c1d]">AST Analysis</span>
                    <input
                      type="checkbox"
                      checked={settings.codeIntelligence.enableAstAnalysis}
                      onChange={(e) =>
                        updateSection("codeIntelligence", {
                          enableAstAnalysis: e.target.checked,
                        })
                      }
                      className="w-4 h-4 rounded text-[#F62440] focus:ring-[#F62440]"
                    />
                  </label>
                </div>

                <div className="space-y-5 text-xs">
                  {/* Symbols Analyzed */}
                  <div>
                    <label className="font-semibold text-[#211c1d] block mb-2.5 text-xs">
                      Analyzed Code Constructs & Relationships
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {[
                        { key: "analyzeFunctions", label: "Functions & Methods" },
                        { key: "analyzeClasses", label: "Classes & Interfaces" },
                        { key: "analyzeImports", label: "Imports & Module Exports" },
                        { key: "analyzeCalls", label: "Function Call Invocations" },
                        { key: "analyzeDependencies", label: "Package Dependencies" },
                        { key: "analyzeCrossFile", label: "Cross-file Relationships" },
                        { key: "analyzeCrossRepo", label: "Cross-repository Dependencies" },
                      ].map((item) => (
                        <label
                          key={item.key}
                          className="flex items-center gap-2.5 p-3 rounded-xl border border-[#FFE5BF] bg-[#FFFAF3] hover:bg-[#FFF2DB]/50 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={!!(settings.codeIntelligence as any)[item.key]}
                            onChange={(e) =>
                              updateSection("codeIntelligence", {
                                [item.key]: e.target.checked,
                              })
                            }
                            className="w-4 h-4 rounded text-[#F62440] focus:ring-[#F62440]"
                          />
                          <span className="text-[#211c1d] font-semibold text-xs">{item.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Graph Depth & Layout */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-[#FFE5BF]/40">
                    <div>
                      <label className="font-semibold text-[#211c1d] block mb-1.5 text-xs">
                        Graph Traversal Depth
                      </label>
                      <select
                        value={settings.codeIntelligence.graphDepth}
                        onChange={(e) =>
                          updateSection("codeIntelligence", {
                            graphDepth: parseInt(e.target.value) || 3,
                          })
                        }
                        className="w-full p-3 rounded-xl border border-[#FFE5BF] bg-[#FFFAF3] text-[#211c1d] text-xs focus:outline-none focus:border-[#F62440] cursor-pointer"
                      >
                        <option value={1}>1 Level (Immediate calls)</option>
                        <option value={2}>2 Levels</option>
                        <option value={3}>3 Levels (Recommended)</option>
                        <option value={4}>4 Levels (Deep traversal)</option>
                        <option value={5}>5 Levels (Full system trace)</option>
                      </select>
                    </div>

                    <div>
                      <label className="font-semibold text-[#211c1d] block mb-1.5 text-xs">
                        Default Graph Layout
                      </label>
                      <select
                        value={settings.codeIntelligence.defaultGraphLayout}
                        onChange={(e) =>
                          updateSection("codeIntelligence", {
                            defaultGraphLayout: e.target.value as any,
                          })
                        }
                        className="w-full p-3 rounded-xl border border-[#FFE5BF] bg-[#FFFAF3] text-[#211c1d] text-xs focus:outline-none focus:border-[#F62440] cursor-pointer"
                      >
                        <option value="hierarchical">Hierarchical (Top-Down Dagre)</option>
                        <option value="force-directed">Force Directed</option>
                        <option value="radial">Radial Tree</option>
                      </select>
                    </div>
                  </div>

                  {/* Node & Edge Visibility */}
                  <div className="pt-2 border-t border-[#FFE5BF]/40">
                    <label className="font-semibold text-[#211c1d] block mb-2 text-xs">
                      Code Graph Node & Edge Visibility
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                      {[
                        { key: "showFileNodes", label: "File nodes" },
                        { key: "showFunctionNodes", label: "Function nodes" },
                        { key: "showClassNodes", label: "Class nodes" },
                        { key: "showDependencyEdges", label: "Dependency edges" },
                        { key: "showImportEdges", label: "Import relationships" },
                        { key: "showCallEdges", label: "Call relationships" },
                      ].map((item) => (
                        <label
                          key={item.key}
                          className="flex items-center gap-2 p-2.5 rounded-xl border border-[#FFE5BF] bg-[#FFFAF3] hover:bg-[#FFF2DB]/50 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={!!(settings.codeIntelligence as any)[item.key]}
                            onChange={(e) =>
                              updateSection("codeIntelligence", {
                                [item.key]: e.target.checked,
                              })
                            }
                            className="w-3.5 h-3.5 rounded text-[#F62440] focus:ring-[#F62440]"
                          />
                          <span className="text-[#211c1d] text-xs font-semibold">{item.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-3 border-t border-[#FFE5BF]/60">
                  <Button
                    onClick={saveSettings}
                    size="sm"
                    className="rounded-xl bg-[#F62440] hover:bg-[#de1832] text-white text-xs font-semibold px-6 cursor-pointer"
                  >
                    {isSaved ? "Saved!" : "Save Changes"}
                  </Button>
                </div>
              </Card>
            </div>
          )}

          {/* 4. SEARCH & RAG SETTINGS */}
          {activeTab === "search-rag" && (
            <div className="space-y-5 animate-in fade-in">
              <Card className="p-6 sm:p-8 border-[#FFE5BF] bg-white shadow-xs space-y-6">
                <div className="border-b border-[#FFE5BF]/60 pb-3">
                  <h2 className="text-lg font-bold text-[#211c1d] flex items-center gap-2">
                    <Search className="w-5 h-5 text-[#F62440]" />
                    Search & RAG Retrieval
                  </h2>
                  <p className="text-xs text-[#73666b] mt-0.5">
                    Configure hybrid search weights, BM25 keyword matching, and citation badges.
                  </p>
                </div>

                <div className="space-y-5 text-xs">
                  {/* Search Strategy */}
                  <div>
                    <label className="font-semibold text-[#211c1d] block mb-2 text-xs">
                      Search Strategy
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {(["hybrid", "semantic", "keyword"] as const).map((strat) => (
                        <button
                          key={strat}
                          type="button"
                          onClick={() =>
                            updateSection("searchRag", { searchStrategy: strat })
                          }
                          className={`p-3 rounded-xl border text-center transition-all cursor-pointer capitalize font-bold text-xs ${
                            settings.searchRag.searchStrategy === strat
                              ? "bg-[#FFE5BF] border-[#F62440] text-[#F62440] shadow-xs"
                              : "border-[#FFE5BF] bg-[#FFFAF3] text-[#5e5356] hover:bg-[#FFF2DB]/70"
                          }`}
                        >
                          {strat}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Dense & BM25 Weight Sliders */}
                  <div className="p-5 rounded-xl border border-[#FFE5BF] bg-[#FFFAF3] space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-[#211c1d]">Hybrid Search Weighting</span>
                      <span className="font-mono text-xs text-[#F62440] font-bold">
                        Dense: {settings.searchRag.denseWeight}% · BM25: {settings.searchRag.bm25Weight}%
                      </span>
                    </div>

                    {/* Visual Bar representation */}
                    <div className="space-y-3 font-mono text-xs">
                      <div>
                        <div className="flex justify-between mb-1.5 text-[#5e5356]">
                          <span>Dense Embedding Vector</span>
                          <span className="font-bold text-[#211c1d]">{settings.searchRag.denseWeight}%</span>
                        </div>
                        <input
                          type="range"
                          min={0}
                          max={100}
                          value={settings.searchRag.denseWeight}
                          onChange={(e) => {
                            const val = parseInt(e.target.value);
                            updateSection("searchRag", {
                              denseWeight: val,
                              bm25Weight: 100 - val,
                            });
                          }}
                          className="w-full accent-[#F62440] cursor-pointer"
                        />
                      </div>

                      <div>
                        <div className="flex justify-between mb-1.5 text-[#5e5356]">
                          <span>BM25 Full-Text Lexical</span>
                          <span className="font-bold text-[#211c1d]">{settings.searchRag.bm25Weight}%</span>
                        </div>
                        <input
                          type="range"
                          min={0}
                          max={100}
                          value={settings.searchRag.bm25Weight}
                          onChange={(e) => {
                            const val = parseInt(e.target.value);
                            updateSection("searchRag", {
                              bm25Weight: val,
                              denseWeight: 100 - val,
                            });
                          }}
                          className="w-full accent-[#F62440] cursor-pointer"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Top K & Relevance */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-[#FFE5BF]/40">
                    <div>
                      <label className="font-semibold text-[#211c1d] block mb-1.5 text-xs">
                        Top K Results
                      </label>
                      <select
                        value={settings.searchRag.topK}
                        onChange={(e) =>
                          updateSection("searchRag", {
                            topK: parseInt(e.target.value) || 10,
                          })
                        }
                        className="w-full p-3 rounded-xl border border-[#FFE5BF] bg-[#FFFAF3] text-[#211c1d] text-xs focus:outline-none focus:border-[#F62440] cursor-pointer"
                      >
                        <option value={4}>4 Chunks</option>
                        <option value={10}>10 Chunks (Default)</option>
                        <option value={15}>15 Chunks</option>
                        <option value={20}>20 Chunks</option>
                      </select>
                    </div>

                    <div>
                      <label className="font-semibold text-[#211c1d] block mb-1.5 text-xs">
                        Minimum Relevance Score
                      </label>
                      <input
                        type="number"
                        step="0.05"
                        min="0.1"
                        max="0.9"
                        value={settings.searchRag.minRelevanceScore}
                        onChange={(e) =>
                          updateSection("searchRag", {
                            minRelevanceScore: parseFloat(e.target.value) || 0.35,
                          })
                        }
                        className="w-full p-3 rounded-xl border border-[#FFE5BF] bg-[#FFFAF3] text-[#211c1d] text-xs focus:outline-none focus:border-[#F62440]"
                      />
                    </div>

                    <div>
                      <label className="font-semibold text-[#211c1d] block mb-1.5 text-xs">
                        Re-ranking Engine
                      </label>
                      <label className="flex items-center gap-2 p-3 rounded-xl border border-[#FFE5BF] bg-[#FFFAF3] cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings.searchRag.reRanking}
                          onChange={(e) =>
                            updateSection("searchRag", {
                              reRanking: e.target.checked,
                            })
                          }
                          className="w-4 h-4 rounded text-[#F62440] focus:ring-[#F62440]"
                        />
                        <span className="font-semibold text-[#211c1d]">Cross-Encoder ON</span>
                      </label>
                    </div>
                  </div>

                  {/* Context Expansion */}
                  <div className="pt-2 border-t border-[#FFE5BF]/40">
                    <label className="font-semibold text-[#211c1d] block mb-2 text-xs">
                      Context Expansion & Enrichment
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      {[
                        { key: "expandRelatedFiles", label: "Expand related files" },
                        { key: "expandRelatedSymbols", label: "Expand related symbols" },
                        { key: "includeDocumentation", label: "Include docstrings & markdown" },
                      ].map((item) => (
                        <label
                          key={item.key}
                          className="flex items-center gap-2.5 p-3 rounded-xl border border-[#FFE5BF] bg-[#FFFAF3] hover:bg-[#FFF2DB]/50 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={!!(settings.searchRag as any)[item.key]}
                            onChange={(e) =>
                              updateSection("searchRag", {
                                [item.key]: e.target.checked,
                              })
                            }
                            className="w-4 h-4 rounded text-[#F62440] focus:ring-[#F62440]"
                          />
                          <span className="text-[#211c1d] font-semibold text-xs">{item.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Grounded Citations Subsection */}
                  <div className="pt-4 border-t border-[#FFE5BF]/60 space-y-3">
                    <h3 className="font-bold text-xs text-[#211c1d] flex items-center gap-1.5">
                      <FileCode className="w-4 h-4 text-[#F62440]" />
                      Grounded Citations & Source Previews
                    </h3>

                    <div>
                      <label className="font-semibold text-[#211c1d] block mb-2 text-xs">
                        Citation Mode
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                        {[
                          { id: "always", label: "Always cite sources" },
                          { id: "relevant", label: "Cite when relevant" },
                          { id: "hidden", label: "Hide citations" },
                        ].map((m) => (
                          <button
                            key={m.id}
                            type="button"
                            onClick={() =>
                              updateSection("citations", { citationMode: m.id as any })
                            }
                            className={`p-3 rounded-xl border text-center font-bold text-xs transition-all cursor-pointer ${
                              settings.citations.citationMode === m.id
                                ? "bg-[#FFE5BF] border-[#F62440] text-[#F62440]"
                                : "border-[#FFE5BF] bg-[#FFFAF3] text-[#5e5356]"
                            }`}
                          >
                            {m.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2">
                      {[
                        { key: "showRepository", label: "Repository name" },
                        { key: "showFilePath", label: "File path" },
                        { key: "showLineNumbers", label: "Line numbers" },
                        { key: "showRelevanceScore", label: "Relevance %" },
                      ].map((item) => (
                        <label
                          key={item.key}
                          className="flex items-center gap-2 p-2.5 rounded-xl border border-[#FFE5BF] bg-[#FFFAF3] cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={!!(settings.citations as any)[item.key]}
                            onChange={(e) =>
                              updateSection("citations", {
                                [item.key]: e.target.checked,
                              })
                            }
                            className="w-3.5 h-3.5 rounded text-[#F62440]"
                          />
                          <span className="text-xs font-semibold text-[#211c1d]">{item.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-3 border-t border-[#FFE5BF]/60">
                  <Button
                    onClick={saveSettings}
                    size="sm"
                    className="rounded-xl bg-[#F62440] hover:bg-[#de1832] text-white text-xs font-semibold px-6 cursor-pointer"
                  >
                    {isSaved ? "Saved!" : "Save Changes"}
                  </Button>
                </div>
              </Card>
            </div>
          )}

          {/* 5. PR REVIEW SETTINGS */}
          {activeTab === "pr-review" && (
            <div className="space-y-5 animate-in fade-in">
              <Card className="p-6 sm:p-8 border-[#FFE5BF] bg-white shadow-xs space-y-6">
                <div className="border-b border-[#FFE5BF]/60 pb-3">
                  <h2 className="text-lg font-bold text-[#211c1d] flex items-center gap-2">
                    <GitPullRequest className="w-5 h-5 text-[#F62440]" />
                    Pull Request Intelligence & Review
                  </h2>
                  <p className="text-xs text-[#73666b] mt-0.5">
                    Define automated PR review strictness, vulnerability categories, and risk thresholds.
                  </p>
                </div>

                <div className="space-y-5 text-xs">
                  {/* Review Severity Levels */}
                  <div>
                    <label className="font-semibold text-[#211c1d] block mb-2 text-xs">
                      Review Severity Levels Included
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                      {[
                        { key: "critical", label: "Critical Risk", color: "text-rose-600" },
                        { key: "high", label: "High Risk", color: "text-[#F62440]" },
                        { key: "medium", label: "Medium Warning", color: "text-amber-600" },
                        { key: "low", label: "Low / Suggestion", color: "text-blue-600" },
                      ].map((item) => (
                        <label
                          key={item.key}
                          className="flex items-center gap-2 p-3 rounded-xl border border-[#FFE5BF] bg-[#FFFAF3] cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={!!(settings.prReview.severities as any)[item.key]}
                            onChange={(e) =>
                              updateSection("prReview", {
                                severities: {
                                  ...settings.prReview.severities,
                                  [item.key]: e.target.checked,
                                },
                              })
                            }
                            className="w-4 h-4 rounded text-[#F62440]"
                          />
                          <span className={`font-bold text-xs ${item.color}`}>{item.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Review Categories */}
                  <div className="pt-2 border-t border-[#FFE5BF]/40">
                    <label className="font-semibold text-[#211c1d] block mb-2 text-xs">
                      Active Review Inspection Categories
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      {[
                        { key: "security", label: "Security & Secrets" },
                        { key: "bugs", label: "Logic Bugs & Edge Cases" },
                        { key: "performance", label: "Performance & Leaks" },
                        { key: "reliability", label: "Reliability & Concurrency" },
                        { key: "codeQuality", label: "Code Quality & Clean Code" },
                        { key: "dependencies", label: "Package Dependencies" },
                        { key: "architecture", label: "Architectural Integrity" },
                        { key: "maintainability", label: "Maintainability" },
                        { key: "testing", label: "Test Coverage & Mocks" },
                      ].map((item) => (
                        <label
                          key={item.key}
                          className="flex items-center gap-2.5 p-3 rounded-xl border border-[#FFE5BF] bg-[#FFFAF3] hover:bg-[#FFF2DB]/50 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={!!(settings.prReview.categories as any)[item.key]}
                            onChange={(e) =>
                              updateSection("prReview", {
                                categories: {
                                  ...settings.prReview.categories,
                                  [item.key]: e.target.checked,
                                },
                              })
                            }
                            className="w-4 h-4 rounded text-[#F62440]"
                          />
                          <span className="text-[#211c1d] font-semibold text-xs">{item.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Strictness & Threshold */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-[#FFE5BF]/40">
                    <div>
                      <label className="font-semibold text-[#211c1d] block mb-1.5 text-xs">
                        Review Strictness
                      </label>
                      <select
                        value={settings.prReview.strictness}
                        onChange={(e) =>
                          updateSection("prReview", {
                            strictness: e.target.value as any,
                          })
                        }
                        className="w-full p-3 rounded-xl border border-[#FFE5BF] bg-[#FFFAF3] text-[#211c1d] text-xs focus:outline-none focus:border-[#F62440] cursor-pointer"
                      >
                        <option value="lenient">Lenient (Blockers only)</option>
                        <option value="balanced">Balanced (Standard enterprise review)</option>
                        <option value="strict">Strict (Zero tolerance & formatting)</option>
                      </select>
                    </div>

                    <div>
                      <label className="font-semibold text-[#211c1d] block mb-1.5 text-xs">
                        Risk Score Alert Threshold (0 - 100)
                      </label>
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={settings.prReview.riskThreshold}
                        onChange={(e) =>
                          updateSection("prReview", {
                            riskThreshold: parseInt(e.target.value) || 70,
                          })
                        }
                        className="w-full p-3 rounded-xl border border-[#FFE5BF] bg-[#FFFAF3] text-[#211c1d] text-xs focus:outline-none focus:border-[#F62440]"
                      />
                      <span className="text-[11px] text-[#73666b] mt-1 block">
                        PRs with a risk score above {settings.prReview.riskThreshold} are flagged in red.
                      </span>
                    </div>
                  </div>

                  {/* AI Review Output Format */}
                  <div className="pt-2 border-t border-[#FFE5BF]/40 space-y-3">
                    <label className="font-semibold text-[#211c1d] block text-xs">
                      AI Review Output Format
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      {(["detailed", "standard", "summary"] as const).map((mode) => (
                        <button
                          key={mode}
                          type="button"
                          onClick={() =>
                            updateSection("prReview", { reviewOutput: mode })
                          }
                          className={`p-3 rounded-xl border text-center font-bold text-xs capitalize transition-all cursor-pointer ${
                            settings.prReview.reviewOutput === mode
                              ? "bg-[#FFE5BF] border-[#F62440] text-[#F62440]"
                              : "border-[#FFE5BF] bg-[#FFFAF3] text-[#5e5356]"
                          }`}
                        >
                          {mode}
                        </button>
                      ))}
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                      {[
                        { key: "riskScore", label: "Risk score" },
                        { key: "findingExplanation", label: "Finding explanation" },
                        { key: "whyItMatters", label: "Why it matters" },
                        { key: "suggestedFix", label: "Suggested fix diff" },
                        { key: "codeLocation", label: "Code location" },
                        { key: "evidence", label: "Grounded evidence" },
                        { key: "relatedFiles", label: "Related files" },
                        { key: "astImpact", label: "AST impact analysis" },
                      ].map((item) => (
                        <label
                          key={item.key}
                          className="flex items-center gap-2 p-2.5 rounded-xl border border-[#FFE5BF] bg-[#FFFAF3] cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={!!(settings.prReview.outputFields as any)[item.key]}
                            onChange={(e) =>
                              updateSection("prReview", {
                                outputFields: {
                                  ...settings.prReview.outputFields,
                                  [item.key]: e.target.checked,
                                },
                              })
                            }
                            className="w-3.5 h-3.5 rounded text-[#F62440]"
                          />
                          <span className="text-xs font-semibold text-[#211c1d]">{item.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-3 border-t border-[#FFE5BF]/60">
                  <Button
                    onClick={saveSettings}
                    size="sm"
                    className="rounded-xl bg-[#F62440] hover:bg-[#de1832] text-white text-xs font-semibold px-6 cursor-pointer"
                  >
                    {isSaved ? "Saved!" : "Save Changes"}
                  </Button>
                </div>
              </Card>
            </div>
          )}

          {/* 6. REPOSITORY SETTINGS */}
          {activeTab === "repositories" && (
            <div className="space-y-5 animate-in fade-in">
              <Card className="p-6 sm:p-8 border-[#FFE5BF] bg-white shadow-xs space-y-6">
                <div className="border-b border-[#FFE5BF]/60 pb-3 flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-bold text-[#211c1d] flex items-center gap-2">
                      <FolderGit2 className="w-5 h-5 text-[#F62440]" />
                      Repository Indexing & Chunking
                    </h2>
                    <p className="text-xs text-[#73666b] mt-0.5">
                      Configure automated background indexing, chunk sizes, and ignored patterns.
                    </p>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer font-bold text-xs">
                    <span className="text-[#211c1d]">Auto Indexing</span>
                    <input
                      type="checkbox"
                      checked={settings.repositoryIndexing.automaticIndexing}
                      onChange={(e) =>
                        updateSection("repositoryIndexing", {
                          automaticIndexing: e.target.checked,
                        })
                      }
                      className="w-4 h-4 rounded text-[#F62440]"
                    />
                  </label>
                </div>

                <div className="space-y-5 text-xs">
                  {/* Triggers & Index Targets */}
                  <div>
                    <label className="font-semibold text-[#211c1d] block mb-2.5 text-xs">
                      Indexing Triggers & Ingestion Scope
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      {[
                        { key: "indexOnGitPush", label: "Index on Git Push" },
                        { key: "indexPullRequests", label: "Index Pull Requests" },
                        { key: "indexDocumentation", label: "Index Documentation" },
                        { key: "indexSourceCode", label: "Index Source Code" },
                        { key: "indexTests", label: "Index Unit Tests" },
                        { key: "indexConfigFiles", label: "Index Config & Schemas" },
                      ].map((item) => (
                        <label
                          key={item.key}
                          className="flex items-center gap-2.5 p-3 rounded-xl border border-[#FFE5BF] bg-[#FFFAF3] hover:bg-[#FFF2DB]/50 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={!!(settings.repositoryIndexing as any)[item.key]}
                            onChange={(e) =>
                              updateSection("repositoryIndexing", {
                                [item.key]: e.target.checked,
                              })
                            }
                            className="w-4 h-4 rounded text-[#F62440]"
                          />
                          <span className="text-[#211c1d] font-semibold text-xs">{item.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Ignored Patterns Manager */}
                  <div className="pt-2 border-t border-[#FFE5BF]/40 space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="font-semibold text-[#211c1d] block text-xs">
                        Ignored Files & Directory Patterns
                      </label>
                      <span className="text-[11px] text-[#73666b]">
                        {settings.repositoryIndexing.ignoredPatterns.length} patterns active
                      </span>
                    </div>

                    <form onSubmit={handleAddIgnorePattern} className="flex gap-2">
                      <input
                        type="text"
                        placeholder="e.g. *.log, coverage/, tmp/..."
                        value={newIgnorePattern}
                        onChange={(e) => setNewIgnorePattern(e.target.value)}
                        className="flex-1 p-2.5 rounded-xl border border-[#FFE5BF] bg-[#FFFAF3] text-[#211c1d] text-xs focus:outline-none focus:border-[#F62440] font-mono"
                      />
                      <Button
                        type="submit"
                        size="sm"
                        className="rounded-xl bg-[#FFF2DB] hover:bg-[#FFE5BF] text-[#F62440] border border-[#FFE5BF] text-xs font-semibold shrink-0 px-4 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5 mr-1" />
                        Add Pattern
                      </Button>
                    </form>

                    <div className="flex flex-wrap gap-2 pt-1">
                      {settings.repositoryIndexing.ignoredPatterns.map((pattern) => (
                        <span
                          key={pattern}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#FFFAF3] border border-[#FFE5BF] text-[#211c1d] font-mono text-xs"
                        >
                          {pattern}
                          <button
                            type="button"
                            onClick={() => handleRemoveIgnorePattern(pattern)}
                            className="text-[#a8999e] hover:text-[#F62440] transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Chunking Parameters */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-[#FFE5BF]/40">
                    <div>
                      <label className="font-semibold text-[#211c1d] block mb-1.5 text-xs">
                        Chunk Size
                      </label>
                      <select
                        value={settings.repositoryIndexing.chunkSize}
                        onChange={(e) =>
                          updateSection("repositoryIndexing", {
                            chunkSize: parseInt(e.target.value) || 500,
                          })
                        }
                        className="w-full p-3 rounded-xl border border-[#FFE5BF] bg-[#FFFAF3] text-[#211c1d] text-xs focus:outline-none focus:border-[#F62440] cursor-pointer"
                      >
                        <option value={250}>250 Tokens (Granular)</option>
                        <option value={500}>500 Tokens (Recommended)</option>
                        <option value={1000}>1000 Tokens (Broader context)</option>
                      </select>
                    </div>

                    <div>
                      <label className="font-semibold text-[#211c1d] block mb-1.5 text-xs">
                        Chunk Overlap
                      </label>
                      <select
                        value={settings.repositoryIndexing.chunkOverlap}
                        onChange={(e) =>
                          updateSection("repositoryIndexing", {
                            chunkOverlap: parseInt(e.target.value) || 50,
                          })
                        }
                        className="w-full p-3 rounded-xl border border-[#FFE5BF] bg-[#FFFAF3] text-[#211c1d] text-xs focus:outline-none focus:border-[#F62440] cursor-pointer"
                      >
                        <option value={25}>25 Tokens</option>
                        <option value={50}>50 Tokens (Default)</option>
                        <option value={100}>100 Tokens</option>
                      </select>
                    </div>

                    <div>
                      <label className="font-semibold text-[#211c1d] block mb-1.5 text-xs">
                        Re-index Strategy
                      </label>
                      <select
                        value={settings.repositoryIndexing.reindexStrategy}
                        onChange={(e) =>
                          updateSection("repositoryIndexing", {
                            reindexStrategy: e.target.value as any,
                          })
                        }
                        className="w-full p-3 rounded-xl border border-[#FFE5BF] bg-[#FFFAF3] text-[#211c1d] text-xs focus:outline-none focus:border-[#F62440] cursor-pointer"
                      >
                        <option value="changed-only">Changed Files Only (Fast)</option>
                        <option value="entire-repo">Entire Repository (Complete refresh)</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-3 border-t border-[#FFE5BF]/60">
                  <Button
                    onClick={saveSettings}
                    size="sm"
                    className="rounded-xl bg-[#F62440] hover:bg-[#de1832] text-white text-xs font-semibold px-6 cursor-pointer"
                  >
                    {isSaved ? "Saved!" : "Save Changes"}
                  </Button>
                </div>
              </Card>
            </div>
          )}

          {/* 7. NOTIFICATIONS SETTINGS */}
          {activeTab === "notifications" && (
            <div className="space-y-5 animate-in fade-in">
              <Card className="p-6 sm:p-8 border-[#FFE5BF] bg-white shadow-xs space-y-6">
                <div className="border-b border-[#FFE5BF]/60 pb-3">
                  <h2 className="text-lg font-bold text-[#211c1d] flex items-center gap-2">
                    <Bell className="w-5 h-5 text-[#F62440]" />
                    Developer Notifications
                  </h2>
                  <p className="text-xs text-[#73666b] mt-0.5">
                    Select which code intelligence and vulnerability events trigger alerts.
                  </p>
                </div>

                <div className="space-y-5 text-xs">
                  <div className="space-y-2.5">
                    {[
                      { key: "prReviewCompleted", label: "PR Review completed", desc: "Alert when automated AI code review finishes." },
                      { key: "criticalVulnerability", label: "Critical vulnerability detected", desc: "Instant alert on high-severity security issues." },
                      { key: "indexingCompleted", label: "Repository indexing completed", desc: "Notification when vector & AST indexing finishes." },
                      { key: "indexingFailed", label: "Repository indexing failed", desc: "Alert when cloning or parsing encounters syntax errors." },
                      { key: "aiAnalysisCompleted", label: "AI analysis & graph sync completed", desc: "Notice when AST relationships are ready." },
                      { key: "webhookSyncFailed", label: "Webhook synchronization failed", desc: "Alert when GitHub push webhook fails delivery." },
                      { key: "highRiskPr", label: "High-risk PR detected", desc: "Highlight pull requests exceeding risk threshold." },
                    ].map((item) => (
                      <label
                        key={item.key}
                        className="flex items-start gap-3 p-3.5 rounded-xl border border-[#FFE5BF] bg-[#FFFAF3] hover:bg-[#FFF2DB]/50 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={!!(settings.notifications as any)[item.key]}
                          onChange={(e) =>
                            updateSection("notifications", {
                              [item.key]: e.target.checked,
                            })
                          }
                          className="mt-0.5 w-4 h-4 rounded text-[#F62440]"
                        />
                        <div>
                          <div className="font-bold text-xs text-[#211c1d]">{item.label}</div>
                          <div className="text-[11px] text-[#73666b] mt-0.5">{item.desc}</div>
                        </div>
                      </label>
                    ))}
                  </div>

                  {/* Delivery Methods */}
                  <div className="pt-2 border-t border-[#FFE5BF]/40">
                    <label className="font-semibold text-[#211c1d] block mb-2 text-xs">
                      Notification Delivery Channels
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <label className="flex items-center gap-2.5 p-3.5 rounded-xl border border-[#FFE5BF] bg-[#FFFAF3] cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings.notifications.inApp}
                          onChange={(e) =>
                            updateSection("notifications", { inApp: e.target.checked })
                          }
                          className="w-4 h-4 rounded text-[#F62440]"
                        />
                        <span className="font-semibold text-xs text-[#211c1d]">In-app Toast Alerts & Banner</span>
                      </label>

                      <label className="flex items-center gap-2.5 p-3.5 rounded-xl border border-[#FFE5BF] bg-[#FFFAF3] opacity-60 cursor-not-allowed">
                        <input
                          type="checkbox"
                          checked={settings.notifications.email}
                          disabled
                          className="w-4 h-4 rounded text-[#F62440]"
                        />
                        <div>
                          <span className="font-semibold text-xs text-[#211c1d]">Email Notifications</span>
                          <span className="text-[10px] text-[#73666b] block">Requires SMTP integration</span>
                        </div>
                      </label>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-3 border-t border-[#FFE5BF]/60">
                  <Button
                    onClick={saveSettings}
                    size="sm"
                    className="rounded-xl bg-[#F62440] hover:bg-[#de1832] text-white text-xs font-semibold px-6 cursor-pointer"
                  >
                    {isSaved ? "Saved!" : "Save Changes"}
                  </Button>
                </div>
              </Card>
            </div>
          )}

          {/* 8. APPEARANCE SETTINGS */}
          {activeTab === "appearance" && (
            <div className="space-y-5 animate-in fade-in">
              <Card className="p-6 sm:p-8 border-[#FFE5BF] bg-white shadow-xs space-y-6">
                <div className="border-b border-[#FFE5BF]/60 pb-3">
                  <h2 className="text-lg font-bold text-[#211c1d] flex items-center gap-2">
                    <Palette className="w-5 h-5 text-[#F62440]" />
                    Appearance & Typography
                  </h2>
                  <p className="text-xs text-[#73666b] mt-0.5">
                    Customize colors, fonts, UI density, and animations.
                  </p>
                </div>

                <div className="space-y-5 text-xs">
                  {/* Theme */}
                  <div>
                    <label className="font-semibold text-[#211c1d] block mb-2 text-xs">
                      Theme
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {[
                        { id: "light", label: "Light (Warm Ivory)" },
                        { id: "dark", label: "Dark Mode" },
                        { id: "system", label: "System Sync" },
                      ].map((t) => (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() =>
                            updateSection("appearance", { theme: t.id as any })
                          }
                          className={`p-3 rounded-xl border text-center font-bold text-xs transition-all cursor-pointer ${
                            settings.appearance.theme === t.id
                              ? "bg-[#FFE5BF] border-[#F62440] text-[#F62440] shadow-xs"
                              : "border-[#FFE5BF] bg-[#FFFAF3] text-[#5e5356]"
                          }`}
                        >
                          {t.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Accent Color */}
                  <div>
                    <label className="font-semibold text-[#211c1d] block mb-2 text-xs">
                      Accent Color
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <label className="flex items-center gap-2.5 p-3.5 rounded-xl border border-[#FFE5BF] bg-[#FFFAF3] cursor-pointer">
                        <input
                          type="radio"
                          name="accent"
                          value="red"
                          checked={settings.appearance.accent === "red"}
                          onChange={() =>
                            updateSection("appearance", { accent: "red" })
                          }
                          className="w-4 h-4 text-[#F62440]"
                        />
                        <div className="flex items-center gap-2">
                          <span className="w-3.5 h-3.5 rounded-full bg-[#F62440]" />
                          <span className="font-bold text-xs text-[#211c1d]">SHIPRAG Crimson (#F62440)</span>
                        </div>
                      </label>

                      <label className="flex items-center gap-2.5 p-3.5 rounded-xl border border-[#FFE5BF] bg-[#FFFAF3] cursor-pointer">
                        <input
                          type="radio"
                          name="accent"
                          value="neutral"
                          checked={settings.appearance.accent === "neutral"}
                          onChange={() =>
                            updateSection("appearance", { accent: "neutral" })
                          }
                          className="w-4 h-4 text-[#211c1d]"
                        />
                        <div className="flex items-center gap-2">
                          <span className="w-3.5 h-3.5 rounded-full bg-[#211c1d]" />
                          <span className="font-bold text-xs text-[#211c1d]">Neutral Slate</span>
                        </div>
                      </label>
                    </div>
                  </div>

                  {/* UI Density */}
                  <div>
                    <label className="font-semibold text-[#211c1d] block mb-2 text-xs">
                      UI Density
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {(["compact", "comfortable", "spacious"] as const).map((d) => (
                        <button
                          key={d}
                          type="button"
                          onClick={() =>
                            updateSection("appearance", { density: d })
                          }
                          className={`p-3 rounded-xl border text-center capitalize font-bold text-xs transition-all cursor-pointer ${
                            settings.appearance.density === d
                              ? "bg-[#FFE5BF] border-[#F62440] text-[#F62440] shadow-xs"
                              : "border-[#FFE5BF] bg-[#FFFAF3] text-[#5e5356]"
                          }`}
                        >
                          {d}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Fonts */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-[#FFE5BF]/40">
                    <div>
                      <label className="font-semibold text-[#211c1d] block mb-1.5 text-xs">
                        Code Font
                      </label>
                      <select
                        value={settings.appearance.codeFont}
                        onChange={(e) =>
                          updateSection("appearance", { codeFont: e.target.value })
                        }
                        className="w-full p-3 rounded-xl border border-[#FFE5BF] bg-[#FFFAF3] text-[#211c1d] text-xs focus:outline-none focus:border-[#F62440] font-mono cursor-pointer"
                      >
                        <option value="JetBrains Mono">JetBrains Mono</option>
                        <option value="Fira Code">Fira Code</option>
                        <option value="Menlo">Menlo / Monaco</option>
                        <option value="Courier New">Courier New</option>
                      </select>
                    </div>

                    <div>
                      <label className="font-semibold text-[#211c1d] block mb-1.5 text-xs">
                        Interface Font
                      </label>
                      <select
                        value={settings.appearance.interfaceFont}
                        onChange={(e) =>
                          updateSection("appearance", { interfaceFont: e.target.value })
                        }
                        className="w-full p-3 rounded-xl border border-[#FFE5BF] bg-[#FFFAF3] text-[#211c1d] text-xs focus:outline-none focus:border-[#F62440] cursor-pointer"
                      >
                        <option value="Inter">Inter (Default)</option>
                        <option value="system-ui">System UI</option>
                        <option value="Roboto">Roboto</option>
                      </select>
                    </div>
                  </div>

                  {/* Animations Toggle */}
                  <div className="pt-2 border-t border-[#FFE5BF]/40">
                    <label className="flex items-center gap-3 p-3.5 rounded-xl border border-[#FFE5BF] bg-[#FFFAF3] cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.appearance.animations}
                        onChange={(e) =>
                          updateSection("appearance", {
                            animations: e.target.checked,
                          })
                        }
                        className="w-4 h-4 rounded text-[#F62440]"
                      />
                      <div>
                        <div className="font-bold text-xs text-[#211c1d]">Micro-animations & Transitions</div>
                        <div className="text-[11px] text-[#73666b]">
                          Enable smooth motion effects for graph rendering, modals, and list updates.
                        </div>
                      </div>
                    </label>
                  </div>
                </div>

                <div className="flex justify-end pt-3 border-t border-[#FFE5BF]/60">
                  <Button
                    onClick={saveSettings}
                    size="sm"
                    className="rounded-xl bg-[#F62440] hover:bg-[#de1832] text-white text-xs font-semibold px-6 cursor-pointer"
                  >
                    {isSaved ? "Saved!" : "Save Changes"}
                  </Button>
                </div>
              </Card>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
