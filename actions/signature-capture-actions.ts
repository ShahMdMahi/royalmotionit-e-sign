"use server";

export async function handleSignatureChange(signatureData: string) {
  // Server action wrapper for signature onChange
  return signatureData;
}

// When used in SigningFieldsTab
export async function handleSignatureFieldChange(
  fieldId: string,
  signatureData: string,
) {
  // Server action wrapper for signature onChange with fieldId
  return signatureData;
}
