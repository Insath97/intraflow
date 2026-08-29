"use client";

import { create } from "zustand";
import type { User, Role, Permission } from "@/types";
import { PERMISSION_GROUPS } from "./constants";

interface AuthState {
  user: User | null;
  role: Role | null;
  permissions: string[];
  isAuthenticated: boolean;
  login: (email: string, password: string) => boolean;
  logout: () => void;
  hasPermission: (permission: string) => boolean;
  hasAnyPermission: (permissions: string[]) => boolean;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  role: null,
  permissions: [],
  isAuthenticated: false,

  login: (email: string, _password: string) => {
    try {
      const usersData = localStorage.getItem("mis_users");
      const rolesData = localStorage.getItem("mis_roles");

      if (!usersData || !rolesData) return false;

      const users: User[] = JSON.parse(usersData);
      const roles: Role[] = JSON.parse(rolesData);

      const user = users.find(
        (u) => u.email === email && u.status === "active"
      );
      if (!user) return false;

      // For prototype: accept any password for demo users, but validate format
      if (_password.length < 6) return false;

      const role = roles.find((r) => r.id === user.roleId);
      const permissions = role ? role.permissionIds : [];

      // Update last login
      user.lastLogin = new Date().toISOString();
      const updatedUsers = users.map((u) =>
        u.id === user.id ? user : u
      );
      localStorage.setItem("mis_users", JSON.stringify(updatedUsers));

      localStorage.setItem(
        "mis_auth",
        JSON.stringify({ userId: user.id })
      );

      set({
        user,
        role: role || null,
        permissions,
        isAuthenticated: true,
      });

      return true;
    } catch {
      return false;
    }
  },

  logout: () => {
    localStorage.removeItem("mis_auth");
    set({
      user: null,
      role: null,
      permissions: [],
      isAuthenticated: false,
    });
  },

  hasPermission: (permission: string) => {
    const { permissions } = get();
    return permissions.includes(permission);
  },

  hasAnyPermission: (perms: string[]) => {
    const { permissions } = get();
    return perms.some((p) => permissions.includes(p));
  },
}));

export function initializeAuth() {
  if (typeof window === "undefined") return;

  try {
    const authData = localStorage.getItem("mis_auth");
    if (!authData) return;

    const { userId } = JSON.parse(authData);
    const usersData = localStorage.getItem("mis_users");
    const rolesData = localStorage.getItem("mis_roles");

    if (!usersData || !rolesData) return;

    const users: User[] = JSON.parse(usersData);
    const roles: Role[] = JSON.parse(rolesData);

    const user = users.find((u) => u.id === userId && u.status === "active");
    if (!user) {
      localStorage.removeItem("mis_auth");
      return;
    }

    const role = roles.find((r) => r.id === user.roleId);
    const permissions = role ? role.permissionIds : [];

    useAuthStore.setState({
      user,
      role: role || null,
      permissions,
      isAuthenticated: true,
    });
  } catch {
    localStorage.removeItem("mis_auth");
  }
}
