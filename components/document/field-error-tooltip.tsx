"use client";

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { AlertCircle } from "lucide-react";
import { FieldValidationError } from "@/types/validation";

interface FieldErrorTooltipProps {
  fieldId: string;
  fieldErrors: FieldValidationError[];
  children: React.ReactNode;
}

export function FieldErrorTooltip({
  fieldId,
  fieldErrors,
  children,
}: FieldErrorTooltipProps) {
  // Find errors for this field
  const errors = fieldErrors.filter((error) => error.fieldId === fieldId);

  // If no errors, just render children
  if (errors.length === 0) {
    return <>{children}</>;
  }

  return (
    <TooltipProvider delayDuration={0}>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="relative">
            {children}
            <div className="absolute top-0 right-0 -mt-2 -mr-2">
              <div className="bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center">
                <AlertCircle className="h-3 w-3" />
              </div>
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent className="bg-red-50 border-red-200 text-red-800 p-3 max-w-xs">
          <div className="space-y-1">
            {errors.map((error, index) => (
              <div key={index} className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{error.message}</span>
              </div>
            ))}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
