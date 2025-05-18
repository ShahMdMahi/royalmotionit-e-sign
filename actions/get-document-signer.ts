"use server";

import { prisma } from "@/prisma/prisma";
import { auth } from "@/auth";
import { Signer as PrismaSigner } from "@prisma/client";

/**
 * Get the signer for a document
 *
 * @param documentId The ID of the document to get the signer for
 * @returns The signer for the document
 */
export async function getDocumentSigner(documentId: string): Promise<{
  success: boolean;
  error?: string;
  signer: any | null; // Using 'any' instead of PrismaSigner to avoid type conflicts
}> {
  try {
    const session = await auth();

    if (!session || !session.user.id) {
      return {
        success: false,
        error: "You must be logged in to perform this action",
        signer: null,
      };
    }

    // Check if the document belongs to the current user
    const document = await prisma.document.findFirst({
      where: {
        id: documentId,
        authorId: session.user.id,
      },
    });

    if (!document) {
      return {
        success: false,
        error: "Document not found or you don't have permission to view it",
        signer: null,
      };
    }

    // Get the signer for the document
    const signer = await prisma.signer.findFirst({
      where: {
        documentId,
      },
    });

    return {
      success: true,
      signer,
    };
  } catch (error) {
    console.error("Error getting document signer:", error);
    return {
      success: false,
      error: String(error),
      signer: null,
    };
  }
}
