"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { DeveloperSettings, DEFAULT_SETTINGS } from "@/types/settings";
import { useAuth } from "./auth-context";

interface SettingsContextType {
  settings: DeveloperSettings;
  updateSettings: (newSettings: Partial<DeveloperSettings>) => void;
  updateSection: <K extends keyof DeveloperSettings>(
    section: K,
    values: Partial<DeveloperSettings[K]>
  ) => void;
  resetSettings: () => void;
  isSaved: boolean;
  saveSettings: () => Promise<void>;
}

const SettingsContext = createContext<SettingsContextType>({
  settings: DEFAULT_SETTINGS,
  updateSettings: () => {},
  updateSection: () => {},
  resetSettings: () => {},
  isSaved: false,
  saveSettings: async () => {},
});

const STORAGE_KEY_PREFIX = "shiprag_dev_settings_";

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const storageKey = `${STORAGE_KEY_PREFIX}${user?.uid || "guest"}`;

  const [settings, setSettings] = useState<DeveloperSettings>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem(storageKey) || localStorage.getItem("shiprag_dev_settings_global");
        if (saved) {
          const parsed = JSON.parse(saved);
          return {
            ...DEFAULT_SETTINGS,
            ...parsed,
            general: { ...DEFAULT_SETTINGS.general, ...(parsed.general || {}) },
            aiCopilot: { ...DEFAULT_SETTINGS.aiCopilot, ...(parsed.aiCopilot || {}) },
            codeIntelligence: { ...DEFAULT_SETTINGS.codeIntelligence, ...(parsed.codeIntelligence || {}) },
            searchRag: { ...DEFAULT_SETTINGS.searchRag, ...(parsed.searchRag || {}) },
            citations: { ...DEFAULT_SETTINGS.citations, ...(parsed.citations || {}) },
            prReview: {
              ...DEFAULT_SETTINGS.prReview,
              ...(parsed.prReview || {}),
              severities: { ...DEFAULT_SETTINGS.prReview.severities, ...(parsed.prReview?.severities || {}) },
              categories: { ...DEFAULT_SETTINGS.prReview.categories, ...(parsed.prReview?.categories || {}) },
              outputFields: { ...DEFAULT_SETTINGS.prReview.outputFields, ...(parsed.prReview?.outputFields || {}) },
            },
            repositoryIndexing: { ...DEFAULT_SETTINGS.repositoryIndexing, ...(parsed.repositoryIndexing || {}) },
            notifications: { ...DEFAULT_SETTINGS.notifications, ...(parsed.notifications || {}) },
            appearance: { ...DEFAULT_SETTINGS.appearance, ...(parsed.appearance || {}) },
          };
        }
      } catch (e) {
        console.warn("[Settings Context Notice]: Using default settings", e);
      }
    }
    return DEFAULT_SETTINGS;
  });

  const [isSaved, setIsSaved] = useState(false);

  // Apply theme & font appearance to root DOM
  useEffect(() => {
    if (typeof document !== "undefined") {
      const root = document.documentElement;
      
      // Theme
      if (settings.appearance.theme === "dark") {
        root.classList.add("dark");
      } else {
        root.classList.remove("dark");
      }

      // Font styling
      if (settings.appearance.codeFont) {
        root.style.setProperty("--font-code", settings.appearance.codeFont);
      }
      if (settings.appearance.interfaceFont) {
        root.style.setProperty("--font-sans", settings.appearance.interfaceFont);
      }

      // Density
      root.setAttribute("data-density", settings.appearance.density);
    }
  }, [settings.appearance]);

  // Load user settings when user changes
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem(storageKey);
        if (saved) {
          const parsed = JSON.parse(saved);
          setSettings((prev) => ({
            ...prev,
            ...parsed,
          }));
        }
      } catch (e) {}
    }
  }, [storageKey]);

  const updateSettings = (newSettings: Partial<DeveloperSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...newSettings };
      if (typeof window !== "undefined") {
        localStorage.setItem(storageKey, JSON.stringify(next));
        localStorage.setItem("shiprag_dev_settings_global", JSON.stringify(next));
      }
      return next;
    });
  };

  const updateSection = <K extends keyof DeveloperSettings>(
    section: K,
    values: Partial<DeveloperSettings[K]>
  ) => {
    setSettings((prev) => {
      const next = {
        ...prev,
        [section]: {
          ...(prev[section] as any),
          ...values,
        },
      };
      if (typeof window !== "undefined") {
        localStorage.setItem(storageKey, JSON.stringify(next));
        localStorage.setItem("shiprag_dev_settings_global", JSON.stringify(next));
      }
      return next;
    });
  };

  const saveSettings = async () => {
    if (typeof window !== "undefined") {
      localStorage.setItem(storageKey, JSON.stringify(settings));
      localStorage.setItem("shiprag_dev_settings_global", JSON.stringify(settings));
    }
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2500);
  };

  const resetSettings = () => {
    setSettings(DEFAULT_SETTINGS);
    if (typeof window !== "undefined") {
      localStorage.setItem(storageKey, JSON.stringify(DEFAULT_SETTINGS));
      localStorage.setItem("shiprag_dev_settings_global", JSON.stringify(DEFAULT_SETTINGS));
    }
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2500);
  };

  return (
    <SettingsContext.Provider
      value={{
        settings,
        updateSettings,
        updateSection,
        resetSettings,
        isSaved,
        saveSettings,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  return useContext(SettingsContext);
}
