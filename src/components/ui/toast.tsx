"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from "lucide-react";

type ToastVariant = "success" | "error" | "warning" | "info";

interface Toast {
  id: string;
  message: string;
  variant: ToastVariant;
}

interface ToastContextType {
  toast: (message: string, variant?: ToastVariant) => void;
}

const ToastContext = React.createContext<ToastContextType>({
  toast: () => {},
});

export function useToast() {
  return React.useContext(ToastContext);
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<Toast[]>([]);

  const addToast = React.useCallback(
    (message: string, variant: ToastVariant = "info") => {
      const id = Math.random().toString(36).substr(2, 9);
      setToasts((prev) => [...prev, { id, message, variant }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 5000);
    },
    []
  );

  const removeToast = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toast: addToast }}>
      {children}
      <div className="pointer-events-none fixed right-4 top-4 z-[100] flex flex-col gap-2">
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onRemove={removeToast} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

const variantConfig = {
  success: {
    icon: CheckCircle,
    bg: "bg-green-50 border-green-200 dark:bg-green-900/30 dark:border-green-800",
    text: "text-green-800 dark:text-green-200",
    iconColor: "text-green-500",
  },
  error: {
    icon: AlertCircle,
    bg: "bg-red-50 border-red-200 dark:bg-red-900/30 dark:border-red-800",
    text: "text-red-800 dark:text-red-200",
    iconColor: "text-red-500",
  },
  warning: {
    icon: AlertTriangle,
    bg: "bg-amber-50 border-amber-200 dark:bg-amber-900/30 dark:border-amber-800",
    text: "text-amber-800 dark:text-amber-200",
    iconColor: "text-amber-500",
  },
  info: {
    icon: Info,
    bg: "bg-blue-50 border-blue-200 dark:bg-blue-900/30 dark:border-blue-800",
    text: "text-blue-800 dark:text-blue-200",
    iconColor: "text-blue-500",
  },
};

function ToastItem({
  toast,
  onRemove,
}: {
  toast: Toast;
  onRemove: (id: string) => void;
}) {
  const config = variantConfig[toast.variant];
  const Icon = config.icon;

  return (
    <div
      className={cn(
        "pointer-events-auto flex w-80 items-start gap-3 rounded-lg border p-4 shadow-lg animate-in slide-in-from-right-full",
        config.bg
      )}
    >
      <Icon className={cn("mt-0.5 h-5 w-5 shrink-0", config.iconColor)} />
      <p className={cn("flex-1 text-sm font-medium", config.text)}>
        {toast.message}
      </p>
      <button
        onClick={() => onRemove(toast.id)}
        className={cn("shrink-0", config.text, "opacity-70 hover:opacity-100")}
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
