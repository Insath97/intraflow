"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { moduleService } from "@/lib/api/modules";
import { projectService, type ProjectStatus } from "@/lib/api/projects";
import { useToast } from "@/components/ui/toast";
import { PageHeader } from "@/components/common/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Package, ArrowLeft, Loader2, FileText, Settings, FolderOpen } from "lucide-react";

interface ProjectDropdown {
  id: string;
  name: string;
  code: string;
  status: ProjectStatus;
}

export default function CreateModulePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const preselectedProjectId = searchParams.get("project_id") || "";

  const [form, setForm] = useState({
    project_id: preselectedProjectId,
    name: "",
  });
  const [errors, setErrors] = useState<Partial<Record<keyof typeof form, string>>>({});
  const [saving, setSaving] = useState(false);
  const [projects, setProjects] = useState<ProjectDropdown[]>([]);
  const [projectsLoading, setProjectsLoading] = useState(true);

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

  function validate(): boolean {
    const errs: Partial<Record<keyof typeof form, string>> = {};
    if (!form.project_id) errs.project_id = "Project is required";
    if (!form.name.trim()) errs.name = "Name is required";
    if (form.name.trim().length < 2) errs.name = "Name must be at least 2 characters";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSave() {
    if (!validate()) return;
    setSaving(true);
    try {
      const res = await moduleService.create({
        project_id: form.project_id,
        name: form.name.trim(),
      });
      if (res.data.status === "success") {
        toast(res.data.message || "Module created successfully", "success");
        setTimeout(() => router.push("/modules"), 500);
      } else {
        toast(res.data.message || "Failed to create module", "error");
      }
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } }; message?: string };
      toast(axiosErr.response?.data?.message || axiosErr.message || "An error occurred", "error");
    } finally {
      setSaving(false);
    }
  }

  const selectedProject = projects.find((p) => p.id === form.project_id);
  const selectClass = "flex h-10 w-full appearance-none rounded-lg border bg-white px-3 py-2 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6B00] focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50 border-gray-200 dark:border-white/10 dark:bg-[#1A1D2E] dark:text-gray-100";
  const sectionHeader = "border-b border-gray-100 bg-gray-50/50 px-6 py-4 dark:border-gray-800 dark:bg-gray-800/50";

  return (
    <div className="space-y-6">
      <PageHeader
        title="Create Module"
        description="Add a new module to a project"
        breadcrumbs={[
          { label: "Dashboard", onClick: () => router.push("/dashboard") },
          { label: "Modules", onClick: () => router.push("/modules") },
          { label: "Create" },
        ]}
        actions={
          <Button variant="outline" size="sm" onClick={() => router.push("/modules")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Modules
          </Button>
        }
      />

      <div className="grid gap-6 xl:grid-cols-3">
        {/* Main Form */}
        <div className="xl:col-span-2 space-y-6">
          {/* Module Details */}
          <Card className="overflow-hidden">
            <div className={sectionHeader}>
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#FFF3EB] text-[#FF6B00]">
                  <FileText className="h-4.5 w-4.5" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Module Details</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Project and module name</p>
                </div>
              </div>
            </div>
            <CardContent className="p-6">
              <div className="grid gap-5 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Project <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <FolderOpen className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <select
                      value={form.project_id}
                      onChange={(e) => setForm({ ...form, project_id: e.target.value })}
                      className={`${selectClass} pl-9`}
                      disabled={!!preselectedProjectId}
                    >
                      <option value="">{projectsLoading ? "Loading..." : "Select project"}</option>
                      {projects.map((p) => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </div>
                  {errors.project_id && <p className="mt-1 text-xs text-red-500">{errors.project_id}</p>}
                </div>
                <div className="sm:col-span-2">
                  <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Module Name <span className="text-red-500">*</span>
                  </label>
                  <Input
                    placeholder="e.g. Authentication, Dashboard, API"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    error={!!errors.name}
                  />
                  {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name}</p>}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="xl:col-span-1 space-y-6">
          {/* Summary */}
          <Card className="overflow-hidden">
            <div className={sectionHeader}>
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-100 text-amber-600">
                  <Settings className="h-4.5 w-4.5" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Summary</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Review before saving</p>
                </div>
              </div>
            </div>
            <CardContent className="p-6">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Project</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {selectedProject?.name || "-"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Module Name</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {form.name || "-"}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Save Button */}
          <Button onClick={handleSave} disabled={saving} className="w-full" size="lg">
            {saving ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Package className="mr-2 h-4 w-4" />
            )}
            {saving ? "Creating Module..." : "Create Module"}
          </Button>
        </div>
      </div>
    </div>
  );
}
