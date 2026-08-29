import type { AuditLog } from '@/types';
import { generateId } from '@/lib/utils';

const STORAGE_KEY = 'mis_audit_logs';

function getAll(): AuditLog[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function getById(id: string): AuditLog | null {
  try {
    const logs = getAll();
    return logs.find((l) => l.id === id) || null;
  } catch {
    return null;
  }
}

function log(
  action: string,
  module: string,
  recordId: string,
  recordLabel: string,
  status: AuditLog['status'],
  details?: string,
  userId?: string,
  userName?: string
): AuditLog {
  const logs = getAll();
  const newLog: AuditLog = {
    id: generateId(),
    userId: userId || 'system',
    userName: userName || 'System',
    action,
    module,
    recordId,
    recordLabel,
    ipAddress: '127.0.0.1',
    status,
    createdAt: new Date().toISOString(),
    details,
  };
  logs.unshift(newLog);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(logs));
  return newLog;
}

interface LogFilters {
  module?: string;
  action?: string;
  status?: AuditLog['status'];
  userId?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
}

function getFiltered(filters: LogFilters): AuditLog[] {
  try {
    let logs = getAll();

    if (filters.module) {
      logs = logs.filter((l) => l.module === filters.module);
    }
    if (filters.action) {
      logs = logs.filter((l) => l.action === filters.action);
    }
    if (filters.status) {
      logs = logs.filter((l) => l.status === filters.status);
    }
    if (filters.userId) {
      logs = logs.filter((l) => l.userId === filters.userId);
    }
    if (filters.startDate) {
      logs = logs.filter((l) => l.createdAt >= filters.startDate!);
    }
    if (filters.endDate) {
      logs = logs.filter((l) => l.createdAt <= filters.endDate!);
    }
    if (filters.search) {
      const lower = filters.search.toLowerCase();
      logs = logs.filter(
        (l) =>
          l.action.toLowerCase().includes(lower) ||
          l.module.toLowerCase().includes(lower) ||
          l.recordLabel.toLowerCase().includes(lower) ||
          l.userName.toLowerCase().includes(lower)
      );
    }

    return logs;
  } catch {
    return [];
  }
}

function clear(): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
}

function getRecent(count: number): AuditLog[] {
  try {
    return getAll().slice(0, count);
  } catch {
    return [];
  }
}

export const AuditLogService = {
  getAll,
  getById,
  log,
  getFiltered,
  clear,
  getRecent,
};
