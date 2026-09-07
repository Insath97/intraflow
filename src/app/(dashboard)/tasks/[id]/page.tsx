"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { taskService, type TaskItem, type SubtaskItem, type CommentItem, STATUS_COLORS, PRIORITY_COLORS } from "@/lib/api/tasks";
import { useToast } from "@/components/ui/toast";
import { PageHeader } from "@/components/common/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { LoadingState } from "@/components/common/loading-state";
import { cn } from "@/lib/utils";
import {
  ArrowLeft, Loader2, ClipboardList, FileText, Settings, Users, Calendar,
  CheckCircle2, Circle, MessageSquare, Plus, Trash2, Send, AlertCircle,
  Pencil, ToggleLeft,
} from "lucide-react";

const SL: Record<string, string> = { TODO: "To Do", IN_PROGRESS: "In Progress", BLOCKED: "Blocked", IN_REVIEW: "In Review", COMPLETED: "Completed", CANCELLED: "Cancelled" };
const PL: Record<string, string> = { LOW: "Low", MEDIUM: "Medium", HIGH: "High", CRITICAL: "Critical" };
const STSL: Record<string, string> = { TODO: "To Do", IN_PROGRESS: "In Progress", COMPLETED: "Completed" };

export default function TaskDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { toast } = useToast();

  const [task, setTask] = useState<TaskItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [comments, setComments] = useState<CommentItem[]>([]);
  const [newComment, setNewComment] = useState("");
  const [postingComment, setPostingComment] = useState(false);

  const [newSubtask, setNewSubtask] = useState("");
  const [addingSubtask, setAddingSubtask] = useState(false);

  const [togglingStatus, setTogglingStatus] = useState(false);

  async function loadTask() {
    try {
      setLoading(true);
      const [tRes, cRes] = await Promise.all([taskService.getById(id), taskService.getComments(id)]);
      if (tRes.data.status === "success") setTask(tRes.data.data);
      else setError("Task not found");
      if (cRes.data.status === "success") setComments(cRes.data.data);
    } catch { setError("Failed to load task"); }
    finally { setLoading(false); }
  }

  useEffect(() => { loadTask(); }, [id]);

  async function handleToggleStatus() {
    if (!task || togglingStatus) return;
    setTogglingStatus(true);
    try {
      const res = await taskService.toggleStatus(task.id);
      if (res.data.status === "success") { setTask(res.data.data); toast("Status updated", "success"); }
    } catch { toast("Failed to toggle status", "error"); }
    finally { setTogglingStatus(false); }
  }

  async function handleAddSubtask() {
    const t = newSubtask.trim();
    if (!t || !task) return;
    setAddingSubtask(true);
    try {
      const res = await taskService.addSubtask(task.id, t);
      if (res.data.status === "success") { setNewSubtask(""); await loadTask(); toast("Subtask added", "success"); }
    } catch { toast("Failed to add subtask", "error"); }
    finally { setAddingSubtask(false); }
  }

  async function handleToggleSubtask(sub: SubtaskItem) {
    if (!task) return;
    try {
      const res = await taskService.toggleSubtask(task.id, sub.id);
      if (res.data.status === "success") await loadTask();
    } catch { toast("Failed to toggle subtask", "error"); }
  }

  async function handleDeleteSubtask(sub: SubtaskItem) {
    if (!task) return;
    try {
      const res = await taskService.deleteSubtask(task.id, sub.id);
      if (res.data.status === "success") { await loadTask(); toast("Subtask deleted", "success"); }
    } catch { toast("Failed to delete subtask", "error"); }
  }

  async function handlePostComment() {
    const c = newComment.trim();
    if (!c || !task) return;
    setPostingComment(true);
    try {
      const res = await taskService.addComment(task.id, c);
      if (res.data.status === "success") { setNewComment(""); setComments((p) => [...p, res.data.data]); toast("Comment added", "success"); }
    } catch { toast("Failed to post comment", "error"); }
    finally { setPostingComment(false); }
  }

  async function handleDeleteComment(commentId: string) {
    if (!task) return;
    try {
      const res = await taskService.deleteComment(task.id, commentId);
      if (res.data.status === "success") { setComments((p) => p.filter((c) => c.id !== commentId)); toast("Comment deleted", "success"); }
    } catch { toast("Failed to delete comment", "error"); }
  }

  const sh = "border-b border-gray-100 bg-gray-50/50 px-6 py-4 dark:border-gray-800 dark:bg-gray-800/50";

  if (loading) return <div className="space-y-6"><PageHeader title="Task Details" breadcrumbs={[{ label: "Tasks", onClick: () => router.push("/tasks") }, { label: "Details" }]} /><LoadingState message="Loading task..." /></div>;

  if (error || !task) return <div className="space-y-6"><PageHeader title="Task Details" breadcrumbs={[{ label: "Tasks", onClick: () => router.push("/tasks") }]} /><Card className="p-12 text-center"><AlertCircle className="mx-auto h-8 w-8 text-red-500" /><p className="mt-4 text-sm text-red-600 dark:text-red-400">{error || "Not found"}</p><Button variant="outline" size="sm" onClick={() => router.push("/tasks")} className="mt-4"><ArrowLeft className="mr-2 h-4 w-4" />Back</Button></Card></div>;

  const sc = STATUS_COLORS[task.status];
  const pc = PRIORITY_COLORS[task.priority];
  const subtaskProgress = task.subtask_count > 0 ? Math.round((task.completed_subtask_count / task.subtask_count) * 100) : 0;

  return (
    <div className="space-y-6">
      <PageHeader title={task.title} breadcrumbs={[{ label: "Tasks", onClick: () => router.push("/tasks") }, { label: task.project.name }]}
        actions={<div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => router.push("/tasks")}><ArrowLeft className="mr-2 h-4 w-4" />Back</Button>
          <Button variant="outline" size="sm" onClick={() => router.push(`/tasks/${task.id}/edit`)}><Pencil className="mr-2 h-4 w-4" />Edit</Button>
          <Button size="sm" onClick={handleToggleStatus} disabled={togglingStatus}>
            {togglingStatus ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ToggleLeft className="mr-2 h-4 w-4" />}
            Toggle Status
          </Button>
        </div>} />

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2 space-y-6">
          {/* Details */}
          <Card className="overflow-hidden">
            <div className={sh}><div className="flex items-center gap-3"><div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#FFF3EB] text-[#FF6B00]"><FileText className="h-4.5 w-4.5" /></div><div><h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Details</h3></div></div></div>
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center gap-3">
                <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium", sc.bg, sc.text)}><span className={cn("h-1.5 w-1.5 rounded-full", sc.dot)} />{SL[task.status]}</span>
                <span className={cn("inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium", pc.bg, pc.text)}>{PL[task.priority]}</span>
                {task.project && <span className="text-xs text-gray-400">{task.project.code}</span>}
                {task.module && <span className="text-xs text-gray-400">· {task.module.name}</span>}
              </div>
              {task.description && <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{task.description}</p>}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><span className="text-gray-500 dark:text-gray-400">Assignee</span><p className="font-medium text-gray-900 dark:text-gray-100">{task.assigned_to.full_name}</p></div>
                <div><span className="text-gray-500 dark:text-gray-400">Created by</span><p className="font-medium text-gray-900 dark:text-gray-100">{task.created_by.full_name}</p></div>
                <div><span className="text-gray-500 dark:text-gray-400">Start Date</span><p className="font-medium text-gray-900 dark:text-gray-100">{task.start_date ? new Date(task.start_date).toLocaleDateString() : "-"}</p></div>
                <div><span className="text-gray-500 dark:text-gray-400">Due Date</span><p className="font-medium text-gray-900 dark:text-gray-100">{task.due_date ? new Date(task.due_date).toLocaleDateString() : "-"}</p></div>
                <div><span className="text-gray-500 dark:text-gray-400">Est. Hours</span><p className="font-medium text-gray-900 dark:text-gray-100">{task.estimated_hours || "-"}</p></div>
                <div><span className="text-gray-500 dark:text-gray-400">Completion</span>
                  <div className="flex items-center gap-2 mt-1"><div className="h-2 w-24 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700"><div className="h-full rounded-full bg-[#FF6B00]" style={{ width: `${task.completion_pct}%` }} /></div><span className="text-xs text-gray-500">{task.completion_pct}%</span></div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Subtasks */}
          <Card className="overflow-hidden">
            <div className={sh}><div className="flex items-center gap-3"><div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-100 text-blue-600"><CheckCircle2 className="h-4.5 w-4.5" /></div><div><h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Subtasks</h3><p className="text-xs text-gray-500 dark:text-gray-400">{task.completed_subtask_count}/{task.subtask_count} completed</p></div></div></div>
            <CardContent className="p-6">
              <div className="flex gap-2 mb-4">
                <Input placeholder="Add subtask..." value={newSubtask} onChange={(e) => setNewSubtask(e.target.value)} onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddSubtask())} />
                <Button type="button" size="sm" onClick={handleAddSubtask} disabled={addingSubtask || !newSubtask.trim()}>{addingSubtask ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}</Button>
              </div>
              {task.subtask_count > 0 && (
                <div className="mb-4"><div className="flex items-center gap-2"><div className="h-2 flex-1 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700"><div className="h-full rounded-full bg-green-500 transition-all" style={{ width: `${subtaskProgress}%` }} /></div><span className="text-xs text-gray-500">{subtaskProgress}%</span></div></div>
              )}
              {task.subtasks.length === 0 ? <p className="text-sm text-gray-400 text-center py-4">No subtasks</p> : (
                <div className="space-y-2">
                  {task.subtasks.map((sub) => {
                    const isDone = sub.status === "COMPLETED";
                    const isProg = sub.status === "IN_PROGRESS";
                    return (
                      <div key={sub.id} className="flex items-center gap-3 rounded-lg border border-gray-100 bg-gray-50/50 px-3 py-2 dark:border-white/5 dark:bg-white/[0.02]">
                        <button type="button" onClick={() => handleToggleSubtask(sub)} className={cn("flex h-5 w-5 items-center justify-center rounded border-2 transition-colors",
                          isDone ? "border-green-500 bg-green-500 text-white" : isProg ? "border-blue-500 bg-blue-500 text-white" : "border-gray-300 dark:border-gray-600")}>
                          {isDone && <CheckCircle2 className="h-3 w-3" />}
                          {isProg && <Circle className="h-3 w-3" />}
                        </button>
                        <span className={cn("flex-1 text-sm", isDone && "line-through text-gray-400")}>{sub.title}</span>
                        <span className={cn("text-xs px-1.5 py-0.5 rounded", isDone ? "text-green-600 bg-green-50 dark:bg-green-900/20" : isProg ? "text-blue-600 bg-blue-50 dark:bg-blue-900/20" : "text-gray-500 bg-gray-100 dark:bg-gray-800")}>{STSL[sub.status]}</span>
                        <button type="button" onClick={() => handleDeleteSubtask(sub)} className="text-gray-400 hover:text-red-500"><Trash2 className="h-3.5 w-3.5" /></button>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Comments */}
          <Card className="overflow-hidden">
            <div className={sh}><div className="flex items-center gap-3"><div className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-100 text-purple-600"><MessageSquare className="h-4.5 w-4.5" /></div><div><h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Comments</h3><p className="text-xs text-gray-500 dark:text-gray-400">{comments.length} comment{comments.length !== 1 ? "s" : ""}</p></div></div></div>
            <CardContent className="p-6">
              <div className="flex gap-2 mb-6">
                <Input placeholder="Write a comment..." value={newComment} onChange={(e) => setNewComment(e.target.value)} onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), handlePostComment())} />
                <Button size="sm" onClick={handlePostComment} disabled={postingComment || !newComment.trim()}>{postingComment ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}</Button>
              </div>
              {comments.length === 0 ? <p className="text-sm text-gray-400 text-center py-4">No comments yet</p> : (
                <div className="space-y-4">
                  {comments.map((c) => (
                    <div key={c.id} className="flex gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#FFF3EB] text-[#FF6B00] text-xs font-bold">{c.user.f_name[0]}{c.user.l_name[0]}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2"><span className="text-sm font-medium text-gray-900 dark:text-gray-100">{c.user.full_name}</span><span className="text-xs text-gray-400">{new Date(c.created_at).toLocaleString()}</span></div>
                        <p className="mt-1 text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{c.comment}</p>
                      </div>
                      <button type="button" onClick={() => handleDeleteComment(c.id)} className="text-gray-400 hover:text-red-500 shrink-0"><Trash2 className="h-3.5 w-3.5" /></button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="xl:col-span-1 space-y-6">
          <Card className="overflow-hidden">
            <div className={sh}><div className="flex items-center gap-3"><div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-100 text-amber-600"><Settings className="h-4.5 w-4.5" /></div><div><h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Info</h3></div></div></div>
            <CardContent className="p-6 space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-gray-500 dark:text-gray-400">Status</span><span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", sc.bg, sc.text)}>{SL[task.status]}</span></div>
              <div className="flex justify-between"><span className="text-gray-500 dark:text-gray-400">Priority</span><span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", pc.bg, pc.text)}>{PL[task.priority]}</span></div>
              <div className="flex justify-between"><span className="text-gray-500 dark:text-gray-400">Created</span><span className="text-gray-900 dark:text-gray-100">{new Date(task.created_at).toLocaleDateString()}</span></div>
              <div className="flex justify-between"><span className="text-gray-500 dark:text-gray-400">Updated</span><span className="text-gray-900 dark:text-gray-100">{new Date(task.updated_at).toLocaleDateString()}</span></div>
              <div className="flex justify-between"><span className="text-gray-500 dark:text-gray-400">Subtasks</span><span className="text-gray-900 dark:text-gray-100">{task.completed_subtask_count}/{task.subtask_count}</span></div>
              <div className="flex justify-between"><span className="text-gray-500 dark:text-gray-400">Comments</span><span className="text-gray-900 dark:text-gray-100">{task.comment_count}</span></div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
