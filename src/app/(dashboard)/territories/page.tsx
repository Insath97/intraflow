"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  MapPin,
  ChevronDown,
  ChevronRight,
  Plus,
  Edit,
  Trash2,
  Search,
  Building2,
  TreePine,
  FolderOpen,
  FileText,
  RefreshCw,
} from "lucide-react";
import { TerritoryService } from "@/services";
import type { Province, District, DSDivision, GNDivision } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Dialog } from "@/components/ui/dialog";
import { Tabs, TabList, Tab, TabPanel } from "@/components/ui/tabs";
import { Select } from "@/components/ui/select";
import { PageHeader } from "@/components/common/page-header";
import { EmptyState } from "@/components/common/empty-state";
import { StatusBadge } from "@/components/common/status-badge";
import { ConfirmDialog } from "@/components/common/confirm-dialog";

type TerritoryLevel = "province" | "district" | "ds" | "gn";

interface HierarchyNode {
  id: string;
  name: string;
  code: string;
  level: TerritoryLevel;
  children: HierarchyNode[];
  count: number;
}

interface TerritoryFormData {
  name: string;
  code: string;
  parentId: string;
  status: "active" | "inactive";
}

const EMPTY_FORM: TerritoryFormData = {
  name: "",
  code: "",
  parentId: "",
  status: "active",
};

export default function TerritoriesPage() {
  const [activeTab, setActiveTab] = useState("provinces");
  const [loading, setLoading] = useState(true);

  const [provinces, setProvinces] = useState<Province[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [dsDivisions, setDSDivisions] = useState<DSDivision[]>([]);
  const [gnDivisions, setGNDivisions] = useState<GNDivision[]>([]);

  const [searchQuery, setSearchQuery] = useState("");
  const [filterProvince, setFilterProvince] = useState("");
  const [filterDistrict, setFilterDistrict] = useState("");
  const [filterDS, setFilterDS] = useState("");

  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<"create" | "edit">("create");
  const [dialogLevel, setDialogLevel] = useState<TerritoryLevel>("province");
  const [formData, setFormData] = useState<TerritoryFormData>(EMPTY_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof TerritoryFormData, string>>>({});

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string; level: TerritoryLevel } | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  function loadData() {
    setLoading(true);
    const p = TerritoryService.getProvinces();
    const d = TerritoryService.getDistricts();
    const ds = TerritoryService.getDSDivisions();
    const gn = TerritoryService.getGNDivisions();
    setProvinces(p);
    setDistricts(d);
    setDSDivisions(ds);
    setGNDivisions(gn);
    setLoading(false);
  }

  const provinceMap = useMemo(() => {
    const map: Record<string, Province> = {};
    provinces.forEach((p) => (map[p.id] = p));
    return map;
  }, [provinces]);

  const districtMap = useMemo(() => {
    const map: Record<string, District> = {};
    districts.forEach((d) => (map[d.id] = d));
    return map;
  }, [districts]);

  const dsMap = useMemo(() => {
    const map: Record<string, DSDivision> = {};
    dsDivisions.forEach((ds) => (map[ds.id] = ds));
    return map;
  }, [dsDivisions]);

  const districtCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    districts.forEach((d) => {
      counts[d.provinceId] = (counts[d.provinceId] || 0) + 1;
    });
    return counts;
  }, [districts]);

  const dsCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    dsDivisions.forEach((ds) => {
      counts[ds.districtId] = (counts[ds.districtId] || 0) + 1;
    });
    return counts;
  }, [dsDivisions]);

  const gnCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    gnDivisions.forEach((gn) => {
      counts[gn.dsDivisionId] = (counts[gn.dsDivisionId] || 0) + 1;
    });
    return counts;
  }, [gnDivisions]);

  const hierarchyData = useMemo(() => {
    return provinces.map((province) => ({
      id: province.id,
      name: province.name,
      code: province.code,
      level: "province" as TerritoryLevel,
      children: districts
        .filter((d) => d.provinceId === province.id)
        .map((district) => ({
          id: district.id,
          name: district.name,
          code: district.code,
          level: "district" as TerritoryLevel,
          children: dsDivisions
            .filter((ds) => ds.districtId === district.id)
            .map((ds) => ({
              id: ds.id,
              name: ds.name,
              code: ds.code,
              level: "ds" as TerritoryLevel,
              children: gnDivisions
                .filter((g) => g.dsDivisionId === ds.id)
                .map((gn) => ({
                  id: gn.id,
                  name: gn.name,
                  code: gn.code,
                  level: "gn" as TerritoryLevel,
                  children: [],
                  count: 0,
                })),
              count: gnCounts[ds.id] || 0,
            })),
          count: dsCounts[district.id] || 0,
        })),
      count: districtCounts[province.id] || 0,
    }));
  }, [provinces, districts, dsDivisions, gnDivisions, districtCounts, dsCounts, gnCounts]);

  const filteredProvinces = useMemo(() => {
    return provinces.filter((p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.code.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [provinces, searchQuery]);

  const filteredDistricts = useMemo(() => {
    return districts.filter((d) => {
      const matchSearch =
        d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.code.toLowerCase().includes(searchQuery.toLowerCase());
      const matchProvince = !filterProvince || d.provinceId === filterProvince;
      return matchSearch && matchProvince;
    });
  }, [districts, searchQuery, filterProvince]);

  const filteredDSDivisions = useMemo(() => {
    return dsDivisions.filter((ds) => {
      const matchSearch =
        ds.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ds.code.toLowerCase().includes(searchQuery.toLowerCase());
      const district = districtMap[ds.districtId];
      const matchProvince = !filterProvince || (district && district.provinceId === filterProvince);
      const matchDistrict = !filterDistrict || ds.districtId === filterDistrict;
      return matchSearch && matchProvince && matchDistrict;
    });
  }, [dsDivisions, searchQuery, filterProvince, filterDistrict, districtMap]);

  const filteredGNDivisions = useMemo(() => {
    return gnDivisions.filter((gn) => {
      const matchSearch =
        gn.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        gn.code.toLowerCase().includes(searchQuery.toLowerCase());
      const ds = dsMap[gn.dsDivisionId];
      const district = ds ? districtMap[ds.districtId] : null;
      const matchProvince = !filterProvince || (district && district.provinceId === filterProvince);
      const matchDistrict = !filterDistrict || (ds && ds.districtId === filterDistrict);
      const matchDS = !filterDS || gn.dsDivisionId === filterDS;
      return matchSearch && matchProvince && matchDistrict && matchDS;
    });
  }, [gnDivisions, searchQuery, filterProvince, filterDistrict, filterDS, dsMap, districtMap]);

  const availableDistricts = useMemo(() => {
    if (!filterProvince) return districts;
    return districts.filter((d) => d.provinceId === filterProvince);
  }, [districts, filterProvince]);

  const availableDSDivisions = useMemo(() => {
    if (!filterDistrict) return dsDivisions;
    return dsDivisions.filter((ds) => ds.districtId === filterDistrict);
  }, [dsDivisions, filterDistrict]);

  const formParentOptions = useMemo(() => {
    switch (dialogLevel) {
      case "district":
        return provinces.map((p) => ({ value: p.id, label: p.name }));
      case "ds":
        return districts
          .filter((d) => !formData.parentId || d.provinceId === formData.parentId)
          .map((d) => ({ value: d.id, label: d.name }));
      case "gn":
        return dsDivisions.map((ds) => ({ value: ds.id, label: ds.name }));
      default:
        return [];
    }
  }, [dialogLevel, provinces, districts, dsDivisions, formData.parentId]);

  const dialogParentLabel = useMemo(() => {
    switch (dialogLevel) {
      case "district": return "Province";
      case "ds": return "District";
      case "gn": return "DS Division";
      default: return "";
    }
  }, [dialogLevel]);

  function toggleNode(id: string) {
    setExpandedNodes((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function expandAll() {
    const allIds = new Set<string>();
    function collect(nodes: HierarchyNode[]) {
      nodes.forEach((n) => {
        if (n.children.length > 0) allIds.add(n.id);
        collect(n.children);
      });
    }
    collect(hierarchyData);
    setExpandedNodes(allIds);
  }

  function collapseAll() {
    setExpandedNodes(new Set());
  }

  function openCreateDialog(level: TerritoryLevel) {
    setDialogLevel(level);
    setDialogMode("create");
    setFormData(EMPTY_FORM);
    setEditingId(null);
    setFormErrors({});
    setDialogOpen(true);
  }

  function openEditDialog(level: TerritoryLevel, id: string) {
    setDialogLevel(level);
    setDialogMode("edit");
    setEditingId(id);
    setFormErrors({});

    let item: Province | District | DSDivision | GNDivision | null = null;
    switch (level) {
      case "province":
        item = provinces.find((p) => p.id === id) || null;
        if (item) setFormData({ name: item.name, code: item.code, parentId: "", status: item.status });
        break;
      case "district":
        item = districts.find((d) => d.id === id) || null;
        if (item) setFormData({ name: item.name, code: item.code, parentId: (item as District).provinceId, status: item.status });
        break;
      case "ds":
        item = dsDivisions.find((d) => d.id === id) || null;
        if (item) setFormData({ name: item.name, code: item.code, parentId: (item as DSDivision).districtId, status: item.status });
        break;
      case "gn":
        item = gnDivisions.find((g) => g.id === id) || null;
        if (item) setFormData({ name: item.name, code: item.code, parentId: (item as GNDivision).dsDivisionId, status: item.status });
        break;
    }
    setDialogOpen(true);
  }

  function openDeleteDialog(level: TerritoryLevel, id: string, name: string) {
    setDeleteTarget({ id, name, level });
    setDeleteDialogOpen(true);
  }

  function validateForm(): boolean {
    const errors: Partial<Record<keyof TerritoryFormData, string>> = {};
    if (!formData.name.trim()) errors.name = "Name is required";
    if (!formData.code.trim()) errors.code = "Code is required";
    if (dialogLevel !== "province" && !formData.parentId) errors.parentId = `${dialogParentLabel} is required`;
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }

  function handleFormSubmit() {
    if (!validateForm()) return;

    switch (dialogLevel) {
      case "province": {
        if (dialogMode === "create") {
          TerritoryService.createProvince({ name: formData.name, code: formData.code, status: formData.status });
        } else if (editingId) {
          TerritoryService.updateProvince(editingId, { name: formData.name, code: formData.code, status: formData.status });
        }
        break;
      }
      case "district": {
        if (dialogMode === "create") {
          TerritoryService.createDistrict({ name: formData.name, code: formData.code, provinceId: formData.parentId, status: formData.status });
        } else if (editingId) {
          TerritoryService.updateDistrict(editingId, { name: formData.name, code: formData.code, provinceId: formData.parentId, status: formData.status });
        }
        break;
      }
      case "ds": {
        if (dialogMode === "create") {
          TerritoryService.createDSDivision({ name: formData.name, code: formData.code, districtId: formData.parentId, status: formData.status });
        } else if (editingId) {
          TerritoryService.updateDSDivision(editingId, { name: formData.name, code: formData.code, districtId: formData.parentId, status: formData.status });
        }
        break;
      }
      case "gn": {
        if (dialogMode === "create") {
          TerritoryService.createGNDivision({ name: formData.name, code: formData.code, dsDivisionId: formData.parentId, status: formData.status });
        } else if (editingId) {
          TerritoryService.updateGNDivision(editingId, { name: formData.name, code: formData.code, dsDivisionId: formData.parentId, status: formData.status });
        }
        break;
      }
    }

    setDialogOpen(false);
    loadData();
  }

  function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);

    switch (deleteTarget.level) {
      case "province":
        TerritoryService.deleteProvince(deleteTarget.id);
        break;
      case "district":
        TerritoryService.deleteDistrict(deleteTarget.id);
        break;
      case "ds":
        TerritoryService.deleteDSDivision(deleteTarget.id);
        break;
      case "gn":
        TerritoryService.deleteGNDivision(deleteTarget.id);
        break;
    }

    setDeleting(false);
    setDeleteDialogOpen(false);
    setDeleteTarget(null);
    loadData();
  }

  function getDialogLevelLabel() {
    switch (dialogLevel) {
      case "province": return "Province";
      case "district": return "District";
      case "ds": return "DS Division";
      case "gn": return "GN Division";
      default: return "Territory";
    }
  }

  function renderHierarchyNode(node: HierarchyNode, depth: number = 0) {
    const isExpanded = expandedNodes.has(node.id);
    const hasChildren = node.children.length > 0;
    const levelIcons: Record<TerritoryLevel, React.ReactNode> = {
      province: <MapPin className="h-4 w-4 text-green-600 dark:text-green-400" />,
      district: <Building2 className="h-4 w-4 text-blue-600 dark:text-blue-400" />,
      ds: <FolderOpen className="h-4 w-4 text-amber-600 dark:text-amber-400" />,
      gn: <FileText className="h-4 w-4 text-purple-600 dark:text-purple-400" />,
    };
    const levelBadgeColors: Record<TerritoryLevel, string> = {
      province: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
      district: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
      ds: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
      gn: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
    };

    return (
      <div key={node.id}>
        <button
          type="button"
          onClick={() => hasChildren && toggleNode(node.id)}
          className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50 ${depth > 0 ? "ml-" + String(depth * 5) : ""}`}
          style={{ paddingLeft: `${depth * 20 + 12}px` }}
        >
          {hasChildren ? (
            isExpanded ? (
              <ChevronDown className="h-4 w-4 shrink-0 text-gray-400" />
            ) : (
              <ChevronRight className="h-4 w-4 shrink-0 text-gray-400" />
            )
          ) : (
            <span className="w-4" />
          )}
          {levelIcons[node.level]}
          <span className="font-medium text-gray-900 dark:text-gray-100">{node.name}</span>
          <span className="text-xs text-gray-500 dark:text-gray-400">({node.code})</span>
          {hasChildren && (
            <span className={`ml-auto inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${levelBadgeColors[node.level]}`}>
              {node.count} {node.level === "province" ? "districts" : node.level === "district" ? "DS divs" : node.level === "ds" ? "GN divs" : ""}
            </span>
          )}
        </button>
        {isExpanded && hasChildren && (
          <div>
            {node.children.map((child) => renderHierarchyNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  }

  function resetFilters() {
    setSearchQuery("");
    setFilterProvince("");
    setFilterDistrict("");
    setFilterDS("");
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Territory Management"
        description="Manage the administrative hierarchy: Provinces, Districts, DS Divisions, and GN Divisions"
        breadcrumbs={[
          { label: "Dashboard", onClick: () => {} },
          { label: "Territory Management" },
        ]}
        actions={
          <Button variant="outline" size="sm" onClick={loadData}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        }
      />

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div className="flex items-center gap-2">
            <TreePine className="h-5 w-5 text-green-600 dark:text-green-400" />
            <CardTitle className="text-lg">Territory Hierarchy</CardTitle>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={expandAll}>Expand All</Button>
            <Button variant="ghost" size="sm" onClick={collapseAll}>Collapse All</Button>
          </div>
        </CardHeader>
        <CardContent>
          {hierarchyData.length === 0 ? (
            <EmptyState
              icon={<MapPin className="h-8 w-8" />}
              title="No territories defined"
              description="Start by adding provinces to build the territory hierarchy"
            />
          ) : (
            <div className="max-h-72 overflow-y-auto rounded-lg border border-gray-200 dark:border-gray-700 divide-y divide-gray-100 dark:divide-gray-800">
              {hierarchyData.map((node) => renderHierarchyNode(node))}
            </div>
          )}
        </CardContent>
      </Card>

      <Tabs defaultValue="provinces" onValueChange={setActiveTab}>
        <div className="flex items-center justify-between">
          <TabList>
            <Tab value="provinces">Provinces</Tab>
            <Tab value="districts">Districts</Tab>
            <Tab value="ds">DS Divisions</Tab>
            <Tab value="gn">GN Divisions</Tab>
          </TabList>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-64 pl-9"
              />
            </div>
            {activeTab === "provinces" && (
              <Button onClick={() => openCreateDialog("province")}>
                <Plus className="mr-2 h-4 w-4" />
                Add Province
              </Button>
            )}
            {activeTab === "districts" && (
              <Button onClick={() => openCreateDialog("district")}>
                <Plus className="mr-2 h-4 w-4" />
                Add District
              </Button>
            )}
            {activeTab === "ds" && (
              <Button onClick={() => openCreateDialog("ds")}>
                <Plus className="mr-2 h-4 w-4" />
                Add DS Division
              </Button>
            )}
            {activeTab === "gn" && (
              <Button onClick={() => openCreateDialog("gn")}>
                <Plus className="mr-2 h-4 w-4" />
                Add GN Division
              </Button>
            )}
          </div>
        </div>

        <TabPanel value="provinces">
          <Card className="mt-4">
            <CardContent className="p-0">
              {filteredProvinces.length === 0 ? (
                <EmptyState
                  icon={<MapPin className="h-8 w-8" />}
                  title="No provinces found"
                  description="Add your first province to get started"
                  action={{ label: "Add Province", onClick: () => openCreateDialog("province") }}
                />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200 bg-gray-50/50 dark:border-gray-700 dark:bg-gray-800/50">
                        <th className="px-6 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Name</th>
                        <th className="px-6 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Code</th>
                        <th className="px-6 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Districts</th>
                        <th className="px-6 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Status</th>
                        <th className="px-6 py-3 text-right font-medium text-gray-500 dark:text-gray-400">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                      {filteredProvinces.map((province) => (
                        <tr key={province.id} className="transition-colors hover:bg-gray-50/50 dark:hover:bg-gray-800/50">
                          <td className="px-6 py-4 font-medium text-gray-900 dark:text-gray-100">{province.name}</td>
                          <td className="px-6 py-4 text-gray-500 dark:text-gray-400">{province.code}</td>
                          <td className="px-6 py-4">
                            <Badge variant="secondary">{districtCounts[province.id] || 0}</Badge>
                          </td>
                          <td className="px-6 py-4"><StatusBadge status={province.status} /></td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button variant="ghost" size="icon" onClick={() => openEditDialog("province", province.id)}>
                                <Edit className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                              </Button>
                              <Button variant="ghost" size="icon" onClick={() => openDeleteDialog("province", province.id, province.name)}>
                                <Trash2 className="h-4 w-4 text-red-500" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabPanel>

        <TabPanel value="districts">
          <Card className="mt-4">
            <CardContent className="p-4">
              <div className="mb-4 flex items-center gap-4">
                <Select value={filterProvince} onChange={(e) => { setFilterProvince(e.target.value); setFilterDistrict(""); }} placeholder="All Provinces">
                  {provinces.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </Select>
              </div>
            </CardContent>
            <CardContent className="p-0">
              {filteredDistricts.length === 0 ? (
                <EmptyState
                  icon={<Building2 className="h-8 w-8" />}
                  title="No districts found"
                  description="Add your first district or adjust filters"
                  action={{ label: "Add District", onClick: () => openCreateDialog("district") }}
                />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200 bg-gray-50/50 dark:border-gray-700 dark:bg-gray-800/50">
                        <th className="px-6 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Name</th>
                        <th className="px-6 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Code</th>
                        <th className="px-6 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Province</th>
                        <th className="px-6 py-3 text-left font-medium text-gray-500 dark:text-gray-400">DS Divisions</th>
                        <th className="px-6 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Status</th>
                        <th className="px-6 py-3 text-right font-medium text-gray-500 dark:text-gray-400">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                      {filteredDistricts.map((district) => (
                        <tr key={district.id} className="transition-colors hover:bg-gray-50/50 dark:hover:bg-gray-800/50">
                          <td className="px-6 py-4 font-medium text-gray-900 dark:text-gray-100">{district.name}</td>
                          <td className="px-6 py-4 text-gray-500 dark:text-gray-400">{district.code}</td>
                          <td className="px-6 py-4 text-gray-500 dark:text-gray-400">
                            {provinceMap[district.provinceId]?.name || "—"}
                          </td>
                          <td className="px-6 py-4">
                            <Badge variant="secondary">{dsCounts[district.id] || 0}</Badge>
                          </td>
                          <td className="px-6 py-4"><StatusBadge status={district.status} /></td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button variant="ghost" size="icon" onClick={() => openEditDialog("district", district.id)}>
                                <Edit className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                              </Button>
                              <Button variant="ghost" size="icon" onClick={() => openDeleteDialog("district", district.id, district.name)}>
                                <Trash2 className="h-4 w-4 text-red-500" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabPanel>

        <TabPanel value="ds">
          <Card className="mt-4">
            <CardContent className="p-4">
              <div className="mb-4 flex items-center gap-4">
                <Select value={filterProvince} onChange={(e) => { setFilterProvince(e.target.value); setFilterDistrict(""); setFilterDS(""); }} placeholder="All Provinces">
                  {provinces.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </Select>
                <Select value={filterDistrict} onChange={(e) => { setFilterDistrict(e.target.value); setFilterDS(""); }} placeholder="All Districts">
                  {availableDistricts.map((d) => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </Select>
              </div>
            </CardContent>
            <CardContent className="p-0">
              {filteredDSDivisions.length === 0 ? (
                <EmptyState
                  icon={<FolderOpen className="h-8 w-8" />}
                  title="No DS divisions found"
                  description="Add your first DS division or adjust filters"
                  action={{ label: "Add DS Division", onClick: () => openCreateDialog("ds") }}
                />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200 bg-gray-50/50 dark:border-gray-700 dark:bg-gray-800/50">
                        <th className="px-6 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Name</th>
                        <th className="px-6 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Code</th>
                        <th className="px-6 py-3 text-left font-medium text-gray-500 dark:text-gray-400">District</th>
                        <th className="px-6 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Province</th>
                        <th className="px-6 py-3 text-left font-medium text-gray-500 dark:text-gray-400">GN Divisions</th>
                        <th className="px-6 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Status</th>
                        <th className="px-6 py-3 text-right font-medium text-gray-500 dark:text-gray-400">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                      {filteredDSDivisions.map((ds) => {
                        const district = districtMap[ds.districtId];
                        const province = district ? provinceMap[district.provinceId] : null;
                        return (
                          <tr key={ds.id} className="transition-colors hover:bg-gray-50/50 dark:hover:bg-gray-800/50">
                            <td className="px-6 py-4 font-medium text-gray-900 dark:text-gray-100">{ds.name}</td>
                            <td className="px-6 py-4 text-gray-500 dark:text-gray-400">{ds.code}</td>
                            <td className="px-6 py-4 text-gray-500 dark:text-gray-400">{district?.name || "—"}</td>
                            <td className="px-6 py-4 text-gray-500 dark:text-gray-400">{province?.name || "—"}</td>
                            <td className="px-6 py-4">
                              <Badge variant="secondary">{gnCounts[ds.id] || 0}</Badge>
                            </td>
                            <td className="px-6 py-4"><StatusBadge status={ds.status} /></td>
                            <td className="px-6 py-4 text-right">
                              <div className="flex items-center justify-end gap-1">
                                <Button variant="ghost" size="icon" onClick={() => openEditDialog("ds", ds.id)}>
                                  <Edit className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                                </Button>
                                <Button variant="ghost" size="icon" onClick={() => openDeleteDialog("ds", ds.id, ds.name)}>
                                  <Trash2 className="h-4 w-4 text-red-500" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabPanel>

        <TabPanel value="gn">
          <Card className="mt-4">
            <CardContent className="p-4">
              <div className="mb-4 flex items-center gap-4">
                <Select value={filterProvince} onChange={(e) => { setFilterProvince(e.target.value); setFilterDistrict(""); setFilterDS(""); }} placeholder="All Provinces">
                  {provinces.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </Select>
                <Select value={filterDistrict} onChange={(e) => { setFilterDistrict(e.target.value); setFilterDS(""); }} placeholder="All Districts">
                  {availableDistricts.map((d) => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </Select>
                <Select value={filterDS} onChange={(e) => setFilterDS(e.target.value)} placeholder="All DS Divisions">
                  {availableDSDivisions.map((ds) => (
                    <option key={ds.id} value={ds.id}>{ds.name}</option>
                  ))}
                </Select>
              </div>
            </CardContent>
            <CardContent className="p-0">
              {filteredGNDivisions.length === 0 ? (
                <EmptyState
                  icon={<FileText className="h-8 w-8" />}
                  title="No GN divisions found"
                  description="Add your first GN division or adjust filters"
                  action={{ label: "Add GN Division", onClick: () => openCreateDialog("gn") }}
                />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200 bg-gray-50/50 dark:border-gray-700 dark:bg-gray-800/50">
                        <th className="px-6 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Name</th>
                        <th className="px-6 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Code</th>
                        <th className="px-6 py-3 text-left font-medium text-gray-500 dark:text-gray-400">DS Division</th>
                        <th className="px-6 py-3 text-left font-medium text-gray-500 dark:text-gray-400">District</th>
                        <th className="px-6 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Status</th>
                        <th className="px-6 py-3 text-right font-medium text-gray-500 dark:text-gray-400">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                      {filteredGNDivisions.map((gn) => {
                        const ds = dsMap[gn.dsDivisionId];
                        const district = ds ? districtMap[ds.districtId] : null;
                        return (
                          <tr key={gn.id} className="transition-colors hover:bg-gray-50/50 dark:hover:bg-gray-800/50">
                            <td className="px-6 py-4 font-medium text-gray-900 dark:text-gray-100">{gn.name}</td>
                            <td className="px-6 py-4 text-gray-500 dark:text-gray-400">{gn.code}</td>
                            <td className="px-6 py-4 text-gray-500 dark:text-gray-400">{ds?.name || "—"}</td>
                            <td className="px-6 py-4 text-gray-500 dark:text-gray-400">{district?.name || "—"}</td>
                            <td className="px-6 py-4"><StatusBadge status={gn.status} /></td>
                            <td className="px-6 py-4 text-right">
                              <div className="flex items-center justify-end gap-1">
                                <Button variant="ghost" size="icon" onClick={() => openEditDialog("gn", gn.id)}>
                                  <Edit className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                                </Button>
                                <Button variant="ghost" size="icon" onClick={() => openDeleteDialog("gn", gn.id, gn.name)}>
                                  <Trash2 className="h-4 w-4 text-red-500" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabPanel>
      </Tabs>

      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        title={`${dialogMode === "create" ? "Add" : "Edit"} ${getDialogLevelLabel()}`}
        footer={
          <>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleFormSubmit}>
              {dialogMode === "create" ? "Create" : "Save Changes"}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Name <span className="text-red-500">*</span>
            </label>
            <Input
              placeholder={`Enter ${getDialogLevelLabel().toLowerCase()} name`}
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              error={!!formErrors.name}
              errorMessage={formErrors.name}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Code <span className="text-red-500">*</span>
            </label>
            <Input
              placeholder={`Enter ${getDialogLevelLabel().toLowerCase()} code`}
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              error={!!formErrors.code}
              errorMessage={formErrors.code}
            />
          </div>
          {dialogLevel !== "province" && (
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                {dialogParentLabel} <span className="text-red-500">*</span>
              </label>
              <Select
                value={formData.parentId}
                onChange={(e) => setFormData({ ...formData, parentId: e.target.value })}
                placeholder={`Select ${dialogParentLabel.toLowerCase()}`}
                error={!!formErrors.parentId}
                errorMessage={formErrors.parentId}
              >
                {formParentOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </Select>
            </div>
          )}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Status</label>
            <Select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as "active" | "inactive" })}
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </Select>
          </div>
        </div>
      </Dialog>

      <ConfirmDialog
        open={deleteDialogOpen}
        onClose={() => { setDeleteDialogOpen(false); setDeleteTarget(null); }}
        onConfirm={handleDelete}
        title={`Delete ${deleteTarget ? getDialogLevelLabel() : ""}`}
        description={`Are you sure you want to delete "${deleteTarget?.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        loading={deleting}
      />
    </div>
  );
}
