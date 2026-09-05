"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/common/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import {
  ChevronDown,
  ChevronRight,
  Search,
  Lock,
  Key,
  Shield,
  ShieldCheck,
  AlertCircle,
  RefreshCw,
  SlidersHorizontal,
  X,
  ArrowUp,
  ArrowDown,
  Loader2,
  Eye,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  permissionService,
  type PermissionItem,
} from "@/services/permission.service";

interface GroupedPermissions {
  group_name: string;
  permissions: PermissionItem[];
}

interface Filters {
  group_name: string;
  is_active: string;
  sort_by: string;
  sort_order: string;
}

const defaultFilters: Filters = {
  group_name: "",
  is_active: "",
  sort_by: "created_at",
  sort_order: "desc",
};

export default function PermissionsPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  const [permissions, setPermissions] = useState<PermissionItem[]>([]);
  const [groupNames, setGroupNames] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<Filters>(defaultFilters);

  const fetchPermissions = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const [permRes, groupsRes] = await Promise.allSettled([
        permissionService.getAll(),
        permissionService.groups(),
      ]);

      if (permRes.status === "fulfilled" && permRes.value.data.status === "success") {
        setPermissions(permRes.value.data.data.items);
      }
      if (groupsRes.status === "fulfilled" && groupsRes.value.data.status === "success") {
        const unique = Array.from(new Set(groupsRes.value.data.data.map((g) => g.group_name)));
        setGroupNames(unique);
      }
    } catch {
      setError("Failed to load permissions. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPermissions();
  }, [fetchPermissions]);

  const groupedPermissions = useMemo<GroupedPermissions[]>(() => {
    let filtered = [...permissions];

    if (filters.group_name) {
      filtered = filtered.filter((p) => p.group_name === filters.group_name);
    }
    if (filters.is_active === "active") {
      filtered = filtered.filter((p) => p.is_active);
    } else if (filters.is_active === "inactive") {
      filtered = filtered.filter((p) => !p.is_active);
    }

    const lower = searchQuery.toLowerCase();
    if (lower) {
      filtered = filtered.filter(
        (p) =>
          p.permission_name.toLowerCase().includes(lower) ||
          p.display_name.toLowerCase().includes(lower) ||
          p.group_name.toLowerCase().includes(lower)
      );
    }

    filtered.sort((a, b) => {
      const field = filters.sort_by as keyof PermissionItem;
      const aVal = String(a[field] ?? "");
      const bVal = String(b[field] ?? "");
      const cmp = aVal.localeCompare(bVal);
      return filters.sort_order === "asc" ? cmp : -cmp;
    });

    const groups: Record<string, PermissionItem[]> = {};
    filtered.forEach((p) => {
      if (!groups[p.group_name]) groups[p.group_name] = [];
      groups[p.group_name].push(p);
    });
    return Object.entries(groups).map(([group_name, perms]) => ({
      group_name,
      permissions: perms,
    }));
  }, [permissions, filters, searchQuery]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.group_name) count++;
    if (filters.is_active) count++;
    if (filters.sort_by !== "created_at") count++;
    if (filters.sort_order !== "desc") count++;
    return count;
  }, [filters]);

  function toggleGroupExpand(name: string) {
    setExpandedGroups((prev) => ({ ...prev, [name]: !prev[name] }));
  }

  function expandAll() {
    const all: Record<string, boolean> = {};
    groupedPermissions.forEach((g) => (all[g.group_name] = true));
    setExpandedGroups(all);
  }

  function collapseAll() {
    setExpandedGroups({});
  }

  function clearFilters() {
    setFilters(defaultFilters);
    setSearchQuery("");
  }

  function updateFilter(key: keyof Filters, value: string) {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }

  const groupIcons: Record<string, typeof Shield> = {
    "PERSON MANAGEMENT": Shield,
    "USER MANAGEMENT": Key,
    "ROLE MANAGEMENT": ShieldCheck,
    "TERRITORY MANAGEMENT": Shield,
    "REPORT MANAGEMENT": Shield,
    "SYSTEM MANAGEMENT": Lock,
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Permissions"
          description="View all system permissions organized by module"
          breadcrumbs={[{ label: "Dashboard" }, { label: "Permissions" }]}
        />
        <Card className="p-6 text-center">
          <Loader2 className="mx-auto h-6 w-6 animate-spin text-[#FF6B00]" />
          <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">Loading permissions...</p>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Permissions"
          description="View all system permissions organized by module"
          breadcrumbs={[{ label: "Dashboard" }, { label: "Permissions" }]}
        />
        <Card className="p-12 text-center">
          <AlertCircle className="mx-auto h-8 w-8 text-red-500" />
          <p className="mt-4 text-sm text-red-600 dark:text-red-400">{error}</p>
          <Button variant="outline" size="sm" onClick={fetchPermissions} className="mt-4">
            <RefreshCw className="mr-2 h-4 w-4" />
            Retry
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Permissions"
        description="View all system permissions organized by module"
        breadcrumbs={[{ label: "Dashboard" }, { label: "Permissions" }]}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={expandAll}>
              Expand All
            </Button>
            <Button variant="outline" size="sm" onClick={collapseAll}>
              Collapse All
            </Button>
          </div>
        }
      />

      {/* Search + Filters */}
      <Card className="p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Search permissions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex items-center gap-2">
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
            {activeFilterCount > 0 && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                <X className="mr-1 h-3 w-3" />
                Clear
              </Button>
            )}
          </div>
        </div>

        {showFilters && (
          <div className="mt-4 grid grid-cols-1 gap-4 border-t border-gray-100 pt-4 sm:grid-cols-2 lg:grid-cols-2 dark:border-gray-800">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-gray-500 dark:text-gray-400">
                Group
              </label>
              <select
                value={filters.group_name}
                onChange={(e) => updateFilter("group_name", e.target.value)}
                className="block w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 transition-colors focus:border-[#FF6B00] focus:outline-none focus:ring-1 focus:ring-[#FF6B00]/30 dark:border-white/10 dark:bg-[#1A1D2E] dark:text-white"
              >
                <option value="">All Groups</option>
                {groupNames.map((name, idx) => (
                  <option key={`${name}-${idx}`} value={name}>
                    {name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-gray-500 dark:text-gray-400">
                Status
              </label>
              <select
                value={filters.is_active}
                onChange={(e) => updateFilter("is_active", e.target.value)}
                className="block w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 transition-colors focus:border-[#FF6B00] focus:outline-none focus:ring-1 focus:ring-[#FF6B00]/30 dark:border-white/10 dark:bg-[#1A1D2E] dark:text-white"
              >
                <option value="">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-gray-500 dark:text-gray-400">
                Sort By
              </label>
              <select
                value={filters.sort_by}
                onChange={(e) => updateFilter("sort_by", e.target.value)}
                className="block w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 transition-colors focus:border-[#FF6B00] focus:outline-none focus:ring-1 focus:ring-[#FF6B00]/30 dark:border-white/10 dark:bg-[#1A1D2E] dark:text-white"
              >
                <option value="created_at">Date Created</option>
                <option value="permission_name">Permission Name</option>
                <option value="display_name">Display Name</option>
                <option value="group_name">Group Name</option>
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-gray-500 dark:text-gray-400">
                Order
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => updateFilter("sort_order", "asc")}
                  className={cn(
                    "flex flex-1 items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-sm transition-colors",
                    filters.sort_order === "asc"
                      ? "border-[#FF6B00] bg-[#FF6B00]/5 text-[#FF6B00]"
                      : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50 dark:border-white/10 dark:bg-[#1A1D2E] dark:text-gray-400 dark:hover:bg-white/5"
                  )}
                >
                  <ArrowUp className="h-3.5 w-3.5" />
                  Asc
                </button>
                <button
                  type="button"
                  onClick={() => updateFilter("sort_order", "desc")}
                  className={cn(
                    "flex flex-1 items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-sm transition-colors",
                    filters.sort_order === "desc"
                      ? "border-[#FF6B00] bg-[#FF6B00]/5 text-[#FF6B00]"
                      : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50 dark:border-white/10 dark:bg-[#1A1D2E] dark:text-gray-400 dark:hover:bg-white/5"
                  )}
                >
                  <ArrowDown className="h-3.5 w-3.5" />
                  Desc
                </button>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Permission Groups */}
      <div className="space-y-4">
        {groupedPermissions.map((group) => {
          const expanded = expandedGroups[group.group_name] !== false;
          const Icon = groupIcons[group.group_name] || Shield;
          return (
            <Card key={group.group_name} className="overflow-hidden">
              <button
                type="button"
                onClick={() => toggleGroupExpand(group.group_name)}
                className="flex w-full items-center justify-between px-6 py-4 text-left hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#FFF3EB] text-[#FF6B00] dark:bg-[#E55A00]/20 dark:text-[#FF9A5C]">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                      {group.group_name}
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {group.permissions.length} permission(s)
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant="secondary">{group.permissions.length}</Badge>
                  {expanded ? (
                    <ChevronDown className="h-4 w-4 text-gray-400" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-gray-400" />
                  )}
                </div>
              </button>

              {expanded && (
                <div className="border-t border-gray-100 dark:border-gray-800">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-50 dark:bg-gray-800/50">
                        <th className="px-6 py-2.5 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                          Permission
                        </th>
                        <th className="px-6 py-2.5 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                          Display Name
                        </th>
                        <th className="px-6 py-2.5 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                          Status
                        </th>
                        <th className="px-6 py-2.5 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                          <span className="sr-only">Actions</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                      {group.permissions.map((perm) => (
                        <tr
                          key={perm.id}
                          className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                          onClick={() => router.push(`/permissions/${perm.id}`)}
                        >
                          <td className="px-6 py-3">
                            <div className="flex items-center gap-2">
                              <div className="flex h-6 w-6 items-center justify-center rounded bg-orange-50 dark:bg-orange-900/20">
                                <Key className="h-3 w-3 text-orange-600 dark:text-orange-400" />
                              </div>
                              <code className="text-sm font-mono font-medium text-gray-800 dark:text-gray-200">
                                {perm.permission_name}
                              </code>
                            </div>
                          </td>
                          <td className="px-6 py-3 text-sm text-gray-600 dark:text-gray-400">
                            {perm.display_name}
                          </td>
                          <td className="px-6 py-3">
                            <Badge
                              variant={perm.is_active ? "default" : "secondary"}
                              className={
                                perm.is_active
                                  ? "bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400"
                                  : "bg-gray-100 text-gray-600 dark:bg-gray-500/20 dark:text-gray-400"
                              }
                            >
                              {perm.is_active ? "Active" : "Inactive"}
                            </Badge>
                          </td>
                          <td className="px-6 py-3">
                            <div className="flex items-center justify-end">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  router.push(`/permissions/${perm.id}`);
                                }}
                                className="rounded-lg p-1.5 text-gray-400 hover:bg-[#FFF3EB] hover:text-[#FF6B00] dark:hover:bg-[#E55A00]/20 dark:hover:text-[#FF9A5C] transition-colors"
                                title="View Details"
                              >
                                <Eye className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          );
        })}

        {groupedPermissions.length === 0 && (
          <Card className="p-12 text-center">
            <Lock className="mx-auto h-8 w-8 text-gray-400" />
            <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
              No permissions match your search or filters.
            </p>
            {activeFilterCount > 0 && (
              <Button variant="outline" size="sm" onClick={clearFilters} className="mt-3">
                Clear Filters
              </Button>
            )}
          </Card>
        )}
      </div>
    </div>
  );
}
