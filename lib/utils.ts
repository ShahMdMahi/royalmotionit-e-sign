import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format a date in Bangladeshi timezone (Asia/Dhaka)
 * Returns a string in the format: "DD MMM, YYYY, h:mm A" (e.g., "28 Apr, 2025, 2:30 PM")
 */
export function formatDate(date: Date | string): string {
  // If input is string, convert to Date object
  const dateObj = typeof date === "string" ? new Date(date) : date;

  // Format date in Bangladeshi timezone (UTC+6)
  return new Intl.DateTimeFormat("en-BD", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: "Asia/Dhaka",
  }).format(dateObj);
}

/**
 * Format a date in Bangladeshi timezone without time
 * Returns a string in the format: "DD MMM, YYYY" (e.g., "28 Apr, 2025")
 */
export function formatDateOnly(date: Date | string): string {
  // If input is string, convert to Date object
  const dateObj = typeof date === "string" ? new Date(date) : date;

  // Format date in Bangladeshi timezone (UTC+6) without time
  return new Intl.DateTimeFormat("en-BD", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Dhaka",
  }).format(dateObj);
}
