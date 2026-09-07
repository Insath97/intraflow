import api from "./axios-client";

export interface ApiResponse<T = unknown> {
  status: string;
  message: string;
  data: T;
}

export interface RolePagination {
  current_page: number;
  per_page: number;
  total_pages: number;
  total_count: number;
  has_next: boolean;
  has_prev: boolean;
}

export interface RoleItem {
  id: string;
  name: string;
  description: string | null;
  is_protected: boolean;
  is_active: boolean;
  permissions: Array<{
    id: string;
    group_name: string;
    permission_name: string;
    display_name: string;
  }>;
  created_at: string;
  updated_at: string;
}

export interface RoleSimple {
  id: string;
  name: string;
  description: string | null;
}

export interface RoleStats {
  total: number;
  active: number;
  inactive: number;
  protected: number;
  total_permissions_assigned: number;
}

export interface RoleListParams {
  search?: string;
  is_active?: boolean;
  sort_by?: string;
  sort_order?: string;
  page?: number;
  size?: number;
}

export const rolesApi = {
  getAll: (params?: RoleListParams) => {
    const q = new URLSearchParams();
    if (params?.search) q.set("search", params.search);
    if (params?.is_active !== undefined) q.set("is_active", String(params.is_active));
    if (params?.sort_by) q.set("sort_by", params.sort_by);
    if (params?.sort_order) q.set("sort_order", params.sort_order);
    if (params?.page) q.set("page", String(params.page));
    if (params?.size) q.set("size", String(params.size));
    const qs = q.toString();
    return api.get<ApiResponse<{ items: RoleItem[]; pagination: RolePagination }>>(
      `/roles${qs ? `?${qs}` : ""}`
    );
  },

  getById: (id: string) =>
    api.get<ApiResponse<RoleItem>>(`/roles/${id}`),

  list: () =>
    api.get<ApiResponse<RoleSimple[]>>("/roles/list"),

  stats: () =>
    api.get<ApiResponse<RoleStats>>("/roles/stats"),

  create: (data: { name: string; description?: string; permission_ids: string[] }) =>
    api.post<ApiResponse<RoleItem>>("/roles", data),

  update: (id: string, data: { name?: string; description?: string; permission_ids?: string[]; is_active?: boolean }) =>
    api.put<ApiResponse<RoleItem>>(`/roles/${id}`, data),

  delete: (id: string) =>
    api.delete<ApiResponse<null>>(`/roles/${id}`),

  bulkDelete: (ids: string[]) =>
    api.post<ApiResponse<{ deleted: number; skipped: number }>>("/roles/bulk-delete", { ids }),
};
