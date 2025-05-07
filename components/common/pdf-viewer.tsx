"use client";

import { Viewer, Worker, SpecialZoomLevel } from "@react-pdf-viewer/core";
import { defaultLayoutPlugin } from "@react-pdf-viewer/default-layout";

// Import styles for the viewer and default layout
import "@react-pdf-viewer/core/lib/styles/index.css";
import "@react-pdf-viewer/default-layout/lib/styles/index.css";

interface PDFViewerProps {
  pdfData: Uint8Array;
}

export function PDFViewer({ pdfData }: PDFViewerProps) {
  const defaultLayoutPluginInstance = defaultLayoutPlugin();

  // The Viewer component can accept a Uint8Array directly for fileUrl.

  return (
    <Worker workerUrl="/pdf.worker.min.js">
      <div className="h-full w-full">
        <Viewer
          fileUrl={pdfData}
          plugins={[defaultLayoutPluginInstance]}
          defaultScale={SpecialZoomLevel.PageFit}
        />
      </div>
    </Worker>
  );
}
