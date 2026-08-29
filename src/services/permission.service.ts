import api from "@/lib/api";

export interface PermissionItem {
  id: string;
  group_name: string;
  permission_name: string;
  display_name: string;
  description?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PermissionGroupItem {
  group_name: string;
  count: number;
}

export interface PermissionStats {
  total_permissions: number;
  total_groups: number;
  active_permissions: number;
  inactive_permissions: number;
}

export interface PermissionPagination {
  current_page: number;
  per_page: number;
  total_pages: number;
  total_count: number;
  has_next: boolean;
  has_prev: boolean;
}

export interface ApiResponse<T = unknown> {
  status: string;
  message: string;
  data: T;
}

export interface PermissionCreatePayload {
  group_name: string;
  permission_name: string;
  display_name?: string;
  description?: string;
}

export interface PermissionUpdatePayload {
  group_name?: string;
  permission_name?: string;
  display_name?: string;
  description?: string;
  is_active?: boolean;
}

export const permissionService = {
  getAll: (params?: {
    search?: string;
    group_name?: string;
    is_active?: boolean;
    sort_by?: string;
    sort_order?: string;
    page?: number;
    size?: number;
  }) => {
    const q = new URLSearchParams();
    if (params?.search) q.set("search", params.search);
    if (params?.group_name) q.set("group_name", params.group_name);
    if (params?.is_active !== undefined) q.set("is_active", String(params.is_active));
    if (params?.sort_by) q.set("sort_by", params.sort_by);
    if (params?.sort_order) q.set("sort_order", params.sort_order);
    if (params?.page) q.set("page", String(params.page));
    if (params?.size) q.set("size", String(params.size));
    return api.get<ApiResponse<{ items: PermissionItem[]; pagination: PermissionPagination }>>(
      `/permissions?${q.toString()}`
    );
  },

  getById: (id: string) =>
    api.get<ApiResponse<PermissionItem>>(`/permissions/${id}`),

  create: (data: PermissionCreatePayload) =>
    api.post<ApiResponse<PermissionItem>>("/permissions", data),

  update: (id: string, data: PermissionUpdatePayload) =>
    api.put<ApiResponse<PermissionItem>>(`/permissions/${id}`, data),

  delete: (id: string) =>
    api.delete<ApiResponse<null>>(`/permissions/${id}`),

  list: () =>
    api.get<ApiResponse<PermissionItem[]>>("/permissions/list"),

  groups: () =>
    api.get<ApiResponse<PermissionGroupItem[]>>("/permissions/groups"),

  stats: () =>
    api.get<ApiResponse<PermissionStats>>("/permissions/stats"),
};
