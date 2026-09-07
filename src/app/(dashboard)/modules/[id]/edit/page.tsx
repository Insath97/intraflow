"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { moduleService, type ModuleItem } from "@/lib/api/modules";
import { projectService, type ProjectStatus } from "@/lib/api/projects";
import { useToast } from "@/components/ui/toast";
import { PageHeader } from "@/components/common/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LoadingState } from "@/components/common/loading-state";
import { Package, ArrowLeft, Loader2, FileText, Settings, FolderOpen, AlertCircle } from "lucide-react";

interface ProjectDropdown {
  id: string;
  name: string;
  code: string;
  status: ProjectStatus;
}

export default function EditModulePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { toast } = useToast();

  const [module, setModule] = useState<ModuleItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "" });
  const [errors, setErrors] = useState<Partial<Record<string, string>>>({});
  const [saving, setSaving] = useState(false);
  const [projects, setProjects] = useState<ProjectDropdown[]>([]);

  useEffect(() => {
    async function loadModule() {
      try {
        setLoading(true);
        const [moduleRes, projectsRes] = await Promise.all([
          moduleService.getById(id),
          projectService.dropdown(),
        ]);
        if (moduleRes.data.status === "success") {
          const m = moduleRes.data.data;
          setModule(m);
          setForm({ name: m.name });
        } else {
          setError("Failed to load module");
        }
        if (projectsRes.data.status === "success") setProjects(projectsRes.data.data);
      } catch {
        setError("Failed to load module");
      } finally {
        setLoading(false);
      }
    }
    loadModule();
  }, [id]);

  function validate(): boolean {
    const errs: Partial<Record<string, string>> = {};
    if (!form.name.trim()) errs.name = "Name is required";
    if (form.name.trim().length < 2) errs.name = "Name must be at least 2 characters";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSave() {
    if (!validate()) return;
    setSaving(true);
    try {
      const res = await moduleService.update(id, { name: form.name.trim() });
      if (res.data.status === "success") {
        toast(res.data.message || "Module updated successfully", "success");
        setTimeout(() => router.push("/modules"), 500);
      } else {
        toast(res.data.message || "Failed to update module", "error");
      }
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } }; message?: string };
      toast(axiosErr.response?.data?.message || axiosErr.message || "An error occurred", "error");
    } finally {
      setSaving(false);
    }
  }

  const selectedProject = projects.find((p) => p.id === module?.project_id);
  const sectionHeader = "border-b border-gray-100 bg-gray-50/50 px-6 py-4 dark:border-gray-800 dark:bg-gray-800/50";

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Edit Module"
          breadcrumbs={[
            { label: "Dashboard", onClick: () => router.push("/dashboard") },
            { label: "Modules", onClick: () => router.push("/modules") },
            { label: "Edit" },
          ]}
        />
        <LoadingState message="Loading module..." />
      </div>
    );
  }

  if (error || !module) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Edit Module"
          breadcrumbs={[
            { label: "Dashboard", onClick: () => router.push("/dashboard") },
            { label: "Modules", onClick: () => router.push("/modules") },
            { label: "Edit" },
          ]}
        />
        <Card className="p-12 text-center">
          <AlertCircle className="mx-auto h-8 w-8 text-red-500" />
          <p className="mt-4 text-sm text-red-600 dark:text-red-400">{error || "Module not found"}</p>
          <Button variant="outline" size="sm" onClick={() => router.push("/modules")} className="mt-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Modules
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Edit Module"
        description="Update module details"
        breadcrumbs={[
          { label: "Dashboard", onClick: () => router.push("/dashboard") },
          { label: "Modules", onClick: () => router.push("/modules") },
          { label: module.name },
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
                  <p className="text-xs text-gray-500 dark:text-gray-400">Update module name</p>
                </div>
              </div>
            </div>
            <CardContent className="p-6">
              <div className="space-y-5">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Project</label>
                  <div className="flex h-10 items-center rounded-lg border border-gray-200 bg-gray-50 px-3 text-sm text-gray-500 dark:border-white/10 dark:bg-white/5 dark:text-gray-400">
                    <FolderOpen className="mr-2 h-4 w-4" />
                    {selectedProject?.name || "Loading..."}
                  </div>
                  <p className="mt-1 text-xs text-gray-400">Project cannot be changed</p>
                </div>
                <div>
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
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Tasks</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {module.task_count}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Created</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {new Date(module.created_at).toLocaleDateString()}
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
            {saving ? "Updating Module..." : "Update Module"}
          </Button>
        </div>
      </div>
    </div>
  );
}
