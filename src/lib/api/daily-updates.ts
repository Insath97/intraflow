import api from "./axios-client";

export type WorkType = "REGULAR" | "ADDITIONAL" | "WEEKEND" | "HOLIDAY";
export type WorkLocation = "OFFICE" | "HOME" | "REMOTE";

export interface WorkEntryInput {
  project_id: string;
  task_id?: string | null;
  work_type?: WorkType;
  location?: WorkLocation;
  start_time: string;
  end_time: string;
  description?: string;
  request_id?: string | null;
}

export interface DailyUpdateCreate {
  update_date: string;
  summary?: string;
  blockers?: string;
  yesterday_summary?: string;
  work_entries?: WorkEntryInput[];
}

export interface DailyUpdateUpdate {
  summary?: string;
  blockers?: string;
  yesterday_summary?: string;
  work_entries?: WorkEntryInput[];
}

export interface WorkEntryResponse {
  id: string;
  project_id: string;
  project_name: string | null;
  task_id: string | null;
  task_title: string | null;
  work_type: string;
  location: string;
  start_time: string;
  end_time: string;
  duration_hours: number;
  description: string | null;
  request_id: string | null;
  created_at: string | null;
}

export interface DailyUpdateItem {
  id: string;
  user_id: string;
  user_name: string | null;
  update_date: string;
  summary: string | null;
  blockers: string | null;
  yesterday_summary: string | null;
  submitted_at: string;
  work_entries: WorkEntryResponse[];
  total_hours: number;
  created_at: string | null;
  updated_at: string | null;
}

export interface DailyUpdateListResponse {
  items: DailyUpdateItem[];
  total_count: number;
  page: number;
  size: number;
  total_pages: number;
  has_next: boolean;
  has_prev: boolean;
}

export interface DailyUpdateStats {
  total_updates_this_month: number;
  users_with_updates: number;
}

export const WORK_TYPE_OPTIONS: { value: WorkType; label: string }[] = [
  { value: "REGULAR", label: "Regular" },
  { value: "ADDITIONAL", label: "Additional" },
  { value: "WEEKEND", label: "Weekend" },
  { value: "HOLIDAY", label: "Holiday" },
];

export const WORK_LOCATION_OPTIONS: { value: WorkLocation; label: string }[] = [
  { value: "OFFICE", label: "Office" },
  { value: "HOME", label: "Home" },
  { value: "REMOTE", label: "Remote" },
];

export const WORK_TYPE_COLORS: Record<string, { bg: string; text: string }> = {
  REGULAR: { bg: "bg-blue-100 dark:bg-blue-900/30", text: "text-blue-700 dark:text-blue-400" },
  ADDITIONAL: { bg: "bg-purple-100 dark:bg-purple-900/30", text: "text-purple-700 dark:text-purple-400" },
  WEEKEND: { bg: "bg-orange-100 dark:bg-orange-900/30", text: "text-orange-700 dark:text-orange-400" },
  HOLIDAY: { bg: "bg-green-100 dark:bg-green-900/30", text: "text-green-700 dark:text-green-400" },
};

export const WORK_LOCATION_COLORS: Record<string, { bg: string; text: string }> = {
  OFFICE: { bg: "bg-gray-100 dark:bg-gray-800", text: "text-gray-700 dark:text-gray-300" },
  HOME: { bg: "bg-cyan-100 dark:bg-cyan-900/30", text: "text-cyan-700 dark:text-cyan-400" },
  REMOTE: { bg: "bg-violet-100 dark:bg-violet-900/30", text: "text-violet-700 dark:text-violet-400" },
};

export const dailyUpdateService = {
  getMy: (params?: { start_date?: string; end_date?: string; page?: number; size?: number }) => {
    const q = new URLSearchParams();
    if (params?.start_date) q.set("start_date", params.start_date);
    if (params?.end_date) q.set("end_date", params.end_date);
    if (params?.page) q.set("page", String(params.page));
    if (params?.size) q.set("size", String(params.size));
    const qs = q.toString();
    return api.get<{ status: string; data: DailyUpdateListResponse }>(`/daily-updates/my${qs ? `?${qs}` : ""}`);
  },

  getAll: (params?: { user_id?: string; start_date?: string; end_date?: string; sort_by?: string; sort_order?: string; page?: number; size?: number }) => {
    const q = new URLSearchParams();
    if (params?.user_id) q.set("user_id", params.user_id);
    if (params?.start_date) q.set("start_date", params.start_date);
    if (params?.end_date) q.set("end_date", params.end_date);
    if (params?.sort_by) q.set("sort_by", params.sort_by);
    if (params?.sort_order) q.set("sort_order", params.sort_order);
    if (params?.page) q.set("page", String(params.page));
    if (params?.size) q.set("size", String(params.size));
    const qs = q.toString();
    return api.get<{ status: string; data: DailyUpdateListResponse }>(`/daily-updates${qs ? `?${qs}` : ""}`);
  },

  getToday: () =>
    api.get<{ status: string; data: DailyUpdateItem | null }>("/daily-updates/today"),

  getStats: () =>
    api.get<{ status: string; data: DailyUpdateStats }>("/daily-updates/stats"),

  getById: (id: string) =>
    api.get<{ status: string; data: DailyUpdateItem }>(`/daily-updates/${id}`),

  create: (data: DailyUpdateCreate) =>
    api.post<{ status: string; message: string; data: DailyUpdateItem }>("/daily-updates", data),

  update: (id: string, data: DailyUpdateCreate) =>
    api.put<{ status: string; message: string; data: DailyUpdateItem }>(`/daily-updates/${id}`, data),

  patch: (id: string, data: DailyUpdateUpdate) =>
    api.patch<{ status: string; message: string; data: DailyUpdateItem }>(`/daily-updates/${id}`, data),

  delete: (id: string) =>
    api.delete<{ status: string; message: string }>(`/daily-updates/${id}`),

  bulkDelete: (ids: string[]) =>
    api.post<{ status: string; message: string; data: { deleted: number; skipped: number } }>("/daily-updates/bulk-delete", { ids }),

  addWorkEntry: (dailyUpdateId: string, data: WorkEntryInput) =>
    api.post<{ status: string; data: WorkEntryResponse }>(`/daily-updates/${dailyUpdateId}/work-entries`, data),

  updateWorkEntry: (dailyUpdateId: string, workEntryId: string, data: WorkEntryInput) =>
    api.patch<{ status: string; data: WorkEntryResponse }>(`/daily-updates/${dailyUpdateId}/work-entries/${workEntryId}`, data),

  deleteWorkEntry: (dailyUpdateId: string, workEntryId: string) =>
    api.delete<{ status: string; message: string }>(`/daily-updates/${dailyUpdateId}/work-entries/${workEntryId}`),
};
