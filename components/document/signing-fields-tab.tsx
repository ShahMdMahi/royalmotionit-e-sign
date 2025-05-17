"use client";

import { useState } from "react";
import { DocumentField } from "@/types/document";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SignatureCapture } from "./signature-capture";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import {
  handleFieldChange,
  handleNavigateToField,
} from "@/actions/signing-field-actions";

interface SigningFieldsTabProps {
  fields: DocumentField[];
  currentPage: number;
  fieldValues: Record<string, string>;
  validationErrors: Record<string, string>;
  onFieldChangeAction?: typeof handleFieldChange;
  onNavigateToFieldAction?: typeof handleNavigateToField;
}

export function SigningFieldsTab({
  fields,
  currentPage,
  fieldValues,
  validationErrors,
  onFieldChangeAction = handleFieldChange,
  onNavigateToFieldAction = handleNavigateToField,
}: SigningFieldsTabProps) {
  const [activeTab, setActiveTab] = useState<"all" | "required" | "current">(
    "current",
  );
  const handleChange = async (fieldId: string, value: string) => {
    await onFieldChangeAction(fieldId, value);
    return value; // Return the value to match the signature
  };

  const handleNavigate = async (pageNumber: number) => {
    await onNavigateToFieldAction(pageNumber);
  };

  // Filter fields based on tab
  const filteredFields = (() => {
    switch (activeTab) {
      case "all":
        return fields;
      case "required":
        return fields.filter((field) => field.required);
      case "current":
        return fields.filter((field) => field.pageNumber === currentPage);
      default:
        return fields;
    }
  })();

  // Render a specific field based on its type
  const renderField = (field: DocumentField) => {
    const fieldValue = fieldValues[field.id] || "";
    const error = validationErrors[field.id];
    const navigateToFieldPage = () => {
      if (field.pageNumber !== currentPage) {
        handleNavigate(field.pageNumber);
      }
    };

    switch (field.type) {
      case "signature":
        return (
          <div className="space-y-2">
            <Label
              htmlFor={field.id}
              className={cn(
                field.required &&
                  "after:content-['*'] after:text-destructive after:ml-1",
              )}
            >
              {field.label}
            </Label>{" "}
            <SignatureCapture
              height={120}
              width={300}
              defaultValue={fieldValue}
              onChangeAction={async (value) => {
                await handleChange(field.id, value);
                return value;
              }}
              type="signature"
              className="w-full"
            />
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
        );

      case "initial":
        return (
          <div className="space-y-2">
            <Label
              htmlFor={field.id}
              className={cn(
                field.required &&
                  "after:content-['*'] after:text-destructive after:ml-1",
              )}
            >
              {field.label}
            </Label>{" "}
            <SignatureCapture
              height={100}
              width={200}
              defaultValue={fieldValue}
              onChangeAction={async (value) => {
                await handleChange(field.id, value);
                return value;
              }}
              type="initial"
              className="w-full"
            />
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
        );

      case "text":
      case "email":
      case "phone":
      case "number":
        return (
          <div className="space-y-2">
            <Label
              htmlFor={field.id}
              className={cn(
                field.required &&
                  "after:content-['*'] after:text-destructive after:ml-1",
              )}
            >
              {field.label}
            </Label>{" "}
            <Input
              id={field.id}
              value={fieldValue}
              onChange={(e) => handleChange(field.id, e.target.value)}
              placeholder={field.placeholder}
              type={
                field.type === "email"
                  ? "email"
                  : field.type === "number"
                    ? "number"
                    : "text"
              }
              className={cn(error && "border-destructive")}
            />
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
        );

      case "date":
        return (
          <div className="space-y-2">
            <Label
              htmlFor={field.id}
              className={cn(
                field.required &&
                  "after:content-['*'] after:text-destructive after:ml-1",
              )}
            >
              {field.label}
            </Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  id={field.id}
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !fieldValue && "text-muted-foreground",
                    error && "border-destructive",
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {fieldValue
                    ? format(new Date(fieldValue), "PPP")
                    : "Select date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                {" "}
                <Calendar
                  mode="single"
                  selected={fieldValue ? new Date(fieldValue) : undefined}
                  onSelect={(date) =>
                    date && handleChange(field.id, date.toISOString())
                  }
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
        );

      case "checkbox":
        return (
          <div className="flex items-center space-x-2">
            {" "}
            <Checkbox
              id={field.id}
              checked={fieldValue === "true"}
              onCheckedChange={(checked) => {
                handleChange(field.id, checked ? "true" : "");
              }}
            />
            <Label
              htmlFor={field.id}
              className={cn(
                field.required &&
                  "after:content-['*'] after:text-destructive after:ml-1",
              )}
            >
              {field.label}
            </Label>
            {error && <p className="text-sm text-destructive ml-6">{error}</p>}
          </div>
        );

      case "dropdown":
        const options = field.options
          ? field.options.split(",").map((opt) => opt.trim())
          : [];

        return (
          <div className="space-y-2">
            <Label
              htmlFor={field.id}
              className={cn(
                field.required &&
                  "after:content-['*'] after:text-destructive after:ml-1",
              )}
            >
              {field.label}
            </Label>{" "}
            <Select
              value={fieldValue}
              onValueChange={(value) => handleChange(field.id, value)}
            >
              <SelectTrigger
                id={field.id}
                className={cn(error && "border-destructive")}
              >
                <SelectValue placeholder="Select option" />
              </SelectTrigger>
              <SelectContent>
                {options.map((option, index) => (
                  <SelectItem key={`${field.id}-${index}`} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
        );

      case "radio":
        const radioOptions = field.options
          ? field.options.split(",").map((opt) => opt.trim())
          : [];

        return (
          <div className="space-y-2">
            <Label
              className={cn(
                field.required &&
                  "after:content-['*'] after:text-destructive after:ml-1",
              )}
            >
              {field.label}
            </Label>{" "}
            <RadioGroup
              value={fieldValue}
              onValueChange={(value) => handleChange(field.id, value)}
              className="flex flex-col space-y-1"
            >
              {radioOptions.map((option, index) => (
                <div
                  key={`${field.id}-${index}`}
                  className="flex items-center space-x-2"
                >
                  <RadioGroupItem value={option} id={`${field.id}-${index}`} />
                  <Label htmlFor={`${field.id}-${index}`}>{option}</Label>
                </div>
              ))}
            </RadioGroup>
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-4">
      <Tabs
        value={activeTab}
        onValueChange={(value) => setActiveTab(value as any)}
      >
        <TabsList className="grid grid-cols-3 w-full">
          <TabsTrigger value="current">Current Page</TabsTrigger>
          <TabsTrigger value="required">Required</TabsTrigger>
          <TabsTrigger value="all">All Fields</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-4">
          <ScrollArea className="h-[400px]">
            <div className="space-y-6 pr-4">
              {filteredFields.length > 0 ? (
                filteredFields.map((field) => (
                  <div
                    key={field.id}
                    className="p-4 border rounded-md"
                    onClick={() =>
                      field.pageNumber !== currentPage &&
                      handleNavigate(field.pageNumber)
                    }
                  >
                    {field.pageNumber !== currentPage && (
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-muted-foreground">
                          Page {field.pageNumber}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleNavigate(field.pageNumber)}
                          className="h-6 text-xs px-2"
                        >
                          Go to
                        </Button>
                      </div>
                    )}
                    {renderField(field)}
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No fields to fill on{" "}
                  {activeTab === "current" ? "this page" : "this document"}.
                </div>
              )}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
}
