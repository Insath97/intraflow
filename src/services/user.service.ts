import type { User } from '@/types';
import { generateId } from '@/lib/utils';

const STORAGE_KEY = 'mis_users';

function getAll(): User[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function getById(id: string): User | null {
  try {
    const users = getAll();
    return users.find((u) => u.id === id) || null;
  } catch {
    return null;
  }
}

function getByEmail(email: string): User | null {
  try {
    const users = getAll();
    return users.find((u) => u.email === email) || null;
  } catch {
    return null;
  }
}

function create(user: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): User {
  const users = getAll();
  const now = new Date().toISOString();
  const newUser: User = {
    ...user,
    id: generateId(),
    createdAt: now,
    updatedAt: now,
  };
  users.push(newUser);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
  return newUser;
}

function update(id: string, data: Partial<User>): User | null {
  const users = getAll();
  const index = users.findIndex((u) => u.id === id);
  if (index === -1) return null;
  const updated: User = {
    ...users[index],
    ...data,
    id,
    updatedAt: new Date().toISOString(),
  };
  users[index] = updated;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
  return updated;
}

function remove(id: string): boolean {
  const users = getAll();
  const filtered = users.filter((u) => u.id !== id);
  if (filtered.length === users.length) return false;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  return true;
}

function search(query: string): User[] {
  try {
    const users = getAll();
    const lower = query.toLowerCase();
    return users.filter(
      (u) =>
        u.name.toLowerCase().includes(lower) ||
        u.email.toLowerCase().includes(lower) ||
        u.employeeId.toLowerCase().includes(lower)
    );
  } catch {
    return [];
  }
}

function getByRoleId(roleId: string): User[] {
  try {
    return getAll().filter((u) => u.roleId === roleId);
  } catch {
    return [];
  }
}

function getActive(): User[] {
  try {
    return getAll().filter((u) => u.status === 'active');
  } catch {
    return [];
  }
}

export const UserService = {
  getAll,
  getById,
  getByEmail,
  create,
  update,
  remove,
  search,
  getByRoleId,
  getActive,
};
