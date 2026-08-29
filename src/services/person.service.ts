import type { Person, DashboardStats, ChartDataPoint, MonthlyRegistration } from '@/types';
import { generateId, generateRegistrationNo, getAgeGroup } from '@/lib/utils';

const STORAGE_KEY = 'mis_persons';

function getAll(): Person[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function getById(id: string): Person | null {
  try {
    const persons = getAll();
    return persons.find((p) => p.id === id) || null;
  } catch {
    return null;
  }
}

function create(person: Omit<Person, 'id' | 'registrationNo' | 'createdAt' | 'updatedAt'>): Person {
  const persons = getAll();
  const now = new Date().toISOString();
  const newPerson: Person = {
    ...person,
    id: generateId(),
    registrationNo: generateRegistrationNo(),
    createdAt: now,
    updatedAt: now,
  };
  persons.push(newPerson);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(persons));
  return newPerson;
}

function update(id: string, data: Partial<Person>): Person | null {
  const persons = getAll();
  const index = persons.findIndex((p) => p.id === id);
  if (index === -1) return null;
  const updated: Person = {
    ...persons[index],
    ...data,
    id,
    updatedAt: new Date().toISOString(),
  };
  persons[index] = updated;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(persons));
  return updated;
}

function remove(id: string): boolean {
  const persons = getAll();
  const filtered = persons.filter((p) => p.id !== id);
  if (filtered.length === persons.length) return false;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  return true;
}

function search(query: string): Person[] {
  try {
    const persons = getAll();
    const lower = query.toLowerCase();
    return persons.filter(
      (p) =>
        p.fullName.toLowerCase().includes(lower) ||
        p.registrationNo.toLowerCase().includes(lower) ||
        p.nicNumber.toLowerCase().includes(lower) ||
        p.contactNumber.includes(query)
    );
  } catch {
    return [];
  }
}

function getByDistrict(districtId: string): Person[] {
  try {
    return getAll().filter((p) => p.districtId === districtId);
  } catch {
    return [];
  }
}

function getByStatus(status: Person['status']): Person[] {
  try {
    return getAll().filter((p) => p.status === status);
  } catch {
    return [];
  }
}

function getStats(): DashboardStats {
  const persons = getAll();
  const now = new Date();
  const thisMonth = now.getMonth();
  const thisYear = now.getFullYear();

  const totalPersons = persons.length;
  const activeRecords = persons.filter((p) => p.status === 'active').length;

  const districtSet = new Set(persons.map((p) => p.districtId));
  const districts = districtSet.size;

  const registeredThisMonth = persons.filter((p) => {
    const d = new Date(p.registeredDate);
    return d.getMonth() === thisMonth && d.getFullYear() === thisYear;
  }).length;

  const maleCount = persons.filter((p) => p.gender === 'male').length;
  const femaleCount = persons.filter((p) => p.gender === 'female').length;
  const otherCount = persons.filter((p) => p.gender === 'other').length;

  const childrenCount = persons.filter((p) => getAgeGroup(p.age) === 'Children').length;
  const adultsCount = persons.filter((p) => getAgeGroup(p.age) === 'Adults').length;
  const elderlyCount = persons.filter((p) => getAgeGroup(p.age) === 'Elderly').length;

  return {
    totalPersons,
    activeRecords,
    districts,
    registeredThisMonth,
    maleCount,
    femaleCount,
    otherCount,
    childrenCount,
    adultsCount,
    elderlyCount,
  };
}

function getChartData() {
  const persons = getAll();

  const districtCounts: Record<string, number> = {};
  persons.forEach((p) => {
    districtCounts[p.districtId] = (districtCounts[p.districtId] || 0) + 1;
  });
  const byDistrict: ChartDataPoint[] = Object.entries(districtCounts).map(([name, value]) => ({
    name,
    value,
  }));

  const genderCounts: Record<string, number> = {};
  persons.forEach((p) => {
    genderCounts[p.gender] = (genderCounts[p.gender] || 0) + 1;
  });
  const byGender: ChartDataPoint[] = Object.entries(genderCounts).map(([name, value]) => ({
    name,
    value,
  }));

  const ageGroupCounts: Record<string, number> = {};
  persons.forEach((p) => {
    const group = getAgeGroup(p.age);
    ageGroupCounts[group] = (ageGroupCounts[group] || 0) + 1;
  });
  const byAgeGroup: ChartDataPoint[] = Object.entries(ageGroupCounts).map(([name, value]) => ({
    name,
    value,
  }));

  const disabilityCounts: Record<string, number> = {};
  persons.forEach((p) => {
    disabilityCounts[p.disabilityType] = (disabilityCounts[p.disabilityType] || 0) + 1;
  });
  const byDisabilityType: ChartDataPoint[] = Object.entries(disabilityCounts).map(([name, value]) => ({
    name,
    value,
  }));

  const monthCounts: Record<string, number> = {};
  persons.forEach((p) => {
    const d = new Date(p.registeredDate);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    monthCounts[key] = (monthCounts[key] || 0) + 1;
  });
  const monthlyRegistrations: MonthlyRegistration[] = Object.entries(monthCounts)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, count]) => ({ month, count }));

  return { byDistrict, byGender, byAgeGroup, byDisabilityType, monthlyRegistrations };
}

export const PersonService = {
  getAll,
  getById,
  create,
  update,
  remove,
  search,
  getByDistrict,
  getByStatus,
  getStats,
  getChartData,
};
