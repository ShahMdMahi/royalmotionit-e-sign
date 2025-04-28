"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { ZoomIn, ZoomOut, RotateCw, ChevronLeft, ChevronRight, Loader2, AlertCircle, Maximize, Minimize, Book, PanelLeft, PanelRight, PenLine, Hand, Eraser, Save, Square } from "lucide-react";
import { pdfjs, Document as PDFDocument, Page } from "react-pdf";
import "react-pdf/dist/esm/Page/AnnotationLayer.css";
import "react-pdf/dist/esm/Page/TextLayer.css";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { HexColorPicker } from "react-colorful";

// Use local PDF worker to avoid CORS issues
pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

// Export the props interface for use in single-document.tsx
export interface PDFViewerProps {
  pdfData: ArrayBuffer | null;
  allowAnnotations?: boolean;
  allowSignature?: boolean;
  onSaveAnnotations?: (annotations: PdfAnnotation[]) => Promise<void>;
  readOnly?: boolean;
  documentId?: string;
}

// Define annotation types
export type PdfAnnotation = {
  id: string;
  type: "freehand" | "signature" | "text" | "highlight" | "rectangle";
  points?: { x: number; y: number }[];
  pageNumber: number;
  color: string;
  strokeWidth: number;
  content?: string;
  position?: { x: number; y: number; width: number; height: number };
  createdAt: Date;
  modifiedAt: Date;
};

export default function PDFViewer({ pdfData, allowAnnotations = false, allowSignature = false, onSaveAnnotations, readOnly = true, documentId }: PDFViewerProps) {
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
  const annotationCanvasRef = useRef<HTMLCanvasElement>(null);
  const pdfContainerRef = useRef<HTMLDivElement>(null);

  // Annotation states
  const [activeToolTab, setActiveToolTab] = useState<string>("view");
  const [currentTool, setCurrentTool] = useState<string>("hand");
  const [isDrawing, setIsDrawing] = useState(false);
  const [annotations, setAnnotations] = useState<PdfAnnotation[]>([]);
  const [currentAnnotation, setCurrentAnnotation] = useState<PdfAnnotation | null>(null);
  const [strokeColor, setStrokeColor] = useState<string>("#FF0000");
  const [strokeWidth, setStrokeWidth] = useState<number>(2);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [signatureMode, setSignatureMode] = useState<boolean>(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false);

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

  // Annotation mode handlers
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (readOnly || activeToolTab !== "annotate") return;

    const canvas = annotationCanvasRef.current;
    const pdfContainer = pdfContainerRef.current;
    if (!canvas || !pdfContainer) return;

    const rect = pdfContainer.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setIsDrawing(true);

    if (currentTool === "pen") {
      // Start a new freehand annotation
      const newAnnotation: PdfAnnotation = {
        id: `annotation-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        type: "freehand",
        points: [{ x, y }],
        pageNumber,
        color: strokeColor,
        strokeWidth,
        createdAt: new Date(),
        modifiedAt: new Date(),
      };
      setCurrentAnnotation(newAnnotation);
    } else if (currentTool === "rectangle") {
      // Start a new rectangle annotation
      const newAnnotation: PdfAnnotation = {
        id: `annotation-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        type: "rectangle",
        pageNumber,
        color: strokeColor,
        strokeWidth,
        position: { x, y, width: 0, height: 0 },
        createdAt: new Date(),
        modifiedAt: new Date(),
      };
      setCurrentAnnotation(newAnnotation);
    } else if (currentTool === "signature" && signatureMode) {
      // Place signature at this position
      const newSignature: PdfAnnotation = {
        id: `signature-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        type: "signature",
        pageNumber,
        color: strokeColor,
        strokeWidth,
        position: { x, y, width: 200, height: 80 },
        content: "Placeholder Signature",
        createdAt: new Date(),
        modifiedAt: new Date(),
      };

      // Add signature to annotations
      setAnnotations((prev) => [...prev, newSignature]);
      setSignatureMode(false);
      setHasUnsavedChanges(true);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDrawing || readOnly || !currentAnnotation || activeToolTab !== "annotate") return;

    const canvas = annotationCanvasRef.current;
    const pdfContainer = pdfContainerRef.current;
    if (!canvas || !pdfContainer) return;

    const rect = pdfContainer.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (currentTool === "pen" && currentAnnotation.points) {
      // Continue drawing freehand
      setCurrentAnnotation({
        ...currentAnnotation,
        points: [...currentAnnotation.points, { x, y }],
        modifiedAt: new Date(),
      });
    } else if (currentTool === "rectangle" && currentAnnotation.position) {
      // Update rectangle dimensions
      const startX = currentAnnotation.position.x;
      const startY = currentAnnotation.position.y;
      setCurrentAnnotation({
        ...currentAnnotation,
        position: {
          x: startX,
          y: startY,
          width: x - startX,
          height: y - startY,
        },
        modifiedAt: new Date(),
      });
    }
  };

  const handleMouseUp = () => {
    if (isDrawing && currentAnnotation && !readOnly && activeToolTab === "annotate") {
      setAnnotations((prev) => [...prev, currentAnnotation]);
      setCurrentAnnotation(null);
      setIsDrawing(false);
      setHasUnsavedChanges(true);
    }
  };

  // Drawing annotations on canvas
  useEffect(() => {
    const canvas = annotationCanvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Set canvas dimensions to match container
    if (pdfContainerRef.current) {
      const rect = pdfContainerRef.current.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
    }

    // Draw existing annotations for current page
    const pageAnnotations = annotations.filter((anno) => anno.pageNumber === pageNumber);
    pageAnnotations.forEach((annotation) => {
      ctx.strokeStyle = annotation.color;
      ctx.lineWidth = annotation.strokeWidth;
      ctx.lineJoin = "round";
      ctx.lineCap = "round";

      if (annotation.type === "freehand" && annotation.points) {
        ctx.beginPath();
        if (annotation.points.length > 0) {
          ctx.moveTo(annotation.points[0].x, annotation.points[0].y);
          for (let i = 1; i < annotation.points.length; i++) {
            ctx.lineTo(annotation.points[i].x, annotation.points[i].y);
          }
        }
        ctx.stroke();
      } else if (annotation.type === "rectangle" && annotation.position) {
        ctx.strokeRect(annotation.position.x, annotation.position.y, annotation.position.width, annotation.position.height);
      } else if (annotation.type === "signature" && annotation.position) {
        // Draw signature placeholder
        ctx.fillStyle = annotation.color;
        ctx.font = "16px cursive";
        ctx.fillText("Signature", annotation.position.x + 10, annotation.position.y + 40);
        ctx.strokeRect(annotation.position.x, annotation.position.y, annotation.position.width, annotation.position.height);
      }
    });

    // Draw current annotation being drawn
    if (currentAnnotation && currentAnnotation.pageNumber === pageNumber) {
      ctx.strokeStyle = currentAnnotation.color;
      ctx.lineWidth = currentAnnotation.strokeWidth;
      ctx.lineJoin = "round";
      ctx.lineCap = "round";

      if (currentAnnotation.type === "freehand" && currentAnnotation.points) {
        ctx.beginPath();
        if (currentAnnotation.points.length > 0) {
          ctx.moveTo(currentAnnotation.points[0].x, currentAnnotation.points[0].y);
          for (let i = 1; i < currentAnnotation.points.length; i++) {
            ctx.lineTo(currentAnnotation.points[i].x, currentAnnotation.points[i].y);
          }
        }
        ctx.stroke();
      } else if (currentAnnotation.type === "rectangle" && currentAnnotation.position) {
        ctx.strokeRect(currentAnnotation.position.x, currentAnnotation.position.y, currentAnnotation.position.width, currentAnnotation.position.height);
      }
    }
  }, [annotations, currentAnnotation, pageNumber]);

  // Add a handler for text layer render errors
  const onPageRenderError = useCallback(
    (error: Error) => {
      // Ignore AbortException errors from TextLayer as they are expected during page changes
      if (error.message.includes("TextLayer") && error.message.includes("cancelled")) {
        // These errors are expected when changing pages quickly
        return;
      }

      console.error("Page render error:", error);
      setError(`Error rendering page ${pageNumber}: ${error.message}`);
    },
    [pageNumber]
  );

  const handleSaveAnnotations = async () => {
    if (onSaveAnnotations && annotations.length > 0) {
      try {
        await onSaveAnnotations(annotations);
        setHasUnsavedChanges(false);
      } catch (error) {
        console.error("Error saving annotations:", error);
        // Show error notification
      }
    }
  };

  const handleClearAnnotations = () => {
    if (readOnly) return;
    setAnnotations((prev) => prev.filter((anno) => anno.pageNumber !== pageNumber));
    setHasUnsavedChanges(true);
  };

  const handleAddSignature = () => {
    if (readOnly) return;
    setCurrentTool("signature");
    setSignatureMode(true);
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

  // Annotation toolbar
  const renderAnnotationTools = () => {
    if (!allowAnnotations && !allowSignature) return null;

    return (
      <div className={cn("absolute top-16 left-3 p-2 bg-card rounded-md border shadow-md z-20", activeToolTab !== "annotate" && "hidden md:block")}>
        <Tabs defaultValue="view" value={activeToolTab} onValueChange={setActiveToolTab} className="w-full">
          <TabsList className="mb-2">
            <TabsTrigger value="view" className="text-xs">
              <Hand className="h-4 w-4 mr-1" />
              View
            </TabsTrigger>
            {allowAnnotations && (
              <TabsTrigger value="annotate" className="text-xs">
                <PenLine className="h-4 w-4 mr-1" />
                Annotate
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="annotate" className="space-y-2">
            <div className="flex flex-col gap-2">
              <div className="grid grid-cols-2 gap-1">
                <Button variant={currentTool === "hand" ? "default" : "outline"} size="sm" onClick={() => setCurrentTool("hand")} className="h-8 flex items-center justify-center">
                  <Hand className="h-4 w-4" />
                  <span className="sr-only">Hand tool</span>
                </Button>
                <Button variant={currentTool === "pen" ? "default" : "outline"} size="sm" onClick={() => setCurrentTool("pen")} className="h-8 flex items-center justify-center">
                  <PenLine className="h-4 w-4" />
                  <span className="sr-only">Pen tool</span>
                </Button>
                <Button variant={currentTool === "rectangle" ? "default" : "outline"} size="sm" onClick={() => setCurrentTool("rectangle")} className="h-8 flex items-center justify-center">
                  <Square className="h-4 w-4" />
                  <span className="sr-only">Rectangle tool</span>
                </Button>
                {allowSignature && (
                  <Button
                    variant={currentTool === "signature" ? "default" : "outline"}
                    size="sm"
                    onClick={handleAddSignature}
                    className={cn("h-8 flex items-center justify-center", signatureMode && "bg-primary text-primary-foreground")}
                  >
                    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M4 12h16M4 12l3-3m-3 3l3 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      <path
                        d="M12 7s2-2 5-2 5 2.5 5 5.5c0 3-1 4-2 5.5L12 21c-3.5-3.5-7-6.5-7-10 0-2 1-4 3-4s4 2 4 4z"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    <span className="sr-only">Signature tool</span>
                  </Button>
                )}
              </div>

              <Separator className="my-1" />

              <div className="flex justify-between items-center">
                <Popover open={showColorPicker} onOpenChange={setShowColorPicker}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className="h-8 w-8 p-0 rounded-full" style={{ backgroundColor: strokeColor }}>
                      <span className="sr-only">Pick color</span>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-3">
                    <HexColorPicker color={strokeColor} onChange={setStrokeColor} />
                  </PopoverContent>
                </Popover>
                <div className="flex gap-1">
                  <ToggleGroup type="single" value={strokeWidth.toString()}>
                    {[1, 2, 4].map((width) => (
                      <ToggleGroupItem key={width} value={width.toString()} onClick={() => setStrokeWidth(width)} className="h-8 w-8">
                        <div
                          className="bg-current rounded-full mx-auto"
                          style={{
                            width: `${width * 2}px`,
                            height: `${width * 2}px`,
                          }}
                        />
                      </ToggleGroupItem>
                    ))}
                  </ToggleGroup>
                </div>
              </div>
            </div>

            <Separator className="my-1" />

            <div className="flex justify-between gap-1">
              <Button variant="destructive" size="sm" onClick={handleClearAnnotations} className="h-8 flex-1">
                <Eraser className="h-3 w-3 mr-1" />
                Clear
              </Button>
              <Button variant="default" size="sm" onClick={handleSaveAnnotations} className={cn("h-8 flex-1", !hasUnsavedChanges && "opacity-50")} disabled={!hasUnsavedChanges}>
                <Save className="h-3 w-3 mr-1" />
                Save
              </Button>
            </div>
          </TabsContent>
        </Tabs>
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
        <div ref={documentContainerRef} className={cn("flex-1 overflow-auto relative", isFullScreen ? "p-6" : "p-4")}>
          <div className="flex justify-center relative" ref={pdfContainerRef} onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}>
            {/* Annotation canvas overlay */}
            {(allowAnnotations || allowSignature) && (
              <canvas
                ref={annotationCanvasRef}
                className={cn(
                  "absolute top-0 left-0 right-0 bottom-0 z-10",
                  activeToolTab === "annotate"
                    ? currentTool === "hand"
                      ? "cursor-grab"
                      : currentTool === "pen"
                        ? "cursor-crosshair"
                        : currentTool === "rectangle"
                          ? "cursor-crosshair"
                          : currentTool === "signature" && signatureMode
                            ? "cursor-crosshair"
                            : "cursor-default"
                    : "pointer-events-none"
                )}
              />
            )}

            {/* Annotation tools */}
            {renderAnnotationTools()}

            {/* PDF Document */}
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
                    renderTextLayer={shouldRenderTextLayer}
                    renderAnnotationLayer={true}
                    onRenderSuccess={onPageRenderSuccess}
                    onRenderError={onPageRenderError}
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
