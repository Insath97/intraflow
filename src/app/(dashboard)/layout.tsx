"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { useAppStore } from "@/stores/app-store";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const { sidebarOpen } = useAppStore();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, router]);

  if (!isAuthenticated) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background dark:bg-gray-950">
      <Sidebar />
      <div
        className={cn(
          "transition-all duration-300",
          "lg:ml-[240px]",
          !sidebarOpen && "lg:ml-[60px]"
        )}
      >
        <Header />
        <main className="p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
