import * as React from "react";
import { cn } from "@/lib/utils";
import { Check, Minus } from "lucide-react";

export interface CheckboxProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type" | "onChange"> {
  label?: string;
  indeterminate?: boolean;
  onCheckedChange?: (checked: boolean) => void;
}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, label, indeterminate, onCheckedChange, checked, ...props }, ref) => {
    const internalRef = React.useRef<HTMLInputElement>(null);

    React.useEffect(() => {
      if (internalRef.current) {
        internalRef.current.indeterminate = !!indeterminate;
      }
    }, [indeterminate]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      onCheckedChange?.(e.target.checked);
    };

    const checkbox = (
      <span className="relative inline-flex h-5 w-5 shrink-0 items-center justify-center">
        <input
          type="checkbox"
          ref={ref}
          className="peer sr-only"
          checked={checked}
          onChange={handleChange}
          {...props}
        />
        <span
          className={cn(
            "flex h-5 w-5 items-center justify-center rounded border transition-colors",
            "border-gray-300 bg-white dark:border-white/20 dark:bg-[#1A1D2E]",
            "peer-checked:border-[#FF6B00] peer-checked:bg-[#FF6B00] dark:peer-checked:border-[#FF6B00] dark:peer-checked:bg-[#FF6B00]",
            "peer-focus-visible:ring-2 peer-focus-visible:ring-[#FF6B00] peer-focus-visible:ring-offset-2",
            "peer-disabled:cursor-not-allowed peer-disabled:opacity-50"
          )}
        >
          {checked && !indeterminate && (
            <Check className="h-3.5 w-3.5 text-white" strokeWidth={3} />
          )}
          {indeterminate && (
            <Minus className="h-3.5 w-3.5 text-white" strokeWidth={3} />
          )}
        </span>
      </span>
    );

    if (label) {
      return (
        <label
          className={cn(
            "flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300",
            "cursor-pointer",
            className
          )}
        >
          {checkbox}
          {label}
        </label>
      );
    }

    return checkbox;
  }
);
Checkbox.displayName = "Checkbox";

export { Checkbox };
