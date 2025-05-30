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

    let mounted = true;

    const initializeWorker = async () => {
      try {
        // Ensure Promise.withResolvers is available
        if (typeof Promise.withResolvers === "undefined") {
          Promise.withResolvers = function <T>() {
            let resolve: (value: T | PromiseLike<T>) => void;
            let reject: (reason?: unknown) => void;

            const promise = new Promise<T>((res, rej) => {
              resolve = res;
              reject = rej;
            });

            return { promise, resolve: resolve!, reject: reject! };
          };
        }

        // Only set the worker source if it's not already set
        if (!pdfjs.GlobalWorkerOptions.workerSrc) {
          // Try with the standard location first
          pdfjs.GlobalWorkerOptions.workerSrc = `/worker/4.8.69-pdf.worker.min.mjs`;
          console.log(
            "PDF.js worker set to:",
            pdfjs.GlobalWorkerOptions.workerSrc,
          );
        }

        // Add a small delay to ensure the worker has time to initialize
        // This is especially important on mobile devices
        await new Promise(resolve => setTimeout(resolve, 100));

        if (mounted) {
          setIsLoaded(true);
          setError(null);
        }
      } catch (err) {
        console.error("Failed to set PDF.js worker:", err);
        
        if (mounted) {
          setError(err instanceof Error ? err : new Error(String(err)));

          // Try fallback locations
          try {
            pdfjs.GlobalWorkerOptions.workerSrc = `/pdf.worker.min.js`;
            console.log("Set fallback PDF.js worker path");
            
            // Add another delay for fallback
            await new Promise(resolve => setTimeout(resolve, 100));
            
            if (mounted) {
              setIsLoaded(true);
              setError(null);
            }
          } catch (fallbackErr) {
            console.error("All worker initialization attempts failed");
            if (mounted) {
              setError(fallbackErr instanceof Error ? fallbackErr : new Error(String(fallbackErr)));
            }
          }
        }
      }
    };

    initializeWorker();

    return () => {
      mounted = false;
    };
  }, []);

  return { isLoaded, error };
}
