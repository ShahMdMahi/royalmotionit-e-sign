"use client";

import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu, CheckSquare, AlertCircle, ChevronUp } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FieldValidationError } from "@/types/validation";

interface MobileFieldMenuProps {
  fields: any[];
  fieldValues: Record<string, string>;
  fieldErrors: FieldValidationError[];
  onFieldClickAction: (fieldId: string) => void;
  currentPage: number;
  completionPercentage: number;
}

export function MobileFieldMenu({
  fields,
  fieldValues,
  fieldErrors,
  onFieldClickAction,
  currentPage,
  completionPercentage,
}: MobileFieldMenuProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Group fields by page
  const fieldsByPage = fields.reduce(
    (acc, field) => {
      const page = field.pageNumber;
      if (!acc[page]) acc[page] = [];
      acc[page].push(field);
      return acc;
    },
    {} as Record<number, any[]>,
  );

  // Sort pages
  const pages = Object.keys(fieldsByPage)
    .map(Number)
    .sort((a, b) => a - b);

  // Check if field has an error
  const hasError = (fieldId: string) => {
    return fieldErrors.some((err) => err.fieldId === fieldId);
  };

  // Check if field is completed
  const isCompleted = (field: any) => {
    const value = fieldValues[field.id];
    return field.required ? !!value : true;
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-border p-2 md:hidden z-30 flex items-center justify-between">
        <SheetTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            <Menu className="h-4 w-4" />
            <span>Fields</span>
            {fieldErrors.length > 0 && (
              <span className="bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {fieldErrors.length}
              </span>
            )}
          </Button>
        </SheetTrigger>

        <div className="text-xs">
          <span className="font-medium">
            {Math.round(completionPercentage)}% Complete
          </span>
        </div>

        <Button
          variant="ghost"
          size="sm"
          className="gap-1"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        >
          <ChevronUp className="h-4 w-4" />
          <span className="sr-only">Back to top</span>
        </Button>
      </div>

      <SheetContent side="bottom" className="h-[80vh] rounded-t-xl">
        <SheetHeader>
          <SheetTitle>Document Fields</SheetTitle>
        </SheetHeader>

        <ScrollArea className="mt-4 h-[calc(80vh-80px)]">
          <div className="space-y-6 pb-8">
            {pages.map((page) => (
              <div key={page} className="space-y-2">
                <h3
                  className={`text-sm font-medium sticky top-0 bg-background py-2 ${page === currentPage ? "text-primary" : ""}`}
                >
                  Page {page} {page === currentPage && "(Current)"}
                </h3>

                <div className="space-y-1.5">
                  {" "}
                  {fieldsByPage[page].map((field: any) => {
                    const fieldError = hasError(field.id);
                    const completed = isCompleted(field);

                    return (
                      <div
                        key={field.id}
                        className={`flex items-center justify-between p-2 rounded border ${
                          fieldError
                            ? "border-destructive bg-destructive/5"
                            : completed
                              ? "border-primary/40 bg-primary/5"
                              : "border-border"
                        }`}
                        onClick={() => {
                          onFieldClickAction(field.id);
                          setIsOpen(false);
                        }}
                      >
                        <div className="flex items-center gap-2">
                          {fieldError ? (
                            <AlertCircle className="h-4 w-4 text-destructive" />
                          ) : completed ? (
                            <CheckSquare className="h-4 w-4 text-primary" />
                          ) : null}
                          <span
                            className={`text-sm ${field.required ? "font-medium" : ""}`}
                          >
                            {field.label || field.type}
                            {field.required && (
                              <span className="text-primary ml-0.5">*</span>
                            )}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}

            {fieldErrors.length > 0 && (
              <div className="mt-6 p-3 bg-destructive/5 border border-destructive/30 rounded-md">
                <h4 className="font-medium text-destructive flex items-center gap-2 mb-1">
                  <AlertCircle className="h-4 w-4" />
                  Validation Errors
                </h4>
                <ul className="space-y-1 list-disc list-inside text-sm">
                  {fieldErrors.map((error, idx) => (
                    <li
                      key={idx}
                      className="cursor-pointer hover:text-destructive"
                      onClick={() => {
                        onFieldClickAction(error.fieldId);
                        setIsOpen(false);
                      }}
                    >
                      {error.message}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
