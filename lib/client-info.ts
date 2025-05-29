"use client";

/**
 * Gets the user agent string from the browser
 * @returns The user agent string or "Unknown"
 */
export function getUserAgent(): string {
  if (typeof window !== "undefined" && window.navigator) {
    return window.navigator.userAgent || "Unknown";
  }
  return "Unknown";
}

/**
 * This is a client-side function that can be called to help with client identification
 * In a real application, you would use a service to get the actual IP address server-side
 * @returns A client identification object
 */
export function getClientInfo() {
  return {
    userAgent: getUserAgent(),
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone || "Unknown",
    language: typeof navigator !== "undefined" ? navigator.language || "Unknown" : "Unknown",
    // IP address should be determined on the server side in a real application
    // This is just a placeholder for demonstration
    ipAddress: "127.0.0.1",
  };
}
