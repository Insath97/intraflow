import * as React from "react";
import { cn } from "@/lib/utils";

export interface SelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {
  error?: boolean;
  errorMessage?: string;
  label?: string;
  placeholder?: string;
}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, error, errorMessage, label, placeholder, children, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
            {label}
          </label>
        )}
        <select
          className={cn(
            "flex h-10 w-full appearance-none rounded-lg border bg-white px-3 py-2 pr-8 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#168B61] focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-gray-800 dark:text-gray-100",
            error
              ? "border-red-500 focus-visible:ring-red-500"
              : "border-gray-300 dark:border-gray-600",
            className
          )}
          ref={ref}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {children}
        </select>
        {errorMessage && (
          <p className="mt-1 text-sm text-red-500">{errorMessage}</p>
        )}
      </div>
    );
  }
);
Select.displayName = "Select";

export { Select };
