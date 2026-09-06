"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { userService } from "@/services";
import { roleService } from "@/services/role.service";
import type { RoleSimple } from "@/services/role.service";
import { useToast } from "@/components/ui/toast";
import { PageHeader } from "@/components/common/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  UserPlus,
  ArrowLeft,
  Loader2,
  Upload,
  X,
  User,
  Mail,
  Lock,
  Shield,
  Briefcase,
  Settings,
  Image,
  CheckCircle,
} from "lucide-react";

interface UserFormData {
  f_name: string;
  l_name: string;
  username: string;
  email: string;
  employee_code: string;
  password: string;
  role_id: string;
  designation: string;
  is_active: boolean;
  can_login: boolean;
}

const emptyForm: UserFormData = {
  f_name: "",
  l_name: "",
  username: "",
  email: "",
  employee_code: "",
  password: "",
  role_id: "",
  designation: "",
  is_active: true,
  can_login: true,
};

export default function CreateUserPage() {
  const router = useRouter();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState<UserFormData>(emptyForm);
  const [errors, setErrors] = useState<Partial<Record<keyof UserFormData, string>>>({});
  const [saving, setSaving] = useState(false);

  const [roles, setRoles] = useState<RoleSimple[]>([]);
  const [rolesLoading, setRolesLoading] = useState(true);
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

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
    if (!form.password.trim()) errs.password = "Password is required";
    else if (form.password.length < 6) errs.password = "Password must be at least 6 characters";
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
      fd.append("password", form.password);
      fd.append("role_id", form.role_id);
      if (form.designation.trim()) fd.append("designation", form.designation.trim());
      fd.append("is_active", String(form.is_active));
      fd.append("can_login", String(form.can_login));
      if (profileImage) fd.append("profile_image", profileImage);

      const res = await userService.create(fd);
      if (res.data.status === "success") {
        toast(res.data.message || "User created successfully", "success");
        setTimeout(() => router.push("/users"), 500);
      } else {
        toast(res.data.message || "Failed to create user", "error");
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
        title="Create User"
        description="Add a new user to the system"
        breadcrumbs={[
          { label: "Dashboard", onClick: () => router.push("/dashboard") },
          { label: "Users", onClick: () => router.push("/users") },
          { label: "Create" },
        ]}
        actions={
          <Button variant="outline" size="sm" onClick={() => router.push("/users")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Users
          </Button>
        }
      />

      <div className="grid gap-6 xl:grid-cols-3">
        {/* Main Form */}
        <div className="xl:col-span-2 space-y-6">
          {/* Personal Information */}
          <Card className="overflow-hidden">
            <div className="border-b border-gray-100 bg-gray-50/50 px-6 py-4 dark:border-gray-800 dark:bg-gray-800/50">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#FFF3EB] text-[#FF6B00] dark:bg-[#E55A00]/20 dark:text-[#FF9A5C]">
                  <User className="h-4.5 w-4.5" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                    Personal Information
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Basic details about the user
                  </p>
                </div>
              </div>
            </div>
            <CardContent className="p-6">
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    First Name <span className="text-red-500">*</span>
                  </label>
                  <Input
                    placeholder="Enter first name"
                    value={form.f_name}
                    onChange={(e) => setForm({ ...form, f_name: e.target.value })}
                    error={!!errors.f_name}
                  />
                  {errors.f_name && <p className="mt-1 text-xs text-red-500">{errors.f_name}</p>}
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Last Name <span className="text-red-500">*</span>
                  </label>
                  <Input
                    placeholder="Enter last name"
                    value={form.l_name}
                    onChange={(e) => setForm({ ...form, l_name: e.target.value })}
                    error={!!errors.l_name}
                  />
                  {errors.l_name && <p className="mt-1 text-xs text-red-500">{errors.l_name}</p>}
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <Input
                      type="email"
                      placeholder="user@example.com"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      error={!!errors.email}
                      className="pl-9"
                    />
                  </div>
                  {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email}</p>}
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Username <span className="text-red-500">*</span>
                  </label>
                  <Input
                    placeholder="e.g. john_doe"
                    value={form.username}
                    onChange={(e) => setForm({ ...form, username: e.target.value })}
                    error={!!errors.username}
                  />
                  {errors.username && <p className="mt-1 text-xs text-red-500">{errors.username}</p>}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Employment Details */}
          <Card className="overflow-hidden">
            <div className="border-b border-gray-100 bg-gray-50/50 px-6 py-4 dark:border-gray-800 dark:bg-gray-800/50">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                  <Briefcase className="h-4.5 w-4.5" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                    Employment Details
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Work-related information and role assignment
                  </p>
                </div>
              </div>
            </div>
            <CardContent className="p-6">
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Employee Code <span className="text-red-500">*</span>
                  </label>
                  <Input
                    placeholder="e.g. EMP-001"
                    value={form.employee_code}
                    onChange={(e) => setForm({ ...form, employee_code: e.target.value })}
                    error={!!errors.employee_code}
                  />
                  {errors.employee_code && <p className="mt-1 text-xs text-red-500">{errors.employee_code}</p>}
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Role <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Shield className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <select
                      value={form.role_id}
                      onChange={(e) => setForm({ ...form, role_id: e.target.value })}
                      className="flex h-9 w-full appearance-none rounded-lg border border-gray-300 bg-white pl-9 pr-3 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                    >
                      <option value="">Select role</option>
                      {roles.map((role) => (
                        <option key={role.id} value={role.id}>
                          {role.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  {errors.role_id && <p className="mt-1 text-xs text-red-500">{errors.role_id}</p>}
                </div>
                <div className="sm:col-span-2">
                  <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Designation
                  </label>
                  <Input
                    placeholder="e.g. Software Engineer"
                    value={form.designation}
                    onChange={(e) => setForm({ ...form, designation: e.target.value })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Security */}
          <Card className="overflow-hidden">
            <div className="border-b border-gray-100 bg-gray-50/50 px-6 py-4 dark:border-gray-800 dark:bg-gray-800/50">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400">
                  <Lock className="h-4.5 w-4.5" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                    Security & Access
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Password and access settings
                  </p>
                </div>
              </div>
            </div>
            <CardContent className="p-6">
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Password <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="password"
                    placeholder="Min. 6 characters"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    error={!!errors.password}
                  />
                  {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password}</p>}
                </div>
                <div className="flex items-end gap-6">
                  <div className="flex-1">
                    <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Status
                    </label>
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
                  <div className="flex-1">
                    <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Login Access
                    </label>
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, can_login: !form.can_login })}
                      className="flex items-center gap-2.5"
                    >
                      <div className={`relative h-5 w-9 rounded-full transition-colors ${form.can_login ? "bg-[#FF6B00]" : "bg-gray-300 dark:bg-gray-600"}`}>
                        <div className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${form.can_login ? "translate-x-4" : "translate-x-0.5"}`} />
                      </div>
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        {form.can_login ? "Enabled" : "Disabled"}
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="xl:col-span-1 space-y-6">
          {/* Profile Image */}
          <Card className="overflow-hidden">
            <div className="border-b border-gray-100 bg-gray-50/50 px-6 py-4 dark:border-gray-800 dark:bg-gray-800/50">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400">
                  <Image className="h-4.5 w-4.5" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                    Profile Image
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Upload a profile photo
                  </p>
                </div>
              </div>
            </div>
            <CardContent className="p-6">
              <div className="flex flex-col items-center">
                <div className="relative mb-4">
                  {imagePreview ? (
                    <div className="relative">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="h-28 w-28 rounded-2xl object-cover ring-4 ring-gray-100 dark:ring-gray-800"
                      />
                      <button
                        type="button"
                        onClick={removeImage}
                        className="absolute -right-2 -top-2 flex h-7 w-7 items-center justify-center rounded-full bg-red-500 text-white shadow-lg hover:bg-red-600 transition-colors"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex h-28 w-28 cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 transition-all hover:border-[#FF6B00] hover:bg-[#FFF3EB] dark:border-gray-700 dark:bg-gray-800 dark:hover:border-[#FF6B00]"
                    >
                      <Upload className="h-6 w-6 text-gray-400" />
                      <span className="text-[10px] font-medium text-gray-400">Upload</span>
                    </button>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
                <p className="text-center text-xs text-gray-500 dark:text-gray-400">
                  JPG, PNG or GIF. Max 5MB.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Quick Summary */}
          <Card className="overflow-hidden">
            <div className="border-b border-gray-100 bg-gray-50/50 px-6 py-4 dark:border-gray-800 dark:bg-gray-800/50">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400">
                  <Settings className="h-4.5 w-4.5" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                    Summary
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Review before saving
                  </p>
                </div>
              </div>
            </div>
            <CardContent className="p-6">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Name</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {form.f_name && form.l_name ? `${form.f_name} ${form.l_name}` : "-"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Email</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {form.email || "-"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Username</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {form.username || "-"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Role</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {roles.find((r) => r.id === form.role_id)?.name || "-"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Status</span>
                  <Badge variant={form.is_active ? "default" : "secondary"}>
                    {form.is_active ? "Active" : "Inactive"}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Login</span>
                  <Badge variant={form.can_login ? "default" : "secondary"}>
                    {form.can_login ? "Enabled" : "Disabled"}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Save Button */}
          <Button onClick={handleSave} disabled={saving} className="w-full" size="lg">
            {saving ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <UserPlus className="mr-2 h-4 w-4" />
            )}
            {saving ? "Creating User..." : "Create User"}
          </Button>
        </div>
      </div>
    </div>
  );
}
