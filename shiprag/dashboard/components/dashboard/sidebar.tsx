"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import {
  Home,
  FolderGit2,
  Bot,
  Search,
  Network,
  GitPullRequest,
  Settings,
  Plus,
  User,
  Users,
  Code2,
  Menu,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { label: "Home", icon: Home, href: "/dashboard" },
  { label: "Repositories", icon: FolderGit2, href: "/dashboard/repositories" },
  { label: "AI Copilot", icon: Bot, href: "/dashboard/copilot" },
  { label: "Code Search", icon: Search, href: "/dashboard/search" },
  { label: "Code Graph", icon: Network, href: "/dashboard/graph" },
  { label: "PR Review", icon: GitPullRequest, href: "/dashboard/pull-requests" },
  { label: "Settings", icon: Settings, href: "/dashboard/settings" },
];

export function Sidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* Mobile Toggle Button */}
      <div className="lg:hidden fixed bottom-4 right-4 z-50">
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="w-12 h-12 rounded-full bg-[#F62440] text-white shadow-xl flex items-center justify-center border border-[#FFE5BF]"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="lg:hidden fixed inset-0 z-40 bg-black/20 backdrop-blur-sm"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={cn(
          "fixed top-0 bottom-0 left-0 z-40 flex flex-col w-[240px] border-r border-[#FFE5BF]/70 bg-[#FFFAF3] transition-all duration-300 select-none",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Header / Logo */}
        <div className="pt-5 pb-3 px-4">
          <Link href="/dashboard" className="flex items-center gap-2 group">
            <div className="relative h-9 w-36 sm:w-40">
              <Image
                src="/shiprag_logo.png"
                alt="SHIPRAG Logo"
                fill
                className="object-contain object-left"
                priority
              />
            </div>
          </Link>
        </div>

        {/* Navigation Section */}
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-6">
          <div className="space-y-1">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive =
                item.href === "/dashboard"
                  ? pathname === "/dashboard"
                  : pathname.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all group",
                    isActive
                      ? "bg-[#FFE5BF] text-[#F62440] font-semibold shadow-xs"
                      : "text-[#5e5356] hover:text-[#211c1d] hover:bg-[#FFF2DB]/60"
                  )}
                >
                  <Icon
                    className={cn(
                      "w-4 h-4 shrink-0 transition-transform group-hover:scale-105",
                      isActive ? "text-[#F62440]" : "text-[#7a6e72]"
                    )}
                  />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Sidebar Footer Branding & Mountain/Ship Illustration */}
        <div className="p-4 relative overflow-hidden mt-auto border-t border-[#FFE5BF]/50">
          <div className="relative z-10 space-y-1">
            <p className="text-[12px] font-semibold leading-tight text-[#4a4043]">
              Better <span className="text-[#F62440] font-bold">Context.</span>
            </p>
            <p className="text-[12px] font-semibold leading-tight text-[#4a4043]">
              <span className="text-[#F62440] font-bold">Smarter Code.</span>
            </p>
            <p className="text-[12px] font-semibold leading-tight text-[#F62440] font-bold">
              Faster Development.
            </p>
          </div>

          <div className="mt-3 relative h-28 w-full rounded-xl overflow-hidden bg-[#FFF2DB]/40 border border-[#FFE5BF]/40">
            <Image
              src="/sidebar_brand.jpg"
              alt="SHIPRAG Context"
              fill
              className="object-cover object-bottom"
            />
          </div>
        </div>
      </aside>
    </>
  );
}
