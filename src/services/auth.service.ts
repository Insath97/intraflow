import api from "@/lib/api";

export interface LoginPayload {
  login: string;
  password: string;
}

export interface User {
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
    permissions?: Array<{
      id: string;
      group_name: string;
      permission_name: string;
      display_name: string;
    }>;
  };
}

export interface LoginResponse {
  user: User;
  access_token: string;
  token_type: string;
}

export interface ApiResponse<T = unknown> {
  status: string;
  message: string;
  data: T;
}

export const authService = {
  login: (data: LoginPayload) =>
    api.post<ApiResponse<LoginResponse>>("/auth/login", data),

  logout: () => api.post<ApiResponse<null>>("/auth/logout"),

  me: () => api.get<ApiResponse<User>>("/auth/me"),

  refresh: () =>
    api.post<ApiResponse<{ access_token: string }>>("/auth/refresh"),
};
