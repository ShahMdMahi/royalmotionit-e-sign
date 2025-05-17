"use server";

export async function handleResizeAction(width: number, height: number) {
  // Server action wrapper for onResize
  return { width, height };
}
