import api from "@/lib/api";

export interface PermissionItem {
  id: string;
  group_name: string;
  permission_name: string;
  display_name: string;
  is_active: boolean;
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

export interface ApiResponse<T = unknown> {
  status: string;
  message: string;
  data: T;
}

export const permissionService = {
  list: () =>
    api.get<ApiResponse<PermissionItem[]>>("/permissions/list"),

  groups: () =>
    api.get<ApiResponse<PermissionGroupItem[]>>("/permissions/groups"),

  stats: () =>
    api.get<ApiResponse<PermissionStats>>("/permissions/stats"),

  getById: (id: string) =>
    api.get<ApiResponse<PermissionItem>>(`/permissions/${id}`),
};
