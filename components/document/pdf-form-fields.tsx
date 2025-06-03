"use client";

import React from "react";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { DocumentField } from "@/types/document";

interface PdfFormFieldProps {
  field: DocumentField;
  value: string;
  onChangeAction: (fieldId: string, value: string) => void;
  onFocusAction?: (fieldId: string) => void;
  onBlurAction?: () => void;
  error?: boolean;
  style: React.CSSProperties;
  className?: string;
}

export function PdfTextField({
  field,
  value,
  onChangeAction,
  onFocusAction,
  onBlurAction,
  error,
  style,
  className,
}: PdfFormFieldProps) {
  return (
    <Input
      id={field.id}
      value={value}
      onChange={(e) => onChangeAction(field.id, e.target.value)}
      onFocus={() => onFocusAction?.(field.id)}
      onBlur={onBlurAction}
      placeholder={field.placeholder || field.label || ""}
      style={style}
      type={
        field.type === "email"
          ? "email"
          : field.type === "number"
            ? "number"
            : field.type === "phone"
              ? "tel"
              : "text"
      }
      className={cn(
        "h-full w-full p-1 text-sm bg-transparent hover:bg-primary/5 transition-colors pdf-form-field pdf-text-field",
        error && "border-destructive pdf-field-error",
        value && "pdf-field-success",
        field.required && "pdf-field-required",
        className,
      )}
    />
  );
}

export function PdfTextareaField({
  field,
  value,
  onChangeAction,
  onFocusAction,
  onBlurAction,
  error,
  style,
  className,
}: PdfFormFieldProps) {
  return (
    <Textarea
      id={field.id}
      value={value}
      onChange={(e) => onChangeAction(field.id, e.target.value)}
      onFocus={() => onFocusAction?.(field.id)}
      onBlur={onBlurAction}
      placeholder={field.placeholder || field.label || ""}
      style={style}
      className={cn(
        "h-full w-full resize-none text-sm p-1 bg-transparent hover:bg-primary/5 transition-colors pdf-form-field pdf-text-field",
        error && "border-destructive pdf-field-error",
        value && "pdf-field-success",
        field.required && "pdf-field-required",
        className,
      )}
    />
  );
}

export function PdfCheckboxField({
  field,
  value,
  onChangeAction,
  onFocusAction,
  onBlurAction,
  error,
  style,
  className,
}: PdfFormFieldProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-center h-full w-full pdf-form-field pdf-checkbox-field",
        error && "pdf-field-error",
        value && "pdf-field-success",
        field.required && "pdf-field-required",
        className,
      )}
      style={style}
      onClick={() => onFocusAction?.(field.id)}
    >
      <Checkbox
        id={field.id}
        checked={value === "true"}
        onCheckedChange={(checked) => {
          onChangeAction(field.id, checked ? "true" : "");
        }}
        onFocus={() => onFocusAction?.(field.id)}
        onBlur={onBlurAction}
        className={cn(
          "h-4 w-4 data-[state=checked]:bg-primary",
          error && "border-destructive",
        )}
      />
    </div>
  );
}

export function PdfDateField({
  field,
  value,
  onChangeAction,
  onFocusAction,
  onBlurAction,
  error,
  style,
  className,
}: PdfFormFieldProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          id={field.id}
          onFocus={() => onFocusAction?.(field.id)}
          onBlur={onBlurAction}
          className={cn(
            "h-full w-full justify-start text-left font-normal text-sm p-1 bg-transparent hover:bg-primary/5 transition-colors pdf-form-field pdf-date-field",
            !value && "text-muted-foreground",
            error && "border-destructive pdf-field-error",
            value && "pdf-field-success",
            field.required && "pdf-field-required",
            className,
          )}
          style={style}
        >
          <CalendarIcon className="mr-1 h-3 w-3" />
          {value
            ? format(new Date(value), "PPP")
            : field.placeholder || field.label || "Select date"}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={value ? new Date(value) : undefined}
          onSelect={(date) =>
            date && onChangeAction(field.id, date.toISOString())
          }
          initialFocus
        />
      </PopoverContent>
    </Popover>
  );
}

export function PdfDropdownField({
  field,
  value,
  onChangeAction,
  onFocusAction,
  onBlurAction,
  error,
  style,
  className,
}: PdfFormFieldProps) {
  const options = field.options
    ? field.options.split(",").map((opt) => opt.trim())
    : [];

  return (
    <Select
      value={value}
      onValueChange={(value) => onChangeAction(field.id, value)}
      onOpenChange={(open) => {
        if (open) {
          onFocusAction?.(field.id);
        } else {
          onBlurAction?.();
        }
      }}
    >
      <SelectTrigger
        id={field.id}
        className={cn(
          "h-full w-full text-sm p-1 bg-transparent hover:bg-primary/5 transition-colors pdf-form-field pdf-dropdown-field",
          error && "border-destructive pdf-field-error",
          value && "pdf-field-success",
          field.required && "pdf-field-required",
          className,
        )}
        style={style}
      >
        <SelectValue
          placeholder={field.placeholder || field.label || "Select option"}
        />
      </SelectTrigger>
      <SelectContent>
        {options.map((option, index) => (
          <SelectItem key={`${field.id}-${index}`} value={option}>
            {option}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export function PdfRadioField({
  field,
  value,
  onChangeAction,
  onFocusAction,
  onBlurAction,
  error,
  style,
  className,
}: PdfFormFieldProps) {
  const options = field.options
    ? field.options.split(",").map((opt) => opt.trim())
    : [];

  return (
    <div
      style={style}
      className={cn(
        "flex items-center justify-center h-full w-full bg-background/90 rounded-md border p-1 pdf-form-field pdf-radio-field",
        error && "border-destructive pdf-field-error",
        value && "pdf-field-success",
        field.required && "pdf-field-required",
        className,
      )}
      onClick={() => onFocusAction?.(field.id)}
      onBlur={onBlurAction}
    >
      <RadioGroup
        value={value}
        onValueChange={(value) => onChangeAction(field.id, value)}
        className="flex"
      >
        {options.map((option, index) => (
          <div
            key={`${field.id}-${index}`}
            className="flex items-center space-x-1 mr-2"
          >
            <RadioGroupItem
              value={option}
              id={`${field.id}-${index}`}
              className="h-3 w-3"
            />
            <Label htmlFor={`${field.id}-${index}`} className="text-xs">
              {option}
            </Label>
          </div>
        ))}
      </RadioGroup>
    </div>
  );
}

export function PdfSignatureField({
  field,
  value,
  onChangeAction,
  onFocusAction,
  onBlurAction,
  error,
  style,
  className,
}: PdfFormFieldProps) {
  // Add debug log when signature field is clicked
  const handleSignatureClick = () => {
    console.log(
      `Signature field clicked: ${field.id}, label: ${field.label || field.type}`,
    );
    // Update the form value when the signature field is clicked
    // This will be handled by the parent component that provides the signature value
    onChangeAction(field.id, value);
    if (onFocusAction) {
      console.log(`Calling onFocusAction for signature field: ${field.id}`);
      onFocusAction(field.id);
    }
  };
  return (
    <Button
      variant="outline"
      id={field.id}
      onClick={handleSignatureClick}
      onBlur={onBlurAction}
      className={cn(
        "h-full w-full p-1 relative bg-background/90 hover:bg-primary/5 transition-colors text-sm pdf-form-field pdf-signature-field",
        error && "border-destructive pdf-field-error",
        value && "pdf-field-success",
        field.required && "pdf-field-required",
        className,
      )}
      style={style}
    >
      {value ? (
        <div className="w-full h-full flex items-center justify-center">
          <img
            src={value}
            alt="Signature"
            className="max-h-full max-w-full object-contain"
          />
        </div>
      ) : (
        <span className="text-muted-foreground">
          {field.label ||
            `Click to add ${field.type === "initial" ? "initials" : "signature"}`}
        </span>
      )}
    </Button>
  );
}

export function PdfFormField({ field, ...props }: PdfFormFieldProps) {
  switch (field.type) {
    case "text":
    case "email":
    case "phone":
    case "number":
      return <PdfTextField field={field} {...props} />;
    case "textarea":
      return <PdfTextareaField field={field} {...props} />;
    case "checkbox":
      return <PdfCheckboxField field={field} {...props} />;
    case "date":
      return <PdfDateField field={field} {...props} />;
    case "dropdown":
      return <PdfDropdownField field={field} {...props} />;
    case "radio":
      return <PdfRadioField field={field} {...props} />;
    case "signature":
    case "initial":
      return <PdfSignatureField field={field} {...props} />;
    default:
      return <PdfTextField field={field} {...props} />;
  }
}
