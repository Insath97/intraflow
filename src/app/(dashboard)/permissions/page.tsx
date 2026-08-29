"use client";

import { useState, useMemo } from "react";
import { PERMISSION_GROUPS } from "@/lib/constants";
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
} from "lucide-react";

export default function PermissionsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

  const totalPermissions = useMemo(
    () => PERMISSION_GROUPS.reduce((acc, g) => acc + g.permissions.length, 0),
    []
  );

  const filteredGroups = useMemo(() => {
    if (!searchQuery.trim()) return PERMISSION_GROUPS;
    const lower = searchQuery.toLowerCase();
    return PERMISSION_GROUPS.map((group) => ({
      ...group,
      permissions: group.permissions.filter(
        (p) =>
          p.name.toLowerCase().includes(lower) ||
          p.description.toLowerCase().includes(lower) ||
          p.id.toLowerCase().includes(lower)
      ),
    })).filter((group) => group.permissions.length > 0);
  }, [searchQuery]);

  function toggleGroupExpand(name: string) {
    setExpandedGroups((prev) => ({ ...prev, [name]: !prev[name] }));
  }

  function expandAll() {
    const all: Record<string, boolean> = {};
    PERMISSION_GROUPS.forEach((g) => (all[g.name] = true));
    setExpandedGroups(all);
  }

  function collapseAll() {
    setExpandedGroups({});
  }

  const groupIcons: Record<string, typeof Shield> = {
    "PERSON MANAGEMENT": Shield,
    "USER MANAGEMENT": Key,
    "ROLE MANAGEMENT": ShieldCheck,
    "TERRITORY MANAGEMENT": Shield,
    "REPORT MANAGEMENT": Shield,
    "SYSTEM MANAGEMENT": Lock,
  };

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

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#FFF3EB] text-[#FF6B00] dark:bg-[#E55A00]/20 dark:text-[#FF9A5C]">
              <Key className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {totalPermissions}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Permissions</p>
            </div>
          </div>
        </Card>
        <Card className="p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#FFF3EB] text-[#FF6B00] dark:bg-[#E55A00]/20 dark:text-[#FF9A5C]">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {PERMISSION_GROUPS.length}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Permission Groups</p>
            </div>
          </div>
        </Card>
        {PERMISSION_GROUPS.slice(0, 2).map((group) => (
          <Card key={group.name} className="p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#FFF3EB] text-[#FF6B00] dark:bg-[#E55A00]/20 dark:text-[#FF9A5C]">
                <Shield className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {group.permissions.length}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-[140px]">
                  {group.name}
                </p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <Input
          placeholder="Search permissions..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Permission Groups */}
      <div className="space-y-4">
        {filteredGroups.map((group) => {
          const expanded = expandedGroups[group.name] !== false;
          const Icon = groupIcons[group.name] || Shield;
          return (
            <Card key={group.name} className="overflow-hidden">
              <button
                type="button"
                onClick={() => toggleGroupExpand(group.name)}
                className="flex w-full items-center justify-between px-6 py-4 text-left hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#FFF3EB] text-[#FF6B00] dark:bg-[#E55A00]/20 dark:text-[#FF9A5C]">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                      {group.name}
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
                          Description
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                      {group.permissions.map((perm) => (
                        <tr
                          key={perm.id}
                          className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                        >
                          <td className="px-6 py-3">
                            <div className="flex items-center gap-2">
                              <div className="flex h-6 w-6 items-center justify-center rounded bg-orange-50 dark:bg-orange-900/20">
                                <Key className="h-3 w-3 text-orange-600 dark:text-orange-400" />
                              </div>
                              <code className="text-sm font-mono font-medium text-gray-800 dark:text-gray-200">
                                {perm.name}
                              </code>
                            </div>
                          </td>
                          <td className="px-6 py-3 text-sm text-gray-600 dark:text-gray-400">
                            {perm.description}
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

        {filteredGroups.length === 0 && (
          <Card className="p-12 text-center">
            <Lock className="mx-auto h-8 w-8 text-gray-400" />
            <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
              No permissions match your search.
            </p>
          </Card>
        )}
      </div>
    </div>
  );
}
