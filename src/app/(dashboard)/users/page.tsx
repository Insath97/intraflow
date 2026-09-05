"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { userService } from "@/services";
import type { UserItem } from "@/services/user.service";
import { useToast } from "@/components/ui/toast";
import { PageHeader } from "@/components/common/page-header";
import { StatusBadge } from "@/components/common/status-badge";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { EmptyState } from "@/components/common/empty-state";
import { LoadingState } from "@/components/common/loading-state";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Pencil,
  Trash2,
  Users,
  Search,
  UserPlus,
  SlidersHorizontal,
  X,
  ChevronsLeft,
  ChevronsRight,
  ChevronLeft,
  ChevronRight,
  Eye,
  Power,
  LogIn,
  Shield,
} from "lucide-react";
import { cn } from "@/lib/utils";

const PAGE_SIZE_OPTIONS = [5, 10, 25, 50, 100];

export default function UsersPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const [stats, setStats] = useState<{ total: number; active: number; inactive: number; can_login: number; cannot_login: number } | null>(null);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingUser, setDeletingUser] = useState<UserItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [statusUser, setStatusUser] = useState<UserItem | null>(null);
  const [togglingStatus, setTogglingStatus] = useState(false);

  const [loginDialogOpen, setLoginDialogOpen] = useState(false);
  const [loginUser, setLoginUser] = useState<UserItem | null>(null);
  const [togglingLogin, setTogglingLogin] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, statusFilter, roleFilter, pageSize]);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const params: Record<string, unknown> = {
        page: currentPage,
        size: pageSize,
      };
      if (debouncedSearch) params.search = debouncedSearch;
      if (statusFilter === "active") params.is_active = true;
      if (statusFilter === "inactive") params.is_active = false;
      if (roleFilter) params.role_id = roleFilter;

      const res = await userService.getAll(params as { search?: string; role_id?: string; is_active?: boolean; page?: number; size?: number });
      if (res.data.status === "success" && res.data.data) {
        setUsers(res.data.data.items);
        setTotalCount(res.data.data.pagination.total_count);
        setTotalPages(res.data.data.pagination.total_pages);
      }
    } catch {
      toast("Failed to load users", "error");
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, debouncedSearch, statusFilter, roleFilter, toast]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  useEffect(() => {
    async function loadStats() {
      try {
        const res = await userService.stats();
        if (res.data.status === "success") setStats(res.data.data);
      } catch { /* non-critical */ }
    }
    loadStats();
  }, []);

  const activeFilters = [statusFilter, roleFilter].filter(Boolean).length;

  function clearFilters() {
    setStatusFilter("");
    setRoleFilter("");
    setSearchQuery("");
  }

  function confirmDelete(user: UserItem) {
    setDeletingUser(user);
    setDeleteDialogOpen(true);
  }

  async function handleDelete() {
    if (!deletingUser) return;
    setDeleting(true);
    try {
      const res = await userService.delete(deletingUser.id);
      if (res.data.status === "success") {
        toast(res.data.message || "User deleted successfully", "success");
        fetchUsers();
      } else {
        toast(res.data.message || "Failed to delete user", "error");
      }
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } }; message?: string };
      const message = axiosErr.response?.data?.message || axiosErr.message || "An error occurred";
      toast(message, "error");
    } finally {
      setDeleting(false);
      setDeleteDialogOpen(false);
      setDeletingUser(null);
    }
  }

  function confirmStatusToggle(user: UserItem) {
    setStatusUser(user);
    setStatusDialogOpen(true);
  }

  async function handleStatusToggle() {
    if (!statusUser) return;
    setTogglingStatus(true);
    try {
      const res = await userService.toggleStatus(statusUser.id);
      if (res.data.status === "success") {
        toast(
          `User ${statusUser.is_active ? "deactivated" : "activated"} successfully`,
          "success"
        );
        fetchUsers();
      } else {
        toast(res.data.message || "Failed to toggle status", "error");
      }
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } }; message?: string };
      const message = axiosErr.response?.data?.message || axiosErr.message || "An error occurred";
      toast(message, "error");
    } finally {
      setTogglingStatus(false);
      setStatusDialogOpen(false);
      setStatusUser(null);
    }
  }

  function confirmLoginToggle(user: UserItem) {
    setLoginUser(user);
    setLoginDialogOpen(true);
  }

  async function handleLoginToggle() {
    if (!loginUser) return;
    setTogglingLogin(true);
    try {
      const res = await userService.toggleLogin(loginUser.id);
      if (res.data.status === "success") {
        toast(
          `Login ${loginUser.can_login ? "disabled" : "enabled"} for ${loginUser.full_name}`,
          "success"
        );
        fetchUsers();
      } else {
        toast(res.data.message || "Failed to toggle login", "error");
      }
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } }; message?: string };
      const message = axiosErr.response?.data?.message || axiosErr.message || "An error occurred";
      toast(message, "error");
    } finally {
      setTogglingLogin(false);
      setLoginDialogOpen(false);
      setLoginUser(null);
    }
  }

  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalCount);

  function getPageNumbers(): (number | "...")[] {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
    const pages: (number | "...")[] = [1];
    if (currentPage > 3) pages.push("...");
    for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
      pages.push(i);
    }
    if (currentPage < totalPages - 2) pages.push("...");
    pages.push(totalPages);
    return pages;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Users"
        description="Manage system users, their roles, and access permissions"
        breadcrumbs={[{ label: "Dashboard", onClick: () => router.push("/dashboard") }, { label: "Users" }]}
        actions={
          <Button onClick={() => router.push("/users/create")}>
            <UserPlus className="mr-2 h-4 w-4" />
            Create User
          </Button>
        }
      />

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800">
                <Users className="h-5 w-5 text-gray-600 dark:text-gray-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.total}</p>
                <p className="text-xs text-gray-500">Total Users</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/30">
                <Users className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.active}</p>
                <p className="text-xs text-gray-500">Active</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-100 dark:bg-red-900/30">
                <Users className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-red-600 dark:text-red-400">{stats.inactive}</p>
                <p className="text-xs text-gray-500">Inactive</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30">
                <LogIn className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.can_login}</p>
                <p className="text-xs text-gray-500">Can Login</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-900/30">
                <Shield className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{stats.cannot_login}</p>
                <p className="text-xs text-gray-500">No Login</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Search + Filters */}
      <Card className="p-4">
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search users by name, email, username, or employee code..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9"
              />
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className={cn("relative min-w-[120px]", showFilters && "border-[#FF6B00] text-[#FF6B00]")}
              >
                <SlidersHorizontal className="mr-1.5 h-4 w-4" />
                Filters
                {activeFilters > 0 && (
                  <span className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-[#FF6B00] text-[10px] text-white">
                    {activeFilters}
                  </span>
                )}
              </Button>
              {activeFilters > 0 && (
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  <X className="mr-1 h-3 w-3" />
                  Clear
                </Button>
              )}
            </div>
          </div>

          {showFilters && (
            <div className="border-t border-gray-100 pt-4 dark:border-gray-800">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-gray-500 dark:text-gray-400">Status</label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="flex h-9 w-full appearance-none rounded-lg border border-gray-300 bg-white px-3 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                  >
                    <option value="">All Status</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-gray-500 dark:text-gray-400">Login Access</label>
                  <select
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value)}
                    className="flex h-9 w-full appearance-none rounded-lg border border-gray-300 bg-white px-3 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                  >
                    <option value="">All</option>
                    <option value="true">Can Login</option>
                    <option value="false">Cannot Login</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {activeFilters > 0 && (
            <div className="flex flex-wrap gap-2 border-t border-gray-100 pt-3 dark:border-gray-800">
              {statusFilter && (
                <span className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-white px-2.5 py-1 text-xs font-medium text-gray-700 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300">
                  Status: {statusFilter}
                  <button type="button" onClick={() => setStatusFilter("")} className="ml-0.5 rounded-full p-0.5 hover:bg-gray-200 dark:hover:bg-gray-700">
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}
              {roleFilter && (
                <span className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-white px-2.5 py-1 text-xs font-medium text-gray-700 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300">
                  Login: {roleFilter === "true" ? "Can Login" : "Cannot Login"}
                  <button type="button" onClick={() => setRoleFilter("")} className="ml-0.5 rounded-full p-0.5 hover:bg-gray-200 dark:hover:bg-gray-700">
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}
            </div>
          )}
        </div>
      </Card>

      {/* Users Table */}
      {loading ? (
        <LoadingState message="Loading users..." />
      ) : users.length === 0 ? (
        <EmptyState
          icon={<Users className="h-8 w-8" />}
          title="No users found"
          description="Create your first user to get started."
          action={{ label: "Create User", onClick: () => router.push("/users/create") }}
        />
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-800">
                  <th className="px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Name</th>
                  <th className="px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Email</th>
                  <th className="px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Username</th>
                  <th className="px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Employee Code</th>
                  <th className="px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Role</th>
                  <th className="px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Status</th>
                  <th className="px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Login</th>
                  <th className="px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-b border-gray-50 hover:bg-gray-50/50 dark:border-gray-800 dark:hover:bg-gray-800/50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#FFF3EB] text-xs font-medium text-[#FF6B00] dark:bg-[#E55A00]/20 dark:text-[#FF9A5C]">
                          {user.profile_image_path ? (
                            <img src={user.profile_image_path} alt="" className="h-8 w-8 rounded-full object-cover" />
                          ) : (
                            user.f_name.charAt(0).toUpperCase()
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-gray-100">{user.full_name}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{user.designation || "-"}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{user.email}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{user.username}</td>
                    <td className="px-4 py-3">
                      <Badge variant="secondary">{user.employee_code}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="outline">{user.role?.name || "N/A"}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={user.is_active ? "active" : "inactive"} />
                    </td>
                    <td className="px-4 py-3">
                      {user.can_login ? (
                        <span className="text-xs font-medium text-green-600 dark:text-green-400">Yes</span>
                      ) : (
                        <span className="text-xs font-medium text-red-600 dark:text-red-400">No</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => router.push(`/users/${user.id}`)} title="View">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => router.push(`/users/${user.id}/edit`)} title="Edit">
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => confirmStatusToggle(user)}
                          title={user.is_active ? "Deactivate" : "Activate"}
                        >
                          <Power className={cn("h-4 w-4", user.is_active ? "text-green-600" : "text-gray-400")} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => confirmLoginToggle(user)}
                          title={user.can_login ? "Disable Login" : "Enable Login"}
                        >
                          <LogIn className={cn("h-4 w-4", user.can_login ? "text-blue-600" : "text-gray-400")} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-red-600 hover:text-red-700 dark:text-red-400"
                          onClick={() => confirmDelete(user)}
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Pagination */}
      {totalCount > 0 && (
        <Card className="px-4 py-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Showing <span className="font-medium text-gray-700 dark:text-gray-300">{startItem}</span> to{" "}
                <span className="font-medium text-gray-700 dark:text-gray-300">{endItem}</span> of{" "}
                <span className="font-medium text-gray-700 dark:text-gray-300">{totalCount}</span> users
              </p>
              <div className="flex items-center gap-1.5">
                <label className="text-xs text-gray-500">Show</label>
                <select
                  value={pageSize}
                  onChange={(e) => setPageSize(Number(e.target.value))}
                  className="h-8 rounded-md border border-gray-300 bg-white px-2 text-xs dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                >
                  {PAGE_SIZE_OPTIONS.map((size) => (
                    <option key={size} value={size}>{size}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setCurrentPage(1)} disabled={currentPage === 1}>
                <ChevronsLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setCurrentPage(currentPage - 1)} disabled={currentPage === 1}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              {getPageNumbers().map((page, i) =>
                page === "..." ? (
                  <span key={`ellipsis-${i}`} className="px-1 text-sm text-gray-400">...</span>
                ) : (
                  <Button
                    key={page}
                    variant={currentPage === page ? "default" : "outline"}
                    size="icon"
                    className={cn("h-8 w-8", currentPage === page && "bg-[#FF6B00] text-white hover:bg-[#E55A00]")}
                    onClick={() => setCurrentPage(page)}
                  >
                    {page}
                  </Button>
                )
              )}
              <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setCurrentPage(currentPage + 1)} disabled={currentPage === totalPages}>
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages}>
                <ChevronsRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={deleteDialogOpen}
        onClose={() => { setDeleteDialogOpen(false); setDeletingUser(null); }}
        onConfirm={handleDelete}
        title="Delete User"
        description={`Are you sure you want to delete "${deletingUser?.full_name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        loading={deleting}
      />

      {/* Status Toggle Confirmation */}
      <ConfirmDialog
        open={statusDialogOpen}
        onClose={() => { setStatusDialogOpen(false); setStatusUser(null); }}
        onConfirm={handleStatusToggle}
        title={statusUser?.is_active ? "Deactivate User" : "Activate User"}
        description={
          statusUser?.is_active
            ? `Are you sure you want to deactivate "${statusUser?.full_name}"? They will no longer be able to log in.`
            : `Are you sure you want to activate "${statusUser?.full_name}"? They will be able to log in again.`
        }
        confirmLabel={statusUser?.is_active ? "Deactivate" : "Activate"}
        variant={statusUser?.is_active ? "destructive" : "default"}
        loading={togglingStatus}
      />

      {/* Login Toggle Confirmation */}
      <ConfirmDialog
        open={loginDialogOpen}
        onClose={() => { setLoginDialogOpen(false); setLoginUser(null); }}
        onConfirm={handleLoginToggle}
        title={loginUser?.can_login ? "Disable Login" : "Enable Login"}
        description={
          loginUser?.can_login
            ? `Are you sure you want to disable login for "${loginUser?.full_name}"?`
            : `Are you sure you want to enable login for "${loginUser?.full_name}"?`
        }
        confirmLabel={loginUser?.can_login ? "Disable" : "Enable"}
        variant={loginUser?.can_login ? "destructive" : "default"}
        loading={togglingLogin}
      />
    </div>
  );
}
