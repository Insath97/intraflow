"use client";

import { useState, useEffect, use, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";
import { dailyUpdateService, WORK_TYPE_OPTIONS, WORK_LOCATION_OPTIONS, type WorkEntryInput, type WorkType, type WorkLocation, type DailyUpdateItem } from "@/lib/api/daily-updates";
import { projectService } from "@/lib/api/projects";
import { taskService } from "@/lib/api/tasks";
import { useToast } from "@/components/ui/toast";
import { PageHeader } from "@/components/common/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LoadingState } from "@/components/common/loading-state";
import { cn } from "@/lib/utils";
import { ArrowLeft, Loader2, Plus, Briefcase, Trash2, Search, ChevronDown, X, Check, Clock, AlertCircle } from "lucide-react";

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

const selectCls = "flex h-10 w-full appearance-none rounded-lg border bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6B00] dark:border-white/10 dark:bg-[#1A1D2E] dark:text-gray-100";

export default function EditDailyUpdatePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { toast } = useToast();
  const [item, setItem] = useState<DailyUpdateItem | null>(null);
  const [loadingPage, setLoadingPage] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [projects, setProjects] = useState<DD[]>([]);
  const [tasksByProject, setTasksByProject] = useState<Record<string, DD[]>>({});
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [loadingTasks, setLoadingTasks] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({ blockers: "", tomorrow_plan: "" });
  const [workEntries, setWorkEntries] = useState<WorkEntryRow[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    async function load() {
      try {
        const [duRes, pRes] = await Promise.all([dailyUpdateService.getById(id), projectService.dropdown()]);
        if (duRes.data.status === "success") {
          const d = duRes.data.data;
          setItem(d);
          setForm({ blockers: d.blockers || "", tomorrow_plan: d.tomorrow_plan || "" });
          setWorkEntries(d.work_entries.length > 0 ? d.work_entries.map((we) => ({
            project_id: we.project_id, task_id: we.task_id || "",
            work_type: we.work_type as WorkType, location: we.location as WorkLocation,
            start_time: we.start_time.substring(0, 5), end_time: we.end_time.substring(0, 5),
            description: we.description || "",
          })) : [{ ...emptyEntry }]);
          d.work_entries.forEach((we) => { if (we.project_id) loadTasks(we.project_id); });
        } else setError("Not found");
        if (pRes.data.status === "success") setProjects(pRes.data.data);
      } catch { setError("Failed to load"); }
      finally { setLoadingPage(false); }
    }
    load();
  }, [id]);

  async function loadTasks(projectId: string) {
    if (tasksByProject[projectId]) return;
    setLoadingTasks((p) => ({ ...p, [projectId]: true }));
    try { const res = await taskService.getDropdown({ project_id: projectId }); if (res.data.status === "success") setTasksByProject((p) => ({ ...p, [projectId]: res.data.data.map((t: { id: string; title: string }) => ({ id: t.id, name: t.title })) })); } catch { /* ignore */ }
    setLoadingTasks((p) => ({ ...p, [projectId]: false }));
  }

  function updateEntry(idx: number, field: keyof WorkEntryRow, value: string) {
    setWorkEntries((prev) => prev.map((e, i) => { if (i !== idx) return e; const u = { ...e, [field]: value }; if (field === "project_id") u.task_id = ""; return u; }));
  }
  function addEntry() { setWorkEntries((prev) => [...prev, { ...emptyEntry }]); }
  function removeEntry(idx: number) { setWorkEntries((prev) => prev.filter((_, i) => i !== idx)); }

  const totalHours = workEntries.reduce((sum, e) => sum + parseFloat(calcDuration(e.start_time, e.end_time)), 0);

  function validate(): boolean {
    const errs: Record<string, string> = {};
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
        project_id: e.project_id, task_id: e.task_id || undefined,
        work_type: e.work_type, location: e.location,
        start_time: e.start_time, end_time: e.end_time,
        description: e.description || undefined,
      }));
      const res = await dailyUpdateService.update(id, {
        update_date: item!.update_date,
        blockers: form.blockers || undefined,
        tomorrow_plan: form.tomorrow_plan || undefined,
        work_entries: entries.length > 0 ? entries : undefined,
      });
      if (res.data.status === "success") { toast(res.data.message || "Updated", "success"); setTimeout(() => router.push("/daily-updates"), 500); }
      else toast(res.data.message || "Failed", "error");
    } catch (err: unknown) { const e = err as { response?: { data?: { message?: string } }; message?: string }; toast(e.response?.data?.message || e.message || "Error", "error"); }
    finally { setSaving(false); }
  }

  if (loadingPage) return <div className="space-y-6"><PageHeader title="Edit Update" breadcrumbs={[{ label: "Daily Updates", onClick: () => router.push("/daily-updates") }]} /><LoadingState message="Loading..." /></div>;
  if (error || !item) return <div className="space-y-6"><PageHeader title="Edit Update" breadcrumbs={[{ label: "Daily Updates", onClick: () => router.push("/daily-updates") }]} /><Card className="p-12 text-center"><AlertCircle className="mx-auto h-8 w-8 text-red-500" /><p className="mt-4 text-sm text-red-600">{error || "Not found"}</p><Button variant="outline" size="sm" onClick={() => router.push("/daily-updates")} className="mt-4"><ArrowLeft className="mr-2 h-4 w-4" />Back</Button></Card></div>;

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      <div className="shrink-0">
        <PageHeader title="Edit Daily Update" breadcrumbs={[{ label: "Daily Updates", onClick: () => router.push("/daily-updates") }, { label: new Date(item.update_date).toLocaleDateString() }]}
          actions={<Button variant="outline" size="sm" onClick={() => router.push("/daily-updates")}><ArrowLeft className="mr-2 h-4 w-4" />Back</Button>} />
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="p-6 space-y-6 pb-24">
          {/* Top bar: date (read-only) + blockers + plan */}
          <Card>
            <CardContent className="p-5">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Date</label>
                  <div className="flex h-10 items-center rounded-lg border border-gray-200 bg-gray-50 px-3 text-sm text-gray-500 dark:border-white/10 dark:bg-white/5 dark:text-gray-400"><Clock className="mr-2 h-4 w-4" />{new Date(item.update_date).toLocaleDateString()}</div>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Blockers</label>
                  <Input placeholder="Any blockers?" value={form.blockers} onChange={(e) => setForm({ ...form, blockers: e.target.value })} />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Tomorrow&apos;s Plan</label>
                  <Input placeholder="Plan for tomorrow?" value={form.tomorrow_plan} onChange={(e) => setForm({ ...form, tomorrow_plan: e.target.value })} />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Work entries */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <Briefcase className="h-4 w-4 text-gray-400" />
                Work Entries
                <span className="text-xs font-normal text-gray-400">({workEntries.length})</span>
              </h3>
            </div>

            {workEntries.map((entry, idx) => {
              const duration = calcDuration(entry.start_time, entry.end_time);
              const entryTasks = entry.project_id ? (tasksByProject[entry.project_id] || []) : [];
              return (
                <Card key={idx} className="overflow-hidden">
                  <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50/50 px-5 py-3 dark:border-gray-800 dark:bg-gray-800/50">
                    <div className="flex items-center gap-3">
                      <span className="flex h-7 w-7 items-center justify-center rounded-md bg-[#FFF3EB] text-xs font-bold text-[#FF6B00] dark:bg-[#FF6B00]/10 dark:text-[#FF9A5C]">{idx + 1}</span>
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Entry {idx + 1}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1 text-sm font-semibold text-[#FF6B00]"><Clock className="h-3.5 w-3.5" />{duration}h</span>
                      {workEntries.length > 1 && (
                        <button type="button" onClick={() => removeEntry(idx)} className="rounded-md p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-500/10"><Trash2 className="h-4 w-4" /></button>
                      )}
                    </div>
                  </div>
                  <CardContent className="p-5 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="mb-1.5 block text-xs font-medium text-gray-500 dark:text-gray-400">Project <span className="text-red-500">*</span></label>
                        <Combo value={entry.project_id} onChange={(v) => { updateEntry(idx, "project_id", v); if (v) loadTasks(v); }} items={projects} placeholder="Select project" loading={loadingProjects} />
                        {errors[`entry_${idx}_project`] && <p className="mt-1 text-xs text-red-500">{errors[`entry_${idx}_project`]}</p>}
                      </div>
                      <div>
                        <label className="mb-1.5 block text-xs font-medium text-gray-500 dark:text-gray-400">Task</label>
                        <Combo value={entry.task_id} onChange={(v) => updateEntry(idx, "task_id", v)} items={entryTasks} placeholder="Select task" loading={loadingTasks[entry.project_id]} />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <label className="mb-1.5 block text-xs font-medium text-gray-500 dark:text-gray-400">Type</label>
                        <select value={entry.work_type} onChange={(e) => updateEntry(idx, "work_type", e.target.value)} className={selectCls}>
                          {WORK_TYPE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="mb-1.5 block text-xs font-medium text-gray-500 dark:text-gray-400">Location</label>
                        <select value={entry.location} onChange={(e) => updateEntry(idx, "location", e.target.value)} className={selectCls}>
                          {WORK_LOCATION_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="mb-1.5 block text-xs font-medium text-gray-500 dark:text-gray-400">Start <span className="text-red-500">*</span></label>
                        <Input type="time" value={entry.start_time} onChange={(e) => updateEntry(idx, "start_time", e.target.value)} error={!!errors[`entry_${idx}_start`]} />
                        {errors[`entry_${idx}_start`] && <p className="mt-1 text-xs text-red-500">{errors[`entry_${idx}_start`]}</p>}
                      </div>
                      <div>
                        <label className="mb-1.5 block text-xs font-medium text-gray-500 dark:text-gray-400">End <span className="text-red-500">*</span></label>
                        <Input type="time" value={entry.end_time} onChange={(e) => updateEntry(idx, "end_time", e.target.value)} error={!!errors[`entry_${idx}_end`]} />
                        {errors[`entry_${idx}_end`] && <p className="mt-1 text-xs text-red-500">{errors[`entry_${idx}_end`]}</p>}
                      </div>
                    </div>
                    <div>
                      <label className="mb-1.5 block text-xs font-medium text-gray-500 dark:text-gray-400">Description</label>
                      <Input placeholder="What did you do?" value={entry.description} onChange={(e) => updateEntry(idx, "description", e.target.value)} />
                    </div>
                  </CardContent>
                </Card>
              );
            })}

            <button type="button" onClick={addEntry} className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-200 py-3 text-sm font-medium text-gray-500 transition-colors hover:border-[#FF6B00] hover:text-[#FF6B00] dark:border-white/10 dark:hover:border-[#FF6B00] dark:hover:text-[#FF9A5C]">
              <Plus className="h-4 w-4" /> Add Entry
            </button>
          </div>
        </div>
      </div>

      {/* Sticky bottom bar */}
      <div className="shrink-0 border-t border-gray-200 bg-white/80 backdrop-blur-sm dark:border-white/10 dark:bg-[#0F1117]/80">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4 text-sm">
            <span className="text-gray-500 dark:text-gray-400">{workEntries.length} {workEntries.length === 1 ? "entry" : "entries"}</span>
            <span className="font-semibold text-[#FF6B00]">{totalHours.toFixed(1)}h total</span>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={() => router.push("/daily-updates")} disabled={saving}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving} className="min-w-[140px]">
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {saving ? "Saving..." : "Update"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
