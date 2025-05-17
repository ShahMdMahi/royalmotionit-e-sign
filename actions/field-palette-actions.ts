"use server";

import { DocumentFieldType } from "@/types/document";
import { revalidatePath } from "next/cache";

/**
 * Server action wrapper for handling field addition
 * @param fieldType The type of field being added
 * @param pageNumber The current page number where the field should be added
 * @returns The field type for client-side processing
 */
export async function handleAddField(
  fieldType: DocumentFieldType,
  pageNumber: number = 1,
) {
  // This is mostly a wrapper function to make it a server action
  // The actual field saving is done in saveDocumentFields

  // Revalidate paths to ensure UI is up to date
  revalidatePath("/documents/[id]");

  // Return both the field type and page number
  return { fieldType, pageNumber };
}
