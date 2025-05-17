"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FieldValidationError } from "@/types/validation";
import { AlertTriangle, ChevronDown, ChevronUp, XCircle } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ValidationErrorsSummaryProps {
  errors: FieldValidationError[];
  onFieldClickAction: (fieldId: string) => void;
  fieldLabels?: Record<string, string>;
}

export function ValidationErrorsSummary({
  errors,
  onFieldClickAction,
  fieldLabels = {},
}: ValidationErrorsSummaryProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  if (errors.length === 0) {
    return null;
  }

  return (
    <Card className="w-full border-destructive/50 bg-destructive/5 shadow-sm">
      <CardHeader className="py-2 px-4 flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-sm font-medium text-destructive flex items-center">
          <AlertTriangle className="h-4 w-4 mr-2" />
          {errors.length} {errors.length === 1 ? "Error" : "Errors"} Found
        </CardTitle>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {isExpanded ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          )}
        </Button>
      </CardHeader>
      {isExpanded && (
        <CardContent className="py-2 px-4">
          <ScrollArea className="max-h-40">
            <ul className="space-y-1">
              {errors.map((error, index) => (
                <li key={index} className="flex items-start">
                  {" "}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-auto p-1 text-xs justify-start hover:bg-destructive/10 text-destructive hover:text-destructive w-full"
                    onClick={() => onFieldClickAction(error.fieldId)}
                  >
                    <XCircle className="h-3 w-3 mr-2 flex-shrink-0 mt-0.5" />
                    <span className="text-left">
                      {fieldLabels[error.fieldId] ? (
                        <span className="font-medium">
                          {fieldLabels[error.fieldId]}:{" "}
                        </span>
                      ) : null}
                      {error.message}
                    </span>
                  </Button>
                </li>
              ))}
            </ul>
          </ScrollArea>
        </CardContent>
      )}
    </Card>
  );
}
