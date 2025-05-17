"use server";

import { DocumentField } from "@/types/document";

export async function handleFieldUpdate(field: DocumentField) {
  // Server action wrapper for onFieldUpdate
  return field;
}

export async function handleFieldDelete(fieldId: string) {
  // Server action wrapper for onFieldDelete
  return fieldId;
}

export async function handleFieldSelect(field: DocumentField | null) {
  // Server action wrapper for onFieldSelect
  return field;
}

export async function handleEditPageChange(page: number) {
  // Server action wrapper for onPageChange
  return page;
}

export async function handleEditTotalPagesChange(pages: number) {
  // Server action wrapper for onTotalPagesChange
  return pages;
}
