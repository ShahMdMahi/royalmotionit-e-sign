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
  handlePageChange,
  handleTotalPagesChange,
} from "@/actions/pdf-viewer-actions";
import { usePdfWorker } from "@/hooks/use-pdf-worker";
import { cn } from "@/lib/utils";
import {
  pdfToScreenCoordinates,
  screenToPdfCoordinates,
  getAccurateScaleFactor,
  preciseScaledValue,
  getExactFieldPosition,
} from "@/utils/pdf-utils";

// Import react-pdf styles for annotations
import "react-pdf/dist/esm/Page/AnnotationLayer.css";
import "react-pdf/dist/esm/Page/TextLayer.css";

// Import local PDF viewer styles for additional customization
import "@/app/pdf-viewer.css";
import Image from "next/image";

interface PDFViewerSimpleProps {
  pdfData: Uint8Array;
  fields?: DocumentField[];
  fieldValues?: Record<string, string>;
  currentPage?: number;
  highlightFields?: boolean;
  currentSignerId?: string;
  onPageChangeAction?: typeof handlePageChange;
  onTotalPagesChangeAction?: typeof handleTotalPagesChange;
  onFieldClickAction?: (fieldId: string) => void;
  debug?: boolean;
}

export function PDFViewerSimple({
  pdfData,
  fields = [],
  fieldValues = {},
  currentPage: externalCurrentPage,
  highlightFields = false,
  currentSignerId,
  onPageChangeAction = handlePageChange,
  onTotalPagesChangeAction = handleTotalPagesChange,
  onFieldClickAction,
  debug = false,
}: PDFViewerSimpleProps) {
  const [viewerLoaded, setViewerLoaded] = useState(false);
  const [viewerScale, setViewerScale] = useState(1);
  const [currentPage, setCurrentPage] = useState(externalCurrentPage || 1); // Using 1-based indexing for clarity
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageSize, setPageSize] = useState({ width: 0, height: 0 });
  const viewerContainerRef = useRef<HTMLDivElement>(null);
  const pageRef = useRef<HTMLDivElement>(null);
  const { isLoaded: workerLoaded, error: workerError } = usePdfWorker();

  // Debug logging
  if (debug) {
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
  }

  // Update container dimensions on resize
  const updateDimensions = useCallback(() => {
    // We don't need to measure the page bounds anymore
    // since we're using the Page component's scale prop directly
    // and our scaling calculations are based on the viewerScale
  }, []);

  // Set up effect for window resize and scale changes
  useEffect(() => {
    // We no longer need complex dimension measurements
    // Our fields will scale directly with the Page component

    // Just add a resize handler in case we need it later
    const handleResize = () => {
      // No-op for now, we don't need to respond to window resizes
      // as the scaling is directly handled by the react-pdf Page component
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [viewerScale, currentPage]);

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
  const onPageLoadSuccess = useCallback(
    (page: any) => {
      // Page has rendered, now we can measure its dimensions
      setViewerLoaded(true);

      // Store the original dimensions of the PDF (in points)
      if (page && page.originalWidth && page.originalHeight) {
        const originalSize = {
          width: page.originalWidth,
          height: page.originalHeight,
        };

        // Store the original size for reference
        setPageSize(originalSize);

        if (debug) {
          console.log(
            "PDF original dimensions from page object:",
            originalSize,
          );
          console.log("Using viewer scale:", viewerScale);
        }
      }
    },
    [debug, viewerScale],
  );

  // Handle page change
  const handlePageChanged = useCallback(
    async (newPage: number) => {
      setCurrentPage(newPage);
      if (onPageChangeAction) {
        await onPageChangeAction(newPage);
      }
    },
    [onPageChangeAction],
  );

  // Get fields for current page - strictly filter by exact page number match
  const currentPageFields = fields.filter((field) => {
    // Explicitly convert to numbers to ensure accurate comparison
    return Number(field.pageNumber) === Number(currentPage);
  });

  // Function to calculate scale factor for field positioning - adjusted for zoom level
  const calculateScaleFactor = useCallback(() => {
    // For preview mode, we want to use the raw scale value
    // This matches the edit viewer's behavior since we're using the scale prop on the Page component
    // We're directly passing viewerScale to the Page component, so we use it directly here too

    if (debug) {
      console.log("Scale factor calculation:", {
        viewerZoomLevel: viewerScale,
        scaleFactor: viewerScale,
      });
    }

    return viewerScale; // Use the direct zoom level as our scale factor
  }, [viewerScale, debug]);

  // Helper to increment zoom level
  const zoomIn = useCallback(() => {
    setViewerScale((prev) => Math.min(2, prev + 0.1));
  }, []);

  // Helper to decrement zoom level
  const zoomOut = useCallback(() => {
    setViewerScale((prev) => Math.max(0.5, prev - 0.1));
  }, []);
  // Track blob URLs to clean up
  const [blobUrl, setBlobUrl] = useState<string | null>(null);

  // Memoize the file prop value to prevent unnecessary reloads
  const memoizedFile = useMemo(() => ({ data: pdfData }), [pdfData]);

  // Clean up blob URLs on unmount to prevent memory leaks
  useEffect(() => {
    return () => {
      if (blobUrl) {
        URL.revokeObjectURL(blobUrl);
      }
    };
  }, [blobUrl]);

  // Generate a field overlay component
  const renderFieldOverlay = useCallback(
    (field: DocumentField) => {
      const value = fieldValues[field.id] || "";
      const isAssignedToCurrentSigner =
        !field.signerId || field.signerId === currentSignerId;
      const hasValue = !!value;

      const getFieldDisplay = () => {
        switch (field.type) {
          case "signature":
            return hasValue ? (
              <div className="absolute inset-0 flex items-center justify-center overflow-hidden w-full h-full">
                <Image
                  src={value}
                  alt="Signature"
                  className="max-w-full max-h-full object-contain"
                  draggable="false"
                />
              </div>
            ) : (
              <div className="text-muted-foreground text-xs flex items-center justify-center w-full h-full italic">
                {isAssignedToCurrentSigner ? "Sign here" : "Signature field"}
              </div>
            );
          case "initial":
            return hasValue ? (
              <div className="absolute inset-0 flex items-center justify-center overflow-hidden w-full h-full">
                <Image
                  src={value}
                  alt="Initial"
                  className="max-w-full max-h-full object-contain"
                  draggable="false"
                />
              </div>
            ) : (
              <div className="text-muted-foreground text-xs flex items-center justify-center w-full h-full italic">
                {isAssignedToCurrentSigner ? "Initial here" : "Initial field"}
              </div>
            );
          case "text":
            return (
              <div className="text-foreground text-sm p-1 flex items-center w-full h-full">
                {hasValue ? (
                  value
                ) : (
                  <span className="text-muted-foreground italic">
                    {field.placeholder || "Text"}
                  </span>
                )}
              </div>
            );
          case "date":
            return (
              <div className="text-foreground text-sm p-1 flex items-center w-full h-full">
                {hasValue ? (
                  value
                ) : (
                  <span className="text-muted-foreground italic">
                    {field.placeholder || "Date"}
                  </span>
                )}
              </div>
            );
          case "checkbox":
            return (
              <div className="w-full h-full flex items-center justify-center">
                {value === "true" || String(value) === "true" ? (
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <rect
                      x="0.5"
                      y="0.5"
                      width="15"
                      height="15"
                      rx="1.5"
                      stroke="#000000"
                    />
                    <path
                      d="M12 5L6.5 10.5L4 8"
                      stroke="#000000"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                ) : (
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <rect
                      x="0.5"
                      y="0.5"
                      width="15"
                      height="15"
                      rx="1.5"
                      stroke="#000000"
                    />
                  </svg>
                )}
              </div>
            );
          default:
            return (
              <div className="text-muted-foreground text-xs flex items-center justify-center w-full h-full italic">
                {field.label || field.type}
              </div>
            );
        }
      };

      // Use direct scale factor that matches the Page component's scale
      const scaleFactor = calculateScaleFactor();

      // Parse field coordinates and dimensions
      const x =
        typeof field.x === "string" ? parseFloat(field.x) : Number(field.x);
      const y =
        typeof field.y === "string" ? parseFloat(field.y) : Number(field.y);
      const width =
        typeof field.width === "string"
          ? parseFloat(field.width)
          : Number(field.width);
      const height =
        typeof field.height === "string"
          ? parseFloat(field.height)
          : Number(field.height);

      // Apply scale to all dimensions directly
      const exactX = x * scaleFactor;
      const exactY = y * scaleFactor;
      const exactWidth = width * scaleFactor;
      const exactHeight = height * scaleFactor;

      if (debug) {
        console.group(`Field ${field.id} positioning`);
        console.log(
          `Original coordinates: (${field.x}, ${field.y}) with dimensions ${field.width}x${field.height}`,
        );
        console.log(`Scale factor: ${scaleFactor}`);
        console.log(
          `Screen position: (${exactX}, ${exactY}) with dimensions ${exactWidth}x${exactHeight}`,
        );
        console.groupEnd();
      }

      return (
        <div
          key={field.id}
          className={cn(
            "field-overlay rounded bg-background/20 backdrop-blur-[1px] overflow-hidden",
            highlightFields &&
              isAssignedToCurrentSigner &&
              !hasValue &&
              "animate-pulse",
            hasValue && "bg-background/40",
            highlightFields &&
              isAssignedToCurrentSigner &&
              "cursor-pointer pointer-events-auto",
            debug && "outline-2 outline-red-500 z-50",
          )}
          style={{
            left: `${exactX}px`,
            top: `${exactY}px`,
            width: `${exactWidth}px`,
            height: `${exactHeight}px`,
            border: `2px solid ${field.color || (isAssignedToCurrentSigner ? "rgba(59, 130, 246, 0.6)" : "rgba(156, 163, 175, 0.4)")}`,
            zIndex: 30,
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
          data-field-id={field.id}
          data-field-type={field.type}
          data-field-page={field.pageNumber}
          data-field-position={`${exactX.toFixed(2)},${exactY.toFixed(2)}`}
          data-field-dimensions={`${exactWidth.toFixed(2)}x${exactHeight.toFixed(2)}`}
          data-scale-factor={scaleFactor.toFixed(4)}
        >
          {getFieldDisplay()}
        </div>
      );
    },
    [
      calculateScaleFactor,
      currentSignerId,
      debug,
      fieldValues,
      highlightFields,
      onFieldClickAction,
    ],
  );

  return (
    <div
      className="relative h-full w-full pdf-viewer-container"
      ref={viewerContainerRef}
    >
      {!workerLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-50">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary"></div>
        </div>
      )}

      <div className="flex flex-col h-full">
        {/* PDF Document */}{" "}
        <div className="flex-grow relative overflow-auto flex items-center justify-center">
          <Document
            file={memoizedFile}
            onLoadSuccess={onDocumentLoadSuccess}
            loading={
              <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary"></div>
              </div>
            }
            error={
              <div className="flex items-center justify-center h-full">
                <div className="text-red-500">Failed to load PDF</div>
              </div>
            }
          >
            <div
              className="relative bg-white shadow-md mx-auto pdf-page"
              ref={pageRef}
              style={{
                position: "relative",
                transformOrigin: "center", // Center origin for more natural zooming
                width: "max-content", // Ensure it fits the content exactly
                height: "max-content", // Ensure it fits the content exactly
              }}
              data-page-number={currentPage}
              data-viewer-scale={viewerScale}
            >
              <Page
                pageNumber={currentPage}
                scale={viewerScale} // Apply scaling directly through the Page component
                onLoadSuccess={onPageLoadSuccess}
                renderAnnotationLayer={true}
                renderTextLayer={false} // Match the edit viewer configuration
                loading={
                  <div className="flex items-center justify-center min-h-[500px]">
                    <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-primary"></div>
                  </div>
                }
                error={
                  <div className="flex items-center justify-center min-h-[500px]">
                    <div className="text-red-500">Failed to load page</div>
                  </div>
                }
                className="shadow-none"
                inputRef={(ref) => {
                  // Additional reference to ensure we capture the page properly
                  if (ref && pageRef.current !== ref) {
                    setTimeout(updateDimensions, 100);
                  }
                }}
              />

              {/* Field overlays */}
              {viewerLoaded &&
                currentPageFields.map((field) => renderFieldOverlay(field))}

              {/* Debug grid overlay - only shown in debug mode */}
              {debug && (
                <div
                  className="absolute inset-0 opacity-10 pointer-events-none z-40"
                  style={{
                    backgroundImage:
                      "linear-gradient(to right, rgba(0,0,255,0.5) 1px, transparent 1px), linear-gradient(to bottom, rgba(0,0,255,0.5) 1px, transparent 1px)",
                    backgroundSize: "50px 50px",
                    backgroundPosition: "0 0",
                  }}
                />
              )}
            </div>
          </Document>
        </div>
        {/* Controls */}
        <div className="flex items-center justify-between p-2 bg-background border-t">
          <div className="flex items-center space-x-2">
            <button
              onClick={() =>
                currentPage > 1 && handlePageChanged(currentPage - 1)
              }
              disabled={currentPage <= 1}
              className="p-1 rounded-md hover:bg-accent disabled:opacity-50"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="m15 18-6-6 6-6" />
              </svg>
            </button>
            <span>
              Page {currentPage} of {numPages || "-"}
            </span>
            <button
              onClick={() =>
                currentPage < (numPages || 0) &&
                handlePageChanged(currentPage + 1)
              }
              disabled={!numPages || currentPage >= numPages}
              className="p-1 rounded-md hover:bg-accent disabled:opacity-50"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="m9 18 6-6-6-6" />
              </svg>
            </button>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={zoomOut}
              className="p-1 rounded-md hover:bg-accent"
              disabled={viewerScale <= 0.5}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M5 12h14" />
              </svg>
            </button>
            <span>{Math.round(viewerScale * 100)}%</span>
            <button
              onClick={zoomIn}
              className="p-1 rounded-md hover:bg-accent"
              disabled={viewerScale >= 2}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 5v14" />
                <path d="M5 12h14" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
