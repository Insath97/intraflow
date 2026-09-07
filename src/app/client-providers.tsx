"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useAuthStore } from "@/lib/auth";
import { initializeTheme } from "@/stores/app-store";
import { ToastProvider } from "@/components/ui/toast";

export function ClientProviders({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  useEffect(() => {
    initializeTheme();
    if (pathname !== "/login") {
      useAuthStore.getState().fetchUser();
    }
  }, [pathname]);

  return <ToastProvider>{children}</ToastProvider>;
}
