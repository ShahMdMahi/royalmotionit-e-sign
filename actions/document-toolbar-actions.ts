"use server";

import { Document } from "@/types/document";
import { Document as PrismaDocument } from "@prisma/client";

export async function handleDocumentSave(document: Document | PrismaDocument) {
  // Server action wrapper for onSave
  // Ensure type property exists
  const docWithType = {
    ...document,
    type: document.type || "default",
    // Ensure signers property exists
    signers: "signers" in document ? document.signers : [],
  } as Document;
  return docWithType;
}

export async function handleSendForSignature(documentId: string) {
  // Server action wrapper for send for signature
  return documentId;
}
