import type { Person, ChartDataPoint, MonthlyRegistration } from '@/types';
import { getAgeGroup } from '@/lib/utils';

const STORAGE_KEY = 'mis_persons';

function getPersons(): Person[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function getPersonsByDistrict(): ChartDataPoint[] {
  const persons = getPersons();
  const counts: Record<string, number> = {};
  persons.forEach((p) => {
    counts[p.districtId] = (counts[p.districtId] || 0) + 1;
  });
  return Object.entries(counts).map(([name, value]) => ({ name, value }));
}

function getPersonsByGender(): ChartDataPoint[] {
  const persons = getPersons();
  const counts: Record<string, number> = {};
  persons.forEach((p) => {
    counts[p.gender] = (counts[p.gender] || 0) + 1;
  });
  const colors: Record<string, string> = {
    male: '#3b82f6',
    female: '#ec4899',
    other: '#8b5cf6',
  };
  return Object.entries(counts).map(([name, value]) => ({
    name,
    value,
    fill: colors[name] || '#6b7280',
  }));
}

function getPersonsByAgeGroup(): ChartDataPoint[] {
  const persons = getPersons();
  const counts: Record<string, number> = {};
  persons.forEach((p) => {
    const group = getAgeGroup(p.age);
    counts[group] = (counts[group] || 0) + 1;
  });
  const colors: Record<string, string> = {
    Children: '#10b981',
    Adults: '#3b82f6',
    Elderly: '#f59e0b',
  };
  return Object.entries(counts).map(([name, value]) => ({
    name,
    value,
    fill: colors[name] || '#6b7280',
  }));
}

function getPersonsByDisabilityType(): ChartDataPoint[] {
  const persons = getPersons();
  const counts: Record<string, number> = {};
  persons.forEach((p) => {
    counts[p.disabilityType] = (counts[p.disabilityType] || 0) + 1;
  });
  return Object.entries(counts)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
}

function getMonthlyRegistrations(): MonthlyRegistration[] {
  const persons = getPersons();
  const counts: Record<string, number> = {};
  persons.forEach((p) => {
    const d = new Date(p.registeredDate);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    counts[key] = (counts[key] || 0) + 1;
  });
  return Object.entries(counts)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, count]) => ({ month, count }));
}

function getPersonsByProvince(): ChartDataPoint[] {
  const persons = getPersons();
  const counts: Record<string, number> = {};
  persons.forEach((p) => {
    counts[p.provinceId] = (counts[p.provinceId] || 0) + 1;
  });
  return Object.entries(counts).map(([name, value]) => ({ name, value }));
}

function getAssistanceReport() {
  const persons = getPersons();
  const active = persons.filter((p) => p.status === 'active');

  return {
    total: active.length,
    governmentAssistance: active.filter((p) => p.governmentAssistance).length,
    medicalAssistance: active.filter((p) => p.medicalAssistance).length,
    educationSupport: active.filter((p) => p.educationSupport).length,
    employmentSupport: active.filter((p) => p.employmentSupport).length,
    certified: active.filter((p) => p.certificationStatus === 'certified').length,
    pending: active.filter((p) => p.certificationStatus === 'pending').length,
    notCertified: active.filter((p) => p.certificationStatus === 'not_certified').length,
    avgIncome:
      active.length > 0
        ? Math.round(active.reduce((sum, p) => sum + p.monthlyIncome, 0) / active.length)
        : 0,
    employed: active.filter(
      (p) =>
        p.employmentStatus === 'Employed' || p.employmentStatus === 'Self Employed'
    ).length,
    unemployed: active.filter((p) => p.employmentStatus === 'Unemployed').length,
  };
}

interface ReportFilters {
  districtId?: string;
  provinceId?: string;
  disabilityType?: string;
  gender?: string;
  ageGroup?: string;
  certificationStatus?: string;
  startDate?: string;
  endDate?: string;
}

function generateReport(filters: ReportFilters): Person[] {
  let persons = getPersons();

  if (filters.districtId) {
    persons = persons.filter((p) => p.districtId === filters.districtId);
  }
  if (filters.provinceId) {
    persons = persons.filter((p) => p.provinceId === filters.provinceId);
  }
  if (filters.disabilityType) {
    persons = persons.filter((p) => p.disabilityType === filters.disabilityType);
  }
  if (filters.gender) {
    persons = persons.filter((p) => p.gender === filters.gender);
  }
  if (filters.ageGroup) {
    persons = persons.filter((p) => getAgeGroup(p.age) === filters.ageGroup);
  }
  if (filters.certificationStatus) {
    persons = persons.filter((p) => p.certificationStatus === filters.certificationStatus);
  }
  if (filters.startDate) {
    persons = persons.filter((p) => p.registeredDate >= filters.startDate!);
  }
  if (filters.endDate) {
    persons = persons.filter((p) => p.registeredDate <= filters.endDate!);
  }

  return persons;
}

export const ReportService = {
  getPersonsByDistrict,
  getPersonsByGender,
  getPersonsByAgeGroup,
  getPersonsByDisabilityType,
  getMonthlyRegistrations,
  getPersonsByProvince,
  getAssistanceReport,
  generateReport,
};
