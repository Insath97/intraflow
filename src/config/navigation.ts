import {
  LayoutDashboard,
  Users,
  UserPlus,
  MapPin,
  ShieldCheck,
  Lock,
  ClipboardList,
  Settings,
  Accessibility,
  BarChart3,
  Home,
  UserCheck,
  FileText,
  Activity,
} from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  permission?: string;
}

export interface NavGroup {
  title: string;
  items: NavItem[];
}

export const navigation: NavGroup[] = [
  {
    title: "",
    items: [
      {
        label: "Dashboard",
        href: "/dashboard",
        icon: LayoutDashboard,
        permission: "dashboard.view",
      },
    ],
  },
  {
    title: "PERSON MANAGEMENT",
    items: [
      {
        label: "All Persons",
        href: "/persons",
        icon: Accessibility,
        permission: "persons.view",
      },
      {
        label: "Register Person",
        href: "/persons/create",
        icon: UserPlus,
        permission: "persons.create",
      },
    ],
  },
  {
    title: "LOCATION MANAGEMENT",
    items: [
      {
        label: "Territories",
        href: "/territories",
        icon: MapPin,
        permission: "territories.view",
      },
    ],
  },
  {
    title: "ACCESS MANAGEMENT",
    items: [
      {
        label: "Users",
        href: "/users",
        icon: Users,
        permission: "users.view",
      },
      {
        label: "Roles",
        href: "/roles",
        icon: ShieldCheck,
        permission: "roles.view",
      },
      {
        label: "Permissions",
        href: "/permissions",
        icon: Lock,
        permission: "roles.view",
      },
    ],
  },
  {
    title: "REPORTING",
    items: [
      {
        label: "Reports",
        href: "/reports",
        icon: BarChart3,
        permission: "reports.view",
      },
    ],
  },
  {
    title: "SYSTEM",
    items: [
      {
        label: "Audit Logs",
        href: "/audit-logs",
        icon: ClipboardList,
        permission: "audit_logs.view",
      },
      {
        label: "Settings",
        href: "/settings",
        icon: Settings,
        permission: "settings.view",
      },
    ],
  },
];
