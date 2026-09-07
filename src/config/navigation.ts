import {
  LayoutDashboard,
  Users,
  MapPin,
  ShieldCheck,
  Lock,
  ClipboardList,
  Settings,
  BarChart3,
  Building,
  Activity,
  Calendar,
  FileText,
  Bell,
  Package,
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
      },
    ],
  },
  {
    title: "PROJECTS & TASKS",
    items: [
      {
        label: "Projects",
        href: "/projects",
        icon: FileText,
      },
      {
        label: "Modules",
        href: "/modules",
        icon: Package,
      },
      {
        label: "Daily Updates",
        href: "/daily-updates",
        icon: Calendar,
      },
    ],
  },
  {
    title: "ORGANIZATION",
    items: [
      {
        label: "Departments",
        href: "/departments",
        icon: Building,
      },
      {
        label: "Territories",
        href: "/territories",
        icon: MapPin,
      },
    ],
  },
  {
    title: "ACCESS CONTROL",
    items: [
      {
        label: "Users",
        href: "/users",
        icon: Users,
      },
      {
        label: "Roles",
        href: "/roles",
        icon: ShieldCheck,
      },
      {
        label: "Permissions",
        href: "/permissions",
        icon: Lock,
      },
    ],
  },
  {
    title: "SYSTEM",
    items: [
      {
        label: "Notifications",
        href: "/notifications",
        icon: Bell,
      },
      {
        label: "Activity Logs",
        href: "/audit-logs",
        icon: Activity,
      },
      {
        label: "Settings",
        href: "/settings",
        icon: Settings,
      },
    ],
  },
];
