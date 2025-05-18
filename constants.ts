/**
 * Application constants
 */

// Base URL for the application - update this for production
export const BASE_URL =
  process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

// Email constants
export const EMAIL_FROM = process.env.EMAIL_FROM || "noreply@royalsign.com";
export const EMAIL_SENDER_NAME = "Royal Sign";
