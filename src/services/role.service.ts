import api from "@/lib/api/axios-client";
import type { Role } from "@/types";
import { generateId } from "@/lib/utils";

// ============================================
// API-based Role Service (new)
// ============================================

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

export interface RolePagination {
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

export interface RoleCreatePayload {
  name: string;
  description?: string;
  permission_ids: string[];
}

export interface RoleUpdatePayload {
  name?: string;
  description?: string;
  permission_ids?: string[];
  is_active?: boolean;
}

export const roleService = {
  getAll: (params?: {
    search?: string;
    is_active?: boolean;
    sort_by?: string;
    sort_order?: string;
    page?: number;
    size?: number;
  }) => {
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

  create: (data: RoleCreatePayload) =>
    api.post<ApiResponse<RoleItem>>("/roles", data),

  update: (id: string, data: RoleUpdatePayload) =>
    api.put<ApiResponse<RoleItem>>(`/roles/${id}`, data),

  delete: (id: string) =>
    api.delete<ApiResponse<null>>(`/roles/${id}`),

  bulkDelete: (ids: string[]) =>
    api.post<ApiResponse<{ deleted: number; skipped: number }>>("/roles/bulk-delete", { ids }),
};

// ============================================
// Legacy localStorage Role Service (for users page backward compat)
// ============================================

const STORAGE_KEY = "mis_roles";

function legacyGetAll(): Role[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function legacyCreate(role: Omit<Role, "id" | "createdAt" | "updatedAt">): Role {
  const roles = legacyGetAll();
  const now = new Date().toISOString();
  const newRole: Role = {
    ...role,
    id: generateId(),
    createdAt: now,
    updatedAt: now,
  };
  roles.push(newRole);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(roles));
  return newRole;
}

export const RoleService = {
  getAll: legacyGetAll,
  create: legacyCreate,
};
