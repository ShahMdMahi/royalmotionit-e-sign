"use server";

import { prisma } from "@/prisma/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

/**
 * Delete a signer from a document
 *
 * @param signerId The ID of the signer to delete
 * @param documentId The ID of the document the signer belongs to
 * @returns Success or failure status
 */
export async function deleteDocumentSigner(
  signerId: string,
  documentId: string,
) {
  try {
    const session = await auth();

    if (!session || !session.user.id) {
      throw new Error("You must be logged in to perform this action");
    }

    // Check if the document belongs to the current user
    const document = await prisma.document.findFirst({
      where: {
        id: documentId,
        authorId: session.user.id,
      },
    });

    if (!document) {
      throw new Error(
        "Document not found or you don't have permission to edit it",
      );
    }

    // If the signer ID is valid (not a temporary ID), delete it from the database
    if (signerId && !signerId.startsWith("new-")) {
      await prisma.signer.delete({
        where: {
          id: signerId,
        },
      });

      console.log(`Deleted signer ${signerId} from document ${documentId}`);
    }

    // Also clear signer associations from all signature and initial fields
    await prisma.documentField.updateMany({
      where: {
        documentId,
        type: { in: ["signature", "initial"] },
      },
      data: {
        signerId: null,
      },
    });

    // Revalidate paths
    revalidatePath(`/documents/${documentId}`);
    revalidatePath(`/documents/${documentId}/edit`);
    revalidatePath(`/admin/documents/${documentId}/edit`);

    return {
      success: true,
    };
  } catch (error) {
    console.error("Error deleting document signer:", error);
    return {
      success: false,
      error: String(error),
    };
  }
}
