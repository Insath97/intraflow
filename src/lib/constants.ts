export const PERMISSIONS = {
  PERSONS: {
    VIEW: "persons.view",
    CREATE: "persons.create",
    UPDATE: "persons.update",
    DELETE: "persons.delete",
    EXPORT: "persons.export",
  },
  USERS: {
    VIEW: "users.view",
    CREATE: "users.create",
    UPDATE: "users.update",
    DELETE: "users.delete",
  },
  ROLES: {
    VIEW: "roles.view",
    CREATE: "roles.create",
    UPDATE: "roles.update",
    DELETE: "roles.delete",
  },
  TERRITORIES: {
    VIEW: "territories.view",
    CREATE: "territories.create",
    UPDATE: "territories.update",
    DELETE: "territories.delete",
  },
  REPORTS: {
    VIEW: "reports.view",
    EXPORT: "reports.export",
  },
  AUDIT_LOGS: {
    VIEW: "audit_logs.view",
  },
  SETTINGS: {
    VIEW: "settings.view",
    UPDATE: "settings.update",
  },
  DASHBOARD: {
    VIEW: "dashboard.view",
  },
} as const;

export const ALL_PERMISSIONS = [
  PERMISSIONS.PERSONS.VIEW,
  PERMISSIONS.PERSONS.CREATE,
  PERMISSIONS.PERSONS.UPDATE,
  PERMISSIONS.PERSONS.DELETE,
  PERMISSIONS.PERSONS.EXPORT,
  PERMISSIONS.USERS.VIEW,
  PERMISSIONS.USERS.CREATE,
  PERMISSIONS.USERS.UPDATE,
  PERMISSIONS.USERS.DELETE,
  PERMISSIONS.ROLES.VIEW,
  PERMISSIONS.ROLES.CREATE,
  PERMISSIONS.ROLES.UPDATE,
  PERMISSIONS.ROLES.DELETE,
  PERMISSIONS.TERRITORIES.VIEW,
  PERMISSIONS.TERRITORIES.CREATE,
  PERMISSIONS.TERRITORIES.UPDATE,
  PERMISSIONS.TERRITORIES.DELETE,
  PERMISSIONS.REPORTS.VIEW,
  PERMISSIONS.REPORTS.EXPORT,
  PERMISSIONS.AUDIT_LOGS.VIEW,
  PERMISSIONS.SETTINGS.VIEW,
  PERMISSIONS.SETTINGS.UPDATE,
  PERMISSIONS.DASHBOARD.VIEW,
];

export const PERMISSION_GROUPS = [
  {
    name: "PERSON MANAGEMENT",
    permissions: [
      { id: "persons.view", name: "persons.view", description: "View persons", group: "PERSON MANAGEMENT" },
      { id: "persons.create", name: "persons.create", description: "Create persons", group: "PERSON MANAGEMENT" },
      { id: "persons.update", name: "persons.update", description: "Update persons", group: "PERSON MANAGEMENT" },
      { id: "persons.delete", name: "persons.delete", description: "Delete persons", group: "PERSON MANAGEMENT" },
      { id: "persons.export", name: "persons.export", description: "Export persons data", group: "PERSON MANAGEMENT" },
    ],
  },
  {
    name: "USER MANAGEMENT",
    permissions: [
      { id: "users.view", name: "users.view", description: "View users", group: "USER MANAGEMENT" },
      { id: "users.create", name: "users.create", description: "Create users", group: "USER MANAGEMENT" },
      { id: "users.update", name: "users.update", description: "Update users", group: "USER MANAGEMENT" },
      { id: "users.delete", name: "users.delete", description: "Delete users", group: "USER MANAGEMENT" },
    ],
  },
  {
    name: "ROLE MANAGEMENT",
    permissions: [
      { id: "roles.view", name: "roles.view", description: "View roles", group: "ROLE MANAGEMENT" },
      { id: "roles.create", name: "roles.create", description: "Create roles", group: "ROLE MANAGEMENT" },
      { id: "roles.update", name: "roles.update", description: "Update roles", group: "ROLE MANAGEMENT" },
      { id: "roles.delete", name: "roles.delete", description: "Delete roles", group: "ROLE MANAGEMENT" },
    ],
  },
  {
    name: "TERRITORY MANAGEMENT",
    permissions: [
      { id: "territories.view", name: "territories.view", description: "View territories", group: "TERRITORY MANAGEMENT" },
      { id: "territories.create", name: "territories.create", description: "Create territories", group: "TERRITORY MANAGEMENT" },
      { id: "territories.update", name: "territories.update", description: "Update territories", group: "TERRITORY MANAGEMENT" },
      { id: "territories.delete", name: "territories.delete", description: "Delete territories", group: "TERRITORY MANAGEMENT" },
    ],
  },
  {
    name: "REPORT MANAGEMENT",
    permissions: [
      { id: "reports.view", name: "reports.view", description: "View reports", group: "REPORT MANAGEMENT" },
      { id: "reports.export", name: "reports.export", description: "Export reports", group: "REPORT MANAGEMENT" },
    ],
  },
  {
    name: "SYSTEM MANAGEMENT",
    permissions: [
      { id: "audit_logs.view", name: "audit_logs.view", description: "View audit logs", group: "SYSTEM MANAGEMENT" },
      { id: "settings.view", name: "settings.view", description: "View settings", group: "SYSTEM MANAGEMENT" },
      { id: "settings.update", name: "settings.update", description: "Update settings", group: "SYSTEM MANAGEMENT" },
      { id: "dashboard.view", name: "dashboard.view", description: "View dashboard", group: "SYSTEM MANAGEMENT" },
    ],
  },
];
