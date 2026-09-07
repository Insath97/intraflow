"use client";

import { useState, useEffect, use, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";
import { taskService, type TaskItem, type TaskStatus, type TaskPriority, STATUS_COLORS, PRIORITY_COLORS } from "@/lib/api/tasks";
import { projectService } from "@/lib/api/projects";
import { moduleService } from "@/lib/api/modules";
import { usersApi, type UserSimple } from "@/lib/api/users";
import { useToast } from "@/components/ui/toast";
import { PageHeader } from "@/components/common/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LoadingState } from "@/components/common/loading-state";
import { cn } from "@/lib/utils";
import {
  ArrowLeft, Loader2, ClipboardList, FileText, Settings, Users,
  Calendar, CheckCircle2, Trash2, GripVertical, Search, ChevronDown, X, Check, AlertCircle, Plus,
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

interface DD { id: string; name: string; code?: string; }

function Combo({ value, onChange, items, placeholder, loading }: { value: string; onChange: (id: string) => void; items: DD[]; placeholder?: string; loading?: boolean; }) {
  const isDark = useIsDark();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const cRef = useRef<HTMLDivElement>(null);
  const iRef = useRef<HTMLInputElement>(null);
  const dRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ top: 0, left: 0, width: 0 });

  const sel = useMemo(() => items.find((i) => i.id === value), [items, value]);
  const filtered = useMemo(() => { if (!search) return items; const q = search.toLowerCase(); return items.filter((i) => i.name.toLowerCase().includes(q) || (i.code && i.code.toLowerCase().includes(q))); }, [items, search]);

  function up() { if (cRef.current) { const r = cRef.current.getBoundingClientRect(); setPos({ top: r.bottom + 4, left: r.left, width: r.width }); } }
  useEffect(() => { if (!open) return; const h = (e: MouseEvent) => { if (cRef.current && !cRef.current.contains(e.target as Node) && dRef.current && !dRef.current.contains(e.target as Node)) { setOpen(false); setSearch(""); } }; document.addEventListener("mousedown", h); return () => document.removeEventListener("mousedown", h); }, [open]);
  useEffect(() => { if (!open) return; const r = () => up(); window.addEventListener("scroll", r, true); window.addEventListener("resize", r); return () => { window.removeEventListener("scroll", r, true); window.removeEventListener("resize", r); }; }, [open]);

  const dd = open ? createPortal(
    <div ref={dRef} className={cn("fixed z-[9999] overflow-hidden rounded-lg border shadow-xl", isDark ? "border-white/10 bg-[#1A1D2E]" : "border-gray-200 bg-white")} style={{ top: pos.top, left: pos.left, width: pos.width }}>
      <div className={cn("flex items-center border-b px-3", isDark ? "border-white/10" : "border-gray-100")}>
        <Search className={cn("h-4 w-4 shrink-0", isDark ? "text-gray-500" : "text-gray-400")} />
        <input ref={iRef} type="text" placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} className={cn("flex h-10 w-full bg-transparent py-2 pl-2 text-sm outline-none", isDark ? "text-gray-100 placeholder:text-gray-500" : "text-gray-900 placeholder:text-gray-400")} />
      </div>
      <div className="max-h-60 overflow-y-auto p-1">
        {loading && <div className={cn("py-6 text-center text-sm", isDark ? "text-gray-400" : "text-gray-500")}>Loading...</div>}
        {!loading && filtered.length === 0 && <div className={cn("py-6 text-center text-sm", isDark ? "text-gray-400" : "text-gray-500")}>No results</div>}
        {filtered.map((item) => (
          <button key={item.id} type="button" onClick={() => { onChange(value === item.id ? "" : item.id); setOpen(false); setSearch(""); }}
            className={cn("flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-left transition-colors", isDark ? "hover:bg-white/5" : "hover:bg-gray-100", value === item.id ? (isDark ? "bg-[#FF6B00]/10 text-[#FF9A5C]" : "bg-[#FFF3EB] text-[#FF6B00]") : (isDark ? "text-gray-300" : "text-gray-700"))}>
            <span className="flex-1 truncate">{item.name}</span>
            {value === item.id && <Check className="h-3.5 w-3.5 shrink-0" />}
          </button>
        ))}
      </div>
    </div>, document.body
  ) : null;

  return (
    <div ref={cRef} className="relative">
      <button type="button" onClick={() => { up(); setOpen(true); setTimeout(() => iRef.current?.focus(), 0); }}
        className={cn("flex h-10 w-full items-center justify-between rounded-lg border px-3 py-2 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6B00] focus-visible:ring-offset-1", isDark ? "border-white/10 bg-[#1A1D2E] text-gray-100" : "border-gray-200 bg-white text-gray-900", open && "ring-2 ring-[#FF6B00] ring-offset-1")}>
        <span className={cn("truncate", !sel && (isDark ? "text-gray-500" : "text-gray-400"))}>{loading ? "Loading..." : sel ? sel.name : (placeholder || "Select")}</span>
        <div className="flex items-center gap-1 shrink-0 ml-1">
          {value && <span onClick={(e) => { e.stopPropagation(); onChange(""); }} className={cn("rounded-full p-0.5", isDark ? "text-gray-500 hover:text-gray-300 hover:bg-white/10" : "text-gray-400 hover:text-gray-600 hover:bg-gray-100")}><X className="h-3.5 w-3.5" /></span>}
          <ChevronDown className={cn("h-4 w-4 transition-transform", isDark ? "text-gray-500" : "text-gray-400", open && "rotate-180")} />
        </div>
      </button>
      {dd}
    </div>
  );
}

function UserCombo({ value, onChange, users, loading }: { value: string; onChange: (id: string) => void; users: UserSimple[]; loading: boolean; }) {
  const isDark = useIsDark();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const cRef = useRef<HTMLDivElement>(null);
  const iRef = useRef<HTMLInputElement>(null);
  const dRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ top: 0, left: 0, width: 0 });

  const sel = useMemo(() => users.find((u) => u.id === value), [users, value]);
  const filtered = useMemo(() => { if (!search) return users; const q = search.toLowerCase(); return users.filter((u) => u.full_name.toLowerCase().includes(q) || u.username.toLowerCase().includes(q) || u.employee_code.toLowerCase().includes(q)); }, [users, search]);

  function up() { if (cRef.current) { const r = cRef.current.getBoundingClientRect(); setPos({ top: r.bottom + 4, left: r.left, width: r.width }); } }
  useEffect(() => { if (!open) return; const h = (e: MouseEvent) => { if (cRef.current && !cRef.current.contains(e.target as Node) && dRef.current && !dRef.current.contains(e.target as Node)) { setOpen(false); setSearch(""); } }; document.addEventListener("mousedown", h); return () => document.removeEventListener("mousedown", h); }, [open]);
  useEffect(() => { if (!open) return; const r = () => up(); window.addEventListener("scroll", r, true); window.addEventListener("resize", r); return () => { window.removeEventListener("scroll", r, true); window.removeEventListener("resize", r); }; }, [open]);

  const dd = open ? createPortal(
    <div ref={dRef} className={cn("fixed z-[9999] overflow-hidden rounded-lg border shadow-xl", isDark ? "border-white/10 bg-[#1A1D2E]" : "border-gray-200 bg-white")} style={{ top: pos.top, left: pos.left, width: pos.width }}>
      <div className={cn("flex items-center border-b px-3", isDark ? "border-white/10" : "border-gray-100")}>
        <Search className={cn("h-4 w-4 shrink-0", isDark ? "text-gray-500" : "text-gray-400")} />
        <input ref={iRef} type="text" placeholder="Search users..." value={search} onChange={(e) => setSearch(e.target.value)} className={cn("flex h-10 w-full bg-transparent py-2 pl-2 text-sm outline-none", isDark ? "text-gray-100 placeholder:text-gray-500" : "text-gray-900 placeholder:text-gray-400")} />
      </div>
      <div className="max-h-60 overflow-y-auto p-1">
        {loading && <div className={cn("py-6 text-center text-sm", isDark ? "text-gray-400" : "text-gray-500")}>Loading...</div>}
        {!loading && filtered.length === 0 && <div className={cn("py-6 text-center text-sm", isDark ? "text-gray-400" : "text-gray-500")}>No users found</div>}
        {filtered.map((u) => (
          <button key={u.id} type="button" onClick={() => { onChange(value === u.id ? "" : u.id); setOpen(false); setSearch(""); }}
            className={cn("flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-left transition-colors", isDark ? "hover:bg-white/5" : "hover:bg-gray-100", value === u.id ? (isDark ? "bg-[#FF6B00]/10 text-[#FF9A5C]" : "bg-[#FFF3EB] text-[#FF6B00]") : (isDark ? "text-gray-300" : "text-gray-700"))}>
            <div className="flex min-w-0 flex-1 flex-col"><span className="truncate font-medium">{u.full_name}</span><span className={cn("truncate text-xs", isDark ? "text-gray-500" : "text-gray-400")}>{u.employee_code}{u.designation ? ` · ${u.designation}` : ""}</span></div>
            {value === u.id && <Check className="h-3.5 w-3.5 shrink-0" />}
          </button>
        ))}
      </div>
    </div>, document.body
  ) : null;

  return (
    <div ref={cRef} className="relative">
      <button type="button" onClick={() => { up(); setOpen(true); setTimeout(() => iRef.current?.focus(), 0); }}
        className={cn("flex h-10 w-full items-center justify-between rounded-lg border px-3 py-2 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6B00] focus-visible:ring-offset-1", isDark ? "border-white/10 bg-[#1A1D2E] text-gray-100" : "border-gray-200 bg-white text-gray-900", open && "ring-2 ring-[#FF6B00] ring-offset-1")}>
        <span className={cn("truncate", !sel && (isDark ? "text-gray-500" : "text-gray-400"))}>{loading ? "Loading..." : sel ? sel.full_name : "Select assignee"}</span>
        <div className="flex items-center gap-1 shrink-0 ml-1">
          {value && <span onClick={(e) => { e.stopPropagation(); onChange(""); }} className={cn("rounded-full p-0.5", isDark ? "text-gray-500 hover:text-gray-300 hover:bg-white/10" : "text-gray-400 hover:text-gray-600 hover:bg-gray-100")}><X className="h-3.5 w-3.5" /></span>}
          <ChevronDown className={cn("h-4 w-4 transition-transform", isDark ? "text-gray-500" : "text-gray-400", open && "rotate-180")} />
        </div>
      </button>
      {dd}
    </div>
  );
}

const ALL_STATUSES: TaskStatus[] = ["TODO", "IN_PROGRESS", "BLOCKED", "IN_REVIEW", "COMPLETED", "CANCELLED"];
const ALL_PRIORITIES: TaskPriority[] = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];
const SL: Record<TaskStatus, string> = { TODO: "To Do", IN_PROGRESS: "In Progress", BLOCKED: "Blocked", IN_REVIEW: "In Review", COMPLETED: "Completed", CANCELLED: "Cancelled" };
const PL: Record<TaskPriority, string> = { LOW: "Low", MEDIUM: "Medium", HIGH: "High", CRITICAL: "Critical" };

export default function EditTaskPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { toast } = useToast();

  const [task, setTask] = useState<TaskItem | null>(null);
  const [loadingPage, setLoadingPage] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [projects, setProjects] = useState<DD[]>([]);
  const [modules, setModules] = useState<DD[]>([]);
  const [users, setUsers] = useState<UserSimple[]>([]);
  const [loadingModules, setLoadingModules] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({ project_id: "", module_id: "", title: "", description: "", assigned_to: "", priority: "MEDIUM" as TaskPriority, status: "TODO" as TaskStatus, start_date: "", due_date: "", estimated_hours: "", completion_pct: 0 });
  const [subtasks, setSubtasks] = useState<string[]>([]);
  const [newSubtask, setNewSubtask] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    async function load() {
      try {
        const [tRes, pRes, uRes] = await Promise.all([taskService.getById(id), projectService.dropdown(), usersApi.simple(true)]);
        if (tRes.data.status === "success") {
          const t = tRes.data.data;
          setTask(t);
          setForm({
            project_id: t.project.id, module_id: t.module?.id || "", title: t.title,
            description: t.description || "", assigned_to: t.assigned_to.id,
            priority: t.priority, status: t.status,
            start_date: t.start_date || "", due_date: t.due_date || "",
            estimated_hours: t.estimated_hours ? String(t.estimated_hours) : "", completion_pct: t.completion_pct,
          });
          setSubtasks(t.subtasks.map((s) => s.title));
        } else setError("Task not found");
        if (pRes.data.status === "success") setProjects(pRes.data.data);
        if (uRes.data.status === "success") setUsers(uRes.data.data);
      } catch { setError("Failed to load task"); }
      finally { setLoadingPage(false); }
    }
    load();
  }, [id]);

  useEffect(() => {
    if (!form.project_id) { setModules([]); return; }
    async function load() {
      setLoadingModules(true);
      try { const res = await moduleService.getAll({ project_id: form.project_id }); if (res.data.status === "success") setModules(res.data.data.map((m) => ({ id: m.id, name: m.name }))); } catch { /* ignore */ }
      setLoadingModules(false);
    }
    load();
  }, [form.project_id]);

  function addSubtask() { const t = newSubtask.trim(); if (!t) return; setSubtasks((p) => [...p, t]); setNewSubtask(""); }
  function removeSubtask(idx: number) { setSubtasks((p) => p.filter((_, i) => i !== idx)); }

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (!form.project_id) e.project_id = "Required";
    if (!form.title.trim()) e.title = "Required";
    else if (form.title.trim().length < 2) e.title = "Min 2 characters";
    if (!form.assigned_to) e.assigned_to = "Required";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSave() {
    if (!validate()) return;
    setSaving(true);
    try {
      const res = await taskService.update(id, {
        project_id: form.project_id, module_id: form.module_id || null, title: form.title.trim(),
        description: form.description.trim() || undefined, assigned_to: form.assigned_to,
        priority: form.priority, status: form.status,
        start_date: form.start_date || undefined, due_date: form.due_date || undefined,
        estimated_hours: form.estimated_hours ? parseFloat(form.estimated_hours) : undefined,
        completion_pct: form.completion_pct, subtasks: subtasks.map((t) => ({ title: t })),
      });
      if (res.data.status === "success") { toast("Task updated", "success"); setTimeout(() => router.push("/tasks"), 500); }
      else toast("Failed to update task", "error");
    } catch (err: unknown) { const e = err as { response?: { data?: { message?: string } }; message?: string }; toast(e.response?.data?.message || e.message || "Error", "error"); }
    finally { setSaving(false); }
  }

  const sh = "border-b border-gray-100 bg-gray-50/50 px-6 py-4 dark:border-gray-800 dark:bg-gray-800/50";
  const sel = projects.find((p) => p.id === form.project_id);

  if (loadingPage) return <div className="space-y-6"><PageHeader title="Edit Task" breadcrumbs={[{ label: "Tasks", onClick: () => router.push("/tasks") }, { label: "Edit" }]} /><LoadingState message="Loading task..." /></div>;
  if (error || !task) return <div className="space-y-6"><PageHeader title="Edit Task" breadcrumbs={[{ label: "Tasks", onClick: () => router.push("/tasks") }]} /><Card className="p-12 text-center"><AlertCircle className="mx-auto h-8 w-8 text-red-500" /><p className="mt-4 text-sm text-red-600">{error || "Not found"}</p><Button variant="outline" size="sm" onClick={() => router.push("/tasks")} className="mt-4"><ArrowLeft className="mr-2 h-4 w-4" />Back</Button></Card></div>;

  return (
    <div className="space-y-6">
      <PageHeader title="Edit Task" breadcrumbs={[{ label: "Tasks", onClick: () => router.push("/tasks") }, { label: task.title }]}
        actions={<Button variant="outline" size="sm" onClick={() => router.push("/tasks")}><ArrowLeft className="mr-2 h-4 w-4" />Back</Button>} />

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2 space-y-6">
          <Card className="overflow-hidden">
            <div className={sh}><div className="flex items-center gap-3"><div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#FFF3EB] text-[#FF6B00]"><FileText className="h-4.5 w-4.5" /></div><div><h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Task Details</h3></div></div></div>
            <CardContent className="p-6">
              <div className="grid gap-5 sm:grid-cols-2">
                <div><label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Project <span className="text-red-500">*</span></label>
                  <Combo value={form.project_id} onChange={(v) => setForm({ ...form, project_id: v, module_id: "" })} items={projects} loading={false} />
                  {errors.project_id && <p className="mt-1 text-xs text-red-500">{errors.project_id}</p>}</div>
                <div><label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Module</label>
                  <Combo value={form.module_id} onChange={(v) => setForm({ ...form, module_id: v })} items={modules} placeholder="Select module" loading={loadingModules} /></div>
                <div className="sm:col-span-2"><label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Title <span className="text-red-500">*</span></label>
                  <Input placeholder="Task title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} error={!!errors.title} />
                  {errors.title && <p className="mt-1 text-xs text-red-500">{errors.title}</p>}</div>
                <div className="sm:col-span-2"><label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Description</label>
                  <textarea placeholder="Describe the task..." value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={4} className="flex w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6B00] dark:border-white/10 dark:bg-[#1A1D2E] dark:text-gray-100" /></div>
              </div>
            </CardContent>
          </Card>

          <Card className="overflow-hidden">
            <div className={sh}><div className="flex items-center gap-3"><div className="flex h-9 w-9 items-center justify-center rounded-lg bg-green-100 text-green-600"><Calendar className="h-4.5 w-4.5" /></div><div><h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Schedule & Progress</h3></div></div></div>
            <CardContent className="p-6">
              <div className="grid gap-5 sm:grid-cols-3">
                <div><label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Start Date</label><Input type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} /></div>
                <div><label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Due Date</label><Input type="date" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} /></div>
                <div><label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Est. Hours</label><Input type="number" placeholder="0" min="0" step="0.5" value={form.estimated_hours} onChange={(e) => setForm({ ...form, estimated_hours: e.target.value })} /></div>
                <div className="sm:col-span-3"><label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Completion: {form.completion_pct}%</label>
                  <input type="range" min="0" max="100" value={form.completion_pct} onChange={(e) => setForm({ ...form, completion_pct: parseInt(e.target.value) })} className="w-full accent-[#FF6B00]" /></div>
              </div>
            </CardContent>
          </Card>

          <Card className="overflow-hidden">
            <div className={sh}><div className="flex items-center gap-3"><div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-100 text-blue-600"><CheckCircle2 className="h-4.5 w-4.5" /></div><div><h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Subtasks</h3><p className="text-xs text-gray-500 dark:text-gray-400">{subtasks.length} subtask{subtasks.length !== 1 ? "s" : ""}</p></div></div></div>
            <CardContent className="p-6">
              <div className="flex gap-2 mb-4"><Input placeholder="Add subtask..." value={newSubtask} onChange={(e) => setNewSubtask(e.target.value)} onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addSubtask())} /><Button type="button" variant="outline" onClick={addSubtask}><Plus className="h-4 w-4" /></Button></div>
              {subtasks.length === 0 ? <p className="text-sm text-gray-400 text-center py-4">No subtasks</p> : (
                <div className="space-y-2">{subtasks.map((st, i) => (
                  <div key={i} className="flex items-center gap-2 rounded-lg border border-gray-100 bg-gray-50/50 px-3 py-2 dark:border-white/5 dark:bg-white/[0.02]">
                    <GripVertical className="h-4 w-4 text-gray-300 dark:text-gray-600 shrink-0" /><span className="flex-1 text-sm text-gray-700 dark:text-gray-300">{st}</span>
                    <button type="button" onClick={() => removeSubtask(i)} className="text-gray-400 hover:text-red-500"><Trash2 className="h-3.5 w-3.5" /></button>
                  </div>
                ))}</div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="xl:col-span-1 space-y-6">
          <Card className="overflow-hidden">
            <div className={sh}><div className="flex items-center gap-3"><div className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-100 text-purple-600"><Users className="h-4.5 w-4.5" /></div><div><h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Assignment</h3></div></div></div>
            <CardContent className="p-6 space-y-4">
              <div><label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Assignee <span className="text-red-500">*</span></label>
                <UserCombo value={form.assigned_to} onChange={(v) => setForm({ ...form, assigned_to: v })} users={users} loading={false} />
                {errors.assigned_to && <p className="mt-1 text-xs text-red-500">{errors.assigned_to}</p>}</div>
              <div><label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Priority</label>
                <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value as TaskPriority })} className="flex h-10 w-full appearance-none rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-[#1A1D2E] dark:text-gray-100">
                  {ALL_PRIORITIES.map((p) => <option key={p} value={p}>{PL[p]}</option>)}</select></div>
              <div><label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Status</label>
                <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as TaskStatus })} className="flex h-10 w-full appearance-none rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-[#1A1D2E] dark:text-gray-100">
                  {ALL_STATUSES.map((s) => <option key={s} value={s}>{SL[s]}</option>)}</select></div>
            </CardContent>
          </Card>

          <Card className="overflow-hidden">
            <div className={sh}><div className="flex items-center gap-3"><div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-100 text-amber-600"><Settings className="h-4.5 w-4.5" /></div><div><h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Summary</h3></div></div></div>
            <CardContent className="p-6">
              <div className="space-y-2.5 text-sm">
                <div className="flex justify-between"><span className="text-gray-500 dark:text-gray-400">Project</span><span className="font-medium text-gray-900 dark:text-gray-100">{sel?.name || "-"}</span></div>
                <div className="flex justify-between"><span className="text-gray-500 dark:text-gray-400">Title</span><span className="font-medium text-gray-900 dark:text-gray-100 truncate max-w-[180px]">{form.title || "-"}</span></div>
                <div className="flex justify-between"><span className="text-gray-500 dark:text-gray-400">Priority</span><span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", PRIORITY_COLORS[form.priority].bg, PRIORITY_COLORS[form.priority].text)}>{PL[form.priority]}</span></div>
                <div className="flex justify-between"><span className="text-gray-500 dark:text-gray-400">Status</span><span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", STATUS_COLORS[form.status].bg, STATUS_COLORS[form.status].text)}>{SL[form.status]}</span></div>
                <div className="flex justify-between"><span className="text-gray-500 dark:text-gray-400">Subtasks</span><span className="font-medium text-gray-900 dark:text-gray-100">{subtasks.length}</span></div>
              </div>
            </CardContent>
          </Card>

          <Button onClick={handleSave} disabled={saving} className="w-full" size="lg">
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ClipboardList className="mr-2 h-4 w-4" />}
            {saving ? "Updating..." : "Update Task"}
          </Button>
        </div>
      </div>
    </div>
  );
}
