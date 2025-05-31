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
 * Gets the IP address of the client from the server
 * @returns Promise that resolves to the IP address as a string
 */
export async function getIpAddress(): Promise<string> {
  try {
    const response = await fetch("/api/client-info");
    if (!response.ok) {
      throw new Error("Failed to fetch IP address");
    }
    const data = await response.json();
    return data.ipAddress || "127.0.0.1";
  } catch (error) {
    console.error("Error fetching IP address:", error);
    return "127.0.0.1";
  }
}

/**
 * This is a client-side function that can be called to help with client identification
 * Gets the actual IP address from the server
 * @returns A Promise that resolves to a client identification object
 */
export async function getClientInfo() {
  const ipAddress = await getIpAddress();

  return {
    userAgent: getUserAgent(),
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone || "Unknown",
    language:
      typeof navigator !== "undefined"
        ? navigator.language || "Unknown"
        : "Unknown",
    ipAddress,
  };
}
