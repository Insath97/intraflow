"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  LogOut,
  Accessibility,
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
        "flex shrink-0 items-center justify-center rounded-full bg-white/20 font-semibold text-white",
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

  const handleLogout = () => {
    setShowLogoutModal(true);
  };

  const confirmLogout = () => {
    setShowLogoutModal(false);
    useAuthStore.getState().logout();
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
          "flex h-16 shrink-0 items-center border-b border-white/10 px-3",
          !sidebarOpen && "justify-center px-0"
        )}
      >
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-white/15">
            <Accessibility className="h-3.5 w-3.5 text-white" />
          </div>
          {sidebarOpen && (
            <div className="min-w-0">
              <h1 className="text-base font-bold leading-tight text-white">
                MIS
              </h1>
              <p className="truncate text-[11px] leading-tight text-white/50">
                Disability Management
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-2 py-2 sidebar-scrollbar">
        {navigation.map((group) => (
          <div key={group.title} className="mb-1">
            {group.title && sidebarOpen && (
              <h2 className="mb-0.5 px-2 pt-2 pb-0.5 text-[10px] font-semibold uppercase tracking-widest text-white/35">
                {group.title}
              </h2>
            )}
            {group.title && !sidebarOpen && <div className="my-1.5 border-t border-white/10" />}
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
                        "group flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm font-medium transition-all",
                        active
                          ? "bg-white/15 text-white"
                          : "text-white/60 hover:bg-white/8 hover:text-white/90",
                        !sidebarOpen && "justify-center px-0"
                      )}
                    >
                      <Icon
                        className={cn(
                          "h-4 w-4 shrink-0 transition-colors",
                          active
                            ? "text-white"
                            : "text-white/50 group-hover:text-white/80"
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
      <div className="shrink-0 border-t border-white/10 p-2">
        {user && (
          <div
            className={cn(
              "flex items-center gap-2",
              !sidebarOpen && "justify-center"
            )}
          >
            <UserAvatar name={user.name} size="sm" />
            {sidebarOpen && (
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-white">
                  {user.name}
                </p>
                <p className="truncate text-xs text-white/45">
                  {role?.name || "User"}
                </p>
              </div>
            )}
            {sidebarOpen && (
              <button
                type="button"
                onClick={handleLogout}
                className="shrink-0 rounded p-1 text-white/40 transition-colors hover:bg-white/10 hover:text-white"
                aria-label="Logout"
              >
                <LogOut className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        )}
        {!sidebarOpen && (
          <button
            type="button"
            onClick={handleLogout}
            className="mt-1.5 flex w-full items-center justify-center rounded p-1 text-white/40 transition-colors hover:bg-white/10 hover:text-white"
            aria-label="Logout"
          >
            <LogOut className="h-3.5 w-3.5" />
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
          "fixed inset-y-0 left-0 z-30 hidden bg-[#168B61] transition-all duration-300 lg:block dark:bg-[#0a1f15]",
          sidebarOpen ? "w-[240px]" : "w-[60px]"
        )}
      >
        {navContent}
        {/* Collapse Toggle */}
        <button
          type="button"
          onClick={toggleSidebar}
          className="absolute -right-3 top-20 z-40 flex h-6 w-6 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 shadow-sm transition-colors hover:bg-gray-50 hover:text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700"
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
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Mobile Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-[240px] bg-[#168B61] transition-transform duration-300 lg:hidden dark:bg-[#0a1f15]",
          mobileSidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {navContent}
      </aside>

      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="mx-4 w-full max-w-sm rounded-xl border border-border bg-surface p-6 shadow-2xl dark:border-gray-700 dark:bg-gray-800">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 mx-auto dark:bg-red-900/30">
              <LogOut className="h-6 w-6 text-red-600 dark:text-red-400" />
            </div>
            <h3 className="mt-4 text-center text-lg font-semibold text-text-primary dark:text-white">
              Confirm Logout
            </h3>
            <p className="mt-2 text-center text-sm text-text-muted dark:text-gray-400">
              Are you sure you want to sign out of the system?
            </p>
            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => setShowLogoutModal(false)}
                className="flex-1 rounded-lg border border-border bg-surface px-4 py-2.5 text-sm font-medium text-text-primary transition-colors hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmLogout}
                className="flex-1 rounded-lg bg-[#168B61] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#0F684A]"
              >
                Yes, Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
