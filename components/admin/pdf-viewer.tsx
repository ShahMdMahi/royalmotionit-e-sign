"use client";

import React, { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { Document as PDFDocument, Page } from "react-pdf";
import { pdfjs } from "react-pdf";
import {
  Search,
  ZoomIn,
  ZoomOut,
  RotateCw,
  ChevronRight,
  ChevronLeft,
  Maximize,
  AlertCircle,
  Book,
  ArrowLeft,
  ArrowRight,
  Download,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

// Initialize PDF.js worker
if (typeof window !== "undefined" && !pdfjs.GlobalWorkerOptions.workerSrc) {
  pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
}

// Export the props interface for use in other components
export interface PDFViewerProps {
  pdfData: ArrayBuffer | null;
  readOnly?: boolean;
  onPageChange?: (pageNumber: number) => void;
  onDocumentLoad?: ({ numPages }: { numPages: number }) => void;
  onFieldPlacement?: (field: PDFField, pageNumber: number) => void;
  fields?: PDFField[];
}

// Define field types
export type PDFFieldType = 
  | 'signature' 
  | 'initial' 
  | 'text' 
  | 'date' 
  | 'checkbox' 
  | 'radio' 
  | 'dropdown'
  | 'name'
  | 'email'
  | 'phone';

export interface PDFField {
  id: string;
  type: PDFFieldType;
  label: string;
  required: boolean;
  position?: {
    x: number;
    y: number;
    width: number;
    height: number;
    pageNumber: number;
  };
  placeholder?: string;
  value?: string | boolean | Date;
  options?: string[];
  assignedTo?: string; // User ID of the assignee
}

export default function PDFViewer({ 
  pdfData, 
  readOnly = true, 
  onPageChange, 
  onDocumentLoad,
  onFieldPlacement,
  fields = []
}: PDFViewerProps) {
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [showThumbnails, setShowThumbnails] = useState(false);
  const [pageIsRendering, setPageIsRendering] = useState(false);
  const [loadProgress, setLoadProgress] = useState(0);
  const [currentPageFields, setCurrentPageFields] = useState<PDFField[]>([]);
  const [selectedField, setSelectedField] = useState<PDFField | null>(null);
  const [hoveredField, setHoveredField] = useState<string | null>(null);
  const documentContainerRef = useRef<HTMLDivElement>(null);
  const pdfContainerRef = useRef<HTMLDivElement>(null);
  
  // Convert ArrayBuffer to Blob to prevent the "detached ArrayBuffer" error
  const pdfBlob = useMemo(() => {
    if (!pdfData) return null;
    try {
      return new Blob([new Uint8Array(pdfData)], { type: "application/pdf" });
    } catch (err) {
      console.error("Error creating PDF blob:", err);
      setError(err instanceof Error ? err.message : "Error preparing PDF data");
      return null;
    }
  }, [pdfData]);

  // Memoize options to avoid unnecessary reloads
  const pdfOptions = useMemo(
    () => ({
      cMapUrl: "/cmaps/",
      standardFontDataUrl: "/standard_fonts/",
    }),
    []
  );

  // Reset state when PDF data changes
  useEffect(() => {
    setNumPages(null);
    setPageNumber(1);
    setScale(1);
    setRotation(0);
    setError(null);
    setIsLoading(true);
    setLoadProgress(0);
  }, [pdfData]);

  // Filter fields for current page
  useEffect(() => {
    if (fields) {
      const filtered = fields.filter(
        (field) => field.position?.pageNumber === pageNumber
      );
      setCurrentPageFields(filtered);
    } else {
      setCurrentPageFields([]);
    }
  }, [fields, pageNumber]);

  // Handle fullscreen mode
  const toggleFullScreen = useCallback(() => {
    setIsFullScreen((prev) => !prev);
  }, []);

  // Exit fullscreen on escape key
  useEffect(() => {
    const handleEscKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isFullScreen) {
        setIsFullScreen(false);
      }
    };

    window.addEventListener("keydown", handleEscKey);
    return () => window.removeEventListener("keydown", handleEscKey);
  }, [isFullScreen]);

  // PDF document loaded successfully
  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setPageNumber(1);
    setIsLoading(false);
    setLoadProgress(100);
    if (onDocumentLoad) {
      onDocumentLoad({ numPages });
    }
  };

  // PDF document loading progress
  const onDocumentLoadProgress = ({ loaded, total }: { loaded: number; total: number }) => {
    const progress = Math.min(100, Math.round((loaded / total) * 100));
    setLoadProgress(progress);
  };

  // PDF document failed to load
  const onDocumentLoadError = (err: Error) => {
    console.error("PDF load error:", err);
    setError(err.message || "Failed to render PDF");
    setIsLoading(false);
    setLoadProgress(0);
  };

  // Pagination controls
  const goToPrevPage = useCallback(() => {
    setPageNumber((prev) => {
      const newPage = Math.max(prev - 1, 1);
      if (onPageChange && newPage !== prev) {
        onPageChange(newPage);
      }
      return newPage;
    });
  }, [onPageChange]);

  const goToNextPage = useCallback(() => {
    setPageNumber((prev) => {
      if (!numPages) return prev;
      const newPage = Math.min(prev + 1, numPages);
      if (onPageChange && newPage !== prev) {
        onPageChange(newPage);
      }
      return newPage;
    });
  }, [numPages, onPageChange]);

  const goToPage = useCallback(
    (pageNum: number) => {
      if (numPages && pageNum >= 1 && pageNum <= numPages) {
        setPageNumber(pageNum);
        if (onPageChange) {
          onPageChange(pageNum);
        }
      }
    },
    [numPages, onPageChange]
  );

  // Zoom controls
  const zoomIn = useCallback(() => {
    setScale((prev) => Math.min(prev + 0.2, 3));
  }, []);

  const zoomOut = useCallback(() => {
    setScale((prev) => Math.max(prev - 0.2, 0.5));
  }, []);

  const resetZoom = useCallback(() => {
    setScale(1);
  }, []);

  // Rotation control
  const rotateClockwise = useCallback(() => {
    setRotation((prev) => (prev + 90) % 360);
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      const container = documentContainerRef.current;

      switch (e.key) {
        case "ArrowLeft":
          goToPrevPage();
          break;
        case "ArrowRight":
          goToNextPage();
          break;
        case "ArrowUp":
          if (container) {
            // Only scroll up, don't change pages
            container.scrollBy({ top: -50, behavior: "smooth" });
            e.preventDefault();
          }
          break;
        case "ArrowDown":
          if (container) {
            // Only scroll down, don't change pages
            container.scrollBy({ top: 50, behavior: "smooth" });
            e.preventDefault();
          }
          break;
        case "+":
          zoomIn();
          break;
        case "-":
          zoomOut();
          break;
        case "r":
          rotateClockwise();
          break;
        case "f":
          toggleFullScreen();
          break;
        default:
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [goToPrevPage, goToNextPage, zoomIn, zoomOut, rotateClockwise, toggleFullScreen]);

  const onPageRenderSuccess = () => {
    setPageIsRendering(false);
  };

  useEffect(() => {
    // Set page is rendering when the page number, scale, or rotation changes
    setPageIsRendering(true);
  }, [pageNumber, scale, rotation]);

  // Add a state to control text layer rendering
  const [shouldRenderTextLayer, setShouldRenderTextLayer] = useState(true);

  // Handle page changes more gracefully by temporarily disabling text layer
  useEffect(() => {
    // Temporarily disable text layer when changing pages
    setShouldRenderTextLayer(false);

    // Re-enable text layer after a short delay to prevent abort errors
    const timeoutId = setTimeout(() => {
      setShouldRenderTextLayer(true);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [pageNumber]);

  // Download PDF
  const handleDownloadPdf = async () => {
    if (!pdfBlob) return;

    try {
      const url = URL.createObjectURL(pdfBlob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "document.pdf";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading PDF:", error);
    }
  };

  // Handle field click
  const handleFieldClick = (field: PDFField) => {
    setSelectedField(field.id === selectedField?.id ? null : field);
    
    if (field.type === 'signature' && !readOnly) {
      toast.info("Click to add your signature", {
        description: "You can sign this document when you're ready."
      });
    }
  };

  // Handle field placement
  const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (readOnly || !onFieldPlacement) return;
    
    const container = pdfContainerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // If a field is currently selected, pass its position to the parent for placement
    if (selectedField) {
      const updatedField = {
        ...selectedField,
        position: {
          ...(selectedField.position || { width: 150, height: 40 }),
          x,
          y,
          pageNumber
        }
      };
      onFieldPlacement(updatedField, pageNumber);
    }
  };

  // Get field color based on type
  const getFieldColor = (type: PDFFieldType): string => {
    switch (type) {
      case 'signature': return 'border-blue-500 bg-blue-50';
      case 'checkbox': return 'border-green-500 bg-green-50';
      case 'text': return 'border-gray-500 bg-gray-50';
      case 'date': return 'border-amber-500 bg-amber-50';
      case 'email': return 'border-purple-500 bg-purple-50';
      case 'name': return 'border-teal-500 bg-teal-50';
      case 'phone': return 'border-pink-500 bg-pink-50';
      default: return 'border-gray-500 bg-gray-50';
    }
  };

  // Get field icon
  const getFieldIcon = (type: PDFFieldType): string => {
    switch (type) {
      case 'signature': return '✍';
      case 'checkbox': return '☑';
      case 'text': return 'T';
      case 'date': return '📅';
      case 'email': return '@';
      case 'name': return 'Aa';
      case 'phone': return '📞';
      default: return '📄';
    }
  };

  // Render thumbnails
  const renderThumbnails = () => {
    if (!numPages || !showThumbnails) return null;

    return (
      <div className="border-r bg-muted/30 w-[200px] overflow-y-auto flex-shrink-0 hidden md:block">
        <div className="p-2 sticky top-0 bg-card z-10 border-b">
          <h3 className="text-sm font-medium">Pages</h3>
        </div>
        <div className="p-2">
          {Array.from(new Array(numPages), (_, index) => (
            <div
              key={`thumb-${index + 1}`}
              onClick={() => goToPage(index + 1)}
              className={cn(
                "cursor-pointer mb-2 relative rounded overflow-hidden border-2 transition-colors",
                pageNumber === index + 1 ? "border-primary" : "border-transparent hover:border-muted-foreground/50"
              )}
            >
              <div className="absolute inset-0 flex items-center justify-center bg-muted/50">
                <span className="text-xs font-medium">{index + 1}</span>
              </div>
              <PDFDocument file={pdfBlob} loading={null} error={null} options={pdfOptions}>
                <Page pageNumber={index + 1} width={180} renderTextLayer={false} renderAnnotationLayer={false} />
              </PDFDocument>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Render the document fields overlay
  const renderFieldOverlays = () => {
    return currentPageFields.map(field => {
      if (!field.position) return null;
      
      const isSelected = selectedField?.id === field.id;
      const isHovered = hoveredField === field.id;
      
      return (
        <div 
          key={field.id}
          className={cn(
            "absolute border-2 rounded flex items-center justify-center overflow-hidden transition-all",
            getFieldColor(field.type),
            isSelected ? "ring-2 ring-primary z-30" : "z-20",
            isHovered ? "opacity-90 scale-105" : "opacity-80",
            readOnly ? "cursor-default" : "cursor-pointer"
          )}
          style={{
            left: field.position.x,
            top: field.position.y,
            width: field.position.width,
            height: field.position.height,
          }}
          onClick={(e) => {
            e.stopPropagation();
            handleFieldClick(field);
          }}
          onMouseEnter={() => setHoveredField(field.id)}
          onMouseLeave={() => setHoveredField(null)}
        >
          <div className="flex flex-col items-center justify-center w-full h-full">
            <span className="text-sm font-medium">{getFieldIcon(field.type)}</span>
            <span className="text-xs truncate max-w-full px-1">{field.label}</span>
            {field.required && <span className="text-xs text-red-500 absolute top-1 right-1">*</span>}
          </div>
        </div>
      );
    });
  };

  if (!pdfData) {
    return (
      <div className="flex flex-col items-center justify-center h-full w-full p-4">
        <AlertCircle className="h-10 w-10 text-destructive mb-2" />
        <p className="text-sm text-destructive font-medium">No PDF data available</p>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col transition-all", isFullScreen ? "fixed top-0 left-0 right-0 bottom-0 z-50 bg-background" : "w-full h-full")}>
      {/* Header with controls */}
      <div className={cn("flex items-center justify-between flex-wrap gap-2 p-3 bg-card border-b", isFullScreen ? "rounded-none" : "rounded-t-md")}>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => setShowThumbnails(!showThumbnails)} className="h-8 w-8 p-0 md:flex hidden">
            {showThumbnails ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            <span className="sr-only">{showThumbnails ? "Hide thumbnails" : "Show thumbnails"}</span>
          </Button>

          <div className="flex items-center border px-1 rounded-md">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="sm" onClick={goToPrevPage} disabled={pageNumber <= 1} className="h-8 w-8 p-0">
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Previous page</TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <div className="flex items-center gap-1 px-1">
              <input
                type="number"
                min={1}
                max={numPages || 1}
                value={pageNumber}
                onChange={(e) => {
                  const value = parseInt(e.target.value);
                  if (!isNaN(value)) goToPage(value);
                }}
                className="w-12 h-6 text-center text-sm rounded border bg-background"
              />
              <span className="text-sm">/</span>
              <span className="text-sm">{numPages}</span>
            </div>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="sm" onClick={goToNextPage} disabled={!numPages || pageNumber >= numPages} className="h-8 w-8 p-0">
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Next page</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="sm" onClick={zoomOut} disabled={scale <= 0.5 || isLoading || !!error}>
                  <ZoomOut className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Zoom out</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="sm" onClick={resetZoom} disabled={isLoading || !!error}>
                  <Badge variant="outline" className="px-2 py-0">
                    {Math.round(scale * 100)}%
                  </Badge>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Reset zoom</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="sm" onClick={zoomIn} disabled={scale >= 3 || isLoading || !!error}>
                  <ZoomIn className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Zoom in</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="sm" onClick={rotateClockwise} disabled={isLoading || !!error}>
                  <RotateCw className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Rotate</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="sm" onClick={toggleFullScreen} disabled={isLoading || !!error}>
                  <Maximize className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Fullscreen</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {!readOnly && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="sm" onClick={handleDownloadPdf} disabled={isLoading || !!error}>
                    <Download className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Download PDF</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      </div>

      {/* Loading progress indicator */}
      {isLoading && (
        <div className="px-4 py-2 bg-muted">
          <Progress value={loadProgress} className="h-1" />
          <p className="text-xs text-muted-foreground mt-1">Loading document... {loadProgress}%</p>
        </div>
      )}

      {/* PDF Document */}
      <div className="flex-1 flex overflow-hidden">
        {/* Thumbnails sidebar */}
        {renderThumbnails()}

        {/* Main document area */}
        <div ref={documentContainerRef} className={cn("flex-1 overflow-auto relative", isFullScreen ? "p-6" : "p-4")}>
          <div 
            className="flex justify-center relative" 
            ref={pdfContainerRef} 
            onClick={handleCanvasClick}
          >
            {pdfBlob && (
              <PDFDocument
                file={pdfBlob}
                onLoadSuccess={onDocumentLoadSuccess}
                onLoadProgress={onDocumentLoadProgress}
                onLoadError={onDocumentLoadError}
                loading={
                  <div className="flex justify-center p-5">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-current border-t-transparent" />
                  </div>
                }
                error={
                  <div className="flex flex-col items-center p-5">
                    <AlertCircle className="h-8 w-8 text-destructive mb-2" />
                    <p className="text-destructive text-sm">Failed to load document</p>
                  </div>
                }
                options={pdfOptions}
              >
                <Page
                  pageNumber={pageNumber}
                  scale={scale}
                  rotate={rotation}
                  loading={
                    <div className="flex justify-center p-5">
                      <div className="h-6 w-6 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    </div>
                  }
                  onRenderSuccess={onPageRenderSuccess}
                  renderTextLayer={shouldRenderTextLayer}
                  renderAnnotationLayer={false}
                  className={cn(pageIsRendering ? "opacity-50" : "opacity-100", "transition-opacity duration-200")}
                />
              </PDFDocument>
            )}

            {/* Render field overlays */}
            {renderFieldOverlays()}
          </div>
        </div>
      </div>

      {/* Footer with shortcuts */}
      {isFullScreen && (
        <div className="p-2 border-t bg-card text-xs text-muted-foreground flex items-center justify-center gap-4 flex-wrap">
          <span className="flex items-center gap-1">
            <Book className="h-3 w-3" /> Press <kbd className="bg-muted px-1 rounded">←/→</kbd> to change pages
          </span>
          <span className="flex items-center gap-1">
            <Book className="h-3 w-3" /> Press <kbd className="bg-muted px-1 rounded">↑/↓</kbd> to scroll page
          </span>
          <span className="flex items-center gap-1">
            <ZoomIn className="h-3 w-3" /> Press <kbd className="bg-muted px-1 rounded">+/-</kbd> to zoom
          </span>
          <span className="flex items-center gap-1">
            <RotateCw className="h-3 w-3" /> Press <kbd className="bg-muted px-1 rounded">r</kbd> to rotate
          </span>
          <span className="flex items-center gap-1">
            <Maximize className="h-3 w-3" /> Press <kbd className="bg-muted px-1 rounded">f</kbd> to toggle fullscreen
          </span>
        </div>
      )}

      {/* Error display */}
      {error && (
        <div className="p-3 bg-destructive/10 rounded-md mx-4 mb-4">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
            <p className="text-sm text-destructive">{error}</p>
          </div>
        </div>
      )}
    </div>
  );
}
