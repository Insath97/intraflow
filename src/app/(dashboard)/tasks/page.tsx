"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";
import {
  taskService,
  type TaskItem,
  type TaskStats,
  type TaskStatus,
  type TaskPriority,
  STATUS_COLORS,
  PRIORITY_COLORS,
} from "@/lib/api/tasks";
import { projectService } from "@/lib/api/projects";
import { moduleService, type ModuleItem } from "@/lib/api/modules";
import { usersApi, type UserSimple } from "@/lib/api/users";
import { useToast } from "@/components/ui/toast";
import { PageHeader } from "@/components/common/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { cn } from "@/lib/utils";
import {
  Plus, Search, ClipboardList, Trash2, Pencil, Eye, AlertCircle,
  ChevronLeft, ChevronRight, FolderOpen, User, CheckCircle2,
  ArrowUpDown, ChevronDown, X, Check, Circle,
} from "lucide-react";

function useIsDark() {
  const [isDark, setIsDark] = useState(false);
  useEffect(() => {
    const html = document.documentElement;
    setIsDark(html.classList.contains("dark"));
    const obs = new MutationObserver(() => setIsDark(html.classList.contains("dark")));
    obs.observe(html, { attributes: true, attributeFilter: ["class"] });
    return () => obs.disconnect();
  }, []);
  return isDark;
}

interface DropdownItem { id: string; name: string; code?: string; }
interface UserDropdown { id: string; full_name: string; employee_code?: string; designation?: string | null; }

function SimpleCombobox({ value, onValueChange, items, placeholder, searchPlaceholder, renderLabel, loading }: {
  value: string; onValueChange: (id: string) => void; items: DropdownItem[];
  placeholder?: string; searchPlaceholder?: string; loading?: boolean;
  renderLabel?: (item: DropdownItem) => React.ReactNode;
}) {
  const isDark = useIsDark();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ top: 0, left: 0, width: 0 });

  const selected = useMemo(() => items.find((i) => i.id === value), [items, value]);
  const filtered = useMemo(() => {
    if (!search) return items;
    const q = search.toLowerCase();
    return items.filter((i) => i.name.toLowerCase().includes(q) || (i.code && i.code.toLowerCase().includes(q)));
  }, [items, search]);

  function updatePos() {
    if (containerRef.current) {
      const r = containerRef.current.getBoundingClientRect();
      setPos({ top: r.bottom + 4, left: r.left, width: r.width });
    }
  }

  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node) && dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false); setSearch("");
      }
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const r = () => updatePos();
    window.addEventListener("scroll", r, true); window.addEventListener("resize", r);
    return () => { window.removeEventListener("scroll", r, true); window.removeEventListener("resize", r); };
  }, [open]);

  const dd = open ? createPortal(
    <div ref={dropdownRef} className={cn("fixed z-[9999] overflow-hidden rounded-lg border shadow-xl", isDark ? "border-white/10 bg-[#1A1D2E]" : "border-gray-200 bg-white")} style={{ top: pos.top, left: pos.left, width: pos.width }}>
      <div className={cn("flex items-center border-b px-3", isDark ? "border-white/10" : "border-gray-100")}>
        <Search className={cn("h-4 w-4 shrink-0", isDark ? "text-gray-500" : "text-gray-400")} />
        <input ref={inputRef} type="text" placeholder={searchPlaceholder || "Search..."} value={search} onChange={(e) => setSearch(e.target.value)} className={cn("flex h-10 w-full bg-transparent py-2 pl-2 text-sm outline-none", isDark ? "text-gray-100 placeholder:text-gray-500" : "text-gray-900 placeholder:text-gray-400")} />
      </div>
      <div className="max-h-60 overflow-y-auto p-1">
        {loading && <div className={cn("py-6 text-center text-sm", isDark ? "text-gray-400" : "text-gray-500")}>Loading...</div>}
        {!loading && filtered.length === 0 && <div className={cn("py-6 text-center text-sm", isDark ? "text-gray-400" : "text-gray-500")}>No results</div>}
        {filtered.map((item) => (
          <button key={item.id} type="button" onClick={() => { onValueChange(value === item.id ? "" : item.id); setOpen(false); setSearch(""); }}
            className={cn("flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-left transition-colors", isDark ? "hover:bg-white/5" : "hover:bg-gray-100",
              value === item.id ? (isDark ? "bg-[#FF6B00]/10 font-medium text-[#FF9A5C]" : "bg-[#FFF3EB] font-medium text-[#FF6B00]") : (isDark ? "text-gray-300" : "text-gray-700"))}>
            <div className="flex min-w-0 flex-1 items-center gap-2">
              {renderLabel ? renderLabel(item) : <span className="truncate">{item.name}</span>}
            </div>
            {value === item.id && <Check className="h-3.5 w-3.5 shrink-0" />}
          </button>
        ))}
      </div>
    </div>, document.body
  ) : null;

  return (
    <div ref={containerRef} className="relative">
      <button type="button" onClick={() => { updatePos(); setOpen(true); setTimeout(() => inputRef.current?.focus(), 0); }}
        className={cn("flex h-10 w-full items-center justify-between rounded-lg border px-3 py-2 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6B00] focus-visible:ring-offset-1",
          isDark ? "border-white/10 bg-[#1A1D2E] text-gray-100" : "border-gray-200 bg-white text-gray-900", open && "ring-2 ring-[#FF6B00] ring-offset-1")}>
        <span className={cn("truncate", !selected && (isDark ? "text-gray-500" : "text-gray-400"))}>{loading ? "Loading..." : selected ? (renderLabel ? renderLabel(selected) : selected.name) : (placeholder || "Select")}</span>
        <div className="flex items-center gap-1 shrink-0 ml-1">
          {value && <span onClick={(e) => { e.stopPropagation(); onValueChange(""); }} className={cn("rounded-full p-0.5", isDark ? "text-gray-500 hover:text-gray-300 hover:bg-white/10" : "text-gray-400 hover:text-gray-600 hover:bg-gray-100")}><X className="h-3.5 w-3.5" /></span>}
          <ChevronDown className={cn("h-4 w-4 transition-transform", isDark ? "text-gray-500" : "text-gray-400", open && "rotate-180")} />
        </div>
      </button>
      {dd}
    </div>
  );
}

function UserComboboxFilter({ value, onValueChange, users, loading }: { value: string; onValueChange: (id: string) => void; users: UserDropdown[]; loading: boolean; }) {
  const isDark = useIsDark();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ top: 0, left: 0, width: 0 });

  const selected = useMemo(() => users.find((u) => u.id === value), [users, value]);
  const filtered = useMemo(() => {
    if (!search) return users;
    const q = search.toLowerCase();
    return users.filter((u) => u.full_name.toLowerCase().includes(q) || u.employee_code?.toLowerCase().includes(q));
  }, [users, search]);

  function updatePos() { if (containerRef.current) { const r = containerRef.current.getBoundingClientRect(); setPos({ top: r.bottom + 4, left: r.left, width: r.width }); } }
  useEffect(() => { if (!open) return; const h = (e: MouseEvent) => { if (containerRef.current && !containerRef.current.contains(e.target as Node) && dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) { setOpen(false); setSearch(""); } }; document.addEventListener("mousedown", h); return () => document.removeEventListener("mousedown", h); }, [open]);
  useEffect(() => { if (!open) return; const r = () => updatePos(); window.addEventListener("scroll", r, true); window.addEventListener("resize", r); return () => { window.removeEventListener("scroll", r, true); window.removeEventListener("resize", r); }; }, [open]);

  const dd = open ? createPortal(
    <div ref={dropdownRef} className={cn("fixed z-[9999] overflow-hidden rounded-lg border shadow-xl", isDark ? "border-white/10 bg-[#1A1D2E]" : "border-gray-200 bg-white")} style={{ top: pos.top, left: pos.left, width: pos.width }}>
      <div className={cn("flex items-center border-b px-3", isDark ? "border-white/10" : "border-gray-100")}>
        <Search className={cn("h-4 w-4 shrink-0", isDark ? "text-gray-500" : "text-gray-400")} />
        <input ref={inputRef} type="text" placeholder="Search users..." value={search} onChange={(e) => setSearch(e.target.value)} className={cn("flex h-10 w-full bg-transparent py-2 pl-2 text-sm outline-none", isDark ? "text-gray-100 placeholder:text-gray-500" : "text-gray-900 placeholder:text-gray-400")} />
      </div>
      <div className="max-h-60 overflow-y-auto p-1">
        {loading && <div className={cn("py-6 text-center text-sm", isDark ? "text-gray-400" : "text-gray-500")}>Loading...</div>}
        {!loading && filtered.length === 0 && <div className={cn("py-6 text-center text-sm", isDark ? "text-gray-400" : "text-gray-500")}>No users found</div>}
        {filtered.map((u) => (
          <button key={u.id} type="button" onClick={() => { onValueChange(value === u.id ? "" : u.id); setOpen(false); setSearch(""); }}
            className={cn("flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-left transition-colors", isDark ? "hover:bg-white/5" : "hover:bg-gray-100",
              value === u.id ? (isDark ? "bg-[#FF6B00]/10 font-medium text-[#FF9A5C]" : "bg-[#FFF3EB] font-medium text-[#FF6B00]") : (isDark ? "text-gray-300" : "text-gray-700"))}>
            <div className="flex min-w-0 flex-1 flex-col">
              <span className="truncate font-medium">{u.full_name}</span>
              {u.employee_code && <span className={cn("truncate text-xs", isDark ? "text-gray-500" : "text-gray-400")}>{u.employee_code}</span>}
            </div>
            {value === u.id && <Check className="h-3.5 w-3.5 shrink-0" />}
          </button>
        ))}
      </div>
    </div>, document.body
  ) : null;

  return (
    <div ref={containerRef} className="relative">
      <button type="button" onClick={() => { updatePos(); setOpen(true); setTimeout(() => inputRef.current?.focus(), 0); }}
        className={cn("flex h-10 w-full items-center justify-between rounded-lg border px-3 py-2 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6B00] focus-visible:ring-offset-1",
          isDark ? "border-white/10 bg-[#1A1D2E] text-gray-100" : "border-gray-200 bg-white text-gray-900", open && "ring-2 ring-[#FF6B00] ring-offset-1")}>
        <span className={cn("truncate", !selected && (isDark ? "text-gray-500" : "text-gray-400"))}>{loading ? "Loading..." : selected?.full_name || "Assignee"}</span>
        <div className="flex items-center gap-1 shrink-0 ml-1">
          {value && <span onClick={(e) => { e.stopPropagation(); onValueChange(""); }} className={cn("rounded-full p-0.5", isDark ? "text-gray-500 hover:text-gray-300 hover:bg-white/10" : "text-gray-400 hover:text-gray-600 hover:bg-gray-100")}><X className="h-3.5 w-3.5" /></span>}
          <ChevronDown className={cn("h-4 w-4 transition-transform", isDark ? "text-gray-500" : "text-gray-400", open && "rotate-180")} />
        </div>
      </button>
      {dd}
    </div>
  );
}

const ALL_STATUSES: TaskStatus[] = ["TODO", "IN_PROGRESS", "BLOCKED", "IN_REVIEW", "COMPLETED", "CANCELLED"];
const ALL_PRIORITIES: TaskPriority[] = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];
const STATUS_LABELS: Record<TaskStatus, string> = { TODO: "To Do", IN_PROGRESS: "In Progress", BLOCKED: "Blocked", IN_REVIEW: "In Review", COMPLETED: "Completed", CANCELLED: "Cancelled" };
const PRIORITY_LABELS: Record<TaskPriority, string> = { LOW: "Low", MEDIUM: "Medium", HIGH: "High", CRITICAL: "Critical" };

export default function TasksPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [stats, setStats] = useState<TaskStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const [projects, setProjects] = useState<DropdownItem[]>([]);
  const [modules, setModules] = useState<ModuleItem[]>([]);
  const [users, setUsers] = useState<UserDropdown[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [loadingModules, setLoadingModules] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(true);

  const [selectedProject, setSelectedProject] = useState("");
  const [selectedModule, setSelectedModule] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [selectedPriority, setSelectedPriority] = useState("");
  const [selectedAssignee, setSelectedAssignee] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [sortBy, setSortBy] = useState("created_at");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingTask, setDeletingTask] = useState<TaskItem | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkDeleting, setBulkDeleting] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const [pRes, uRes, sRes] = await Promise.all([
          projectService.dropdown(),
          usersApi.simple(true),
          taskService.getStats(),
        ]);
        if (pRes.data.status === "success") setProjects(pRes.data.data);
        if (uRes.data.status === "success") setUsers(uRes.data.data);
        if (sRes.data.status === "success") setStats(sRes.data.data);
      } catch { /* ignore */ }
      setLoadingProjects(false); setLoadingUsers(false);
    }
    load();
  }, []);

  useEffect(() => {
    if (!selectedProject) { setModules([]); return; }
    async function load() {
      setLoadingModules(true);
      try {
        const res = await moduleService.getAll({ project_id: selectedProject });
        if (res.data.status === "success") setModules(res.data.data);
      } catch { /* ignore */ }
      setLoadingModules(false);
    }
    load();
  }, [selectedProject]);

  useEffect(() => { setSelectedModule(""); }, [selectedProject]);

  useEffect(() => { const t = setTimeout(() => setDebouncedSearch(searchQuery), 300); return () => clearTimeout(t); }, [searchQuery]);

  const fetchTasks = useCallback(async () => {
    try {
      setLoading(true);
      const res = await taskService.getAll({
        search: debouncedSearch || undefined,
        project_id: selectedProject || undefined,
        module_id: selectedModule || undefined,
        assigned_to: selectedAssignee || undefined,
        status: (selectedStatus as TaskStatus) || undefined,
        priority: (selectedPriority as TaskPriority) || undefined,
        sort_by: sortBy,
        sort_order: sortOrder,
        page,
        size: 15,
      });
      if (res.data.status === "success") {
        const d = res.data.data;
        setTasks(d.items); setTotalPages(d.total_pages); setTotalCount(d.total_count);
      }
    } catch { toast("Failed to load tasks", "error"); }
    finally { setLoading(false); }
  }, [debouncedSearch, selectedProject, selectedModule, selectedAssignee, selectedStatus, selectedPriority, sortBy, sortOrder, page, toast]);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);
  useEffect(() => { setSelectedIds([]); }, [page]);

  async function reloadStats() {
    try { const res = await taskService.getStats(); if (res.data.status === "success") setStats(res.data.data); } catch { /* ignore */ }
  }

  async function handleDelete() {
    if (!deletingTask) return;
    setDeleting(true);
    try {
      const res = await taskService.delete(deletingTask.id);
      if (res.data.status === "success") { toast(res.data.message || "Task deleted", "success"); fetchTasks(); reloadStats(); }
      else toast(res.data.message || "Failed to delete", "error");
    } catch (err: unknown) { const e = err as { response?: { data?: { message?: string } }; message?: string }; toast(e.response?.data?.message || e.message || "Error", "error"); }
    finally { setDeleting(false); setDeleteDialogOpen(false); setDeletingTask(null); }
  }

  async function handleBulkDelete() {
    if (!selectedIds.length) return;
    setBulkDeleting(true);
    try {
      const res = await taskService.bulkDelete(selectedIds);
      if (res.data.status === "success") { toast(res.data.message || "Deleted", "success"); setSelectedIds([]); fetchTasks(); reloadStats(); }
      else toast(res.data.message || "Failed", "error");
    } catch (err: unknown) { const e = err as { response?: { data?: { message?: string } }; message?: string }; toast(e.response?.data?.message || e.message || "Error", "error"); }
    finally { setBulkDeleting(false); }
  }

  function toggleSort(col: string) {
    if (sortBy === col) setSortOrder((o) => o === "asc" ? "desc" : "asc");
    else { setSortBy(col); setSortOrder("asc"); }
  }

  const completedCount = stats?.by_status?.COMPLETED || 0;
  const inProgressCount = stats?.by_status?.IN_PROGRESS || 0;
  const blockedCount = stats?.by_status?.BLOCKED || 0;

  return (
    <div className="space-y-6">
      <PageHeader title="Tasks" description="Manage and track all project tasks" breadcrumbs={[{ label: "Dashboard", onClick: () => router.push("/dashboard") }, { label: "Tasks" }]}
        actions={<Button onClick={() => router.push("/tasks/create")}><Plus className="mr-2 h-4 w-4" />Add Task</Button>} />

      {stats && (
        <div className="grid gap-4 sm:grid-cols-4">
          <Card><CardContent className="p-4"><div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#FFF3EB] text-[#FF6B00]"><ClipboardList className="h-5 w-5" /></div>
            <div><p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.total}</p><p className="text-sm text-gray-500 dark:text-gray-400">Total Tasks</p></div>
          </div></CardContent></Card>
          <Card><CardContent className="p-4"><div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-blue-600"><Circle className="h-5 w-5" /></div>
            <div><p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{inProgressCount}</p><p className="text-sm text-gray-500 dark:text-gray-400">In Progress</p></div>
          </div></CardContent></Card>
          <Card><CardContent className="p-4"><div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 text-green-600"><CheckCircle2 className="h-5 w-5" /></div>
            <div><p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{completedCount}</p><p className="text-sm text-gray-500 dark:text-gray-400">Completed</p></div>
          </div></CardContent></Card>
          <Card><CardContent className="p-4"><div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-100 text-red-600"><AlertCircle className="h-5 w-5" /></div>
            <div><p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{blockedCount}</p><p className="text-sm text-gray-500 dark:text-gray-400">Blocked</p></div>
          </div></CardContent></Card>
        </div>
      )}

      <Card><CardContent className="p-4">
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input placeholder="Search tasks..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9" />
            </div>
            <div className="w-full sm:w-48"><SimpleCombobox value={selectedProject} onValueChange={setSelectedProject} items={projects} placeholder="All Projects" loading={loadingProjects} /></div>
            <div className="w-full sm:w-48"><SimpleCombobox value={selectedModule} onValueChange={setSelectedModule} items={modules.map((m) => ({ id: m.id, name: m.name }))} placeholder="All Modules" loading={loadingModules} /></div>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="w-full sm:w-40">
              <select value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)} className="flex h-10 w-full appearance-none rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-[#1A1D2E] dark:text-gray-100">
                <option value="">All Statuses</option>
                {ALL_STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
              </select>
            </div>
            <div className="w-full sm:w-40">
              <select value={selectedPriority} onChange={(e) => setSelectedPriority(e.target.value)} className="flex h-10 w-full appearance-none rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-[#1A1D2E] dark:text-gray-100">
                <option value="">All Priorities</option>
                {ALL_PRIORITIES.map((p) => <option key={p} value={p}>{PRIORITY_LABELS[p]}</option>)}
              </select>
            </div>
            <div className="w-full sm:w-48"><UserComboboxFilter value={selectedAssignee} onValueChange={setSelectedAssignee} users={users} loading={loadingUsers} /></div>
          </div>
        </div>
      </CardContent></Card>

      {selectedIds.length > 0 && (
        <div className="flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 dark:border-red-900/30 dark:bg-red-900/10">
          <AlertCircle className="h-4 w-4 text-red-500" />
          <span className="text-sm text-red-700 dark:text-red-400">{selectedIds.length} task{selectedIds.length > 1 ? "s" : ""} selected</span>
          <Button variant="destructive" size="sm" onClick={handleBulkDelete} disabled={bulkDeleting} className="ml-auto"><Trash2 className="mr-1 h-3 w-3" />{bulkDeleting ? "Deleting..." : "Delete Selected"}</Button>
        </div>
      )}

      <Card>
        {loading ? (
          <div className="p-12 text-center"><div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-[#FF6B00]" /><p className="mt-3 text-sm text-gray-500 dark:text-gray-400">Loading tasks...</p></div>
        ) : tasks.length === 0 ? (
          <div className="p-12 text-center">
            <ClipboardList className="mx-auto h-12 w-12 text-gray-300 dark:text-gray-600" />
            <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-gray-100">No Tasks Found</h3>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">{debouncedSearch || selectedProject || selectedModule || selectedStatus || selectedPriority || selectedAssignee ? "Try adjusting your filters." : "Create your first task."}</p>
            {!debouncedSearch && !selectedProject && (
              <Button onClick={() => router.push("/tasks/create")} className="mt-4"><Plus className="mr-2 h-4 w-4" />Add Task</Button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 dark:border-white/5">
                  <th className="px-4 py-3 text-left"><input type="checkbox" checked={selectedIds.length === tasks.length && tasks.length > 0} onChange={() => setSelectedIds(selectedIds.length === tasks.length ? [] : tasks.map((t) => t.id))} className="h-4 w-4 rounded border-gray-300 text-[#FF6B00]" /></th>
                  <th className="px-4 py-3 text-left cursor-pointer select-none" onClick={() => toggleSort("title")}>
                    <div className="flex items-center gap-1 text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Title<ArrowUpDown className="h-3 w-3" /></div>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Priority</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Assignee</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Progress</th>
                  <th className="px-4 py-3 text-left cursor-pointer select-none" onClick={() => toggleSort("due_date")}>
                    <div className="flex items-center gap-1 text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Due Date<ArrowUpDown className="h-3 w-3" /></div>
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-white/5">
                {tasks.map((task) => {
                  const sc = STATUS_COLORS[task.status]; const pc = PRIORITY_COLORS[task.priority];
                  const progress = task.subtask_count > 0 ? Math.round((task.completed_subtask_count / task.subtask_count) * 100) : task.completion_pct;
                  return (
                    <tr key={task.id} className="transition-colors hover:bg-gray-50/50 dark:hover:bg-white/[0.02]">
                      <td className="px-4 py-3"><input type="checkbox" checked={selectedIds.includes(task.id)} onChange={() => setSelectedIds((p) => p.includes(task.id) ? p.filter((i) => i !== task.id) : [...p, task.id])} className="h-4 w-4 rounded border-gray-300 text-[#FF6B00]" /></td>
                      <td className="px-4 py-3">
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate max-w-[280px]">{task.title}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-xs text-gray-400">{task.project.code}</span>
                            {task.module && <><span className="text-gray-300 dark:text-gray-600">·</span><span className="text-xs text-gray-400">{task.module.name}</span></>}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3"><span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium", sc.bg, sc.text)}><span className={cn("h-1.5 w-1.5 rounded-full", sc.dot)} />{STATUS_LABELS[task.status]}</span></td>
                      <td className="px-4 py-3"><span className={cn("inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium", pc.bg, pc.text)}>{PRIORITY_LABELS[task.priority]}</span></td>
                      <td className="px-4 py-3"><span className="text-sm text-gray-700 dark:text-gray-300">{task.assigned_to.full_name}</span></td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-16 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700"><div className="h-full rounded-full bg-[#FF6B00] transition-all" style={{ width: `${progress}%` }} /></div>
                          <span className="text-xs text-gray-500 dark:text-gray-400 w-8">{progress}%</span>
                        </div>
                      </td>
                      <td className="px-4 py-3"><span className="text-sm text-gray-500 dark:text-gray-400">{task.due_date ? new Date(task.due_date).toLocaleDateString() : "-"}</span></td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => router.push(`/tasks/${task.id}`)}><Eye className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => router.push(`/tasks/${task.id}/edit`)}><Pencil className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-600" onClick={() => { setDeletingTask(task); setDeleteDialogOpen(true); }}><Trash2 className="h-4 w-4" /></Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-gray-100 px-4 py-3 dark:border-white/5">
            <span className="text-sm text-gray-500 dark:text-gray-400">Page {page} of {totalPages} ({totalCount} tasks)</span>
            <div className="flex items-center gap-1">
              <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}><ChevronLeft className="h-4 w-4" /></Button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const start = Math.max(1, Math.min(page - 2, totalPages - 4));
                const p = start + i;
                if (p > totalPages) return null;
                return <Button key={p} variant={p === page ? "default" : "outline"} size="sm" className="h-8 w-8 p-0" onClick={() => setPage(p)}>{p}</Button>;
              })}
              <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages}><ChevronRight className="h-4 w-4" /></Button>
            </div>
          </div>
        )}
      </Card>

      <ConfirmDialog open={deleteDialogOpen} onClose={() => { setDeleteDialogOpen(false); setDeletingTask(null); }} onConfirm={handleDelete} title="Delete Task" description={`Are you sure you want to delete "${deletingTask?.title}"? This will also delete all subtasks and comments.`} confirmLabel={deleting ? "Deleting..." : "Delete"} loading={deleting} variant="destructive" />
    </div>
  );
}
