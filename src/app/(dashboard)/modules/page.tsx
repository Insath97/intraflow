"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";
import { moduleService, type ModuleItem } from "@/lib/api/modules";
import { projectService, type ProjectStatus } from "@/lib/api/projects";
import { useToast } from "@/components/ui/toast";
import { PageHeader } from "@/components/common/page-header";
import { EmptyState } from "@/components/common/empty-state";
import { LoadingState } from "@/components/common/loading-state";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Search,
  Package,
  Trash2,
  Pencil,
  FolderOpen,
  AlertCircle,
  ChevronDown,
  X,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";

function useIsDark() {
  const [isDark, setIsDark] = useState(false);
  useEffect(() => {
    const html = document.documentElement;
    setIsDark(html.classList.contains("dark"));
    const observer = new MutationObserver(() => {
      setIsDark(html.classList.contains("dark"));
    });
    observer.observe(html, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);
  return isDark;
}

interface ProjectDropdown {
  id: string;
  name: string;
  code: string;
  status: ProjectStatus;
}

interface ProjectFilterComboboxProps {
  value: string;
  onValueChange: (id: string) => void;
  projects: ProjectDropdown[];
  loading: boolean;
  placeholder?: string;
}

function ProjectFilterCombobox({
  value,
  onValueChange,
  projects,
  loading,
  placeholder = "Select a project",
}: ProjectFilterComboboxProps) {
  const isDark = useIsDark();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0, width: 0 });

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selected = useMemo(() => projects.find((p) => p.id === value), [projects, value]);

  const filtered = useMemo(() => {
    if (!search) return projects;
    const q = search.toLowerCase();
    return projects.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.code.toLowerCase().includes(q)
    );
  }, [projects, search]);

  function updateDropdownPos() {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setDropdownPos({ top: rect.bottom + 4, left: rect.left, width: rect.width });
    }
  }

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(e: MouseEvent) {
      if (
        containerRef.current && !containerRef.current.contains(e.target as Node) &&
        dropdownRef.current && !dropdownRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
        setSearch("");
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function handleReposition() { updateDropdownPos(); }
    window.addEventListener("scroll", handleReposition, true);
    window.addEventListener("resize", handleReposition);
    return () => {
      window.removeEventListener("scroll", handleReposition, true);
      window.removeEventListener("resize", handleReposition);
    };
  }, [open]);

  function handleSelect(id: string) {
    onValueChange(id === value ? "" : id);
    setOpen(false);
    setSearch("");
  }

  function handleClear(e: React.MouseEvent) {
    e.stopPropagation();
    onValueChange("");
    setSearch("");
  }

  function handleInputClick() {
    updateDropdownPos();
    setOpen(true);
    setTimeout(() => inputRef.current?.focus(), 0);
  }

  const dropdownContent = open ? createPortal(
    <div
      ref={dropdownRef}
      className={cn(
        "fixed z-[9999] overflow-hidden rounded-lg border shadow-xl",
        isDark ? "border-white/10 bg-[#1A1D2E]" : "border-gray-200 bg-white"
      )}
      style={{ top: dropdownPos.top, left: dropdownPos.left, width: dropdownPos.width }}
    >
      <div className={cn("flex items-center border-b px-3", isDark ? "border-white/10" : "border-gray-100")}>
        <Search className={cn("h-4 w-4 shrink-0", isDark ? "text-gray-500" : "text-gray-400")} />
        <input
          ref={inputRef}
          type="text"
          placeholder="Search projects..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className={cn(
            "flex h-10 w-full bg-transparent py-2 pl-2 text-sm outline-none",
            isDark ? "text-gray-100 placeholder:text-gray-500" : "text-gray-900 placeholder:text-gray-400"
          )}
        />
      </div>
      <div className="max-h-60 overflow-y-auto p-1">
        {loading && (
          <div className={cn("py-6 text-center text-sm", isDark ? "text-gray-400" : "text-gray-500")}>
            Loading projects...
          </div>
        )}
        {!loading && filtered.length === 0 && !search && (
          <div className={cn("py-6 text-center text-sm", isDark ? "text-gray-400" : "text-gray-500")}>
            No projects available
          </div>
        )}
        {!loading && filtered.length === 0 && search && (
          <div className={cn("py-6 text-center text-sm", isDark ? "text-gray-400" : "text-gray-500")}>
            No projects found
          </div>
        )}
        {filtered.map((project) => (
          <button
            key={project.id}
            type="button"
            onClick={() => handleSelect(project.id)}
            className={cn(
              "flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-left transition-colors",
              isDark ? "hover:bg-white/5" : "hover:bg-gray-100",
              value === project.id
                ? isDark
                  ? "bg-[#FF6B00]/10 font-medium text-[#FF9A5C]"
                  : "bg-[#FFF3EB] font-medium text-[#FF6B00]"
                : isDark
                  ? "text-gray-300"
                  : "text-gray-700"
            )}
          >
            <div className="flex min-w-0 flex-1 items-center gap-2">
              <FolderOpen className="h-4 w-4 shrink-0 text-gray-400" />
              <span className="truncate font-medium">{project.name}</span>
              <span className={cn("shrink-0 rounded px-1.5 py-0.5 text-xs font-mono", isDark ? "bg-white/5 text-gray-400" : "bg-gray-100 text-gray-500")}>
                {project.code}
              </span>
            </div>
            {value === project.id && <Check className="h-3.5 w-3.5 shrink-0" />}
          </button>
        ))}
      </div>
    </div>,
    document.body
  ) : null;

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={handleInputClick}
        className={cn(
          "flex h-10 w-full items-center justify-between rounded-lg border px-3 py-2 text-sm transition-colors",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6B00] focus-visible:ring-offset-1",
          isDark
            ? "border-white/10 bg-[#1A1D2E] text-gray-100 placeholder:text-gray-500"
            : "border-gray-200 bg-white text-gray-900 placeholder:text-gray-400",
          open && "ring-2 ring-[#FF6B00] ring-offset-1"
        )}
      >
        <span className={cn("truncate", !selected && (isDark ? "text-gray-500" : "text-gray-400"))}>
          {loading ? "Loading..." : selected ? `${selected.name}` : placeholder}
        </span>
        <div className="flex items-center gap-1 shrink-0 ml-1">
          {value && (
            <span
              onClick={handleClear}
              className={cn(
                "rounded-full p-0.5",
                isDark
                  ? "text-gray-500 hover:text-gray-300 hover:bg-white/10"
                  : "text-gray-400 hover:text-gray-600 hover:bg-gray-100"
              )}
            >
              <X className="h-3.5 w-3.5" />
            </span>
          )}
          <ChevronDown className={cn("h-4 w-4 transition-transform", isDark ? "text-gray-500" : "text-gray-400", open && "rotate-180")} />
        </div>
      </button>
      {dropdownContent}
    </div>
  );
}

export default function ModulesPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [modules, setModules] = useState<ModuleItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [projects, setProjects] = useState<ProjectDropdown[]>([]);
  const [projectsLoading, setProjectsLoading] = useState(true);

  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingModule, setDeletingModule] = useState<ModuleItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkDeleting, setBulkDeleting] = useState(false);

  // Load projects for dropdown
  useEffect(() => {
    async function loadProjects() {
      try {
        setProjectsLoading(true);
        const res = await projectService.dropdown();
        if (res.data.status === "success") setProjects(res.data.data);
      } catch {
        toast("Failed to load projects", "error");
      } finally {
        setProjectsLoading(false);
      }
    }
    loadProjects();
  }, [toast]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Load modules
  const fetchModules = useCallback(async () => {
    if (!selectedProjectId) {
      setModules([]);
      return;
    }
    try {
      setLoading(true);
      const res = await moduleService.getAll({
        project_id: selectedProjectId,
        search: debouncedSearch || undefined,
      });
      if (res.data.status === "success") {
        setModules(res.data.data);
      }
    } catch {
      toast("Failed to load modules", "error");
    } finally {
      setLoading(false);
    }
  }, [selectedProjectId, debouncedSearch, toast]);

  useEffect(() => {
    fetchModules();
  }, [fetchModules]);

  // Reset selection on project change
  useEffect(() => {
    setSelectedIds([]);
  }, [selectedProjectId]);

  async function handleDelete() {
    if (!deletingModule) return;
    setDeleting(true);
    try {
      const res = await moduleService.delete(deletingModule.id);
      if (res.data.status === "success") {
        toast(res.data.message || "Module deleted successfully", "success");
        fetchModules();
      } else {
        toast(res.data.message || "Failed to delete module", "error");
      }
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } }; message?: string };
      toast(axiosErr.response?.data?.message || axiosErr.message || "An error occurred", "error");
    } finally {
      setDeleting(false);
      setDeleteDialogOpen(false);
      setDeletingModule(null);
    }
  }

  async function handleBulkDelete() {
    if (selectedIds.length === 0) return;
    setBulkDeleting(true);
    try {
      const res = await moduleService.bulkDelete(selectedIds);
      if (res.data.status === "success") {
        toast(res.data.message || "Modules deleted successfully", "success");
        setSelectedIds([]);
        fetchModules();
      } else {
        toast(res.data.message || "Failed to delete modules", "error");
      }
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } }; message?: string };
      toast(axiosErr.response?.data?.message || axiosErr.message || "An error occurred", "error");
    } finally {
      setBulkDeleting(false);
    }
  }

  function toggleSelectAll() {
    if (selectedIds.length === modules.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(modules.map((m) => m.id));
    }
  }

  function toggleSelect(id: string) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  }

  const selectedProject = projects.find((p) => p.id === selectedProjectId);
  const totalTasks = modules.reduce((sum, m) => sum + m.task_count, 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Modules"
        description="Manage project modules and their tasks"
        breadcrumbs={[
          { label: "Dashboard", onClick: () => router.push("/dashboard") },
          { label: "Modules" },
        ]}
        actions={
          selectedProjectId ? (
            <Button onClick={() => router.push(`/modules/create?project_id=${selectedProjectId}`)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Module
            </Button>
          ) : undefined
        }
      />

      {/* Stats */}
      {selectedProjectId && (
        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#FFF3EB] text-[#FF6B00]">
                  <Package className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{modules.length}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Total Modules</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
                  <FolderOpen className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{totalTasks}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Total Tasks</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 text-green-600">
                  <Search className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{selectedProject?.name || "-"}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Current Project</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Search & Filter */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="Search modules..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                  disabled={!selectedProjectId}
                />
              </div>
            </div>
            <div className="w-full sm:w-64">
              <ProjectFilterCombobox
                value={selectedProjectId}
                onValueChange={setSelectedProjectId}
                projects={projects}
                loading={projectsLoading}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bulk actions */}
      {selectedIds.length > 0 && (
        <div className="flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 dark:border-red-900/30 dark:bg-red-900/10">
          <AlertCircle className="h-4 w-4 text-red-500" />
          <span className="text-sm text-red-700 dark:text-red-400">
            {selectedIds.length} module{selectedIds.length > 1 ? "s" : ""} selected
          </span>
          <Button
            variant="destructive"
            size="sm"
            onClick={handleBulkDelete}
            disabled={bulkDeleting}
            className="ml-auto"
          >
            <Trash2 className="mr-1 h-3 w-3" />
            {bulkDeleting ? "Deleting..." : "Delete Selected"}
          </Button>
        </div>
      )}

      {/* Content */}
      {!selectedProjectId ? (
        <Card className="p-12 text-center">
          <Package className="mx-auto h-12 w-12 text-gray-300 dark:text-gray-600" />
          <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-gray-100">Select a Project</h3>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Choose a project from the dropdown above to view its modules.
          </p>
        </Card>
      ) : loading ? (
        <LoadingState message="Loading modules..." />
      ) : modules.length === 0 ? (
        <Card className="p-12 text-center">
          <EmptyState
            icon={<Package className="h-12 w-12" />}
            title="No Modules Found"
            description={debouncedSearch ? "No modules match your search." : "No modules in this project yet."}
            action={
              !debouncedSearch
                ? {
                    label: "Add Module",
                    onClick: () => router.push(`/modules/create?project_id=${selectedProjectId}`),
                  }
                : undefined
            }
          />
        </Card>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 dark:border-white/5">
                  <th className="px-4 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={selectedIds.length === modules.length && modules.length > 0}
                      onChange={toggleSelectAll}
                      className="h-4 w-4 rounded border-gray-300 text-[#FF6B00] focus:ring-[#FF6B00]"
                    />
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Name
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Tasks
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Created
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-white/5">
                {modules.map((module) => (
                  <tr key={module.id} className="transition-colors hover:bg-gray-50/50 dark:hover:bg-white/[0.02]">
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(module.id)}
                        onChange={() => toggleSelect(module.id)}
                        className="h-4 w-4 rounded border-gray-300 text-[#FF6B00] focus:ring-[#FF6B00]"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#FFF3EB] text-[#FF6B00]">
                          <Package className="h-4 w-4" />
                        </div>
                        <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{module.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="secondary">{module.task_count}</Badge>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                      {new Date(module.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => router.push(`/modules/${module.id}/edit`)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-red-500 hover:text-red-600"
                          onClick={() => {
                            setDeletingModule(module);
                            setDeleteDialogOpen(true);
                          }}
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

      <ConfirmDialog
        open={deleteDialogOpen}
        onClose={() => {
          setDeleteDialogOpen(false);
          setDeletingModule(null);
        }}
        onConfirm={handleDelete}
        title="Delete Module"
        description={`Are you sure you want to delete "${deletingModule?.name}"? Tasks linked to this module will be unlinked.`}
        confirmLabel={deleting ? "Deleting..." : "Delete"}
        loading={deleting}
        variant="destructive"
      />
    </div>
  );
}
