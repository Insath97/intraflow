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
  ArrowRight,
  RefreshCw,
  Calendar,
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

const GENDER_COLORS = ["#FF6B00", "#3B82F6", "#8B5CF6"];
const AGE_COLORS = ["#FF6B00", "#3B82F6", "#F59E0B"];
const ASSISTANCE_COLORS = ["#FF6B00", "#3B82F6", "#8B5CF6", "#F59E0B", "#EF4444"];

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
      { name: "Government", value: gov, icon: ShieldCheck, color: "#FF6B00" },
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
      { name: "Employed", value: employed, color: "#FF6B00" },
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
        <RefreshCw className="h-6 w-6 animate-spin text-[#FF6B00]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Overview
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Here&apos;s the summary of overall data
          </p>
        </div>
        <div className="hidden items-center sm:flex">
          <div className="rounded-xl border border-gray-200 bg-white px-4 py-2 dark:border-white/5 dark:bg-[#1A1D2E]">
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                  {now.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
                </p>
                <p className="text-lg font-bold tabular-nums text-[#FF6B00]">
                  {now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                </p>
              </div>
              <div className="h-8 w-px bg-gray-200 dark:bg-white/10" />
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#FF6B00]/10">
                <Calendar className="h-4 w-4 text-[#FF6B00]" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Top Stats - Orange Gradient Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {/* Total Persons - Primary Card */}
        <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#FF6B00] to-[#E55A00] p-6 shadow-lg shadow-[#FF6B00]/20 transition-all hover:shadow-xl hover:shadow-[#FF6B00]/30">
          <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-white/10" />
          <div className="absolute -bottom-4 -right-4 h-16 w-16 rounded-full bg-white/5" />
          <div className="relative z-10">
            <div className="flex items-center justify-between">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20">
                <Users className="h-6 w-6 text-white" />
              </div>
              <span className="flex items-center gap-1 rounded-full bg-white/20 px-3 py-1 text-xs font-medium text-white">
                <TrendingUp className="h-3 w-3" />
                +8.4%
              </span>
            </div>
            <p className="mt-4 text-3xl font-bold text-white">
              {stats?.totalPersons.toLocaleString() || "0"}
            </p>
            <p className="text-sm text-white/70">Total Persons</p>
            <button
              onClick={() => router.push("/persons")}
              className="mt-4 flex items-center gap-1 text-sm font-medium text-white/90 transition-colors hover:text-white"
            >
              See details <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Active Records */}
        <div className="group relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-6 transition-all hover:shadow-lg dark:border-white/5 dark:bg-[#1A1D2E]">
          <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-[#FF6B00]/5" />
          <div className="relative z-10">
            <div className="flex items-center justify-between">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#FF6B00]/10">
                <UserCheck className="h-6 w-6 text-[#FF6B00]" />
              </div>
              <span className="flex items-center gap-1 rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-600 dark:bg-green-500/10 dark:text-green-400">
                <TrendingUp className="h-3 w-3" />
                +5.2%
              </span>
            </div>
            <p className="mt-4 text-3xl font-bold text-gray-900 dark:text-white">
              {stats?.activeRecords.toLocaleString() || "0"}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Active Records</p>
            <button
              onClick={() => router.push("/persons")}
              className="mt-4 flex items-center gap-1 text-sm font-medium text-gray-500 transition-colors hover:text-[#FF6B00] dark:text-gray-400"
            >
              View summary <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Registered This Month */}
        <div className="group relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-6 transition-all hover:shadow-lg dark:border-white/5 dark:bg-[#1A1D2E]">
          <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-[#FF6B00]/5" />
          <div className="relative z-10">
            <div className="flex items-center justify-between">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#FF6B00]/10">
                <UserPlus className="h-6 w-6 text-[#FF6B00]" />
              </div>
              <span className="flex items-center gap-1 rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">
                <TrendingUp className="h-3 w-3" />
                New
              </span>
            </div>
            <p className="mt-4 text-3xl font-bold text-gray-900 dark:text-white">
              {stats?.registeredThisMonth.toLocaleString() || "0"}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Registered This Month</p>
            <button
              onClick={() => router.push("/persons/create")}
              className="mt-4 flex items-center gap-1 text-sm font-medium text-gray-500 transition-colors hover:text-[#FF6B00] dark:text-gray-400"
            >
              Analyze performance <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Gender & Age Distribution */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Gender Distribution */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-white/5 dark:bg-[#1A1D2E]">
          <h3 className="mb-4 text-sm font-semibold text-gray-900 dark:text-white">
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
                    backgroundColor: "#1A1D2E",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: "12px",
                    fontSize: "12px",
                    color: "#fff",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 flex justify-center gap-4">
            {genderData.map((d, i) => (
              <div key={d.name} className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: GENDER_COLORS[i] }} />
                {d.name} ({d.value})
              </div>
            ))}
          </div>
        </div>

        {/* Age Group */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-white/5 dark:bg-[#1A1D2E]">
          <h3 className="mb-4 text-sm font-semibold text-gray-900 dark:text-white">
            Age Group Distribution
          </h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={ageData} barSize={40}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#6B7280" }} />
              <YAxis tick={{ fontSize: 11, fill: "#6B7280" }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1A1D2E",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: "12px",
                  fontSize: "12px",
                  color: "#fff",
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
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-white/5 dark:bg-[#1A1D2E]">
          <h3 className="mb-4 text-sm font-semibold text-gray-900 dark:text-white">
            Employment Status
          </h3>
          <div className="space-y-3">
            {employmentStats.map((item) => {
              const pct = allPersons.length > 0 ? Math.round((item.value / allPersons.length) * 100) : 0;
              return (
                <div key={item.name}>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500 dark:text-gray-400">{item.name}</span>
                    <span className="font-medium text-gray-900 dark:text-white">{item.value} ({pct}%)</span>
                  </div>
                  <div className="mt-1 h-2 overflow-hidden rounded-full bg-gray-100 dark:bg-white/5">
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
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-white/5 dark:bg-[#1A1D2E]">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
              Persons by District
            </h3>
            <span className="text-xs text-gray-500 dark:text-gray-500">Top 8</span>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={districtData} barSize={24}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#6B7280" }} angle={-35} textAnchor="end" height={60} />
              <YAxis tick={{ fontSize: 11, fill: "#6B7280" }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1A1D2E",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: "12px",
                  fontSize: "12px",
                  color: "#fff",
                }}
              />
              <Bar dataKey="count" fill="#FF6B00" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Monthly Registrations */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-white/5 dark:bg-[#1A1D2E]">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
              Monthly Registrations
            </h3>
            <span className="text-xs text-gray-500 dark:text-gray-500">Trend</span>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#6B7280" }} angle={-35} textAnchor="end" height={60} />
              <YAxis tick={{ fontSize: 11, fill: "#6B7280" }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1A1D2E",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: "12px",
                  fontSize: "12px",
                  color: "#fff",
                }}
              />
              <Line
                type="monotone"
                dataKey="count"
                stroke="#FF6B00"
                strokeWidth={2.5}
                dot={{ fill: "#FF6B00", r: 4 }}
                activeDot={{ r: 6, fill: "#FF6B00" }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Disability Types & Assistance Coverage */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Disability Types */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-white/5 dark:bg-[#1A1D2E]">
          <h3 className="mb-4 text-sm font-semibold text-gray-900 dark:text-white">
            Disability Types
          </h3>
          <div className="space-y-2.5">
            {disabilityData.map((item) => {
              const max = Math.max(...disabilityData.map((d) => d.count));
              const pct = max > 0 ? (item.count / max) * 100 : 0;
              return (
                <div key={item.name}>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500 dark:text-gray-400">{item.name}</span>
                    <span className="font-medium text-gray-900 dark:text-white">{item.count}</span>
                  </div>
                  <div className="mt-1 h-2 overflow-hidden rounded-full bg-gray-100 dark:bg-white/5">
                    <div
                      className="h-full rounded-full bg-[#FF6B00] transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Assistance Coverage */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-white/5 dark:bg-[#1A1D2E]">
          <h3 className="mb-4 text-sm font-semibold text-gray-900 dark:text-white">
            Assistance Coverage
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {assistanceStats.map((item) => {
              const Icon = item.icon;
              const pct = allPersons.length > 0 ? Math.round((item.value / allPersons.length) * 100) : 0;
              return (
                <div
                  key={item.name}
                  className="rounded-xl border border-gray-200 bg-gray-50 p-3 dark:border-white/5 dark:bg-[#0F1117]"
                >
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4" style={{ color: item.color }} />
                    <span className="text-xs text-gray-500 dark:text-gray-400">{item.name}</span>
                  </div>
                  <p className="mt-1 text-lg font-bold text-gray-900 dark:text-white">
                    {item.value}
                  </p>
                  <p className="text-[10px] text-gray-500 dark:text-gray-500">{pct}% coverage</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Certification & Equipment */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Certification Status */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-white/5 dark:bg-[#1A1D2E]">
          <h3 className="mb-4 text-sm font-semibold text-gray-900 dark:text-white">
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
                  <Cell fill="#FF6B00" />
                  <Cell fill="#F59E0B" />
                  <Cell fill="#EF4444" />
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1A1D2E",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: "12px",
                    fontSize: "12px",
                    color: "#fff",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 flex justify-center gap-4">
            <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
              <span className="h-2.5 w-2.5 rounded-full bg-[#FF6B00]" />
              Certified ({certificationStats.certified})
            </div>
            <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
              <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
              Pending ({certificationStats.pending})
            </div>
            <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
              <span className="h-2.5 w-2.5 rounded-full bg-red-500" />
              Not Certified ({certificationStats.notCertified})
            </div>
          </div>
        </div>

        {/* Equipment Requirements */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-white/5 dark:bg-[#1A1D2E]">
          <h3 className="mb-4 text-sm font-semibold text-gray-900 dark:text-white">
            Top Equipment Requirements
          </h3>
          <div className="space-y-3">
            {equipmentNeeds.map((item, i) => {
              const max = equipmentNeeds[0]?.count || 1;
              const pct = (item.count / max) * 100;
              return (
                <div key={item.name} className="flex items-center gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#FF6B00]/10 text-[10px] font-bold text-[#FF6B00]">
                    {i + 1}
                  </span>
                  <div className="flex-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-500 dark:text-gray-400">{item.name}</span>
                      <span className="font-medium text-gray-900 dark:text-white">{item.count}</span>
                    </div>
                    <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-gray-100 dark:bg-white/5">
                      <div
                        className="h-full rounded-full bg-[#FF6B00] transition-all"
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
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-white/5 dark:bg-[#1A1D2E] lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
              Recent Registrations
            </h3>
            <button
              onClick={() => router.push("/persons")}
              className="flex items-center gap-1 text-xs font-medium text-[#FF6B00] hover:text-[#E55A00]"
            >
              View All <ArrowRight className="h-3 w-3" />
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-gray-100 dark:border-white/5">
                  <th className="pb-2 font-medium text-gray-500 dark:text-gray-400">Reg. No</th>
                  <th className="pb-2 font-medium text-gray-500 dark:text-gray-400">Name</th>
                  <th className="hidden pb-2 font-medium text-gray-500 dark:text-gray-400 sm:table-cell">District</th>
                  <th className="hidden pb-2 font-medium text-gray-500 dark:text-gray-400 sm:table-cell">Disability</th>
                  <th className="pb-2 font-medium text-gray-500 dark:text-gray-400">Date</th>
                  <th className="pb-2 font-medium text-gray-500 dark:text-gray-400">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-white/5">
                {recentPersons.map((p) => (
                  <tr
                    key={p.id}
                    className="cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-white/5"
                    onClick={() => router.push(`/persons/${p.id}`)}
                  >
                    <td className="py-2.5 font-medium text-[#FF6B00]">{p.registrationNo}</td>
                    <td className="py-2.5 text-gray-900 dark:text-white">{p.fullName}</td>
                    <td className="hidden py-2.5 text-gray-500 dark:text-gray-400 sm:table-cell">
                      {districtNames[p.districtId] || "—"}
                    </td>
                    <td className="hidden py-2.5 text-gray-500 dark:text-gray-400 sm:table-cell">
                      {p.disabilityType}
                    </td>
                    <td className="py-2.5 text-gray-500 dark:text-gray-400">
                      {formatDate(p.registeredDate)}
                    </td>
                    <td className="py-2.5">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${
                          p.status === "active"
                            ? "bg-green-50 text-green-600 dark:bg-green-500/10 dark:text-green-400"
                            : p.status === "pending"
                            ? "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400"
                            : "bg-gray-100 text-gray-600 dark:bg-white/5 dark:text-gray-400"
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
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-white/5 dark:bg-[#1A1D2E]">
          <h3 className="mb-4 text-sm font-semibold text-gray-900 dark:text-white">
            Quick Actions
          </h3>
          <div className="space-y-2">
            <button
              onClick={() => router.push("/persons/create")}
              className="flex w-full items-center gap-3 rounded-xl border border-gray-200 bg-gray-50 p-3 text-left text-sm transition-colors hover:border-[#FF6B00] hover:bg-[#FF6B00]/5 dark:border-white/5 dark:bg-[#0F1117] dark:hover:border-[#FF6B00]"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FF6B00]/10">
                <UserPlus className="h-5 w-5 text-[#FF6B00]" />
              </div>
              <div>
                <p className="font-medium text-gray-900 dark:text-white">Register Person</p>
                <p className="text-[10px] text-gray-500 dark:text-gray-500">Add new PWD record</p>
              </div>
            </button>
            <button
              onClick={() => router.push("/reports")}
              className="flex w-full items-center gap-3 rounded-xl border border-gray-200 bg-gray-50 p-3 text-left text-sm transition-colors hover:border-[#FF6B00] hover:bg-[#FF6B00]/5 dark:border-white/5 dark:bg-[#0F1117] dark:hover:border-[#FF6B00]"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10">
                <Activity className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="font-medium text-gray-900 dark:text-white">View Reports</p>
                <p className="text-[10px] text-gray-500 dark:text-gray-500">Analytics & insights</p>
              </div>
            </button>
            <button
              onClick={() => router.push("/users")}
              className="flex w-full items-center gap-3 rounded-xl border border-gray-200 bg-gray-50 p-3 text-left text-sm transition-colors hover:border-[#FF6B00] hover:bg-[#FF6B00]/5 dark:border-white/5 dark:bg-[#0F1117] dark:hover:border-[#FF6B00]"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10">
                <Users className="h-5 w-5 text-violet-500" />
              </div>
              <div>
                <p className="font-medium text-gray-900 dark:text-white">Manage Users</p>
                <p className="text-[10px] text-gray-500 dark:text-gray-500">User administration</p>
              </div>
            </button>
            <button
              onClick={() => router.push("/territories")}
              className="flex w-full items-center gap-3 rounded-xl border border-gray-200 bg-gray-50 p-3 text-left text-sm transition-colors hover:border-[#FF6B00] hover:bg-[#FF6B00]/5 dark:border-white/5 dark:bg-[#0F1117] dark:hover:border-[#FF6B00]"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10">
                <MapPin className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <p className="font-medium text-gray-900 dark:text-white">Territories</p>
                <p className="text-[10px] text-gray-500 dark:text-gray-500">Location hierarchy</p>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Gender Split & Age Summary */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-white/5 dark:bg-[#1A1D2E]">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10">
              <Users className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <p className="text-lg font-bold text-gray-900 dark:text-white">{stats?.maleCount || 0}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Male Persons</p>
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-white/5 dark:bg-[#1A1D2E]">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-pink-500/10">
              <Heart className="h-5 w-5 text-pink-500" />
            </div>
            <div>
              <p className="text-lg font-bold text-gray-900 dark:text-white">{stats?.femaleCount || 0}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Female Persons</p>
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-white/5 dark:bg-[#1A1D2E]">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10">
              <Clock className="h-5 w-5 text-amber-500" />
            </div>
            <div>
              <p className="text-lg font-bold text-gray-900 dark:text-white">{stats?.childrenCount || 0}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Children (&lt;18)</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
