"use client";

import { useState, useRef, useEffect, useMemo, useCallback } from "react";
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
import { FieldsOverlayContainer } from "./fields-overlay-container";

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
  onPageChangeAction = handlePageChange,
  onTotalPagesChangeAction = handleTotalPagesChange,
  onFieldClickAction,
  debug = false,
}: PDFViewerProps) {
  const [viewerLoaded, setViewerLoaded] = useState(false);
  const [viewerScale, setViewerScale] = useState(1);
  const [currentPage, setCurrentPage] = useState(0); // Initialize with 0 to match PDF viewer's 0-based indexing
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
      if (!viewerContainerRef.current) return;

      // Enhanced PDF page element detection
      // We try multiple selectors to ensure we find the right element regardless of PDF.js version
      const selectors = [
        // In order of preference - more specific to more general
        ".rpv-core__page-layer canvas",
        ".rpv-core__page-layer",
        ".rpv-core__viewer-canvas",
        ".rpv-core__page-canvas",
        ".rpv-core__canvas-layer canvas",
        // Extra selectors for thoroughness
        ".react-pdf__Page__canvas",
        "canvas.react-pdf__Page__canvas",
      ];

      let pageElement = null;
      let pageCanvas = null;

      // First try to find the canvas directly
      for (const selector of selectors) {
        const element = viewerContainerRef.current.querySelector(selector);
        if (element) {
          // If it's a canvas, we can use it directly for measurements
          if (element.tagName.toLowerCase() === "canvas") {
            pageCanvas = element;
            pageElement = element;
            break;
          } else {
            // Otherwise, store it as a fallback page element
            pageElement = element;
            // And look for a canvas within it
            const canvas = element.querySelector("canvas");
            if (canvas) {
              pageCanvas = canvas;
              break;
            }
          }
        }
      }

      // If we found a page element (canvas or container)
      if (pageElement) {
        const pageBounds = pageElement.getBoundingClientRect();
        let originalWidth = pageBounds.width;
        let originalHeight = pageBounds.height;

        // If we found a canvas, use its intrinsic dimensions as the original PDF dimensions
        // This gives us the most accurate scaling information
        if (pageCanvas && pageCanvas instanceof HTMLCanvasElement) {
          if (pageCanvas.width > 0) {
            // Store the original dimensions (important for accurate scaling)
            originalWidth = pageCanvas.width;
            originalHeight = pageCanvas.height;

            // The displayed dimensions (actual rendering)
            const displayWidth = pageCanvas.getBoundingClientRect().width;
            const displayHeight = pageCanvas.getBoundingClientRect().height;

            // Scale factor between original PDF size and displayed size
            // This is the critical factor for field positioning
            const displayScale = displayWidth / originalWidth;

            if (debug) {
              console.log("Canvas dimensions:", {
                originalWidth,
                originalHeight,
                displayWidth,
                displayHeight,
                displayScale,
              });
            }
          }
        }

        // Only update if we have valid dimensions
        if (pageBounds.width > 0 && pageBounds.height > 0) {
          // Store the original dimensions from the PDF
          setPageViewport({
            width: originalWidth / viewerScale, // Remove the viewer scale to get the original PDF width
            height: originalHeight / viewerScale, // Remove the viewer scale to get the original PDF height
            scale: viewerScale,
          });

          if (debug) {
            console.log("Page viewport updated (normalized):", {
              width: originalWidth / viewerScale,
              height: originalHeight / viewerScale,
              viewerScale,
              displayWidth: pageBounds.width,
              displayHeight: pageBounds.height,
            });
          }
        }
      } else if (debug) {
        console.warn("Could not find PDF page element for measurements");
      }
    };

    // Only run measurements when the viewer is actually loaded
    if (viewerLoaded) {
      updateDimensions();

      // More frequent checks to ensure we get the right viewport size
      // Start with a quick check and then do periodic updates
      const initialCheck = setTimeout(updateDimensions, 100);
      const interval = setInterval(updateDimensions, 500);
      window.addEventListener("resize", updateDimensions);

      return () => {
        clearTimeout(initialCheck);
        clearInterval(interval);
        window.removeEventListener("resize", updateDimensions);
      };
    }

    return () => {};
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

    // Ensure each field has a valid pageNumber property
    const processedFields = fields.map((field) => {
      // Convert page number to number type, default to 1 if not set
      const pageNumber = Number(field.pageNumber || 1);

      return {
        ...field,
        pageNumber,
        // Add debugging info if needed
        _debug: debug
          ? {
              originalPageNumber: field.pageNumber,
              processedPageNumber: pageNumber,
            }
          : undefined,
      };
    });

    if (debug) {
      console.log("Processed field data:", processedFields);
    }

    return processedFields;
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
  const calculateScaleFactor = useCallback(() => {
    // For our new overlay-based approach, we're going to rely on
    // the FieldsOverlayContainer to handle scaling, but still provide
    // this function for the debug overlays or for legacy components
    if (!viewerContainerRef.current) return viewerScale;

    // Try to get the actual scale from the viewer
    let calculatedScale = viewerScale;

    try {
      // First, look for the zoom indicator which shows precise scaling information
      const zoomIndicator = viewerContainerRef.current.querySelector(
        ".rpv-zoom__popover-target-scale",
      );
      if (zoomIndicator && zoomIndicator.textContent) {
        const match = zoomIndicator.textContent.match(/(\d+(?:\.\d+)?)%/);
        if (match && match[1]) {
          calculatedScale = parseFloat(match[1]) / 100;

          if (debug) {
            console.log(`Scale from zoom indicator: ${calculatedScale}`);
          }
        }
      }

      // If we couldn't get it from the indicator, try getting it from page dimensions
      if (calculatedScale === viewerScale && pageViewport.width > 0) {
        // Try to get the rendered page element
        const pageElement = viewerContainerRef.current.querySelector(
          ".rpv-core__page-layer",
        );
        if (pageElement) {
          const pageBounds = pageElement.getBoundingClientRect();
          const standardWidth = 595; // Standard A4 width in PDF units
          calculatedScale = pageBounds.width / standardWidth;

          if (debug) {
            console.log(
              `Scale calculated from page dimensions: ${calculatedScale}`,
            );
          }
        }
      }
    } catch (err) {
      // If any errors occur, fall back to the viewer scale
      console.error("Error calculating scale factor:", err);
      calculatedScale = viewerScale;
    }

    // If we have valid viewport dimensions, add debug information
    if (pageViewport.width > 0 && debug) {
      // First try to get the page element directly
      if (viewerContainerRef.current) {
        // Try to get canvas directly to use its actual dimensions for debug info
        const canvas = viewerContainerRef.current.querySelector(
          ".rpv-core__canvas-layer canvas",
        ) as HTMLCanvasElement;
        if (canvas) {
          // Get the canvas's internal dimensions (original PDF size)
          const canvasWidth = canvas.width;
          // Get the displayed dimensions (how it's rendered on screen)
          const displayWidth = canvas.getBoundingClientRect().width;

          if (canvasWidth > 0 && displayWidth > 0) {
            console.log("Canvas-based scaling calculation (debug info):", {
              canvasWidth,
              displayWidth,
              actualCalculatedScale: displayWidth / canvasWidth,
              calculatedScale,
            });
          }
        }

        // If we can't get the canvas, try other page elements for debug info
        if (debug) {
          const selectors = [
            ".rpv-core__page-layer",
            ".rpv-core__viewer-canvas",
            ".rpv-core__page-canvas",
          ];

          let pageElement = null;
          for (const selector of selectors) {
            pageElement = viewerContainerRef.current.querySelector(selector);
            if (pageElement) break;
          }

          if (pageElement) {
            // Get the page bounds
            const pageBounds = pageElement.getBoundingClientRect();

            console.log("Page-based scaling calculation (debug info):", {
              pageWidth: pageViewport.width,
              renderedWidth: pageBounds.width,
              viewerScale,
              calculatedScale,
            });
          }
        }
      }
    }

    return calculatedScale;
  }, [pageViewport.width, viewerScale, debug, viewerContainerRef]); // Generate a signature preview component
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

    // When using FieldsOverlayContainer, we don't need to do position calculations here
    // The container has already positioned this element correctly
    // We just need to handle the actual display and interaction within the correctly positioned container

    // x and y should be 0 since the parent container is already positioned correctly
    // We only need to render the content itself
    return (
      <div
        className={cn(
          "absolute rounded bg-background/20 backdrop-blur-[1px]",
          highlightFields &&
            isAssignedToCurrentSigner &&
            !hasValue &&
            "animate-pulse",
          hasValue && "bg-background/40",
          highlightFields && isAssignedToCurrentSigner && "cursor-pointer",
          debug && "outline-2 outline-red-500 z-50", // Make fields more visible when debugging
        )}
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: "100%",
          height: "100%",
          border: `2px solid ${field.color || (isAssignedToCurrentSigner ? "rgba(59, 130, 246, 0.6)" : "rgba(156, 163, 175, 0.4)")}`,
          zIndex: 40, // Ensure field overlays appear above the PDF and overlay container
          pointerEvents: "auto", // Always enable pointer events for better interactivity
          boxSizing: "border-box", // Ensure borders don't affect dimensions
          overflow: "visible", // Allow content to overflow for better interaction
        }}
        onClick={(e) => {
          e.stopPropagation(); // Stop event propagation to prevent conflicts
          if (onFieldClickAction) {
            onFieldClickAction(field.id);
          }
        }}
      >
        {getFieldDisplay()}
      </div>
    );
  };

  return (
    <div
      className="relative h-[calc(100vh-200px)] w-full overflow-hidden"
      ref={viewerContainerRef}
    >
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
          <div
            className="absolute inset-0 w-full h-full overflow-visible"
            style={{
              pointerEvents: "none",
              zIndex: 30,
              position: "absolute",
            }}
          >
            {/* Use a MutationObserver to track page locations */}
            <FieldsOverlayContainer
              fields={visibleFields}
              currentPage={currentPage}
              renderFieldAction={renderFieldOverlay}
              debug={debug}
              viewerContainerRef={viewerContainerRef}
            />

            {debug && (
              <>
                <div className="absolute bottom-16 left-4 bg-black/80 text-white p-2 text-xs rounded z-50">
                  PDF Page: {currentPage} (Document Page: {currentPage + 1}) |
                  Fields on this page:
                  {
                    visibleFields.filter(
                      (f) => Number(f.pageNumber) === currentPage + 1,
                    ).length
                  }
                  | Scale: {viewerScale.toFixed(2)} | Calculated Scale:
                  {calculateScaleFactor().toFixed(3)}
                </div>

                {/* Special indicators for fields to help debug positioning/display issues */}
                {visibleFields
                  .filter((f) => Number(f.pageNumber) === currentPage + 1)
                  .map((field) => {
                    // Get the actual page element for this field
                    const pageElement =
                      viewerContainerRef.current?.querySelector(
                        `.rpv-core__page-layer[data-page-number="${currentPage}"]`,
                      ) as HTMLElement;

                    let debugStyle = {};

                    if (pageElement) {
                      // Get page position to create a perfectly aligned debug overlay
                      const pageBounds = pageElement.getBoundingClientRect();
                      const viewerBounds =
                        viewerContainerRef.current?.getBoundingClientRect();

                      if (viewerBounds && viewerContainerRef.current) {
                        // Calculate relative position of the page within the viewer
                        const relativeTop =
                          pageBounds.top -
                          viewerBounds.top +
                          viewerContainerRef.current.scrollTop;
                        const relativeLeft =
                          pageBounds.left -
                          viewerBounds.left +
                          viewerContainerRef.current.scrollLeft;

                        // Calculate scale based on page dimensions
                        const scaleX = pageBounds.width / 595; // standard PDF width
                        const scaleY = pageBounds.height / 842; // standard PDF height

                        // Force numeric values
                        const numX =
                          typeof field.x === "string"
                            ? parseFloat(field.x)
                            : Number(field.x);
                        const numY =
                          typeof field.y === "string"
                            ? parseFloat(field.y)
                            : Number(field.y);
                        const numWidth =
                          typeof field.width === "string"
                            ? parseFloat(field.width)
                            : Number(field.width);
                        const numHeight =
                          typeof field.height === "string"
                            ? parseFloat(field.height)
                            : Number(field.height);

                        debugStyle = {
                          position: "absolute",
                          left: `${relativeLeft + numX * scaleX}px`,
                          top: `${relativeTop + numY * scaleY}px`,
                          width: `${numWidth * scaleX}px`,
                          height: `${numHeight * scaleY}px`,
                          boxShadow: "0 0 0 4px rgba(255,0,0,0.3)",
                          pointerEvents: "none",
                        };
                      }
                    } else {
                      // Fallback if we can't find the page element
                      debugStyle = {
                        left: `${field.x * calculateScaleFactor()}px`,
                        top: `${field.y * calculateScaleFactor()}px`,
                        width: `${field.width * calculateScaleFactor()}px`,
                        height: `${field.height * calculateScaleFactor()}px`,
                        boxShadow: "0 0 0 4px rgba(255,0,0,0.3)",
                      };
                    }

                    return (
                      <div
                        key={`debug-${field.id}`}
                        className="absolute border-2 border-red-500 z-[100] bg-red-500/20 pointer-events-none"
                        style={debugStyle}
                      >
                        <div className="absolute top-0 left-0 bg-red-600 text-white text-xs p-1 max-w-full overflow-hidden">
                          {field.id.substring(0, 6)}...{field.type}
                        </div>
                      </div>
                    );
                  })}
              </>
            )}
          </div>
        )}
      </Worker>
    </div>
  );
}
