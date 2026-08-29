import api, { type ApiResponse } from "@/lib/api";

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

export interface PermissionListResponse {
  items: PermissionItem[];
  pagination: PermissionPagination;
}

export interface PermissionCreatePayload {
  group_name: string;
  permission_name: string;
  display_name: string;
  description?: string;
}

export interface PermissionUpdatePayload {
  group_name?: string;
  permission_name?: string;
  display_name?: string;
  description?: string;
  is_active?: boolean;
}

class PermissionService {
  async getAll(params?: {
    search?: string;
    group_name?: string;
    permission_name?: string;
    is_active?: boolean;
    sort_by?: string;
    sort_order?: string;
    page?: number;
    size?: number;
  }): Promise<ApiResponse<PermissionListResponse>> {
    const queryParams = new URLSearchParams();
    if (params?.search) queryParams.set("search", params.search);
    if (params?.group_name) queryParams.set("group_name", params.group_name);
    if (params?.permission_name) queryParams.set("permission_name", params.permission_name);
    if (params?.is_active !== undefined) queryParams.set("is_active", String(params.is_active));
    if (params?.sort_by) queryParams.set("sort_by", params.sort_by);
    if (params?.sort_order) queryParams.set("sort_order", params.sort_order);
    if (params?.page) queryParams.set("page", String(params.page));
    if (params?.size) queryParams.set("size", String(params.size));

    const response = await api.get<ApiResponse<PermissionListResponse>>(
      `/api/v1/permissions/?${queryParams.toString()}`
    );
    return response.data;
  }

  async getGroups(): Promise<ApiResponse<PermissionGroupItem[]>> {
    const response = await api.get<ApiResponse<PermissionGroupItem[]>>(
      "/api/v1/permissions/groups"
    );
    return response.data;
  }

  async getStats(): Promise<ApiResponse<PermissionStats>> {
    const response = await api.get<ApiResponse<PermissionStats>>(
      "/api/v1/permissions/stats"
    );
    return response.data;
  }

  async getList(): Promise<ApiResponse<Array<{ id: string; group_name: string; permission_name: string; display_name: string }>>> {
    const response = await api.get(
      "/api/v1/permissions/list"
    );
    return response.data;
  }

  async getById(id: string): Promise<ApiResponse<PermissionItem>> {
    const response = await api.get<ApiResponse<PermissionItem>>(
      `/api/v1/permissions/${id}`
    );
    return response.data;
  }

  async create(data: PermissionCreatePayload): Promise<ApiResponse<PermissionItem>> {
    const response = await api.post<ApiResponse<PermissionItem>>(
      "/api/v1/permissions/",
      data
    );
    return response.data;
  }

  async update(id: string, data: PermissionUpdatePayload): Promise<ApiResponse<PermissionItem>> {
    const response = await api.put<ApiResponse<PermissionItem>>(
      `/api/v1/permissions/${id}`,
      data
    );
    return response.data;
  }

  async delete(id: string): Promise<ApiResponse<null>> {
    const response = await api.delete<ApiResponse<null>>(
      `/api/v1/permissions/${id}`
    );
    return response.data;
  }

  async bulkDelete(ids: string[]): Promise<ApiResponse<{ deleted_count: number }>> {
    const response = await api.post<ApiResponse<{ deleted_count: number }>>(
      "/api/v1/permissions/bulk-delete",
      { ids }
    );
    return response.data;
  }
}

export const permissionService = new PermissionService();
