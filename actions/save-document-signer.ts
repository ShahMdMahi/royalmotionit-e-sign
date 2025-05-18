"use server";

import { prisma } from "@/prisma/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { Signer } from "@/types/document";

/**
 * Save a signer for a document
 *
 * @param signer The signer data to save
 * @returns The saved signer
 */
export async function saveDocumentSigner(
  signer: Signer & { color?: string },
): Promise<{
  success: boolean;
  signer?: any; // Using 'any' here to accommodate Prisma's type which differs from our Signer interface
  error?: string;
}> {
  try {
    const session = await auth();

    if (!session || !session.user.id) {
      throw new Error("You must be logged in to perform this action");
    }

    // Check if the document belongs to the current user
    const document = await prisma.document.findFirst({
      where: {
        id: signer.documentId,
        authorId: session.user.id,
      },
    });

    if (!document) {
      throw new Error(
        "Document not found or you don't have permission to edit it",
      );
    }

    // Check if a signer already exists for this document
    const existingSigner = await prisma.signer.findFirst({
      where: {
        documentId: signer.documentId,
      },
    });

    let savedSigner;

    // If there's an existing signer, update it
    if (existingSigner) {
      savedSigner = await prisma.signer.update({
        where: {
          id: existingSigner.id,
        },
        data: {
          email: signer.email,
          name: signer.name,
          role: signer.role,
          status: signer.status,
          // Store color in userAgent field
          userAgent: signer.color,
        },
      });

      console.log(
        `Updated signer ${savedSigner.id} for document ${signer.documentId}`,
      );
    }
    // Otherwise, create a new signer
    else {
      // Handle temp ID (remove new- prefix)
      const signerId = signer.id.startsWith("new-") ? undefined : signer.id;

      savedSigner = await prisma.signer.create({
        data: {
          id: signerId,
          documentId: signer.documentId,
          email: signer.email,
          name: signer.name,
          role: signer.role,
          status: signer.status || "PENDING",
          userAgent: signer.color, // Store color
        },
      });

      console.log(
        `Created new signer ${savedSigner.id} for document ${signer.documentId}`,
      );
    }

    // Revalidate paths
    revalidatePath(`/documents/${signer.documentId}`);
    revalidatePath(`/documents/${signer.documentId}/edit`);
    revalidatePath(`/admin/documents/${signer.documentId}/edit`);

    return {
      success: true,
      signer: savedSigner,
    };
  } catch (error) {
    console.error("Error saving document signer:", error);
    return {
      success: false,
      error: String(error),
    };
  }
}
