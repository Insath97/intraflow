import api from "./axios-client";

export type TaskStatus = "TODO" | "IN_PROGRESS" | "BLOCKED" | "IN_REVIEW" | "COMPLETED" | "CANCELLED";
export type TaskPriority = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
export type SubtaskStatusType = "TODO" | "IN_PROGRESS" | "COMPLETED";

export interface TaskUser {
  id: string;
  f_name: string;
  l_name: string;
  full_name: string;
}

export interface TaskProject {
  id: string;
  name: string;
  code: string;
}

export interface TaskModule {
  id: string;
  name: string;
}

export interface SubtaskItem {
  id: string;
  title: string;
  status: SubtaskStatusType;
  created_at: string;
}

export interface CommentItem {
  id: string;
  user: TaskUser;
  comment: string;
  created_at: string;
}

export interface TaskItem {
  id: string;
  project: TaskProject;
  module: TaskModule | null;
  title: string;
  description: string | null;
  assigned_to: TaskUser;
  created_by: TaskUser;
  priority: TaskPriority;
  status: TaskStatus;
  start_date: string | null;
  due_date: string | null;
  estimated_hours: number | null;
  completion_pct: number;
  subtasks: SubtaskItem[];
  subtask_count: number;
  completed_subtask_count: number;
  comment_count: number;
  created_at: string;
  updated_at: string;
}

export interface TaskStats {
  total: number;
  by_status: Record<string, number>;
  by_priority: Record<string, number>;
}

export interface TaskListParams {
  search?: string;
  project_id?: string;
  module_id?: string;
  assigned_to?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  sort_by?: string;
  sort_order?: "asc" | "desc";
  page?: number;
  size?: number;
}

export interface TaskListResponse {
  items: TaskItem[];
  total_count: number;
  page: number;
  size: number;
  total_pages: number;
  has_next: boolean;
  has_prev: boolean;
}

export interface TaskCreateData {
  project_id: string;
  module_id?: string | null;
  title: string;
  description?: string;
  assigned_to: string;
  priority?: TaskPriority;
  status?: TaskStatus;
  start_date?: string;
  due_date?: string;
  estimated_hours?: number;
  completion_pct?: number;
  subtasks?: { title: string }[];
}

export interface TaskUpdateData {
  project_id?: string;
  module_id?: string | null;
  title?: string;
  description?: string;
  assigned_to?: string;
  priority?: TaskPriority;
  status?: TaskStatus;
  start_date?: string;
  due_date?: string;
  estimated_hours?: number;
  completion_pct?: number;
  subtasks?: { title: string }[];
}

export const STATUS_COLORS: Record<TaskStatus, { bg: string; text: string; dot: string }> = {
  TODO: { bg: "bg-gray-100 dark:bg-gray-800", text: "text-gray-700 dark:text-gray-300", dot: "bg-gray-500" },
  IN_PROGRESS: { bg: "bg-blue-100 dark:bg-blue-900/30", text: "text-blue-700 dark:text-blue-400", dot: "bg-blue-500" },
  BLOCKED: { bg: "bg-red-100 dark:bg-red-900/30", text: "text-red-700 dark:text-red-400", dot: "bg-red-500" },
  IN_REVIEW: { bg: "bg-yellow-100 dark:bg-yellow-900/30", text: "text-yellow-700 dark:text-yellow-400", dot: "bg-yellow-500" },
  COMPLETED: { bg: "bg-green-100 dark:bg-green-900/30", text: "text-green-700 dark:text-green-400", dot: "bg-green-500" },
  CANCELLED: { bg: "bg-gray-100 dark:bg-gray-800", text: "text-gray-500 dark:text-gray-500", dot: "bg-gray-400" },
};

export const PRIORITY_COLORS: Record<TaskPriority, { bg: string; text: string }> = {
  LOW: { bg: "bg-gray-100 dark:bg-gray-800", text: "text-gray-600 dark:text-gray-400" },
  MEDIUM: { bg: "bg-blue-100 dark:bg-blue-900/30", text: "text-blue-600 dark:text-blue-400" },
  HIGH: { bg: "bg-orange-100 dark:bg-orange-900/30", text: "text-orange-600 dark:text-orange-400" },
  CRITICAL: { bg: "bg-red-100 dark:bg-red-900/30", text: "text-red-600 dark:text-red-400" },
};

export const taskService = {
  getAll: (params: TaskListParams) => {
    const q = new URLSearchParams();
    if (params.search) q.set("search", params.search);
    if (params.project_id) q.set("project_id", params.project_id);
    if (params.module_id) q.set("module_id", params.module_id);
    if (params.assigned_to) q.set("assigned_to", params.assigned_to);
    if (params.status) q.set("status", params.status);
    if (params.priority) q.set("priority", params.priority);
    if (params.sort_by) q.set("sort_by", params.sort_by);
    if (params.sort_order) q.set("sort_order", params.sort_order);
    if (params.page) q.set("page", String(params.page));
    if (params.size) q.set("size", String(params.size));
    const qs = q.toString();
    return api.get<{ status: string; message: string; data: TaskListResponse }>(`/tasks${qs ? `?${qs}` : ""}`);
  },

  getById: (id: string) =>
    api.get<{ status: string; data: TaskItem }>(`/tasks/${id}`),

  create: (data: TaskCreateData) =>
    api.post<{ status: string; message: string; data: TaskItem }>("/tasks", data),

  update: (id: string, data: TaskUpdateData) =>
    api.put<{ status: string; data: TaskItem }>(`/tasks/${id}`, data),

  patch: (id: string, data: TaskUpdateData) =>
    api.patch<{ status: string; data: TaskItem }>(`/tasks/${id}`, data),

  toggleStatus: (id: string) =>
    api.patch<{ status: string; data: TaskItem }>(`/tasks/${id}/toggle-status`),

  delete: (id: string) =>
    api.delete<{ status: string; message: string }>(`/tasks/${id}`),

  bulkDelete: (ids: string[]) =>
    api.post<{ status: string; message: string; data: { deleted: number; skipped: number } }>("/tasks/bulk-delete", { ids }),

  getStats: () =>
    api.get<{ status: string; data: TaskStats }>("/tasks/stats"),

  getDropdown: (params?: { project_id?: string; status?: TaskStatus }) => {
    const q = new URLSearchParams();
    if (params?.project_id) q.set("project_id", params.project_id);
    if (params?.status) q.set("status", params.status);
    const qs = q.toString();
    return api.get<{ status: string; data: { id: string; title: string; status: string; priority: string }[] }>(`/tasks/dropdown${qs ? `?${qs}` : ""}`);
  },

  addSubtask: (taskId: string, title: string) =>
    api.post<{ status: string; data: SubtaskItem }>(`/tasks/${taskId}/subtasks`, { title }),

  toggleSubtask: (taskId: string, subtaskId: string) =>
    api.patch<{ status: string; data: SubtaskItem }>(`/tasks/${taskId}/subtasks/${subtaskId}/toggle`),

  deleteSubtask: (taskId: string, subtaskId: string) =>
    api.delete<{ status: string; message: string }>(`/tasks/${taskId}/subtasks/${subtaskId}`),

  getComments: (taskId: string) =>
    api.get<{ status: string; data: CommentItem[] }>(`/tasks/${taskId}/comments`),

  addComment: (taskId: string, comment: string) =>
    api.post<{ status: string; data: CommentItem }>(`/tasks/${taskId}/comments`, { comment }),

  deleteComment: (taskId: string, commentId: string) =>
    api.delete<{ status: string; message: string }>(`/tasks/${taskId}/comments/${commentId}`),
};
