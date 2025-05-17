"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { Viewer, Worker, SpecialZoomLevel } from "@react-pdf-viewer/core";
import { defaultLayoutPlugin } from "@react-pdf-viewer/default-layout";
import { pageNavigationPlugin } from "@react-pdf-viewer/page-navigation";
import { zoomPlugin } from "@react-pdf-viewer/zoom";
import { DocumentField } from "@/types/document";
import { cn } from "@/lib/utils";
import {
  handlePageChange,
  handleTotalPagesChange,
} from "@/actions/pdf-viewer-actions";

// Import styles for the viewer and default layout
import "@react-pdf-viewer/core/lib/styles/index.css";
import "@react-pdf-viewer/default-layout/lib/styles/index.css";
import "@react-pdf-viewer/page-navigation/lib/styles/index.css";
import "@react-pdf-viewer/zoom/lib/styles/index.css";
import Image from "next/image";
interface PDFViewerProps {
  pdfData: Uint8Array;
  fields?: DocumentField[];
  fieldValues?: Record<string, string>;
  highlightFields?: boolean;
  currentSignerId?: string;
  onPageChangeAction?: typeof handlePageChange;
  onTotalPagesChangeAction?: typeof handleTotalPagesChange;
  onFieldClickAction?: (fieldId: string) => void;
  debug?: boolean;
}

export function PDFViewer({
  pdfData,
  fields = [],
  fieldValues = {},
  highlightFields = false,
  currentSignerId,
  onPageChangeAction = handlePageChange,
  onTotalPagesChangeAction = handleTotalPagesChange,
  onFieldClickAction,
  debug = false,
}: PDFViewerProps) {
  const [viewerLoaded, setViewerLoaded] = useState(false);
  const [viewerScale, setViewerScale] = useState(1);
  const [currentPage, setCurrentPage] = useState(0); // Initialize with 0 to match PDF viewer's 0-based indexing
  const [viewerDimensions, setViewerDimensions] = useState({
    width: 0,
    height: 0,
  });
  const viewerContainerRef = useRef<HTMLDivElement>(null);

  // Configure the default layout plugin
  const defaultLayoutPluginInstance = defaultLayoutPlugin({
    sidebarTabs: (defaultTabs) => defaultTabs,
    renderToolbar: (Toolbar) => (
      <Toolbar>
        {(slots) => {
          const {
            CurrentPageInput,
            Download,
            EnterFullScreen,
            GoToNextPage,
            GoToPreviousPage,
            NumberOfPages,
            Print,
            Zoom,
            ZoomIn,
            ZoomOut,
          } = slots;

          return (
            <div className="rpv-toolbar">
              <div className="rpv-toolbar__left">
                <GoToPreviousPage />
                <CurrentPageInput />
                <NumberOfPages />
                <GoToNextPage />
              </div>
              <div className="rpv-toolbar__center">
                <ZoomOut />
                <Zoom />
                <ZoomIn />
              </div>
              <div className="rpv-toolbar__right">
                <EnterFullScreen />
                <Print />
                <Download />
              </div>
            </div>
          );
        }}
      </Toolbar>
    ),
  });

  // Page navigation plugin
  const pageNavigationPluginInstance = pageNavigationPlugin();

  // Zoom plugin
  const zoomPluginInstance = zoomPlugin();

  // Effect to measure viewer dimensions for proper field positioning
  useEffect(() => {
    const updateDimensions = () => {
      if (viewerContainerRef.current) {
        const { width, height } =
          viewerContainerRef.current.getBoundingClientRect();
        setViewerDimensions({ width, height });

        // Find the PDF page element to get its actual dimensions
        // The first selector handles most cases, but we add more selectors
        // to ensure we capture the right element regardless of PDF.js version
        const selectors = [
          ".rpv-core__page-layer",
          ".rpv-core__viewer-canvas",
          ".rpv-core__page-canvas",
          ".rpv-core__canvas-layer canvas",
        ];

        let pageElement = null;
        for (const selector of selectors) {
          pageElement = viewerContainerRef.current.querySelector(selector);
          if (pageElement) break;
        }

        if (pageElement) {
          const pageBounds = pageElement.getBoundingClientRect();

          // Only update if we have valid dimensions
          if (pageBounds.width > 0 && pageBounds.height > 0) {
            setPageViewport({
              width: pageBounds.width,
              height: pageBounds.height,
              scale: viewerScale,
            });

            if (debug) {
              console.log("Page viewport updated:", {
                width: pageBounds.width,
                height: pageBounds.height,
                scale: viewerScale,
                element: pageElement,
              });
            }
          }
        } else if (debug) {
          console.warn("Could not find PDF page element for measurements");
        }
      }
    };

    updateDimensions();

    // More frequent checks to ensure we get the right viewport size
    const interval = setInterval(updateDimensions, 500);
    window.addEventListener("resize", updateDimensions);

    return () => {
      window.removeEventListener("resize", updateDimensions);
      clearInterval(interval);
    };
  }, [viewerLoaded, viewerScale, debug, currentPage]);

  // Filter fields to show only those relevant to current viewer state
  const visibleFields = useMemo(() => {
    // Debug fields on each page if debug mode is enabled
    if (debug) {
      const fieldsByPage: Record<string, { count: number; ids: string[] }> = {};
      for (let i = 1; i <= 10; i++) {
        // Handle up to 10 pages for debugging
        const pageFields = fields.filter((f) => Number(f.pageNumber) === i);
        if (pageFields.length > 0) {
          fieldsByPage[`Page ${i}`] = {
            count: pageFields.length,
            ids: pageFields.map((f) => f.id),
          };
        }
      }
      console.log("Document Fields by Page (1-based):", fieldsByPage);
    }

    return fields.map((field) => ({
      ...field,
      // Ensure page number is always a valid number for comparison
      // Always cast to Number to avoid string comparison issues
      // Document fields use 1-based page numbering
      pageNumber: Number(field.pageNumber || 1),
    }));
  }, [fields, debug]);

  // Store current page dimensions for accurate field positioning
  const [pageViewport, setPageViewport] = useState({
    width: 0,
    height: 0,
    scale: 1,
  });

  // Debug effect to log field positioning information
  useEffect(() => {
    if (debug && viewerLoaded) {
      console.group("PDF Viewer Debug Info");
      console.log("PDF Viewer Page (0-based):", currentPage);
      console.log("Document Page (1-based):", currentPage + 1);
      console.log("Viewer Scale:", viewerScale);
      console.log("Page Viewport:", pageViewport);
      console.log("Total Fields:", fields.length);
      console.log(
        "Fields by Document Page (1-based):",
        Object.fromEntries(
          Array.from({ length: 10 }, (_, i) => i + 1).map((page) => [
            `Page ${page}` as string,
            fields.filter((f) => Number(f.pageNumber) === page).length,
          ]),
        ),
      );
      console.log(
        "Current Page Fields:",
        fields
          .filter((f) => Number(f.pageNumber) === currentPage + 1) // Adjust for 0-based vs 1-based
          .map((f) => ({
            id: f.id,
            page: f.pageNumber,
            pos: `(${f.x}, ${f.y})`,
            dim: `${f.width}x${f.height}`,
            scaledPos: `(${f.x * pageViewport.scale}, ${f.y * pageViewport.scale})`,
            scaledDim: `${f.width * pageViewport.scale}x${f.height * pageViewport.scale}`,
          })),
      );
      console.groupEnd();
    }
  }, [debug, fields, currentPage, viewerScale, pageViewport, viewerLoaded]);

  // Function to calculate scale factor for field positioning
  const calculateScaleFactor = () => {
    // If we have valid viewport dimensions, calculate the scaling factor
    if (pageViewport.width > 0) {
      // Get the scale factor from the page viewport
      let calculatedScale = viewerScale;

      // Get the canvas element that's displaying the PDF page
      if (viewerContainerRef.current) {
        const canvas = viewerContainerRef.current.querySelector(
          ".rpv-core__canvas-layer canvas",
        ) as HTMLCanvasElement;
        if (canvas) {
          // This is a more accurate way to determine the scale, using the actual canvas dimensions
          const canvasWidth = canvas.width;
          const displayWidth = canvas.getBoundingClientRect().width;
          if (canvasWidth > 0 && displayWidth > 0) {
            // The ratio between the canvas's internal width and displayed width gives us the accurate scale
            calculatedScale = (displayWidth / canvasWidth) * viewerScale;

            if (debug) {
              console.log("Enhanced scaling calculation:", {
                canvasWidth,
                displayWidth,
                viewerScale,
                calculatedScale,
              });
            }
          }
        }
      }

      return calculatedScale;
    } else {
      // Fallback to a default scale
      if (debug) {
        console.warn(
          "Using fallback scaling factor as viewport width is invalid",
        );
      }
      return 1;
    }
  };

  // Generate a signature preview component
  const renderFieldOverlay = (field: DocumentField) => {
    const value = fieldValues[field.id] || "";
    const isAssignedToCurrentSigner = true; // All fields belong to the single signer
    const hasValue = !!value;

    const getFieldDisplay = () => {
      switch (field.type) {
        case "signature":
        case "initial":
          if (hasValue) {
            return (
              <div className="w-full h-full flex items-center justify-center">
                {/* Using img tag directly here for performance and simplicity with data URIs */}
                <Image
                  src={value}
                  alt={field.type}
                  className="max-w-full max-h-full object-contain"
                />
              </div>
            );
          }
          return (
            <div className="w-full h-full flex items-center justify-center border border-dashed border-primary/50">
              <span className="text-xs text-muted-foreground">
                {field.type === "signature" ? "Sign here" : "Initial here"}
              </span>
            </div>
          );

        case "checkbox":
          return (
            <div className="w-full h-full flex items-center justify-center">
              {hasValue && value === "true" ? (
                <div className="h-5 w-5 flex items-center justify-center bg-primary text-white rounded">
                  ✓
                </div>
              ) : (
                <div className="h-5 w-5 border rounded"></div>
              )}
            </div>
          );

        case "date":
          return (
            <div className="w-full h-full flex items-center">
              {hasValue ? (
                <span className="text-sm">
                  {new Date(value).toLocaleDateString()}
                </span>
              ) : (
                <span className="text-xs text-muted-foreground">Date</span>
              )}
            </div>
          );

        default:
          return (
            <div className="w-full h-full flex items-center">
              {hasValue ? (
                <span className="text-sm truncate">{value}</span>
              ) : (
                <span className="text-xs text-muted-foreground">
                  {field.placeholder || field.label}
                </span>
              )}
            </div>
          );
      }
    };

    // Get field's page number and ensure it's a number (default to 1 if not specified)
    // Document fields use 1-based page numbers (1-6)
    const fieldPage = Number(field.pageNumber || 1);

    // Convert between 1-based indexing (fields) and 0-based indexing (PDF viewer)
    // PDF viewer returns page numbers from 0-5 for a 6-page document
    // But our field data uses 1-6 for page numbers
    const currentDocPage = currentPage + 1;

    if (fieldPage !== currentDocPage) {
      return null;
    }

    // Debug field rendering if enabled
    if (debug) {
      console.log(
        `Rendering field ${field.id} on document page ${fieldPage}, ` +
          `current viewer page: ${currentPage} (document page: ${currentDocPage})`,
      );
    }

    // Calculate scaled position and dimensions based on the PDF viewport
    // This ensures fields appear in the correct position regardless of zoom level
    const scaleFactor = calculateScaleFactor();

    // Debug field positioning if enabled
    if (debug) {
      console.log(
        `Field ${field.id} (${field.type}) on page ${fieldPage} positioning:`,
        {
          position: { x: field.x, y: field.y },
          dimensions: { w: field.width, h: field.height },
          scale: scaleFactor,
          scaled: {
            x: field.x * scaleFactor,
            y: field.y * scaleFactor,
            w: field.width * scaleFactor,
            h: field.height * scaleFactor,
          },
        },
      );
    }

    return (
      <div
        key={field.id}
        className={cn(
          "absolute rounded bg-background/20 backdrop-blur-[1px] overflow-hidden",
          highlightFields &&
            isAssignedToCurrentSigner &&
            !hasValue &&
            "animate-pulse",
          hasValue && "bg-background/40",
          highlightFields &&
            isAssignedToCurrentSigner &&
            "cursor-pointer pointer-events-auto",
          debug && "outline-2 outline-red-500 z-50", // Make fields more visible when debugging
        )}
        style={{
          left: `${field.x * scaleFactor}px`,
          top: `${field.y * scaleFactor}px`,
          width: `${field.width * scaleFactor}px`,
          height: `${field.height * scaleFactor}px`,
          border: `2px solid ${field.color || (isAssignedToCurrentSigner ? "rgba(59, 130, 246, 0.6)" : "rgba(156, 163, 175, 0.4)")}`,
          zIndex: 30, // Ensure field overlays appear above the PDF
        }}
        onClick={() => {
          if (
            highlightFields &&
            isAssignedToCurrentSigner &&
            onFieldClickAction
          ) {
            onFieldClickAction(field.id);
          }
        }}
      >
        {getFieldDisplay()}
      </div>
    );
  };

  return (
    <div className="relative h-full w-full" ref={viewerContainerRef}>
      <Worker workerUrl="/pdf.worker.min.js">
        <Viewer
          fileUrl={pdfData}
          plugins={[
            defaultLayoutPluginInstance,
            pageNavigationPluginInstance,
            zoomPluginInstance,
          ]}
          defaultScale={SpecialZoomLevel.PageFit}
          onDocumentLoad={async (e) => {
            setViewerLoaded(true);
            await onTotalPagesChangeAction(e.doc.numPages);

            // Attempt to detect page dimensions after document loads
            setTimeout(() => {
              if (viewerContainerRef.current) {
                const pageElement = viewerContainerRef.current.querySelector(
                  ".rpv-core__page-layer",
                );
                if (pageElement) {
                  const pageBounds = pageElement.getBoundingClientRect();
                  setPageViewport({
                    width: pageBounds.width,
                    height: pageBounds.height,
                    scale: viewerScale,
                  });
                  if (debug) {
                    console.log("Initial page dimensions detected:", {
                      width: pageBounds.width,
                      height: pageBounds.height,
                      scale: viewerScale,
                    });
                  }
                }
              }
            }, 200); // Give some time for the PDF to render
          }}
          onPageChange={async (e) => {
            // PDF viewer uses 0-based indexing (0-5 for a 6-page document)
            const pageNumber = Number(e.currentPage);
            // Document fields use 1-based indexing (1-6)
            const documentPage = pageNumber + 1;

            // Update the current page state (0-based)
            setCurrentPage(pageNumber);

            if (debug) {
              console.group("Page Change Event");
              console.log(`PDF Viewer Page (0-based): ${pageNumber}`);
              console.log(`Document Page (1-based): ${documentPage}`);
            }

            // Update viewport dimensions after page changes
            setTimeout(() => {
              if (viewerContainerRef.current) {
                const pageElement = viewerContainerRef.current.querySelector(
                  ".rpv-core__page-layer",
                );
                if (pageElement) {
                  const pageBounds = pageElement.getBoundingClientRect();
                  setPageViewport({
                    width: pageBounds.width,
                    height: pageBounds.height,
                    scale: viewerScale,
                  });

                  if (debug) {
                    console.log(
                      `Page dimensions: ${pageBounds.width}x${pageBounds.height}`,
                    );

                    // Count fields for the current document page (1-based)
                    const fieldsOnPage = fields.filter(
                      (f) => Number(f.pageNumber) === documentPage,
                    );
                    console.log(
                      `Fields on document page ${documentPage}: ${fieldsOnPage.length}`,
                    );

                    // Log each field's details to help with troubleshooting
                    if (fieldsOnPage.length > 0) {
                      console.table(
                        fieldsOnPage.map((f) => ({
                          id: f.id,
                          type: f.type,
                          page: f.pageNumber,
                          pos: `(${f.x}, ${f.y})`,
                          dim: `${f.width}x${f.height}`,
                        })),
                      );
                    } else {
                      console.log(
                        `No fields found on document page ${documentPage}`,
                      );
                    }
                    console.groupEnd();
                  }
                }
              }
            }, 100);

            // Pass the 0-based page index to the action
            await onPageChangeAction(pageNumber);
          }}
          onZoom={(e) => {
            setViewerScale(e.scale);

            // Update viewport when zoom changes
            setTimeout(() => {
              // Find the PDF page element to get its dimensions after zoom
              if (viewerContainerRef.current) {
                const pageElement = viewerContainerRef.current.querySelector(
                  ".rpv-core__page-layer",
                );
                if (pageElement) {
                  const pageBounds = pageElement.getBoundingClientRect();
                  setPageViewport({
                    width: pageBounds.width,
                    height: pageBounds.height,
                    scale: e.scale,
                  });
                }
              }
            }, 100); // Small delay to ensure the page has resized
          }}
        />

        {viewerLoaded && visibleFields.length > 0 && (
          <div className="absolute inset-0 pointer-events-none">
            {visibleFields
              .filter((field) => {
                // Document fields use 1-based indexing (pages 1-6)
                // PDF viewer uses 0-based indexing (pages 0-5)
                const fieldPage = Number(field.pageNumber);
                const currentDocPage = currentPage + 1; // Convert PDF page to document page

                // A field on document page 6 should appear when PDF viewer is on page 5
                const isOnCurrentPage = fieldPage === currentDocPage;

                if (debug) {
                  // Enhanced logging for all fields
                  console.log(
                    `Field ${field.id} (${field.type}) on page ${fieldPage} - will ${isOnCurrentPage ? "" : "not "}be displayed on current page ${currentPage} (doc page ${currentDocPage})`,
                  );

                  // Special logging for page 6 fields to help debug
                  if (fieldPage === 6) {
                    console.log(
                      `%cPAGE 6 FIELD: ${field.id} - ${isOnCurrentPage ? "SHOULD DISPLAY" : "NOT DISPLAYED"} on current page ${currentPage}`,
                      "background: #ff5722; color: white; padding: 2px 5px; border-radius: 2px;",
                    );
                  }
                }

                return isOnCurrentPage;
              })
              .map((field) => renderFieldOverlay(field))}

            {debug && (
              <>
                <div className="absolute bottom-16 left-4 bg-black/80 text-white p-2 text-xs rounded z-50">
                  PDF Page: {currentPage} (Document Page: {currentPage + 1}) |
                  Fields on this page:{" "}
                  {
                    visibleFields.filter(
                      (f) => Number(f.pageNumber) === currentPage + 1,
                    ).length
                  }{" "}
                  | Scale: {viewerScale.toFixed(2)}
                </div>

                {/* Special indicators for fields to help debug positioning/display issues */}
                {visibleFields
                  .filter((f) => Number(f.pageNumber) === currentPage + 1)
                  .map((field) => (
                    <div
                      key={`debug-${field.id}`}
                      className="absolute border-2 border-red-500 z-[100] bg-red-500/20 pointer-events-none"
                      style={{
                        left: `${field.x * calculateScaleFactor()}px`,
                        top: `${field.y * calculateScaleFactor()}px`,
                        width: `${field.width * calculateScaleFactor()}px`,
                        height: `${field.height * calculateScaleFactor()}px`,
                        boxShadow: "0 0 0 4px rgba(255,0,0,0.3)",
                      }}
                    >
                      <div className="absolute top-0 left-0 bg-red-600 text-white text-xs p-1 max-w-full overflow-hidden">
                        {field.id.substring(0, 6)}...{field.type}
                      </div>
                    </div>
                  ))}
              </>
            )}
          </div>
        )}
      </Worker>
    </div>
  );
}
