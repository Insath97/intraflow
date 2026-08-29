import axios from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

let accessToken: string | null = null;
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

function processQueue(error: unknown) {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(undefined);
    }
  });
  failedQueue = [];
}

export function setAccessToken(token: string | null) {
  accessToken = token;
}

export function getAccessToken() {
  return accessToken;
}

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (typeof window !== "undefined" && window.location.pathname === "/login") {
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(() => api(originalRequest));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshResponse = await api.post("/api/v1/auth/refresh");

        const newToken = refreshResponse.data?.data?.access_token;
        if (newToken) {
          accessToken = newToken;
          processQueue(null);
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return api(originalRequest);
        }

        processQueue(error);
        accessToken = null;
        if (typeof window !== "undefined") {
          window.location.href = "/login";
        }
        return Promise.reject(error);
      } catch {
        processQueue(error);
        accessToken = null;
        if (typeof window !== "undefined" && window.location.pathname !== "/login") {
          window.location.href = "/login";
        }
        return Promise.reject(error);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;

export interface ApiResponse<T = unknown> {
  status: string;
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

  refresh: () =>
    api.post<ApiResponse<{ access_token: string }>>("/api/v1/auth/refresh"),
};
