"use server";

import { prisma } from "@/prisma/prisma";
import { auth } from "@/auth";
import { getFromR2 } from "@/actions/r2";

/**
 * Download a document from R2 storage
 * @param documentId Document ID
 * @returns Result of the operation with the document data
 */
export async function downloadDocument(documentId: string) {
  try {
    const session = await auth();

    if (!session || !session.user.id) {
      return {
        success: false,
        message: "You must be authenticated to download this document",
      };
    } // Get the document
    const document = await prisma.document.findFirst({
      where: {
        id: documentId,
        OR: [
          { authorId: session.user.id },
          { signers: { some: { email: session.user.email || "" } } },
        ],
      },
    });

    if (!document) {
      return {
        success: false,
        message: "Document not found or you don't have access",
      };
    }

    // Determine which key to use - if document is signed, use the signed URL
    // otherwise use the original document key
    const key =
      document.status === "COMPLETED" && document.url
        ? document.url.replace(process.env.R2_PUBLIC_URL + "/", "")
        : document.key;

    if (!key) {
      return {
        success: false,
        message: "Document file not found",
      };
    }

    // Get the document from storage
    const result = await getFromR2({ Key: key });

    if (!result.success) {
      return {
        success: false,
        message: "Failed to retrieve document",
        error: result.message,
      };
    }

    // Record document download in history
    await prisma.documentHistory.create({
      data: {
        documentId: document.id,
        action: "DOWNLOADED",
        actorEmail: session.user.email || undefined,
        actorName: session.user.name || undefined,
        actorRole: document.authorId === session.user.id ? "AUTHOR" : "SIGNER",
      },
    });

    return {
      success: true,
      data: result.data.Body,
      filename: `${document.title || "document"}-${document.status === "COMPLETED" ? "signed" : "original"}.pdf`,
      contentType: "application/pdf",
    };
  } catch (error) {
    console.error("Error downloading document:", error);
    return {
      success: false,
      message: "Failed to download document",
      error: String(error),
    };
  }
}
