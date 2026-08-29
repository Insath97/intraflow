"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/lib/auth";
import { initializeTheme } from "@/stores/app-store";

export function ClientProviders({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    initializeTheme();
    useAuthStore.getState().fetchUser();
  }, []);

  return <>{children}</>;
}
