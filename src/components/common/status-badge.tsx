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
    classes: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  },
  inactive: {
    label: "Inactive",
    classes: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300",
  },
  pending: {
    label: "Pending",
    classes: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
  },
  deceased: {
    label: "Deceased",
    classes: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  },
  suspended: {
    label: "Suspended",
    classes: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
  },
  approved: {
    label: "Approved",
    classes: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  },
  rejected: {
    label: "Rejected",
    classes: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
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
