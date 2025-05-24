"use client";

import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import {
  PenLine,
  PenTool,
  Type,
  CalendarDays,
  Check,
  ListFilter,
  Mail,
  Phone,
  ImageIcon,
  Lock,
  Star,
  CreditCard,
  Hash,
} from "lucide-react";
import { DocumentFieldType } from "@/types/document";
import { handleAddField } from "@/actions/field-palette-actions";

interface FieldButton {
  icon: React.ReactNode;
  label: string;
  type: DocumentFieldType;
  description: string;
}

interface FieldPaletteProps {
  onAddFieldAction?: typeof handleAddField;
  currentPage?: number; // Add current page parameter
}

export function FieldPalette({
  onAddFieldAction = handleAddField,
  currentPage = 1, // Default to page 1
}: FieldPaletteProps) {
  const fieldButtons: FieldButton[] = [
    {
      icon: <PenLine className="h-5 w-5" />,
      label: "Signature",
      type: "signature",
      description: "Add a signature field",
    },
    {
      icon: <PenTool className="h-5 w-5" />,
      label: "Initial",
      type: "initial",
      description: "Add an initial field",
    },
    {
      icon: <Type className="h-5 w-5" />,
      label: "Text",
      type: "text",
      description: "Add a text field",
    },
    {
      icon: <CalendarDays className="h-5 w-5" />,
      label: "Date",
      type: "date",
      description: "Add a date field",
    },
    {
      icon: <Check className="h-5 w-5" />,
      label: "Checkbox",
      type: "checkbox",
      description: "Add a checkbox",
    },
    {
      icon: <ListFilter className="h-5 w-5" />,
      label: "Dropdown",
      type: "dropdown",
      description: "Add a dropdown field",
    },
    {
      icon: <Mail className="h-5 w-5" />,
      label: "Email",
      type: "email",
      description: "Add an email field",
    },
    {
      icon: <Phone className="h-5 w-5" />,
      label: "Phone",
      type: "phone",
      description: "Add a phone field",
    },
    {
      icon: <ImageIcon className="h-5 w-5" />,
      label: "Image",
      type: "image",
      description: "Add an image field",
    },
    {
      icon: <Lock className="h-5 w-5" />,
      label: "Formula",
      type: "formula",
      description: "Add a calculated field",
    },
    {
      icon: <Star className="h-5 w-5" />,
      label: "Radio",
      type: "radio",
      description: "Add radio button options",
    },
    {
      icon: <CreditCard className="h-5 w-5" />,
      label: "Payment",
      type: "payment",
      description: "Add a payment field",
    },
    {
      icon: <Hash className="h-5 w-5" />,
      label: "Number",
      type: "number",
      description: "Add a number field",
    },
  ];
  const handleAddField = async (fieldType: DocumentFieldType) => {
    await onAddFieldAction(fieldType, currentPage);
  };

  return (
    <Card className="h-[calc(100vh-220px)] overflow-hidden">
      <CardContent className="p-4">
        <h2 className="text-lg font-semibold mb-2">Field Types</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Click to add fields to the document
        </p>

        <ScrollArea className="h-[calc(100vh-320px)]">
          <div className="grid grid-cols-2 gap-2">
            {fieldButtons.map((field) => (
              <Button
                key={field.type}
                variant="outline"
                className="flex flex-col items-center justify-center h-20 p-2 hover:bg-accent"
                onClick={() => handleAddField(field.type)}
                title={field.description}
              >
                {field.icon}
                <span className="mt-1 text-xs">{field.label}</span>
              </Button>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
