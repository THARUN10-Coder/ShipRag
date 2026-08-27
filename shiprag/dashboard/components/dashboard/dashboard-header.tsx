"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { useRepository } from "@/context/repository-context";
import { useAuth } from "@/context/auth-context";
import { apiClient } from "@/lib/api/client";
import {
  Search,
  ChevronDown,
  LogOut,
  User as UserIcon,
} from "lucide-react";

export function DashboardHeader() {
  const { repositories } = useRepository();
  const { user, logout } = useAuth();
  const [searchValue, setSearchValue] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
  };

  const displayName = user?.displayName || user?.email?.split("@")[0] || "Developer";
  const avatarUrl = user?.photoURL || "";
  const initials = displayName.slice(0, 2).toUpperCase();

  return (
    <header className="h-16 border-b border-[#FFE5BF]/70 bg-[#FFFAF3]/90 backdrop-blur-md sticky top-0 z-30 flex items-center justify-between px-4 sm:px-8">
      {/* Left: Tagline */}
      <div className="hidden md:flex items-center gap-2">
        <span className="text-xs text-[#73666b] font-medium tracking-tight">
          Your AI Co-pilot for Code Intelligence
        </span>
      </div>

      {/* Center / Search Bar */}
      <div className="flex-1 max-w-xl mx-4">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#a8999e]" />
          <input
            type="text"
            placeholder="Search repositories, files, or ask a question..."
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && searchValue.trim()) {
                window.location.href = `/dashboard/copilot?q=${encodeURIComponent(searchValue.trim())}`;
              }
            }}
            className="w-full pl-10 pr-12 py-2 rounded-full border border-[#FFE5BF] bg-[#FFF2DB]/40 text-xs text-[#211c1d] placeholder-[#a8999e] focus:outline-none focus:border-[#F62440] focus:bg-white transition-all shadow-xs"
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-[#FFE5BF]/60 text-[10px] text-[#73666b] font-mono">
            <span>⌘</span>
            <span>K</span>
          </div>
        </div>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-4 relative">
        {/* User Profile Avatar with dropdown */}
        <div className="relative">
          <div
            onClick={() => setMenuOpen(!menuOpen)}
            className="flex items-center gap-2 pl-2 border-l border-[#FFE5BF]/70 cursor-pointer"
          >
            {avatarUrl ? (
              <div className="relative w-8 h-8 rounded-full border border-[#FFE5BF] overflow-hidden bg-[#FFE5BF]/30">
                <img
                  src={avatarUrl}
                  alt={displayName}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = "none";
                  }}
                />
              </div>
            ) : (
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#FFE5BF] to-[#F62440]/30 border border-[#F62440]/20 flex items-center justify-center text-[#211c1d] font-bold text-xs shadow-xs overflow-hidden">
                <span>{initials}</span>
              </div>
            )}
            <span className="hidden sm:inline text-xs font-semibold text-[#211c1d]">
              {displayName}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-[#73666b]" />
          </div>

          {menuOpen && (
            <div className="absolute right-0 mt-2 w-48 rounded-xl border border-[#FFE5BF] bg-white p-1.5 shadow-lg z-50 animate-in fade-in zoom-in-95">
              <div className="px-3 py-2 border-b border-[#FFE5BF]/60">
                <p className="text-xs font-bold text-[#211c1d] truncate">{displayName}</p>
                <p className="text-[11px] text-[#73666b] truncate">{user?.email || "developer@shiprag.io"}</p>
              </div>
              <button
                onClick={handleLogout}
                className="w-full mt-1 flex items-center gap-2 px-3 py-2 text-xs font-medium text-[#F62440] hover:bg-[#FFF2DB]/60 rounded-lg transition-colors cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
