import type { Role } from '@/types';
import { generateId } from '@/lib/utils';

const STORAGE_KEY = 'mis_roles';

function getAll(): Role[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function getById(id: string): Role | null {
  try {
    const roles = getAll();
    return roles.find((r) => r.id === id) || null;
  } catch {
    return null;
  }
}

function create(role: Omit<Role, 'id' | 'createdAt' | 'updatedAt'>): Role {
  const roles = getAll();
  const now = new Date().toISOString();
  const newRole: Role = {
    ...role,
    id: generateId(),
    createdAt: now,
    updatedAt: now,
  };
  roles.push(newRole);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(roles));
  return newRole;
}

function update(id: string, data: Partial<Role>): Role | null {
  const roles = getAll();
  const index = roles.findIndex((r) => r.id === id);
  if (index === -1) return null;
  const updated: Role = {
    ...roles[index],
    ...data,
    id,
    updatedAt: new Date().toISOString(),
  };
  roles[index] = updated;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(roles));
  return updated;
}

function remove(id: string): boolean {
  const roles = getAll();
  const filtered = roles.filter((r) => r.id !== id);
  if (filtered.length === roles.length) return false;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  return true;
}

function search(query: string): Role[] {
  try {
    const roles = getAll();
    const lower = query.toLowerCase();
    return roles.filter(
      (r) =>
        r.name.toLowerCase().includes(lower) ||
        r.description.toLowerCase().includes(lower)
    );
  } catch {
    return [];
  }
}

function getActive(): Role[] {
  try {
    return getAll().filter((r) => r.status === 'active');
  } catch {
    return [];
  }
}

export const RoleService = {
  getAll,
  getById,
  create,
  update,
  remove,
  search,
  getActive,
};
