"use client";

import { useEffect } from "react";
import { initializeAuth } from "@/lib/auth";
import { initializeTheme } from "@/stores/app-store";
import { seedData } from "@/services";

export function ClientProviders({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    seedData();
    initializeAuth();
    initializeTheme();
  }, []);

  return <>{children}</>;
}
