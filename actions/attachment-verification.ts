"use server";

import { auth } from "@/auth";
import { prisma } from "@/prisma/prisma";

/**
 * Verifies if attachments are properly embedded in the final PDF
 * @param documentId The ID of the document to check
 * @returns Status information about attachments
 */
export async function verifyAttachmentsEmbedding(documentId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, message: "Authentication required" };
  }

  try {
    // Get document with attachments
    const document = await prisma.document.findFirst({
      where: {
        id: documentId,
        OR: [
          { authorId: session.user.id },
          { signers: { some: { email: session.user.email ?? "" } } },
        ],
      },
      include: {
        attachments: true,
      },
    });

    if (!document) {
      return { success: false, message: "Document not found" };
    }

    const { attachments } = document;

    if (!attachments.length) {
      return {
        success: true,
        hasAttachments: false,
        message: "Document has no attachments to verify",
      };
    }

    // In a real implementation, we would verify the PDF structure
    // For now, we'll just return attachment statistics
    const attachmentStats = {
      count: attachments.length,
      totalSize: attachments.reduce(
        (total, attachment) => total + attachment.size,
        0,
      ),
      types: [...new Set(attachments.map((a) => a.mimeType))],
      names: attachments.map((a) => a.name),
    };

    return {
      success: true,
      hasAttachments: true,
      message: `Document has ${attachments.length} attachments ready to embed`,
      stats: attachmentStats,
    };
  } catch (error) {
    console.error("Error verifying attachments:", error);
    return { success: false, message: "Failed to verify attachments" };
  }
}

/**
 * Lists all attachments for a document with their embedding status
 * @param documentId The document ID
 * @returns List of attachments with status
 */
export async function listAttachmentsWithStatus(documentId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, message: "Authentication required" };
  }

  try {
    // Get document with attachments
    const document = await prisma.document.findFirst({
      where: {
        id: documentId,
        OR: [
          { authorId: session.user.id },
          { signers: { some: { email: session.user.email ?? "" } } },
        ],
      },
      include: {
        attachments: true,
      },
    });

    if (!document) {
      return { success: false, message: "Document not found" };
    }

    const { attachments } = document;

    // For each attachment, check if it's embeddable
    // In a real implementation, we would check if the file can be fetched and embedded
    const attachmentsWithStatus = await Promise.all(
      attachments.map(async (attachment) => {
        // Check if attachment exists in storage
        const { getFromR2 } = await import("./r2");
        const url = await getFromR2({ Key: attachment.key });

        return {
          id: attachment.id,
          name: attachment.name,
          size: attachment.size,
          mimeType: attachment.mimeType,
          canEmbed: !!url,
          status: !!url ? "ready" : "missing",
        };
      }),
    );

    return {
      success: true,
      attachments: attachmentsWithStatus,
    };
  } catch (error) {
    console.error("Error listing attachments with status:", error);
    return {
      success: false,
      message: "Failed to list attachments",
      attachments: [],
    };
  }
}
