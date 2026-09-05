"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/common/page-header";
import { EmptyState } from "@/components/common/empty-state";
import { LoadingState } from "@/components/common/loading-state";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { auditLogsApi, usersApi, MODULES, ACTIONS } from "@/lib/api";
import type { AuditLogItem, AuditLogListParams } from "@/lib/api/audit-logs";
import type { UserItem } from "@/lib/api/users";
import { formatDateTime } from "@/lib/utils";
import { useToast } from "@/components/ui/toast";
import {
  Search,
  RotateCcw,
  Activity,
  Download,
  SlidersHorizontal,
  X,
  Calendar,
  ChevronDown,
  ClipboardList,
  ChevronsLeft,
  ChevronsRight,
  ChevronLeft,
  ChevronRight,
  Plus,
  Pencil,
  Trash2,
  LogIn,
} from "lucide-react";
import { cn } from "@/lib/utils";

const PAGE_SIZE_OPTIONS = [5, 10, 25, 50, 100];

function extractUserItems(data: unknown): UserItem[] {
  if (Array.isArray(data)) return data as UserItem[];
  if (data && typeof data === "object") {
    const obj = data as Record<string, unknown>;
    if (Array.isArray(obj.data)) return obj.data as UserItem[];
    if (Array.isArray(obj.items)) return obj.items as UserItem[];
  }
  return [];
}

export default function AuditLogsPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [users, setUsers] = useState<UserItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [moduleFilter, setModuleFilter] = useState("");
  const [actionFilter, setActionFilter] = useState("");
  const [userFilter, setUserFilter] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const [showFilters, setShowFilters] = useState(false);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Reset to page 1 on filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, moduleFilter, actionFilter, userFilter, startDate, endDate, pageSize]);

  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true);
      const params: AuditLogListParams = {
        page: currentPage,
        size: pageSize,
      };
      if (moduleFilter) params.module = moduleFilter;
      if (actionFilter) params.action = actionFilter;
      if (userFilter) params.user_id = userFilter;
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;

      const response = await auditLogsApi.getAll(params);
      const result = response.data;

      if (result.status === "success" && result.data) {
        const data = result.data;
        let items = data.items || [];

        // Client-side search if backend doesn't support it
        if (debouncedSearch) {
          const lower = debouncedSearch.toLowerCase();
          items = items.filter(
            (log) =>
              log.user_name?.toLowerCase().includes(lower) ||
              log.module?.toLowerCase().includes(lower) ||
              log.action?.toLowerCase().includes(lower) ||
              log.description?.toLowerCase().includes(lower) ||
              log.ip_address?.toLowerCase().includes(lower)
          );
        }

        setLogs(items);
        setTotalCount(data.total_count || 0);
        setTotalPages(data.total_pages || 1);
      } else {
        setLogs([]);
        setTotalCount(0);
        setTotalPages(1);
      }
    } catch (err) {
      console.error("Failed to load activity logs:", err);
      toast("Failed to load activity logs", "error");
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, moduleFilter, actionFilter, userFilter, startDate, endDate, debouncedSearch, toast]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  useEffect(() => {
    async function loadUsers() {
      try {
        const usersRes = await usersApi.getAll({ size: 200 });
        if (usersRes.data.status === "success") {
          setUsers(extractUserItems(usersRes.data.data));
        }
      } catch {
        // Non-critical
      }
    }
    loadUsers();
  }, []);

  const handleReset = useCallback(() => {
    setSearchQuery("");
    setModuleFilter("");
    setActionFilter("");
    setUserFilter("");
    setStartDate("");
    setEndDate("");
  }, []);

  const hasActiveFilters = searchQuery || moduleFilter || actionFilter || userFilter || startDate || endDate;

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (moduleFilter) count++;
    if (actionFilter) count++;
    if (userFilter) count++;
    if (startDate) count++;
    if (endDate) count++;
    return count;
  }, [moduleFilter, actionFilter, userFilter, startDate, endDate]);

  // Stats from current page data
  const stats = useMemo(() => {
    const all = logs;
    return {
      total: totalCount,
      creates: all.filter((l) => l.action === "CREATE").length,
      updates: all.filter((l) => l.action === "UPDATE").length,
      deletes: all.filter((l) => l.action === "DELETE" || l.action === "BULK_DELETE").length,
      logins: all.filter((l) => l.action === "login").length,
    };
  }, [logs, totalCount]);

  const handleExport = useCallback(() => {
    const headers = ["Date/Time", "User", "Module", "Action", "Description", "IP Address"];
    const rows = logs.map((log) => [
      formatDateTime(log.created_at),
      log.user_name,
      log.module,
      log.action,
      log.description,
      log.ip_address,
    ]);

    const csv = [headers.join(","), ...rows.map((r) => r.map((c) => `"${c}"`).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `activity-logs-export-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast("Export completed successfully", "success");
  }, [logs, toast]);

  const userNameMap = useMemo(() => {
    const map: Record<string, string> = {};
    users.forEach((u) => {
      map[u.id] = u.full_name;
    });
    return map;
  }, [users]);

  const actionBadgeColor = (action: string) => {
    switch (action) {
      case "CREATE":
        return "bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400";
      case "UPDATE":
        return "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400";
      case "DELETE":
      case "BULK_DELETE":
        return "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400";
      case "login":
        return "bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-400";
      case "logout":
        return "bg-gray-100 text-gray-700 dark:bg-gray-500/20 dark:text-gray-400";
      case "APPROVED":
        return "bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400";
      case "REJECTED":
        return "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400";
      default:
        return "bg-gray-100 text-gray-700 dark:bg-gray-500/20 dark:text-gray-400";
    }
  };

  const actionIcon = (action: string) => {
    switch (action) {
      case "CREATE":
        return <Plus className="h-3.5 w-3.5" />;
      case "UPDATE":
        return <Pencil className="h-3.5 w-3.5" />;
      case "DELETE":
      case "BULK_DELETE":
        return <Trash2 className="h-3.5 w-3.5" />;
      case "login":
        return <LogIn className="h-3.5 w-3.5" />;
      default:
        return <Activity className="h-3.5 w-3.5" />;
    }
  };

  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalCount);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Activity Logs"
        description="Track all system activities, changes, and user actions"
        breadcrumbs={[
          { label: "Dashboard", onClick: () => router.push("/dashboard") },
          { label: "Activity Logs" },
        ]}
        actions={
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        }
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
        <StatCard
          icon={<ClipboardList className="h-5 w-5" />}
          value={loading ? "—" : stats.total}
          label="Total Logs"
          color="gray"
        />
        <StatCard
          icon={<Plus className="h-5 w-5" />}
          value={loading ? "—" : stats.creates}
          label="Creates"
          color="green"
        />
        <StatCard
          icon={<Pencil className="h-5 w-5" />}
          value={loading ? "—" : stats.updates}
          label="Updates"
          color="blue"
        />
        <StatCard
          icon={<Trash2 className="h-5 w-5" />}
          value={loading ? "—" : stats.deletes}
          label="Deletes"
          color="red"
        />
        <StatCard
          icon={<LogIn className="h-5 w-5" />}
          value={loading ? "—" : stats.logins}
          label="Logins"
          color="purple"
        />
      </div>

      {/* Search + Collapsible Filters */}
      <Card className="p-4">
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search by user, module, action, description, IP..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9"
              />
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className={cn(
                  "relative min-w-[120px]",
                  showFilters && "border-[#FF6B00] text-[#FF6B00]"
                )}
              >
                <SlidersHorizontal className="mr-1.5 h-4 w-4" />
                Filters
                {activeFilterCount > 0 && (
                  <span className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-[#FF6B00] text-[10px] text-white">
                    {activeFilterCount}
                  </span>
                )}
              </Button>
              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={handleReset}>
                  <X className="mr-1 h-3 w-3" />
                  Clear
                </Button>
              )}
            </div>
          </div>

        {showFilters && (
          <div className="mt-4 grid grid-cols-1 gap-4 border-t border-gray-100 pt-4 sm:grid-cols-2 lg:grid-cols-3 dark:border-gray-800">
            <FilterSelect
              label="Module"
              value={moduleFilter}
              onChange={setModuleFilter}
              options={MODULES.map((m) => ({ value: m, label: m }))}
              placeholder="All Modules"
            />
            <FilterSelect
              label="Action"
              value={actionFilter}
              onChange={setActionFilter}
              options={ACTIONS.map((a) => ({ value: a, label: a }))}
              placeholder="All Actions"
            />
            <FilterSelect
              label="User"
              value={userFilter}
              onChange={setUserFilter}
              options={users.map((u) => ({ value: u.id, label: u.full_name }))}
              placeholder="All Users"
            />
            <div>
              <label className="mb-1.5 block text-xs font-medium text-gray-500 dark:text-gray-400">
                Date From
              </label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="h-9"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-gray-500 dark:text-gray-400">
                Date To
              </label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="h-9"
              />
            </div>
          </div>
        )}

        {hasActiveFilters && (
          <div className="mt-3 flex flex-wrap gap-2 border-t border-gray-100 pt-3 dark:border-gray-800">
            {moduleFilter && (
              <FilterChip label={`Module: ${moduleFilter}`} onRemove={() => setModuleFilter("")} />
            )}
            {actionFilter && (
              <FilterChip label={`Action: ${actionFilter}`} onRemove={() => setActionFilter("")} />
            )}
            {userFilter && (
              <FilterChip
                label={`User: ${userNameMap[userFilter] || userFilter}`}
                onRemove={() => setUserFilter("")}
              />
            )}
            {startDate && (
              <FilterChip label={`From: ${startDate}`} onRemove={() => setStartDate("")} />
            )}
            {endDate && (
              <FilterChip label={`To: ${endDate}`} onRemove={() => setEndDate("")} />
            )}
          </div>
        )}
        </div>
      </Card>

      {/* Data Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <LoadingState message="Loading activity logs..." />
          ) : logs.length === 0 ? (
            <EmptyState
              icon={<ClipboardList className="h-8 w-8" />}
              title="No activity logs found"
              description="No logs match your current filters. Try adjusting your search criteria."
              action={
                hasActiveFilters
                  ? { label: "Reset Filters", onClick: handleReset }
                  : undefined
              }
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/50">
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                      Date / Time
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                      User
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                      Module
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                      Action
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                      Description
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                      IP Address
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {logs.map((log) => (
                    <tr
                      key={log.id}
                      className="transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50"
                    >
                      <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                        {formatDateTime(log.created_at)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#FFF3EB] text-xs font-medium text-[#FF6B00] dark:bg-[#E55A00]/20 dark:text-[#FF9A5C]">
                            {log.user_name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")
                              .slice(0, 2)
                              .toUpperCase()}
                          </div>
                          <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            {log.user_name}
                          </span>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <Badge variant="secondary">{log.module}</Badge>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${actionBadgeColor(log.action)}`}
                        >
                          {actionIcon(log.action)}
                          {log.action}
                        </span>
                      </td>
                      <td className="max-w-[300px] truncate px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                        {log.description || "—"}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 font-mono text-sm text-gray-500 dark:text-gray-400">
                        {log.ip_address || "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination Bar */}
          {totalCount > 0 && (
            <div className="flex flex-col gap-3 border-t border-gray-200 px-4 py-3 sm:flex-row sm:items-center sm:justify-between dark:border-gray-700">
              <div className="flex items-center gap-4">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Showing <span className="font-medium text-gray-700 dark:text-gray-300">{startItem}</span> to{" "}
                  <span className="font-medium text-gray-700 dark:text-gray-300">{endItem}</span> of{" "}
                  <span className="font-medium text-gray-700 dark:text-gray-300">{totalCount}</span> logs
                </p>
                <div className="flex items-center gap-1.5">
                  <label className="text-xs text-gray-500 dark:text-gray-400">Show</label>
                  <select
                    value={pageSize}
                    onChange={(e) => setPageSize(Number(e.target.value))}
                    className="h-8 rounded-md border border-gray-300 bg-white px-2 text-xs dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                  >
                    {PAGE_SIZE_OPTIONS.map((size) => (
                      <option key={size} value={size}>
                        {size}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                >
                  <ChevronsLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>

                {getPageNumbers(currentPage, totalPages).map((page, i) =>
                  page === "..." ? (
                    <span
                      key={`ellipsis-${i}`}
                      className="px-1 text-sm text-gray-400"
                    >
                      ...
                    </span>
                  ) : (
                    <Button
                      key={page}
                      variant={currentPage === page ? "default" : "outline"}
                      size="icon"
                      className={cn(
                        "h-8 w-8",
                        currentPage === page &&
                          "bg-[#FF6B00] text-white hover:bg-[#E55A00]"
                      )}
                      onClick={() => setCurrentPage(page)}
                    >
                      {page}
                    </Button>
                  )
                )}

                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                >
                  <ChevronsRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function getPageNumbers(current: number, total: (number | "...")[]): (number | "...")[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }
  const pages: (number | "...")[] = [1];
  if (current > 3) pages.push("...");
  for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++) {
    pages.push(i);
  }
  if (current < total - 2) pages.push("...");
  pages.push(total);
  return pages;
}

function StatCard({
  icon,
  value,
  label,
  color,
}: {
  icon: React.ReactNode;
  value: number | string;
  label: string;
  color: "gray" | "green" | "blue" | "red" | "purple";
}) {
  const colorClasses = {
    gray: "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400",
    green: "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400",
    blue: "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400",
    red: "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400",
    purple: "bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400",
  };
  const valueColors = {
    gray: "text-gray-900 dark:text-gray-100",
    green: "text-green-600 dark:text-green-400",
    blue: "text-blue-600 dark:text-blue-400",
    red: "text-red-600 dark:text-red-400",
    purple: "text-purple-600 dark:text-purple-400",
  };

  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-4">
        <div className={cn("flex h-10 w-10 items-center justify-center rounded-lg", colorClasses[color])}>
          {icon}
        </div>
        <div>
          <p className={cn("text-2xl font-bold", valueColors[color])}>{value}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  placeholder: string;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium text-gray-500 dark:text-gray-400">
        {label}
      </label>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex h-9 w-full appearance-none rounded-lg border border-gray-300 bg-white px-3 pr-8 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
        >
          <option value="">{placeholder}</option>
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
      </div>
    </div>
  );
}

function FilterChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-white px-2.5 py-1 text-xs font-medium text-gray-700 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300">
      {label}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
        }}
        className="ml-0.5 rounded-full p-0.5 transition-colors hover:bg-gray-200 dark:hover:bg-gray-700"
      >
        <X className="h-3 w-3" />
      </button>
    </span>
  );
}
