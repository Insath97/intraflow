import * as React from "react";
import { cn } from "@/lib/utils";

type StatusType = "active" | "inactive" | "pending" | "deceased" | "suspended" | "approved" | "rejected";

interface StatusBadgeProps {
  status: StatusType;
  className?: string;
}

const statusConfig: Record<StatusType, { label: string; classes: string }> = {
  active: {
    label: "Active",
    classes: "bg-green-50 text-green-700 dark:bg-green-500/10 dark:text-green-400",
  },
  inactive: {
    label: "Inactive",
    classes: "bg-gray-100 text-gray-700 dark:bg-white/5 dark:text-gray-400",
  },
  pending: {
    label: "Pending",
    classes: "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400",
  },
  deceased: {
    label: "Deceased",
    classes: "bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400",
  },
  suspended: {
    label: "Suspended",
    classes: "bg-orange-50 text-orange-700 dark:bg-[#FF6B00]/10 dark:text-[#FF8C38]",
  },
  approved: {
    label: "Approved",
    classes: "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400",
  },
  rejected: {
    label: "Rejected",
    classes: "bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400",
  },
};

function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status] || statusConfig.inactive;

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        config.classes,
        className
      )}
    >
      {config.label}
    </span>
  );
}

export { StatusBadge };
export type { StatusType };
