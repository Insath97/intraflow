"use client";

import { useState, useEffect, useMemo } from "react";
import { PageHeader } from "@/components/common/page-header";
import { StatCard } from "@/components/common/stat-card";
import { EmptyState } from "@/components/common/empty-state";
import { LoadingState } from "@/components/common/loading-state";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Tabs, TabList, Tab, TabPanel } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ReportService, PersonService, TerritoryService } from "@/services";
import type { ChartDataPoint, MonthlyRegistration } from "@/types";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts";
import {
  FileText,
  Download,
  Filter,
  RotateCcw,
  Users,
  UserCheck,
  Award,
  HeartHandshake,
  ChevronDown,
  ChevronUp,
  FileSpreadsheet,
  File,
} from "lucide-react";

const ORANGE = "#FF6B00";
const ORANGE_LIGHT = "#FF9A5C";
const COLORS = ["#FF6B00", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#06b6d4", "#84cc16"];

interface Filters {
  provinceId: string;
  districtId: string;
  dsDivisionId: string;
  gender: string;
  ageGroup: string;
  disabilityType: string;
  status: string;
  startDate: string;
  endDate: string;
}

const initialFilters: Filters = {
  provinceId: "",
  districtId: "",
  dsDivisionId: "",
  gender: "",
  ageGroup: "",
  disabilityType: "",
  status: "",
  startDate: "",
  endDate: "",
};

const DISABILITY_TYPES = [
  "Physical",
  "Visual",
  "Hearing",
  "Speech",
  "Intellectual",
  "Developmental",
  "Mental",
  "Multiple",
];

export default function ReportsPage() {
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<Filters>(initialFilters);
  const [activeTab, setActiveTab] = useState("person");
  const [showFilters, setShowFilters] = useState(true);

  const [provinces, setProvinces] = useState<{ id: string; name: string }[]>([]);
  const [districts, setDistricts] = useState<{ id: string; name: string; provinceId: string }[]>([]);
  const [dsDivisions, setDSDivisions] = useState<{ id: string; name: string; districtId: string }[]>([]);

  const [personData, setPersonData] = useState<ChartDataPoint[]>([]);
  const [assistanceData, setAssistanceData] = useState({
    total: 0,
    governmentAssistance: 0,
    medicalAssistance: 0,
    educationSupport: 0,
    employmentSupport: 0,
    certified: 0,
    pending: 0,
    notCertified: 0,
    avgIncome: 0,
    employed: 0,
    unemployed: 0,
  });
  const [monthlyData, setMonthlyData] = useState<MonthlyRegistration[]>([]);
  const [reportPersons, setReportPersons] = useState<any[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    const filteredDistricts = filters.provinceId
      ? districts.filter((d) => d.provinceId === filters.provinceId)
      : districts;
    if (
      filters.districtId &&
      !filteredDistricts.find((d) => d.id === filters.districtId)
    ) {
      setFilters((f) => ({ ...f, districtId: "", dsDivisionId: "" }));
    }
  }, [filters.provinceId, districts]);

  useEffect(() => {
    const filteredDS = filters.districtId
      ? dsDivisions.filter((d) => d.districtId === filters.districtId)
      : dsDivisions;
    if (
      filters.dsDivisionId &&
      !filteredDS.find((d) => d.id === filters.dsDivisionId)
    ) {
      setFilters((f) => ({ ...f, dsDivisionId: "" }));
    }
  }, [filters.districtId, dsDivisions]);

  function loadData() {
    try {
      const provs = TerritoryService.getProvinces();
      const dists = TerritoryService.getDistricts();
      const dsDivs = TerritoryService.getDSDivisions();
      setProvinces(provs);
      setDistricts(dists);
      setDSDivisions(dsDivs);
      generateReport(initialFilters);
    } finally {
      setLoading(false);
    }
  }

  function generateReport(f: Filters) {
    const rFilters: any = {};
    if (f.provinceId) rFilters.provinceId = f.provinceId;
    if (f.districtId) rFilters.districtId = f.districtId;
    if (f.disabilityType) rFilters.disabilityType = f.disabilityType;
    if (f.gender) rFilters.gender = f.gender;
    if (f.ageGroup) rFilters.ageGroup = f.ageGroup;
    if (f.status) rFilters.certificationStatus = f.status;
    if (f.startDate) rFilters.startDate = f.startDate;
    if (f.endDate) rFilters.endDate = f.endDate;

    const persons = ReportService.generateReport(rFilters);
    setReportPersons(persons);

    setPersonData(ReportService.getPersonsByProvince());
    setAssistanceData(ReportService.getAssistanceReport());
    setMonthlyData(ReportService.getMonthlyRegistrations());
  }

  function handleGenerate() {
    generateReport(filters);
  }

  function handleReset() {
    setFilters(initialFilters);
    generateReport(initialFilters);
  }

  function handleExportCSV() {
    if (reportPersons.length === 0) return;

    const headers = [
      "Registration No",
      "Full Name",
      "NIC Number",
      "Gender",
      "Age",
      "Disability Type",
      "Disability Level",
      "Status",
      "Certification",
      "Contact Number",
      "Province",
      "District",
      "DS Division",
      "Registered Date",
    ];

    const rows = reportPersons.map((p) => [
      p.registrationNo,
      p.fullName,
      p.nicNumber,
      p.gender,
      p.age,
      p.disabilityType,
      p.disabilityLevel,
      p.status,
      p.certificationStatus,
      p.contactNumber,
      p.provinceId,
      p.districtId,
      p.dsDivisionId,
      p.registeredDate,
    ]);

    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `report-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleExportPDF() {
    alert("PDF export will be available in the next release.");
  }

  const filteredDistricts = filters.provinceId
    ? districts.filter((d) => d.provinceId === filters.provinceId)
    : districts;

  const filteredDS = filters.districtId
    ? dsDivisions.filter((d) => d.districtId === filters.districtId)
    : dsDivisions;

  const districtNameMap = useMemo(() => {
    const map: Record<string, string> = {};
    districts.forEach((d) => {
      map[d.id] = d.name;
    });
    return map;
  }, [districts]);

  const provinceNameMap = useMemo(() => {
    const map: Record<string, string> = {};
    provinces.forEach((p) => {
      map[p.id] = p.name;
    });
    return map;
  }, [provinces]);

  const provinceChartData = useMemo(() => {
    return personData.map((d) => ({
      name: provinceNameMap[d.name] || d.name,
      value: d.value,
    }));
  }, [personData, provinceNameMap]);

  const districtChartData = useMemo(() => {
    return personData
      .map((d) => ({
        name: districtNameMap[d.name] || d.name,
        value: d.value,
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 15);
  }, [personData, districtNameMap]);

  const genderChartData = useMemo(() => {
    const counts: Record<string, number> = {};
    reportPersons.forEach((p) => {
      counts[p.gender] = (counts[p.gender] || 0) + 1;
    });
    const colorMap: Record<string, string> = {
      male: "#3b82f6",
      female: "#ec4899",
      other: "#8b5cf6",
    };
    return Object.entries(counts).map(([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value,
      fill: colorMap[name] || "#6b7280",
    }));
  }, [reportPersons]);

  const ageGroupChartData = useMemo(() => {
    const counts: Record<string, number> = {};
    reportPersons.forEach((p) => {
      const group = p.age < 18 ? "Children" : p.age < 60 ? "Adults" : "Elderly";
      counts[group] = (counts[group] || 0) + 1;
    });
    const colorMap: Record<string, string> = {
      Children: "#10b981",
      Adults: "#3b82f6",
      Elderly: "#f59e0b",
    };
    return Object.entries(counts).map(([name, value]) => ({
      name,
      value,
      fill: colorMap[name] || "#6b7280",
    }));
  }, [reportPersons]);

  const disabilityTypeChartData = useMemo(() => {
    const counts: Record<string, number> = {};
    reportPersons.forEach((p) => {
      counts[p.disabilityType] = (counts[p.disabilityType] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [reportPersons]);

  const statusChartData = useMemo(() => {
    const counts: Record<string, number> = {};
    reportPersons.forEach((p) => {
      counts[p.status] = (counts[p.status] || 0) + 1;
    });
    const colorMap: Record<string, string> = {
      active: ORANGE,
      inactive: "#6b7280",
      pending: "#f59e0b",
      deceased: "#ef4444",
    };
    return Object.entries(counts).map(([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value,
      fill: colorMap[name] || "#6b7280",
    }));
  }, [reportPersons]);

  const equipmentChartData = useMemo(() => {
    const counts: Record<string, number> = {};
    reportPersons.forEach((p) => {
      (p.equipmentRequired || []).forEach((eq: string) => {
        counts[eq] = (counts[eq] || 0) + 1;
      });
    });
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [reportPersons]);

  const supportTypeChartData = useMemo(() => {
    const data = assistanceData;
    return [
      { name: "Government", value: data.governmentAssistance, fill: ORANGE },
      { name: "Medical", value: data.medicalAssistance, fill: "#3b82f6" },
      { name: "Education", value: data.educationSupport, fill: "#f59e0b" },
      { name: "Employment", value: data.employmentSupport, fill: "#8b5cf6" },
    ].filter((d) => d.value > 0);
  }, [assistanceData]);

  const monthlyChartData = useMemo(() => {
    return monthlyData.map((d) => ({
      month: d.month,
      Registrations: d.count,
    }));
  }, [monthlyData]);

  const totalPersons = reportPersons.length;
  const activePersons = reportPersons.filter((p) => p.status === "active").length;
  const certifiedPersons = reportPersons.filter((p) => p.certificationStatus === "certified").length;
  const receivingAssistance = reportPersons.filter(
    (p) => p.governmentAssistance || p.medicalAssistance
  ).length;

  if (loading) {
    return <LoadingState fullPage message="Loading reports..." />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reports"
        description="Comprehensive reporting and analytics"
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleExportCSV}>
              <FileSpreadsheet className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
            <Button variant="outline" onClick={handleExportPDF}>
              <File className="mr-2 h-4 w-4" />
              Export PDF
            </Button>
          </div>
        }
      />

      {/* Filters Section */}
      <Card>
        <button
          type="button"
          onClick={() => setShowFilters(!showFilters)}
          className="flex w-full items-center justify-between p-6 pb-0"
        >
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-[#FF6B00]" />
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">
              Report Filters
            </h3>
          </div>
          {showFilters ? (
            <ChevronUp className="h-5 w-5 text-gray-500" />
          ) : (
            <ChevronDown className="h-5 w-5 text-gray-500" />
          )}
        </button>

        {showFilters && (
          <CardContent className="pt-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Select
                label="Province"
                value={filters.provinceId}
                onChange={(e) =>
                  setFilters((f) => ({
                    ...f,
                    provinceId: e.target.value,
                    districtId: "",
                    dsDivisionId: "",
                  }))
                }
              >
                <option value="">All Provinces</option>
                {provinces.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </Select>

              <Select
                label="District"
                value={filters.districtId}
                onChange={(e) =>
                  setFilters((f) => ({
                    ...f,
                    districtId: e.target.value,
                    dsDivisionId: "",
                  }))
                }
              >
                <option value="">All Districts</option>
                {filteredDistricts.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </Select>

              <Select
                label="DS Division"
                value={filters.dsDivisionId}
                onChange={(e) =>
                  setFilters((f) => ({ ...f, dsDivisionId: e.target.value }))
                }
              >
                <option value="">All DS Divisions</option>
                {filteredDS.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </Select>

              <Select
                label="Gender"
                value={filters.gender}
                onChange={(e) =>
                  setFilters((f) => ({ ...f, gender: e.target.value }))
                }
              >
                <option value="">All Genders</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </Select>

              <Select
                label="Age Group"
                value={filters.ageGroup}
                onChange={(e) =>
                  setFilters((f) => ({ ...f, ageGroup: e.target.value }))
                }
              >
                <option value="">All Age Groups</option>
                <option value="Children">Children (0-17)</option>
                <option value="Adults">Adults (18-59)</option>
                <option value="Elderly">Elderly (60+)</option>
              </Select>

              <Select
                label="Disability Type"
                value={filters.disabilityType}
                onChange={(e) =>
                  setFilters((f) => ({ ...f, disabilityType: e.target.value }))
                }
              >
                <option value="">All Types</option>
                {DISABILITY_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </Select>

              <Select
                label="Certification Status"
                value={filters.status}
                onChange={(e) =>
                  setFilters((f) => ({ ...f, status: e.target.value }))
                }
              >
                <option value="">All Status</option>
                <option value="certified">Certified</option>
                <option value="pending">Pending</option>
                <option value="not_certified">Not Certified</option>
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
              <Button onClick={handleGenerate}>
                <Download className="mr-2 h-4 w-4" />
                Generate Report
              </Button>
              <Button variant="outline" onClick={handleExportCSV}>
                <FileSpreadsheet className="mr-2 h-4 w-4" />
                Export CSV
              </Button>
              <Button variant="secondary" onClick={handleReset}>
                <RotateCcw className="mr-2 h-4 w-4" />
                Reset Filters
              </Button>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={<Users className="h-5 w-5" />}
          value={totalPersons}
          label="Total Persons"
        />
        <StatCard
          icon={<UserCheck className="h-5 w-5" />}
          value={activePersons}
          label="Active Persons"
        />
        <StatCard
          icon={<Award className="h-5 w-5" />}
          value={certifiedPersons}
          label="Certified Persons"
        />
        <StatCard
          icon={<HeartHandshake className="h-5 w-5" />}
          value={receivingAssistance}
          label="Receiving Assistance"
        />
      </div>

      {/* Report Tabs */}
      <Tabs defaultValue="person" onValueChange={setActiveTab}>
        <TabList>
          <Tab value="person">
            <FileText className="mr-2 h-4 w-4 inline" />
            Person Reports
          </Tab>
          <Tab value="assistance">
            <HeartHandshake className="mr-2 h-4 w-4 inline" />
            Assistance Reports
          </Tab>
          <Tab value="registration">
            <Download className="mr-2 h-4 w-4 inline" />
            Registration Reports
          </Tab>
        </TabList>

        {/* Person Reports Tab */}
        <TabPanel value="person">
          <div className="mt-4 grid gap-6 lg:grid-cols-2">
            {/* Persons by Province */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Persons by Province</CardTitle>
              </CardHeader>
              <CardContent>
                {provinceChartData.length === 0 ? (
                  <EmptyState title="No data available" />
                ) : (
                  <ResponsiveContainer width="100%" height={350}>
                    <BarChart data={provinceChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis
                        dataKey="name"
                        tick={{ fontSize: 11 }}
                        angle={-45}
                        textAnchor="end"
                        height={80}
                      />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="value" fill={ORANGE} radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            {/* Persons by District */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  Persons by District (Top 15)
                </CardTitle>
              </CardHeader>
              <CardContent>
                {districtChartData.length === 0 ? (
                  <EmptyState title="No data available" />
                ) : (
                  <ResponsiveContainer width="100%" height={350}>
                    <BarChart data={districtChartData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis type="number" />
                      <YAxis
                        type="category"
                        dataKey="name"
                        width={100}
                        tick={{ fontSize: 11 }}
                      />
                      <Tooltip />
                      <Bar dataKey="value" fill={ORANGE} radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            {/* Persons by Gender */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Persons by Gender</CardTitle>
              </CardHeader>
              <CardContent>
                {genderChartData.length === 0 ? (
                  <EmptyState title="No data available" />
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={genderChartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                        label={({ name, percent }) =>
                          `${name} ${((percent ?? 0) * 100).toFixed(0)}%`
                        }
                      >
                        {genderChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            {/* Persons by Age Group */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Persons by Age Group</CardTitle>
              </CardHeader>
              <CardContent>
                {ageGroupChartData.length === 0 ? (
                  <EmptyState title="No data available" />
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={ageGroupChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                        {ageGroupChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            {/* Persons by Disability Type */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-lg">
                  Persons by Disability Type
                </CardTitle>
              </CardHeader>
              <CardContent>
                {disabilityTypeChartData.length === 0 ? (
                  <EmptyState title="No data available" />
                ) : (
                  <ResponsiveContainer width="100%" height={350}>
                    <BarChart data={disabilityTypeChartData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis type="number" />
                      <YAxis
                        type="category"
                        dataKey="name"
                        width={120}
                        tick={{ fontSize: 12 }}
                      />
                      <Tooltip />
                      <Bar
                        dataKey="value"
                        radius={[0, 4, 4, 0]}
                      >
                        {disabilityTypeChartData.map((_, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={COLORS[index % COLORS.length]}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>
        </TabPanel>

        {/* Assistance Reports Tab */}
        <TabPanel value="assistance">
          <div className="mt-4 grid gap-6 lg:grid-cols-2">
            {/* Government Assistance */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Government Assistance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Receiving Gov. Assistance
                    </p>
                    <p className="mt-1 text-2xl font-bold text-[#FF6B00]">
                      {assistanceData.governmentAssistance}
                    </p>
                  </div>
                  <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Medical Assistance
                    </p>
                    <p className="mt-1 text-2xl font-bold text-blue-600">
                      {assistanceData.medicalAssistance}
                    </p>
                  </div>
                  <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Education Support
                    </p>
                    <p className="mt-1 text-2xl font-bold text-amber-600">
                      {assistanceData.educationSupport}
                    </p>
                  </div>
                  <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Employment Support
                    </p>
                    <p className="mt-1 text-2xl font-bold text-purple-600">
                      {assistanceData.employmentSupport}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Medical Assistance Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Certification Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4">
                  <div className="rounded-lg border border-orange-200 bg-orange-50 p-4 text-center dark:border-orange-800 dark:bg-orange-900/20">
                    <p className="text-sm text-orange-700 dark:text-orange-400">
                      Certified
                    </p>
                    <p className="mt-1 text-2xl font-bold text-orange-700 dark:text-orange-400">
                      {assistanceData.certified}
                    </p>
                  </div>
                  <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-center dark:border-amber-800 dark:bg-amber-900/20">
                    <p className="text-sm text-amber-700 dark:text-amber-400">
                      Pending
                    </p>
                    <p className="mt-1 text-2xl font-bold text-amber-700 dark:text-amber-400">
                      {assistanceData.pending}
                    </p>
                  </div>
                  <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-center dark:border-red-800 dark:bg-red-900/20">
                    <p className="text-sm text-red-700 dark:text-red-400">
                      Not Certified
                    </p>
                    <p className="mt-1 text-2xl font-bold text-red-700 dark:text-red-400">
                      {assistanceData.notCertified}
                    </p>
                  </div>
                </div>
                <div className="mt-4 rounded-lg border border-gray-200 p-4 dark:border-gray-700">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      Average Monthly Income
                    </span>
                    <span className="text-lg font-bold text-gray-900 dark:text-gray-100">
                      LKR {assistanceData.avgIncome.toLocaleString()}
                    </span>
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      Employed
                    </span>
                    <span className="font-semibold text-[#FF6B00]">
                      {assistanceData.employed}
                    </span>
                  </div>
                  <div className="mt-1 flex items-center justify-between">
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      Unemployed
                    </span>
                    <span className="font-semibold text-red-600">
                      {assistanceData.unemployed}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Equipment Requirements */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Equipment Requirements</CardTitle>
              </CardHeader>
              <CardContent>
                {equipmentChartData.length === 0 ? (
                  <EmptyState title="No equipment data available" />
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={equipmentChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                        {equipmentChartData.map((_, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={COLORS[index % COLORS.length]}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            {/* Support Type Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  Support Type Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                {supportTypeChartData.length === 0 ? (
                  <EmptyState title="No support data available" />
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={supportTypeChartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                        label={({ name, percent }) =>
                          `${name} ${((percent ?? 0) * 100).toFixed(0)}%`
                        }
                      >
                        {supportTypeChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>
        </TabPanel>

        {/* Registration Reports Tab */}
        <TabPanel value="registration">
          <div className="mt-4 grid gap-6 lg:grid-cols-2">
            {/* Monthly Registrations */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-lg">Monthly Registrations</CardTitle>
              </CardHeader>
              <CardContent>
                {monthlyChartData.length === 0 ? (
                  <EmptyState title="No registration data available" />
                ) : (
                  <ResponsiveContainer width="100%" height={350}>
                    <LineChart data={monthlyChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="Registrations"
                        stroke={ORANGE}
                        strokeWidth={2}
                        dot={{ fill: ORANGE, strokeWidth: 2, r: 4 }}
                        activeDot={{ r: 6 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            {/* Registrations by Status */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  Persons by Registration Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                {statusChartData.length === 0 ? (
                  <EmptyState title="No status data available" />
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={statusChartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                        label={({ name, percent }) =>
                          `${name} ${((percent ?? 0) * 100).toFixed(0)}%`
                        }
                      >
                        {statusChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            {/* Summary Stats for Registration */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Registration Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between rounded-lg border border-gray-200 p-3 dark:border-gray-700">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Total Registered
                    </span>
                    <Badge variant="default">{totalPersons}</Badge>
                  </div>
                  <div className="flex items-center justify-between rounded-lg border border-gray-200 p-3 dark:border-gray-700">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Active Records
                    </span>
                    <Badge variant="success">{activePersons}</Badge>
                  </div>
                  <div className="flex items-center justify-between rounded-lg border border-gray-200 p-3 dark:border-gray-700">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Certified
                    </span>
                    <Badge variant="info">{certifiedPersons}</Badge>
                  </div>
                  <div className="flex items-center justify-between rounded-lg border border-gray-200 p-3 dark:border-gray-700">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Pending Certification
                    </span>
                    <Badge variant="warning">
                      {reportPersons.filter((p) => p.certificationStatus === "pending").length}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between rounded-lg border border-gray-200 p-3 dark:border-gray-700">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Monthly Average
                    </span>
                    <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                      {monthlyData.length > 0
                        ? Math.round(
                            monthlyData.reduce((s, m) => s + m.count, 0) /
                              monthlyData.length
                          )
                        : 0}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabPanel>
      </Tabs>
    </div>
  );
}
