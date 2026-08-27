"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import {
  User,
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
} from "firebase/auth";
import { auth, googleProvider, githubProvider, db } from "@/lib/firebase";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { apiClient } from "@/lib/api/client";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithGitHub: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  isAuthenticated: false,
  signInWithGoogle: async () => {},
  signInWithGitHub: async () => {},
  logout: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    // Listen to real Firebase authentication state changes
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        try {
          // 1. Direct write to Firebase Firestore `users` collection
          const userRef = doc(db, "users", currentUser.uid);
          await setDoc(userRef, {
            uid: currentUser.uid,
            email: currentUser.email || "",
            displayName: currentUser.displayName || (currentUser.email?.split("@")[0] || "Developer"),
            photoURL: currentUser.photoURL || "",
            authProvider: currentUser.providerData?.[0]?.providerId || "google.com",
            lastLoginAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }, { merge: true });

          // 2. Direct write to Firebase Firestore `activities` collection
          const actId = `act_${Date.now()}`;
          const actRef = doc(db, "activities", actId);
          await setDoc(actRef, {
            id: actId,
            userId: currentUser.uid,
            type: "USER_LOGIN",
            message: `User signed in: ${currentUser.displayName || currentUser.email}`,
            created_at: new Date().toISOString(),
          });

          // 3. Sync with backend API
          const idToken = await currentUser.getIdToken();
          await apiClient.authenticateGoogle({
            uid: currentUser.uid,
            email: currentUser.email,
            displayName: currentUser.displayName,
            photoURL: currentUser.photoURL,
            idToken,
          });
        } catch (err) {
          console.warn("[Auth Sync Notice]:", err);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    console.log("[SHIPRAG] Google button clicked");
    console.log("[SHIPRAG] Google auth started");
    console.log("[SHIPRAG] Firebase auth instance available:", !!auth);
    console.log("[SHIPRAG] Google provider created:", !!googleProvider);
    setLoading(true);
    try {
      console.log("[SHIPRAG] signInWithPopup started for Google");
      const result = await signInWithPopup(auth, googleProvider);
      console.log("[SHIPRAG] Firebase user received:", result.user?.uid);
      setUser(result.user);
      try {
        const idToken = await result.user.getIdToken();
        await apiClient.authenticateGoogle({
          uid: result.user.uid,
          email: result.user.email,
          displayName: result.user.displayName,
          photoURL: result.user.photoURL,
          idToken,
        });
      } catch (backendErr) {
        console.warn("[Backend Sync Warning]:", backendErr);
      }
    } catch (err: any) {
      console.error("[SHIPRAG GOOGLE POPUP ERROR]:", err?.code, err?.message, err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const signInWithGitHub = async () => {
    console.log("[SHIPRAG] GitHub button clicked");
    console.log("[SHIPRAG] GitHub auth started");
    console.log("[SHIPRAG] Firebase auth instance available:", !!auth);
    console.log("[SHIPRAG] GitHub provider created:", !!githubProvider);
    setLoading(true);
    try {
      console.log("[SHIPRAG] signInWithPopup started for GitHub");
      const result = await signInWithPopup(auth, githubProvider);
      console.log("[SHIPRAG] Firebase user received:", result.user?.uid);
      setUser(result.user);
      try {
        const idToken = await result.user.getIdToken();
        await apiClient.authenticateGoogle({
          uid: result.user.uid,
          email: result.user.email,
          displayName: result.user.displayName,
          photoURL: result.user.photoURL,
          idToken,
        });
      } catch (backendErr) {
        console.warn("[Backend Sync Warning]:", backendErr);
      }
    } catch (err: any) {
      console.error("[SHIPRAG GITHUB POPUP ERROR]:", err?.code, err?.message, err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await firebaseSignOut(auth);
      await apiClient.logout();
    } catch (err) {
      console.error("[Logout Error]:", err);
    } finally {
      setUser(null);
      if (typeof window !== "undefined") {
        localStorage.removeItem("shiprag_authenticated");
        localStorage.removeItem("shiprag_user_uid");
        window.location.href = "/login";
      }
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated: !!user,
        signInWithGoogle,
        signInWithGitHub,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
