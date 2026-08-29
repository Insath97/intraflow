"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Users,
  UserCheck,
  MapPin,
  UserPlus,
  TrendingUp,
  Activity,
  Stethoscope,
  GraduationCap,
  Briefcase,
  Heart,
  ShieldCheck,
  Clock,
  AlertCircle,
  ArrowRight,
  RefreshCw,
} from "lucide-react";
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
import { PersonService } from "@/services";
import { TerritoryService } from "@/services";
import { useAuthStore } from "@/lib/auth";
import { formatDate, getAgeGroup } from "@/lib/utils";
import type { Person, DashboardStats, ChartDataPoint, MonthlyRegistration } from "@/types";

const GENDER_COLORS = ["#3B82F6", "#EC4899", "#8B5CF6"];
const AGE_COLORS = ["#F59E0B", "#168B61", "#EF4444"];
const ASSISTANCE_COLORS = ["#168B61", "#3B82F6", "#8B5CF6", "#F59E0B", "#EF4444"];

export default function DashboardPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [chartData, setChartData] = useState<{
    byDistrict: ChartDataPoint[];
    byGender: ChartDataPoint[];
    byAgeGroup: ChartDataPoint[];
    byDisabilityType: ChartDataPoint[];
    monthlyRegistrations: MonthlyRegistration[];
  } | null>(null);
  const [recentPersons, setRecentPersons] = useState<Person[]>([]);
  const [districtNames, setDistrictNames] = useState<Record<string, string>>({});
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const s = PersonService.getStats();
    const c = PersonService.getChartData();
    const all = PersonService.getAll();
    const recent = [...all]
      .sort((a, b) => new Date(b.registeredDate).getTime() - new Date(a.registeredDate).getTime())
      .slice(0, 5);

    const districts = TerritoryService.getDistricts();
    const dMap: Record<string, string> = {};
    districts.forEach((d) => { dMap[d.id] = d.name; });

    setStats(s);
    setChartData(c);
    setRecentPersons(recent);
    setDistrictNames(dMap);
    setLoading(false);
  }, []);

  const genderData = useMemo(() => {
    if (!chartData) return [];
    return chartData.byGender.map((d) => ({
      name: d.name.charAt(0).toUpperCase() + d.name.slice(1),
      value: d.value,
    }));
  }, [chartData]);

  const districtData = useMemo(() => {
    if (!chartData) return [];
    return chartData.byDistrict
      .map((d) => ({
        name: districtNames[d.name] || d.name,
        count: d.value,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);
  }, [chartData, districtNames]);

  const ageData = useMemo(() => {
    if (!chartData) return [];
    return chartData.byAgeGroup.map((d) => ({
      name: d.name,
      count: d.value,
    }));
  }, [chartData]);

  const disabilityData = useMemo(() => {
    if (!chartData) return [];
    return chartData.byDisabilityType
      .map((d) => ({
        name: d.name,
        count: d.value,
      }))
      .sort((a, b) => b.count - a.count);
  }, [chartData]);

  const monthlyData = useMemo(() => {
    if (!chartData) return [];
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return chartData.monthlyRegistrations.map((d) => {
      const [year, month] = d.month.split("-");
      return {
        name: months[parseInt(month, 10) - 1] + " " + year.slice(2),
        count: d.count,
      };
    });
  }, [chartData]);

  const allPersons = useMemo(() => PersonService.getAll(), []);

  const assistanceStats = useMemo(() => {
    const gov = allPersons.filter((p) => p.governmentAssistance).length;
    const medical = allPersons.filter((p) => p.medicalAssistance).length;
    const edu = allPersons.filter((p) => p.educationSupport).length;
    const emp = allPersons.filter((p) => p.employmentSupport).length;
    return [
      { name: "Government", value: gov, icon: ShieldCheck, color: "#168B61" },
      { name: "Medical", value: medical, icon: Stethoscope, color: "#3B82F6" },
      { name: "Education", value: edu, icon: GraduationCap, color: "#8B5CF6" },
      { name: "Employment", value: emp, icon: Briefcase, color: "#F59E0B" },
    ];
  }, [allPersons]);

  const employmentStats = useMemo(() => {
    const employed = allPersons.filter((p) => p.employmentStatus === "Employed").length;
    const self = allPersons.filter((p) => p.employmentStatus === "Self Employed").length;
    const unemployed = allPersons.filter((p) => p.employmentStatus === "Unemployed").length;
    const student = allPersons.filter((p) => p.employmentStatus === "Student").length;
    const retired = allPersons.filter((p) => p.employmentStatus === "Retired").length;
    return [
      { name: "Employed", value: employed, color: "#168B61" },
      { name: "Self Employed", value: self, color: "#3B82F6" },
      { name: "Unemployed", value: unemployed, color: "#EF4444" },
      { name: "Student", value: student, color: "#F59E0B" },
      { name: "Retired", value: retired, color: "#6B7280" },
    ];
  }, [allPersons]);

  const certificationStats = useMemo(() => {
    const certified = allPersons.filter((p) => p.certificationStatus === "certified").length;
    const pending = allPersons.filter((p) => p.certificationStatus === "pending").length;
    const notCertified = allPersons.filter((p) => p.certificationStatus === "not_certified").length;
    return { certified, pending, notCertified, total: allPersons.length };
  }, [allPersons]);

  const equipmentNeeds = useMemo(() => {
    const counts: Record<string, number> = {};
    allPersons.forEach((p) => {
      p.equipmentRequired.forEach((eq) => {
        counts[eq] = (counts[eq] || 0) + 1;
      });
    });
    return Object.entries(counts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [allPersons]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <RefreshCw className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary dark:text-white">
            Dashboard
          </h1>
          <p className="text-sm text-text-muted dark:text-gray-400">
            Welcome back, {user?.name || "Administrator"}
          </p>
        </div>
        <div className="hidden items-center sm:flex">
          <div className="rounded-lg border border-border bg-surface px-4 py-2 dark:border-gray-700 dark:bg-gray-800">
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-xs font-medium text-text-muted dark:text-gray-400">
                  {now.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
                </p>
                <p className="text-lg font-bold tabular-nums text-primary">
                  {now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                </p>
              </div>
              <div className="h-8 w-px bg-border dark:bg-gray-700" />
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
                <Clock className="h-4 w-4 text-primary" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Top Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="group rounded-xl border border-border bg-surface p-5 transition-shadow hover:shadow-md dark:border-gray-700 dark:bg-gray-800">
          <div className="flex items-center justify-between">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <span className="flex items-center gap-1 rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-600 dark:bg-green-900/30 dark:text-green-400">
              <TrendingUp className="h-3 w-3" />
              +8.4%
            </span>
          </div>
          <p className="mt-3 text-2xl font-bold text-text-primary dark:text-white">
            {stats?.totalPersons.toLocaleString() || "0"}
          </p>
          <p className="text-sm text-text-muted dark:text-gray-400">Total Persons</p>
        </div>

        <div className="group rounded-xl border border-border bg-surface p-5 transition-shadow hover:shadow-md dark:border-gray-700 dark:bg-gray-800">
          <div className="flex items-center justify-between">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-900/30">
              <UserCheck className="h-5 w-5 text-blue-600" />
            </div>
            <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
              Active
            </span>
          </div>
          <p className="mt-3 text-2xl font-bold text-text-primary dark:text-white">
            {stats?.activeRecords.toLocaleString() || "0"}
          </p>
          <p className="text-sm text-text-muted dark:text-gray-400">Active Records</p>
        </div>

        <div className="group rounded-xl border border-border bg-surface p-5 transition-shadow hover:shadow-md dark:border-gray-700 dark:bg-gray-800">
          <div className="flex items-center justify-between">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-violet-50 dark:bg-violet-900/30">
              <MapPin className="h-5 w-5 text-violet-600" />
            </div>
            <span className="rounded-full bg-violet-50 px-2 py-0.5 text-xs font-medium text-violet-600 dark:bg-violet-900/30 dark:text-violet-400">
              Coverage
            </span>
          </div>
          <p className="mt-3 text-2xl font-bold text-text-primary dark:text-white">
            {stats?.districts || "0"}
          </p>
          <p className="text-sm text-text-muted dark:text-gray-400">Districts Covered</p>
        </div>

        <div className="group rounded-xl border border-border bg-surface p-5 transition-shadow hover:shadow-md dark:border-gray-700 dark:bg-gray-800">
          <div className="flex items-center justify-between">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-amber-50 dark:bg-amber-900/30">
              <UserPlus className="h-5 w-5 text-amber-600" />
            </div>
            <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-600 dark:bg-amber-900/30 dark:text-amber-400">
              New
            </span>
          </div>
          <p className="mt-3 text-2xl font-bold text-text-primary dark:text-white">
            {stats?.registeredThisMonth.toLocaleString() || "0"}
          </p>
          <p className="text-sm text-text-muted dark:text-gray-400">Registered This Month</p>
        </div>
      </div>

      {/* Gender & Age Distribution */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Gender Distribution */}
        <div className="rounded-xl border border-border bg-surface p-5 dark:border-gray-700 dark:bg-gray-800">
          <h3 className="mb-4 text-sm font-semibold text-text-primary dark:text-white">
            Gender Distribution
          </h3>
          <div className="flex items-center justify-center">
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={genderData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  dataKey="value"
                  stroke="none"
                >
                  {genderData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={GENDER_COLORS[index % GENDER_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#fff",
                    border: "1px solid #E5E7EB",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 flex justify-center gap-4">
            {genderData.map((d, i) => (
              <div key={d.name} className="flex items-center gap-1.5 text-xs text-text-muted dark:text-gray-400">
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: GENDER_COLORS[i] }} />
                {d.name} ({d.value})
              </div>
            ))}
          </div>
        </div>

        {/* Age Group */}
        <div className="rounded-xl border border-border bg-surface p-5 dark:border-gray-700 dark:bg-gray-800">
          <h3 className="mb-4 text-sm font-semibold text-text-primary dark:text-white">
            Age Group Distribution
          </h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={ageData} barSize={40}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#fff",
                  border: "1px solid #E5E7EB",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
              />
              <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                {ageData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={AGE_COLORS[index % AGE_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Employment Status */}
        <div className="rounded-xl border border-border bg-surface p-5 dark:border-gray-700 dark:bg-gray-800">
          <h3 className="mb-4 text-sm font-semibold text-text-primary dark:text-white">
            Employment Status
          </h3>
          <div className="space-y-3">
            {employmentStats.map((item) => {
              const pct = allPersons.length > 0 ? Math.round((item.value / allPersons.length) * 100) : 0;
              return (
                <div key={item.name}>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-text-muted dark:text-gray-400">{item.name}</span>
                    <span className="font-medium text-text-primary dark:text-white">{item.value} ({pct}%)</span>
                  </div>
                  <div className="mt-1 h-2 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-700">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${pct}%`, backgroundColor: item.color }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Persons by District */}
        <div className="rounded-xl border border-border bg-surface p-5 dark:border-gray-700 dark:bg-gray-800">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-text-primary dark:text-white">
              Persons by District
            </h3>
            <span className="text-xs text-text-muted dark:text-gray-500">Top 8</span>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={districtData} barSize={24}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-35} textAnchor="end" height={60} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#fff",
                  border: "1px solid #E5E7EB",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
              />
              <Bar dataKey="count" fill="#168B61" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Monthly Registrations */}
        <div className="rounded-xl border border-border bg-surface p-5 dark:border-gray-700 dark:bg-gray-800">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-text-primary dark:text-white">
              Monthly Registrations
            </h3>
            <span className="text-xs text-text-muted dark:text-gray-500">Trend</span>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-35} textAnchor="end" height={60} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#fff",
                  border: "1px solid #E5E7EB",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
              />
              <Line
                type="monotone"
                dataKey="count"
                stroke="#168B61"
                strokeWidth={2.5}
                dot={{ fill: "#168B61", r: 4 }}
                activeDot={{ r: 6, fill: "#168B61" }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Disability Types & Assistance Coverage */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Disability Types */}
        <div className="rounded-xl border border-border bg-surface p-5 dark:border-gray-700 dark:bg-gray-800">
          <h3 className="mb-4 text-sm font-semibold text-text-primary dark:text-white">
            Disability Types
          </h3>
          <div className="space-y-2.5">
            {disabilityData.map((item) => {
              const max = Math.max(...disabilityData.map((d) => d.count));
              const pct = max > 0 ? (item.count / max) * 100 : 0;
              return (
                <div key={item.name}>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-text-muted dark:text-gray-400">{item.name}</span>
                    <span className="font-medium text-text-primary dark:text-white">{item.count}</span>
                  </div>
                  <div className="mt-1 h-2 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-700">
                    <div
                      className="h-full rounded-full bg-primary transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Assistance Coverage */}
        <div className="rounded-xl border border-border bg-surface p-5 dark:border-gray-700 dark:bg-gray-800">
          <h3 className="mb-4 text-sm font-semibold text-text-primary dark:text-white">
            Assistance Coverage
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {assistanceStats.map((item) => {
              const Icon = item.icon;
              const pct = allPersons.length > 0 ? Math.round((item.value / allPersons.length) * 100) : 0;
              return (
                <div
                  key={item.name}
                  className="rounded-lg border border-border bg-background p-3 dark:border-gray-700 dark:bg-gray-900"
                >
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4" style={{ color: item.color }} />
                    <span className="text-xs text-text-muted dark:text-gray-400">{item.name}</span>
                  </div>
                  <p className="mt-1 text-lg font-bold text-text-primary dark:text-white">
                    {item.value}
                  </p>
                  <p className="text-[10px] text-text-muted dark:text-gray-500">{pct}% coverage</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Certification & Equipment */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Certification Status */}
        <div className="rounded-xl border border-border bg-surface p-5 dark:border-gray-700 dark:bg-gray-800">
          <h3 className="mb-4 text-sm font-semibold text-text-primary dark:text-white">
            Certification Status
          </h3>
          <div className="flex items-center justify-center">
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={[
                    { name: "Certified", value: certificationStats.certified },
                    { name: "Pending", value: certificationStats.pending },
                    { name: "Not Certified", value: certificationStats.notCertified },
                  ]}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  dataKey="value"
                  stroke="none"
                >
                  <Cell fill="#168B61" />
                  <Cell fill="#F59E0B" />
                  <Cell fill="#EF4444" />
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#fff",
                    border: "1px solid #E5E7EB",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 flex justify-center gap-4">
            <div className="flex items-center gap-1.5 text-xs text-text-muted dark:text-gray-400">
              <span className="h-2.5 w-2.5 rounded-full bg-[#168B61]" />
              Certified ({certificationStats.certified})
            </div>
            <div className="flex items-center gap-1.5 text-xs text-text-muted dark:text-gray-400">
              <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
              Pending ({certificationStats.pending})
            </div>
            <div className="flex items-center gap-1.5 text-xs text-text-muted dark:text-gray-400">
              <span className="h-2.5 w-2.5 rounded-full bg-red-500" />
              Not Certified ({certificationStats.notCertified})
            </div>
          </div>
        </div>

        {/* Equipment Requirements */}
        <div className="rounded-xl border border-border bg-surface p-5 dark:border-gray-700 dark:bg-gray-800">
          <h3 className="mb-4 text-sm font-semibold text-text-primary dark:text-white">
            Top Equipment Requirements
          </h3>
          <div className="space-y-3">
            {equipmentNeeds.map((item, i) => {
              const max = equipmentNeeds[0]?.count || 1;
              const pct = (item.count / max) * 100;
              return (
                <div key={item.name} className="flex items-center gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">
                    {i + 1}
                  </span>
                  <div className="flex-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-text-muted dark:text-gray-400">{item.name}</span>
                      <span className="font-medium text-text-primary dark:text-white">{item.count}</span>
                    </div>
                    <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-700">
                      <div
                        className="h-full rounded-full bg-primary transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Recent Registrations & Quick Actions */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Recent Registrations */}
        <div className="rounded-xl border border-border bg-surface p-5 dark:border-gray-700 dark:bg-gray-800 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-text-primary dark:text-white">
              Recent Registrations
            </h3>
            <button
              onClick={() => router.push("/persons")}
              className="flex items-center gap-1 text-xs font-medium text-primary hover:text-primary-dark"
            >
              View All <ArrowRight className="h-3 w-3" />
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-border dark:border-gray-700">
                  <th className="pb-2 font-medium text-text-muted dark:text-gray-400">Reg. No</th>
                  <th className="pb-2 font-medium text-text-muted dark:text-gray-400">Name</th>
                  <th className="hidden pb-2 font-medium text-text-muted dark:text-gray-400 sm:table-cell">District</th>
                  <th className="hidden pb-2 font-medium text-text-muted dark:text-gray-400 sm:table-cell">Disability</th>
                  <th className="pb-2 font-medium text-text-muted dark:text-gray-400">Date</th>
                  <th className="pb-2 font-medium text-text-muted dark:text-gray-400">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border dark:divide-gray-700">
                {recentPersons.map((p) => (
                  <tr
                    key={p.id}
                    className="cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/50"
                    onClick={() => router.push(`/persons/${p.id}`)}
                  >
                    <td className="py-2.5 font-medium text-primary">{p.registrationNo}</td>
                    <td className="py-2.5 text-text-primary dark:text-white">{p.fullName}</td>
                    <td className="hidden py-2.5 text-text-muted dark:text-gray-400 sm:table-cell">
                      {districtNames[p.districtId] || "—"}
                    </td>
                    <td className="hidden py-2.5 text-text-muted dark:text-gray-400 sm:table-cell">
                      {p.disabilityType}
                    </td>
                    <td className="py-2.5 text-text-muted dark:text-gray-400">
                      {formatDate(p.registeredDate)}
                    </td>
                    <td className="py-2.5">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${
                          p.status === "active"
                            ? "bg-green-50 text-green-600 dark:bg-green-900/30 dark:text-green-400"
                            : p.status === "pending"
                            ? "bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400"
                            : "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400"
                        }`}
                      >
                        {p.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="rounded-xl border border-border bg-surface p-5 dark:border-gray-700 dark:bg-gray-800">
          <h3 className="mb-4 text-sm font-semibold text-text-primary dark:text-white">
            Quick Actions
          </h3>
          <div className="space-y-2">
            <button
              onClick={() => router.push("/persons/create")}
              className="flex w-full items-center gap-3 rounded-lg border border-border bg-background p-3 text-left text-sm transition-colors hover:border-primary hover:bg-primary/5 dark:border-gray-700 dark:bg-gray-900 dark:hover:border-primary"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                <UserPlus className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="font-medium text-text-primary dark:text-white">Register Person</p>
                <p className="text-[10px] text-text-muted dark:text-gray-500">Add new PWD record</p>
              </div>
            </button>
            <button
              onClick={() => router.push("/reports")}
              className="flex w-full items-center gap-3 rounded-lg border border-border bg-background p-3 text-left text-sm transition-colors hover:border-primary hover:bg-primary/5 dark:border-gray-700 dark:bg-gray-900 dark:hover:border-primary"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-900/30">
                <Activity className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <p className="font-medium text-text-primary dark:text-white">View Reports</p>
                <p className="text-[10px] text-text-muted dark:text-gray-500">Analytics & insights</p>
              </div>
            </button>
            <button
              onClick={() => router.push("/users")}
              className="flex w-full items-center gap-3 rounded-lg border border-border bg-background p-3 text-left text-sm transition-colors hover:border-primary hover:bg-primary/5 dark:border-gray-700 dark:bg-gray-900 dark:hover:border-primary"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-50 dark:bg-violet-900/30">
                <Users className="h-4 w-4 text-violet-600" />
              </div>
              <div>
                <p className="font-medium text-text-primary dark:text-white">Manage Users</p>
                <p className="text-[10px] text-text-muted dark:text-gray-500">User administration</p>
              </div>
            </button>
            <button
              onClick={() => router.push("/territories")}
              className="flex w-full items-center gap-3 rounded-lg border border-border bg-background p-3 text-left text-sm transition-colors hover:border-primary hover:bg-primary/5 dark:border-gray-700 dark:bg-gray-900 dark:hover:border-primary"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 dark:bg-amber-900/30">
                <MapPin className="h-4 w-4 text-amber-600" />
              </div>
              <div>
                <p className="font-medium text-text-primary dark:text-white">Territories</p>
                <p className="text-[10px] text-text-muted dark:text-gray-500">Location hierarchy</p>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Gender Split & Age Summary */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-border bg-surface p-4 dark:border-gray-700 dark:bg-gray-800">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-900/30">
              <Users className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-lg font-bold text-text-primary dark:text-white">{stats?.maleCount || 0}</p>
              <p className="text-xs text-text-muted dark:text-gray-400">Male Persons</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-border bg-surface p-4 dark:border-gray-700 dark:bg-gray-800">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-pink-50 dark:bg-pink-900/30">
              <Heart className="h-5 w-5 text-pink-600" />
            </div>
            <div>
              <p className="text-lg font-bold text-text-primary dark:text-white">{stats?.femaleCount || 0}</p>
              <p className="text-xs text-text-muted dark:text-gray-400">Female Persons</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-border bg-surface p-4 dark:border-gray-700 dark:bg-gray-800">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50 dark:bg-amber-900/30">
              <Clock className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-lg font-bold text-text-primary dark:text-white">{stats?.childrenCount || 0}</p>
              <p className="text-xs text-text-muted dark:text-gray-400">Children (&lt;18)</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
