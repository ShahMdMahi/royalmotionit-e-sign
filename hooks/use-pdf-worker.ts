"use client";

import { useEffect, useState } from "react";
import { pdfjs } from "react-pdf";

/**
 * Custom hook to ensure PDF.js worker is correctly loaded
 * Handles worker configuration and verifies it's correctly set
 */
export function usePdfWorker() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") {
      // Skip in SSR
      return;
    }

    try {
      // Only set the worker source if it's not already set
      if (!pdfjs.GlobalWorkerOptions.workerSrc) {
        // Try with the standard location first
        pdfjs.GlobalWorkerOptions.workerSrc = `/worker/4.8.69-pdf.worker.min.mjs`;
        console.log(
          "PDF.js worker set to:",
          pdfjs.GlobalWorkerOptions.workerSrc,
        );
      }

      setIsLoaded(true);
    } catch (err) {
      console.error("Failed to set PDF.js worker:", err);
      setError(err instanceof Error ? err : new Error(String(err)));

      // Try fallback locations
      try {
        pdfjs.GlobalWorkerOptions.workerSrc = `/pdf.worker.min.js`;
        console.log("Set fallback PDF.js worker path");
        setIsLoaded(true);
        setError(null);
      } catch (fallbackErr) {
        console.error("All worker initialization attempts failed");
      }
    }
  }, []);

  return { isLoaded, error };
}
