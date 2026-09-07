import api from "./axios-client";

export type ProjectStatus = "PLANNING" | "ACTIVE" | "ON_HOLD" | "COMPLETED" | "CANCELLED";
export type ProjectType = "CLIENT" | "INTERNAL";
export type ProjectPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

export interface UserSimple {
  id: string;
  f_name: string;
  l_name: string;
  full_name: string;
  designation: string | null;
}

export interface ProjectMember {
  id: string;
  user: UserSimple;
  role_in_project: string | null;
  assigned_at: string;
}

export interface ProjectItem {
  id: string;
  name: string;
  code: string;
  description: string | null;
  project_type: ProjectType;
  project_lead: UserSimple;
  start_date: string;
  end_date: string | null;
  priority: ProjectPriority;
  status: ProjectStatus;
  members: ProjectMember[];
  member_count: number;
  created_at: string;
  updated_at: string;
}

export interface ProjectStats {
  total: number;
  by_status: Record<ProjectStatus, number>;
  by_priority: Record<ProjectPriority, number>;
  by_type: Record<ProjectType, number>;
}

export interface ProjectListResponse {
  items: ProjectItem[];
  total_count: number;
  page: number;
  size: number;
  total_pages: number;
  has_next: boolean;
  has_prev: boolean;
}

export interface ApiResponse<T = unknown> {
  status: string;
  message: string;
  data: T;
}

export interface ProjectListParams {
  search?: string;
  project_type?: ProjectType;
  status?: ProjectStatus;
  priority?: ProjectPriority;
  sort_by?: string;
  sort_order?: string;
  page?: number;
  size?: number;
}

export interface ProjectCreateData {
  name: string;
  code: string;
  description?: string;
  project_type: ProjectType;
  project_lead_id: string;
  start_date: string;
  end_date?: string;
  priority?: ProjectPriority;
  status?: ProjectStatus;
  members?: { user_id: string; role_in_project?: string }[];
}

export interface ProjectUpdateData {
  name?: string;
  code?: string;
  description?: string;
  project_type?: ProjectType;
  project_lead_id?: string;
  start_date?: string;
  end_date?: string;
  priority?: ProjectPriority;
  status?: ProjectStatus;
  members?: { user_id: string; role_in_project?: string }[];
}

export const projectService = {
  getAll: (params?: ProjectListParams) => {
    const q = new URLSearchParams();
    if (params?.search) q.set("search", params.search);
    if (params?.project_type) q.set("project_type", params.project_type);
    if (params?.status) q.set("status", params.status);
    if (params?.priority) q.set("priority", params.priority);
    if (params?.sort_by) q.set("sort_by", params.sort_by);
    if (params?.sort_order) q.set("sort_order", params.sort_order);
    if (params?.page) q.set("page", String(params.page));
    if (params?.size) q.set("size", String(params.size));
    const qs = q.toString();
    return api.get<ApiResponse<ProjectListResponse>>(`/projects${qs ? `?${qs}` : ""}`);
  },

  getById: (id: string) =>
    api.get<ApiResponse<ProjectItem>>(`/projects/${id}`),

  dropdown: (status?: ProjectStatus) => {
    const qs = status ? `?status=${status}` : "";
    return api.get<ApiResponse<{ id: string; name: string; code: string; status: ProjectStatus }[]>>(`/projects/dropdown${qs}`);
  },

  stats: () =>
    api.get<ApiResponse<ProjectStats>>("/projects/stats"),

  create: (data: ProjectCreateData) =>
    api.post<ApiResponse<ProjectItem>>("/projects", data),

  update: (id: string, data: ProjectUpdateData) =>
    api.put<ApiResponse<ProjectItem>>(`/projects/${id}`, data),

  patch: (id: string, data: ProjectUpdateData) =>
    api.patch<ApiResponse<ProjectItem>>(`/projects/${id}`, data),

  delete: (id: string) =>
    api.delete<ApiResponse<null>>(`/projects/${id}`),

  bulkDelete: (ids: string[]) =>
    api.post<ApiResponse<{ deleted: number; skipped: number }>>("/projects/bulk-delete", { ids }),

  toggleStatus: (id: string) =>
    api.patch<ApiResponse<ProjectItem>>(`/projects/${id}/toggle-status`),

  getMembers: (id: string) =>
    api.get<ApiResponse<ProjectMember[]>>(`/projects/${id}/members`),

  addMember: (id: string, userId: string, roleInProject?: string) =>
    api.post<ApiResponse<ProjectMember>>(`/projects/${id}/members`, { user_id: userId, role_in_project: roleInProject }),

  removeMember: (id: string, userId: string) =>
    api.delete<ApiResponse<null>>(`/projects/${id}/members/${userId}`),
};
