"use client";

import { create } from "zustand";
import type { Theme } from "@/types";

interface AppState {
  theme: Theme;
  sidebarOpen: boolean;
  mobileSidebarOpen: boolean;
  setTheme: (theme: Theme) => void;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  toggleMobileSidebar: () => void;
  setMobileSidebarOpen: (open: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
  theme: "light",
  sidebarOpen: true,
  mobileSidebarOpen: false,

  setTheme: (theme) => {
    set({ theme });
    localStorage.setItem("mis_theme", theme);
    if (typeof document !== "undefined") {
      document.documentElement.classList.toggle("dark", theme === "dark");
    }
  },

  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  toggleMobileSidebar: () =>
    set((state) => ({ mobileSidebarOpen: !state.mobileSidebarOpen })),
  setMobileSidebarOpen: (open) => set({ mobileSidebarOpen: open }),
}));

export function initializeTheme() {
  if (typeof window === "undefined") return;
  const saved = localStorage.getItem("mis_theme") as Theme | null;
  const theme = saved || "light";
  document.documentElement.classList.toggle("dark", theme === "dark");
  useAppStore.setState({ theme });
}
