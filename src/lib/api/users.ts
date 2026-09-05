import api from "./axios-client";

export interface ApiResponse<T = unknown> {
  status: string;
  message: string;
  data: T;
}

export interface PaginatedResponse<T> {
  items: T[];
  total_count: number;
  page: number;
  size: number;
  total_pages: number;
  has_next: boolean;
  has_prev: boolean;
}

export interface UserItem {
  id: string;
  f_name: string;
  l_name: string;
  full_name: string;
  username: string;
  email: string;
  employee_code: string;
  profile_image_path?: string;
  role?: {
    id: string;
    name: string;
    description?: string;
  };
  department?: {
    id: string;
    name: string;
  };
  designation?: string;
  is_active: boolean;
  can_login: boolean;
  last_login_at?: string;
  last_login_ip?: string;
  created_at: string;
  updated_at: string;
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

export const usersApi = {
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
    const queryString = q.toString();
    return api.get<ApiResponse<PaginatedResponse<UserItem>>>(
      `/users${queryString ? `?${queryString}` : ""}`
    );
  },

  getById: (id: string) =>
    api.get<ApiResponse<UserItem>>(`/users/${id}`),

  simple: () =>
    api.get<ApiResponse<UserItem[]>>("/users/simple"),

  create: (data: FormData) =>
    api.post<ApiResponse<UserItem>>("/users", data, {
      headers: { "Content-Type": "multipart/form-data" },
    }),

  update: (id: string, data: FormData) => {
    data.append("_method", "PUT");
    return api.post<ApiResponse<UserItem>>(`/users/${id}`, data, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  delete: (id: string) =>
    api.delete<ApiResponse<null>>(`/users/${id}`),

  toggleStatus: (id: string) =>
    api.patch<ApiResponse<UserItem>>(`/users/${id}/toggle-status`),

  toggleCanLogin: (id: string) =>
    api.patch<ApiResponse<UserItem>>(`/users/${id}/toggle-can-login`),
};
