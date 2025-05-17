"use server";

import { prisma } from "@/prisma/prisma";
import { DocumentField } from "@/types/document";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { sendDocumentSignRequestEmail } from "./email";

/**
 * Save document fields to database
 * @param documentId The ID of the document
 * @param fields Array of document fields to save
 * @returns Result of the operation
 */
export async function saveDocumentFields(
  documentId: string,
  fields: DocumentField[],
) {
  try {
    const session = await auth();

    if (!session || !session.user.id) {
      return {
        success: false,
        message: "You must be logged in to perform this action",
      };
    }

    // First, get the document to ensure it belongs to the user
    const document = await prisma.document.findFirst({
      where: {
        id: documentId,
        authorId: session.user.id,
      },
    });

    if (!document) {
      return {
        success: false,
        message: "Document not found or you don't have permission to edit it",
      };
    }

    // Prepare document fields for the database
    const fieldData = fields.map((field) => ({
      id: field.id.startsWith("temp-") ? undefined : field.id, // Remove temp IDs
      documentId,
      type: field.type,
      label: field.label,
      required: field.required,
      placeholder: field.placeholder,
      x: field.x,
      y: field.y,
      width: field.width,
      height: field.height,
      pageNumber: field.pageNumber,
      value: field.value,
      color: field.color,
      fontFamily: field.fontFamily,
      fontSize: field.fontSize,
      validationRule: field.validationRule,
      conditionalLogic: field.conditionalLogic,
      options: field.options,
      backgroundColor: field.backgroundColor,
      borderColor: field.borderColor,
      textColor: field.textColor,
    }));

    // Delete existing fields
    await prisma.documentField.deleteMany({
      where: {
        documentId,
      },
    });

    // Create new fields
    await prisma.documentField.createMany({
      data: fieldData,
    });

    // Update document status to PENDING if it was DRAFT
    if (document.status === "DRAFT") {
      await prisma.document.update({
        where: {
          id: documentId,
        },
        data: {
          status: "PENDING",
          preparedAt: new Date(),
        },
      });
    }

    // Revalidate paths for cache
    revalidatePath(`/documents/${documentId}`);
    revalidatePath(`/documents`);

    return {
      success: true,
      message: "Document fields saved successfully",
    };
  } catch (error) {
    console.error("Error saving document fields:", error);
    return {
      success: false,
      message: "Failed to save document fields",
      error: String(error),
    };
  }
}

/**
 * Get document fields for a document
 * @param documentId The ID of the document
 * @returns Document fields
 */
export async function getDocumentFields(documentId: string) {
  try {
    const fields = await prisma.documentField.findMany({
      where: {
        documentId,
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    return {
      success: true,
      fields,
    };
  } catch (error) {
    console.error("Error fetching document fields:", error);
    return {
      success: false,
      message: "Failed to fetch document fields",
      error: String(error),
    };
  }
}

/**
 * Add document signers
 * @param documentId The ID of the document
 * @param signers Array of signers to add
 * @returns Result of the operation
 */
export async function saveDocumentSigners(documentId: string, signers: any[]) {
  try {
    const session = await auth();

    if (!session || !session.user.id) {
      return {
        success: false,
        message: "You must be logged in to perform this action",
      };
    }

    // Get the document
    const document = await prisma.document.findFirst({
      where: {
        id: documentId,
        authorId: session.user.id,
      },
    });

    if (!document) {
      return {
        success: false,
        message: "Document not found or you don't have permission to edit it",
      };
    }

    // Prepare signer data
    const signerData = signers.map((signer) => ({
      id: signer.id.startsWith("new-") ? undefined : signer.id,
      documentId,
      email: signer.email,
      name: signer.name || null,
      role: signer.role || null,
      order: signer.order,
      status: signer.status || "PENDING",
    }));

    // Delete existing signers
    await prisma.signer.deleteMany({
      where: {
        documentId,
      },
    });

    // Create new signers
    await prisma.signer.createMany({
      data: signerData,
    });

    // Revalidate paths for cache
    revalidatePath(`/documents/${documentId}`);
    revalidatePath(`/documents`);

    return {
      success: true,
      message: "Document signers saved successfully",
    };
  } catch (error) {
    console.error("Error saving document signers:", error);
    return {
      success: false,
      message: "Failed to save document signers",
      error: String(error),
    };
  }
}

/**
 * Send document for signing
 * @param documentId The ID of the document
 * @param completionMessage Optional message to show after signing
 * @returns Result of the operation
 */
export async function sendDocumentForSigning(
  documentId: string,
  completionMessage?: string,
) {
  try {
    const session = await auth();

    if (!session || !session.user.id) {
      return {
        success: false,
        message: "You must be logged in to perform this action",
      };
    }

    // Get the document with signers
    const document = await prisma.document.findFirst({
      where: {
        id: documentId,
        authorId: session.user.id,
      },
      include: {
        signers: true,
        fields: true,
      },
    });

    if (!document) {
      return {
        success: false,
        message: "Document not found or you don't have permission to send it",
      };
    }

    // Check if there is a signer
    if (!document.signers || document.signers.length === 0) {
      return {
        success: false,
        message: "Add a signer before sending the document",
      };
    }

    // Update document status and settings
    await prisma.document.update({
      where: {
        id: documentId,
      },
      data: {
        status: "PENDING",
        sentAt: new Date(),
        completionMessage,
      },
    });

    // Create document history entry
    await prisma.documentHistory.create({
      data: {
        documentId,
        action: "SENT",
        actorEmail: session.user.email || "",
        actorName: session.user.name || "",
        actorRole: "AUTHOR",
        details: JSON.stringify({
          signers: document.signers ? document.signers.length : 0,
        }),
      },
    });

    // Send email to the signer
    const signer =
      document.signers && document.signers.length > 0
        ? document.signers[0]
        : null;

    if (signer) {
      await sendDocumentSignRequestEmail(
        signer.name || "Signer",
        signer.email,
        document.title,
        document.id,
        session.user.name || "Document Author",
        session.user.email || "",
        undefined, // No custom message for now
        document.expiresAt || undefined,
      );

      // Update the notifiedAt date for this signer
      await prisma.signer.update({
        where: {
          id: signer.id,
        },
        data: {
          notifiedAt: new Date(),
        },
      });
    }

    // Revalidate paths
    revalidatePath(`/documents/${documentId}`);
    revalidatePath("/documents");

    return {
      success: true,
      message: "Document sent for signing",
    };
  } catch (error) {
    console.error("Error sending document for signing:", error);
    return {
      success: false,
      message: "Failed to send document for signing",
      error: String(error),
    };
  }
}

/**
 * Send reminders to pending signers
 * @param documentId The ID of the document
 * @returns Result of the operation
 */
export async function remindSigners(documentId: string) {
  try {
    const session = await auth();

    if (!session || !session.user.id) {
      return {
        success: false,
        message: "You must be logged in to perform this action",
      };
    }

    // Get the document with signers
    const document = await prisma.document.findFirst({
      where: {
        id: documentId,
        authorId: session.user.id,
      },
      include: {
        signers: {
          where: {
            status: "PENDING",
          },
        },
      },
    });

    if (!document) {
      return {
        success: false,
        message: "Document not found or you don't have permission to access it",
      };
    }

    // Check if document is in a status where reminders can be sent
    if (document.status !== "PENDING") {
      return {
        success: false,
        message: `Cannot send reminders for a document in ${document.status} status`,
      };
    }

    // Check if there are pending signers
    if (!document.signers || document.signers.length === 0) {
      return {
        success: false,
        message: "No pending signers to remind",
      };
    }

    // Send reminder to the signer
    const signer =
      document.signers && document.signers.length > 0
        ? document.signers[0]
        : null;

    if (signer) {
      await sendDocumentSignRequestEmail(
        signer.name || "Signer",
        signer.email,
        document.title,
        documentId,
        session.user.name || "Document Author",
        session.user.email || "",
        "This is a reminder to sign the document.",
        document.expiresAt || undefined,
      );

      // Update the notifiedAt date for this signer
      await prisma.signer.update({
        where: {
          id: signer.id,
        },
        data: {
          notifiedAt: new Date(),
        },
      });
    }

    // Create document history entry
    await prisma.documentHistory.create({
      data: {
        documentId,
        action: "REMINDED",
        actorEmail: session.user.email || "",
        actorName: session.user.name || "",
        actorRole: "AUTHOR",
        details: JSON.stringify({
          reminderCount: document.signers ? document.signers.length : 0,
        }),
      },
    });

    return {
      success: true,
      message: "Reminder(s) sent successfully",
    };
  } catch (error) {
    console.error("Error sending reminders:", error);
    return {
      success: false,
      message: "Failed to send reminders",
      error: String(error),
    };
  }
}

/**
 * Cancel a document
 * @param documentId The ID of the document
 * @returns Result of the operation
 */
export async function cancelDocument(documentId: string) {
  try {
    const session = await auth();

    if (!session || !session.user.id) {
      return {
        success: false,
        message: "You must be logged in to perform this action",
      };
    }

    // Get the document
    const document = await prisma.document.findFirst({
      where: {
        id: documentId,
        authorId: session.user.id,
      },
    });

    if (!document) {
      return {
        success: false,
        message: "Document not found or you don't have permission to cancel it",
      };
    }

    // Check if document can be canceled
    if (document.status === "COMPLETED") {
      return {
        success: false,
        message: "Cannot cancel a completed document",
      };
    }

    // Update document status
    await prisma.document.update({
      where: {
        id: documentId,
      },
      data: {
        status: "CANCELED",
      },
    });

    // Create document history entry
    await prisma.documentHistory.create({
      data: {
        documentId,
        action: "CANCELED",
        actorEmail: session.user.email || "",
        actorName: session.user.name || "",
        actorRole: "AUTHOR",
        details: JSON.stringify({
          reason: "Canceled by author",
        }),
      },
    });

    // Revalidate paths
    revalidatePath(`/documents/${documentId}`);
    revalidatePath("/documents");

    return {
      success: true,
      message: "Document canceled successfully",
    };
  } catch (error) {
    console.error("Error canceling document:", error);
    return {
      success: false,
      message: "Failed to cancel document",
      error: String(error),
    };
  }
}
