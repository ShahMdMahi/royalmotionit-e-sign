"use client";

import { useEffect } from "react";

/**
 * Component that ensures Promise.withResolvers polyfill is loaded on the client
 * Use this component on pages that use PDF.js functionality
 */
export function PromisePolyfill() {  useEffect(() => {
    // Polyfill Promise.withResolvers if not available
    if (typeof Promise.withResolvers === 'undefined') {
      Promise.withResolvers = function<T>() {
        let resolve: (value: T | PromiseLike<T>) => void;
        let reject: (reason?: unknown) => void;
        
        const promise = new Promise<T>((res, rej) => {
          resolve = res;
          reject = rej;
        });
        
        return { promise, resolve: resolve!, reject: reject! };
      };
      
      console.log("Promise.withResolvers polyfill applied");
    }
  }, []);

  return null; // This component doesn't render anything
}
