import api from "@/lib/api/axios-client";

export interface UserItem {
  id: string;
  f_name: string;
  l_name: string;
  full_name: string;
  username: string;
  email: string;
  employee_code: string;
  profile_image_path?: string;
  role?: { id: string; name: string; description?: string };
  department?: { id: string; name: string };
  designation?: string;
  manager?: { id: string; f_name: string; l_name: string; full_name: string; designation?: string };
  is_active: boolean;
  can_login: boolean;
  last_login_at?: string;
  last_login_ip?: string;
  created_at: string;
  updated_at: string;
}

export interface UserSimple {
  id: string;
  f_name: string;
  l_name: string;
  full_name: string;
  username: string;
  employee_code: string;
  designation?: string;
}

export interface UserStats {
  total: number;
  active: number;
  inactive: number;
  can_login: number;
  cannot_login: number;
  by_role: Record<string, number>;
}

export interface UserPagination {
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

export interface UserListParams {
  search?: string;
  role_id?: string;
  is_active?: boolean;
  can_login?: boolean;
  sort_by?: string;
  sort_order?: string;
  page?: number;
  size?: number;
}

export const userService = {
  getAll: (params?: UserListParams) => {
    const q = new URLSearchParams();
    if (params?.search) q.set("search", params.search);
    if (params?.role_id) q.set("role_id", params.role_id);
    if (params?.is_active !== undefined) q.set("is_active", String(params.is_active));
    if (params?.can_login !== undefined) q.set("can_login", String(params.can_login));
    if (params?.sort_by) q.set("sort_by", params.sort_by);
    if (params?.sort_order) q.set("sort_order", params.sort_order);
    if (params?.page) q.set("page", String(params.page));
    if (params?.size) q.set("size", String(params.size));
    const qs = q.toString();
    return api.get<ApiResponse<{ items: UserItem[]; pagination: UserPagination }>>(
      `/users${qs ? `?${qs}` : ""}`
    );
  },

  getById: (id: string) =>
    api.get<ApiResponse<UserItem>>(`/users/${id}`),

  simple: (roleId?: string) => {
    const q = roleId ? `?role_id=${roleId}` : "";
    return api.get<ApiResponse<UserSimple[]>>(`/users/simple${q}`);
  },

  stats: () =>
    api.get<ApiResponse<UserStats>>("/users/stats"),

  create: (data: FormData) =>
    api.post<ApiResponse<UserItem>>("/users", data, {
      headers: { "Content-Type": "multipart/form-data" },
    }),

  update: (id: string, data: FormData) =>
    api.patch<ApiResponse<UserItem>>(`/users/${id}`, data, {
      headers: { "Content-Type": "multipart/form-data" },
    }),

  delete: (id: string) =>
    api.delete<ApiResponse<null>>(`/users/${id}`),

  bulkDelete: (ids: string[]) =>
    api.post<ApiResponse<{ deleted: number; skipped: number }>>("/users/bulk-delete", { ids }),

  toggleStatus: (id: string) =>
    api.patch<ApiResponse<UserItem>>(`/users/${id}/toggle-status`),

  toggleLogin: (id: string) =>
    api.patch<ApiResponse<UserItem>>(`/users/${id}/toggle-login`),

  resetPassword: (id: string, newPassword: string) =>
    api.patch<ApiResponse<UserItem>>(`/users/${id}/reset-password`, { new_password: newPassword }),
};

// Legacy localStorage service for backward compat
import type { User } from "@/types";
import { generateId } from "@/lib/utils";

const STORAGE_KEY = "mis_users";

function legacyGetAll(): User[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function legacyCreate(user: Omit<User, "id" | "createdAt" | "updatedAt">): User {
  const users = legacyGetAll();
  const now = new Date().toISOString();
  const newUser: User = { ...user, id: generateId(), createdAt: now, updatedAt: now };
  users.push(newUser);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
  return newUser;
}

export const UserService = {
  getAll: legacyGetAll,
  create: legacyCreate,
};
