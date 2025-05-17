"use client";

/**
 * Utility function to convert a Uint8Array to a data URL for PDF rendering
 */
export function arrayBufferToDataUrl(buffer: Uint8Array): string {
  const binary = Array.from(new Uint8Array(buffer))
    .map((b) => String.fromCharCode(b))
    .join("");
  return `data:application/pdf;base64,${btoa(binary)}`;
}

/**
 * Helper function to convert various PDF data formats to a format accepted by react-pdf's Document component
 */
/**
 * Enhanced function to safely prepare PDF data for react-pdf
 * Handles various input formats and edge cases with proper error handling
 */
export function preparePdfData(pdfData: any): { data: string } | null {
  // Handle null or undefined data
  if (pdfData === null || pdfData === undefined) {
    console.error("PDF data is null or undefined");
    return null;
  }

  try {
    // If it's already an object with data property and not an array
    if (
      typeof pdfData === "object" &&
      !Array.isArray(pdfData) &&
      "data" in pdfData
    ) {
      const { data } = pdfData;

      // If nested data is Uint8Array, convert to data URL
      if (data instanceof Uint8Array) {
        return { data: arrayBufferToDataUrl(data) };
      }

      // If nested data is string, pass through
      if (typeof data === "string") {
        return { data };
      }

      // Try to handle ArrayBuffer or Buffer objects (Node.js)
      if (typeof data === "object" && "byteLength" in data) {
        const uint8Array = new Uint8Array(data);
        return { data: arrayBufferToDataUrl(uint8Array) };
      }
    }

    // Direct Uint8Array
    if (pdfData instanceof Uint8Array) {
      return { data: arrayBufferToDataUrl(pdfData) };
    }

    // If pdfData has a byteLength property, it might be an ArrayBuffer
    if (
      typeof pdfData === "object" &&
      "byteLength" in pdfData &&
      !(pdfData instanceof Uint8Array)
    ) {
      const uint8Array = new Uint8Array(pdfData);
      return { data: arrayBufferToDataUrl(uint8Array) };
    }

    // If it's a string (URL or data URL)
    if (typeof pdfData === "string") {
      return { data: pdfData };
    }

    // Check if we're dealing with a Node.js Buffer or similar structure
    if (
      typeof pdfData === "object" &&
      "buffer" in pdfData &&
      typeof pdfData.buffer === "object"
    ) {
      try {
        const uint8Array = new Uint8Array(pdfData.buffer);
        return { data: arrayBufferToDataUrl(uint8Array) };
      } catch (e) {
        console.error("Failed to convert Buffer-like object to Uint8Array:", e);
      }
    }

    console.error("Unsupported PDF data format:", typeof pdfData, pdfData);
    return null;
  } catch (err) {
    console.error("Error in preparePdfData:", err);
    return null;
  }
}

/**
 * Converts PDF coordinates to screen coordinates based on current scale factor
 * @param x PDF x coordinate
 * @param y PDF y coordinate
 * @param scaleFactor Current scale factor
 * @returns Scaled screen coordinates
 */
export function pdfToScreenCoordinates(
  x: number,
  y: number,
  scaleFactor: number,
) {
  return {
    x: Number(x) * scaleFactor,
    y: Number(y) * scaleFactor,
  };
}

/**
 * Converts screen coordinates to PDF coordinates based on current scale factor
 * @param screenX Screen x coordinate
 * @param screenY Screen y coordinate
 * @param scaleFactor Current scale factor
 * @returns PDF coordinates
 */
export function screenToPdfCoordinates(
  screenX: number,
  screenY: number,
  scaleFactor: number,
) {
  return {
    x: Number(screenX) / scaleFactor,
    y: Number(screenY) / scaleFactor,
  };
}

/**
 * Calculate the scale factor for field positioning based on the rendered page size
 * @param pageSize PDF page size in PDF units
 * @param renderedWidth Rendered page width on screen
 * @param viewerScale Current viewer scale
 * @returns Combined scale factor
 */
export function calculateFieldScaleFactor(
  pageSize: { width: number },
  renderedWidth: number,
  viewerScale: number = 1,
): number {
  if (pageSize.width > 0 && renderedWidth > 0) {
    // Simple direct calculation - most reliable approach
    return renderedWidth / pageSize.width;
  }
  return viewerScale;
}

/**
 * Enhanced utility function to reliably calculate correct scale factor for field positioning
 * This function uses a simple direct approach that ensures consistent field positioning across zoom levels
 *
 * @param pageElement The DOM element representing the PDF page
 * @param pageSize The original PDF page size in points
 * @param viewerScale The current viewer scale factor (from zoom controls)
 * @returns The correct scale factor to convert between PDF coordinates and screen coordinates
 */
export function getAccurateScaleFactor(
  pageElement: HTMLElement | null,
  pageSize: { width: number; height: number },
  viewerScale: number,
): number {
  // If we don't have both pieces of information, fall back to the viewer scale
  if (!pageElement || pageSize.width <= 0) {
    return viewerScale;
  }

  // Get the actual rendered size of the page element in the DOM
  const pageBounds = pageElement.getBoundingClientRect();

  // If the page hasn't been properly rendered yet, fall back to viewer scale
  if (pageBounds.width <= 0) {
    return viewerScale;
  }

  // Simple division of rendered width by PDF width gives us the correct scale factor
  // This automatically accounts for the zoom level
  const scaleFactor = pageBounds.width / pageSize.width;

  return scaleFactor;
}

/**
 * Utility function to accurately position and size PDF fields
 * Handles exact positioning with consistent decimal precision
 * 
 * @param value Original coordinate or dimension value
 * @param scaleFactor The scaling factor to apply
 * @param decimals Number of decimal places for precision (default: 3)
 * @returns The scaled and rounded value
 */
export function preciseScaledValue(
  value: number | string,
  scaleFactor: number,
  decimals: number = 3
): number {
  // Ensure we're working with a number
  const numericValue = typeof value === 'string' ? parseFloat(value) : Number(value);
  
  // Apply scaling
  const scaled = numericValue * scaleFactor;
  
  // Round to specified decimal places for consistent rendering
  // Using 3 decimal places provides better positioning accuracy
  const factor = Math.pow(10, decimals);
  return Math.round(scaled * factor) / factor;
}

/**
 * Enhanced coordinate transformation for PDF field positioning
 * Uses a more accurate approach to calculate the exact position based on multiple factors
 * 
 * @param field The document field with coordinates in PDF units
 * @param scaleFactor Current scale factor
 * @param viewerScale Current zoom level of the viewer (already incorporated in scaleFactor)
 * @param pageElement Reference to the page DOM element for position validation
 * @param debug Whether to log debug information
 * @returns Exact position and dimensions for the field in screen pixels
 */
export function getExactFieldPosition(
  field: { x: number | string; y: number | string; width: number | string; height: number | string },
  scaleFactor: number,
  viewerScale: number = 1,
  pageElement: HTMLElement | null = null,
  debug: boolean = false
) {
  // Convert all values to numbers
  const x = typeof field.x === 'string' ? parseFloat(field.x) : Number(field.x);
  const y = typeof field.y === 'string' ? parseFloat(field.y) : Number(field.y);
  const width = typeof field.width === 'string' ? parseFloat(field.width) : Number(field.width);
  const height = typeof field.height === 'string' ? parseFloat(field.height) : Number(field.height);

  // Calculate exact values with direct multiplication - simplest and most reliable approach
  // scaleFactor already includes zoom level since it's calculated from actual rendered page size
  const exactX = x * scaleFactor;
  const exactY = y * scaleFactor;
  const exactWidth = width * scaleFactor;
  const exactHeight = height * scaleFactor;
  
  if (debug) {
    console.log('Field positioning details:', {
      original: { x, y, width, height },
      scaleFactor,
      scaled: { x: exactX, y: exactY, width: exactWidth, height: exactHeight }
    });
  }
  
  return {
    x: exactX,
    y: exactY,
    width: exactWidth,
    height: exactHeight
  };
}
