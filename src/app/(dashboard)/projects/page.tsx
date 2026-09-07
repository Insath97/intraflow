"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { projectService, type ProjectItem, type ProjectStatus, type ProjectType, type ProjectPriority, type ProjectStats } from "@/lib/api/projects";
import { useToast } from "@/components/ui/toast";
import { PageHeader } from "@/components/common/page-header";
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
  FolderKanban,
  Search,
  SlidersHorizontal,
  X,
  ChevronsLeft,
  ChevronsRight,
  ChevronLeft,
  ChevronRight,
  Users,
  Calendar,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";

const PAGE_SIZE_OPTIONS = [5, 10, 25, 50, 100];

const STATUS_OPTIONS: { value: ProjectStatus; label: string; color: string; bg: string }[] = [
  { value: "PLANNING", label: "Planning", color: "text-blue-700 dark:text-blue-400", bg: "bg-blue-100 dark:bg-blue-900/30" },
  { value: "ACTIVE", label: "Active", color: "text-green-700 dark:text-green-400", bg: "bg-green-100 dark:bg-green-900/30" },
  { value: "ON_HOLD", label: "On Hold", color: "text-yellow-700 dark:text-yellow-400", bg: "bg-yellow-100 dark:bg-yellow-900/30" },
  { value: "COMPLETED", label: "Completed", color: "text-purple-700 dark:text-purple-400", bg: "bg-purple-100 dark:bg-purple-900/30" },
  { value: "CANCELLED", label: "Cancelled", color: "text-red-700 dark:text-red-400", bg: "bg-red-100 dark:bg-red-900/30" },
];

const TYPE_OPTIONS: { value: ProjectType; label: string }[] = [
  { value: "CLIENT", label: "Client" },
  { value: "INTERNAL", label: "Internal" },
];

const PRIORITY_OPTIONS: { value: ProjectPriority; label: string; color: string; bg: string }[] = [
  { value: "LOW", label: "Low", color: "text-gray-700 dark:text-gray-400", bg: "bg-gray-100 dark:bg-gray-800" },
  { value: "MEDIUM", label: "Medium", color: "text-blue-700 dark:text-blue-400", bg: "bg-blue-100 dark:bg-blue-900/30" },
  { value: "HIGH", label: "High", color: "text-orange-700 dark:text-orange-400", bg: "bg-orange-100 dark:bg-orange-900/30" },
  { value: "URGENT", label: "Urgent", color: "text-red-700 dark:text-red-400", bg: "bg-red-100 dark:bg-red-900/30" },
];

export default function ProjectsPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | "">("");
  const [typeFilter, setTypeFilter] = useState<ProjectType | "">("");
  const [priorityFilter, setPriorityFilter] = useState<ProjectPriority | "">("");
  const [showFilters, setShowFilters] = useState(false);

  const [stats, setStats] = useState<ProjectStats | null>(null);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingProject, setDeletingProject] = useState<ProjectItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => { setCurrentPage(1); }, [debouncedSearch, statusFilter, typeFilter, priorityFilter, pageSize]);

  const fetchProjects = useCallback(async () => {
    try {
      setLoading(true);
      const res = await projectService.getAll({
        search: debouncedSearch || undefined,
        status: statusFilter || undefined,
        project_type: typeFilter || undefined,
        priority: priorityFilter || undefined,
        page: currentPage,
        size: pageSize,
      });
      if (res.data.status === "success") {
        const d = res.data.data;
        setProjects(d.items);
        setTotalCount(d.total_count);
        setTotalPages(d.total_pages);
      }
    } catch {
      toast("Failed to load projects", "error");
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, statusFilter, typeFilter, priorityFilter, currentPage, pageSize, toast]);

  useEffect(() => { fetchProjects(); }, [fetchProjects]);

  const fetchStats = useCallback(async () => {
    try {
      const res = await projectService.stats();
      if (res.data.status === "success") setStats(res.data.data);
    } catch { /* non-critical */ }
  }, []);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  function confirmDelete(project: ProjectItem) {
    setDeletingProject(project);
    setDeleteDialogOpen(true);
  }

  async function handleDelete() {
    if (!deletingProject) return;
    setDeleting(true);
    try {
      const res = await projectService.delete(deletingProject.id);
      if (res.data.status === "success") {
        toast(res.data.message || "Project deleted successfully", "success");
        fetchProjects();
        fetchStats();
      } else {
        toast(res.data.message || "Failed to delete project", "error");
      }
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } }; message?: string };
      const message = axiosErr.response?.data?.message || axiosErr.message || "An error occurred";
      toast(message, "error");
    } finally {
      setDeleting(false);
      setDeleteDialogOpen(false);
      setDeletingProject(null);
    }
  }

  async function handleToggleStatus(project: ProjectItem) {
    try {
      const res = await projectService.toggleStatus(project.id);
      if (res.data.status === "success") {
        toast(`Status changed to ${res.data.data.status}`, "success");
        fetchProjects();
        fetchStats();
      } else {
        toast(res.data.message || "Failed to toggle status", "error");
      }
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } }; message?: string };
      const message = axiosErr.response?.data?.message || axiosErr.message || "An error occurred";
      toast(message, "error");
    }
  }

  function getStatusInfo(status: ProjectStatus) {
    return STATUS_OPTIONS.find((s) => s.value === status) || STATUS_OPTIONS[0];
  }

  function getPriorityInfo(priority: ProjectPriority) {
    return PRIORITY_OPTIONS.find((p) => p.value === priority) || PRIORITY_OPTIONS[1];
  }

  const activeFilters = [statusFilter, typeFilter, priorityFilter].filter(Boolean).length;
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

  function clearFilters() {
    setStatusFilter("");
    setTypeFilter("");
    setPriorityFilter("");
    setSearchQuery("");
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Projects"
        description="Manage all projects and their members"
        breadcrumbs={[{ label: "Dashboard", onClick: () => router.push("/dashboard") }, { label: "Projects" }]}
        actions={
          <Button onClick={() => router.push("/projects/create")}>
            <Plus className="mr-2 h-4 w-4" />
            Add Project
          </Button>
        }
      />

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800">
                <FolderKanban className="h-5 w-5 text-gray-600 dark:text-gray-400" />
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
                <RefreshCw className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.by_status?.ACTIVE ?? 0}</p>
                <p className="text-xs text-gray-500">Active</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-yellow-100 dark:bg-yellow-900/30">
                <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{stats.by_status?.ON_HOLD ?? 0}</p>
                <p className="text-xs text-gray-500">On Hold</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-900/30">
                <Calendar className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{stats.by_status?.COMPLETED ?? 0}</p>
                <p className="text-xs text-gray-500">Completed</p>
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
                placeholder="Search projects by name, code or description..."
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
              <div className="flex flex-wrap gap-4">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-gray-500 dark:text-gray-400">Status</label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as ProjectStatus | "")}
                    className="flex h-9 w-full max-w-[200px] appearance-none rounded-lg border border-gray-300 bg-white px-3 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                  >
                    <option value="">All Status</option>
                    {STATUS_OPTIONS.map((s) => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-gray-500 dark:text-gray-400">Type</label>
                  <select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value as ProjectType | "")}
                    className="flex h-9 w-full max-w-[200px] appearance-none rounded-lg border border-gray-300 bg-white px-3 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                  >
                    <option value="">All Types</option>
                    {TYPE_OPTIONS.map((t) => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-gray-500 dark:text-gray-400">Priority</label>
                  <select
                    value={priorityFilter}
                    onChange={(e) => setPriorityFilter(e.target.value as ProjectPriority | "")}
                    className="flex h-9 w-full max-w-[200px] appearance-none rounded-lg border border-gray-300 bg-white px-3 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                  >
                    <option value="">All Priorities</option>
                    {PRIORITY_OPTIONS.map((p) => (
                      <option key={p.value} value={p.value}>{p.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          {activeFilters > 0 && (
            <div className="flex flex-wrap gap-2 border-t border-gray-100 pt-3 dark:border-gray-800">
              {statusFilter && (
                <span className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-white px-2.5 py-1 text-xs font-medium text-gray-700 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300">
                  Status: {getStatusInfo(statusFilter).label}
                  <button type="button" onClick={() => setStatusFilter("")} className="ml-0.5 rounded-full p-0.5 hover:bg-gray-200 dark:hover:bg-gray-700">
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}
              {typeFilter && (
                <span className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-white px-2.5 py-1 text-xs font-medium text-gray-700 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300">
                  Type: {typeFilter}
                  <button type="button" onClick={() => setTypeFilter("")} className="ml-0.5 rounded-full p-0.5 hover:bg-gray-200 dark:hover:bg-gray-700">
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}
              {priorityFilter && (
                <span className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-white px-2.5 py-1 text-xs font-medium text-gray-700 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300">
                  Priority: {getPriorityInfo(priorityFilter).label}
                  <button type="button" onClick={() => setPriorityFilter("")} className="ml-0.5 rounded-full p-0.5 hover:bg-gray-200 dark:hover:bg-gray-700">
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
        <LoadingState message="Loading projects..." />
      ) : projects.length === 0 ? (
        <EmptyState
          icon={<FolderKanban className="h-8 w-8" />}
          title="No projects found"
          description={searchQuery || activeFilters > 0 ? "Try adjusting your search or filters" : "Create your first project to get started."}
          action={{ label: "Add Project", onClick: () => router.push("/projects/create") }}
        />
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-800">
                  <th className="px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Project</th>
                  <th className="px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Type</th>
                  <th className="px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Lead</th>
                  <th className="px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Priority</th>
                  <th className="px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Status</th>
                  <th className="px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Members</th>
                  <th className="px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Dates</th>
                  <th className="px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Actions</th>
                </tr>
              </thead>
              <tbody>
                {projects.map((project) => {
                  const statusInfo = getStatusInfo(project.status);
                  const priorityInfo = getPriorityInfo(project.priority);
                  return (
                    <tr key={project.id} className="border-b border-gray-50 hover:bg-gray-50/50 dark:border-gray-800 dark:hover:bg-gray-800/50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#FFF3EB] text-[#FF6B00] dark:bg-[#E55A00]/20 dark:text-[#FF9A5C]">
                            <FolderKanban className="h-4.5 w-4.5" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 dark:text-gray-100">{project.name}</p>
                            <p className="text-xs text-gray-500 font-mono">{project.code}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="outline" className="text-xs">{project.project_type}</Badge>
                      </td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                        {project.project_lead?.full_name || "—"}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${priorityInfo.bg} ${priorityInfo.color}`}>
                          {priorityInfo.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => handleToggleStatus(project)}
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium transition-colors hover:opacity-80 ${statusInfo.bg} ${statusInfo.color}`}
                          title="Click to toggle status"
                        >
                          {statusInfo.label}
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <Users className="h-3.5 w-3.5 text-gray-400" />
                          <span className="text-gray-600 dark:text-gray-300">{project.member_count}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500 dark:text-gray-400">
                        <p>{new Date(project.start_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</p>
                        {project.end_date && (
                          <p>→ {new Date(project.end_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</p>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => router.push(`/projects/${project.id}/edit`)} title="Edit">
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-red-600 hover:text-red-700 dark:text-red-400"
                            onClick={() => confirmDelete(project)}
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
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
                <span className="font-medium text-gray-700 dark:text-gray-300">{totalCount}</span> projects
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
        onClose={() => { setDeleteDialogOpen(false); setDeletingProject(null); }}
        onConfirm={handleDelete}
        title="Delete Project"
        description={`Are you sure you want to delete "${deletingProject?.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        loading={deleting}
      />
    </div>
  );
}
