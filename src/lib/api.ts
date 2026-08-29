import axios from "axios";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1",
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
  withCredentials: true,
});

let accessToken: string | null = null;

export const setAccessToken = (token: string | null) => {
  accessToken = token;
};

export const getAccessToken = () => accessToken;

api.interceptors.request.use(
  (config) => {
    const token = accessToken;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      accessToken = null;
      if (typeof window !== "undefined" && window.location.pathname !== "/login") {
        window.location.href = "/login";
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
    api.post<ApiResponse<LoginResponse>>("/auth/login", data),

  logout: () => api.post<ApiResponse<null>>("/auth/logout"),

  me: () => api.get<ApiResponse<LoginResponse["user"]>>("/auth/me"),

  refresh: () =>
    api.post<ApiResponse<{ access_token: string }>>("/auth/refresh"),
};
