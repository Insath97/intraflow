import * as React from "react";
import { cn } from "@/lib/utils";

interface LoadingStateProps {
  fullPage?: boolean;
  message?: string;
  className?: string;
}

function LoadingState({ fullPage, message, className }: LoadingStateProps) {
  if (fullPage) {
    return (
      <div className="flex h-[calc(100vh-4rem)] w-full items-center justify-center">
        <div className={cn("flex flex-col items-center gap-3", className)}>
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#EAF7F1] border-t-[#168B61]" />
          {message && (
            <p className="text-sm text-gray-500 dark:text-gray-400">{message}</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={cn("flex items-center justify-center py-8", className)}>
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#EAF7F1] border-t-[#168B61]" />
        {message && (
          <p className="text-sm text-gray-500 dark:text-gray-400">{message}</p>
        )}
      </div>
    </div>
  );
}

export { LoadingState };
