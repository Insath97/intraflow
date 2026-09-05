"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { userService } from "@/services";
import { roleService } from "@/services/role.service";
import type { RoleSimple } from "@/services/role.service";
import type { UserItem } from "@/services/user.service";
import { useToast } from "@/components/ui/toast";
import { PageHeader } from "@/components/common/page-header";
import { LoadingState } from "@/components/common/loading-state";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/forms/form-field";
import {
  Save,
  ArrowLeft,
  Loader2,
  Upload,
  X,
  AlertCircle,
  User,
} from "lucide-react";

interface UserFormData {
  f_name: string;
  l_name: string;
  username: string;
  email: string;
  employee_code: string;
  role_id: string;
  designation: string;
  is_active: boolean;
  can_login: boolean;
}

export default function EditUserPage() {
  const router = useRouter();
  const params = useParams();
  const userId = params.id as string;
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState<UserFormData>({
    f_name: "",
    l_name: "",
    username: "",
    email: "",
    employee_code: "",
    role_id: "",
    designation: "",
    is_active: true,
    can_login: true,
  });
  const [errors, setErrors] = useState<Partial<Record<keyof UserFormData, string>>>({});
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<UserItem | null>(null);
  const [error, setError] = useState("");

  const [roles, setRoles] = useState<RoleSimple[]>([]);
  const [rolesLoading, setRolesLoading] = useState(true);
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  useEffect(() => {
    async function loadUser() {
      try {
        setLoading(true);
        const res = await userService.getById(userId);
        if (res.data.status === "success") {
          const u = res.data.data;
          setUser(u);
          setForm({
            f_name: u.f_name,
            l_name: u.l_name,
            username: u.username,
            email: u.email,
            employee_code: u.employee_code,
            role_id: u.role?.id || "",
            designation: u.designation || "",
            is_active: u.is_active,
            can_login: u.can_login,
          });
          if (u.profile_image_path) {
            setImagePreview(u.profile_image_path);
          }
        } else {
          setError("User not found");
        }
      } catch {
        setError("Failed to load user");
        toast("Failed to load user", "error");
      } finally {
        setLoading(false);
      }
    }
    loadUser();
  }, [userId, toast]);

  useEffect(() => {
    async function loadRoles() {
      try {
        setRolesLoading(true);
        const res = await roleService.list();
        if (res.data.status === "success" && Array.isArray(res.data.data)) {
          setRoles(res.data.data);
        }
      } catch {
        toast("Failed to load roles", "error");
      } finally {
        setRolesLoading(false);
      }
    }
    loadRoles();
  }, [toast]);

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast("Image must be less than 5MB", "error");
      return;
    }
    setProfileImage(file);
    const reader = new FileReader();
    reader.onload = (ev) => setImagePreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  }

  function removeImage() {
    setProfileImage(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function validate(): boolean {
    const errs: Partial<Record<keyof UserFormData, string>> = {};
    if (!form.f_name.trim()) errs.f_name = "First name is required";
    if (form.f_name.trim().length < 2) errs.f_name = "First name must be at least 2 characters";
    if (!form.l_name.trim()) errs.l_name = "Last name is required";
    if (form.l_name.trim().length < 2) errs.l_name = "Last name must be at least 2 characters";
    if (!form.username.trim()) errs.username = "Username is required";
    if (form.username.trim().length < 3) errs.username = "Username must be at least 3 characters";
    if (!/^[a-zA-Z0-9_]+$/.test(form.username.trim())) errs.username = "Username must be alphanumeric or underscore";
    if (!form.email.trim()) errs.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) errs.email = "Invalid email";
    if (!form.employee_code.trim()) errs.employee_code = "Employee code is required";
    if (form.employee_code.trim().length < 2) errs.employee_code = "Employee code must be at least 2 characters";
    if (!form.role_id) errs.role_id = "Role is required";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSave() {
    if (!validate()) return;
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append("f_name", form.f_name.trim());
      fd.append("l_name", form.l_name.trim());
      fd.append("username", form.username.trim().toLowerCase());
      fd.append("email", form.email.trim().toLowerCase());
      fd.append("employee_code", form.employee_code.trim());
      fd.append("role_id", form.role_id);
      if (form.designation.trim()) fd.append("designation", form.designation.trim());
      fd.append("is_active", String(form.is_active));
      fd.append("can_login", String(form.can_login));
      if (profileImage) fd.append("profile_image", profileImage);

      const res = await userService.update(userId, fd);
      if (res.data.status === "success") {
        toast(res.data.message || "User updated successfully", "success");
        setTimeout(() => router.push("/users"), 500);
      } else {
        toast(res.data.message || "Failed to update user", "error");
      }
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } }; message?: string };
      const message = axiosErr.response?.data?.message || axiosErr.message || "An error occurred";
      toast(message, "error");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Edit User"
          breadcrumbs={[
            { label: "Dashboard", onClick: () => router.push("/dashboard") },
            { label: "Users", onClick: () => router.push("/users") },
            { label: "Edit" },
          ]}
        />
        <LoadingState message="Loading user..." />
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Edit User"
          breadcrumbs={[
            { label: "Dashboard", onClick: () => router.push("/dashboard") },
            { label: "Users", onClick: () => router.push("/users") },
            { label: "Edit" },
          ]}
        />
        <Card className="p-12 text-center">
          <AlertCircle className="mx-auto h-8 w-8 text-red-500" />
          <p className="mt-4 text-sm text-red-600 dark:text-red-400">{error || "User not found"}</p>
          <Button variant="outline" size="sm" onClick={() => router.push("/users")} className="mt-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Users
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Edit User: ${user.full_name}`}
        description="Update user details and settings"
        breadcrumbs={[
          { label: "Dashboard", onClick: () => router.push("/dashboard") },
          { label: "Users", onClick: () => router.push("/users") },
          { label: "Edit" },
        ]}
        actions={
          <Button variant="outline" size="sm" onClick={() => router.push("/users")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Users
          </Button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* User Details Form */}
        <div className="lg:col-span-2">
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                User Details
              </h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField label="First Name" required error={errors.f_name}>
                  <Input
                    placeholder="Enter first name"
                    value={form.f_name}
                    onChange={(e) => setForm({ ...form, f_name: e.target.value })}
                    error={!!errors.f_name}
                  />
                </FormField>
                <FormField label="Last Name" required error={errors.l_name}>
                  <Input
                    placeholder="Enter last name"
                    value={form.l_name}
                    onChange={(e) => setForm({ ...form, l_name: e.target.value })}
                    error={!!errors.l_name}
                  />
                </FormField>
                <FormField label="Username" required error={errors.username}>
                  <Input
                    placeholder="e.g. john_doe"
                    value={form.username}
                    onChange={(e) => setForm({ ...form, username: e.target.value })}
                    error={!!errors.username}
                  />
                </FormField>
                <FormField label="Email" required error={errors.email}>
                  <Input
                    type="email"
                    placeholder="user@example.com"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    error={!!errors.email}
                  />
                </FormField>
                <FormField label="Employee Code" required error={errors.employee_code}>
                  <Input
                    placeholder="e.g. EMP-001"
                    value={form.employee_code}
                    onChange={(e) => setForm({ ...form, employee_code: e.target.value })}
                    error={!!errors.employee_code}
                  />
                </FormField>
                <FormField label="Role" required error={errors.role_id}>
                  <select
                    value={form.role_id}
                    onChange={(e) => setForm({ ...form, role_id: e.target.value })}
                    className="flex h-9 w-full appearance-none rounded-lg border border-gray-300 bg-white px-3 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                  >
                    <option value="">Select role</option>
                    {roles.map((role) => (
                      <option key={role.id} value={role.id}>
                        {role.name}
                      </option>
                    ))}
                  </select>
                </FormField>
                <FormField label="Designation">
                  <Input
                    placeholder="e.g. Software Engineer"
                    value={form.designation}
                    onChange={(e) => setForm({ ...form, designation: e.target.value })}
                  />
                </FormField>
                <FormField label="Active Status" required>
                  <select
                    value={form.is_active ? "active" : "inactive"}
                    onChange={(e) => setForm({ ...form, is_active: e.target.value === "active" })}
                    className="flex h-9 w-full appearance-none rounded-lg border border-gray-300 bg-white px-3 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </FormField>
                <FormField label="Login Access" required>
                  <select
                    value={form.can_login ? "yes" : "no"}
                    onChange={(e) => setForm({ ...form, can_login: e.target.value === "yes" })}
                    className="flex h-9 w-full appearance-none rounded-lg border border-gray-300 bg-white px-3 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                  >
                    <option value="yes">Can Login</option>
                    <option value="no">Cannot Login</option>
                  </select>
                </FormField>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Profile Image + Actions */}
        <div className="lg:col-span-1">
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Profile Image
              </h3>
              <div className="flex flex-col items-center gap-4">
                <div className="relative">
                  {imagePreview ? (
                    <div className="relative">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="h-32 w-32 rounded-full object-cover border-4 border-gray-200 dark:border-gray-700"
                      />
                      <button
                        type="button"
                        onClick={removeImage}
                        className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-white hover:bg-red-600"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ) : (
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="flex h-32 w-32 cursor-pointer items-center justify-center rounded-full border-2 border-dashed border-gray-300 bg-gray-50 hover:border-[#FF6B00] hover:bg-[#FFF3EB] dark:border-gray-600 dark:bg-gray-800 dark:hover:border-[#FF6B00]"
                    >
                      <Upload className="h-8 w-8 text-gray-400" />
                    </div>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  type="button"
                >
                  <Upload className="mr-2 h-4 w-4" />
                  Change Image
                </Button>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  JPG, PNG or GIF. Max 5MB.
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-gray-100 dark:border-gray-800">
                <Button onClick={handleSave} disabled={saving} className="w-full">
                  {saving ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="mr-2 h-4 w-4" />
                  )}
                  {saving ? "Saving..." : "Update User"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
