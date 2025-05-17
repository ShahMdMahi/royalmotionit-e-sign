/**
 * Utility functions for color management in the document editor
 */

/**
 * Calculate contrast ratio between two colors
 * Based on WCAG 2.0 formula
 * @param hex1 First color in hex format
 * @param hex2 Second color in hex format
 * @returns Contrast ratio (1-21)
 */
export function getContrastRatio(hex1: string, hex2: string): number {
  const rgb1 = hexToRgb(hex1);
  const rgb2 = hexToRgb(hex2);

  if (!rgb1 || !rgb2) return 1;

  const luminance1 = getLuminance(rgb1);
  const luminance2 = getLuminance(rgb2);

  const lighter = Math.max(luminance1, luminance2);
  const darker = Math.min(luminance1, luminance2);

  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Convert hex color to RGB values
 * @param hex Hex color string (e.g., #FF0000)
 * @returns RGB object or null if invalid
 */
export function hexToRgb(
  hex: string,
): { r: number; g: number; b: number } | null {
  // Remove # if present
  hex = hex.replace("#", "");

  // Handle different hex formats
  if (hex.length === 3) {
    // Convert 3-char format to 6-char
    hex = hex
      .split("")
      .map((char) => char + char)
      .join("");
  }

  if (hex.length !== 6) {
    return null;
  }

  // Parse the hex components
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);

  if (isNaN(r) || isNaN(g) || isNaN(b)) {
    return null;
  }

  return { r, g, b };
}

/**
 * Calculate relative luminance of an RGB color
 * @param rgb RGB color object
 * @returns Relative luminance (0-1)
 */
function getLuminance(rgb: { r: number; g: number; b: number }): number {
  // Convert RGB to sRGB
  const sRGB = {
    r: rgb.r / 255,
    g: rgb.g / 255,
    b: rgb.b / 255,
  };

  // Apply gamma correction
  const gammaCorrect = (value: number): number => {
    return value <= 0.03928
      ? value / 12.92
      : Math.pow((value + 0.055) / 1.055, 2.4);
  };

  // Apply color weights and calculate luminance
  return (
    0.2126 * gammaCorrect(sRGB.r) +
    0.7152 * gammaCorrect(sRGB.g) +
    0.0722 * gammaCorrect(sRGB.b)
  );
}

/**
 * Check if text color should be white or black based on background
 * @param backgroundColor Background color in hex format
 * @returns "#FFFFFF" for white or "#000000" for black
 */
export function getContrastingTextColor(backgroundColor: string): string {
  const rgb = hexToRgb(backgroundColor);

  if (!rgb) return "#000000";

  // Using YIQ formula for perceived brightness
  const yiq = (rgb.r * 299 + rgb.g * 587 + rgb.b * 114) / 1000;

  // Return black for light backgrounds, white for dark backgrounds
  return yiq >= 128 ? "#000000" : "#FFFFFF";
}

/**
 * Adjust color transparency
 * @param hexColor Hex color string
 * @param opacity Opacity value (0-1)
 * @returns RGBA color string
 */
export function getColorWithOpacity(hexColor: string, opacity: number): string {
  const rgb = hexToRgb(hexColor);

  if (!rgb) return `rgba(0, 0, 0, ${opacity})`;

  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${opacity})`;
}
