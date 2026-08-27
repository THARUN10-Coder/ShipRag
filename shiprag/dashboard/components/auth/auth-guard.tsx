"use client";

import React, { useEffect } from "react";
import { useAuth } from "@/context/auth-context";
import { useRouter, usePathname } from "next/navigation";
import { RefreshCw, Lock } from "lucide-react";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading, isAuthenticated } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      // Store redirect URL and push to login
      router.replace(`/login?redirect=${encodeURIComponent(pathname)}`);
    }
  }, [loading, isAuthenticated, router, pathname]);

  if (loading) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-[#FFFAF3] text-[#211c1d] space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-[#FFF2DB] border border-[#FFE5BF] flex items-center justify-center shadow-xs">
          <RefreshCw className="w-6 h-6 text-[#F62440] animate-spin" />
        </div>
        <div className="text-center space-y-1">
          <p className="text-sm font-bold tracking-tight">Verifying Security Session...</p>
          <p className="text-xs text-[#73666b] font-mono">Authenticating with SHIPRAG Zero-Trust Gate</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-[#FFFAF3] text-[#211c1d] space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200 text-[#F62440] flex items-center justify-center shadow-xs">
          <Lock className="w-6 h-6" />
        </div>
        <div className="text-center space-y-1">
          <p className="text-sm font-bold tracking-tight">Access Restricted</p>
          <p className="text-xs text-[#73666b] font-mono">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
