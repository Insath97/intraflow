"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { userService } from "@/services";
import type { UserItem } from "@/services/user.service";
import { useToast } from "@/components/ui/toast";
import { PageHeader } from "@/components/common/page-header";
import { LoadingState } from "@/components/common/loading-state";
import { StatusBadge } from "@/components/common/status-badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Pencil,
  Users,
  Calendar,
  LogIn,
  Shield,
  Building,
  Mail,
  User,
  AlertCircle,
  Globe,
} from "lucide-react";

export default function UserDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const userId = params.id as string;

  const [user, setUser] = useState<UserItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadUser() {
      try {
        setLoading(true);
        const res = await userService.getById(userId);
        if (res.data.status === "success") {
          setUser(res.data.data);
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

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="User Details"
          description="Loading..."
          breadcrumbs={[
            { label: "Dashboard", onClick: () => router.push("/dashboard") },
            { label: "Users", onClick: () => router.push("/users") },
            { label: "Details" },
          ]}
        />
        <LoadingState message="Loading user details..." />
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="User Details"
          description="Error"
          breadcrumbs={[
            { label: "Dashboard", onClick: () => router.push("/dashboard") },
            { label: "Users", onClick: () => router.push("/users") },
            { label: "Details" },
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
        title={user.full_name}
        description="User Details"
        breadcrumbs={[
          { label: "Dashboard", onClick: () => router.push("/dashboard") },
          { label: "Users", onClick: () => router.push("/users") },
          { label: user.full_name },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => router.push("/users")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <Button size="sm" onClick={() => router.push(`/users/${userId}/edit`)}>
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </Button>
          </div>
        }
      />

      {/* User Info */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              {user.profile_image_path ? (
                <img
                  src={user.profile_image_path}
                  alt={user.full_name}
                  className="h-20 w-20 rounded-full object-cover border-4 border-gray-200 dark:border-gray-700"
                />
              ) : (
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#FFF3EB] text-2xl font-bold text-[#FF6B00] dark:bg-[#E55A00]/20 dark:text-[#FF9A5C]">
                  {user.f_name.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">{user.full_name}</h2>
                  <StatusBadge status={user.is_active ? "active" : "inactive"} />
                  {user.can_login ? (
                    <Badge variant="secondary" className="bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400">
                      <LogIn className="mr-1 h-3 w-3" />
                      Can Login
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="bg-gray-100 text-gray-600 dark:bg-gray-500/20 dark:text-gray-400">
                      No Login
                    </Badge>
                  )}
                </div>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                  {user.designation || "No designation"}
                </p>
                <div className="mt-3 flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                  <div className="flex items-center gap-1">
                    <Mail className="h-4 w-4" />
                    <span>{user.email}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <User className="h-4 w-4" />
                    <span>{user.username}</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-4">Information</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Shield className="h-4 w-4 text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500">Role</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {user.role?.name || "N/A"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Building className="h-4 w-4 text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500">Department</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {user.department?.name || "N/A"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4 text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500">Created</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {new Date(user.created_at).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Globe className="h-4 w-4 text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500">Employee Code</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {user.employee_code}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Login Info */}
      <Card>
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Login Information
          </h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex items-center gap-3 rounded-lg border border-gray-100 p-4 dark:border-gray-800">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/30">
                <LogIn className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Last Login</p>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {user.last_login_at
                    ? new Date(user.last_login_at).toLocaleString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "Never logged in"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-lg border border-gray-100 p-4 dark:border-gray-800">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30">
                <Globe className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Last IP Address</p>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {user.last_login_ip || "N/A"}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
