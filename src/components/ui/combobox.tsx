"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";
import { ChevronDown, X, Search } from "lucide-react";

function useIsDark() {
  const [isDark, setIsDark] = React.useState(false);

  React.useEffect(() => {
    const html = document.documentElement;
    setIsDark(html.classList.contains("dark"));

    const observer = new MutationObserver(() => {
      setIsDark(html.classList.contains("dark"));
    });
    observer.observe(html, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  return isDark;
}

export interface ComboboxOption {
  value: string;
  label: string;
}

export interface ComboboxProps {
  options: ComboboxOption[];
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  disabled?: boolean;
  className?: string;
}

function Combobox({
  options,
  value,
  onValueChange,
  placeholder = "Select...",
  searchPlaceholder = "Search...",
  emptyMessage = "No results found",
  disabled = false,
  className,
}: ComboboxProps) {
  const isDark = useIsDark();
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const [dropdownPos, setDropdownPos] = React.useState({ top: 0, left: 0, width: 0 });
  const containerRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  const selectedLabel = React.useMemo(
    () => options.find((o) => o.value === value)?.label || "",
    [options, value]
  );

  const filtered = React.useMemo(() => {
    if (!search) return options;
    const q = search.toLowerCase();
    return options.filter((o) => o.label.toLowerCase().includes(q));
  }, [options, search]);

  function updateDropdownPos() {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setDropdownPos({
        top: rect.bottom + 4,
        left: rect.left,
        width: rect.width,
      });
    }
  }

  React.useEffect(() => {
    if (!open) return;
    function handleClickOutside(e: MouseEvent) {
      if (
        containerRef.current && !containerRef.current.contains(e.target as Node) &&
        dropdownRef.current && !dropdownRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
        setSearch("");
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  React.useEffect(() => {
    if (!open) return;
    function handleReposition() { updateDropdownPos(); }
    window.addEventListener("scroll", handleReposition, true);
    window.addEventListener("resize", handleReposition);
    return () => {
      window.removeEventListener("scroll", handleReposition, true);
      window.removeEventListener("resize", handleReposition);
    };
  }, [open]);

  function handleSelect(val: string) {
    onValueChange(val === value ? "" : val);
    setOpen(false);
    setSearch("");
  }

  function handleClear(e: React.MouseEvent) {
    e.stopPropagation();
    onValueChange("");
    setSearch("");
  }

  function handleInputClick() {
    if (!disabled) {
      updateDropdownPos();
      setOpen(true);
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }

  const dropdownContent = open ? createPortal(
    <div
      ref={dropdownRef}
      className={cn(
        "fixed z-[9999] overflow-hidden rounded-lg border shadow-xl",
        isDark
          ? "border-white/10 bg-[#1A1D2E]"
          : "border-gray-200 bg-white"
      )}
      style={{ top: dropdownPos.top, left: dropdownPos.left, width: dropdownPos.width }}
    >
      <div className={cn("flex items-center border-b px-3", isDark ? "border-white/10" : "border-gray-100")}>
        <Search className={cn("h-4 w-4 shrink-0", isDark ? "text-gray-500" : "text-gray-400")} />
        <input
          ref={inputRef}
          type="text"
          placeholder={searchPlaceholder}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className={cn(
            "flex h-10 w-full bg-transparent py-2 pl-2 text-sm outline-none",
            isDark
              ? "text-gray-100 placeholder:text-gray-500"
              : "text-gray-900 placeholder:text-gray-400"
          )}
        />
      </div>

      <div className="max-h-60 overflow-y-auto p-1">
        {filtered.length === 0 ? (
          <div className={cn("py-6 text-center text-sm", isDark ? "text-gray-400" : "text-gray-500")}>
            {emptyMessage}
          </div>
        ) : (
          filtered.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => handleSelect(option.value)}
              className={cn(
                "flex w-full items-center rounded-md px-3 py-2 text-sm text-left transition-colors",
                isDark ? "hover:bg-white/5" : "hover:bg-gray-100",
                value === option.value
                  ? isDark
                    ? "bg-[#FF6B00]/10 font-medium text-[#FF9A5C]"
                    : "bg-[#FFF3EB] font-medium text-[#FF6B00]"
                  : isDark
                    ? "text-gray-300"
                    : "text-gray-700"
              )}
            >
              <span className="truncate">{option.label}</span>
            </button>
          ))
        )}
      </div>
    </div>,
    document.body
  ) : null;

  return (
    <>
      <div ref={containerRef} className={cn("relative", className)}>
        <button
          type="button"
          onClick={handleInputClick}
          disabled={disabled}
          className={cn(
            "flex h-10 w-full items-center justify-between rounded-lg border px-3 py-2 text-sm transition-colors",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6B00] focus-visible:ring-offset-1",
            "disabled:cursor-not-allowed disabled:opacity-50",
            isDark
              ? "border-white/10 bg-[#1A1D2E] text-gray-100 placeholder:text-gray-500"
              : "border-gray-200 bg-white text-gray-900 placeholder:text-gray-400",
            open && "ring-2 ring-[#FF6B00] ring-offset-1"
          )}
        >
          <span className={cn("truncate", !selectedLabel && (isDark ? "text-gray-500" : "text-gray-400"))}>
            {selectedLabel || placeholder}
          </span>
          <div className="flex items-center gap-1 shrink-0 ml-1">
            {value && !disabled && (
              <span
                onClick={handleClear}
                className={cn(
                  "rounded-full p-0.5",
                  isDark
                    ? "text-gray-500 hover:text-gray-300 hover:bg-white/10"
                    : "text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                )}
              >
                <X className="h-3.5 w-3.5" />
              </span>
            )}
            <ChevronDown className={cn("h-4 w-4 transition-transform", isDark ? "text-gray-500" : "text-gray-400", open && "rotate-180")} />
          </div>
        </button>
      </div>

      {dropdownContent}
    </>
  );
}

export { Combobox };
