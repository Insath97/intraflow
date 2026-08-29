"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  LogOut,
  Heart,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/lib/auth";
import { useAppStore } from "@/stores/app-store";
import { navigation } from "@/config/navigation";

function UserAvatar({ name, size = "md" }: { name: string; size?: "sm" | "md" }) {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full bg-white/10 font-semibold text-white",
        size === "sm" ? "h-7 w-7 text-[10px]" : "h-8 w-8 text-xs"
      )}
    >
      {initials}
    </div>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const { user, role } = useAuthStore();
  const {
    sidebarOpen,
    mobileSidebarOpen,
    toggleSidebar,
    setMobileSidebarOpen,
  } = useAppStore();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = () => {
    setShowLogoutModal(true);
  };

  const confirmLogout = async () => {
    setIsLoggingOut(true);
    await useAuthStore.getState().logout();
    setShowLogoutModal(false);
    setIsLoggingOut(false);
  };

  useEffect(() => {
    setMobileSidebarOpen(false);
  }, [pathname, setMobileSidebarOpen]);

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  };

  const navContent = (
    <div className="flex h-full flex-col">
      {/* Brand Header */}
      <div
        className={cn(
          "flex h-16 shrink-0 items-center border-b border-white/5 px-4",
          !sidebarOpen && "justify-center px-0"
        )}
      >
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#FF6B00]">
            <Heart className="h-4 w-4 text-white" />
          </div>
          {sidebarOpen && (
            <div className="min-w-0">
              <h1 className="text-base font-bold leading-tight text-white">
                IntraFlow
              </h1>
              <p className="truncate text-[10px] leading-tight text-white/40">
                PWD Management
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-2 py-3 sidebar-scrollbar">
        {navigation.map((group) => (
          <div key={group.title} className="mb-2">
            {group.title && sidebarOpen && (
              <h2 className="mb-1 px-3 pt-3 pb-1 text-[10px] font-semibold uppercase tracking-wider text-white/30">
                {group.title}
              </h2>
            )}
            {group.title && !sidebarOpen && <div className="my-2 border-t border-white/5" />}
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      title={!sidebarOpen ? item.label : undefined}
                      className={cn(
                        "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
                        active
                          ? "bg-[#FF6B00]/15 text-[#FF6B00]"
                          : "text-white/50 hover:bg-white/5 hover:text-white/80",
                        !sidebarOpen && "justify-center px-0"
                      )}
                    >
                      <Icon
                        className={cn(
                          "h-4.5 w-4.5 shrink-0 transition-colors",
                          active
                            ? "text-[#FF6B00]"
                            : "text-white/40 group-hover:text-white/70"
                        )}
                      />
                      {sidebarOpen && <span>{item.label}</span>}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* User Profile & Logout */}
      <div className="shrink-0 border-t border-white/5 p-3">
        {user && (
          <div
            className={cn(
              "flex items-center gap-2.5",
              !sidebarOpen && "justify-center"
            )}
          >
            <UserAvatar name={user.name} size="sm" />
            {sidebarOpen && (
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-white">
                  {user.name}
                </p>
                <p className="truncate text-[11px] text-white/35">
                  {role?.name || "User"}
                </p>
              </div>
            )}
            {sidebarOpen && (
              <button
                type="button"
                onClick={handleLogout}
                className="shrink-0 rounded-lg p-1.5 text-white/30 transition-colors hover:bg-white/5 hover:text-white/60"
                aria-label="Logout"
              >
                <LogOut className="h-4 w-4" />
              </button>
            )}
          </div>
        )}
        {!sidebarOpen && (
          <button
            type="button"
            onClick={handleLogout}
            className="mt-2 flex w-full items-center justify-center rounded-lg p-1.5 text-white/30 transition-colors hover:bg-white/5 hover:text-white/60"
            aria-label="Logout"
          >
            <LogOut className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-30 hidden bg-[#1A1D2E] transition-all duration-300 lg:block",
          sidebarOpen ? "w-[240px]" : "w-[60px]"
        )}
      >
        {navContent}
        {/* Collapse Toggle */}
        <button
          type="button"
          onClick={toggleSidebar}
          className="absolute -right-3 top-20 z-40 flex h-6 w-6 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 shadow-sm transition-colors hover:bg-gray-50 hover:text-gray-700 dark:border-gray-600 dark:bg-[#252836] dark:text-gray-400 dark:hover:bg-[#2D3142]"
          aria-label={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
        >
          {sidebarOpen ? (
            <ChevronLeft className="h-3 w-3" />
          ) : (
            <ChevronRight className="h-3 w-3" />
          )}
        </button>
      </aside>

      {/* Mobile Overlay */}
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Mobile Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-[240px] bg-[#1A1D2E] transition-transform duration-300 lg:hidden",
          mobileSidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {navContent}
      </aside>

      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-xs rounded-2xl border border-gray-700 bg-[#252836] p-5 shadow-2xl sm:max-w-sm sm:p-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-500/10 mx-auto sm:h-12 sm:w-12">
              <LogOut className="h-5 w-5 text-red-500 sm:h-6 sm:w-6" />
            </div>
            <h3 className="mt-3 text-center text-base font-semibold text-white sm:mt-4 sm:text-lg">
              Confirm Logout
            </h3>
            <p className="mt-1.5 text-center text-xs text-white/50 sm:mt-2 sm:text-sm">
              Are you sure you want to sign out?
            </p>
            <div className="mt-4 flex gap-2.5 sm:mt-6 sm:gap-3">
              <button
                type="button"
                onClick={() => setShowLogoutModal(false)}
                disabled={isLoggingOut}
                className="flex-1 rounded-xl border border-gray-600 bg-transparent px-3 py-2 text-xs font-medium text-white/70 transition-colors hover:bg-white/5 disabled:opacity-50 sm:px-4 sm:py-2.5 sm:text-sm"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmLogout}
                disabled={isLoggingOut}
                className="flex-1 rounded-xl bg-[#FF6B00] px-3 py-2 text-xs font-medium text-white transition-colors hover:bg-[#E55A00] disabled:opacity-50 sm:px-4 sm:py-2.5 sm:text-sm"
              >
                {isLoggingOut ? (
                  <Loader2 className="mx-auto h-4 w-4 animate-spin" />
                ) : (
                  "Yes, Sign Out"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
