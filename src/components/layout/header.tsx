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
  Loader2,
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
  const [isLoggingOut, setIsLoggingOut] = useState(false);
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

  const confirmLogout = async () => {
    setIsLoggingOut(true);
    await logout();
    setShowLogoutModal(false);
    setIsLoggingOut(false);
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
    <header className="sticky top-0 z-20 flex h-16 items-center border-b border-gray-200 bg-[#F8F9FA]/80 px-4 backdrop-blur-sm dark:border-white/5 dark:bg-[#0F1117]/80">
      {/* Left: Mobile Menu + Search */}
      <button
        type="button"
        onClick={toggleMobileSidebar}
        className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 transition-colors hover:bg-gray-50 lg:hidden dark:border-white/10 dark:bg-[#1A1D2E] dark:text-gray-400 dark:hover:bg-[#252836]"
        aria-label="Toggle sidebar"
      >
        <Menu className="h-5 w-5" />
      </button>

      <form onSubmit={handleSearch} className="ml-3 w-80">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Search persons, users, reports..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-9 w-full rounded-lg border border-gray-200 bg-white pl-9 pr-4 text-sm text-gray-900 placeholder:text-gray-400 focus:border-[#FF6B00] focus:outline-none focus:ring-1 focus:ring-[#FF6B00]/30 dark:border-white/10 dark:bg-[#1A1D2E] dark:text-white dark:placeholder:text-gray-500 dark:focus:border-[#FF6B00]"
          />
          <kbd className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 hidden rounded border border-gray-200 bg-gray-50 px-1.5 py-0.5 text-[10px] font-medium text-gray-400 sm:inline-block dark:border-white/10 dark:bg-[#252836] dark:text-gray-500">
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
          className="relative inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 transition-colors hover:bg-gray-50 dark:border-white/10 dark:bg-[#1A1D2E] dark:text-gray-400 dark:hover:bg-[#252836]"
          aria-label="Notifications"
        >
          <Bell className="h-4 w-4" />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-[#FF6B00]" />
        </button>

        {/* User Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-1.5 transition-colors hover:bg-gray-50 dark:border-white/10 dark:bg-[#1A1D2E] dark:hover:bg-[#252836]"
          >
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#FF6B00] text-xs font-semibold text-white">
              {initials}
            </div>
            <span className="hidden text-sm font-medium text-gray-900 dark:text-white sm:block">
              {user?.name || "User"}
            </span>
            <ChevronDown
              className={cn(
                "h-4 w-4 text-gray-400 transition-transform",
                dropdownOpen && "rotate-180"
              )}
            />
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 top-full mt-2 w-56 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg dark:border-white/10 dark:bg-[#1A1D2E]">
              {/* User Info */}
              <div className="border-b border-gray-100 px-4 py-3 dark:border-white/5">
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {user?.name}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {user?.email}
                </p>
                {role && (
                  <span className="mt-1 inline-block rounded-full bg-[#FF6B00]/10 px-2 py-0.5 text-[10px] font-medium text-[#FF6B00]">
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
                  className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 transition-colors hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-white/5"
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
                  className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 transition-colors hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-white/5"
                >
                  <Settings className="h-4 w-4" />
                  Settings
                </button>
              </div>

              <div className="border-t border-gray-100 dark:border-white/5">
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-red-500 transition-colors hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10"
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
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-xs rounded-2xl border border-gray-200 bg-white p-5 shadow-2xl sm:max-w-sm sm:p-6 dark:border-white/10 dark:bg-[#1A1D2E]">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 mx-auto sm:h-12 sm:w-12 dark:bg-red-500/10">
              <LogOut className="h-5 w-5 text-red-500 sm:h-6 sm:w-6" />
            </div>
            <h3 className="mt-3 text-center text-base font-semibold text-gray-900 sm:mt-4 sm:text-lg dark:text-white">
              Confirm Logout
            </h3>
            <p className="mt-1.5 text-center text-xs text-gray-500 sm:mt-2 sm:text-sm dark:text-gray-400">
              Are you sure you want to sign out?
            </p>
            <div className="mt-4 flex gap-2.5 sm:mt-6 sm:gap-3">
              <button
                type="button"
                onClick={() => setShowLogoutModal(false)}
                disabled={isLoggingOut}
                className="flex-1 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50 sm:px-4 sm:py-2.5 sm:text-sm dark:border-white/10 dark:bg-transparent dark:text-gray-300 dark:hover:bg-white/5"
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
