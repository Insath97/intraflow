"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { PageHeader } from "@/components/common/page-header";
import { EmptyState } from "@/components/common/empty-state";
import { LoadingState } from "@/components/common/loading-state";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { permissionService, type PermissionItem } from "@/services/permission.service";
import { formatDateTime } from "@/lib/utils";
import {
  ArrowLeft,
  Key,
  Shield,
  Lock,
  Calendar,
  Info,
  CheckCircle,
  XCircle,
  Copy,
  Hash,
} from "lucide-react";

export default function PermissionDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [permission, setPermission] = useState<PermissionItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function fetchPermission() {
      try {
        const response = await permissionService.getById(id);
        const result = response.data;

        if (result.status === "success" && result.data) {
          const data = result.data as Record<string, unknown>;
          const permData = (data.permission ?? data) as PermissionItem;
          setPermission(permData);
        } else {
          setError(true);
        }
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    }

    if (id) fetchPermission();
  }, [id]);

  const handleCopyId = () => {
    navigator.clipboard.writeText(id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyName = () => {
    if (permission) {
      navigator.clipboard.writeText(permission.permission_name);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading) {
    return <LoadingState fullPage message="Loading permission details..." />;
  }

  if (error || !permission) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Permission Not Found"
          breadcrumbs={[
            { label: "Dashboard", onClick: () => router.push("/dashboard") },
            { label: "Permissions", onClick: () => router.push("/permissions") },
            { label: "Not Found" },
          ]}
        />
        <EmptyState
          title="Permission not found"
          description="The permission you are looking for does not exist or has been removed."
          action={{
            label: "Back to Permissions",
            onClick: () => router.push("/permissions"),
          }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={permission.display_name}
        description={`Permission: ${permission.permission_name}`}
        breadcrumbs={[
          { label: "Dashboard", onClick: () => router.push("/dashboard") },
          { label: "Permissions", onClick: () => router.push("/permissions") },
          { label: permission.display_name },
        ]}
        actions={
          <Button variant="outline" onClick={() => router.push("/permissions")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Permissions
          </Button>
        }
      />

      {/* Status Banner */}
      <div
        className={`flex items-center gap-3 rounded-xl border p-4 ${
          permission.is_active
            ? "border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20"
            : "border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/50"
        }`}
      >
        {permission.is_active ? (
          <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
        ) : (
          <XCircle className="h-5 w-5 text-gray-400" />
        )}
        <div>
          <p
            className={`text-sm font-medium ${
              permission.is_active
                ? "text-green-700 dark:text-green-400"
                : "text-gray-600 dark:text-gray-400"
            }`}
          >
            {permission.is_active ? "This permission is active" : "This permission is inactive"}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {permission.is_active
              ? "Users with this permission can access the associated features."
              : "This permission is currently disabled and cannot be assigned."}
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left: Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Permission Info Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Key className="h-4 w-4" />
                Permission Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <DetailRow label="Permission Name">
                  <div className="flex items-center gap-2">
                    <code className="rounded-lg bg-orange-50 px-3 py-1.5 font-mono text-sm font-medium text-orange-700 dark:bg-orange-900/20 dark:text-orange-400">
                      {permission.permission_name}
                    </code>
                    <button
                      type="button"
                      onClick={handleCopyName}
                      className="rounded-lg p-1.5 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
                      title="Copy permission name"
                    >
                      {copied ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <Copy className="h-4 w-4 text-gray-400" />
                      )}
                    </button>
                  </div>
                </DetailRow>
                <DetailRow label="Display Name" value={permission.display_name} />
                <DetailRow label="Group" value={permission.group_name} />
                <DetailRow label="Status">
                  <Badge
                    variant={permission.is_active ? "default" : "secondary"}
                    className={
                      permission.is_active
                        ? "bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400"
                        : "bg-gray-100 text-gray-600 dark:bg-gray-500/20 dark:text-gray-400"
                    }
                  >
                    {permission.is_active ? "Active" : "Inactive"}
                  </Badge>
                </DetailRow>
              </div>
              {permission.description && (
                <div className="space-y-1.5">
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                    Description
                  </p>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    {permission.description}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Usage Context Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Shield className="h-4 w-4" />
                Usage Context
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  This permission is part of the <strong className="text-gray-900 dark:text-gray-100">{permission.group_name}</strong> group.
                  {permission.is_active
                    ? " It can be assigned to roles to grant users access to specific features."
                    : " Currently inactive and cannot be assigned to roles."}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right: Sidebar */}
        <div className="space-y-6">
          {/* Metadata Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Info className="h-4 w-4" />
                Metadata
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <DetailRow label="Permission ID">
                <div className="flex items-center gap-2">
                  <code className="rounded bg-gray-100 px-2 py-0.5 font-mono text-xs dark:bg-gray-800">
                    {permission.id}
                  </code>
                  <button
                    type="button"
                    onClick={handleCopyId}
                    className="rounded p-1 transition-colors hover:bg-gray-200 dark:hover:bg-gray-700"
                    title="Copy ID"
                  >
                    {copied ? (
                      <CheckCircle className="h-3.5 w-3.5 text-green-500" />
                    ) : (
                      <Copy className="h-3.5 w-3.5 text-gray-400" />
                    )}
                  </button>
                </div>
              </DetailRow>
              <DetailRow label="Group Name" value={permission.group_name} />
              <DetailRow label="Created At" value={formatDateTime(permission.created_at)} />
              <DetailRow label="Updated At" value={formatDateTime(permission.updated_at)} />
            </CardContent>
          </Card>

          {/* Quick Actions Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Hash className="h-4 w-4" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => router.push("/permissions")}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to All Permissions
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => {
                  navigator.clipboard.writeText(permission.permission_name);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }}
              >
                <Copy className="mr-2 h-4 w-4" />
                Copy Permission Name
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function DetailRow({
  label,
  value,
  children,
}: {
  label: string;
  value?: string;
  children?: React.ReactNode;
}) {
  return (
    <div>
      <p className="text-xs font-medium text-gray-500 dark:text-gray-400">{label}</p>
      {children ? (
        <div className="mt-1">{children}</div>
      ) : (
        <p className="mt-0.5 text-sm font-medium text-gray-900 dark:text-gray-100">
          {value || <span className="text-gray-400 dark:text-gray-500">—</span>}
        </p>
      )}
    </div>
  );
}
