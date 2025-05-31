"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import { DocumentField } from "@/types/document";

interface FieldsOverlayContainerProps {
  fields: DocumentField[];
  currentPage?: number; // Made optional since it's not being used
  renderFieldAction: (field: DocumentField) => React.ReactNode;
  debug?: boolean;
  viewerContainerRef: React.RefObject<HTMLDivElement | null>;
}

/**
 * A container that positions fields correctly on PDF pages,
 * making them stick to their associated page even during scrolling.
 */
export function FieldsOverlayContainer({
  fields,
  renderFieldAction,
  debug = false,
  viewerContainerRef,
}: FieldsOverlayContainerProps) {
  const [pageElements, setPageElements] = useState<HTMLElement[]>([]);

  // Use a mutation observer to track changes to the PDF viewer's DOM more efficiently
  useEffect(() => {
    if (!viewerContainerRef.current) return;

    // Debounce timer for page updates
    let updateTimer: ReturnType<typeof setTimeout> | null = null;

    // Get current pages with optimized selection
    const updatePageElements = () => {
      if (!viewerContainerRef.current) return;

      // Get all page layers - each page is in its own layer
      // Use a more specific selector to avoid unnecessary DOM traversal
      const pagesContainer = viewerContainerRef.current.querySelector(
        ".rpv-core__viewer-layers",
      );
      if (!pagesContainer) return;

      const pages = Array.from(
        pagesContainer.querySelectorAll(".rpv-core__page-layer"),
      ) as HTMLElement[];

      // Only update state if pages have actually changed
      // This prevents unnecessary re-renders
      if (
        pages.length > 0 &&
        (pages.length !== pageElements.length ||
          !pages.every((page, i) => pageElements[i] === page))
      ) {
        // Associate each page with its page number for better tracking - do this only once
        pages.forEach((page, index) => {
          if (!page.hasAttribute("data-page-number")) {
            page.setAttribute("data-page-number", index.toString());
          }
        });

        setPageElements(pages);

        // Only log in debug mode
        if (debug) {
          console.log(`Found ${pages.length} PDF page elements`);
        }
      }
    };

    // Initial update
    updatePageElements();

    // Create a mutation observer with improved efficiency
    const observer = new MutationObserver((mutations) => {
      // Cancel any pending updates
      if (updateTimer) {
        clearTimeout(updateTimer);
      }

      // Quick check if we need to update
      let hasRelevantChanges = false;
      for (const mutation of mutations) {
        // Only check for child list changes or specific attribute changes
        if (
          mutation.type === "childList" ||
          (mutation.type === "attributes" &&
            (mutation.attributeName === "style" ||
              mutation.attributeName === "class"))
        ) {
          hasRelevantChanges = true;
          break;
        }
      }

      if (hasRelevantChanges) {
        // Debounce updates to avoid excessive processing
        updateTimer = setTimeout(updatePageElements, 50);
      }
    });

    // More targeted observation
    // Only observe the main viewer element for structure changes
    const targetNode =
      viewerContainerRef.current.querySelector(".rpv-core__viewer");
    if (targetNode) {
      observer.observe(targetNode, {
        childList: true,
        subtree: true,
        attributes: false, // Exclude attributes for better performance
      });
    } else {
      // Fallback to original implementation if target not found
      observer.observe(viewerContainerRef.current, {
        childList: true,
        subtree: true,
        attributes: false,
      });
    }

    return () => {
      if (updateTimer) {
        clearTimeout(updateTimer);
      }
      observer.disconnect();
    };
  }, [viewerContainerRef, debug]); // Removed pageElements dependency to prevent infinite loop
  // Removed duplicate fieldsByPage calculation - now using memoizedFieldsByPage// Set up an effect to reposition field overlays when the viewer scrolls, resizes or zooms
  useEffect(() => {
    if (!viewerContainerRef.current) return;

    // Use a single shared timer reference for debouncing
    let debounceTimer: ReturnType<typeof setTimeout> | null = null;

    // Function with debouncing to update positions
    const handleViewerChange = () => {
      // Cancel any pending updates
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }

      // Debounce updates to avoid excessive re-renders
      debounceTimer = setTimeout(() => {
        // Re-render will happen naturally due to the getBoundingClientRect calls
        // which will be recalculated on the next render cycle
        if (viewerContainerRef.current) {
          // Force a re-calculation by triggering a layout flush
          viewerContainerRef.current.scrollTop =
            viewerContainerRef.current.scrollTop;
        }
      }, 100); // 100ms debounce time
    };

    // Add scroll and resize listeners
    const viewerElement = viewerContainerRef.current;

    // Use passive event listeners for better performance
    viewerElement.addEventListener("scroll", handleViewerChange, {
      passive: true,
    });
    window.addEventListener("resize", handleViewerChange, { passive: true });

    // Simplify zoom detection - only observe key UI elements for changes
    // This reduces the number of observers and event handlers

    // Track zoom operations through a single observer
    const zoomObserver = new MutationObserver((mutations) => {
      // Only trigger update if we detect actual style changes
      let hasZoomChange = false;

      for (const mutation of mutations) {
        if (
          mutation.type === "attributes" &&
          mutation.attributeName === "style"
        ) {
          hasZoomChange = true;
          break;
        }
      }

      if (hasZoomChange) {
        handleViewerChange();
      }
    });

    // Only observe the layers container for zoom changes
    const mainLayerContainer = viewerElement.querySelector(
      ".rpv-core__viewer-layers",
    );
    if (mainLayerContainer) {
      zoomObserver.observe(mainLayerContainer, {
        attributes: true,
        attributeFilter: ["style"],
        subtree: false, // Don't observe children - improves performance
      });
    }

    // Use a single wheel handler for zoom detection
    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        // Handle zoom gesture
        handleViewerChange();
      }
    };

    // Passive wheel listener for better performance
    viewerElement.addEventListener("wheel", handleWheel, { passive: true });

    return () => {
      // Clean up all listeners and timers
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }

      viewerElement.removeEventListener("scroll", handleViewerChange);
      window.removeEventListener("resize", handleViewerChange);
      viewerElement.removeEventListener("wheel", handleWheel);

      zoomObserver.disconnect();
    };
  }, [viewerContainerRef]); // Extract the current zoom level using a ref instead of state to reduce re-renders
  const currentZoomRef = useRef(1);

  // Optimize zoom level monitoring
  useEffect(() => {
    if (!viewerContainerRef.current) return;

    // Debounce timer for zoom extraction
    let extractionTimer: ReturnType<typeof setTimeout> | null = null;

    const extractZoomLevel = () => {
      if (!viewerContainerRef.current) return;

      // Try to find the zoom level indicator element
      const zoomIndicator = viewerContainerRef.current.querySelector(
        ".rpv-zoom__popover-target-scale",
      );
      if (zoomIndicator && zoomIndicator.textContent) {
        const match = zoomIndicator.textContent.match(/(\d+(?:\.\d+)?)%/);
        if (match && match[1]) {
          const zoomPercentage = parseFloat(match[1]);
          // Use ref instead of state to avoid re-renders
          currentZoomRef.current = zoomPercentage / 100;

          // Only log in debug mode
          if (debug) {
            console.log(
              `Current zoom level: ${zoomPercentage}%, factor: ${zoomPercentage / 100}`,
            );
          }
        }
      }
    };

    // Initial extraction
    extractZoomLevel();

    // Simplified observer for zoom changes
    const zoomChangeObserver = new MutationObserver(() => {
      // Debounce the extraction to avoid excessive processing
      if (extractionTimer) {
        clearTimeout(extractionTimer);
      }

      extractionTimer = setTimeout(extractZoomLevel, 100);
    });

    // Only observe the zoom indicator target
    const zoomTarget = viewerContainerRef.current.querySelector(
      ".rpv-zoom__popover-target",
    );
    if (zoomTarget) {
      zoomChangeObserver.observe(zoomTarget, {
        characterData: true,
        subtree: true,
        childList: false, // We don't need to track child element additions/removals
      });
    }

    return () => {
      if (extractionTimer) {
        clearTimeout(extractionTimer);
      }
      zoomChangeObserver.disconnect();
    };
  }, [viewerContainerRef, debug]); // Removed pageElements dependency to reduce effect triggers
  // Memoize fields by page to avoid recalculation on every render
  const memoizedFieldsByPage = useMemo(() => {
    return fields.reduce<Record<number, DocumentField[]>>((acc, field) => {
      const pageNumber = Number(field.pageNumber || 1);
      if (!acc[pageNumber]) {
        acc[pageNumber] = [];
      }
      acc[pageNumber].push(field);
      return acc;
    }, {});
  }, [fields]);

  // Render fields on their corresponding pages with optimized calculations
  return (
    <>
      {/* Create an overlay for each page */}
      {pageElements.map((pageElement, pageIndex) => {
        // PDF viewer uses 0-based indexing, but our fields use 1-based
        const documentPage = pageIndex + 1;

        // Get fields for this page from memoized object
        const fieldsForPage = memoizedFieldsByPage[documentPage] || [];

        // Only create overlays for pages that have fields
        if (fieldsForPage.length === 0) return null;

        // Get page position to create a perfectly aligned overlay that's positioned relative to the PDF page
        const pageBounds = pageElement.getBoundingClientRect();
        const viewerBounds =
          viewerContainerRef.current?.getBoundingClientRect();

        // Skip if we can't get proper boundaries
        if (!viewerBounds || !viewerContainerRef.current) return null;

        // Calculate position of the page relative to the viewer's scroll position
        // This ensures the overlay is always aligned with the PDF page, regardless of scrolling
        const relativeTop =
          pageBounds.top -
          viewerBounds.top +
          viewerContainerRef.current.scrollTop;
        const relativeLeft =
          pageBounds.left -
          viewerBounds.left +
          viewerContainerRef.current.scrollLeft;

        // Only log in debug mode and limit frequency of logging
        if (debug && viewerContainerRef.current && Math.random() < 0.05) {
          // Log only ~5% of the time
          console.log(`Page ${documentPage} position:`, {
            top: relativeTop,
            left: relativeLeft,
            width: pageBounds.width,
            height: pageBounds.height,
            fields: fieldsForPage.length,
            zoom: currentZoomRef.current,
          });
        }
        return (
          <div
            key={`page-overlay-${documentPage}`}
            className="absolute"
            style={{
              position: "absolute",
              top: `${relativeTop}px`,
              left: `${relativeLeft}px`,
              width: `${pageBounds.width}px`,
              height: `${pageBounds.height}px`,
              zIndex: 20,
              transform: "translate3d(0,0,0)", // Hardware acceleration
              pointerEvents: "none", // Make container transparent to events but children can override
              transformOrigin: "0 0", // Ensure transforms are applied from top-left corner
              boxSizing: "border-box", // Ensure dimensions are exact
            }}
          >
            {/* Render fields for this page with position relative to page */}
            {fieldsForPage.map((field) => {
              // Calculate the scale factor based on the page's current dimensions vs standard PDF dimensions
              // This is crucial for positioning fields correctly relative to the PDF page
              // Standard PDF dimensions: A4 is 595 x 842 points at 72 PPI
              const scaleX = pageBounds.width / 595; // standard PDF width in points
              const scaleY = pageBounds.height / 842; // standard PDF height in points

              // Force numeric values to ensure consistent calculations
              const numX =
                typeof field.x === "string"
                  ? parseFloat(field.x)
                  : Number(field.x);
              const numY =
                typeof field.y === "string"
                  ? parseFloat(field.y)
                  : Number(field.y);
              const numWidth =
                typeof field.width === "string"
                  ? parseFloat(field.width)
                  : Number(field.width);
              const numHeight =
                typeof field.height === "string"
                  ? parseFloat(field.height)
                  : Number(field.height);

              // Apply proper scaling for the current zoom level to ensure fields are positioned
              // accurately relative to the PDF page
              const scaledX = Math.round(numX * scaleX); // Round to avoid subpixel rendering issues
              const scaledY = Math.round(numY * scaleY);
              const scaledWidth = Math.max(20, Math.round(numWidth * scaleX)); // Ensure minimum clickable size
              const scaledHeight = Math.max(20, Math.round(numHeight * scaleY));

              // Only log in debug mode and limit logging frequency
              if (debug && field.id.endsWith("0") && Math.random() < 0.1) {
                // Sample logging for better performance
                console.log(`Field ${field.id} scaling sample:`, {
                  scale: { x: scaleX, y: scaleY },
                });
              } // Wrap the field in a container with proper scaling and positioning
              // Position is relative to the PDF page, not the viewer
              return (
                <div
                  key={`field-container-${field.id}`}
                  style={{
                    position: "absolute",
                    // Apply proper positioning relative to the PDF page with scaling
                    left: `${scaledX}px`,
                    top: `${scaledY}px`,
                    width: `${scaledWidth}px`,
                    height: `${scaledHeight}px`,
                    // Apply hardware acceleration and CSS containment for performance
                    transform: "translate3d(0,0,0)",
                    contain: "layout paint", // Allow proper interactions while maintaining performance
                    pointerEvents: "auto", // Enable interaction with the field
                    willChange: "transform", // Hint to browser for optimization
                    boxSizing: "border-box", // Ensure borders don't affect dimensions
                    overflow: "visible", // Allow content to overflow if needed for interaction elements
                  }}
                >
                  {renderFieldAction({
                    ...field,
                    x: 0,
                    y: 0,
                    width: numWidth,
                    height: numHeight,
                  })}
                </div>
              );
            })}
            {/* Debug overlay to show page boundaries */}
            {debug && (
              <div className="absolute inset-0 border-2 border-blue-500/30 z-10 pointer-events-none">
                <div className="absolute top-0 right-0 bg-blue-500 text-white text-xs p-1">
                  Page {documentPage} ({pageIndex}) - {fieldsForPage.length}
                  fields
                </div>
                <div className="absolute bottom-0 right-0 bg-blue-500 text-white text-xs p-1">
                  {Math.round(pageBounds.width)}x{Math.round(pageBounds.height)}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </>
  );
}

export default FieldsOverlayContainer;
