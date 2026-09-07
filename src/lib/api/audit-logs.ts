import api from "./axios-client";

export interface ApiResponse<T = unknown> {
  status: string;
  message: string;
  data: T;
}

export interface PaginatedResponse<T> {
  items: T[];
  total_count: number;
  page: number;
  size: number;
  total_pages: number;
}

export interface AuditLogItem {
  id: string;
  user_id: string;
  user_name: string;
  module: string;
  action: string;
  description: string;
  ip_address: string;
  created_at: string;
}

export interface AuditLogListParams {
  user_id?: string;
  module?: string;
  action?: string;
  start_date?: string;
  end_date?: string;
  page?: number;
  size?: number;
}

export const MODULES = [
  "auth",
  "Users",
  "Projects",
  "Tasks",
  "Departments",
  "Modules",
  "Daily Updates",
  "Notifications",
  "Roles",
  "Permissions",
  "Upload",
  "Holiday Calendar",
  "Requests",
];

export const ACTIONS = [
  "login",
  "logout",
  "CREATE",
  "UPDATE",
  "DELETE",
  "BULK_DELETE",
  "SHOW",
  "APPROVED",
  "REJECTED",
];

export const auditLogsApi = {
  getAll: (params?: AuditLogListParams) => {
    const q = new URLSearchParams();
    if (params?.user_id) q.set("user_id", params.user_id);
    if (params?.module) q.set("module", params.module);
    if (params?.action) q.set("action", params.action);
    if (params?.start_date) q.set("start_date", params.start_date);
    if (params?.end_date) q.set("end_date", params.end_date);
    if (params?.page) q.set("page", String(params.page));
    if (params?.size) q.set("size", String(params.size));
    const queryString = q.toString();
    return api.get<ApiResponse<PaginatedResponse<AuditLogItem>>>(
      `/reports/activity-log${queryString ? `?${queryString}` : ""}`
    );
  },

  getById: (id: string) =>
    api.get<ApiResponse<AuditLogItem>>(`/reports/activity-log/${id}`),
};
