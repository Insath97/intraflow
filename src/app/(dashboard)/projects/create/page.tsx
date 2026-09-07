"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { projectService, type ProjectStatus, type ProjectType, type ProjectPriority } from "@/lib/api/projects";
import { usersApi, type UserItem } from "@/lib/api/users";
import { useToast } from "@/components/ui/toast";
import { PageHeader } from "@/components/common/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { UserCombobox } from "@/components/ui/user-combobox";
import {
  FolderKanban,
  ArrowLeft,
  Loader2,
  FileText,
  Settings,
  Calendar,
  Users,
  Plus,
  X,
} from "lucide-react";

const TYPE_OPTIONS: { value: ProjectType; label: string }[] = [
  { value: "CLIENT", label: "Client" },
  { value: "INTERNAL", label: "Internal" },
];

const PRIORITY_OPTIONS: { value: ProjectPriority; label: string }[] = [
  { value: "LOW", label: "Low" },
  { value: "MEDIUM", label: "Medium" },
  { value: "HIGH", label: "High" },
  { value: "URGENT", label: "Urgent" },
];

const STATUS_OPTIONS: { value: ProjectStatus; label: string }[] = [
  { value: "PLANNING", label: "Planning" },
  { value: "ACTIVE", label: "Active" },
  { value: "ON_HOLD", label: "On Hold" },
  { value: "COMPLETED", label: "Completed" },
  { value: "CANCELLED", label: "Cancelled" },
];

const PRIORITY_COLORS: Record<ProjectPriority, string> = {
  LOW: "bg-gray-100 text-gray-700",
  MEDIUM: "bg-blue-100 text-blue-700",
  HIGH: "bg-orange-100 text-orange-700",
  URGENT: "bg-red-100 text-red-700",
};

interface ProjectMemberRow {
  user_id: string;
  role_in_project: string;
}

interface ProjectFormData {
  name: string;
  code: string;
  description: string;
  project_type: ProjectType;
  project_lead_id: string;
  start_date: string;
  end_date: string;
  priority: ProjectPriority;
  status: ProjectStatus;
  members: ProjectMemberRow[];
}

const emptyForm: ProjectFormData = {
  name: "",
  code: "",
  description: "",
  project_type: "CLIENT",
  project_lead_id: "",
  start_date: "",
  end_date: "",
  priority: "MEDIUM",
  status: "PLANNING",
  members: [],
};

export default function CreateProjectPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [form, setForm] = useState<ProjectFormData>(emptyForm);
  const [errors, setErrors] = useState<Partial<Record<keyof ProjectFormData, string>>>({});
  const [saving, setSaving] = useState(false);
  const [users, setUsers] = useState<UserItem[]>([]);

  useEffect(() => {
    async function loadUsers() {
      try {
        const res = await usersApi.getAll({ is_active: true, size: 200 });
        if (res.data.status === "success") setUsers(res.data.data.items);
      } catch { /* ignore */ }
    }
    loadUsers();
  }, []);

  function validate(): boolean {
    const errs: Partial<Record<keyof ProjectFormData, string>> = {};
    if (!form.name.trim()) errs.name = "Name is required";
    if (form.name.trim().length < 2) errs.name = "Name must be at least 2 characters";
    if (!form.code.trim()) errs.code = "Code is required";
    if (form.code.trim().length < 2) errs.code = "Code must be at least 2 characters";
    if (!form.project_lead_id) errs.project_lead_id = "Project lead is required";
    if (!form.start_date) errs.start_date = "Start date is required";
    if (form.end_date && form.start_date && form.end_date < form.start_date) errs.end_date = "End date must be after start date";

    const validMembers = form.members.filter((m) => m.user_id);
    if (validMembers.length > 0) {
      const dupes = validMembers.filter((m, i, arr) => arr.findIndex((x) => x.user_id === m.user_id) !== i);
      if (dupes.length > 0) errs.members = "Duplicate members found";
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSave() {
    if (!validate()) return;
    setSaving(true);
    try {
      const validMembers = form.members.filter((m) => m.user_id);
      const payload = {
        name: form.name.trim(),
        code: form.code.trim().toUpperCase(),
        description: form.description.trim() || undefined,
        project_type: form.project_type,
        project_lead_id: form.project_lead_id,
        start_date: form.start_date,
        end_date: form.end_date || undefined,
        priority: form.priority,
        status: form.status,
        members: validMembers.length > 0 ? validMembers : undefined,
      };

      const res = await projectService.create(payload);
      if (res.data.status === "success") {
        toast(res.data.message || "Project created successfully", "success");
        const projectId = res.data.data.id;
        setTimeout(() => router.push(`/projects/${projectId}/edit`), 500);
      } else {
        toast(res.data.message || "Failed to create project", "error");
      }
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } }; message?: string };
      const message = axiosErr.response?.data?.message || axiosErr.message || "An error occurred";
      toast(message, "error");
    } finally {
      setSaving(false);
    }
  }

  function addMember() {
    setForm((prev) => ({ ...prev, members: [...prev.members, { user_id: "", role_in_project: "" }] }));
  }

  function removeMember(index: number) {
    setForm((prev) => ({ ...prev, members: prev.members.filter((_, i) => i !== index) }));
    if (errors.members) setErrors((prev) => ({ ...prev, members: undefined }));
  }

  function updateMember(index: number, field: keyof ProjectMemberRow, value: string) {
    setForm((prev) => ({
      ...prev,
      members: prev.members.map((m, i) => (i === index ? { ...m, [field]: value } : m)),
    }));
    if (errors.members) setErrors((prev) => ({ ...prev, members: undefined }));
  }

  const validMembers = form.members.filter((m) => m.user_id);
  const leadName = users.find((u) => u.id === form.project_lead_id)?.full_name;

  const selectClass = "flex h-9 w-full appearance-none rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100";
  const sectionHeader = "border-b border-gray-100 bg-gray-50/50 px-6 py-4 dark:border-gray-800 dark:bg-gray-800/50";

  return (
    <div className="space-y-6">
      <PageHeader
        title="Create Project"
        description="Add a new project to the system"
        breadcrumbs={[
          { label: "Dashboard", onClick: () => router.push("/dashboard") },
          { label: "Projects", onClick: () => router.push("/projects") },
          { label: "Create" },
        ]}
        actions={
          <Button variant="outline" size="sm" onClick={() => router.push("/projects")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Projects
          </Button>
        }
      />

      <div className="grid gap-6 xl:grid-cols-3">
        {/* Main Form */}
        <div className="xl:col-span-2 space-y-6">
          {/* Project Details */}
          <Card className="overflow-hidden">
            <div className={sectionHeader}>
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#FFF3EB] text-[#FF6B00] dark:bg-[#E55A00]/20 dark:text-[#FF9A5C]">
                  <FileText className="h-4.5 w-4.5" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Project Details</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Name, code and description</p>
                </div>
              </div>
            </div>
            <CardContent className="p-6">
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Project Name <span className="text-red-500">*</span>
                  </label>
                  <Input
                    placeholder="Enter project name"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    error={!!errors.name}
                  />
                  {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name}</p>}
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Code <span className="text-red-500">*</span>
                  </label>
                  <Input
                    placeholder="e.g. PRJ-001"
                    value={form.code}
                    onChange={(e) => setForm({ ...form, code: e.target.value })}
                    className="uppercase"
                    error={!!errors.code}
                  />
                  {errors.code && <p className="mt-1 text-xs text-red-500">{errors.code}</p>}
                </div>
                <div className="sm:col-span-2">
                  <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Description</label>
                  <textarea
                    placeholder="Brief project description"
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    rows={3}
                    className="flex w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm transition-colors placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6B00] focus-visible:ring-offset-1 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:placeholder:text-gray-400"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Configuration */}
          <Card className="overflow-hidden">
            <div className={sectionHeader}>
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                  <Settings className="h-4.5 w-4.5" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Configuration</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Type, priority, status and lead</p>
                </div>
              </div>
            </div>
            <CardContent className="p-6">
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={form.project_type}
                    onChange={(e) => setForm({ ...form, project_type: e.target.value as ProjectType })}
                    className={selectClass}
                  >
                    {TYPE_OPTIONS.map((t) => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Priority</label>
                  <select
                    value={form.priority}
                    onChange={(e) => setForm({ ...form, priority: e.target.value as ProjectPriority })}
                    className={selectClass}
                  >
                    {PRIORITY_OPTIONS.map((p) => (
                      <option key={p.value} value={p.value}>{p.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Status</label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value as ProjectStatus })}
                    className={selectClass}
                  >
                    {STATUS_OPTIONS.map((s) => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Project Lead <span className="text-red-500">*</span>
                  </label>
                  <UserCombobox
                    value={form.project_lead_id}
                    onValueChange={(val) => setForm({ ...form, project_lead_id: val })}
                    placeholder="Select project lead"
                    searchPlaceholder="Search leads..."
                    excludeIds={validMembers.map((m) => m.user_id)}
                  />
                  {errors.project_lead_id && <p className="mt-1 text-xs text-red-500">{errors.project_lead_id}</p>}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Timeline */}
          <Card className="overflow-hidden">
            <div className={sectionHeader}>
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400">
                  <Calendar className="h-4.5 w-4.5" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Timeline</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Project start and end dates</p>
                </div>
              </div>
            </div>
            <CardContent className="p-6">
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Start Date <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="date"
                    value={form.start_date}
                    onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                    error={!!errors.start_date}
                  />
                  {errors.start_date && <p className="mt-1 text-xs text-red-500">{errors.start_date}</p>}
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">End Date</label>
                  <Input
                    type="date"
                    value={form.end_date}
                    onChange={(e) => setForm({ ...form, end_date: e.target.value })}
                    error={!!errors.end_date}
                  />
                  {errors.end_date && <p className="mt-1 text-xs text-red-500">{errors.end_date}</p>}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="xl:col-span-1 space-y-6">
          {/* Members */}
          <Card className="overflow-hidden">
            <div className={sectionHeader}>
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400">
                  <Users className="h-4.5 w-4.5" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Members</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Team members (optional)</p>
                </div>
              </div>
            </div>
            <CardContent className="p-6">
              <div className="space-y-3">
                {form.members.length === 0 && (
                  <p className="text-xs text-gray-400">No members added</p>
                )}
                {form.members.map((member, index) => (
                  <div key={index} className="space-y-2 rounded-lg border border-gray-200 p-3 dark:border-gray-700">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-gray-500">Member {index + 1}</span>
                      <button
                        type="button"
                        onClick={() => removeMember(index)}
                        className="text-gray-400 hover:text-red-500"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <UserCombobox
                      value={member.user_id}
                      onValueChange={(val) => updateMember(index, "user_id", val)}
                      placeholder="Select user"
                      searchPlaceholder="Search users..."
                      excludeIds={validMembers.filter((_, i) => i !== index).map((m) => m.user_id)}
                    />
                    <Input
                      value={member.role_in_project}
                      onChange={(e) => updateMember(index, "role_in_project", e.target.value)}
                      placeholder="Role in project"
                    />
                  </div>
                ))}
                {errors.members && <p className="text-xs text-red-500">{errors.members}</p>}
                <Button type="button" variant="outline" size="sm" onClick={addMember} className="w-full gap-1">
                  <Plus className="h-3 w-3" /> Add Member
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Summary */}
          <Card className="overflow-hidden">
            <div className={sectionHeader}>
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400">
                  <FileText className="h-4.5 w-4.5" />
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
                  <span className="text-sm text-gray-500 dark:text-gray-400">Name</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {form.name || "-"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Code</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {form.code || "-"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Type</span>
                  <Badge variant="secondary">{form.project_type === "CLIENT" ? "Client" : "Internal"}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Priority</span>
                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${PRIORITY_COLORS[form.priority]}`}>
                    {form.priority}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Status</span>
                  <Badge variant="secondary">{form.status.replace("_", " ")}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Lead</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {leadName || "-"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Start</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {form.start_date || "-"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500 dark:text-gray-400">End</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {form.end_date || "-"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Members</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {validMembers.length}
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
              <FolderKanban className="mr-2 h-4 w-4" />
            )}
            {saving ? "Creating Project..." : "Create Project"}
          </Button>
        </div>
      </div>
    </div>
  );
}
