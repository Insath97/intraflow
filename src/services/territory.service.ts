import type { Province, District, DSDivision, GNDivision } from '@/types';
import { generateId } from '@/lib/utils';

const PROVINCES_KEY = 'mis_provinces';
const DISTRICTS_KEY = 'mis_districts';
const DS_KEY = 'mis_ds_divisions';
const GN_KEY = 'mis_gn_divisions';

function getFromStorage<T>(key: string): T[] {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function setToStorage<T>(key: string, data: T[]): void {
  localStorage.setItem(key, JSON.stringify(data));
}

// Provinces
function getProvinces(): Province[] {
  return getFromStorage<Province>(PROVINCES_KEY);
}

function getProvinceById(id: string): Province | null {
  return getProvinces().find((p) => p.id === id) || null;
}

function createProvince(data: Omit<Province, 'id'>): Province {
  const items = getProvinces();
  const newItem: Province = { ...data, id: generateId() };
  items.push(newItem);
  setToStorage(PROVINCES_KEY, items);
  return newItem;
}

function updateProvince(id: string, data: Partial<Province>): Province | null {
  const items = getProvinces();
  const index = items.findIndex((p) => p.id === id);
  if (index === -1) return null;
  items[index] = { ...items[index], ...data, id };
  setToStorage(PROVINCES_KEY, items);
  return items[index];
}

function deleteProvince(id: string): boolean {
  const items = getProvinces();
  const filtered = items.filter((p) => p.id !== id);
  if (filtered.length === items.length) return false;
  setToStorage(PROVINCES_KEY, filtered);
  return true;
}

// Districts
function getDistricts(): District[] {
  return getFromStorage<District>(DISTRICTS_KEY);
}

function getDistrictById(id: string): District | null {
  return getDistricts().find((d) => d.id === id) || null;
}

function getDistrictsByProvince(provinceId: string): District[] {
  return getDistricts().filter((d) => d.provinceId === provinceId);
}

function createDistrict(data: Omit<District, 'id'>): District {
  const items = getDistricts();
  const newItem: District = { ...data, id: generateId() };
  items.push(newItem);
  setToStorage(DISTRICTS_KEY, items);
  return newItem;
}

function updateDistrict(id: string, data: Partial<District>): District | null {
  const items = getDistricts();
  const index = items.findIndex((d) => d.id === id);
  if (index === -1) return null;
  items[index] = { ...items[index], ...data, id };
  setToStorage(DISTRICTS_KEY, items);
  return items[index];
}

function deleteDistrict(id: string): boolean {
  const items = getDistricts();
  const filtered = items.filter((d) => d.id !== id);
  if (filtered.length === items.length) return false;
  setToStorage(DISTRICTS_KEY, filtered);
  return true;
}

// DS Divisions
function getDSDivisions(): DSDivision[] {
  return getFromStorage<DSDivision>(DS_KEY);
}

function getDSDivisionById(id: string): DSDivision | null {
  return getDSDivisions().find((d) => d.id === id) || null;
}

function getDSDivisionsByDistrict(districtId: string): DSDivision[] {
  return getDSDivisions().filter((d) => d.districtId === districtId);
}

function createDSDivision(data: Omit<DSDivision, 'id'>): DSDivision {
  const items = getDSDivisions();
  const newItem: DSDivision = { ...data, id: generateId() };
  items.push(newItem);
  setToStorage(DS_KEY, items);
  return newItem;
}

function updateDSDivision(id: string, data: Partial<DSDivision>): DSDivision | null {
  const items = getDSDivisions();
  const index = items.findIndex((d) => d.id === id);
  if (index === -1) return null;
  items[index] = { ...items[index], ...data, id };
  setToStorage(DS_KEY, items);
  return items[index];
}

function deleteDSDivision(id: string): boolean {
  const items = getDSDivisions();
  const filtered = items.filter((d) => d.id !== id);
  if (filtered.length === items.length) return false;
  setToStorage(DS_KEY, filtered);
  return true;
}

// GN Divisions
function getGNDivisions(): GNDivision[] {
  return getFromStorage<GNDivision>(GN_KEY);
}

function getGNDivisionById(id: string): GNDivision | null {
  return getGNDivisions().find((g) => g.id === id) || null;
}

function getGNDivisionsByDS(dsDivisionId: string): GNDivision[] {
  return getGNDivisions().filter((g) => g.dsDivisionId === dsDivisionId);
}

function createGNDivision(data: Omit<GNDivision, 'id'>): GNDivision {
  const items = getGNDivisions();
  const newItem: GNDivision = { ...data, id: generateId() };
  items.push(newItem);
  setToStorage(GN_KEY, items);
  return newItem;
}

function updateGNDivision(id: string, data: Partial<GNDivision>): GNDivision | null {
  const items = getGNDivisions();
  const index = items.findIndex((g) => g.id === id);
  if (index === -1) return null;
  items[index] = { ...items[index], ...data, id };
  setToStorage(GN_KEY, items);
  return items[index];
}

function deleteGNDivision(id: string): boolean {
  const items = getGNDivisions();
  const filtered = items.filter((g) => g.id !== id);
  if (filtered.length === items.length) return false;
  setToStorage(GN_KEY, filtered);
  return true;
}

export const TerritoryService = {
  getProvinces,
  getProvinceById,
  createProvince,
  updateProvince,
  deleteProvince,
  getDistricts,
  getDistrictById,
  getDistrictsByProvince,
  createDistrict,
  updateDistrict,
  deleteDistrict,
  getDSDivisions,
  getDSDivisionById,
  getDSDivisionsByDistrict,
  createDSDivision,
  updateDSDivision,
  deleteDSDivision,
  getGNDivisions,
  getGNDivisionById,
  getGNDivisionsByDS,
  createGNDivision,
  updateGNDivision,
  deleteGNDivision,
};
