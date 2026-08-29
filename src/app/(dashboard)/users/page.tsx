"use client";

import { useState, useEffect, useMemo } from "react";
import type { User, Role } from "@/types";
import { UserService, RoleService, TerritoryService } from "@/services";
import { useToast } from "@/components/ui/toast";
import { PageHeader } from "@/components/common/page-header";
import { StatusBadge } from "@/components/common/status-badge";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { EmptyState } from "@/components/common/empty-state";
import { DataTable } from "@/components/tables/data-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Dialog } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { FormField } from "@/components/forms/form-field";
import type { ColumnDef } from "@tanstack/react-table";
import {
  Plus,
  Eye,
  Pencil,
  Trash2,
  UserPlus,
  Search,
  Power,
  Users,
} from "lucide-react";

interface UserFormData {
  name: string;
  email: string;
  employeeId: string;
  phone: string;
  roleId: string;
  provinceId: string;
  districtId: string;
  dsDivisionId: string;
  status: "active" | "inactive";
}

const emptyForm: UserFormData = {
  name: "",
  email: "",
  employeeId: "",
  phone: "",
  roleId: "",
  provinceId: "",
  districtId: "",
  dsDivisionId: "",
  status: "active",
};

export default function UsersPage() {
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [viewingUser, setViewingUser] = useState<User | null>(null);
  const [form, setForm] = useState<UserFormData>(emptyForm);
  const [errors, setErrors] = useState<Partial<Record<keyof UserFormData, string>>>({});
  const [saving, setSaving] = useState(false);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingUser, setDeletingUser] = useState<User | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [statusUser, setStatusUser] = useState<User | null>(null);
  const [togglingStatus, setTogglingStatus] = useState(false);

  const provinces = useMemo(() => TerritoryService.getProvinces(), []);
  const [districts, setDistricts] = useState(TerritoryService.getDistricts());
  const [dsDivisions, setDsDivisions] = useState(TerritoryService.getDSDivisions());

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (form.provinceId) {
      setDistricts(TerritoryService.getDistrictsByProvince(form.provinceId));
      setForm((prev) => ({ ...prev, districtId: "", dsDivisionId: "" }));
    }
  }, [form.provinceId]);

  useEffect(() => {
    if (form.districtId) {
      setDsDivisions(TerritoryService.getDSDivisionsByDistrict(form.districtId));
      setForm((prev) => ({ ...prev, dsDivisionId: "" }));
    }
  }, [form.districtId]);

  function loadData() {
    try {
      setUsers(UserService.getAll());
      setRoles(RoleService.getAll());
    } finally {
      setLoading(false);
    }
  }

  const roleMap = useMemo(() => {
    const map: Record<string, Role> = {};
    roles.forEach((r) => (map[r.id] = r));
    return map;
  }, [roles]);

  const filteredUsers = useMemo(() => {
    if (!searchQuery.trim()) return users;
    return UserService.search(searchQuery);
  }, [users, searchQuery]);

  function getRoleName(roleId: string): string {
    return roleMap[roleId]?.name ?? "Unknown";
  }

  function getTerritoryLabel(user: User): string {
    if (user.dsDivisionId) {
      const ds = dsDivisions.find((d) => d.id === user.dsDivisionId);
      return ds?.name ?? "";
    }
    if (user.districtId) {
      const dist = districts.find((d) => d.id === user.districtId);
      return dist?.name ?? "";
    }
    if (user.provinceId) {
      const prov = provinces.find((p) => p.id === user.provinceId);
      return prov?.name ?? "";
    }
    return "-";
  }

  function openCreate() {
    setEditingUser(null);
    setForm(emptyForm);
    setErrors({});
    setDialogOpen(true);
  }

  function openEdit(user: User) {
    setEditingUser(user);
    setForm({
      name: user.name,
      email: user.email,
      employeeId: user.employeeId,
      phone: user.phone,
      roleId: user.roleId,
      provinceId: user.provinceId || "",
      districtId: user.districtId || "",
      dsDivisionId: user.dsDivisionId || "",
      status: user.status,
    });
    setErrors({});
    setDialogOpen(true);
  }

  function validate(): boolean {
    const errs: Partial<Record<keyof UserFormData, string>> = {};
    if (!form.name.trim()) errs.name = "Name is required";
    if (!form.email.trim()) errs.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(form.email)) errs.email = "Invalid email";
    if (!form.employeeId.trim()) errs.employeeId = "Employee ID is required";
    if (!form.phone.trim()) errs.phone = "Phone is required";
    if (!form.roleId) errs.roleId = "Role is required";
    if (!form.provinceId) errs.provinceId = "Province is required";

    if (form.email.trim()) {
      const existing = UserService.getByEmail(form.email.trim());
      if (existing && (!editingUser || existing.id !== editingUser.id)) {
        errs.email = "Email already in use";
      }
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleSave() {
    if (!validate()) return;
    setSaving(true);
    try {
      if (editingUser) {
        UserService.update(editingUser.id, {
          name: form.name.trim(),
          email: form.email.trim(),
          employeeId: form.employeeId.trim(),
          phone: form.phone.trim(),
          roleId: form.roleId,
          provinceId: form.provinceId || undefined,
          districtId: form.districtId || undefined,
          dsDivisionId: form.dsDivisionId || undefined,
          status: form.status,
        });
        toast("User updated successfully", "success");
      } else {
        UserService.create({
          name: form.name.trim(),
          email: form.email.trim(),
          employeeId: form.employeeId.trim(),
          phone: form.phone.trim(),
          roleId: form.roleId,
          provinceId: form.provinceId || undefined,
          districtId: form.districtId || undefined,
          dsDivisionId: form.dsDivisionId || undefined,
          status: form.status,
        });
        toast("User created successfully", "success");
      }
      loadData();
      setDialogOpen(false);
    } catch {
      toast("An error occurred", "error");
    } finally {
      setSaving(false);
    }
  }

  function confirmDelete(user: User) {
    setDeletingUser(user);
    setDeleteDialogOpen(true);
  }

  function handleDelete() {
    if (!deletingUser) return;
    setDeleting(true);
    try {
      UserService.remove(deletingUser.id);
      toast("User deleted successfully", "success");
      loadData();
    } catch {
      toast("An error occurred", "error");
    } finally {
      setDeleting(false);
      setDeleteDialogOpen(false);
      setDeletingUser(null);
    }
  }

  function confirmStatusToggle(user: User) {
    setStatusUser(user);
    setStatusDialogOpen(true);
  }

  function handleStatusToggle() {
    if (!statusUser) return;
    setTogglingStatus(true);
    try {
      const newStatus = statusUser.status === "active" ? "inactive" : "active";
      UserService.update(statusUser.id, { status: newStatus });
      toast(
        `User ${newStatus === "active" ? "activated" : "deactivated"} successfully`,
        "success"
      );
      loadData();
    } catch {
      toast("An error occurred", "error");
    } finally {
      setTogglingStatus(false);
      setStatusDialogOpen(false);
      setStatusUser(null);
    }
  }

  const columns: ColumnDef<User, unknown>[] = [
    {
      accessorKey: "name",
      header: "Name",
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#FFF3EB] text-xs font-medium text-[#FF6B00] dark:bg-[#E55A00]/20 dark:text-[#FF9A5C]">
            {row.original.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="font-medium text-gray-900 dark:text-gray-100">
              {row.original.name}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {row.original.phone}
            </p>
          </div>
        </div>
      ),
    },
    {
      accessorKey: "email",
      header: "Email",
      cell: ({ row }) => (
        <span className="text-gray-600 dark:text-gray-300">
          {row.original.email}
        </span>
      ),
    },
    {
      accessorKey: "employeeId",
      header: "Employee ID",
      cell: ({ row }) => (
        <Badge variant="secondary">{row.original.employeeId}</Badge>
      ),
    },
    {
      accessorKey: "roleId",
      header: "Role",
      cell: ({ row }) => (
        <Badge variant="outline">{getRoleName(row.original.roleId)}</Badge>
      ),
    },
    {
      id: "territory",
      header: "Territory",
      cell: ({ row }) => (
        <span className="text-gray-600 dark:text-gray-300">
          {getTerritoryLabel(row.original)}
        </span>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
    },
    {
      accessorKey: "lastLogin",
      header: "Last Login",
      cell: ({ row }) => {
        const login = row.original.lastLogin;
        return login ? (
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {new Date(login).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        ) : (
          <span className="text-xs text-gray-400 dark:text-gray-500">Never</span>
        );
      },
    },
  ];

  const userActions = (user: User) => [
    { label: "View Details", onClick: () => setViewingUser(user) },
    { label: "Edit", onClick: () => openEdit(user) },
    {
      label: user.status === "active" ? "Deactivate" : "Activate",
      onClick: () => confirmStatusToggle(user),
    },
    { label: "Delete", onClick: () => confirmDelete(user), destructive: true },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="User Management"
        description="Manage system users, roles, and access control"
        breadcrumbs={[
          { label: "Dashboard" },
          { label: "Users" },
        ]}
        actions={
          <Button onClick={openCreate}>
            <UserPlus className="mr-2 h-4 w-4" />
            Create User
          </Button>
        }
      />

      <div className="flex items-center gap-3">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Search users by name, email, or employee ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
          <Users className="h-4 w-4" />
          <span>{filteredUsers.length} user(s)</span>
        </div>
      </div>

      {filteredUsers.length === 0 && !loading ? (
        <EmptyState
          icon={<Users className="h-8 w-8" />}
          title="No users found"
          description={searchQuery ? "Try a different search term." : "Create your first user to get started."}
          action={!searchQuery ? { label: "Create User", onClick: openCreate } : undefined}
        />
      ) : (
        <DataTable
          columns={columns}
          data={filteredUsers}
          searchColumn="name"
          actions={userActions}
          pageSize={10}
        />
      )}

      {/* View User Dialog */}
      {viewingUser && (
        <Dialog
          open={!!viewingUser}
          onClose={() => setViewingUser(null)}
          title="User Details"
        >
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#FFF3EB] text-2xl font-bold text-[#FF6B00] dark:bg-[#E55A00]/20 dark:text-[#FF9A5C]">
                {viewingUser.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {viewingUser.name}
                </h3>
                <StatusBadge status={viewingUser.status} />
              </div>
            </div>
            <div className="grid gap-3 text-sm">
              {[
                ["Email", viewingUser.email],
                ["Employee ID", viewingUser.employeeId],
                ["Phone", viewingUser.phone],
                ["Role", getRoleName(viewingUser.roleId)],
                ["Territory", getTerritoryLabel(viewingUser)],
                [
                  "Created",
                  new Date(viewingUser.createdAt).toLocaleDateString(),
                ],
                [
                  "Last Login",
                  viewingUser.lastLogin
                    ? new Date(viewingUser.lastLogin).toLocaleString()
                    : "Never",
                ],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between border-b border-gray-100 py-2 dark:border-gray-800">
                  <span className="text-gray-500 dark:text-gray-400">{label}</span>
                  <span className="font-medium text-gray-900 dark:text-gray-100">{value}</span>
                </div>
              ))}
            </div>
          </div>
        </Dialog>
      )}

      {/* Create / Edit Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        title={editingUser ? "Edit User" : "Create User"}
        className="max-w-xl"
        footer={
          <>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Saving..." : editingUser ? "Update" : "Create"}
            </Button>
          </>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Full Name" required error={errors.name} className="sm:col-span-2">
            <Input
              placeholder="Enter full name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              error={!!errors.name}
            />
          </FormField>
          <FormField label="Email" required error={errors.email} className="sm:col-span-2">
            <Input
              type="email"
              placeholder="user@example.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              error={!!errors.email}
            />
          </FormField>
          <FormField label="Employee ID" required error={errors.employeeId}>
            <Input
              placeholder="EMP-001"
              value={form.employeeId}
              onChange={(e) => setForm({ ...form, employeeId: e.target.value })}
              error={!!errors.employeeId}
            />
          </FormField>
          <FormField label="Phone" required error={errors.phone}>
            <Input
              placeholder="077 123 4567"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              error={!!errors.phone}
            />
          </FormField>
          <FormField label="Role" required error={errors.roleId}>
            <Select
              value={form.roleId}
              onChange={(e) => setForm({ ...form, roleId: e.target.value })}
              error={!!errors.roleId}
            >
              <option value="">Select role</option>
              {roles.map((role) => (
                <option key={role.id} value={role.id}>
                  {role.name}
                </option>
              ))}
            </Select>
          </FormField>
          <FormField label="Status" required>
            <Select
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value as "active" | "inactive" })}
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </Select>
          </FormField>
          <FormField label="Province" required error={errors.provinceId}>
            <Select
              value={form.provinceId}
              onChange={(e) => setForm({ ...form, provinceId: e.target.value })}
              error={!!errors.provinceId}
            >
              <option value="">Select province</option>
              {provinces.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </Select>
          </FormField>
          <FormField label="District">
            <Select
              value={form.districtId}
              onChange={(e) => setForm({ ...form, districtId: e.target.value })}
              disabled={!form.provinceId}
            >
              <option value="">Select district</option>
              {districts.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </Select>
          </FormField>
          <FormField label="DS Division" className="sm:col-span-2">
            <Select
              value={form.dsDivisionId}
              onChange={(e) => setForm({ ...form, dsDivisionId: e.target.value })}
              disabled={!form.districtId}
            >
              <option value="">Select DS division</option>
              {dsDivisions.map((ds) => (
                <option key={ds.id} value={ds.id}>
                  {ds.name}
                </option>
              ))}
            </Select>
          </FormField>
        </div>
      </Dialog>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={deleteDialogOpen}
        onClose={() => {
          setDeleteDialogOpen(false);
          setDeletingUser(null);
        }}
        onConfirm={handleDelete}
        title="Delete User"
        description={`Are you sure you want to delete "${deletingUser?.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        loading={deleting}
      />

      {/* Status Toggle Confirmation */}
      <ConfirmDialog
        open={statusDialogOpen}
        onClose={() => {
          setStatusDialogOpen(false);
          setStatusUser(null);
        }}
        onConfirm={handleStatusToggle}
        title={
          statusUser?.status === "active" ? "Deactivate User" : "Activate User"
        }
        description={
          statusUser?.status === "active"
            ? `Are you sure you want to deactivate "${statusUser?.name}"? They will no longer be able to log in.`
            : `Are you sure you want to activate "${statusUser?.name}"? They will be able to log in again.`
        }
        confirmLabel={statusUser?.status === "active" ? "Deactivate" : "Activate"}
        variant={statusUser?.status === "active" ? "destructive" : "default"}
        loading={togglingStatus}
      />
    </div>
  );
}
