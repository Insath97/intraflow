"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { roleService } from "@/services";
import type { RoleItem } from "@/services/role.service";
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
  Shield,
  Key,
  Calendar,
  Lock,
  ChevronDown,
  ChevronRight,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function RoleDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const roleId = params.id as string;

  const [role, setRole] = useState<RoleItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

  useEffect(() => {
    async function loadRole() {
      try {
        setLoading(true);
        const res = await roleService.getById(roleId);
        if (res.data.status === "success") {
          setRole(res.data.data);
        } else {
          setError("Role not found");
        }
      } catch {
        setError("Failed to load role");
        toast("Failed to load role", "error");
      } finally {
        setLoading(false);
      }
    }
    loadRole();
  }, [roleId, toast]);

  function toggleGroupExpand(name: string) {
    setExpandedGroups((prev) => ({ ...prev, [name]: !prev[name] }));
  }

  const groupedPermissions = role
    ? Object.entries(
        role.permissions.reduce((acc, p) => {
          if (!acc[p.group_name]) acc[p.group_name] = [];
          acc[p.group_name].push(p);
          return acc;
        }, {} as Record<string, RoleItem["permissions"]>)
      ).map(([group_name, permissions]) => ({ group_name, permissions }))
    : [];

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Role Details"
          description="Loading..."
          breadcrumbs={[
            { label: "Dashboard", onClick: () => router.push("/dashboard") },
            { label: "Roles", onClick: () => router.push("/roles") },
            { label: "Details" },
          ]}
        />
        <LoadingState message="Loading role details..." />
      </div>
    );
  }

  if (error || !role) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Role Details"
          description="Error"
          breadcrumbs={[
            { label: "Dashboard", onClick: () => router.push("/dashboard") },
            { label: "Roles", onClick: () => router.push("/roles") },
            { label: "Details" },
          ]}
        />
        <Card className="p-12 text-center">
          <AlertCircle className="mx-auto h-8 w-8 text-red-500" />
          <p className="mt-4 text-sm text-red-600 dark:text-red-400">{error || "Role not found"}</p>
          <Button variant="outline" size="sm" onClick={() => router.push("/roles")} className="mt-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Roles
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={role.name}
        description="Role Details"
        breadcrumbs={[
          { label: "Dashboard", onClick: () => router.push("/dashboard") },
          { label: "Roles", onClick: () => router.push("/roles") },
          { label: role.name },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => router.push("/roles")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <Button size="sm" onClick={() => router.push(`/roles/${roleId}/edit`)}>
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </Button>
          </div>
        }
      />

      {/* Role Info */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-[#FFF3EB] text-[#FF6B00] dark:bg-[#E55A00]/20 dark:text-[#FF9A5C]">
                <Shield className="h-7 w-7" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">{role.name}</h2>
                  <StatusBadge status={role.is_active ? "active" : "inactive"} />
                  {role.is_protected && (
                    <Badge variant="secondary" className="bg-yellow-100 text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-400">
                      <Lock className="mr-1 h-3 w-3" />
                      Protected
                    </Badge>
                  )}
                </div>
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                  {role.description || "No description provided"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-4">Information</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4 text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500">Created</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {new Date(role.created_at).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4 text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500">Last Updated</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {new Date(role.updated_at).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Key className="h-4 w-4 text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500">Assigned Permissions</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {role.permissions.length}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Permissions */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Assigned Permissions
            </h3>
            <Badge variant="secondary">{role.permissions.length} total</Badge>
          </div>

          {groupedPermissions.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-8">
              No permissions assigned to this role.
            </p>
          ) : (
            <div className="space-y-3">
              {groupedPermissions.map((group) => {
                const expanded = expandedGroups[group.group_name] !== false;
                return (
                  <div key={group.group_name} className="rounded-lg border border-gray-200 dark:border-gray-700">
                    <button
                      type="button"
                      onClick={() => toggleGroupExpand(group.group_name)}
                      className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#FFF3EB] text-[#FF6B00] dark:bg-[#E55A00]/20 dark:text-[#FF9A5C]">
                          <Key className="h-4 w-4" />
                        </div>
                        <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {group.group_name}
                        </span>
                        <Badge variant="secondary" className="text-xs">
                          {group.permissions.length}
                        </Badge>
                      </div>
                      {expanded ? (
                        <ChevronDown className="h-4 w-4 text-gray-400" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-gray-400" />
                      )}
                    </button>
                    {expanded && (
                      <div className="border-t border-gray-100 dark:border-gray-800 px-4 py-2">
                        <div className="grid gap-1 sm:grid-cols-2">
                          {group.permissions.map((perm) => (
                            <div
                              key={perm.id}
                              className="flex items-center gap-2 rounded-md px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                            >
                              <div className="flex h-5 w-5 items-center justify-center rounded bg-green-100 dark:bg-green-900/30">
                                <Key className="h-3 w-3 text-green-600 dark:text-green-400" />
                              </div>
                              <div>
                                <code className="text-xs font-mono text-gray-700 dark:text-gray-300">
                                  {perm.permission_name}
                                </code>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                  {perm.display_name}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
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
  );
}
