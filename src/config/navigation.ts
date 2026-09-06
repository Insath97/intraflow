import {
  LayoutDashboard,
  Users,
  UserPlus,
  MapPin,
  ShieldCheck,
  Lock,
  ClipboardList,
  Settings,
  Heart,
  BarChart3,
  Building,
  Activity,
  Calendar,
  FileText,
  Bell,
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
    title: "PEOPLE",
    items: [
      {
        label: "Persons",
        href: "/persons",
        icon: Heart,
      },
      {
        label: "Users",
        href: "/users",
        icon: Users,
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
    title: "PROJECTS & TASKS",
    items: [
      {
        label: "Projects",
        href: "/projects",
        icon: FileText,
      },
      {
        label: "Daily Updates",
        href: "/daily-updates",
        icon: Calendar,
      },
    ],
  },
  {
    title: "ACCESS CONTROL",
    items: [
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
