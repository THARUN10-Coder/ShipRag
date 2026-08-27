"use client";

import React from "react";
import { AuthBrandPanel } from "./auth-brand-panel";
import { LoginCard } from "./login-card";

export function AuthLayout() {
  return (
    <div className="min-h-screen w-full flex bg-[#FFFAF3] text-[#171717] selection:bg-[#FFE5BF] selection:text-[#F62440]">
      {/* Left Brand Panel */}
      <AuthBrandPanel />

      {/* Right Login Panel */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-10 lg:p-16 bg-[#FFFAF3] relative">
        <LoginCard />
      </div>
    </div>
  );
}
