"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import {
  Worker,
  Viewer,
  SpecialZoomLevel,
  ViewMode,
} from "@react-pdf-viewer/core";
import { pageNavigationPlugin } from "@react-pdf-viewer/page-navigation";
import { zoomPlugin } from "@react-pdf-viewer/zoom";
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

// Import styles
import "@react-pdf-viewer/core/lib/styles/index.css";
import "@react-pdf-viewer/default-layout/lib/styles/index.css";
import "@react-pdf-viewer/page-navigation/lib/styles/index.css";
import "@react-pdf-viewer/zoom/lib/styles/index.css";

// Import styles already done at the top level
interface PDFEditViewerProps {
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

export function PDFEditViewer({
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
}: PDFEditViewerProps) {
  const [viewerLoaded, setViewerLoaded] = useState(false);
  // Properties are handled elsewhere
  const [viewerScale, setViewerScale] = useState(1);
  const viewerContainerRef = useRef<HTMLDivElement>(null);

  // Page navigation plugin with custom configuration for single page view
  const pageNavigationPluginInstance = pageNavigationPlugin();
  const { jumpToPage } = pageNavigationPluginInstance;

  // Zoom plugin with custom configuration
  const zoomPluginInstance = zoomPlugin();
  const {} = zoomPluginInstance; // Zoom controls managed by plugin

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
  // const selectedField = fields.find((field) => field.id === selectedFieldId);

  // Effect to jump to page when currentPage changes
  // This is critical to ensure we can add fields to any page
  // useEffect(() => {
  //   if (viewerLoaded && jumpToPage) {
  //     // Set page to zero-indexed value (currentPage - 1)
  //     const targetPage = Math.max(0, currentPage - 1);
  //     console.log("Jumping to page:", targetPage);

  //     // Force a delay to ensure the PDF is fully rendered before switching pages
  //     setTimeout(() => {
  //       try {
  //         // Jump to the page
  //         jumpToPage(targetPage);

  //         // Additional work to ensure single page view
  //         const pages = document.querySelectorAll(".rpv-core__inner-page");
  //         if (pages && pages.length > 0) {
  //           // Hide all pages
  //           pages.forEach((page, index) => {
  //             if (index !== targetPage) {
  //               (page as HTMLElement).style.display = "none";
  //             } else {
  //               (page as HTMLElement).style.display = "block";
  //             }
  //           });
  //         }

  //         // Force a redraw after jumping
  //         const container = document.querySelector(".rpv-core__viewer-container");
  //         if (container) {
  //           // Trigger a reflow
  //           container.classList.add("force-redraw");
  //           setTimeout(() => container.classList.remove("force-redraw"), 50);
  //         }
  //       } catch (error) {
  //         console.error("Error jumping to page:", error);
  //       }
  //     }, 100);
  //   }
  // }, [currentPage, jumpToPage, viewerLoaded]);

  // Effect to measure viewer dimensions for proper field positioning
  useEffect(() => {
    const updateDimensions = () => {
      if (viewerContainerRef.current) {
        const { width, height } =
          viewerContainerRef.current.getBoundingClientRect();
        setViewerDimensions({ width, height });
      }
    };

    updateDimensions();
    window.addEventListener("resize", updateDimensions);
    return () => window.removeEventListener("resize", updateDimensions);
  }, [viewerLoaded]);
  // Handle field drag end with absolute position preservation
  const handleFieldDragEnd = useCallback(
    async (id: string, x: number, y: number) => {
      try {
        const field = fields.find((f) => f.id === id);
        if (!field) return;

        // Avoid any rounding or formatting - keep exact numerical values
        const exactX = Number(x);
        const exactY = Number(y);

        // Skip if position didn't change
        if (field.x === exactX && field.y === exactY) return;

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
    [fields, onFieldDragEnd, onFieldUpdateAction],
  );

  // Handle field resize with enhanced precision and reliability
  // const handleFieldResize = useCallback(
  //   async (id: string, width: number, height: number) => {
  //     try {
  //       const field = fields.find((f) => f.id === id);
  //       if (!field) return;

  //       // Cast to explicit number type to prevent string conversion issues
  //       // Enforce minimum sizes but preserve exact decimal values
  //       const finalWidth = Math.max(50, Number(width));
  //       const finalHeight = Math.max(30, Number(height));

  //       // Skip update if dimensions haven't changed to prevent unneeded rerenders
  //       if (field.width === finalWidth && field.height === finalHeight) return;

  //       // Apply the update directly with exact values
  //       if (onFieldResize) {
  //         await onFieldResize(id, finalWidth, finalHeight);
  //       } else {
  //         const updatedField = {
  //           ...field,
  //           width: finalWidth,
  //           height: finalHeight,
  //         };
  //         await onFieldUpdateAction(updatedField);
  //       }
  //     } catch (error) {
  //       console.error("Error updating field dimensions:", error);
  //     }
  //   },
  //   [fields, onFieldResize, onFieldUpdateAction],
  // );
  // Handle field selection
  const handleFieldSelectInternal = async (field: DocumentField | null) => {
    await onFieldSelectAction(field);
  };

  // Set a smaller grid size for visual reference but not forced snapping
  const GRID_SIZE = 20;

  // Don't use grid snapping for now as it can cause positioning issues
  // We'll just use the grid for visual reference

  // Handler for when drag operations end - absolutely ensures exact positioning
  const handleDragEnd = useCallback(
    (event: any) => {
      const { active, delta } = event;
      if (active) {
        const id = active.id;
        const field = fields.find((f) => f.id === id);

        if (field) {
          // Use delta directly for more reliable positioning
          const deltaX = delta.x / viewerScale;
          const deltaY = delta.y / viewerScale;

          // Compute the new position with exact decimal values
          const newX = field.x + deltaX;
          const newY = field.y + deltaY;

          // Apply the update without delay for immediate response
          handleFieldDragEnd(id, newX, newY);

          // Make sure field stays selected
          if (onFieldSelectAction) {
            onFieldSelectAction(field);
          }
        }
      }
    },
    [fields, viewerScale, handleFieldDragEnd, onFieldSelectAction],
  );

  return (
    <div className="relative h-full w-full" ref={viewerContainerRef}>
      <DndContext
        sensors={sensors}
        modifiers={[]} // Remove ALL modifiers completely
        onDragEnd={handleDragEnd}
        // Simple measuring configuration that won't interfere with positioning
        measuring={{
          draggable: {
            measure: (element) => element.getBoundingClientRect(),
          },
          droppable: {
            strategy: MeasuringStrategy.Always,
          },
        }}
      >
        <Worker workerUrl="/pdf.worker.min.js">
          <div className="relative h-full w-full">
            <Viewer
              fileUrl={pdfData}
              plugins={[pageNavigationPluginInstance, zoomPluginInstance]}
              defaultScale={SpecialZoomLevel.PageFit}
              viewMode={ViewMode.SinglePage}
              renderLoader={(percentages: number) => (
                <div className="w-full h-full flex items-center justify-center">
                  <div className="text-primary">
                    Loading document... {Math.round(percentages)}%
                  </div>
                </div>
              )}
              onDocumentLoad={async (e) => {
                setViewerLoaded(true);
                console.log("Document loaded, total pages:", e.doc.numPages);
                await onTotalPagesChangeAction(e.doc.numPages);

                // Jump to the current page
                setTimeout(() => {
                  console.log("Initial page jump to:", currentPage - 1);
                  jumpToPage(currentPage - 1);
                }, 100);
              }}
              onPageChange={async (e) => {
                console.log("Page changed to:", e.currentPage);
                await onPageChangeAction(e.currentPage);
              }}
              onZoom={(e) => setViewerScale(e.scale)}
            />
            <style jsx global>{`
              /* Viewer container styling */
              .rpv-core__viewer {
                display: flex;
                flex-direction: column;
                height: 100%;
              }

              .rpv-core__viewer-container {
                flex: 1;
                overflow: hidden;
              }

              /* Hide default toolbar */
              {/* .rpv-core__minimal-button {
                display: none !important;
              } */}

              /* Container & page adjustments */
              {/* .rpv-core__inner-container {
                overflow: hidden !important;
                height: auto !important;
                max-height: 100% !important;
              } */}

              {/* .rpv-core__inner-pages {
                padding: 0 !important;
                margin: 0 !important;
                height: auto !important;
                transform: none !important;
                display: block !important;
              } */}

              {/* .rpv-core__inner-page {
                margin: 0 !important;
                padding: 0 !important;
                height: auto !important;
              } */}

              /* Hide all pages except current */
              {/* .rpv-core__inner-page {
                display: none !important;
              }

              .rpv-core__inner-page[data-page-number="${currentPage - 1}"] {
                display: block !important;
              } */}

              /* Remove transition effects */
              .rpv-core__inner-page,
              .rpv-core__inner-pages,
              .rpv-core__page-layer {
                transition: none !important;
              }
            `}</style>
          </div>

          {viewerLoaded && (
            <div className="absolute inset-0 pointer-events-none">
              {/* Grid overlay for visual aid */}
              <div
                className="absolute inset-0 grid"
                style={{
                  backgroundSize: `${GRID_SIZE}px ${GRID_SIZE}px`,
                  backgroundImage:
                    "linear-gradient(to right, rgba(81, 92, 230, 0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(81, 92, 230, 0.05) 1px, transparent 1px)",
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
        </Worker>
      </DndContext>
    </div>
  );
}
