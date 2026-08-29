"use client";

import { useState, useEffect, useMemo } from "react";
import type { Role } from "@/types";
import { RoleService, UserService } from "@/services";
import { PERMISSION_GROUPS } from "@/lib/constants";
import { useToast } from "@/components/ui/toast";
import { PageHeader } from "@/components/common/page-header";
import { StatusBadge } from "@/components/common/status-badge";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { EmptyState } from "@/components/common/empty-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Dialog } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { FormField } from "@/components/forms/form-field";
import {
  Plus,
  Pencil,
  Trash2,
  Shield,
  ChevronDown,
  ChevronRight,
  Search,
  Users,
  Lock,
} from "lucide-react";

interface RoleFormData {
  name: string;
  description: string;
  status: "active" | "inactive";
  permissionIds: string[];
}

const emptyForm: RoleFormData = {
  name: "",
  description: "",
  status: "active",
  permissionIds: [],
};

export default function RolesPage() {
  const { toast } = useToast();
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [form, setForm] = useState<RoleFormData>(emptyForm);
  const [errors, setErrors] = useState<Partial<Record<keyof RoleFormData, string>>>({});
  const [saving, setSaving] = useState(false);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingRole, setDeletingRole] = useState<Role | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  const [permissionSearch, setPermissionSearch] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  function loadData() {
    try {
      setRoles(RoleService.getAll());
    } finally {
      setLoading(false);
    }
  }

  const userCounts = useMemo(() => {
    const users = UserService.getAll();
    const counts: Record<string, number> = {};
    users.forEach((u) => {
      counts[u.roleId] = (counts[u.roleId] || 0) + 1;
    });
    return counts;
  }, [roles]);

  const filteredPermissionGroups = useMemo(() => {
    if (!permissionSearch.trim()) return PERMISSION_GROUPS;
    const lower = permissionSearch.toLowerCase();
    return PERMISSION_GROUPS.map((group) => ({
      ...group,
      permissions: group.permissions.filter(
        (p) =>
          p.name.toLowerCase().includes(lower) ||
          p.description.toLowerCase().includes(lower)
      ),
    })).filter((group) => group.permissions.length > 0);
  }, [permissionSearch]);

  const totalPermissions = useMemo(
    () => PERMISSION_GROUPS.reduce((acc, g) => acc + g.permissions.length, 0),
    []
  );

  function toggleGroupExpand(name: string) {
    setExpandedGroups((prev) => ({ ...prev, [name]: !prev[name] }));
  }

  function toggleGroupSelectAll(groupName: string) {
    const group = PERMISSION_GROUPS.find((g) => g.name === groupName);
    if (!group) return;
    const groupPermIds = group.permissions.map((p) => p.id);
    const allSelected = groupPermIds.every((id) => form.permissionIds.includes(id));

    setForm((prev) => {
      if (allSelected) {
        return {
          ...prev,
          permissionIds: prev.permissionIds.filter((id) => !groupPermIds.includes(id)),
        };
      }
      return {
        ...prev,
        permissionIds: [...new Set([...prev.permissionIds, ...groupPermIds])],
      };
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
    const allIds = PERMISSION_GROUPS.flatMap((g) => g.permissions.map((p) => p.id));
    setForm((prev) => ({ ...prev, permissionIds: allIds }));
  }

  function clearAllPermissions() {
    setForm((prev) => ({ ...prev, permissionIds: [] }));
  }

  function isGroupSelected(groupName: string): boolean {
    const group = PERMISSION_GROUPS.find((g) => g.name === groupName);
    if (!group) return false;
    return group.permissions.every((p) => form.permissionIds.includes(p.id));
  }

  function isGroupIndeterminate(groupName: string): boolean {
    const group = PERMISSION_GROUPS.find((g) => g.name === groupName);
    if (!group) return false;
    const selected = group.permissions.filter((p) => form.permissionIds.includes(p.id));
    return selected.length > 0 && selected.length < group.permissions.length;
  }

  function openCreate() {
    setEditingRole(null);
    setForm(emptyForm);
    setErrors({});
    setPermissionSearch("");
    setExpandedGroups({});
    setDialogOpen(true);
  }

  function openEdit(role: Role) {
    setEditingRole(role);
    setForm({
      name: role.name,
      description: role.description,
      status: role.status,
      permissionIds: [...role.permissionIds],
    });
    setErrors({});
    setPermissionSearch("");
    setExpandedGroups({});
    setDialogOpen(true);
  }

  function validate(): boolean {
    const errs: Partial<Record<keyof RoleFormData, string>> = {};
    if (!form.name.trim()) errs.name = "Name is required";
    if (form.permissionIds.length === 0) errs.permissionIds = "At least one permission is required";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleSave() {
    if (!validate()) return;
    setSaving(true);
    try {
      if (editingRole) {
        RoleService.update(editingRole.id, {
          name: form.name.trim(),
          description: form.description.trim(),
          status: form.status,
          permissionIds: form.permissionIds,
        });
        toast("Role updated successfully", "success");
      } else {
        RoleService.create({
          name: form.name.trim(),
          description: form.description.trim(),
          status: form.status,
          permissionIds: form.permissionIds,
        });
        toast("Role created successfully", "success");
      }
      loadData();
      setDialogOpen(false);
    } catch {
      toast("An error occurred", "error");
    } finally {
      setSaving(false);
    }
  }

  function confirmDelete(role: Role) {
    setDeletingRole(role);
    setDeleteDialogOpen(true);
  }

  function handleDelete() {
    if (!deletingRole) return;
    const count = userCounts[deletingRole.id] || 0;
    if (count > 0) {
      toast(
        `Cannot delete role "${deletingRole.name}" - ${count} user(s) are assigned to it.`,
        "error"
      );
      setDeleteDialogOpen(false);
      setDeletingRole(null);
      return;
    }
    setDeleting(true);
    try {
      RoleService.remove(deletingRole.id);
      toast("Role deleted successfully", "success");
      loadData();
    } catch {
      toast("An error occurred", "error");
    } finally {
      setDeleting(false);
      setDeleteDialogOpen(false);
      setDeletingRole(null);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Roles"
        description="Define roles and manage permission assignments for system access control"
        breadcrumbs={[{ label: "Dashboard" }, { label: "Roles" }]}
        actions={
          <Button onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Create Role
          </Button>
        }
      />

      {roles.length === 0 && !loading ? (
        <EmptyState
          icon={<Shield className="h-8 w-8" />}
          title="No roles found"
          description="Create your first role to define access permissions."
          action={{ label: "Create Role", onClick: openCreate }}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {roles.map((role) => (
            <Card key={role.id} className="group relative overflow-hidden">
              <div className="p-6">
                <div className="mb-4 flex items-start justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#EAF7F1] text-[#168B61] dark:bg-[#0F684A]/20 dark:text-[#4ADE80]">
                    <Shield className="h-5 w-5" />
                  </div>
                  <StatusBadge status={role.status} />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {role.name}
                </h3>
                <p className="mt-1 line-clamp-2 text-sm text-gray-500 dark:text-gray-400">
                  {role.description || "No description"}
                </p>
                <div className="mt-4 flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    <span>{userCounts[role.id] || 0} user(s)</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Lock className="h-4 w-4" />
                    <span>{role.permissionIds.length} permission(s)</span>
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-2 border-t border-gray-100 pt-4 dark:border-gray-800">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openEdit(role)}
                    className="flex-1"
                  >
                    <Pencil className="mr-1.5 h-3.5 w-3.5" />
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => confirmDelete(role)}
                    className="text-red-600 hover:text-red-700 dark:text-red-400"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Create / Edit Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        title={editingRole ? "Edit Role" : "Create Role"}
        className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
        footer={
          <>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Saving..." : editingRole ? "Update" : "Create"}
            </Button>
          </>
        }
      >
        <div className="flex-1 overflow-y-auto space-y-5 pr-1">
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Role Name" required error={errors.name}>
              <Input
                placeholder="Enter role name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                error={!!errors.name}
              />
            </FormField>
            <FormField label="Status" required>
              <Select
                value={form.status}
                onChange={(e) =>
                  setForm({ ...form, status: e.target.value as "active" | "inactive" })
                }
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </Select>
            </FormField>
          </div>
          <FormField label="Description">
            <textarea
              placeholder="Brief description of this role"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="flex min-h-[80px] w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm transition-colors placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#168B61] focus-visible:ring-offset-1 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:placeholder:text-gray-400"
            />
          </FormField>

          {/* Permissions Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Permissions
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
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

            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search permissions..."
                value={permissionSearch}
                onChange={(e) => setPermissionSearch(e.target.value)}
                className="pl-9"
              />
            </div>

            <div className="space-y-2 max-h-[300px] overflow-y-auto rounded-lg border border-gray-200 p-3 dark:border-gray-700">
              {filteredPermissionGroups.map((group) => {
                const expanded = expandedGroups[group.name] !== false;
                return (
                  <div key={group.name} className="rounded-lg border border-gray-100 dark:border-gray-800">
                    <div className="flex items-center gap-2 px-3 py-2.5">
                      <button
                        type="button"
                        onClick={() => toggleGroupExpand(group.name)}
                        className="flex items-center gap-2 flex-1 text-left"
                      >
                        {expanded ? (
                          <ChevronDown className="h-4 w-4 text-gray-400" />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-gray-400" />
                        )}
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          {group.name}
                        </span>
                        <Badge variant="secondary" className="ml-1 text-xs">
                          {group.permissions.length}
                        </Badge>
                      </button>
                      <Checkbox
                        checked={isGroupSelected(group.name)}
                        indeterminate={isGroupIndeterminate(group.name)}
                        onCheckedChange={() => toggleGroupSelectAll(group.name)}
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
                                {perm.name}
                              </span>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {perm.description}
                              </p>
                            </div>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
              {filteredPermissionGroups.length === 0 && (
                <p className="py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                  No permissions match your search.
                </p>
              )}
            </div>
          </div>
        </div>
      </Dialog>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={deleteDialogOpen}
        onClose={() => {
          setDeleteDialogOpen(false);
          setDeletingRole(null);
        }}
        onConfirm={handleDelete}
        title="Delete Role"
        description={`Are you sure you want to delete "${deletingRole?.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        loading={deleting}
      />
    </div>
  );
}
