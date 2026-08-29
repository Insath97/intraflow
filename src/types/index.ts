export interface User {
  id: string;
  name: string;
  email: string;
  employeeId: string;
  phone: string;
  roleId: string;
  territoryId?: string;
  provinceId?: string;
  districtId?: string;
  dsDivisionId?: string;
  status: "active" | "inactive";
  avatar?: string;
  lastLogin?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Role {
  id: string;
  name: string;
  description: string;
  permissionIds: string[];
  status: "active" | "inactive";
  createdAt: string;
  updatedAt: string;
}

export interface Permission {
  id: string;
  name: string;
  description: string;
  group: string;
}

export interface PermissionGroup {
  name: string;
  permissions: Permission[];
}

export interface Province {
  id: string;
  name: string;
  code: string;
  status: "active" | "inactive";
}

export interface District {
  id: string;
  name: string;
  code: string;
  provinceId: string;
  status: "active" | "inactive";
}

export interface DSDivision {
  id: string;
  name: string;
  code: string;
  districtId: string;
  status: "active" | "inactive";
}

export interface GNDivision {
  id: string;
  name: string;
  code: string;
  dsDivisionId: string;
  status: "active" | "inactive";
}

export interface Person {
  id: string;
  registrationNo: string;
  fullName: string;
  nameWithInitials: string;
  nicNumber: string;
  dateOfBirth: string;
  age: number;
  gender: "male" | "female" | "other";
  maritalStatus: "single" | "married" | "divorced" | "widowed";
  contactNumber: string;
  email: string;
  address: string;

  provinceId: string;
  districtId: string;
  dsDivisionId: string;
  gnDivisionId: string;
  village: string;
  postalCode: string;

  disabilityType: string;
  disabilityCategory: string;
  disabilityLevel: "mild" | "moderate" | "severe" | "profound";
  cause: string;
  dateIdentified: string;
  certificationStatus: "certified" | "pending" | "not_certified";
  disabilityDescription: string;
  assistanceRequired: string[];

  guardianName: string;
  guardianRelationship: string;
  guardianContact: string;
  guardianAddress: string;
  householdSize: number;

  educationLevel: string;
  employmentStatus: string;
  occupation: string;
  employer: string;
  monthlyIncome: number;
  skills: string;

  governmentAssistance: boolean;
  medicalAssistance: boolean;
  educationSupport: boolean;
  employmentSupport: boolean;
  equipmentRequired: string[];
  otherSupport: string;

  status: "active" | "inactive" | "deceased" | "pending";
  registeredDate: string;
  registeredBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  module: string;
  recordId: string;
  recordLabel: string;
  ipAddress: string;
  status: "success" | "failed" | "warning";
  createdAt: string;
  details?: string;
}

export interface DashboardStats {
  totalPersons: number;
  activeRecords: number;
  districts: number;
  registeredThisMonth: number;
  maleCount: number;
  femaleCount: number;
  otherCount: number;
  childrenCount: number;
  adultsCount: number;
  elderlyCount: number;
}

export interface ChartDataPoint {
  name: string;
  value: number;
  fill?: string;
}

export interface MonthlyRegistration {
  month: string;
  count: number;
}

export type Theme = "light" | "dark";

export interface AppState {
  theme: Theme;
  sidebarOpen: boolean;
  setTheme: (theme: Theme) => void;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
}
