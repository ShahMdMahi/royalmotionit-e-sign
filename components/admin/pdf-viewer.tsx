"use client";

import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { ZoomIn, ZoomOut, RotateCw, ChevronLeft, ChevronRight, Loader2, AlertCircle } from "lucide-react";
import { pdfjs, Document as PDFDocument, Page } from "react-pdf";
import "react-pdf/dist/esm/Page/AnnotationLayer.css";
import "react-pdf/dist/esm/Page/TextLayer.css";

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
  }, [pdfData]);

  // PDF document loaded successfully
  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setPageNumber(1);
    setIsLoading(false);
  };

  // PDF document failed to load
  const onDocumentLoadError = (err: Error) => {
    console.error("PDF load error:", err);
    setError(err.message || "Failed to render PDF");
    setIsLoading(false);
  };

  // Pagination controls
  const goToPrevPage = () => {
    setPageNumber((prev) => Math.max(prev - 1, 1));
  };

  const goToNextPage = () => {
    setPageNumber((prev) => Math.min(prev + 1, numPages || 1));
  };

  // Zoom controls
  const zoomIn = () => {
    setScale((prev) => Math.min(prev + 0.2, 3));
  };

  const zoomOut = () => {
    setScale((prev) => Math.max(prev - 0.2, 0.5));
  };

  // Rotation control
  const rotateClockwise = () => {
    setRotation((prev) => (prev + 90) % 360);
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
    <div className="w-full h-full flex flex-col">
      {/* Controls */}
      <div className="flex items-center justify-between flex-wrap gap-2 mb-4 p-4">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={goToPrevPage} disabled={pageNumber <= 1 || isLoading || !!error}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm">
            {pageNumber} / {numPages || "?"}
          </span>
          <Button variant="outline" size="sm" onClick={goToNextPage} disabled={!numPages || pageNumber >= numPages || isLoading || !!error}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={zoomOut} disabled={scale <= 0.5 || isLoading || !!error}>
            <ZoomOut className="h-4 w-4" />
          </Button>
          <span className="text-sm w-12 text-center">{Math.round(scale * 100)}%</span>
          <Button variant="outline" size="sm" onClick={zoomIn} disabled={scale >= 3 || isLoading || !!error}>
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={rotateClockwise} disabled={isLoading || !!error}>
            <RotateCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* PDF Document */}
      <div className="flex-1 flex justify-center overflow-auto p-4">
        <div className="relative">
          {pdfBlob && (
            <PDFDocument
              file={pdfBlob}
              onLoadSuccess={onDocumentLoadSuccess}
              onLoadError={onDocumentLoadError}
              loading={
                <div className="flex items-center justify-center min-h-[400px]">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              }
              error={
                <div className="flex flex-col items-center justify-center min-h-[400px] p-4">
                  <AlertCircle className="h-8 w-8 text-destructive mb-2" />
                  <p className="text-sm text-destructive">Failed to render PDF</p>
                </div>
              }
              externalLinkTarget="_blank"
              className="pdf-document"
              options={pdfOptions}
            >
              <Page
                pageNumber={pageNumber}
                scale={scale}
                rotate={rotation}
                className="shadow-sm"
                renderTextLayer={true}
                renderAnnotationLayer={true}
                loading={
                  <div className="flex items-center justify-center min-h-[400px] min-w-[300px]">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                }
                error={
                  <div className="flex flex-col items-center justify-center min-h-[400px] min-w-[300px] p-4">
                    <AlertCircle className="h-8 w-8 text-destructive mb-2" />
                    <p className="text-sm text-destructive">Failed to render page {pageNumber}</p>
                  </div>
                }
              />
            </PDFDocument>
          )}
        </div>
      </div>

      {/* Error display */}
      {error && (
        <div className="p-4 bg-destructive/10 rounded-md mt-4 mx-4">
          <p className="text-sm text-destructive font-medium">Error loading PDF: {error}</p>
        </div>
      )}
    </div>
  );
}
