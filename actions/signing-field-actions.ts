"use server";

export async function handleFieldChange(fieldId: string, value: string) {
  // This is just a wrapper to make the function a server action
  return { fieldId, value };
}

export async function handleNavigateToField(pageNumber: number) {
  // This is just a wrapper to make the function a server action
  return pageNumber;
}
