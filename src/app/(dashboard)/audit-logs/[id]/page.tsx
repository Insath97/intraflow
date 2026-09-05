"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { PageHeader } from "@/components/common/page-header";
import { EmptyState } from "@/components/common/empty-state";
import { LoadingState } from "@/components/common/loading-state";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { auditLogsApi } from "@/lib/api";
import type { AuditLogItem } from "@/lib/api/audit-logs";
import { formatDateTime } from "@/lib/utils";
import {
  ArrowLeft,
  Activity,
  User,
  Shield,
  Globe,
  Clock,
  FileText,
  Info,
  Copy,
  CheckCircle,
} from "lucide-react";

export default function AuditLogDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [log, setLog] = useState<AuditLogItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function fetchLog() {
      try {
        const response = await auditLogsApi.getAll({ page: 1, size: 200 });
        const result = response.data;

        if (result.status === "success" && result.data) {
          const found = result.data.items.find((item) => item.id === id);
          if (found) {
            setLog(found);
          } else {
            setError(true);
          }
        } else {
          setError(true);
        }
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    }

    if (id) fetchLog();
  }, [id]);

  const handleCopyId = () => {
    navigator.clipboard.writeText(id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return <LoadingState fullPage message="Loading activity log details..." />;
  }

  if (error || !log) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Log Not Found"
          breadcrumbs={[
            { label: "Dashboard", onClick: () => router.push("/dashboard") },
            { label: "Activity Logs", onClick: () => router.push("/audit-logs") },
            { label: "Not Found" },
          ]}
        />
        <EmptyState
          title="Activity log not found"
          description="The log entry you are looking for does not exist or has been removed."
          action={{
            label: "Back to Activity Logs",
            onClick: () => router.push("/audit-logs"),
          }}
        />
      </div>
    );
  }

  const actionColor = (action: string) => {
    switch (action) {
      case "CREATE":
        return "text-green-600 dark:text-green-400";
      case "UPDATE":
        return "text-blue-600 dark:text-blue-400";
      case "DELETE":
      case "BULK_DELETE":
        return "text-red-600 dark:text-red-400";
      case "login":
        return "text-purple-600 dark:text-purple-400";
      case "logout":
        return "text-gray-600 dark:text-gray-400";
      default:
        return "text-gray-600 dark:text-gray-400";
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${log.action} — ${log.module}`}
        description={`Performed by ${log.user_name}`}
        breadcrumbs={[
          { label: "Dashboard", onClick: () => router.push("/dashboard") },
          { label: "Activity Logs", onClick: () => router.push("/audit-logs") },
          { label: "Log Detail" },
        ]}
        actions={
          <Button variant="outline" onClick={() => router.push("/audit-logs")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Logs
          </Button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left: Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Action Info Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Activity className="h-4 w-4" />
                Action Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <DetailRow label="Action">
                  <span className={`text-sm font-semibold ${actionColor(log.action)}`}>
                    {log.action}
                  </span>
                </DetailRow>
                <DetailRow label="Module" value={log.module} />
              </div>
              <div className="space-y-1.5">
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                  Description
                </p>
                <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-800/50">
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    {log.description || "No description provided"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Activity Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Clock className="h-4 w-4" />
                Activity Timeline
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#FFF3EB] dark:bg-[#E55A00]/20">
                    <Activity className="h-5 w-5 text-[#FF6B00]" />
                  </div>
                </div>
                <div className="flex-1 pb-4">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {log.action} on {log.module}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {log.description || "No description"}
                  </p>
                  <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                    {formatDateTime(log.created_at)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right: Sidebar */}
        <div className="space-y-6">
          {/* User Info Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <User className="h-4 w-4" />
                User Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#FFF3EB] text-sm font-bold text-[#FF6B00] dark:bg-[#E55A00]/20 dark:text-[#FF9A5C]">
                  {log.user_name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase()}
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-gray-100">
                    {log.user_name}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    ID: {log.user_id || "System"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Network Info Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Globe className="h-4 w-4" />
                Network Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <DetailRow label="IP Address">
                <code className="rounded bg-gray-100 px-2 py-0.5 font-mono text-sm dark:bg-gray-800">
                  {log.ip_address || "N/A"}
                </code>
              </DetailRow>
            </CardContent>
          </Card>

          {/* Metadata Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Info className="h-4 w-4" />
                Metadata
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <DetailRow label="Log ID">
                <div className="flex items-center gap-2">
                  <code className="rounded bg-gray-100 px-2 py-0.5 font-mono text-xs dark:bg-gray-800">
                    {log.id}
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
              <DetailRow label="Timestamp" value={formatDateTime(log.created_at)} />
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
