"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { ZoomIn, ZoomOut, RotateCw, ChevronLeft, ChevronRight, Loader2, AlertCircle, Maximize, Minimize, Book, PanelLeft, PanelRight, FileText } from "lucide-react";
import { pdfjs, Document as PDFDocument, Page } from "react-pdf";
import "react-pdf/dist/esm/Page/AnnotationLayer.css";
import "react-pdf/dist/esm/Page/TextLayer.css";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

// Use local PDF worker to avoid CORS issues
pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

// Export the props interface for use in single-document.tsx
export interface PDFViewerProps {
  pdfData: ArrayBuffer | null;
}

export default function PDFViewer({ pdfData }: PDFViewerProps) {
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [showThumbnails, setShowThumbnails] = useState(false);
  const [pageIsRendering, setPageIsRendering] = useState(false);
  const [loadProgress, setLoadProgress] = useState(0);
  const documentContainerRef = useRef<HTMLDivElement>(null);

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
    setPageNumber((prev) => Math.max(prev - 1, 1));
  }, []);

  const goToNextPage = useCallback(() => {
    setPageNumber((prev) => Math.min(prev + 1, numPages || 1));
  }, [numPages]);

  const goToPage = useCallback(
    (pageNum: number) => {
      if (numPages && pageNum >= 1 && pageNum <= numPages) {
        setPageNumber(pageNum);
      }
    },
    [numPages]
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
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="sm" onClick={() => setShowThumbnails(!showThumbnails)} className="h-8 w-8 p-0 md:flex hidden">
                {showThumbnails ? <PanelLeft className="h-4 w-4" /> : <PanelRight className="h-4 w-4" />}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">{showThumbnails ? "Hide thumbnails" : "Show thumbnails"}</TooltipContent>
          </Tooltip>

          <div className="flex items-center border px-1 rounded-md">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="sm" onClick={goToPrevPage} disabled={pageNumber <= 1 || isLoading || !!error}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">Previous page</TooltipContent>
            </Tooltip>

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
              <span className="text-sm">{numPages || "?"}</span>
            </div>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="sm" onClick={goToNextPage} disabled={!numPages || pageNumber >= numPages || isLoading || !!error}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">Next page</TooltipContent>
            </Tooltip>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="sm" onClick={zoomOut} disabled={scale <= 0.5 || isLoading || !!error}>
                <ZoomOut className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">Zoom out</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="sm" onClick={resetZoom} disabled={isLoading || !!error}>
                <Badge variant="outline" className="px-2 h-5">
                  {Math.round(scale * 100)}%
                </Badge>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">Reset zoom</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="sm" onClick={zoomIn} disabled={scale >= 3 || isLoading || !!error}>
                <ZoomIn className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">Zoom in</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="sm" onClick={rotateClockwise} disabled={isLoading || !!error}>
                <RotateCw className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">Rotate</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="sm" onClick={toggleFullScreen} disabled={isLoading || !!error}>
                {isFullScreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">{isFullScreen ? "Exit full screen" : "Full screen"}</TooltipContent>
          </Tooltip>
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
        <div ref={documentContainerRef} className={cn("flex-1 overflow-auto", isFullScreen ? "p-6" : "p-4")}>
          <div className="flex justify-center">
            {pdfBlob && (
              <PDFDocument
                file={pdfBlob}
                onLoadSuccess={onDocumentLoadSuccess}
                onLoadProgress={onDocumentLoadProgress}
                onLoadError={onDocumentLoadError}
                loading={
                  <div className="flex flex-col items-center justify-center min-h-[400px]">
                    <Loader2 className="h-8 w-8 animate-spin text-primary mb-3" />
                    <p className="text-sm text-muted-foreground">Preparing document...</p>
                  </div>
                }
                error={
                  <div className="flex flex-col items-center justify-center min-h-[400px] p-4">
                    <AlertCircle className="h-10 w-10 text-destructive mb-3" />
                    <p className="text-sm text-destructive font-medium">Failed to render PDF</p>
                  </div>
                }
                externalLinkTarget="_blank"
                className={cn("pdf-document", isFullScreen ? "shadow-xl" : "shadow-md")}
                options={pdfOptions}
              >
                <div className="relative">
                  {pageIsRendering && (
                    <div className="absolute inset-0 flex items-center justify-center bg-muted/30 backdrop-blur-sm z-10">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    </div>
                  )}
                  <Page
                    pageNumber={pageNumber}
                    scale={scale}
                    rotate={rotation}
                    className={cn("rounded", isFullScreen ? "shadow-lg" : "shadow-sm")}
                    renderTextLayer={true}
                    renderAnnotationLayer={true}
                    onRenderSuccess={onPageRenderSuccess}
                    loading={
                      <div className="flex items-center justify-center min-h-[400px] min-w-[300px] border rounded-md bg-muted/20">
                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                      </div>
                    }
                    error={
                      <div className="flex flex-col items-center justify-center min-h-[400px] min-w-[300px] p-4 border rounded-md bg-destructive/5">
                        <AlertCircle className="h-8 w-8 text-destructive mb-2" />
                        <p className="text-sm text-destructive">Failed to render page {pageNumber}</p>
                      </div>
                    }
                  />
                </div>
              </PDFDocument>
            )}
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
