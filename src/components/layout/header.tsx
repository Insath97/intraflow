"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Menu,
  Bell,
  ChevronDown,
  LogOut,
  User,
  Settings,
  Search,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/lib/auth";
import { useAppStore } from "@/stores/app-store";
import { ThemeToggle } from "./theme-toggle";

export function Header() {
  const router = useRouter();
  const { user, role, logout } = useAuthStore();
  const { toggleMobileSidebar } = useAppStore();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleLogout = () => {
    setDropdownOpen(false);
    setShowLogoutModal(true);
  };

  const confirmLogout = () => {
    setShowLogoutModal(false);
    logout();
    router.push("/login");
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/persons?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery("");
    }
  };

  const initials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "U";

  return (
    <>
    <header className="sticky top-0 z-20 flex h-16 items-center border-b border-border bg-surface/80 px-4 backdrop-blur-sm dark:border-gray-800 dark:bg-gray-900/80">
      {/* Left: Mobile Menu + Search */}
      <button
        type="button"
        onClick={toggleMobileSidebar}
        className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border bg-surface text-text-muted transition-colors hover:bg-primary-light hover:text-primary lg:hidden dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400"
        aria-label="Toggle sidebar"
      >
        <Menu className="h-5 w-5" />
      </button>

      <form onSubmit={handleSearch} className="ml-3 w-80">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted dark:text-gray-500" />
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Search persons, users, reports..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-9 w-full rounded-lg border border-border bg-background pl-9 pr-4 text-sm text-text-primary placeholder:text-text-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder:text-gray-500 dark:focus:border-primary"
          />
          <kbd className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 hidden rounded border border-border bg-surface px-1.5 py-0.5 text-[10px] font-medium text-text-muted sm:inline-block dark:border-gray-600 dark:bg-gray-700 dark:text-gray-400">
            Ctrl+K
          </kbd>
        </div>
      </form>

      {/* Right: Actions */}
      <div className="ml-auto flex items-center gap-2">
        <ThemeToggle />

        {/* Notifications */}
        <button
          type="button"
          className="relative inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-surface text-text-muted transition-colors hover:bg-primary-light hover:text-primary dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400"
          aria-label="Notifications"
        >
          <Bell className="h-4 w-4" />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-error" />
        </button>

        {/* User Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-1.5 transition-colors hover:bg-primary-light dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700"
          >
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-xs font-semibold text-white">
              {initials}
            </div>
            <span className="hidden text-sm font-medium text-text-primary dark:text-white sm:block">
              {user?.name || "User"}
            </span>
            <ChevronDown
              className={cn(
                "h-4 w-4 text-text-muted transition-transform dark:text-gray-400",
                dropdownOpen && "rotate-180"
              )}
            />
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 top-full mt-2 w-56 overflow-hidden rounded-xl border border-border bg-surface shadow-lg dark:border-gray-700 dark:bg-gray-900">
              {/* User Info */}
              <div className="border-b border-border px-4 py-3 dark:border-gray-700">
                <p className="text-sm font-medium text-text-primary dark:text-white">
                  {user?.name}
                </p>
                <p className="text-xs text-text-muted dark:text-gray-400">
                  {user?.email}
                </p>
                {role && (
                  <span className="mt-1 inline-block rounded-full bg-primary-light px-2 py-0.5 text-[10px] font-medium text-primary dark:bg-primary/20">
                    {role.name}
                  </span>
                )}
              </div>

              {/* Menu Items */}
              <div className="py-1">
                <button
                  type="button"
                  onClick={() => {
                    setDropdownOpen(false);
                    router.push("/settings");
                  }}
                  className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-text-primary transition-colors hover:bg-primary-light dark:text-gray-300 dark:hover:bg-gray-800"
                >
                  <User className="h-4 w-4" />
                  Profile
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setDropdownOpen(false);
                    router.push("/settings");
                  }}
                  className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-text-primary transition-colors hover:bg-primary-light dark:text-gray-300 dark:hover:bg-gray-800"
                >
                  <Settings className="h-4 w-4" />
                  Settings
                </button>
              </div>

              <div className="border-t border-border dark:border-gray-700">
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-error transition-colors hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30"
                >
                  <LogOut className="h-4 w-4" />
                  Sign out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>

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
