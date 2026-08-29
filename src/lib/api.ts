import axios from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        await api.post("/api/v1/auth/refresh");
        return api(originalRequest);
      } catch {
        window.location.href = "/login";
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  }
);

export default api;

export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data: T;
}

export interface LoginPayload {
  login: string;
  password: string;
}

export interface LoginResponse {
  user: {
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
      permissions?: string[];
    };
  };
  access_token: string;
  token_type: string;
}

export const authApi = {
  login: (data: LoginPayload) =>
    api.post<ApiResponse<LoginResponse>>("/api/v1/auth/login", data),

  logout: () => api.post<ApiResponse<null>>("/api/v1/auth/logout"),

  me: () => api.get<ApiResponse<LoginResponse["user"]>>("/api/v1/auth/me"),

  refresh: () => api.post<ApiResponse<{ access_token: string }>>("/api/v1/auth/refresh"),
};
