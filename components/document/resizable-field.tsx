"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useDraggable } from "@dnd-kit/core";
import { DocumentField } from "@/types/document";
import { cn } from "@/lib/utils";
import { Trash, Move, ChevronsUpDown, Asterisk } from "lucide-react";
import { Button } from "@/components/ui/button";
import { pdfToScreenCoordinates } from "@/utils/pdf-utils";

interface ResizableFieldProps {
  field: DocumentField;
  isSelected: boolean;
  onSelectAction: () => void;
  onDeleteAction: () => void;
  onDragEndAction: (x: number, y: number) => void;
  onResizeAction: (width: number, height: number) => void;
  viewerScale: number;
}

export function ResizableField({
  field,
  isSelected,
  onSelectAction,
  onDeleteAction,
  onDragEndAction,
  onResizeAction,
  viewerScale,
}: ResizableFieldProps) {
  const [isResizing, setIsResizing] = useState(false);
  const [dimensions, setDimensions] = useState({
    width: field.width,
    height: field.height,
  });

  // Use useDraggable with a strict configuration to prevent jumps
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: field.id,
    data: {
      field,
    },
  });

  // Store the field's original position when drag starts with precise values
  const positionRef = useRef({
    original: { x: Number(field.x), y: Number(field.y) },
    current: { x: Number(field.x), y: Number(field.y) },
  });

  // Update the reference when field position changes from props
  // Ensure we're always working with numeric values to avoid string conversion issues
  useEffect(() => {
    positionRef.current = {
      original: { x: Number(field.x), y: Number(field.y) },
      current: { x: Number(field.x), y: Number(field.y) },
    };
  }, [field.x, field.y]);

  // Handle transform changes to update position when dragging ends
  useEffect(() => {
    if (transform && (transform.x !== 0 || transform.y !== 0)) {
      return () => {
        // This cleanup function will run when the transform changes or component unmounts
        // If we have a non-zero transform, it means dragging has occurred
        if (transform.x !== 0 || transform.y !== 0) {
          const newX = Number(field.x) + transform.x / viewerScale;
          const newY = Number(field.y) + transform.y / viewerScale;
          onDragEndAction(newX, newY);
        }
      };
    }
  }, [transform, field.x, field.y, viewerScale, onDragEndAction]);

  // Handle mouse events for resizing using useCallback to ensure stable function references
  const handleResizeStart = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      e.stopPropagation();
      e.preventDefault();

      // Store initial dimensions for smooth resizing
      setDimensions({
        width: field.width,
        height: field.height,
      });

      setIsResizing(true);
    },
    [field.width, field.height],
  );

  const handleResizeMove = useCallback(
    (e: MouseEvent) => {
      if (!isResizing) return;

      // Get the container's rect directly from the DOM
      const fieldElement = document.getElementById(`field-${field.id}`);
      if (!fieldElement) return;

      const rect = fieldElement.getBoundingClientRect();

      // Get precise mouse position relative to the field using high-precision coordinates
      // Use clientX/Y for more accurate positioning with floating point precision
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      // Calculate dimensions with full decimal precision
      // Avoid any rounding or floor/ceil operations that could cause jumps
      const exactWidth = x / viewerScale;
      const exactHeight = y / viewerScale;

      // Apply minimum size constraints but preserve exact decimal values
      // Use Number() to ensure we're working with numeric types, not strings
      setDimensions({
        width: Math.max(50, exactWidth),
        height: Math.max(30, exactHeight),
      });

      // Request animation frame for smoother updates on high refresh rate displays
      if (window.requestAnimationFrame) {
        window.requestAnimationFrame(() => {
          // Optionally provide visual feedback during resize without waiting for state update
          if (fieldElement) {
            fieldElement.style.width = `${Math.max(50, exactWidth)}px`;
            fieldElement.style.height = `${Math.max(30, exactHeight)}px`;
          }
        });
      }
    },
    [isResizing, field.id, viewerScale],
  );

  const handleResizeEnd = useCallback(
    (e: MouseEvent) => {
      if (isResizing) {
        // Store the exact dimensions with precise numeric values to prevent string conversions
        const finalWidth = Number(dimensions.width);
        const finalHeight = Number(dimensions.height);

        // First update the state to stop resizing
        setIsResizing(false);

        // Directly apply the dimensions for immediate feedback
        // This eliminates the timeout which could cause UI lag
        onResizeAction(finalWidth, finalHeight);

        // Prevent any parent events from triggering
        e.preventDefault();
        e.stopPropagation();
      }
    },
    [isResizing, dimensions.width, dimensions.height, onResizeAction],
  );
  useEffect(() => {
    if (isResizing) {
      // Add event listeners to window to track resize movements
      window.addEventListener("mousemove", handleResizeMove);
      window.addEventListener("mouseup", handleResizeEnd);

      return () => {
        // Clean up listeners when component unmounts or resizing stops
        window.removeEventListener("mousemove", handleResizeMove);
        window.removeEventListener("mouseup", handleResizeEnd);
      };
    }
  }, [isResizing, handleResizeMove, handleResizeEnd]);

  // Helper to determine field type display
  const getFieldTypeDisplay = () => {
    switch (field.type) {
      case "signature":
        return "Signature";
      case "initial":
        return "Initial";
      case "text":
        return "Text";
      case "date":
        return "Date";
      case "checkbox":
        return "Checkbox";
      default:
        return field.type || "Field";
    }
  };

  return (
    <div
      id={`field-${field.id}`}
      ref={setNodeRef}
      className={cn(
        "absolute border-2 rounded flex flex-col overflow-hidden pointer-events-auto",
        isSelected
          ? "border-primary shadow-md z-10"
          : "border-dashed border-primary/60",
        isResizing && "select-none",
        transform && "opacity-90 shadow-lg",
      )}
      style={{
        position: "absolute",
        ...(() => {
          // Use the utility function to convert PDF coordinates to screen coordinates
          const screenCoords = pdfToScreenCoordinates(
            field.x,
            field.y,
            viewerScale,
          );
          return {
            left: `${Math.round(screenCoords.x * 100) / 100}px`,
            top: `${Math.round(screenCoords.y * 100) / 100}px`,
          };
        })(),
        width: `${Math.round(Number(dimensions.width) * viewerScale * 100) / 100}px`,
        height: `${Math.round(Number(dimensions.height) * viewerScale * 100) / 100}px`,
        backgroundColor: field.color
          ? `${field.color}20`
          : "rgba(99, 102, 241, 0.1)",
        borderColor:
          field.color ||
          (isSelected ? "rgb(99, 102, 241)" : "rgba(99, 102, 241, 0.6)"),
        transform: transform
          ? `translate3d(${Math.round(transform.x * 100) / 100}px, ${Math.round(transform.y * 100) / 100}px, 0)`
          : undefined,
        cursor: isResizing ? "nwse-resize" : "move",
        // Remove ALL transitions completely
        transition: "none",
        // Important for preventing sub-pixel rendering issues
        willChange: "transform",
        // Force hardware acceleration for smoother dragging
        backfaceVisibility: "hidden",
        WebkitBackfaceVisibility: "hidden",
        transformStyle: "preserve-3d",
        // Add border-box sizing to ensure consistent dimensions
        boxSizing: "border-box",
        // Prevent text selection during dragging
        userSelect: "none",
      }}
      onMouseEnter={(e) => {
        if (!isSelected && !isResizing) {
          e.currentTarget.style.backgroundColor = field.color
            ? `${field.color}30`
            : "rgba(99, 102, 241, 0.2)";
          e.currentTarget.style.boxShadow = "0 2px 4px rgba(0, 0, 0, 0.1)";
        }
      }}
      onMouseLeave={(e) => {
        if (!isSelected && !isResizing) {
          e.currentTarget.style.backgroundColor = field.color
            ? `${field.color}20`
            : "rgba(99, 102, 241, 0.1)";
          e.currentTarget.style.boxShadow = "none";
        }
      }}
      onClick={(e) => {
        // Only handle clicks when no dragging has occurred
        if (!transform || (transform.x === 0 && transform.y === 0)) {
          e.stopPropagation();
          onSelectAction();
        }
      }}
      onMouseDown={(e) => {
        // Prevent default to avoid text selection during drag
        e.preventDefault();
      }}
    >
      {/* Field header with controls - only visible when selected */}
      {isSelected && (
        <div className="absolute top-0 left-0 right-0 bg-primary/90 text-primary-foreground text-xs py-0.5 px-1 flex items-center justify-between z-10">
          <div className="flex items-center">
            <div className="cursor-move" {...attributes} {...listeners}>
              <Move className="h-3 w-3 mr-1" />
            </div>
            <span className="truncate max-w-[100px]">
              {field.label || getFieldTypeDisplay()}
              {/* Always show required indicator for single-user system */}
              <Asterisk className="h-3 w-3 ml-1 inline-block text-red-500" />
            </span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-4 w-4 p-0 hover:bg-primary-foreground/10 hover:text-destructive"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onDeleteAction();
            }}
            aria-label="Delete field"
          >
            <Trash className="h-3 w-3" />
          </Button>
        </div>
      )}

      {/* Main content area */}
      <div className="flex items-center justify-center h-full w-full p-1">
        {field.label ? (
          <div className="flex items-center">
            <span className="truncate text-xs text-muted-foreground">
              {field.label}
            </span>
            {/* Show required asterisk for all fields */}
            <span className="text-red-500 ml-1">*</span>
          </div>
        ) : (
          <div className="flex items-center">
            <span className="text-xs text-muted-foreground">
              {getFieldTypeDisplay()}
            </span>
            {/* Show required asterisk for all fields */}
            <span className="text-red-500 ml-1">*</span>
          </div>
        )}
      </div>

      {/* Resize handle - only visible when selected */}
      {isSelected && (
        <div
          className="absolute bottom-0 right-0 w-6 h-6 bg-primary text-white flex items-center justify-center cursor-nwse-resize z-20 shadow-md hover:bg-primary/90"
          onMouseDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
            handleResizeStart(e);
          }}
        >
          <ChevronsUpDown className="h-4 w-4 rotate-45" />
        </div>
      )}
    </div>
  );
}
