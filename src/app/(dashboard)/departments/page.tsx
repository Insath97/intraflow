"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { departmentService } from "@/lib/api/departments";
import type { DepartmentItem } from "@/lib/api/departments";
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
import { Dialog } from "@/components/ui/dialog";
import {
  Plus,
  Pencil,
  Trash2,
  Building,
  Search,
  SlidersHorizontal,
  X,
  ChevronsLeft,
  ChevronsRight,
  ChevronLeft,
  ChevronRight,
  Loader2,
  ToggleLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";

const PAGE_SIZE_OPTIONS = [5, 10, 25, 50, 100];

interface DeptFormData {
  name: string;
  description: string;
  is_active: boolean;
}

const emptyForm: DeptFormData = { name: "", description: "", is_active: true };

export default function DepartmentsPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [departments, setDepartments] = useState<DepartmentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const [stats, setStats] = useState<{ total: number; active: number; inactive: number } | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingDept, setEditingDept] = useState<DepartmentItem | null>(null);
  const [form, setForm] = useState<DeptFormData>(emptyForm);
  const [errors, setErrors] = useState<Partial<Record<keyof DeptFormData, string>>>({});
  const [saving, setSaving] = useState(false);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingDept, setDeletingDept] = useState<DepartmentItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => { setCurrentPage(1); }, [debouncedSearch, statusFilter, pageSize]);

  const fetchDepartments = useCallback(async () => {
    try {
      setLoading(true);
      const params: Record<string, unknown> = { page: currentPage, size: pageSize };
      if (debouncedSearch) params.search = debouncedSearch;
      if (statusFilter === "active") params.is_active = true;
      if (statusFilter === "inactive") params.is_active = false;

      const res = await departmentService.getAll(params as { search?: string; is_active?: boolean; page?: number; size?: number });
      if (res.data.status === "success" && res.data.data) {
        setDepartments(res.data.data.items);
        setTotalCount(res.data.data.total_count);
        setTotalPages(res.data.data.total_pages);
      }
    } catch {
      toast("Failed to load departments", "error");
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, debouncedSearch, statusFilter, toast]);

  useEffect(() => { fetchDepartments(); }, [fetchDepartments]);

  const fetchStats = useCallback(async () => {
    try {
      const res = await departmentService.stats();
      if (res.data.status === "success") setStats(res.data.data);
    } catch { /* non-critical */ }
  }, []);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  function openCreate() {
    setEditingDept(null);
    setForm(emptyForm);
    setErrors({});
    setModalOpen(true);
  }

  function openEdit(dept: DepartmentItem) {
    setEditingDept(dept);
    setForm({ name: dept.name, description: dept.description || "", is_active: dept.is_active });
    setErrors({});
    setModalOpen(true);
  }

  function validate(): boolean {
    const errs: Partial<Record<keyof DeptFormData, string>> = {};
    if (!form.name.trim()) errs.name = "Name is required";
    if (form.name.trim().length < 2) errs.name = "Name must be at least 2 characters";
    if (form.name.trim().length > 100) errs.name = "Name must be less than 100 characters";
    if (form.description.length > 500) errs.description = "Description must be less than 500 characters";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSave() {
    if (!validate()) return;
    setSaving(true);
    try {
      if (editingDept) {
        const res = await departmentService.update(editingDept.id, {
          name: form.name.trim(),
          description: form.description.trim() || undefined,
          is_active: form.is_active,
        });
        if (res.data.status === "success") {
          toast(res.data.message || "Department updated successfully", "success");
          fetchDepartments();
          fetchStats();
          setModalOpen(false);
        } else {
          toast(res.data.message || "Failed to update department", "error");
        }
      } else {
        const res = await departmentService.create({
          name: form.name.trim(),
          description: form.description.trim() || undefined,
          is_active: form.is_active,
        });
        if (res.data.status === "success") {
          toast(res.data.message || "Department created successfully", "success");
          fetchDepartments();
          fetchStats();
          setModalOpen(false);
        } else {
          toast(res.data.message || "Failed to create department", "error");
        }
      }
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } }; message?: string };
      const message = axiosErr.response?.data?.message || axiosErr.message || "An error occurred";
      toast(message, "error");
    } finally {
      setSaving(false);
    }
  }

  function confirmDelete(dept: DepartmentItem) {
    setDeletingDept(dept);
    setDeleteDialogOpen(true);
  }

  async function handleDelete() {
    if (!deletingDept) return;
    setDeleting(true);
    try {
      const res = await departmentService.delete(deletingDept.id);
      if (res.data.status === "success") {
        toast(res.data.message || "Department deleted successfully", "success");
        fetchDepartments();
        fetchStats();
      } else {
        toast(res.data.message || "Failed to delete department", "error");
      }
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } }; message?: string };
      const message = axiosErr.response?.data?.message || axiosErr.message || "An error occurred";
      toast(message, "error");
    } finally {
      setDeleting(false);
      setDeleteDialogOpen(false);
      setDeletingDept(null);
    }
  }

  const activeFilters = statusFilter ? 1 : 0;
  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalCount);

  function getPageNumbers(): (number | "...")[] {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
    const pages: (number | "...")[] = [1];
    if (currentPage > 3) pages.push("...");
    for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) pages.push(i);
    if (currentPage < totalPages - 2) pages.push("...");
    pages.push(totalPages);
    return pages;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Departments"
        description="Manage organizational departments"
        breadcrumbs={[{ label: "Dashboard", onClick: () => router.push("/dashboard") }, { label: "Departments" }]}
        actions={
          <Button onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Add Department
          </Button>
        }
      />

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800">
                <Building className="h-5 w-5 text-gray-600 dark:text-gray-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.total}</p>
                <p className="text-xs text-gray-500">Total</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/30">
                <Building className="h-5 w-5 text-green-600 dark:text-green-400" />
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
                <Building className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-red-600 dark:text-red-400">{stats.inactive}</p>
                <p className="text-xs text-gray-500">Inactive</p>
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
                placeholder="Search departments by name or description..."
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
                <Button variant="ghost" size="sm" onClick={() => setStatusFilter("")}>
                  <X className="mr-1 h-3 w-3" />
                  Clear
                </Button>
              )}
            </div>
          </div>

          {showFilters && (
            <div className="border-t border-gray-100 pt-4 dark:border-gray-800">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-500 dark:text-gray-400">Status</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="flex h-9 w-full max-w-[200px] appearance-none rounded-lg border border-gray-300 bg-white px-3 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                >
                  <option value="">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
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
            </div>
          )}
        </div>
      </Card>

      {/* Table */}
      {loading ? (
        <LoadingState message="Loading departments..." />
      ) : departments.length === 0 ? (
        <EmptyState
          icon={<Building className="h-8 w-8" />}
          title="No departments found"
          description="Create your first department to get started."
          action={{ label: "Add Department", onClick: openCreate }}
        />
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-800">
                  <th className="px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Name</th>
                  <th className="px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Description</th>
                  <th className="px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Status</th>
                  <th className="px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Created</th>
                  <th className="px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Actions</th>
                </tr>
              </thead>
              <tbody>
                {departments.map((dept) => (
                  <tr key={dept.id} className="border-b border-gray-50 hover:bg-gray-50/50 dark:border-gray-800 dark:hover:bg-gray-800/50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#FFF3EB] text-[#FF6B00] dark:bg-[#E55A00]/20 dark:text-[#FF9A5C]">
                          <Building className="h-4.5 w-4.5" />
                        </div>
                        <span className="font-medium text-gray-900 dark:text-gray-100">{dept.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300 max-w-[300px] truncate">
                      {dept.description || <span className="text-gray-400">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={dept.is_active ? "active" : "inactive"} />
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500 dark:text-gray-400">
                      {new Date(dept.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(dept)} title="Edit">
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-red-600 hover:text-red-700 dark:text-red-400"
                          onClick={() => confirmDelete(dept)}
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
                <span className="font-medium text-gray-700 dark:text-gray-300">{totalCount}</span> departments
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

      {/* Create/Edit Modal */}
      <Dialog
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingDept ? "Edit Department" : "Create Department"}
        className="max-w-md"
        footer={
          <>
            <Button variant="outline" onClick={() => setModalOpen(false)} disabled={saving}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {saving ? "Saving..." : editingDept ? "Update" : "Create"}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Name <span className="text-red-500">*</span>
            </label>
            <Input
              placeholder="Enter department name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              error={!!errors.name}
            />
            {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name}</p>}
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Description
            </label>
            <textarea
              placeholder="Brief description of this department"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={3}
              className="flex w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm transition-colors placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6B00] focus-visible:ring-offset-1 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:placeholder:text-gray-400"
            />
            {errors.description && <p className="mt-1 text-xs text-red-500">{errors.description}</p>}
            <p className="mt-1 text-xs text-gray-400">{form.description.length}/500</p>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Status</label>
            <button
              type="button"
              onClick={() => setForm({ ...form, is_active: !form.is_active })}
              className="flex items-center gap-2.5"
            >
              <div className={`relative h-5 w-9 rounded-full transition-colors ${form.is_active ? "bg-[#FF6B00]" : "bg-gray-300 dark:bg-gray-600"}`}>
                <div className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${form.is_active ? "translate-x-4" : "translate-x-0.5"}`} />
              </div>
              <span className="text-sm text-gray-700 dark:text-gray-300">
                {form.is_active ? "Active" : "Inactive"}
              </span>
            </button>
          </div>
        </div>
      </Dialog>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={deleteDialogOpen}
        onClose={() => { setDeleteDialogOpen(false); setDeletingDept(null); }}
        onConfirm={handleDelete}
        title="Delete Department"
        description={`Are you sure you want to delete "${deletingDept?.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        loading={deleting}
      />
    </div>
  );
}
