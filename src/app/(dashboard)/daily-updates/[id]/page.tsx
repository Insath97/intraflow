"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { dailyUpdateService, type DailyUpdateItem, WORK_TYPE_COLORS, WORK_LOCATION_COLORS } from "@/lib/api/daily-updates";
import { useToast } from "@/components/ui/toast";
import { PageHeader } from "@/components/common/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LoadingState } from "@/components/common/loading-state";
import { cn } from "@/lib/utils";
import { ArrowLeft, Pencil, Trash2, Calendar, Clock, Briefcase, AlertCircle, FileText, Target, Ban } from "lucide-react";

export default function DailyUpdateDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { toast } = useToast();
  const [item, setItem] = useState<DailyUpdateItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const res = await dailyUpdateService.getById(id);
        if (res.data.status === "success") setItem(res.data.data);
        else setError("Not found");
      } catch { setError("Failed to load"); }
      finally { setLoading(false); }
    }
    load();
  }, [id]);

  async function handleDelete() {
    setDeleting(true);
    try {
      const res = await dailyUpdateService.delete(id);
      if (res.data.status === "success") { toast(res.data.message || "Deleted", "success"); setTimeout(() => router.push("/daily-updates"), 500); }
      else toast(res.data.message || "Failed", "error");
    } catch (err: unknown) { const e = err as { response?: { data?: { message?: string } }; message?: string }; toast(e.response?.data?.message || "Error", "error"); }
    finally { setDeleting(false); }
  }

  const sh = "border-b border-gray-100 bg-gray-50/50 px-6 py-4 dark:border-gray-800 dark:bg-gray-800/50";

  if (loading) return <div className="space-y-6"><PageHeader title="Daily Update" breadcrumbs={[{ label: "Daily Updates", onClick: () => router.push("/daily-updates") }]} /><LoadingState message="Loading..." /></div>;
  if (error || !item) return <div className="space-y-6"><PageHeader title="Daily Update" breadcrumbs={[{ label: "Daily Updates", onClick: () => router.push("/daily-updates") }]} /><Card className="p-12 text-center"><AlertCircle className="mx-auto h-8 w-8 text-red-500" /><p className="mt-4 text-sm text-red-600">{error || "Not found"}</p><Button variant="outline" size="sm" onClick={() => router.push("/daily-updates")} className="mt-4"><ArrowLeft className="mr-2 h-4 w-4" />Back</Button></Card></div>;

  return (
    <div className="space-y-6">
      <PageHeader title={`${item.user_name || "User"}'s Update`} description={new Date(item.update_date).toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
        breadcrumbs={[{ label: "Daily Updates", onClick: () => router.push("/daily-updates") }, { label: new Date(item.update_date).toLocaleDateString() }]}
        actions={<div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => router.push("/daily-updates")}><ArrowLeft className="mr-2 h-4 w-4" />Back</Button>
          <Button variant="outline" size="sm" onClick={() => router.push(`/daily-updates/${item.id}/edit`)}><Pencil className="mr-2 h-4 w-4" />Edit</Button>
          <Button variant="destructive" size="sm" onClick={handleDelete} disabled={deleting}><Trash2 className="mr-2 h-4 w-4" />{deleting ? "Deleting..." : "Delete"}</Button>
        </div>} />

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card><CardContent className="p-4"><div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#FFF3EB] text-[#FF6B00]"><Clock className="h-5 w-5" /></div>
          <div><p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{item.total_hours}h</p><p className="text-sm text-gray-500 dark:text-gray-400">Total Hours</p></div>
        </div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-blue-600"><Briefcase className="h-5 w-5" /></div>
          <div><p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{item.work_entries.length}</p><p className="text-sm text-gray-500 dark:text-gray-400">Work Entries</p></div>
        </div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 text-green-600"><Calendar className="h-5 w-5" /></div>
          <div><p className="text-sm font-medium text-gray-900 dark:text-gray-100">{new Date(item.submitted_at).toLocaleTimeString()}</p><p className="text-sm text-gray-500 dark:text-gray-400">Submitted At</p></div>
        </div></CardContent></Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2 space-y-6">
          {/* Work Entries */}
          <Card className="overflow-hidden">
            <div className={sh}><div className="flex items-center gap-3"><div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-100 text-blue-600"><Briefcase className="h-4.5 w-4.5" /></div><div><h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Work Entries</h3></div></div></div>
            <CardContent className="p-6">
              {item.work_entries.length === 0 ? <p className="text-sm text-gray-400 text-center py-4">No work entries</p> : (
                <div className="space-y-3">
                  {item.work_entries.map((we) => (
                    <div key={we.id} className="rounded-lg border border-gray-100 p-4 dark:border-white/5">
                      <div className="flex items-center gap-3 mb-2">
                        <Briefcase className="h-4 w-4 text-gray-400 shrink-0" />
                        <span className="font-medium text-gray-900 dark:text-gray-100">{we.project_name || "Unknown Project"}</span>
                        {we.task_title && <span className="text-gray-400">· {we.task_title}</span>}
                        <span className="ml-auto font-semibold text-[#FF6B00]">{we.duration_hours}h</span>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", WORK_TYPE_COLORS[we.work_type]?.bg, WORK_TYPE_COLORS[we.work_type]?.text)}>{we.work_type}</span>
                        <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", WORK_LOCATION_COLORS[we.location]?.bg, WORK_LOCATION_COLORS[we.location]?.text)}>{we.location}</span>
                        <span className="text-xs text-gray-400">{we.start_time} - {we.end_time}</span>
                      </div>
                      {we.description && <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">{we.description}</p>}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="xl:col-span-1 space-y-6">
          {item.summary && <Card className="overflow-hidden"><div className={sh}><div className="flex items-center gap-3"><div className="flex h-9 w-9 items-center justify-center rounded-lg bg-green-100 text-green-600"><FileText className="h-4.5 w-4.5" /></div><div><h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Summary</h3></div></div></div><CardContent className="p-6"><p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{item.summary}</p></CardContent></Card>}
          {item.blockers && <Card className="overflow-hidden"><div className={sh}><div className="flex items-center gap-3"><div className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-100 text-red-600"><Ban className="h-4.5 w-4.5" /></div><div><h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Blockers</h3></div></div></div><CardContent className="p-6"><p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{item.blockers}</p></CardContent></Card>}
          {item.tomorrow_plan && <Card className="overflow-hidden"><div className={sh}><div className="flex items-center gap-3"><div className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-100 text-purple-600"><Target className="h-4.5 w-4.5" /></div><div><h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Tomorrow&apos;s Plan</h3></div></div></div><CardContent className="p-6"><p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{item.tomorrow_plan}</p></CardContent></Card>}
        </div>
      </div>
    </div>
  );
}
