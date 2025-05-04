"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  ZoomIn,
  ZoomOut,
  RotateCw,
  ChevronLeft,
  ChevronRight,
  Loader2,
  AlertCircle,
  Maximize,
  Minimize,
  Book,
  PanelLeft,
  PanelRight,
  PenLine,
  Hand,
  Eraser,
  Save,
  Square,
  Image,
  Download,
  Highlighter,
  Type,
  Circle,
  ArrowRight,
  Trash2,
} from "lucide-react";
import { pdfjs, Document as PDFDocument, Page } from "react-pdf";
import "react-pdf/dist/esm/Page/AnnotationLayer.css";
import "react-pdf/dist/esm/Page/TextLayer.css";
import { HexColorPicker } from "react-colorful";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import SignatureCanvas from "react-signature-canvas";
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Initialize PDF.js worker
if (typeof window !== "undefined" && !pdfjs.GlobalWorkerOptions.workerSrc) {
  pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
}

// Export the props interface for use in single-document.tsx
export interface PDFViewerProps {
  pdfData: ArrayBuffer | null;
  allowAnnotations?: boolean;
  allowSignature?: boolean;
  onSaveAnnotations?: (annotations: PdfAnnotation[]) => Promise<void>;
  readOnly?: boolean;
  onPageChange?: (pageNumber: number) => void;
  onDocumentLoad?: ({ numPages }: { numPages: number }) => void;
}

// Define annotation types
export type PdfAnnotation = {
  id: string;
  type: "freehand" | "signature" | "text" | "highlight" | "rectangle" | "circle" | "arrow" | "stamp" | "image" | "checkbox" | "radio" | "date" | "initial";
  points?: { x: number; y: number }[];
  pageNumber: number;
  color: string;
  strokeWidth: number;
  content?: string;
  position?: { x: number; y: number; width: number; height: number };
  imageData?: string; // Base64 encoded image for signatures
  opacity?: number; // For highlights and other semi-transparent elements
  fontSize?: number; // For text annotations
  fontFamily?: string; // For text annotations
  required?: boolean; // For form fields to mark as required
  fieldName?: string; // For form fields identification
  fieldValue?: string | boolean | Date; // For form fields data
  fieldOptions?: string[]; // For dropdown/radio options
  createdAt: Date;
  modifiedAt: Date;
  author?: string; // Person who created the annotation
  status?: "pending" | "completed" | "rejected"; // Used for approval workflows
  comment?: string; // Optional comment related to the annotation
};

export default function PDFViewer({ pdfData, allowAnnotations = false, allowSignature = false, onSaveAnnotations, readOnly = true, onPageChange, onDocumentLoad }: PDFViewerProps) {
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
  const signatureCanvasRef = useRef<SignatureCanvas>(null);

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
  const [annotationColor, setAnnotationColor] = useState<string>("#FF0000");
  const [lineWidth, setLineWidth] = useState<number>(2);
  const [opacity, setOpacity] = useState<number>(1);
  const [fontSize, setFontSize] = useState<number>(14);

  // Signature dialog state
  const [showSignatureDialog, setShowSignatureDialog] = useState<boolean>(false);
  const [signatureType, setSignatureType] = useState<"draw" | "type">("draw");
  const [typedSignature, setTypedSignature] = useState<string>("");
  const [signatureFont, setSignatureFont] = useState<string>("Dancing Script");

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

  // Load saved annotations from local storage if available
  useEffect(() => {
    const loadSavedAnnotations = () => {
      try {
        const savedAnnotationsString = localStorage.getItem("pdf-annotations");
        if (savedAnnotationsString) {
          const savedAnnotations = JSON.parse(savedAnnotationsString);
          setAnnotations(savedAnnotations);
          setHasUnsavedChanges(false);
        }
      } catch (error) {
        console.error("Error loading saved annotations:", error);
      }
    };

    if (!readOnly && allowAnnotations) {
      loadSavedAnnotations();
    }
  }, [readOnly, allowAnnotations]);

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
        color: annotationColor,
        strokeWidth: lineWidth,
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
        color: annotationColor,
        strokeWidth: lineWidth,
        position: { x, y, width: 0, height: 0 },
        createdAt: new Date(),
        modifiedAt: new Date(),
      };
      setCurrentAnnotation(newAnnotation);
    } else if (currentTool === "circle") {
      // Start a new circle annotation
      const newAnnotation: PdfAnnotation = {
        id: `annotation-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        type: "circle",
        pageNumber,
        color: annotationColor,
        strokeWidth: lineWidth,
        position: { x, y, width: 0, height: 0 },
        createdAt: new Date(),
        modifiedAt: new Date(),
      };
      setCurrentAnnotation(newAnnotation);
    } else if (currentTool === "arrow") {
      // Start a new arrow annotation
      const newAnnotation: PdfAnnotation = {
        id: `annotation-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        type: "arrow",
        pageNumber,
        color: annotationColor,
        strokeWidth: lineWidth,
        points: [
          { x, y },
          { x, y },
        ], // Start and end points (initially the same)
        createdAt: new Date(),
        modifiedAt: new Date(),
      };
      setCurrentAnnotation(newAnnotation);
    } else if (currentTool === "highlight") {
      // Start a new highlight annotation
      const newAnnotation: PdfAnnotation = {
        id: `annotation-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        type: "highlight",
        points: [{ x, y }],
        pageNumber,
        color: annotationColor,
        strokeWidth: lineWidth * 2, // Wider for highlights
        opacity: opacity,
        createdAt: new Date(),
        modifiedAt: new Date(),
      };
      setCurrentAnnotation(newAnnotation);
    } else if (currentTool === "text") {
      // Create a text annotation at click position
      const textContent = "";
      const newAnnotation: PdfAnnotation = {
        id: `annotation-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        type: "text",
        pageNumber,
        color: annotationColor,
        strokeWidth: lineWidth,
        content: textContent,
        fontSize: fontSize,
        fontFamily: "Arial",
        position: { x, y, width: 150, height: 40 },
        createdAt: new Date(),
        modifiedAt: new Date(),
      };
      setCurrentAnnotation(newAnnotation);
      setIsDrawing(false); // Not dragging for text
      setAnnotations((prev) => [...prev, newAnnotation]);
    } else if (currentTool === "checkbox") {
      // Create a checkbox form field
      const newAnnotation: PdfAnnotation = {
        id: `checkbox-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        type: "checkbox",
        pageNumber,
        color: annotationColor,
        strokeWidth: lineWidth,
        position: { x, y, width: 24, height: 24 },
        fieldName: `Checkbox_${Date.now()}`,
        fieldValue: false,
        required: false,
        createdAt: new Date(),
        modifiedAt: new Date(),
      };
      setCurrentAnnotation(newAnnotation);
      setIsDrawing(false); // Not dragging for form fields
      setAnnotations((prev) => [...prev, newAnnotation]);
    } else if (currentTool === "radio") {
      // Create a radio button form field
      const newAnnotation: PdfAnnotation = {
        id: `radio-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        type: "radio",
        pageNumber,
        color: annotationColor,
        strokeWidth: lineWidth,
        position: { x, y, width: 24, height: 24 },
        fieldName: `RadioGroup_${Date.now()}`,
        fieldValue: false,
        fieldOptions: ["Option 1"],
        required: false,
        createdAt: new Date(),
        modifiedAt: new Date(),
      };
      setCurrentAnnotation(newAnnotation);
      setIsDrawing(false);
      setAnnotations((prev) => [...prev, newAnnotation]);
    } else if (currentTool === "date") {
      // Create a date field
      const newAnnotation: PdfAnnotation = {
        id: `date-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        type: "date",
        pageNumber,
        color: annotationColor,
        strokeWidth: lineWidth,
        position: { x, y, width: 150, height: 30 },
        fieldName: `Date_${Date.now()}`,
        fieldValue: new Date(),
        required: false,
        createdAt: new Date(),
        modifiedAt: new Date(),
      };
      setCurrentAnnotation(newAnnotation);
      setIsDrawing(false);
      setAnnotations((prev) => [...prev, newAnnotation]);
    } else if (currentTool === "signature" && signatureMode) {
      // Show signature dialog
      setShowSignatureDialog(true);
      setIsDrawing(false);
      // Save the position for later
      setCurrentAnnotation({
        id: `signature-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        type: "signature",
        pageNumber,
        color: strokeColor,
        strokeWidth,
        position: { x, y, width: 200, height: 80 },
        fieldName: `Signature_${Date.now()}`,
        required: true,
        createdAt: new Date(),
        modifiedAt: new Date(),
      });
    } else if (currentTool === "initial") {
      // Show initial dialog (similar to signature but smaller)
      setIsDrawing(false);
      // Save the position for later
      setCurrentAnnotation({
        id: `initial-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        type: "initial",
        pageNumber,
        color: strokeColor,
        strokeWidth,
        position: { x, y, width: 100, height: 60 },
        fieldName: `Initial_${Date.now()}`,
        required: false,
        createdAt: new Date(),
        modifiedAt: new Date(),
      });
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
    } else if (currentTool === "highlight" && currentAnnotation.points) {
      // Continue drawing highlight
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
    } else if (currentTool === "circle" && currentAnnotation.position) {
      // Update circle dimensions
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
    } else if (currentTool === "arrow" && currentAnnotation.points) {
      // Update arrow end point
      setCurrentAnnotation({
        ...currentAnnotation,
        points: [currentAnnotation.points[0], { x, y }],
        modifiedAt: new Date(),
      });
    }
  };

  const handleMouseUp = () => {
    if (isDrawing && currentAnnotation && !readOnly && activeToolTab === "annotate") {
      if (currentTool !== "signature") {
        setAnnotations((prev) => [...prev, currentAnnotation]);
        setCurrentAnnotation(null);
        setIsDrawing(false);
        setHasUnsavedChanges(true);
      }
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

    // Helper function to draw arrow
    const drawArrow = (fromX: number, fromY: number, toX: number, toY: number, color: string, lineWidth: number) => {
      const headLength = 15; // Length of arrow head in pixels
      const angle = Math.atan2(toY - fromY, toX - fromX);

      // Draw the main line
      ctx.beginPath();
      ctx.moveTo(fromX, fromY);
      ctx.lineTo(toX, toY);
      ctx.strokeStyle = color;
      ctx.lineWidth = lineWidth;
      ctx.stroke();

      // Draw the arrow head
      ctx.beginPath();
      ctx.moveTo(toX, toY);
      ctx.lineTo(toX - headLength * Math.cos(angle - Math.PI / 6), toY - headLength * Math.sin(angle - Math.PI / 6));
      ctx.lineTo(toX - headLength * Math.cos(angle + Math.PI / 6), toY - headLength * Math.sin(angle + Math.PI / 6));
      ctx.closePath();
      ctx.fillStyle = color;
      ctx.fill();
    };

    // Draw existing annotations for current page
    const pageAnnotations = annotations.filter((anno) => anno.pageNumber === pageNumber);
    pageAnnotations.forEach((annotation) => {
      ctx.strokeStyle = annotation.color;
      ctx.lineWidth = annotation.strokeWidth || 2;
      ctx.lineJoin = "round";
      ctx.lineCap = "round";

      if (annotation.type === "freehand" && annotation.points && annotation.points.length > 0) {
        ctx.beginPath();
        ctx.moveTo(annotation.points[0].x, annotation.points[0].y);
        for (let i = 1; i < annotation.points.length; i++) {
          ctx.lineTo(annotation.points[i].x, annotation.points[i].y);
        }
        ctx.stroke();
      } else if (annotation.type === "highlight" && annotation.points && annotation.points.length > 0) {
        // Set highlight style - semi-transparent
        ctx.globalAlpha = annotation.opacity || 0.5;
        ctx.beginPath();
        ctx.moveTo(annotation.points[0].x, annotation.points[0].y);
        for (let i = 1; i < annotation.points.length; i++) {
          ctx.lineTo(annotation.points[i].x, annotation.points[i].y);
        }
        ctx.stroke();
        ctx.globalAlpha = 1.0; // Reset opacity
      } else if (annotation.type === "rectangle" && annotation.position) {
        ctx.strokeRect(annotation.position.x, annotation.position.y, annotation.position.width, annotation.position.height);
      } else if (annotation.type === "circle" && annotation.position) {
        // Draw ellipse/circle
        const centerX = annotation.position.x + annotation.position.width / 2;
        const centerY = annotation.position.y + annotation.position.height / 2;
        const radiusX = Math.abs(annotation.position.width / 2);
        const radiusY = Math.abs(annotation.position.height / 2);

        ctx.beginPath();
        ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, 2 * Math.PI);
        ctx.stroke();
      } else if (annotation.type === "arrow" && annotation.points && annotation.points.length >= 2) {
        const [start, end] = annotation.points;
        drawArrow(start.x, start.y, end.x, end.y, annotation.color, annotation.strokeWidth);
      } else if (annotation.type === "text" && annotation.position && annotation.content !== undefined) {
        // Draw text annotation
        const fontSize = annotation.fontSize || 14;
        const fontFamily = annotation.fontFamily || "Arial";
        ctx.font = `${fontSize}px ${fontFamily}`;
        ctx.fillStyle = annotation.color;

        // Draw text box background for visibility
        ctx.fillStyle = "#ffffff80"; // Semi-transparent white
        ctx.fillRect(annotation.position.x, annotation.position.y, annotation.position.width, annotation.position.height);

        // Draw border
        ctx.strokeStyle = "#cccccc";
        ctx.lineWidth = 1;
        ctx.strokeRect(annotation.position.x, annotation.position.y, annotation.position.width, annotation.position.height);

        // Draw text
        ctx.fillStyle = annotation.color;
        ctx.fillText(annotation.content, annotation.position.x + 5, annotation.position.y + fontSize + 2);
      } else if (annotation.type === "checkbox" && annotation.position) {
        // Draw checkbox
        ctx.strokeRect(annotation.position.x, annotation.position.y, annotation.position.width, annotation.position.height);

        // If checked, draw check mark
        if (annotation.fieldValue === true) {
          ctx.beginPath();
          ctx.moveTo(annotation.position.x + 5, annotation.position.y + annotation.position.height / 2);
          ctx.lineTo(annotation.position.x + annotation.position.width / 3, annotation.position.y + annotation.position.height - 5);
          ctx.lineTo(annotation.position.x + annotation.position.width - 5, annotation.position.y + 5);
          ctx.stroke();
        }
      } else if (annotation.type === "radio" && annotation.position) {
        // Draw radio button (circle)
        ctx.beginPath();
        const centerX = annotation.position.x + annotation.position.width / 2;
        const centerY = annotation.position.y + annotation.position.height / 2;
        const radius = annotation.position.width / 2;
        ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
        ctx.stroke();

        // If selected, fill inner circle
        if (annotation.fieldValue === true) {
          ctx.beginPath();
          ctx.arc(centerX, centerY, radius / 2, 0, 2 * Math.PI);
          ctx.fillStyle = annotation.color;
          ctx.fill();
        }
      } else if (annotation.type === "date" && annotation.position) {
        // Draw date field
        ctx.strokeRect(annotation.position.x, annotation.position.y, annotation.position.width, annotation.position.height);
        ctx.fillStyle = "#ffffff80";
        ctx.fillRect(annotation.position.x, annotation.position.y, annotation.position.width, annotation.position.height);

        // Show date if available
        ctx.fillStyle = annotation.color;
        ctx.font = "12px Arial";
        if (annotation.fieldValue) {
          // Fix the Date constructor issue by ensuring we pass a valid date argument
          const date =
            annotation.fieldValue instanceof Date
              ? annotation.fieldValue
              : typeof annotation.fieldValue === "string" || typeof annotation.fieldValue === "number"
                ? new Date(annotation.fieldValue)
                : new Date();
          const dateStr = date.toLocaleDateString();
          ctx.fillText(dateStr, annotation.position.x + 5, annotation.position.y + 18);
        } else {
          ctx.fillText("DD / MM / YYYY", annotation.position.x + 5, annotation.position.y + 18);
        }
      } else if ((annotation.type === "signature" || annotation.type === "initial") && annotation.position) {
        if (annotation.imageData) {
          // Draw signature from image data
          const img = document.createElement('img'); // Use createElement instead of new Image()
          img.onload = () => {
            if (annotation.position) {
              ctx.drawImage(img, annotation.position.x, annotation.position.y, annotation.position.width, annotation.position.height);
            }
          };
          img.src = annotation.imageData;
        } else {
          // Draw signature/initial placeholder
          ctx.fillStyle = annotation.color;
          ctx.strokeStyle = "#cccccc";
          ctx.lineWidth = 1;
          ctx.strokeRect(annotation.position.x, annotation.position.y, annotation.position.width, annotation.position.height);
          ctx.font = annotation.type === "signature" ? "16px Arial" : "12px Arial";

          // Cross pattern for placeholder
          ctx.beginPath();
          ctx.moveTo(annotation.position.x, annotation.position.y);
          ctx.lineTo(annotation.position.x + annotation.position.width, annotation.position.y + annotation.position.height);
          ctx.stroke();

          ctx.beginPath();
          ctx.moveTo(annotation.position.x + annotation.position.width, annotation.position.y);
          ctx.lineTo(annotation.position.x, annotation.position.y + annotation.position.height);
          ctx.stroke();

          const text = annotation.type === "signature" ? "Signature" : "Initial";
          ctx.fillText(text, annotation.position.x + annotation.position.width / 2 - 25, annotation.position.y + annotation.position.height / 2 + 5);

          // Show required marker if needed
          if (annotation.required) {
            ctx.fillStyle = "#f43f5e";
            ctx.fillText("*", annotation.position.x + annotation.position.width - 10, annotation.position.y + 12);
          }
        }
      }
    });

    // Draw current annotation being drawn
    if (currentAnnotation && currentAnnotation.pageNumber === pageNumber) {
      ctx.strokeStyle = currentAnnotation.color;
      ctx.lineWidth = currentAnnotation.strokeWidth || 2;
      ctx.lineJoin = "round";
      ctx.lineCap = "round";

      if (currentAnnotation.type === "freehand" && currentAnnotation.points && currentAnnotation.points.length > 0) {
        ctx.beginPath();
        ctx.moveTo(currentAnnotation.points[0].x, currentAnnotation.points[0].y);
        for (let i = 1; i < currentAnnotation.points.length; i++) {
          ctx.lineTo(currentAnnotation.points[i].x, currentAnnotation.points[i].y);
        }
        ctx.stroke();
      } else if (currentAnnotation.type === "highlight" && currentAnnotation.points && currentAnnotation.points.length > 0) {
        ctx.globalAlpha = currentAnnotation.opacity || 0.5;
        ctx.beginPath();
        ctx.moveTo(currentAnnotation.points[0].x, currentAnnotation.points[0].y);
        for (let i = 1; i < currentAnnotation.points.length; i++) {
          ctx.lineTo(currentAnnotation.points[i].x, currentAnnotation.points[i].y);
        }
        ctx.stroke();
        ctx.globalAlpha = 1.0; // Reset opacity
      } else if (currentAnnotation.type === "rectangle" && currentAnnotation.position) {
        ctx.strokeRect(currentAnnotation.position.x, currentAnnotation.position.y, currentAnnotation.position.width, currentAnnotation.position.height);
      } else if (currentAnnotation.type === "circle" && currentAnnotation.position) {
        // Draw circle/ellipse
        const centerX = currentAnnotation.position.x + currentAnnotation.position.width / 2;
        const centerY = currentAnnotation.position.y + currentAnnotation.position.height / 2;
        const radiusX = Math.abs(currentAnnotation.position.width / 2);
        const radiusY = Math.abs(currentAnnotation.position.height / 2);

        ctx.beginPath();
        ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, 2 * Math.PI);
        ctx.stroke();
      } else if (currentAnnotation.type === "arrow" && currentAnnotation.points && currentAnnotation.points.length >= 2) {
        const [start, end] = currentAnnotation.points;
        drawArrow(start.x, start.y, end.x, end.y, currentAnnotation.color, currentAnnotation.strokeWidth);
      }
    }
  }, [annotations, currentAnnotation, pageNumber]);

  // Create and add signature to PDF
  const addSignatureToPdf = (signatureDataUrl: string) => {
    if (!currentAnnotation || !currentAnnotation.position) return;

    const newSignature: PdfAnnotation = {
      ...currentAnnotation,
      type: "signature",
      imageData: signatureDataUrl,
      modifiedAt: new Date(),
    };

    setAnnotations((prev) => [...prev, newSignature]);
    setHasUnsavedChanges(true);
    setSignatureMode(false);
    setShowSignatureDialog(false);
    setCurrentAnnotation(null);
  };

  // Handle signature creation
  const handleCreateSignature = () => {
    if (signatureType === "draw") {
      if (signatureCanvasRef.current && !signatureCanvasRef.current.isEmpty()) {
        const dataUrl = signatureCanvasRef.current.toDataURL("image/png");
        addSignatureToPdf(dataUrl);
      }
    } else {
      // Create typed signature
      const canvas = document.createElement("canvas");
      canvas.width = 600;
      canvas.height = 200;
      const ctx = canvas.getContext("2d");

      if (ctx) {
        ctx.fillStyle = "transparent";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Use selected font
        ctx.font = `48px ${signatureFont}`;
        ctx.fillStyle = strokeColor;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(typedSignature, canvas.width / 2, canvas.height / 2);

        const dataUrl = canvas.toDataURL("image/png");
        addSignatureToPdf(dataUrl);
      }
    }
  };

  // Clear signature pad
  const clearSignature = () => {
    if (signatureCanvasRef.current) {
      signatureCanvasRef.current.clear();
    }
  };

  const handleSaveAnnotations = async () => {
    if (onSaveAnnotations && annotations.length > 0) {
      try {
        await onSaveAnnotations(annotations);
        setHasUnsavedChanges(false);

        // Also save to local storage as backup
        localStorage.setItem("pdf-annotations", JSON.stringify(annotations));
      } catch (error) {
        console.error("Error saving annotations:", error);
        // Show error notification
      }
    } else if (annotations.length > 0) {
      // If no external save handler, at least save to local storage
      localStorage.setItem("pdf-annotations", JSON.stringify(annotations));
      setHasUnsavedChanges(false);
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

  // Download annotated PDF
  const handleDownloadPdf = async () => {
    if (!pdfBlob) return;

    try {
      // For now, just download the original PDF
      // In a real implementation, you would merge annotations with PDF
      const url = URL.createObjectURL(pdfBlob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "annotated-document.pdf";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading PDF:", error);
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
              <div className="grid grid-cols-4 gap-1">
                <Button variant={currentTool === "hand" ? "default" : "outline"} size="sm" onClick={() => setCurrentTool("hand")} className="h-8 flex items-center justify-center">
                  <Hand className="h-4 w-4" />
                  <span className="sr-only">Hand tool</span>
                </Button>
                <Button variant={currentTool === "pen" ? "default" : "outline"} size="sm" onClick={() => setCurrentTool("pen")} className="h-8 flex items-center justify-center">
                  <PenLine className="h-4 w-4" />
                  <span className="sr-only">Pen tool</span>
                </Button>
                <Button variant={currentTool === "highlight" ? "default" : "outline"} size="sm" onClick={() => setCurrentTool("highlight")} className="h-8 flex items-center justify-center">
                  <Highlighter className="h-4 w-4" />
                  <span className="sr-only">Highlighter</span>
                </Button>
                <Button variant={currentTool === "eraser" ? "default" : "outline"} size="sm" onClick={() => setCurrentTool("eraser")} className="h-8 flex items-center justify-center">
                  <Eraser className="h-4 w-4" />
                  <span className="sr-only">Eraser tool</span>
                </Button>
                <Button variant={currentTool === "text" ? "default" : "outline"} size="sm" onClick={() => setCurrentTool("text")} className="h-8 flex items-center justify-center">
                  <Type className="h-4 w-4" />
                  <span className="sr-only">Text tool</span>
                </Button>
                <Button variant={currentTool === "rectangle" ? "default" : "outline"} size="sm" onClick={() => setCurrentTool("rectangle")} className="h-8 flex items-center justify-center">
                  <Square className="h-4 w-4" />
                  <span className="sr-only">Rectangle tool</span>
                </Button>
                <Button variant={currentTool === "ellipse" ? "default" : "outline"} size="sm" onClick={() => setCurrentTool("circle")} className="h-8 flex items-center justify-center">
                  <Circle className="h-4 w-4" />
                  <span className="sr-only">Ellipse tool</span>
                </Button>
                <Button variant={currentTool === "arrow" ? "default" : "outline"} size="sm" onClick={() => setCurrentTool("arrow")} className="h-8 flex items-center justify-center">
                  <ArrowRight className="h-4 w-4" />
                  <span className="sr-only">Arrow tool</span>
                </Button>
              </div>

              {/* Tool option controls */}
              <div className="flex flex-wrap gap-2 p-2 border rounded-md">
                {currentTool !== "hand" && currentTool !== "eraser" && (
                  <div className="flex items-center gap-2">
                    <Label htmlFor="stroke-color" className="text-xs whitespace-nowrap">
                      Color
                    </Label>
                    <div className="relative">
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" size="sm" className="h-7 w-7 p-0">
                            <div className="w-5 h-5 rounded border" style={{ backgroundColor: annotationColor }} />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-2">
                          <HexColorPicker color={annotationColor} onChange={setAnnotationColor} />
                          <div className="grid grid-cols-8 gap-1 mt-2">
                            {["#000000", "#FF0000", "#00FF00", "#0000FF", "#FFFF00", "#FF00FF", "#00FFFF", "#FF9900"].map((color) => (
                              <div key={color} className="w-5 h-5 rounded border cursor-pointer" style={{ backgroundColor: color }} onClick={() => setAnnotationColor(color)} />
                            ))}
                          </div>
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>
                )}

                {(currentTool === "pen" || currentTool === "highlight") && (
                  <div className="flex items-center gap-2">
                    <Label htmlFor="stroke-width" className="text-xs whitespace-nowrap">
                      Width
                    </Label>
                    <Select value={lineWidth.toString()} onValueChange={(value) => setLineWidth(parseInt(value))}>
                      <SelectTrigger id="stroke-width" className="h-7 w-16">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1px</SelectItem>
                        <SelectItem value="2">2px</SelectItem>
                        <SelectItem value="3">3px</SelectItem>
                        <SelectItem value="5">5px</SelectItem>
                        <SelectItem value="8">8px</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {currentTool === "highlight" && (
                  <div className="flex items-center gap-2">
                    <Label htmlFor="opacity" className="text-xs whitespace-nowrap">
                      Opacity
                    </Label>
                    <Select value={opacity.toString()} onValueChange={(value) => setOpacity(parseFloat(value))}>
                      <SelectTrigger id="opacity" className="h-7 w-16">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0.2">20%</SelectItem>
                        <SelectItem value="0.4">40%</SelectItem>
                        <SelectItem value="0.6">60%</SelectItem>
                        <SelectItem value="0.8">80%</SelectItem>
                        <SelectItem value="1.0">100%</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {currentTool === "text" && (
                  <div className="flex items-center gap-2">
                    <Label htmlFor="font-size" className="text-xs whitespace-nowrap">
                      Size
                    </Label>
                    <Select value={fontSize.toString()} onValueChange={(value) => setFontSize(parseInt(value))}>
                      <SelectTrigger id="font-size" className="h-7 w-16">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="12">12px</SelectItem>
                        <SelectItem value="14">14px</SelectItem>
                        <SelectItem value="16">16px</SelectItem>
                        <SelectItem value="18">18px</SelectItem>
                        <SelectItem value="24">24px</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              {/* Annotation actions */}
              <div className="flex justify-between">
                <Button size="sm" variant="outline" className="text-xs gap-1" onClick={handleClearAnnotations}>
                  <Trash2 className="h-3 w-3" /> Clear All
                </Button>
                <Button size="sm" variant="outline" className="text-xs gap-1" onClick={handleSaveAnnotations}>
                  <Save className="h-3 w-3" /> Save
                </Button>
              </div>
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

      {/* Signature Dialog */}
      <Dialog open={showSignatureDialog} onOpenChange={setShowSignatureDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Signature</DialogTitle>
            <DialogDescription>Draw your signature or type it</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <Tabs defaultValue="draw" value={signatureType} onValueChange={(v) => setSignatureType(v as "draw" | "type")}>
              <TabsList className="grid grid-cols-2">
                <TabsTrigger value="draw">Draw</TabsTrigger>
                <TabsTrigger value="type">Type</TabsTrigger>
              </TabsList>
              <TabsContent value="draw" className="mt-4">
                <div className="border rounded-md bg-white p-2">
                  <SignatureCanvas
                    ref={signatureCanvasRef}
                    penColor={strokeColor}
                    canvasProps={{
                      className: "signature-canvas border border-dashed rounded w-full",
                      width: 500,
                      height: 200,
                      style: { width: "100%", height: 200 },
                    }}
                  />
                </div>
                <Button variant="outline" size="sm" onClick={clearSignature} className="mt-2">
                  Clear
                </Button>
              </TabsContent>
              <TabsContent value="type" className="mt-4 space-y-4">
                <div className="space-y-2">
                  <Label>Your Signature</Label>
                  <Input
                    value={typedSignature}
                    onChange={(e) => setTypedSignature(e.target.value)}
                    placeholder="Type your name here"
                    className={`text-xl ${signatureFont}`}
                    style={{ color: strokeColor, fontFamily: signatureFont }}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Choose Font</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {["Dancing Script", "Pacifico", "Satisfy"].map((font) => (
                      <Button key={font} variant={signatureFont === font ? "default" : "outline"} className="h-10 text-sm" onClick={() => setSignatureFont(font)}>
                        <span style={{ fontFamily: font }}>{font}</span>
                      </Button>
                    ))}
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSignatureDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateSignature} disabled={(signatureType === "draw" && signatureCanvasRef.current?.isEmpty()) || (signatureType === "type" && !typedSignature.trim())}>
              Add Signature
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
