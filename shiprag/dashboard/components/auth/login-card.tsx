"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { GithubLoginButton } from "./github-login-button";
import { GoogleLoginButton } from "./google-login-button";
import { useAuth } from "@/context/auth-context";
import { AlertCircle, CheckCircle2, Lock, Mail } from "lucide-react";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";

export function LoginCard() {
  const router = useRouter();
  const { user, isAuthenticated, signInWithGoogle, signInWithGitHub } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoadingGithub, setIsLoadingGithub] = useState(false);
  const [isLoadingGoogle, setIsLoadingGoogle] = useState(false);
  const [isLoadingEmail, setIsLoadingEmail] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // If already authenticated via Firebase onAuthStateChanged, redirect to dashboard
  useEffect(() => {
    if (isAuthenticated && user) {
      router.push("/dashboard");
    }
  }, [isAuthenticated, user, router]);

  const handleGoogleLogin = async () => {
    setIsLoadingGoogle(true);
    setError(null);
    try {
      await signInWithGoogle();
      setSuccess(true);
      setTimeout(() => {
        router.push("/dashboard");
      }, 300);
    } catch (err: any) {
      console.error("[Google Auth Error]:", err);
      if (err.code === "auth/popup-closed-by-user") {
        setError("Google sign-in was cancelled.");
      } else if (err.code === "auth/popup-blocked") {
        setError("Popup was blocked by your browser. Please allow popups for localhost.");
      } else if (err.code === "auth/unauthorized-domain") {
        setError("Domain 'localhost' is not in authorized domains in Firebase Console.");
      } else if (err.code === "auth/operation-not-allowed") {
        setError("Google provider is not enabled in Firebase Console -> Authentication -> Sign-in method.");
      } else {
        setError(err.message || "Failed to sign in with Google.");
      }
    } finally {
      setIsLoadingGoogle(false);
    }
  };

  const handleGitHubLogin = async () => {
    setIsLoadingGithub(true);
    setError(null);
    try {
      await signInWithGitHub();
      setSuccess(true);
      setTimeout(() => {
        router.push("/dashboard");
      }, 300);
    } catch (err: any) {
      console.error("[GitHub Auth Error]:", err);
      if (err.code === "auth/popup-closed-by-user") {
        setError("GitHub sign-in was cancelled.");
      } else if (err.code === "auth/popup-blocked") {
        setError("Popup was blocked by your browser. Please allow popups for localhost.");
      } else if (err.code === "auth/account-exists-with-different-credential") {
        setError("An account already exists with the same email address using a different sign-in method.");
      } else if (err.code === "auth/operation-not-allowed") {
        setError("GitHub provider is not enabled in Firebase Console -> Authentication -> Sign-in method.");
      } else {
        setError(err.message || "Failed to sign in with GitHub.");
      }
    } finally {
      setIsLoadingGithub(false);
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Please enter your email and password.");
      return;
    }

    setIsLoadingEmail(true);
    setError(null);

    try {
      try {
        await signInWithEmailAndPassword(auth, email, password);
      } catch (signInErr: any) {
        if (
          signInErr.code === "auth/user-not-found" ||
          signInErr.code === "auth/invalid-credential"
        ) {
          await createUserWithEmailAndPassword(auth, email, password);
        } else {
          throw signInErr;
        }
      }
      setSuccess(true);
      setTimeout(() => {
        router.push("/dashboard");
      }, 300);
    } catch (err: any) {
      console.error("Email auth error:", err);
      setError(err.message || "Failed to authenticate with email and password.");
    } finally {
      setIsLoadingEmail(false);
    }
  };

  return (
    <div className="w-full max-w-[440px] rounded-[24px] border border-[#EBDCC8] bg-white p-8 sm:p-10 shadow-lg text-[#171717] z-20">
      {/* Mobile-only logo display */}
      <div className="lg:hidden flex justify-center mb-6">
        <div className="relative h-12 w-48">
          <Image
            src="/shiprag_logo.png"
            alt="SHIPRAG Logo"
            fill
            className="object-contain mix-blend-multiply"
            priority
          />
        </div>
      </div>

      {/* Header */}
      <div className="text-center sm:text-left mb-6">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-[#171717] tracking-tight">
          Welcome back
        </h2>
        <p className="text-xs sm:text-sm text-[#6B625B] mt-1.5 leading-relaxed">
          Sign in to continue to your code intelligence workspace.
        </p>
      </div>

      {/* Error / Feedback Alert */}
      {error && (
        <div className="mb-5 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2 animate-in fade-in">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Success Feedback */}
      {success && (
        <div className="mb-5 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>Authentication successful. Redirecting to workspace...</span>
        </div>
      )}

      {/* OAuth Sign In Buttons */}
      <div className="space-y-3">
        <GoogleLoginButton onLogin={handleGoogleLogin} isLoading={isLoadingGoogle} />
        <GithubLoginButton onLogin={handleGitHubLogin} isLoading={isLoadingGithub} />

        {/* Divider */}
        <div className="relative flex items-center justify-center my-4">
          <div className="border-t border-[#EBDCC8] w-full" />
          <span className="bg-white px-3 text-[11px] font-medium text-[#6B625B] uppercase tracking-wider shrink-0">
            or sign in with password
          </span>
          <div className="border-t border-[#EBDCC8] w-full" />
        </div>

        {/* Secondary Email Sign In Form */}
        <form onSubmit={handleEmailSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#171717] mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6B625B]" />
              <input
                type="email"
                placeholder="developer@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-[#EBDCC8] bg-[#FFFAF3] text-xs text-[#171717] placeholder-[#6B625B]/60 focus:outline-none focus:border-[#F62440] focus:bg-white transition-all shadow-xs"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-[#171717]">
                Password
              </label>
              <button
                type="button"
                onClick={() => setError("Password reset is managed via your Firebase account.")}
                className="text-[11px] font-semibold text-[#F62440] hover:underline"
              >
                Forgot password?
              </button>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6B625B]" />
              <input
                type="password"
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-[#EBDCC8] bg-[#FFFAF3] text-xs text-[#171717] placeholder-[#6B625B]/60 focus:outline-none focus:border-[#F62440] focus:bg-white transition-all shadow-xs"
              />
            </div>
          </div>

          <div className="flex items-center justify-between text-xs pt-1">
            <label className="flex items-center gap-2 cursor-pointer text-[#6B625B]">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded border-[#EBDCC8] text-[#F62440] focus:ring-[#F62440]"
              />
              <span>Remember me for 30 days</span>
            </label>
          </div>

          <button
            type="submit"
            disabled={isLoadingEmail}
            className="w-full h-11 rounded-xl border border-[#EBDCC8] bg-[#FFF2DB]/60 hover:bg-[#FFE5BF]/60 text-[#171717] font-semibold text-xs transition-colors cursor-pointer disabled:opacity-50"
          >
            {isLoadingEmail ? "Authenticating..." : "Sign In with Email"}
          </button>
        </form>

        {/* Footer info & sign up note */}
        <div className="pt-4 text-center border-t border-[#EBDCC8]/60">
          <p className="text-xs text-[#6B625B]">
            Need help?{" "}
            <button
              onClick={handleGitHubLogin}
              className="font-bold text-[#F62440] hover:underline"
            >
              Sign in with GitHub &rarr;
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
