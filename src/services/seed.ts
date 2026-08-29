import { users } from '@/mocks/users';
import { roles } from '@/mocks/roles';
import { mockPersons } from '@/mocks/persons';
import { provinces, districts, dsDivisions, gnDivisions } from '@/mocks/territories';

export function seedData() {
  if (typeof window === 'undefined') return;

  const keys = [
    'mis_users',
    'mis_roles',
    'mis_persons',
    'mis_provinces',
    'mis_districts',
    'mis_ds_divisions',
    'mis_gn_divisions',
    'mis_audit_logs',
  ];
  const alreadySeeded = keys.every((key) => localStorage.getItem(key) !== null);
  if (alreadySeeded) return;

  localStorage.setItem('mis_users', JSON.stringify(users));
  localStorage.setItem('mis_roles', JSON.stringify(roles));
  localStorage.setItem('mis_persons', JSON.stringify(mockPersons));
  localStorage.setItem('mis_provinces', JSON.stringify(provinces));
  localStorage.setItem('mis_districts', JSON.stringify(districts));
  localStorage.setItem('mis_ds_divisions', JSON.stringify(dsDivisions));
  localStorage.setItem('mis_gn_divisions', JSON.stringify(gnDivisions));
  localStorage.setItem('mis_audit_logs', JSON.stringify([]));
}
