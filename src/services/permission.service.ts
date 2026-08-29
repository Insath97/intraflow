import api, { type ApiResponse } from "@/lib/api";

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

class PermissionService {
  async getList(): Promise<ApiResponse<PermissionItem[]>> {
    const response = await api.get<ApiResponse<PermissionItem[]>>("/permissions/list");
    return response.data;
  }

  async getGroups(): Promise<ApiResponse<PermissionGroupItem[]>> {
    const response = await api.get<ApiResponse<PermissionGroupItem[]>>("/permissions/groups");
    return response.data;
  }

  async getStats(): Promise<ApiResponse<PermissionStats>> {
    const response = await api.get<ApiResponse<PermissionStats>>("/permissions/stats");
    return response.data;
  }
}

export const permissionService = new PermissionService();
