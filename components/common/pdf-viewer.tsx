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
  // Configure the default layout plugin to hide theme mode switcher and open file buttons
  const defaultLayoutPluginInstance = defaultLayoutPlugin({
    sidebarTabs: (defaultTabs) => defaultTabs,
    renderToolbar: (Toolbar) => (
      <Toolbar>
        {(slots) => {
          const { CurrentPageInput, Download, EnterFullScreen, GoToNextPage, GoToPreviousPage, NumberOfPages, Print, Zoom, ZoomIn, ZoomOut } = slots;

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

  return (
    <Worker workerUrl="/pdf.worker.min.js">
      <div className="h-full w-full">
        <Viewer fileUrl={pdfData} plugins={[defaultLayoutPluginInstance]} defaultScale={SpecialZoomLevel.PageFit} />
      </div>
    </Worker>
  );
}
