"use client";

import { useState } from "react";
import { DocumentField } from "@/types/document";
import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import {
  PenLine,
  Type,
  CalendarDays,
  Check,
  ListFilter,
  X,
  Grip,
} from "lucide-react";
import { ResizableBox } from "@/components/document/resizable-box";
import { cn } from "@/lib/utils";
import {
  handleFieldDragEnd,
  handleFieldResize,
  handleFieldSelect,
  handleFieldDelete,
} from "@/actions/field-actions";

interface DocumentFieldLayerProps {
  fields: DocumentField[];
  selectedFieldId?: string;
  scale: number;
  containerDimensions: { width: number; height: number };
  onFieldDragEndAction?: typeof handleFieldDragEnd;
  onFieldResizeAction?: typeof handleFieldResize;
  onFieldSelectAction?: typeof handleFieldSelect;
  onFieldDeleteAction?: typeof handleFieldDelete;
}

export function DocumentFieldLayer({
  fields,
  selectedFieldId,
  scale,
  containerDimensions,
  onFieldDragEndAction = handleFieldDragEnd,
  onFieldResizeAction = handleFieldResize,
  onFieldSelectAction = handleFieldSelect,
  onFieldDeleteAction = handleFieldDelete,
}: DocumentFieldLayerProps) {
  const handleDragEnd = async (id: string, x: number, y: number) => {
    await onFieldDragEndAction(id, x, y);
  };

  const handleResize = async (id: string, width: number, height: number) => {
    await onFieldResizeAction(id, width, height);
  };

  const handleSelect = async (field: DocumentField) => {
    await onFieldSelectAction(field);
  };

  const handleDelete = async (fieldId: string) => {
    await onFieldDeleteAction(fieldId);
  };

  return (
    <div className="absolute inset-0 pointer-events-none">
      {" "}
      {fields.map((field) => {
        return (
          <DraggableField
            key={field.id}
            field={field}
            isSelected={field.id === selectedFieldId}
            scale={scale}
            containerDimensions={containerDimensions}
            onDragEnd={handleDragEnd}
            onResize={handleResize}
            onSelect={() => handleSelect(field)}
            onDelete={() => handleDelete(field.id)}
          />
        );
      })}
    </div>
  );
}

interface DraggableFieldProps {
  field: DocumentField;
  isSelected: boolean;
  scale: number;
  containerDimensions: { width: number; height: number };
  onDragEnd: (id: string, x: number, y: number) => void;
  onResize: (id: string, width: number, height: number) => void;
  onSelect: () => void;
  onDelete: () => void;
}

function DraggableField({
  field,
  isSelected,
  scale,
  onDragEnd,
  onResize,
  onSelect,
  onDelete,
}: DraggableFieldProps) {
  const [isDragging, setIsDragging] = useState(false);

  // Setup draggable
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: field.id,
    data: field,
  });

  // Apply transform if dragging and adjust for scale
  const style = {
    transform: transform ? CSS.Transform.toString(transform) : undefined,
    position: "absolute",
    top: `${field.y * scale}px`,
    left: `${field.x * scale}px`,
    width: `${field.width * scale}px`,
    height: `${field.height * scale}px`,
    zIndex: isSelected ? 10 : 1,
  };

  // Get field icon based on type
  const getFieldIcon = () => {
    switch (field.type) {
      case "signature":
      case "initial":
        return <PenLine className="h-4 w-4" />;
      case "text":
      case "email":
      case "phone":
      case "number":
        return <Type className="h-4 w-4" />;
      case "date":
        return <CalendarDays className="h-4 w-4" />;
      case "checkbox":
        return <Check className="h-4 w-4" />;
      case "dropdown":
        return <ListFilter className="h-4 w-4" />;
      default:
        return <Type className="h-4 w-4" />;
    }
  };

  // Check if field has conditional logic
  const hasConditionalLogic =
    field.conditionalLogic && field.conditionalLogic.length > 0;

  // Get border color based on field signer color or selection state
  const getBorderColor = () => {
    if (isSelected) return "border-primary";
    if (field.color) {
      // Use inline style for dynamic color values from database
      return ""; // Use inline style instead of tailwind classes for dynamic colors
    }
    return "border-dashed border-muted-foreground";
  };

  // Get border style for inline styling with dynamic colors
  const getBorderStyle = () => {
    if (isSelected) return { borderColor: "hsl(var(--primary))" };
    if (field.color) return { borderColor: field.color };
    return {}; // Default border will be handled by Tailwind classes
  };

  // Handle start/end of drag
  const handleDragStart = () => {
    setIsDragging(true);
    onSelect();
  };

  const handleDragEnd = () => {
    setIsDragging(false);
    if (transform) {
      const newX = field.x + (transform.x || 0) / scale;
      const newY = field.y + (transform.y || 0) / scale;
      onDragEnd(field.id, newX, newY);
    }
  };

  // Handle resize
  const handleResize = async (width: number, height: number) => {
    await onResize(field.id, width, height);
    return { width, height };
  };

  // Prepare field badge and styles
  const isRequired = field.required;
  const assignedToSigner = field.signerId ? true : false;

  return (
    <div
      ref={setNodeRef}
      style={{ ...(style as React.CSSProperties), ...getBorderStyle() }}
      className={cn(
        "pointer-events-auto border-2 rounded bg-background/80 backdrop-blur-sm",
        getBorderColor(),
        {
          "shadow-md": isSelected,
          "opacity-80": isDragging,
          "ring-2 ring-amber-400/50": hasConditionalLogic && !isSelected, // Visual indicator for conditional logic
          "ring-4 ring-primary/50": isSelected,
        },
      )}
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <ResizableBox
        width={field.width}
        height={field.height}
        onResizeAction={handleResize}
        minConstraints={[100, 40]}
        isResizable={isSelected}
      >
        <div className="p-2 flex h-full items-center justify-between">
          <div className="flex items-center gap-1">
            <div
              className={cn("flex items-center justify-center rounded p-0.5", {
                "bg-primary/10": isSelected,
                [`bg-opacity-20`]: !isSelected && field.color,
              })}
              style={field.color ? { backgroundColor: `${field.color}30` } : {}}
            >
              {getFieldIcon()}
            </div>
            <span className="ml-1 text-sm truncate max-w-[120px]">
              {field.label}
            </span>

            {/* Status indicators */}
            <div className="flex gap-0.5 ml-1">
              {isRequired && (
                <span
                  className="flex h-2 w-2 rounded-full bg-destructive"
                  title="Required field"
                />
              )}
              {hasConditionalLogic && (
                <span
                  className="flex h-2 w-2 rounded-full bg-amber-400"
                  title="Has conditional logic"
                />
              )}
              {!assignedToSigner && (
                <span
                  className="flex h-2 w-2 rounded-full bg-gray-300"
                  title="No signer assigned"
                />
              )}
            </div>
          </div>

          {isSelected && (
            <div className="flex space-x-1">
              <button
                className="h-5 w-5 flex items-center justify-center text-muted-foreground hover:text-destructive"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
              >
                <X className="h-4 w-4" />
              </button>

              <div
                className="h-5 w-5 flex items-center justify-center text-muted-foreground cursor-grab"
                {...attributes}
                {...listeners}
              >
                <Grip className="h-4 w-4" />
              </div>
            </div>
          )}
        </div>
      </ResizableBox>
    </div>
  );
}
