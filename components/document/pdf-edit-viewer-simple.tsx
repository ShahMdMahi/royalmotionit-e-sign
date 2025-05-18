"use client";

import React, {
  useState,
  useCallback,
  useRef,
  useEffect,
  useMemo,
} from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { DocumentField } from "@/types/document";
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  MeasuringStrategy,
} from "@dnd-kit/core";
import {
  handleFieldUpdate,
  handleFieldDelete,
  handleFieldSelect,
  handleEditPageChange,
  handleEditTotalPagesChange,
} from "@/actions/pdf-edit-actions";
import { ResizableField } from "./resizable-field";
import { preparePdfData } from "@/utils/pdf-utils";
import { usePdfWorker } from "@/hooks/use-pdf-worker";

// PDF.js worker initialization is now handled by the usePdfWorker hook

interface PDFEditViewerSimpleProps {
  pdfData: Uint8Array;
  fields: DocumentField[];
  currentPage: number;
  onPageChangeAction?: typeof handleEditPageChange;
  onTotalPagesChangeAction?: typeof handleEditTotalPagesChange;
  onFieldUpdateAction?: typeof handleFieldUpdate;
  onFieldDeleteAction?: typeof handleFieldDelete;
  selectedFieldId?: string;
  onFieldSelectAction?: typeof handleFieldSelect;
  onFieldDragEnd?: (id: string, x: number, y: number) => Promise<any>;
  onFieldResize?: (id: string, width: number, height: number) => Promise<any>;
}

export function PDFEditViewerSimple({
  pdfData,
  fields,
  currentPage,
  onPageChangeAction = handleEditPageChange,
  onTotalPagesChangeAction = handleEditTotalPagesChange,
  onFieldUpdateAction = handleFieldUpdate,
  onFieldDeleteAction = handleFieldDelete,
  selectedFieldId,
  onFieldSelectAction = handleFieldSelect,
  onFieldDragEnd,
  onFieldResize,
}: PDFEditViewerSimpleProps) {
  const [viewerLoaded, setViewerLoaded] = useState(false);
  const [viewerScale, setViewerScale] = useState(1);
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageSize, setPageSize] = useState({ width: 0, height: 0 });
  const [snapToGrid, setSnapToGrid] = useState(true);
  const gridSize = 10; // Grid size in pixels
  const viewerContainerRef = useRef<HTMLDivElement>(null);
  const pageRef = useRef<HTMLDivElement>(null);
  const { isLoaded: workerLoaded, error: workerError } = usePdfWorker();

  // Function to snap a value to the nearest grid line
  const snapToGridValue = (value: number): number => {
    if (!snapToGrid) return value;
    return Math.round(value / gridSize) * gridSize;
  };

  // Function to calculate scale factor for field positioning based on rendered page size
  const calculateScaleFactor = useCallback(() => {
    if (pageSize.width > 0 && pageRef.current) {
      // Get the scale factor based on the rendered page dimensions vs. the original PDF dimensions
      const pageBounds = pageRef.current.getBoundingClientRect();
      const scaleFactor = pageBounds.width / pageSize.width;

      console.log("Scale factor calculation:", {
        pdfPageWidth: pageSize.width,
        renderedPageWidth: pageBounds.width,
        viewerScale,
        calculatedFactor: scaleFactor,
      });

      return scaleFactor;
    }
    return viewerScale; // Fallback to viewerScale if we don't have page dimensions yet
  }, [pageSize.width, viewerScale]);

  // Handle keyboard arrow keys for fine position adjustment
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!selectedFieldId) return;

      // Only process arrow keys
      if (!["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key))
        return;

      // Find the selected field
      const field = fields.find((f) => f.id === selectedFieldId);
      if (!field) return;

      // Prevent default to avoid page scrolling
      e.preventDefault();

      // Calculate the amount to move (1px normally, 10px with shift key)
      const moveAmount = e.shiftKey ? 10 : 1;
      const scaleFactor = calculateScaleFactor();
      // Convert screen pixels to PDF coordinates
      const moveStep = moveAmount / scaleFactor;

      // Calculate new position based on arrow key
      let newX = Number(field.x);
      let newY = Number(field.y);

      switch (e.key) {
        case "ArrowUp":
          newY -= moveStep;
          break;
        case "ArrowDown":
          newY += moveStep;
          break;
        case "ArrowLeft":
          newX -= moveStep;
          break;
        case "ArrowRight":
          newX += moveStep;
          break;
      }

      // Apply grid snapping if enabled
      if (snapToGrid) {
        newX = snapToGridValue(newX);
        newY = snapToGridValue(newY);
      }

      // Only update if position actually changed
      if (
        Math.abs(field.x - newX) >= 0.01 ||
        Math.abs(field.y - newY) >= 0.01
      ) {
        console.log(
          `Arrow key: moving field ${field.id} to (${newX}, ${newY})`,
        );

        // Update field position
        if (onFieldDragEnd) {
          onFieldDragEnd(field.id, newX, newY);
        } else {
          const updatedField = {
            ...field,
            x: newX,
            y: newY,
          };
          onFieldUpdateAction(updatedField);
        }
      }
    },
    [
      fields,
      selectedFieldId,
      snapToGrid,
      snapToGridValue,
      calculateScaleFactor,
      onFieldDragEnd,
      onFieldUpdateAction,
    ],
  );

  // Add global keydown event listener when a field is selected
  useEffect(() => {
    if (selectedFieldId) {
      window.addEventListener("keydown", handleKeyDown);

      return () => {
        window.removeEventListener("keydown", handleKeyDown);
      };
    }
  }, [selectedFieldId, handleKeyDown]);

  console.log("PDF.js version:", pdfjs.version);
  console.log(
    "PDF data type:",
    typeof pdfData,
    pdfData instanceof Uint8Array ? "Uint8Array" : "",
    Array.isArray(pdfData) ? "Array" : "",
  );
  console.log(
    "PDF.js worker loaded:",
    workerLoaded,
    workerError ? `Error: ${workerError.message}` : "",
  );

  // DnD sensors for drag and drop - improved configuration for more precise dragging
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 3, // Slightly lower distance for more precise dragging
        delay: 0, // Remove delay for immediate drag start
        tolerance: 0, // Zero tolerance for immediate activation
      },
    }),
  );

  // Get fields for current page - strictly filter by exact page number match
  const currentPageFields = fields.filter((field) => {
    // Explicitly convert to numbers to ensure accurate comparison
    return Number(field.pageNumber) === Number(currentPage);
  });

  // Update container dimensions on resize
  const updateDimensions = useCallback(() => {
    if (viewerContainerRef.current) {
      const { width, height } =
        viewerContainerRef.current.getBoundingClientRect();
      // Store dimensions if needed for calculations
    }

    if (pageRef.current) {
      const pageBounds = pageRef.current.getBoundingClientRect();
      setPageSize({
        width: pageBounds.width,
        height: pageBounds.height,
      });
    }
  }, []);
  // Set up effect for window resize
  useEffect(() => {
    updateDimensions();
    window.addEventListener("resize", updateDimensions);
    return () => window.removeEventListener("resize", updateDimensions);
  }, [updateDimensions, viewerLoaded]);
  // Track blob URLs to clean up
  const [blobUrl, setBlobUrl] = useState<string | null>(null);

  // Clean up blob URLs on unmount to prevent memory leaks
  useEffect(() => {
    return () => {
      if (blobUrl) {
        URL.revokeObjectURL(blobUrl);
        console.log("Cleaned up blob URL");
      }
    };
  }, [blobUrl]);
  // Handle document load success
  const onDocumentLoadSuccess = useCallback(
    ({ numPages: pageCount }: { numPages: number }) => {
      setViewerLoaded(true);
      setNumPages(pageCount);

      if (onTotalPagesChangeAction) {
        onTotalPagesChangeAction(pageCount);
      }

      // Allow some time for the page to render before measuring
      setTimeout(updateDimensions, 100);
    },
    [onTotalPagesChangeAction, updateDimensions],
  );

  // Handle page render success to get dimensions and update scale
  const onPageLoadSuccess = useCallback(() => {
    // Page has rendered, now we can measure its dimensions
    updateDimensions();
    setViewerLoaded(true);
  }, [updateDimensions]);

  // Handle field selection
  const handleFieldSelectInternal = useCallback(
    async (field: DocumentField | null) => {
      if (onFieldSelectAction) {
        await onFieldSelectAction(field);
      }
    },
    [onFieldSelectAction],
  );
  // Handle field drag end with absolute position preservation and grid snapping
  const handleFieldDragEnd = useCallback(
    async (id: string, x: number, y: number) => {
      try {
        const field = fields.find((f) => f.id === id);
        if (!field) return;

        // Get numerical values and apply grid snapping if enabled
        const snappedX = snapToGridValue(Number(x));
        const snappedY = snapToGridValue(Number(y));

        // Ensure values are precise numbers with up to 2 decimal places for stable positioning
        const exactX = Math.round(snappedX * 100) / 100;
        const exactY = Math.round(snappedY * 100) / 100;

        // Log the position for debugging
        console.log(
          `Field ${id} positioned at (${exactX}, ${exactY})${snapToGrid ? " (snapped to grid)" : ""}`,
        );

        // Skip if position didn't change significantly (using small tolerance)
        if (
          Math.abs(field.x - exactX) < 0.01 &&
          Math.abs(field.y - exactY) < 0.01
        ) {
          console.log("Position unchanged, skipping update");
          return;
        }

        // Apply the position update directly
        if (onFieldDragEnd) {
          await onFieldDragEnd(id, exactX, exactY);
        } else {
          const updatedField = {
            ...field,
            x: exactX,
            y: exactY,
          };
          await onFieldUpdateAction(updatedField);
        }
      } catch (error) {
        console.error("Error updating field position:", error);
      }
    },
    [fields, onFieldDragEnd, onFieldUpdateAction, snapToGrid, snapToGridValue],
  );

  // Handle field resize with enhanced precision and reliability
  const handleFieldResize = useCallback(
    async (id: string, width: number, height: number) => {
      try {
        const field = fields.find((f) => f.id === id);
        if (!field) return;

        // Cast to explicit number type to prevent string conversion issues
        // Enforce minimum sizes but preserve exact decimal values
        const finalWidth = Math.max(50, Number(width));
        const finalHeight = Math.max(30, Number(height));

        // Skip update if dimensions haven't changed to prevent unneeded rerenders
        if (field.width === finalWidth && field.height === finalHeight) return;

        // Apply the update directly with exact values
        if (onFieldResize) {
          await onFieldResize(id, finalWidth, finalHeight);
        } else {
          const updatedField = {
            ...field,
            width: finalWidth,
            height: finalHeight,
          };
          await onFieldUpdateAction(updatedField);
        }
      } catch (error) {
        console.error("Error updating field dimensions:", error);
      }
    },
    [fields, onFieldResize, onFieldUpdateAction],
  );

  // Handler for when drag operations end with optional grid snapping
  const handleDragEnd = useCallback(
    (event: any) => {
      const { active, delta } = event;
      if (active) {
        const id = active.id;
        const field = fields.find((f) => f.id === id);

        if (field) {
          // Calculate the proper scale factor accounting for actual rendered page dimensions
          const scaleFactor = calculateScaleFactor();

          // Scale the delta by the inverse of the scale factor to get true PDF coordinates
          const deltaX = Number(delta.x) / scaleFactor;
          const deltaY = Number(delta.y) / scaleFactor;

          // Compute the new position with exact decimal values - force numeric type
          let newX = Number(field.x) + deltaX;
          let newY = Number(field.y) + deltaY;

          // Apply grid snapping if enabled
          if (snapToGrid) {
            newX = snapToGridValue(newX);
            newY = snapToGridValue(newY);
          }

          // Log the position update for debugging and verification
          console.log(
            `Field ${id} positioned at (${newX}, ${newY}), scale factor: ${scaleFactor}, grid: ${snapToGrid}`,
          );

          // Apply the update without delay for immediate response
          handleFieldDragEnd(id, newX, newY);

          // Make sure field stays selected
          if (onFieldSelectAction) {
            onFieldSelectAction(field);
          }
        }
      }
    },
    [
      fields,
      calculateScaleFactor,
      handleFieldDragEnd,
      onFieldSelectAction,
      snapToGrid,
    ],
  );
  // Helper to increment zoom level
  const zoomIn = () => {
    setViewerScale((prev) => Math.min(2, prev + 0.1));
  };

  // Helper to decrement zoom level
  const zoomOut = () => {
    setViewerScale((prev) => Math.max(0.5, prev - 0.1));
  };

  return (
    <div className="relative h-full w-full" ref={viewerContainerRef}>
      <DndContext
        sensors={sensors}
        modifiers={[]} // Remove ALL modifiers completely
        onDragEnd={handleDragEnd}
        measuring={{
          draggable: {
            measure: (element) => element.getBoundingClientRect(),
          },
          droppable: {
            strategy: MeasuringStrategy.Always,
          },
        }}
      >
        <div className="relative h-full w-full overflow-auto flex items-center justify-center">
          <div className="relative pdf-container" ref={pageRef}>
            <Document
              file={useMemo(() => {
                console.log("Processing PDF data for Document component");

                if (!pdfData) {
                  console.error("PDF data is null or undefined");
                  return null;
                }

                try {
                  // Try providing the raw data first without any preprocessing
                  // This can help bypass issues with incorrect data transformation
                  if (pdfData instanceof Uint8Array) {
                    // For Uint8Array, create a direct Blob URL which is more reliable
                    const blob = new Blob([pdfData], {
                      type: "application/pdf",
                    });
                    const newBlobUrl = URL.createObjectURL(blob);

                    // Store the URL for cleanup later
                    if (blobUrl) {
                      URL.revokeObjectURL(blobUrl);
                    }
                    setBlobUrl(newBlobUrl);

                    console.log("Created direct Blob URL from Uint8Array");
                    return { url: newBlobUrl };
                  }

                  // Fall back to the utility function if direct Blob approach doesn't work
                  const preparedData = preparePdfData(pdfData);
                  if (!preparedData) {
                    console.error("Failed to prepare PDF data with utility");
                    return null;
                  }

                  console.log("PDF data prepared successfully with utility");
                  return preparedData;
                } catch (error) {
                  console.error("Error preparing PDF data:", error);
                  return null;
                }
              }, [pdfData])}
              onLoadSuccess={onDocumentLoadSuccess}
              onLoadError={(error) => {
                console.error("PDF load error:", error);
              }}
              loading={
                <div className="w-full h-full flex items-center justify-center">
                  <div className="text-primary">Loading document...</div>
                </div>
              }
              error={
                <div className="w-full h-full flex items-center justify-center">
                  <div className="text-destructive">
                    Failed to load PDF document
                  </div>
                </div>
              }
            >
              <Page
                pageNumber={currentPage}
                scale={viewerScale}
                onLoadSuccess={onPageLoadSuccess}
                renderTextLayer={false}
                renderAnnotationLayer={false}
                className="pdf-page"
                width={undefined} // Let it use its natural size
              />
            </Document>
            {viewerLoaded && (
              <div className="absolute inset-0 pointer-events-none">
                {/* Grid overlay for visual aid */}
                <div
                  className="absolute inset-0 grid"
                  style={{
                    backgroundSize: `${gridSize}px ${gridSize}px`,
                    backgroundImage: snapToGrid
                      ? "linear-gradient(to right, rgba(81, 92, 230, 0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(81, 92, 230, 0.05) 1px, transparent 1px)"
                      : "none",
                    backgroundPosition: "0 0",
                    backgroundRepeat: "repeat",
                  }}
                />

                {/* Render current page fields */}
                {currentPageFields.map((field) => (
                  <ResizableField
                    key={field.id}
                    field={field}
                    isSelected={field.id === selectedFieldId}
                    onSelectAction={() => handleFieldSelectInternal(field)}
                    onDeleteAction={() => onFieldDeleteAction(field.id)}
                    onDragEndAction={(x: number, y: number) =>
                      onFieldDragEnd
                        ? onFieldDragEnd(field.id, x, y)
                        : Promise.resolve()
                    }
                    onResizeAction={(width: number, height: number) =>
                      onFieldResize
                        ? onFieldResize(field.id, width, height)
                        : Promise.resolve()
                    }
                    viewerScale={viewerScale}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </DndContext>
      {/* Zoom Controls */}
      <div className="absolute bottom-4 right-4 bg-white rounded-lg shadow-lg p-2 flex items-center gap-2 z-10">
        <button
          onClick={zoomOut}
          className="p-1.5 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
          aria-label="Zoom out"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </button>
        <span className="text-sm font-medium min-w-[40px] text-center">
          {Math.round(viewerScale * 100)}%
        </span>
        <button
          onClick={zoomIn}
          className="p-1.5 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
          aria-label="Zoom in"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </button>
        <div className="h-8 border-l mx-1"></div>
        <button
          onClick={() => setSnapToGrid(!snapToGrid)}
          className={`p-1.5 rounded-md transition-colors flex items-center gap-1 text-xs ${snapToGrid ? "bg-primary text-white" : "bg-gray-100 hover:bg-gray-200"}`}
          aria-label={snapToGrid ? "Disable grid snap" : "Enable grid snap"}
          title={snapToGrid ? "Disable grid snap" : "Enable grid snap"}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
            <line x1="3" y1="9" x2="21" y2="9"></line>
            <line x1="3" y1="15" x2="21" y2="15"></line>
            <line x1="9" y1="3" x2="9" y2="21"></line>
            <line x1="15" y1="3" x2="15" y2="21"></line>
          </svg>
          <span>Grid</span>
        </button>
      </div>
      {/* Page Info */}
      <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-lg px-3 py-2 text-sm font-medium z-10">
        Page {currentPage} of {numPages || "?"}
      </div>
      {/* Custom styling is now in app/pdf-viewer.css */}
    </div>
  );
}
