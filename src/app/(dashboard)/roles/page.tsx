"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { roleService } from "@/services";
import type { RoleItem } from "@/services/role.service";
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
  Shield,
  Search,
  Key,
  Lock,
  SlidersHorizontal,
  X,
  ChevronsLeft,
  ChevronsRight,
  ChevronLeft,
  ChevronRight,
  Eye,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";

const PAGE_SIZE_OPTIONS = [5, 10, 25, 50, 100];

export default function RolesPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [roles, setRoles] = useState<RoleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const [stats, setStats] = useState<{ total: number; active: number; inactive: number; protected: number } | null>(null);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingRole, setDeletingRole] = useState<RoleItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, statusFilter, pageSize]);

  const fetchRoles = useCallback(async () => {
    try {
      setLoading(true);
      const params: Record<string, unknown> = {
        page: currentPage,
        size: pageSize,
      };
      if (debouncedSearch) params.search = debouncedSearch;
      if (statusFilter === "active") params.is_active = true;
      if (statusFilter === "inactive") params.is_active = false;

      const res = await roleService.getAll(params as { search?: string; is_active?: boolean; page?: number; size?: number });
      if (res.data.status === "success" && res.data.data) {
        setRoles(res.data.data.items);
        setTotalCount(res.data.data.pagination.total_count);
        setTotalPages(res.data.data.pagination.total_pages);
      }
    } catch {
      toast("Failed to load roles", "error");
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, debouncedSearch, statusFilter, toast]);

  useEffect(() => {
    fetchRoles();
  }, [fetchRoles]);

  const fetchStats = useCallback(async () => {
    try {
      const res = await roleService.stats();
      if (res.data.status === "success") setStats(res.data.data);
    } catch { /* non-critical */ }
  }, []);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  function confirmDelete(role: RoleItem) {
    setDeletingRole(role);
    setDeleteDialogOpen(true);
  }

  async function handleDelete() {
    if (!deletingRole) return;
    if (deletingRole.is_protected) {
      toast("Cannot delete a protected role", "error");
      setDeleteDialogOpen(false);
      setDeletingRole(null);
      return;
    }
    setDeleting(true);
    try {
      const res = await roleService.delete(deletingRole.id);
      if (res.data.status === "success") {
        toast(res.data.message || "Role deleted successfully", "success");
        fetchRoles();
        fetchStats();
      } else {
        toast(res.data.message || "Failed to delete role", "error");
      }
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } }; message?: string };
      const message = axiosErr.response?.data?.message || axiosErr.message || "An error occurred";
      toast(message, "error");
    } finally {
      setDeleting(false);
      setDeleteDialogOpen(false);
      setDeletingRole(null);
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
        title="Roles"
        description="Define roles and manage permission assignments for system access control"
        breadcrumbs={[{ label: "Dashboard", onClick: () => router.push("/dashboard") }, { label: "Roles" }]}
        actions={
          <Button onClick={() => router.push("/roles/create")}>
            <Plus className="mr-2 h-4 w-4" />
            Create Role
          </Button>
        }
      />

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800">
                <Shield className="h-5 w-5 text-gray-600 dark:text-gray-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.total}</p>
                <p className="text-xs text-gray-500">Total Roles</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/30">
                <Shield className="h-5 w-5 text-green-600 dark:text-green-400" />
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
                <Shield className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-red-600 dark:text-red-400">{stats.inactive}</p>
                <p className="text-xs text-gray-500">Inactive</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-900/30">
                <Lock className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{stats.protected}</p>
                <p className="text-xs text-gray-500">Protected</p>
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
                placeholder="Search roles by name or description..."
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
                {statusFilter && (
                  <span className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-[#FF6B00] text-[10px] text-white">
                    1
                  </span>
                )}
              </Button>
              {statusFilter && (
                <Button variant="ghost" size="sm" onClick={() => setStatusFilter("")}>
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
              </div>
            </div>
          )}

          {statusFilter && (
            <div className="flex flex-wrap gap-2 border-t border-gray-100 pt-3 dark:border-gray-800">
              <span className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-white px-2.5 py-1 text-xs font-medium text-gray-700 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300">
                Status: {statusFilter}
                <button type="button" onClick={() => setStatusFilter("")} className="ml-0.5 rounded-full p-0.5 hover:bg-gray-200 dark:hover:bg-gray-700">
                  <X className="h-3 w-3" />
                </button>
              </span>
            </div>
          )}
        </div>
      </Card>

      {/* Roles Grid */}
      {loading ? (
        <LoadingState message="Loading roles..." />
      ) : roles.length === 0 ? (
        <EmptyState
          icon={<Shield className="h-8 w-8" />}
          title="No roles found"
          description="Create your first role to define access permissions."
          action={{ label: "Create Role", onClick: () => router.push("/roles/create") }}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {roles.map((role) => (
            <Card key={role.id} className="group relative overflow-hidden">
              <div className="p-6">
                <div className="mb-4 flex items-start justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#FFF3EB] text-[#FF6B00] dark:bg-[#E55A00]/20 dark:text-[#FF9A5C]">
                    <Shield className="h-5 w-5" />
                  </div>
                  <div className="flex items-center gap-2">
                    {role.is_protected && (
                      <Badge variant="secondary" className="bg-yellow-100 text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-400">
                        <Lock className="mr-1 h-3 w-3" />
                        Protected
                      </Badge>
                    )}
                    <StatusBadge status={role.is_active ? "active" : "inactive"} />
                  </div>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{role.name}</h3>
                <p className="mt-1 line-clamp-2 text-sm text-gray-500 dark:text-gray-400">
                  {role.description || "No description"}
                </p>
                <div className="mt-4 flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                  <div className="flex items-center gap-1">
                    <Key className="h-4 w-4" />
                    <span>{role.permissions.length} permission(s)</span>
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-2 border-t border-gray-100 pt-4 dark:border-gray-800">
                  <Button variant="ghost" size="sm" onClick={() => router.push(`/roles/${role.id}`)} className="flex-1">
                    <Eye className="mr-1.5 h-3.5 w-3.5" />
                    View
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => router.push(`/roles/${role.id}/edit`)} className="flex-1">
                    <Pencil className="mr-1.5 h-3.5 w-3.5" />
                    Edit
                  </Button>
                  {!role.is_protected && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => confirmDelete(role)}
                      className="text-red-600 hover:text-red-700 dark:text-red-400"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalCount > 0 && (
        <Card className="px-4 py-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Showing <span className="font-medium text-gray-700 dark:text-gray-300">{startItem}</span> to{" "}
                <span className="font-medium text-gray-700 dark:text-gray-300">{endItem}</span> of{" "}
                <span className="font-medium text-gray-700 dark:text-gray-300">{totalCount}</span> roles
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
        onClose={() => { setDeleteDialogOpen(false); setDeletingRole(null); }}
        onConfirm={handleDelete}
        title="Delete Role"
        description={
          deletingRole?.is_protected
            ? `Cannot delete "${deletingRole?.name}" — it is a protected role.`
            : `Are you sure you want to delete "${deletingRole?.name}"? This action cannot be undone.`
        }
        confirmLabel="Delete"
        loading={deleting}
      />
    </div>
  );
}
