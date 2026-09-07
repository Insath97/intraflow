"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { roleService, permissionService } from "@/services";
import { useToast } from "@/components/ui/toast";
import { PageHeader } from "@/components/common/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { FormField } from "@/components/forms/form-field";
import {
  Save,
  ArrowLeft,
  Search,
  ChevronDown,
  ChevronRight,
  Loader2,
  Key,
} from "lucide-react";

interface PermissionItem {
  id: string;
  group_name: string;
  permission_name: string;
  display_name: string;
}

interface RoleFormData {
  name: string;
  description: string;
  is_active: boolean;
  permissionIds: string[];
}

const emptyForm: RoleFormData = {
  name: "",
  description: "",
  is_active: true,
  permissionIds: [],
};

export default function CreateRolePage() {
  const router = useRouter();
  const { toast } = useToast();

  const [form, setForm] = useState<RoleFormData>(emptyForm);
  const [errors, setErrors] = useState<Partial<Record<keyof RoleFormData, string>>>({});
  const [saving, setSaving] = useState(false);

  const [permissions, setPermissions] = useState<PermissionItem[]>([]);
  const [permissionsLoading, setPermissionsLoading] = useState(true);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  const [permissionSearch, setPermissionSearch] = useState("");

  useEffect(() => {
    async function loadPermissions() {
      try {
        setPermissionsLoading(true);
        const res = await permissionService.list();
        if (res.data.status === "success" && Array.isArray(res.data.data)) {
          setPermissions(res.data.data);
        }
      } catch {
        toast("Failed to load permissions", "error");
      } finally {
        setPermissionsLoading(false);
      }
    }
    loadPermissions();
  }, [toast]);

  const filteredPermissions = useMemo(() => {
    if (!permissionSearch.trim()) return permissions;
    const lower = permissionSearch.toLowerCase();
    return permissions.filter(
      (p) =>
        p.permission_name.toLowerCase().includes(lower) ||
        p.display_name.toLowerCase().includes(lower) ||
        p.group_name.toLowerCase().includes(lower)
    );
  }, [permissionSearch, permissions]);

  const groupedPermissions = useMemo(() => {
    const groups: Record<string, PermissionItem[]> = {};
    filteredPermissions.forEach((p) => {
      if (!groups[p.group_name]) groups[p.group_name] = [];
      groups[p.group_name].push(p);
    });
    return Object.entries(groups).map(([group_name, items]) => ({
      group_name,
      permissions: items,
    }));
  }, [filteredPermissions]);

  const allPermissionIds = useMemo(() => permissions.map((p) => p.id), [permissions]);
  const totalPermissions = useMemo(() => permissions.length, [permissions]);

  function toggleGroupExpand(name: string) {
    setExpandedGroups((prev) => ({ ...prev, [name]: !prev[name] }));
  }

  function toggleGroupSelectAll(groupName: string) {
    const allGroupPerms = permissions.filter((p) => p.group_name === groupName);
    const groupPermIds = allGroupPerms.map((p) => p.id);
    const allSelected = groupPermIds.every((id) => form.permissionIds.includes(id));

    setForm((prev) => {
      if (allSelected) {
        return { ...prev, permissionIds: prev.permissionIds.filter((id) => !groupPermIds.includes(id)) };
      }
      return { ...prev, permissionIds: [...new Set([...prev.permissionIds, ...groupPermIds])] };
    });
  }

  function togglePermission(permissionId: string) {
    setForm((prev) => {
      const exists = prev.permissionIds.includes(permissionId);
      return {
        ...prev,
        permissionIds: exists
          ? prev.permissionIds.filter((id) => id !== permissionId)
          : [...prev.permissionIds, permissionId],
      };
    });
  }

  function selectAllPermissions() {
    setForm((prev) => ({ ...prev, permissionIds: [...allPermissionIds] }));
  }

  function clearAllPermissions() {
    setForm((prev) => ({ ...prev, permissionIds: [] }));
  }

  function isGroupSelected(groupName: string): boolean {
    const allGroupPerms = permissions.filter((p) => p.group_name === groupName);
    if (allGroupPerms.length === 0) return false;
    return allGroupPerms.every((p) => form.permissionIds.includes(p.id));
  }

  function isGroupIndeterminate(groupName: string): boolean {
    const allGroupPerms = permissions.filter((p) => p.group_name === groupName);
    if (allGroupPerms.length === 0) return false;
    const selected = allGroupPerms.filter((p) => form.permissionIds.includes(p.id));
    return selected.length > 0 && selected.length < allGroupPerms.length;
  }

  function validate(): boolean {
    const errs: Partial<Record<keyof RoleFormData, string>> = {};
    if (!form.name.trim()) errs.name = "Name is required";
    if (form.name.trim().length < 2) errs.name = "Name must be at least 2 characters";
    if (form.permissionIds.length === 0) errs.permissionIds = "At least one permission is required";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSave() {
    if (!validate()) return;
    setSaving(true);
    try {
      const res = await roleService.create({
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        permission_ids: form.permissionIds,
      });
      if (res.data.status === "success") {
        toast(res.data.message || "Role created successfully", "success");
        setTimeout(() => router.push("/roles"), 500);
      } else {
        toast(res.data.message || "Failed to create role", "error");
      }
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } }; message?: string };
      const message = axiosErr.response?.data?.message || axiosErr.message || "An error occurred";
      toast(message, "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Create Role"
        description="Define a new role and assign permissions"
        breadcrumbs={[
          { label: "Dashboard", onClick: () => router.push("/dashboard") },
          { label: "Roles", onClick: () => router.push("/roles") },
          { label: "Create" },
        ]}
        actions={
          <Button variant="outline" size="sm" onClick={() => router.push("/roles")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Roles
          </Button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Role Details Form */}
        <div className="lg:col-span-1">
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Role Details
              </h3>
              <div className="space-y-4">
                <FormField label="Role Name" required error={errors.name}>
                  <Input
                    placeholder="Enter role name"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    error={!!errors.name}
                  />
                </FormField>
                <FormField label="Description">
                  <textarea
                    placeholder="Brief description of this role"
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    className="flex min-h-[100px] w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm transition-colors placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6B00] focus-visible:ring-offset-1 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:placeholder:text-gray-400"
                  />
                </FormField>
                <FormField label="Status" required>
                  <select
                    value={form.is_active ? "active" : "inactive"}
                    onChange={(e) => setForm({ ...form, is_active: e.target.value === "active" })}
                    className="flex h-9 w-full appearance-none rounded-lg border border-gray-300 bg-white px-3 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </FormField>
                <div className="pt-4 border-t border-gray-100 dark:border-gray-800">
                  <Button onClick={handleSave} disabled={saving} className="w-full">
                    {saving ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="mr-2 h-4 w-4" />
                    )}
                    {saving ? "Saving..." : "Create Role"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Permissions */}
        <div className="lg:col-span-2">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Key className="h-5 w-5 text-[#FF6B00]" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    Permissions
                  </h3>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    ({form.permissionIds.length} of {totalPermissions} selected)
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" onClick={selectAllPermissions} type="button">
                    Select All
                  </Button>
                  <Button variant="ghost" size="sm" onClick={clearAllPermissions} type="button">
                    Clear All
                  </Button>
                </div>
              </div>

              {errors.permissionIds && (
                <p className="mb-3 text-sm text-red-500">{errors.permissionIds}</p>
              )}

              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="Search permissions..."
                  value={permissionSearch}
                  onChange={(e) => setPermissionSearch(e.target.value)}
                  className="pl-9"
                />
              </div>

              {permissionsLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-[#FF6B00]" />
                  <span className="ml-2 text-sm text-gray-500">Loading permissions...</span>
                </div>
              ) : groupedPermissions.length === 0 ? (
                <p className="py-12 text-center text-sm text-gray-500 dark:text-gray-400">
                  No permissions found.
                </p>
              ) : (
                <div className="space-y-2 max-h-[500px] overflow-y-auto rounded-lg border border-gray-200 p-3 dark:border-gray-700 sidebar-scrollbar">
                  {groupedPermissions.map((group) => {
                    const expanded = expandedGroups[group.group_name] !== false;
                    return (
                      <div key={group.group_name} className="rounded-lg border border-gray-100 dark:border-gray-800">
                        <div className="flex items-center gap-2 px-3 py-2.5">
                          <button
                            type="button"
                            onClick={() => toggleGroupExpand(group.group_name)}
                            className="flex items-center gap-2 flex-1 text-left"
                          >
                            {expanded ? <ChevronDown className="h-4 w-4 text-gray-400" /> : <ChevronRight className="h-4 w-4 text-gray-400" />}
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                              {group.group_name}
                            </span>
                            <Badge variant="secondary" className="ml-1 text-xs">
                              {group.permissions.length}
                            </Badge>
                          </button>
                          <Checkbox
                            checked={isGroupSelected(group.group_name)}
                            indeterminate={isGroupIndeterminate(group.group_name)}
                            onCheckedChange={() => toggleGroupSelectAll(group.group_name)}
                          />
                        </div>
                        {expanded && (
                          <div className="space-y-1 border-t border-gray-100 px-3 py-2 dark:border-gray-800">
                            {group.permissions.map((perm) => (
                              <label
                                key={perm.id}
                                className="flex cursor-pointer items-center gap-3 rounded-md px-2 py-1.5 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                              >
                                <Checkbox
                                  checked={form.permissionIds.includes(perm.id)}
                                  onCheckedChange={() => togglePermission(perm.id)}
                                />
                                <div className="flex-1">
                                  <span className="text-sm font-mono text-gray-700 dark:text-gray-300">
                                    {perm.permission_name}
                                  </span>
                                  <p className="text-xs text-gray-500 dark:text-gray-400">
                                    {perm.display_name}
                                  </p>
                                </div>
                              </label>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
