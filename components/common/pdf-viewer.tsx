"use client";

import { Viewer, Worker, SpecialZoomLevel } from "@react-pdf-viewer/core";
import { defaultLayoutPlugin } from "@react-pdf-viewer/default-layout";

// Import styles for the viewer and default layout
import "@react-pdf-viewer/core/lib/styles/index.css";
import "@react-pdf-viewer/default-layout/lib/styles/index.css";

interface PDFViewerProps {
  pdfData: Uint8Array; // Expecting a Uint8Array
}

export function PDFViewer({ pdfData }: PDFViewerProps) {
  const defaultLayoutPluginInstance = defaultLayoutPlugin();

  // The Viewer component can accept a Uint8Array directly for fileUrl.

  return (
    // The Worker component is essential for pdf.js to work.
    // It points to the worker file that should be available in your public directory.
    <Worker workerUrl="/pdf.worker.min.js">
      {" "}
      {/* Corrected extension to .js */}
      <div className="h-full w-full">
        <Viewer
          fileUrl={pdfData} // Pass the Uint8Array directly
          plugins={[defaultLayoutPluginInstance]}
          defaultScale={SpecialZoomLevel.PageFit} // Default zoom level
        />
      </div>
    </Worker>
  );
}
