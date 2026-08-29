"use client";

import { useState, useEffect, useMemo } from "react";
import { PageHeader } from "@/components/common/page-header";
import { EmptyState } from "@/components/common/empty-state";
import { LoadingState } from "@/components/common/loading-state";
import { Pagination } from "@/components/common/pagination";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { AuditLogService, UserService } from "@/services";
import type { AuditLog, User } from "@/types";
import { formatDateTime } from "@/lib/utils";
import {
  Search,
  Filter,
  RotateCcw,
  Activity,
  CheckCircle,
  XCircle,
  AlertTriangle,
} from "lucide-react";

interface Filters {
  search: string;
  userId: string;
  module: string;
  status: string;
  startDate: string;
  endDate: string;
}

const initialFilters: Filters = {
  search: "",
  userId: "",
  module: "",
  status: "",
  startDate: "",
  endDate: "",
};

const MODULES = ["Persons", "Users", "Roles", "Reports", "Dashboard", "Settings"];

const PAGE_SIZE = 15;

export default function AuditLogsPage() {
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<Filters>(initialFilters);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterLogs();
  }, [filters]);

  function loadData() {
    try {
      const allLogs = AuditLogService.getAll();
      setLogs(allLogs);
      const allUsers = UserService.getAll();
      setUsers(allUsers);
    } finally {
      setLoading(false);
    }
  }

  function filterLogs() {
    const filterParams: any = {};
    if (filters.module) filterParams.module = filters.module;
    if (filters.status) filterParams.status = filters.status;
    if (filters.userId) filterParams.userId = filters.userId;
    if (filters.startDate) filterParams.startDate = filters.startDate;
    if (filters.endDate) filterParams.endDate = filters.endDate;
    if (filters.search) filterParams.search = filters.search;

    const filtered = AuditLogService.getFiltered(filterParams);
    setLogs(filtered);
    setCurrentPage(1);
  }

  function handleReset() {
    setFilters(initialFilters);
    const allLogs = AuditLogService.getAll();
    setLogs(allLogs);
    setCurrentPage(1);
  }

  const totalPages = Math.ceil(logs.length / PAGE_SIZE);
  const paginatedLogs = logs.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  const userNameMap = useMemo(() => {
    const map: Record<string, string> = {};
    users.forEach((u) => {
      map[u.id] = u.name;
    });
    return map;
  }, [users]);

  const statusIcon = (status: AuditLog["status"]) => {
    switch (status) {
      case "success":
        return <CheckCircle className="h-4 w-4 text-orange-600 dark:text-orange-400" />;
      case "failed":
        return <XCircle className="h-4 w-4 text-red-600 dark:text-red-400" />;
      case "warning":
        return <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />;
      default:
        return <Activity className="h-4 w-4 text-gray-400" />;
    }
  };

  const statusBadgeVariant = (status: AuditLog["status"]) => {
    switch (status) {
      case "success":
        return "success" as const;
      case "failed":
        return "destructive" as const;
      case "warning":
        return "warning" as const;
      default:
        return "secondary" as const;
    }
  };

  const successCount = logs.filter((l) => l.status === "success").length;
  const failedCount = logs.filter((l) => l.status === "failed").length;
  const warningCount = logs.filter((l) => l.status === "warning").length;

  if (loading) {
    return <LoadingState fullPage message="Loading audit logs..." />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Audit Logs"
        description="Track all system activities and changes"
      />

      {/* Stats Row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800">
              <Activity className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {logs.length}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Total Logs
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-100 dark:bg-orange-900/30">
              <CheckCircle className="h-5 w-5 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                {successCount}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Successful
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-100 dark:bg-red-900/30">
              <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                {failedCount}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Failed</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-900/30">
              <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                {warningCount}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Warnings
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-6">
            <div className="lg:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search logs..."
                  value={filters.search}
                  onChange={(e) =>
                    setFilters((f) => ({ ...f, search: e.target.value }))
                  }
                  className="flex h-10 w-full rounded-lg border border-gray-300 bg-white pl-10 pr-3 py-2 text-sm transition-colors placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6B00] focus-visible:ring-offset-1 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:placeholder:text-gray-400"
                />
              </div>
            </div>

            <Select
              label="User"
              value={filters.userId}
              onChange={(e) =>
                setFilters((f) => ({ ...f, userId: e.target.value }))
              }
            >
              <option value="">All Users</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </Select>

            <Select
              label="Module"
              value={filters.module}
              onChange={(e) =>
                setFilters((f) => ({ ...f, module: e.target.value }))
              }
            >
              <option value="">All Modules</option>
              {MODULES.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </Select>

            <Select
              label="Status"
              value={filters.status}
              onChange={(e) =>
                setFilters((f) => ({ ...f, status: e.target.value }))
              }
            >
              <option value="">All Status</option>
              <option value="success">Success</option>
              <option value="failed">Failed</option>
              <option value="warning">Warning</option>
            </Select>

            <div className="flex gap-2">
              <div className="w-full">
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Date From
                </label>
                <Input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) =>
                    setFilters((f) => ({ ...f, startDate: e.target.value }))
                  }
                />
              </div>
            </div>

            <div className="flex gap-2">
              <div className="w-full">
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Date To
                </label>
                <Input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) =>
                    setFilters((f) => ({ ...f, endDate: e.target.value }))
                  }
                />
              </div>
            </div>
          </div>

          <div className="mt-4 flex gap-2">
            <Button variant="secondary" onClick={handleReset}>
              <RotateCcw className="mr-2 h-4 w-4" />
              Reset Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Data Table */}
      <Card>
        <CardContent className="p-0">
          {paginatedLogs.length === 0 ? (
            <EmptyState
              icon={<Activity className="h-8 w-8" />}
              title="No audit logs found"
              description="No logs match your current filters. Try adjusting your search criteria."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                      Date/Time
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                      User
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                      Action
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                      Module
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                      Record
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                      IP Address
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {paginatedLogs.map((log) => (
                    <tr
                      key={log.id}
                      className="transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50"
                    >
                      <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                        {formatDateTime(log.createdAt)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#FFF3EB] text-xs font-medium text-[#FF6B00] dark:bg-[#E55A00]/20 dark:text-[#FF9A5C]">
                            {log.userName
                              .split(" ")
                              .map((n) => n[0])
                              .join("")
                              .slice(0, 2)
                              .toUpperCase()}
                          </div>
                          <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            {log.userName}
                          </span>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                        {log.action}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <Badge variant="secondary">{log.module}</Badge>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                        {log.recordLabel}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          {statusIcon(log.status)}
                          <Badge variant={statusBadgeVariant(log.status)}>
                            {log.status.charAt(0).toUpperCase() +
                              log.status.slice(1)}
                          </Badge>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500 dark:text-gray-400 font-mono">
                        {log.ipAddress}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {logs.length > PAGE_SIZE && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={logs.length}
              pageSize={PAGE_SIZE}
              onPageChange={setCurrentPage}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
