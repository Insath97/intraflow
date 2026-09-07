"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  dailyUpdateService,
  type DailyUpdateItem,
  WORK_TYPE_COLORS,
  WORK_LOCATION_COLORS,
} from "@/lib/api/daily-updates";
import { useAuthStore } from "@/lib/auth";
import { useToast } from "@/components/ui/toast";
import { PageHeader } from "@/components/common/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { cn } from "@/lib/utils";
import {
  Plus, Calendar, Clock, Users, Trash2, Pencil, Eye,
  ChevronLeft, ChevronRight, AlertCircle, Briefcase,
  FileText, ChevronDown, ChevronUp,
} from "lucide-react";

export default function DailyUpdatesPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user, role } = useAuthStore();
  const isAdmin = role?.name === "Super Admin" || role?.name === "Admin";

  const [tab, setTab] = useState<"my" | "all">("my");
  const [updates, setUpdates] = useState<DailyUpdateItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const [stats, setStats] = useState<{ total_updates_this_month: number; users_with_updates: number } | null>(null);
  const [todayUpdate, setTodayUpdate] = useState<DailyUpdateItem | null>(null);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingUpdate, setDeletingUpdate] = useState<DailyUpdateItem | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const [sRes, tRes] = await Promise.all([dailyUpdateService.getStats(), dailyUpdateService.getToday()]);
        if (sRes.data.status === "success") setStats(sRes.data.data);
        if (tRes.data.status === "success") setTodayUpdate(tRes.data.data);
      } catch { /* ignore */ }
    }
    load();
  }, []);

  const fetchUpdates = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        start_date: startDate || undefined,
        end_date: endDate || undefined,
        page,
        size: 15,
      };
      const res = tab === "my"
        ? await dailyUpdateService.getMy(params)
        : await dailyUpdateService.getAll(params);
      if (res.data.status === "success") {
        const d = res.data.data;
        setUpdates(d.items);
        setTotalPages(d.total_pages);
        setTotalCount(d.total_count);
      }
    } catch {
      toast("Failed to load updates", "error");
    } finally {
      setLoading(false);
    }
  }, [tab, startDate, endDate, page, toast]);

  useEffect(() => { fetchUpdates(); }, [fetchUpdates]);
  useEffect(() => { setPage(1); }, [tab, startDate, endDate]);
  useEffect(() => { setSelectedIds([]); }, [page]);

  async function handleDelete() {
    if (!deletingUpdate) return;
    setDeleting(true);
    try {
      const res = await dailyUpdateService.delete(deletingUpdate.id);
      if (res.data.status === "success") { toast(res.data.message || "Deleted", "success"); fetchUpdates(); }
      else toast(res.data.message || "Failed", "error");
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } }; message?: string };
      toast(e.response?.data?.message || e.message || "Error", "error");
    } finally { setDeleting(false); setDeleteDialogOpen(false); setDeletingUpdate(null); }
  }

  async function handleBulkDelete() {
    if (!selectedIds.length) return;
    setBulkDeleting(true);
    try {
      const res = await dailyUpdateService.bulkDelete(selectedIds);
      if (res.data.status === "success") { toast(res.data.message || "Deleted", "success"); setSelectedIds([]); fetchUpdates(); }
      else toast(res.data.message || "Failed", "error");
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } }; message?: string };
      toast(e.response?.data?.message || e.message || "Error", "error");
    } finally { setBulkDeleting(false); }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Daily Updates"
        description="Track daily work progress and entries"
        breadcrumbs={[{ label: "Dashboard", onClick: () => router.push("/dashboard") }, { label: "Daily Updates" }]}
        actions={
          <Button onClick={() => router.push("/daily-updates/create")}>
            <Plus className="mr-2 h-4 w-4" />
            {todayUpdate ? "Edit Today" : "New Update"}
          </Button>
        }
      />

      {/* Stats */}
      {stats && (
        <div className="grid gap-4 sm:grid-cols-3">
          <Card><CardContent className="p-4"><div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#FFF3EB] text-[#FF6B00]"><FileText className="h-5 w-5" /></div>
            <div><p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.total_updates_this_month}</p><p className="text-sm text-gray-500 dark:text-gray-400">This Month</p></div>
          </div></CardContent></Card>
          <Card><CardContent className="p-4"><div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-blue-600"><Users className="h-5 w-5" /></div>
            <div><p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.users_with_updates}</p><p className="text-sm text-gray-500 dark:text-gray-400">Active Users</p></div>
          </div></CardContent></Card>
          <Card><CardContent className="p-4"><div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 text-green-600"><Clock className="h-5 w-5" /></div>
            <div><p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{todayUpdate ? `${todayUpdate.total_hours}h` : "-"}</p><p className="text-sm text-gray-500 dark:text-gray-400">Today&apos;s Hours</p></div>
          </div></CardContent></Card>
        </div>
      )}

      {/* Today's Quick Card */}
      {todayUpdate && (
        <Card className="border-green-200 bg-green-50/50 dark:border-green-900/30 dark:bg-green-900/10">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 text-green-600"><Calendar className="h-5 w-5" /></div>
                <div>
                  <p className="text-sm font-medium text-green-800 dark:text-green-300">Today&apos;s Update Submitted</p>
                  <p className="text-xs text-green-600 dark:text-green-400">{todayUpdate.total_hours} hours logged &middot; {todayUpdate.work_entries.length} entries</p>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={() => router.push(`/daily-updates/${todayUpdate.id}/edit`)}>Edit</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-1 rounded-lg border border-gray-200 bg-gray-50 p-1 dark:border-white/10 dark:bg-white/5 w-fit">
        <button onClick={() => setTab("my")} className={cn("rounded-md px-4 py-2 text-sm font-medium transition-colors", tab === "my" ? "bg-white text-gray-900 shadow dark:bg-[#1A1D2E] dark:text-gray-100" : "text-gray-500 hover:text-gray-700 dark:text-gray-400")}>My Updates</button>
        {isAdmin && <button onClick={() => setTab("all")} className={cn("rounded-md px-4 py-2 text-sm font-medium transition-colors", tab === "all" ? "bg-white text-gray-900 shadow dark:bg-[#1A1D2E] dark:text-gray-100" : "text-gray-500 hover:text-gray-700 dark:text-gray-400")}>All Updates</button>}
      </div>

      {/* Filters */}
      <Card><CardContent className="p-4">
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="flex-1"><label className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">Start Date</label><Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} /></div>
          <div className="flex-1"><label className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">End Date</label><Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} /></div>
          <div className="flex items-end"><Button variant="outline" size="sm" onClick={() => { setStartDate(""); setEndDate(""); }}>Clear</Button></div>
        </div>
      </CardContent></Card>

      {/* Bulk actions */}
      {selectedIds.length > 0 && (
        <div className="flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 dark:border-red-900/30 dark:bg-red-900/10">
          <AlertCircle className="h-4 w-4 text-red-500" />
          <span className="text-sm text-red-700 dark:text-red-400">{selectedIds.length} selected</span>
          <Button variant="destructive" size="sm" onClick={handleBulkDelete} disabled={bulkDeleting} className="ml-auto"><Trash2 className="mr-1 h-3 w-3" />{bulkDeleting ? "Deleting..." : "Delete"}</Button>
        </div>
      )}

      {/* Content */}
      <Card>
        {loading ? (
          <div className="p-12 text-center"><div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-[#FF6B00]" /><p className="mt-3 text-sm text-gray-500">Loading...</p></div>
        ) : updates.length === 0 ? (
          <div className="p-12 text-center">
            <Calendar className="mx-auto h-12 w-12 text-gray-300 dark:text-gray-600" />
            <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-gray-100">No Updates Found</h3>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">{startDate || endDate ? "Try adjusting dates." : "Create your first daily update."}</p>
            <Button onClick={() => router.push("/daily-updates/create")} className="mt-4"><Plus className="mr-2 h-4 w-4" />New Update</Button>
          </div>
        ) : (
          <div className="divide-y divide-gray-50 dark:divide-white/5">
            {updates.map((item) => {
              const isExpanded = expandedId === item.id;
              return (
                <div key={item.id}>
                  <div className="flex items-center gap-4 px-4 py-3 hover:bg-gray-50/50 dark:hover:bg-white/[0.02]">
                    <input type="checkbox" checked={selectedIds.includes(item.id)} onChange={() => setSelectedIds((p) => p.includes(item.id) ? p.filter((i) => i !== item.id) : [...p, item.id])} className="h-4 w-4 rounded border-gray-300 text-[#FF6B00]" />
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#FFF3EB] text-[#FF6B00] shrink-0">
                      <Calendar className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{item.user_name || "Unknown"}</p>
                        <span className="text-xs text-gray-400">&middot;</span>
                        <span className="text-sm text-gray-500 dark:text-gray-400">{new Date(item.update_date).toLocaleDateString()}</span>
                      </div>
                      {item.summary && <p className="mt-0.5 text-xs text-gray-400 truncate max-w-[400px]">{item.summary}</p>}
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right">
                        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{item.total_hours}h</p>
                        <p className="text-xs text-gray-400">{item.work_entries.length} entries</p>
                      </div>
                      <button onClick={() => setExpandedId(isExpanded ? null : item.id)} className="text-gray-400 hover:text-gray-600">
                        {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </button>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => router.push(`/daily-updates/${item.id}`)}><Eye className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => router.push(`/daily-updates/${item.id}/edit`)}><Pencil className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-600" onClick={() => { setDeletingUpdate(item); setDeleteDialogOpen(true); }}><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </div>
                  {isExpanded && item.work_entries.length > 0 && (
                    <div className="border-t border-gray-100 bg-gray-50/30 px-4 py-3 dark:border-white/5 dark:bg-white/[0.01]">
                      <div className="space-y-2">
                        {item.work_entries.map((we) => (
                          <div key={we.id} className="flex items-center gap-3 rounded-lg border border-gray-100 bg-white px-3 py-2 text-sm dark:border-white/5 dark:bg-[#1A1D2E]">
                            <Briefcase className="h-4 w-4 text-gray-400 shrink-0" />
                            <span className="font-medium text-gray-900 dark:text-gray-100 truncate max-w-[150px]">{we.project_name || "Unknown"}</span>
                            {we.task_title && <span className="text-gray-400 truncate max-w-[120px]">· {we.task_title}</span>}
                            <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", WORK_TYPE_COLORS[we.work_type]?.bg, WORK_TYPE_COLORS[we.work_type]?.text)}>{we.work_type}</span>
                            <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", WORK_LOCATION_COLORS[we.location]?.bg, WORK_LOCATION_COLORS[we.location]?.text)}>{we.location}</span>
                            <span className="text-gray-500 dark:text-gray-400 text-xs">{we.start_time} - {we.end_time}</span>
                            <span className="font-medium text-[#FF6B00] text-xs ml-auto">{we.duration_hours}h</span>
                          </div>
                        ))}
                      </div>
                      {(item.summary || item.blockers || item.yesterday_summary) && (
                        <div className="mt-3 grid grid-cols-3 gap-3 text-xs">
                          {item.summary && <div><span className="font-medium text-gray-500">Summary:</span> <span className="text-gray-700 dark:text-gray-300">{item.summary}</span></div>}
                          {item.blockers && <div><span className="font-medium text-gray-500">Blockers:</span> <span className="text-gray-700 dark:text-gray-300">{item.blockers}</span></div>}
                          {item.yesterday_summary && <div><span className="font-medium text-gray-500">Yesterday:</span> <span className="text-gray-700 dark:text-gray-300">{item.yesterday_summary}</span></div>}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-gray-100 px-4 py-3 dark:border-white/5">
            <span className="text-sm text-gray-500">Page {page} of {totalPages} ({totalCount} updates)</span>
            <div className="flex items-center gap-1">
              <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}><ChevronLeft className="h-4 w-4" /></Button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => { const start = Math.max(1, Math.min(page - 2, totalPages - 4)); const p = start + i; if (p > totalPages) return null; return <Button key={p} variant={p === page ? "default" : "outline"} size="sm" className="h-8 w-8 p-0" onClick={() => setPage(p)}>{p}</Button>; })}
              <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages}><ChevronRight className="h-4 w-4" /></Button>
            </div>
          </div>
        )}
      </Card>

      <ConfirmDialog open={deleteDialogOpen} onClose={() => { setDeleteDialogOpen(false); setDeletingUpdate(null); }} onConfirm={handleDelete} title="Delete Update" description={`Delete daily update for ${deletingUpdate ? new Date(deletingUpdate.update_date).toLocaleDateString() : ""}? This will also delete all work entries.`} confirmLabel={deleting ? "Deleting..." : "Delete"} loading={deleting} variant="destructive" />
    </div>
  );
}
