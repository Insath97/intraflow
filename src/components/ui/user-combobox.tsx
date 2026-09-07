"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";
import { usersApi, type UserSimple } from "@/lib/api/users";
import { roleService, type RoleSimple } from "@/services/role.service";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChevronDown, X, Search, UserPlus, Loader2, Check } from "lucide-react";

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

export interface UserComboboxProps {
  value: string;
  onValueChange: (userId: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  disabled?: boolean;
  className?: string;
  excludeIds?: string[];
}

export function UserCombobox({
  value,
  onValueChange,
  placeholder = "Select user",
  searchPlaceholder = "Search users...",
  disabled = false,
  className,
  excludeIds = [],
}: UserComboboxProps) {
  const isDark = useIsDark();
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const [users, setUsers] = React.useState<UserSimple[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [createOpen, setCreateOpen] = React.useState(false);
  const [creating, setCreating] = React.useState(false);
  const [dropdownPos, setDropdownPos] = React.useState({ top: 0, left: 0, width: 0 });

  const containerRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  const [form, setForm] = React.useState({
    f_name: "",
    l_name: "",
    email: "",
    username: "",
    employee_code: "",
    password: "",
    role_id: "",
  });
  const [formErrors, setFormErrors] = React.useState<Record<string, string>>({});
  const [roles, setRoles] = React.useState<RoleSimple[]>([]);

  const selectedUser = React.useMemo(
    () => users.find((u) => u.id === value),
    [users, value]
  );

  const selectedLabel = React.useMemo(() => {
    if (!selectedUser) return "";
    return selectedUser.designation
      ? `${selectedUser.full_name} — ${selectedUser.designation}`
      : selectedUser.full_name;
  }, [selectedUser]);

  const excludeSet = React.useMemo(() => new Set(excludeIds), [excludeIds]);

  const filtered = React.useMemo(() => {
    const available = users.filter((u) => !excludeSet.has(u.id));
    if (!search) return available;
    const q = search.toLowerCase();
    return available.filter(
      (u) =>
        u.full_name.toLowerCase().includes(q) ||
        u.username.toLowerCase().includes(q) ||
        u.employee_code.toLowerCase().includes(q) ||
        (u.designation && u.designation.toLowerCase().includes(q))
    );
  }, [users, search, excludeSet]);

  React.useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const res = await usersApi.simple(true);
        if (res.data.status === "success") setUsers(res.data.data);
      } catch { /* ignore */ }
      finally { setLoading(false); }
    }
    load();
  }, []);

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

  async function openCreateDialog() {
    setOpen(false);
    setSearch("");
    setCreateOpen(true);
    setFormErrors({});
    setForm({ f_name: "", l_name: "", email: "", username: "", employee_code: "", password: "", role_id: "" });
    try {
      const res = await roleService.list();
      if (res.data.status === "success" && Array.isArray(res.data.data)) {
        setRoles(res.data.data);
      }
    } catch { /* ignore */ }
  }

  function validateCreate(): boolean {
    const errs: Record<string, string> = {};
    if (!form.f_name.trim()) errs.f_name = "Required";
    if (!form.l_name.trim()) errs.l_name = "Required";
    if (!form.email.trim()) errs.email = "Required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) errs.email = "Invalid email";
    if (!form.username.trim()) errs.username = "Required";
    if (!form.employee_code.trim()) errs.employee_code = "Required";
    if (!form.password.trim()) errs.password = "Required";
    else if (form.password.length < 6) errs.password = "Min 6 chars";
    if (!form.role_id) errs.role_id = "Required";
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleCreate() {
    if (!validateCreate()) return;
    setCreating(true);
    try {
      const fd = new FormData();
      fd.append("f_name", form.f_name.trim());
      fd.append("l_name", form.l_name.trim());
      fd.append("username", form.username.trim().toLowerCase());
      fd.append("email", form.email.trim().toLowerCase());
      fd.append("employee_code", form.employee_code.trim());
      fd.append("password", form.password);
      fd.append("role_id", form.role_id);

      const res = await usersApi.create(fd);
      if (res.data.status === "success") {
        const created = res.data.data;
        const newUser: UserSimple = {
          id: created.id,
          f_name: created.f_name,
          l_name: created.l_name,
          full_name: created.full_name,
          username: created.username,
          employee_code: created.employee_code,
          designation: created.designation || null,
        };
        setUsers((prev) => [...prev, newUser]);
        onValueChange(newUser.id);
        setCreateOpen(false);
      } else {
        setFormErrors({ submit: res.data.message || "Failed to create user" });
      }
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } }; message?: string };
      setFormErrors({ submit: axiosErr.response?.data?.message || axiosErr.message || "An error occurred" });
    } finally {
      setCreating(false);
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
        {filtered.length === 0 && !search && (
          <div className={cn("py-6 text-center text-sm", isDark ? "text-gray-400" : "text-gray-500")}>
            No users available
          </div>
        )}
        {filtered.length === 0 && search && (
          <div className={cn("py-6 text-center text-sm", isDark ? "text-gray-400" : "text-gray-500")}>
            No users found
          </div>
        )}
        {filtered.map((user) => (
          <button
            key={user.id}
            type="button"
            onClick={() => handleSelect(user.id)}
            className={cn(
              "flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-left transition-colors",
              isDark ? "hover:bg-white/5" : "hover:bg-gray-100",
              value === user.id
                ? isDark
                  ? "bg-[#FF6B00]/10 font-medium text-[#FF9A5C]"
                  : "bg-[#FFF3EB] font-medium text-[#FF6B00]"
                : isDark
                  ? "text-gray-300"
                  : "text-gray-700"
            )}
          >
            <div className="flex min-w-0 flex-1 flex-col">
              <span className="truncate font-medium">{user.full_name}</span>
              <span className={cn("truncate text-xs", isDark ? "text-gray-500" : "text-gray-400")}>
                {user.employee_code}
                {user.designation && ` · ${user.designation}`}
              </span>
            </div>
            {value === user.id && <Check className="h-3.5 w-3.5 shrink-0" />}
          </button>
        ))}
      </div>

      <div className={cn("border-t p-1", isDark ? "border-white/10" : "border-gray-100")}>
        <button
          type="button"
          onClick={openCreateDialog}
          className={cn(
            "flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-[#FF6B00] transition-colors",
            isDark ? "hover:bg-[#FF6B00]/10" : "hover:bg-[#FFF3EB]"
          )}
        >
          <UserPlus className="h-4 w-4" />
          Create new user
        </button>
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
            {loading ? "Loading..." : selectedLabel || placeholder}
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

      <Dialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Create New User"
        className="max-w-md"
        footer={
          <>
            <Button variant="outline" onClick={() => setCreateOpen(false)} disabled={creating}>Cancel</Button>
            <Button onClick={handleCreate} disabled={creating}>
              {creating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserPlus className="mr-2 h-4 w-4" />}
              {creating ? "Creating..." : "Create User"}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          {formErrors.submit && (
            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
              {formErrors.submit}
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                First Name <span className="text-red-500">*</span>
              </label>
              <Input
                placeholder="First name"
                value={form.f_name}
                onChange={(e) => setForm({ ...form, f_name: e.target.value })}
                error={!!formErrors.f_name}
              />
              {formErrors.f_name && <p className="mt-1 text-xs text-red-500">{formErrors.f_name}</p>}
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Last Name <span className="text-red-500">*</span>
              </label>
              <Input
                placeholder="Last name"
                value={form.l_name}
                onChange={(e) => setForm({ ...form, l_name: e.target.value })}
                error={!!formErrors.l_name}
              />
              {formErrors.l_name && <p className="mt-1 text-xs text-red-500">{formErrors.l_name}</p>}
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Email <span className="text-red-500">*</span>
            </label>
            <Input
              type="email"
              placeholder="user@example.com"
              value={form.email}
              onChange={(e) => {
                const email = e.target.value;
                setForm({
                  ...form,
                  email,
                  username: form.username || email.split("@")[0],
                });
              }}
              error={!!formErrors.email}
            />
            {formErrors.email && <p className="mt-1 text-xs text-red-500">{formErrors.email}</p>}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Username <span className="text-red-500">*</span>
              </label>
              <Input
                placeholder="e.g. john_doe"
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                error={!!formErrors.username}
              />
              {formErrors.username && <p className="mt-1 text-xs text-red-500">{formErrors.username}</p>}
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Employee Code <span className="text-red-500">*</span>
              </label>
              <Input
                placeholder="e.g. EMP-001"
                value={form.employee_code}
                onChange={(e) => setForm({ ...form, employee_code: e.target.value })}
                error={!!formErrors.employee_code}
              />
              {formErrors.employee_code && <p className="mt-1 text-xs text-red-500">{formErrors.employee_code}</p>}
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Role <span className="text-red-500">*</span>
            </label>
            <select
              value={form.role_id}
              onChange={(e) => setForm({ ...form, role_id: e.target.value })}
              className={cn(
                "flex h-10 w-full appearance-none rounded-lg border bg-white px-3 py-2 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6B00] focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50 border-gray-200 dark:border-white/10 dark:bg-[#1A1D2E] dark:text-gray-100"
              )}
            >
              <option value="">Select role</option>
              {roles.map((r) => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>
            {formErrors.role_id && <p className="mt-1 text-xs text-red-500">{formErrors.role_id}</p>}
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Password <span className="text-red-500">*</span>
            </label>
            <Input
              type="password"
              placeholder="Min. 6 characters"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              error={!!formErrors.password}
            />
            {formErrors.password && <p className="mt-1 text-xs text-red-500">{formErrors.password}</p>}
          </div>
        </div>
      </Dialog>
    </>
  );
}
