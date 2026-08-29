"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { PersonService, TerritoryService } from "@/services";
import type { Person, District } from "@/types";
import { useAuthStore } from "@/lib/auth";
import { useToast } from "@/components/ui/toast";
import { PageHeader } from "@/components/common/page-header";
import { StatusBadge } from "@/components/common/status-badge";
import { EmptyState } from "@/components/common/empty-state";
import { LoadingState } from "@/components/common/loading-state";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { Pagination } from "@/components/common/pagination";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Search,
  Plus,
  Download,
  MoreHorizontal,
  Eye,
  Pencil,
  Trash2,
  Users,
  Filter,
  X,
} from "lucide-react";
import { formatDate } from "@/lib/utils";

type GenderFilter = "" | "male" | "female" | "other";
type StatusFilter = "" | "active" | "inactive" | "deceased" | "pending";
type DisabilityFilter = string;

export default function PersonsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { hasPermission } = useAuthStore();

  const [persons, setPersons] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [genderFilter, setGenderFilter] = useState<GenderFilter>("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("");
  const [disabilityFilter, setDisabilityFilter] = useState<DisabilityFilter>("");
  const [districtFilter, setDistrictFilter] = useState("");
  const [districts, setDistricts] = useState<District[]>([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [personToDelete, setPersonToDelete] = useState<Person | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  useEffect(() => {
    const data = PersonService.getAll();
    setPersons(data);
    setDistricts(TerritoryService.getDistricts());
    setLoading(false);
  }, []);

  const filteredPersons = useMemo(() => {
    let result = persons;

    if (searchQuery) {
      const lower = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.fullName.toLowerCase().includes(lower) ||
          p.registrationNo.toLowerCase().includes(lower) ||
          p.nicNumber.toLowerCase().includes(lower) ||
          p.contactNumber.includes(searchQuery)
      );
    }

    if (genderFilter) {
      result = result.filter((p) => p.gender === genderFilter);
    }

    if (statusFilter) {
      result = result.filter((p) => p.status === statusFilter);
    }

    if (disabilityFilter) {
      result = result.filter((p) =>
        p.disabilityType.toLowerCase().includes(disabilityFilter.toLowerCase())
      );
    }

    if (districtFilter) {
      result = result.filter((p) => p.districtId === districtFilter);
    }

    return result;
  }, [persons, searchQuery, genderFilter, statusFilter, disabilityFilter, districtFilter]);

  const totalPages = Math.ceil(filteredPersons.length / pageSize);
  const paginatedPersons = filteredPersons.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, genderFilter, statusFilter, disabilityFilter, districtFilter]);

  const getDistrictName = useCallback(
    (districtId: string) => {
      const d = districts.find((d) => d.id === districtId);
      return d?.name || "N/A";
    },
    [districts]
  );

  const handleDelete = useCallback((person: Person) => {
    setPersonToDelete(person);
    setDeleteDialogOpen(true);
  }, []);

  const confirmDelete = useCallback(() => {
    if (!personToDelete) return;
    setDeleting(true);

    try {
      PersonService.remove(personToDelete.id);
      setPersons((prev) => prev.filter((p) => p.id !== personToDelete.id));
      toast("Person deleted successfully", "success");
      setDeleteDialogOpen(false);
      setPersonToDelete(null);
    } catch {
      toast("Failed to delete person", "error");
    } finally {
      setDeleting(false);
    }
  }, [personToDelete, toast]);

  const handleExport = useCallback(() => {
    const headers = [
      "Registration No",
      "Full Name",
      "NIC No",
      "Gender",
      "Age",
      "Disability Type",
      "District",
      "Status",
      "Registered Date",
    ];

    const rows = filteredPersons.map((p) => [
      p.registrationNo,
      p.fullName,
      p.nicNumber,
      p.gender,
      String(p.age),
      p.disabilityType,
      getDistrictName(p.districtId),
      p.status,
      formatDate(p.registeredDate),
    ]);

    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `persons-export-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast("Export completed successfully", "success");
  }, [filteredPersons, getDistrictName, toast]);

  const hasActiveFilters =
    genderFilter || statusFilter || disabilityFilter || districtFilter;

  const clearFilters = useCallback(() => {
    setGenderFilter("");
    setStatusFilter("");
    setDisabilityFilter("");
    setDistrictFilter("");
  }, []);

  const disabilityTypes = useMemo(() => {
    const types = new Set(persons.map((p) => p.disabilityType));
    return Array.from(types).sort();
  }, [persons]);

  if (loading) {
    return <LoadingState fullPage message="Loading persons..." />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Persons with Disabilities"
        description="Manage and track registered persons with disabilities across all districts."
        breadcrumbs={[
          { label: "Dashboard", onClick: () => router.push("/dashboard") },
          { label: "Persons" },
        ]}
        actions={
          hasPermission("persons.create") ? (
            <Button onClick={() => router.push("/persons/create")}>
              <Plus className="mr-2 h-4 w-4" />
              Register Person
            </Button>
          ) : undefined
        }
      />

      <div className="space-y-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 sm:max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Search by name, registration no, NIC..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={genderFilter}
              onChange={(e) => setGenderFilter(e.target.value as GenderFilter)}
              className="flex h-9 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
            >
              <option value="">All Genders</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
              className="flex h-9 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
            >
              <option value="">All Statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="pending">Pending</option>
              <option value="deceased">Deceased</option>
            </select>

            <select
              value={disabilityFilter}
              onChange={(e) => setDisabilityFilter(e.target.value)}
              className="flex h-9 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
            >
              <option value="">All Disabilities</option>
              {disabilityTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>

            <select
              value={districtFilter}
              onChange={(e) => setDistrictFilter(e.target.value)}
              className="flex h-9 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
            >
              <option value="">All Districts</option>
              {districts.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>

            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="text-gray-500"
              >
                <X className="mr-1 h-3.5 w-3.5" />
                Clear
              </Button>
            )}

            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
          </div>
        </div>

        {filteredPersons.length === 0 ? (
          <div className="rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
            <EmptyState
              icon={<Users className="h-8 w-8" />}
              title={
                searchQuery || hasActiveFilters
                  ? "No matching persons found"
                  : "No persons registered yet"
              }
              description={
                searchQuery || hasActiveFilters
                  ? "Try adjusting your search or filters."
                  : "Start by registering a new person with disabilities."
              }
              action={
                !searchQuery && !hasActiveFilters && hasPermission("persons.create")
                  ? {
                      label: "Register Person",
                      onClick: () => router.push("/persons/create"),
                    }
                  : undefined
              }
            />
          </div>
        ) : (
          <>
            <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/50">
                    <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">
                      Registration No
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">
                      Full Name
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">
                      NIC No
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">
                      Gender
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">
                      Age
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">
                      Disability Type
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">
                      District
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">
                      Registered Date
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedPersons.map((person) => (
                    <tr
                      key={person.id}
                      className="cursor-pointer border-b border-gray-100 transition-colors last:border-0 hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-800/50"
                      onClick={() => router.push(`/persons/${person.id}`)}
                    >
                      <td className="px-4 py-3">
                        <span className="font-medium text-[#168B61] dark:text-[#4ADE80]">
                          {person.registrationNo}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900 dark:text-gray-100">
                          {person.fullName}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                        {person.nicNumber}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="secondary" className="capitalize">
                          {person.gender}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                        {person.age}
                      </td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                        {person.disabilityType}
                      </td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                        {getDistrictName(person.districtId)}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={person.status} />
                      </td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                        {formatDate(person.registeredDate)}
                      </td>
                      <td className="px-4 py-3">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                router.push(`/persons/${person.id}`);
                              }}
                            >
                              <Eye className="mr-2 h-4 w-4" />
                              View
                            </DropdownMenuItem>
                            {hasPermission("persons.update") && (
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation();
                                  router.push(`/persons/${person.id}/edit`);
                                }}
                              >
                                <Pencil className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                            )}
                            {hasPermission("persons.delete") && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  destructive
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDelete(person);
                                  }}
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Delete
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={filteredPersons.length}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
            />
          </>
        )}
      </div>

      <ConfirmDialog
        open={deleteDialogOpen}
        onClose={() => {
          setDeleteDialogOpen(false);
          setPersonToDelete(null);
        }}
        onConfirm={confirmDelete}
        title="Delete Person"
        description={`Are you sure you want to delete "${personToDelete?.fullName}"? This action cannot be undone.`}
        confirmLabel="Delete"
        loading={deleting}
      />
    </div>
  );
}
