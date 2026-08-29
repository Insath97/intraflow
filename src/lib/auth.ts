"use client";

import { create } from "zustand";
import type { User, Role, Permission } from "@/types";
import { authApi, setAccessToken, getAccessToken, type LoginResponse } from "./api";

interface AuthState {
  user: User | null;
  role: Role | null;
  permissions: string[];
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (login: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  fetchUser: () => Promise<void>;
  clearError: () => void;
  hasPermission: (permission: string) => boolean;
  hasAnyPermission: (permissions: string[]) => boolean;
}

function mapApiUserToUser(apiUser: LoginResponse["user"]): User {
  return {
    id: apiUser.id,
    name: apiUser.full_name,
    email: apiUser.email,
    employeeId: apiUser.employee_code,
    phone: "",
    avatar: apiUser.profile_image_path || "",
    roleId: apiUser.role?.id || "",
    status: "active",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

function buildRole(apiUser: LoginResponse["user"]): Role {
  return apiUser.role
    ? {
        id: apiUser.role.id,
        name: apiUser.role.name,
        permissionIds: apiUser.role.permissions || [],
        description: "",
        status: "active",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
    : {
        id: "",
        name: "",
        permissionIds: [],
        description: "",
        status: "active",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  role: null,
  permissions: [],
  isAuthenticated: false,
  isLoading: false,
  error: null,

  login: async (login: string, password: string) => {
    set({ isLoading: true, error: null });

    try {
      const response = await authApi.login({ login, password });
      const result = response.data;

      if (result.status !== "success") {
        set({ isLoading: false, error: result.message });
        return false;
      }

      const { user: apiUser, access_token } = result.data;

      setAccessToken(access_token);

      const user = mapApiUserToUser(apiUser);
      const role = buildRole(apiUser);

      set({
        user,
        role,
        permissions: apiUser.role?.permissions || [],
        isAuthenticated: true,
        isLoading: false,
      });

      return true;
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Login failed. Please try again.";
      set({ isLoading: false, error: message });
      return false;
    }
  },

  logout: async () => {
    try {
      await authApi.logout();
    } catch {
      // Continue with local logout even if API fails
    } finally {
      setAccessToken(null);
      set({
        user: null,
        role: null,
        permissions: [],
        isAuthenticated: false,
      });
    }
  },

  fetchUser: async () => {
    try {
      const response = await authApi.me();
      const result = response.data;

      if (result.status === "success" && result.data) {
        const apiUser = result.data;
        const user = mapApiUserToUser(apiUser);
        const role = buildRole(apiUser);

        set({
          user,
          role,
          permissions: apiUser.role?.permissions || [],
          isAuthenticated: true,
        });
      }
    } catch {
      setAccessToken(null);
      set({
        user: null,
        role: null,
        permissions: [],
        isAuthenticated: false,
      });
    }
  },

  clearError: () => set({ error: null }),

  hasPermission: (permission: string) => {
    const { permissions } = get();
    return permissions.includes(permission);
  },

  hasAnyPermission: (perms: string[]) => {
    const { permissions } = get();
    return perms.some((p) => permissions.includes(p));
  },
}));
