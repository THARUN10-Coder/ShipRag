"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Menu, X, Zap } from "lucide-react";


function GithubIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
      <path d="M9 18c-4.51 2-5-2-7-2" />
    </svg>
  );
}


export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-white/10 bg-[#030712]/80 backdrop-blur-md">
      <div className="container mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        {/* Left: Brand */}
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="relative h-9 w-40 rounded-lg overflow-hidden">
              <Image
                src="/shiprag_logo.png"
                alt="SHIPRAG Logo"
                fill
                className="object-contain object-left"
                priority
              />
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-400">
            <Link
              href="#preview"
              className="transition-colors hover:text-white"
            >
              Product
            </Link>
            <Link
              href="#features"
              className="transition-colors hover:text-white"
            >
              Features
            </Link>
            <Link
              href="#how-it-works"
              className="transition-colors hover:text-white"
            >
              How It Works
            </Link>
            <Link
              href="#architecture"
              className="transition-colors hover:text-white"
            >
              Architecture
            </Link>
            <Link
              href="/chat/ai-support-copilot"
              className="transition-colors hover:text-white"
            >
              Docs
            </Link>
          </div>
        </div>

        {/* Right Action Buttons */}
        <div className="hidden sm:flex items-center gap-3">
          <Link
            href="https://github.com/THARUN10-Coder/ai-support-copilot"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button
              variant="subtle"
              size="sm"
              className="flex items-center gap-2 text-xs font-medium text-gray-300"
            >
              <GithubIcon className="h-4 w-4" />
              GitHub
            </Button>
          </Link>


          <Link href="/login">
            <Button
              variant="gradient"
              size="sm"
              className="text-xs font-semibold"
            >
              Sign In
            </Button>
          </Link>

        </div>

        {/* Mobile menu toggle */}
        <div className="flex md:hidden">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="text-gray-400 hover:text-white"
          >
            {mobileMenuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </Button>
        </div>
      </div>

      {/* Mobile Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-white/10 bg-[#030712] px-4 py-4 space-y-3">
          <Link
            href="#preview"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-sm font-medium text-gray-300 hover:text-white"
          >
            Product
          </Link>
          <Link
            href="#features"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-sm font-medium text-gray-300 hover:text-white"
          >
            Features
          </Link>
          <Link
            href="#how-it-works"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-sm font-medium text-gray-300 hover:text-white"
          >
            How It Works
          </Link>
          <Link
            href="#architecture"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-sm font-medium text-gray-300 hover:text-white"
          >
            Architecture
          </Link>
          <Link
            href="/chat/ai-support-copilot"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-sm font-medium text-gray-300 hover:text-white"
          >
            Docs
          </Link>
          <div className="pt-3 border-t border-white/10 flex flex-col gap-2">
            <Link href="/chat/ai-support-copilot">
              <Button
                variant="gradient"
                size="sm"
                className="w-full text-xs font-semibold"
              >
                Launch SHIPRAG
              </Button>
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
