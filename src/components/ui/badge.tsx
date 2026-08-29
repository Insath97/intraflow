import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-[#FF6B00] focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-[#FF6B00] text-white dark:bg-[#FF6B00]",
        secondary:
          "border-transparent bg-gray-100 text-gray-900 dark:bg-white/10 dark:text-gray-100",
        destructive:
          "border-transparent bg-red-500 text-white dark:bg-red-600",
        outline:
          "text-gray-700 border-gray-300 dark:text-gray-300 dark:border-white/10",
        success:
          "border-transparent bg-green-100 text-green-800 dark:bg-green-500/10 dark:text-green-400",
        warning:
          "border-transparent bg-amber-100 text-amber-800 dark:bg-amber-500/10 dark:text-amber-400",
        info:
          "border-transparent bg-blue-100 text-blue-800 dark:bg-blue-500/10 dark:text-blue-400",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
