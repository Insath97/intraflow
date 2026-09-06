import api from "@/lib/api/axios-client";

export interface DepartmentItem {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface DepartmentSimple {
  id: string;
  name: string;
}

export interface DepartmentStats {
  total: number;
  active: number;
  inactive: number;
}

export interface DepartmentListResponse {
  items: DepartmentItem[];
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

export interface DepartmentListParams {
  search?: string;
  is_active?: boolean;
  sort_by?: string;
  sort_order?: string;
  page?: number;
  size?: number;
}

export const departmentService = {
  getAll: (params?: DepartmentListParams) => {
    const q = new URLSearchParams();
    if (params?.search) q.set("search", params.search);
    if (params?.is_active !== undefined) q.set("is_active", String(params.is_active));
    if (params?.sort_by) q.set("sort_by", params.sort_by);
    if (params?.sort_order) q.set("sort_order", params.sort_order);
    if (params?.page) q.set("page", String(params.page));
    if (params?.size) q.set("size", String(params.size));
    const qs = q.toString();
    return api.get<ApiResponse<DepartmentListResponse>>(`/departments${qs ? `?${qs}` : ""}`);
  },

  getById: (id: string) =>
    api.get<ApiResponse<DepartmentItem>>(`/departments/${id}`),

  dropdown: () =>
    api.get<ApiResponse<DepartmentSimple[]>>("/departments/dropdown"),

  stats: () =>
    api.get<ApiResponse<DepartmentStats>>("/departments/stats"),

  create: (data: { name: string; description?: string; is_active?: boolean }) =>
    api.post<ApiResponse<DepartmentItem>>("/departments", data),

  update: (id: string, data: { name?: string; description?: string; is_active?: boolean }) =>
    api.patch<ApiResponse<DepartmentItem>>(`/departments/${id}`, data),

  delete: (id: string) =>
    api.delete<ApiResponse<null>>(`/departments/${id}`),

  bulkDelete: (ids: string[]) =>
    api.post<ApiResponse<{ deleted: number; skipped: number }>>("/departments/bulk-delete", { ids }),

  toggleStatus: (id: string) =>
    api.patch<ApiResponse<DepartmentItem>>(`/departments/${id}/toggle-status`),
};
