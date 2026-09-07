import api from "./axios-client";

export interface ApiResponse<T = unknown> {
  status: string;
  message: string;
  data: T;
}

export interface ModuleItem {
  id: string;
  project_id: string;
  name: string;
  task_count: number;
  created_at: string;
}

export interface ModuleListParams {
  project_id: string;
  search?: string;
}

export interface ModuleCreateData {
  project_id: string;
  name: string;
}

export interface ModuleUpdateData {
  name?: string;
}

export const moduleService = {
  getAll: (params: ModuleListParams) => {
    const q = new URLSearchParams();
    q.set("project_id", params.project_id);
    if (params.search) q.set("search", params.search);
    const qs = q.toString();
    return api.get<ApiResponse<ModuleItem[]>>(`/modules${qs ? `?${qs}` : ""}`);
  },

  getById: (id: string) =>
    api.get<ApiResponse<ModuleItem>>(`/modules/${id}`),

  create: (data: ModuleCreateData) =>
    api.post<ApiResponse<ModuleItem>>("/modules", data),

  update: (id: string, data: ModuleUpdateData) =>
    api.put<ApiResponse<ModuleItem>>(`/modules/${id}`, data),

  delete: (id: string) =>
    api.delete<ApiResponse<null>>(`/modules/${id}`),

  bulkDelete: (ids: string[]) =>
    api.post<ApiResponse<{ deleted: number; skipped: number }>>("/modules/bulk-delete", { ids }),
};
