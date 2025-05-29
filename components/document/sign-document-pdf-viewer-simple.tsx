"use client";

import React, { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { Document, Page } from "react-pdf";
import { DocumentField } from "@/types/document";
import { FieldValidationError } from "@/types/validation";
import { usePdfWorker } from "@/hooks/use-pdf-worker";
import { cn } from "@/lib/utils";
import {  pdfToScreenCoordinates } from "@/utils/pdf-utils";
import { PageNavigation } from "@/components/document/page-navigation";
import { FieldErrorTooltip } from "@/components/document/field-error-tooltip";
import { PdfFormField } from "@/components/document/pdf-form-fields";
import { Button } from "@/components/ui/button";
import { ZoomIn, ZoomOut,  RefreshCw } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

// Import react-pdf styles
import "react-pdf/dist/esm/Page/AnnotationLayer.css";
import "react-pdf/dist/esm/Page/TextLayer.css";
import "@/app/pdf-viewer.css";
import "@/app/pdf-form-fields.css";

// Import SVG icons for field types
import { Check, Edit, FileSignature, Type, Calendar, FileText } from "lucide-react";

interface SignDocumentPdfViewerSimpleProps {
  pdfData: Uint8Array | null;
  fields: DocumentField[];
  fieldValues: Record<string, string>;
  fieldErrors: FieldValidationError[];
  currentPage: number;
  currentSignerId: string;
  onPageChangeAction: (newPage: number) => Promise<number>;
  onTotalPagesChangeAction: (totalPages: number) => Promise<number>;
  onFieldClickAction: (fieldId: string) => void;
  onFieldChangeAction?: (fieldId: string, value: string) => void;
}

export function SignDocumentPdfViewerSimple({
  pdfData,
  fields,
  fieldValues,
  fieldErrors,
  currentPage,
  currentSignerId,
  onPageChangeAction,
  onTotalPagesChangeAction,
  onFieldClickAction,
  onFieldChangeAction,
}: SignDocumentPdfViewerSimpleProps) {
  const [viewerLoaded, setViewerLoaded] = useState(false);
  const [viewerScale, setViewerScale] = useState(1);
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageSize, setPageSize] = useState({ width: 0, height: 0 });
  const [activeField, setActiveField] = useState<string | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const viewerContainerRef = useRef<HTMLDivElement>(null);
  const pageRef = useRef<HTMLDivElement>(null);
  const { isLoaded: workerLoaded, error: workerError } = usePdfWorker();
  console.log("PDF worker loaded:", workerLoaded, "Error:", workerError);
  // Handle document loading errors with detailed logging
  const handleError = useCallback(
    (error: Error) => {
      console.error("Error loading PDF:", error);

      // Check for common PDF errors
      if (error.message.includes("InvalidPDFException")) {
        console.error("PDF structure is invalid. The document may be corrupted or incomplete.");
      } else if (error.message.includes("MissingPDFException")) {
        console.error("PDF not found. The document may have been deleted or moved.");
      } else if (error.message.includes("UnexpectedResponseException")) {
        console.error("Unexpected server response when loading PDF.");
      }

      // Additional diagnostic info
      if (pdfData) {
        console.info("PDF data length:", pdfData.length);
        console.info("First 20 bytes:", Array.from(pdfData.slice(0, 20)));
      }
    },
    [pdfData]
  );
  // Handle successful PDF loading
  const handleLoadSuccess = useCallback(
    ({ numPages }: { numPages: number }) => {
      setNumPages(numPages);
      onTotalPagesChangeAction(numPages);
      setViewerLoaded(true);
    },
    [onTotalPagesChangeAction]
  );

  // Handle page render success
  const handlePageLoadSuccess = useCallback(
    (page: any) => {
      const { width, height } = page.originalWidth ? { width: page.originalWidth, height: page.originalHeight } : pageSize;

      setPageSize({ width, height });

      // Adjust scale based on container width for responsive viewing
      if (viewerContainerRef.current && width) {
        const containerWidth = viewerContainerRef.current.clientWidth;
        const containerPadding = 40; // Account for padding/margins
        const optimalScale = (containerWidth - containerPadding) / width;

        // Use a minimum scale to ensure fields are easily clickable on small screens
        const minScale = 0.6;
        const newScale = Math.max(optimalScale, minScale);

        // Only update if scale changed significantly
        if (Math.abs(newScale - viewerScale) > 0.05) {
          setViewerScale(newScale);
        }
      }
    },
    [pageSize, viewerScale]
  );
  // Get fields for current page
  const currentPageFields = useMemo(() => {
    const filteredFields = fields.filter((field) => field.pageNumber === currentPage && field.signerId === currentSignerId);
    
    // Debug logging to help identify field rendering issues
    console.log(`Found ${filteredFields.length} fields for page ${currentPage}:`, 
      filteredFields.map(f => ({ id: f.id, type: f.type, x: f.x, y: f.y, width: f.width, height: f.height }))
    );
    
    // Check specifically for signature fields
    const signatureFields = filteredFields.filter(f => f.type === "signature" || f.type === "initial");
    if (signatureFields.length > 0) {
      console.log(`Found ${signatureFields.length} signature/initial fields on page ${currentPage}`);
    }
    
    return filteredFields;
  }, [fields, currentPage, currentSignerId]);

  // Create field icon component based on field type
//   const getFieldIcon = useCallback((type: string) => {
//     switch (type) {
//       case "signature":
//         return <FileSignature className="h-3.5 w-3.5" />;
//       case "initial":
//         return <Edit className="h-3.5 w-3.5" />;
//       case "text":
//         return <Type className="h-3.5 w-3.5" />;
//       case "checkbox":
//         return <Check className="h-3.5 w-3.5" />;
//       case "date":
//         return <Calendar className="h-3.5 w-3.5" />;
//       case "textarea":
//         return <FileText className="h-3.5 w-3.5" />;
//       default:
//         return <Type className="h-3.5 w-3.5" />;
//     }
//   }, []);

  // Get field status classes for styling
  const getFieldStatusClasses = useCallback(
    (fieldId: string) => {
      const value = fieldValues[fieldId];
      const hasError = fieldErrors.some((error) => error.fieldId === fieldId);
      const isRequired = fields.find((f) => f.id === fieldId)?.required;

      if (hasError) {
        return "border-destructive bg-destructive/5 hover:bg-destructive/10";
      }
      if (value && value.trim() !== "") {
        return "border-success bg-success/5 hover:bg-success/10";
      }
      if (isRequired) {
        return "border-warning bg-warning/5 hover:bg-warning/10";
      }
      return "border-primary/30 bg-primary/5 hover:bg-primary/10";
    },
    [fieldValues, fieldErrors, fields]
  );
  // Zoom control functions
  const zoomIn = useCallback(() => {
    setZoomLevel((prev) => Math.min(prev + 0.25, 3));
  }, []);

  const zoomOut = useCallback(() => {
    setZoomLevel((prev) => Math.max(prev - 0.25, 0.5));
  }, []);

  const resetZoom = useCallback(() => {
    setZoomLevel(1);
  }, []);

  // Calculate the effective scale (base scale * zoom level)
  const effectiveScale = viewerScale * zoomLevel;

  // Handle field click with active state
  const handleFieldClick = useCallback(
    (e: React.MouseEvent, fieldId: string) => {
      e.preventDefault();
      e.stopPropagation();
      setActiveField(fieldId);
      onFieldClickAction(fieldId);
    },
    [onFieldClickAction]
  );  // Create a stable reference to the PDF data
  // Using proper memoization to prevent unnecessary reloads
  const memoizedFile = useMemo(() => {
    if (!pdfData) return null;

    try {
      // Create a stable object reference by using the same structure
      // but ensuring we don't create a new object on each render
      if (pdfData instanceof Uint8Array) {
        // We only need the data property to be consistent
        return { data: pdfData };
      }
    } catch (error) {
      console.error("Error creating PDF file reference:", error);
    }

    return null;
  }, [pdfData instanceof Uint8Array ? pdfData.buffer : null]);// Handle page navigation
  const handlePageNavigation = useCallback(
    async (newPage: number) => {
      // Check if the new page is within range
      if (numPages && (newPage < 1 || newPage > numPages)) {
        return newPage;
      }

      // Update using server action
      return await onPageChangeAction(newPage);
    },
    [numPages, onPageChangeAction]
  );
  // Handle clicks outside of fields
  const handleOutsideClick = useCallback((e: React.MouseEvent) => {
    // Only handle clicks directly on the document background
    if (e.target === e.currentTarget || (e.target as HTMLElement).classList.contains("page-container")) {
      setActiveField(null);
    }
    
    // Don't clear active field when clicking inside form inputs
    const target = e.target as HTMLElement;
    const isFormElement = 
      target.tagName === "INPUT" || 
      target.tagName === "TEXTAREA" || 
      target.tagName === "SELECT" ||
      target.tagName === "BUTTON" ||
      target.closest('[role="dialog"]') !== null;
    
    if (isFormElement) {
      e.stopPropagation();
      return;
    }
  }, []);

  // Add keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only respond to keyboard shortcuts when the PDF is loaded and focused
      if (!viewerLoaded || document.activeElement?.tagName === "INPUT" || document.activeElement?.tagName === "TEXTAREA") {
        return;
      }

      switch (e.key) {
        case "ArrowRight":
        case "PageDown":
          if (numPages && currentPage < numPages) {
            handlePageNavigation(currentPage + 1);
          }
          break;
        case "ArrowLeft":
        case "PageUp":
          if (currentPage > 1) {
            handlePageNavigation(currentPage - 1);
          }
          break;
        case "Home":
          if (currentPage !== 1) {
            handlePageNavigation(1);
          }
          break;
        case "End":
          if (numPages && currentPage !== numPages) {
            handlePageNavigation(numPages);
          }
          break;
        case "+":
          zoomIn();
          break;
        case "-":
          zoomOut();
          break;
        case "0":
          resetZoom();
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [viewerLoaded, currentPage, numPages, handlePageNavigation, zoomIn, zoomOut, resetZoom]);

  return (
    <div className="flex flex-col h-full w-full">
      {/* PDF viewer controls */}
      <div className="flex items-center justify-between px-2 py-1 border-b bg-muted/30">
        <div className="text-sm text-muted-foreground">{numPages ? `Page ${currentPage} of ${numPages}` : "Loading..."}</div>
        <div className="flex items-center space-x-1">
          <TooltipProvider delayDuration={300}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={zoomOut} disabled={zoomLevel <= 0.5}>
                  <ZoomOut className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Zoom out</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider delayDuration={300}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 px-2 text-xs" onClick={resetZoom}>
                  {Math.round(zoomLevel * 100)}%
                </Button>
              </TooltipTrigger>
              <TooltipContent>Reset zoom</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider delayDuration={300}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={zoomIn} disabled={zoomLevel >= 3}>
                  <ZoomIn className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Zoom in</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
      {/* Page navigation controls */}
      {numPages && numPages > 1 ? (
        <div className="border-t bg-background py-2">
          <PageNavigation currentPage={currentPage} totalPages={numPages} onPageChangeAction={(page) => handlePageNavigation(page)} />
        </div>
      ) : null}
      {/* PDF viewer container */}
      <div className="flex-1 overflow-auto relative" ref={viewerContainerRef}>
        <div className={cn("flex justify-center min-h-full transition-opacity duration-300", viewerLoaded ? "opacity-100" : "opacity-0")} onClick={handleOutsideClick}>
          {memoizedFile ? (
            <div ref={pageRef} className="relative">
              <Document
                file={memoizedFile}
                onLoadSuccess={handleLoadSuccess}
                onLoadError={(error) => {
                  handleError(error);
                  console.error("PDF loading error details:", error);
                }}
                loading={
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
                  </div>
                }
                error={
                  <div className="flex flex-col items-center justify-center p-4 text-destructive">
                    <p className="font-medium mb-2">Failed to load PDF document</p>
                    <p className="text-sm text-muted-foreground">The document may be invalid or corrupted</p>
                    <Button variant="outline" size="sm" className="mt-4" onClick={() => window.location.reload()}>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Reload Page
                    </Button>
                  </div>
                }
                className="pdf-document"
                options={useMemo(
                  () => ({
                    cMapUrl: "https://unpkg.com/pdfjs-dist@3.4.120/cmaps/",
                    cMapPacked: true,
                    standardFontDataUrl: "https://unpkg.com/pdfjs-dist@3.4.120/standard_fonts/",
                  }),
                  []
                )}
              >
                {workerLoaded ? (
                  <Page
                    pageNumber={currentPage}
                    scale={effectiveScale}
                    onLoadSuccess={handlePageLoadSuccess}
                    className="page-container shadow-md"
                    loading={
                      <div className="flex items-center justify-center h-[600px] w-full">
                        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
                      </div>
                    }
                  />
                ) : (
                  <div className="flex items-center justify-center p-4">Loading PDF viewer...</div>
                )}

                {/* Interactive field overlay */}
                <div className="absolute top-0 left-0 w-full h-full pointer-events-none">                  {currentPageFields.map((field) => {                    // Make sure field has all required positioning properties
                    if (field.x === undefined || field.y === undefined || 
                        field.width === undefined || field.height === undefined) {
                      console.error("Field is missing position/size data:", field);
                      return null; // Skip rendering this field
                    }
                    
                    // Calculate scaled position and size
                    const fieldCoords = pdfToScreenCoordinates(
                      Number(field.x), 
                      Number(field.y), 
                      effectiveScale
                    );
                    const width = Number(field.width) * effectiveScale;
                    const height = Number(field.height) * effectiveScale;
                    const isActive = field.id === activeField;
                    const hasError = fieldErrors.some((error) => error.fieldId === field.id);
                    const value = fieldValues[field.id] || "";
                    
                    return (
                      <FieldErrorTooltip key={field.id} fieldId={field.id} fieldErrors={fieldErrors}>
                        <div
                          className={cn(
                            "absolute border-2 rounded-md pointer-events-auto transition-all overflow-hidden",
                            getFieldStatusClasses(field.id),
                            isActive && "ring-2 ring-primary ring-offset-2 shadow-lg scale-[1.02]"
                          )}                          style={{
                            left: `${fieldCoords.x}px`,
                            top: `${fieldCoords.y}px`,
                            width: `${width}px`,
                            height: `${height}px`,
                            zIndex: 10,
                          }}
                          onClick={(e) => {
                            // Only handle container clicks
                            if (e.target === e.currentTarget) {
                              handleFieldClick(e, field.id);
                            }
                          }}
                          data-field-id={field.id}
                          data-field-type={field.type}
                          data-field-required={field.required}
                        >                          <PdfFormField 
                            field={field}
                            value={value}
                            onChangeAction={(fieldId, newValue) => {
                              if (onFieldChangeAction) {
                                onFieldChangeAction(fieldId, newValue);
                              } else {
                                // If no change action provided, fallback to click action
                                handleFieldClick(new MouseEvent('click') as any, fieldId);
                              }
                            }}
                            onFocusAction={(fieldId) => {
                              setActiveField(fieldId);
                              // For signature fields, directly trigger the click action
                              if (field.type === "signature" || field.type === "initial") {
                                onFieldClickAction(fieldId);
                              }
                            }}
                            onBlurAction={() => {
                              // Keep active state when clicking inside the field
                              // The active field state will be cleared when clicking outside
                            }}
                            error={hasError}
                            style={{
                              width: '100%',
                              height: '100%',
                            }}
                            className={isActive ? 'focus-within:ring-0' : ''}
                          />
                        </div>
                      </FieldErrorTooltip>
                    );
                  })}
                </div>
              </Document>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full w-full">
              <p className="text-muted-foreground">No document to display</p>
            </div>
          )}
        </div>
      </div>
      {/* Page navigation controls */}
      {numPages && numPages > 1 ? (
        <div className="border-t bg-background py-2">
          <PageNavigation currentPage={currentPage} totalPages={numPages} onPageChangeAction={(page) => handlePageNavigation(page)} />
        </div>
      ) : null}
    </div>
  );
}
