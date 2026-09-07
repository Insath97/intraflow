"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";
import { dailyUpdateService, WORK_TYPE_OPTIONS, WORK_LOCATION_OPTIONS, type WorkEntryInput, type WorkType, type WorkLocation } from "@/lib/api/daily-updates";
import { projectService } from "@/lib/api/projects";
import { taskService } from "@/lib/api/tasks";
import { useToast } from "@/components/ui/toast";
import { PageHeader } from "@/components/common/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  Plus, ArrowLeft, Loader2, Calendar, FileText, Settings, Briefcase,
  Trash2, Clock, Search, ChevronDown, X, Check,
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
            {item.code && <span className={cn("text-xs", isDark ? "text-gray-500" : "text-gray-400")}>{item.code}</span>}
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

function calcDuration(start: string, end: string): string {
  if (!start || !end) return "0";
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  let mins = (eh * 60 + em) - (sh * 60 + sm);
  if (mins < 0) mins += 24 * 60;
  return (mins / 60).toFixed(2);
}

interface WorkEntryRow {
  project_id: string;
  task_id: string;
  work_type: WorkType;
  location: WorkLocation;
  start_time: string;
  end_time: string;
  description: string;
}

const emptyEntry: WorkEntryRow = { project_id: "", task_id: "", work_type: "REGULAR", location: "OFFICE", start_time: "09:00", end_time: "17:00", description: "" };

export default function CreateDailyUpdatePage() {
  const router = useRouter();
  const { toast } = useToast();
  const [projects, setProjects] = useState<DD[]>([]);
  const [tasksByProject, setTasksByProject] = useState<Record<string, DD[]>>({});
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [loadingTasks, setLoadingTasks] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState(false);

  const today = new Date().toISOString().split("T")[0];
  const [form, setForm] = useState({ update_date: today, summary: "", blockers: "", tomorrow_plan: "" });
  const [workEntries, setWorkEntries] = useState<WorkEntryRow[]>([{ ...emptyEntry }]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    async function load() {
      try {
        const res = await projectService.dropdown();
        if (res.data.status === "success") setProjects(res.data.data);
      } catch { /* ignore */ }
      setLoadingProjects(false);
    }
    load();
  }, []);

  async function loadTasks(projectId: string) {
    if (tasksByProject[projectId]) return;
    setLoadingTasks((p) => ({ ...p, [projectId]: true }));
    try {
      const res = await taskService.getDropdown({ project_id: projectId });
      if (res.data.status === "success") setTasksByProject((p) => ({ ...p, [projectId]: res.data.data.map((t) => ({ id: t.id, name: t.title })) }));
    } catch { /* ignore */ }
    setLoadingTasks((p) => ({ ...p, [projectId]: false }));
  }

  function updateEntry(idx: number, field: keyof WorkEntryRow, value: string) {
    setWorkEntries((prev) => prev.map((e, i) => {
      if (i !== idx) return e;
      const updated = { ...e, [field]: value };
      if (field === "project_id") updated.task_id = "";
      return updated;
    }));
  }

  function addEntry() { setWorkEntries((prev) => [...prev, { ...emptyEntry }]); }
  function removeEntry(idx: number) { setWorkEntries((prev) => prev.filter((_, i) => i !== idx)); }

  const totalHours = workEntries.reduce((sum, e) => sum + parseFloat(calcDuration(e.start_time, e.end_time)), 0);

  function validate(): boolean {
    const errs: Record<string, string> = {};
    if (!form.update_date) errs.update_date = "Required";
    workEntries.forEach((e, i) => {
      if (!e.project_id) errs[`entry_${i}_project`] = "Required";
      if (!e.start_time) errs[`entry_${i}_start`] = "Required";
      if (!e.end_time) errs[`entry_${i}_end`] = "Required";
    });
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSave() {
    if (!validate()) return;
    setSaving(true);
    try {
      const entries: WorkEntryInput[] = workEntries.filter((e) => e.project_id).map((e) => ({
        project_id: e.project_id,
        task_id: e.task_id || undefined,
        work_type: e.work_type,
        location: e.location,
        start_time: e.start_time,
        end_time: e.end_time,
        description: e.description || undefined,
      }));
      const res = await dailyUpdateService.create({
        update_date: form.update_date,
        summary: form.summary || undefined,
        blockers: form.blockers || undefined,
        tomorrow_plan: form.tomorrow_plan || undefined,
        work_entries: entries.length > 0 ? entries : undefined,
      });
      if (res.data.status === "success") { toast(res.data.message || "Daily update created", "success"); setTimeout(() => router.push("/daily-updates"), 500); }
      else toast(res.data.message || "Failed to create", "error");
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } }; message?: string };
      toast(e.response?.data?.message || e.message || "Error", "error");
    } finally { setSaving(false); }
  }

  const sh = "border-b border-gray-100 bg-gray-50/50 px-6 py-4 dark:border-gray-800 dark:bg-gray-800/50";

  return (
    <div className="space-y-6">
      <PageHeader title="New Daily Update" breadcrumbs={[{ label: "Daily Updates", onClick: () => router.push("/daily-updates") }, { label: "New" }]}
        actions={<Button variant="outline" size="sm" onClick={() => router.push("/daily-updates")}><ArrowLeft className="mr-2 h-4 w-4" />Back</Button>} />

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2 space-y-6">
          {/* Date & Summary */}
          <Card className="overflow-hidden">
            <div className={sh}><div className="flex items-center gap-3"><div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#FFF3EB] text-[#FF6B00]"><FileText className="h-4.5 w-4.5" /></div><div><h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Update Details</h3><p className="text-xs text-gray-500 dark:text-gray-400">Date and summary</p></div></div></div>
            <CardContent className="p-6 space-y-5">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Date <span className="text-red-500">*</span></label>
                <Input type="date" value={form.update_date} onChange={(e) => setForm({ ...form, update_date: e.target.value })} error={!!errors.update_date} />
                {errors.update_date && <p className="mt-1 text-xs text-red-500">{errors.update_date}</p>}
              </div>
              <div><label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Summary</label>
                <textarea placeholder="What did you work on today?" value={form.summary} onChange={(e) => setForm({ ...form, summary: e.target.value })} rows={3} className="flex w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6B00] dark:border-white/10 dark:bg-[#1A1D2E] dark:text-gray-100" /></div>
              <div><label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Blockers</label>
                <textarea placeholder="Any blockers or impediments?" value={form.blockers} onChange={(e) => setForm({ ...form, blockers: e.target.value })} rows={2} className="flex w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6B00] dark:border-white/10 dark:bg-[#1A1D2E] dark:text-gray-100" /></div>
              <div><label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Tomorrow&apos;s Plan</label>
                <textarea placeholder="What&apos;s planned for tomorrow?" value={form.tomorrow_plan} onChange={(e) => setForm({ ...form, tomorrow_plan: e.target.value })} rows={2} className="flex w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6B00] dark:border-white/10 dark:bg-[#1A1D2E] dark:text-gray-100" /></div>
            </CardContent>
          </Card>

          {/* Work Entries */}
          <Card className="overflow-hidden">
            <div className={sh}><div className="flex items-center gap-3"><div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-100 text-blue-600"><Briefcase className="h-4.5 w-4.5" /></div><div><h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Work Entries</h3><p className="text-xs text-gray-500 dark:text-gray-400">{workEntries.length} entr{workEntries.length !== 1 ? "ies" : "y"}</p></div></div></div>
            <CardContent className="p-6 space-y-4">
              {workEntries.map((entry, idx) => {
                const duration = calcDuration(entry.start_time, entry.end_time);
                const entryTasks = entry.project_id ? (tasksByProject[entry.project_id] || []) : [];
                const isLoadingTasks = loadingTasks[entry.project_id];
                return (
                  <div key={idx} className="rounded-lg border border-gray-200 p-4 dark:border-white/10 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Entry {idx + 1}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-[#FF6B00]">{duration}h</span>
                        {workEntries.length > 1 && <button type="button" onClick={() => removeEntry(idx)} className="text-gray-400 hover:text-red-500"><Trash2 className="h-3.5 w-3.5" /></button>}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div><label className="mb-1 block text-xs font-medium text-gray-500">Project <span className="text-red-500">*</span></label>
                        <Combo value={entry.project_id} onChange={(v) => { updateEntry(idx, "project_id", v); if (v) loadTasks(v); }} items={projects} placeholder="Select project" loading={loadingProjects} />
                        {errors[`entry_${idx}_project`] && <p className="mt-1 text-xs text-red-500">{errors[`entry_${idx}_project`]}</p>}</div>
                      <div><label className="mb-1 block text-xs font-medium text-gray-500">Task</label>
                        <Combo value={entry.task_id} onChange={(v) => updateEntry(idx, "task_id", v)} items={entryTasks} placeholder="Select task" loading={isLoadingTasks} /></div>
                    </div>
                    <div className="grid grid-cols-4 gap-3">
                      <div><label className="mb-1 block text-xs font-medium text-gray-500">Type</label>
                        <select value={entry.work_type} onChange={(e) => updateEntry(idx, "work_type", e.target.value)} className="flex h-10 w-full appearance-none rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-[#1A1D2E] dark:text-gray-100">
                          {WORK_TYPE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</select></div>
                      <div><label className="mb-1 block text-xs font-medium text-gray-500">Location</label>
                        <select value={entry.location} onChange={(e) => updateEntry(idx, "location", e.target.value)} className="flex h-10 w-full appearance-none rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-[#1A1D2E] dark:text-gray-100">
                          {WORK_LOCATION_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</select></div>
                      <div><label className="mb-1 block text-xs font-medium text-gray-500">Start <span className="text-red-500">*</span></label>
                        <Input type="time" value={entry.start_time} onChange={(e) => updateEntry(idx, "start_time", e.target.value)} error={!!errors[`entry_${idx}_start`]} /></div>
                      <div><label className="mb-1 block text-xs font-medium text-gray-500">End <span className="text-red-500">*</span></label>
                        <Input type="time" value={entry.end_time} onChange={(e) => updateEntry(idx, "end_time", e.target.value)} error={!!errors[`entry_${idx}_end`]} /></div>
                    </div>
                    <div><label className="mb-1 block text-xs font-medium text-gray-500">Description</label>
                      <Input placeholder="What did you do?" value={entry.description} onChange={(e) => updateEntry(idx, "description", e.target.value)} /></div>
                  </div>
                );
              })}
              <Button type="button" variant="outline" onClick={addEntry} className="w-full gap-1"><Plus className="h-4 w-4" /> Add Entry</Button>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="xl:col-span-1 space-y-6">
          <Card className="overflow-hidden">
            <div className={sh}><div className="flex items-center gap-3"><div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-100 text-amber-600"><Clock className="h-4.5 w-4.5" /></div><div><h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Summary</h3></div></div></div>
            <CardContent className="p-6 space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-gray-500 dark:text-gray-400">Date</span><span className="font-medium text-gray-900 dark:text-gray-100">{form.update_date || "-"}</span></div>
              <div className="flex justify-between"><span className="text-gray-500 dark:text-gray-400">Entries</span><span className="font-medium text-gray-900 dark:text-gray-100">{workEntries.length}</span></div>
              <div className="border-t border-gray-100 dark:border-white/5 pt-3 flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">Total Hours</span>
                <span className="text-lg font-bold text-[#FF6B00]">{totalHours.toFixed(2)}h</span>
              </div>
            </CardContent>
          </Card>

          <Button onClick={handleSave} disabled={saving} className="w-full" size="lg">
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Calendar className="mr-2 h-4 w-4" />}
            {saving ? "Saving..." : "Submit Update"}
          </Button>
        </div>
      </div>
    </div>
  );
}
