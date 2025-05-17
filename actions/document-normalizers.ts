"use server";

import {
  Document as PrismaDocument,
  Signer as PrismaSigner,
} from "@prisma/client";
import { Document, Signer } from "@/types/document";

/**
 * Normalizes a Prisma document with signers to match the expected Document type
 * This handles the null vs. undefined differences between Prisma and our type definitions
 */
export async function normalizeDatabaseDocument(
  doc: PrismaDocument & { signers?: PrismaSigner[] },
): Promise<Document> {
  // Map the properties correctly, ensuring the types match Document interface
  // Get custom fields added by extensions
  const customFields = {
    authorName: (doc as any).authorName,
    authorEmail: (doc as any).authorEmail,
    viewedAt: (doc as any).viewedAt,
  };
  return {
    id: doc.id,
    title: doc.title,
    description: doc.description || undefined,
    authorId: doc.authorId,
    authorName: customFields.authorName || undefined,
    authorEmail: customFields.authorEmail || undefined,
    status: doc.status as any, // Cast to Document status type
    preparedAt: doc.preparedAt || undefined,
    sentAt: doc.sentAt || undefined,
    viewedAt: customFields.viewedAt || undefined,
    signedAt: doc.signedAt || undefined,
    expiresAt: doc.expiresAt || undefined,
    key: doc.key || "",
    type: doc.type || "",
    sequentialSigning: doc.sequentialSigning || false,
    enableWatermark: (doc as any).enableWatermark || false,
    watermarkText: (doc as any).watermarkText || undefined,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
    // Handle fields safely
    fields: (doc as any).fields ? ((doc as any).fields as any) : undefined,
    // Process signers with async/await pattern
    signers: await Promise.all(
      (doc.signers || []).map((s) => normalizeDatabaseSigner(s)),
    ),
  };
}

/**
 * Normalizes a Prisma signer to match the expected Signer type
 */
export async function normalizeDatabaseSigner(
  signer: PrismaSigner,
): Promise<Signer> {
  // Convert any null values to undefined and ensure the type matches our Signer interface
  return {
    id: signer.id,
    documentId: signer.documentId,
    email: signer.email,
    name: signer.name || undefined,
    role: signer.role || undefined,
    order: signer.order,
    status: signer.status,
    accessCode: signer.accessCode || undefined,
    invitedAt: signer.invitedAt || undefined,
    viewedAt: signer.viewedAt || undefined,
    completedAt: signer.completedAt || undefined,
    notifiedAt: signer.notifiedAt || undefined,
    declinedAt: signer.declinedAt || undefined,
    declineReason: signer.declineReason || undefined,
    // Custom properties
    color: (signer as any).color || undefined,
  };
}
