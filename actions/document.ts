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
      include: {
        signers: true,
      },
    });

    if (!document) {
      return {
        success: false,
        message: "Document not found or you don't have permission to edit it",
      };
    }

    // Check if there are signature/initial fields that need a signer
    const signatureFields = fields.filter((field) =>
      ["signature", "initial"].includes(field.type),
    );

    const needsSigner = signatureFields.length > 0;
    const hasSigner = document.signers && document.signers.length > 0;

    // Validate that there is a signer if signature fields are present
    if (needsSigner && !hasSigner) {
      return {
        success: false,
        message: "Add a signer before saving a document with signature fields",
      };
    }

    // If there is a signer and signature fields, make sure they're connected
    if (needsSigner && hasSigner) {
      const signer = document.signers[0]; // Get the first signer (single signer model)
      console.log(
        `Document has signer ${signer.id} (${signer.email}), ensuring fields are linked`,
      );

      let fieldsWithoutSigner = 0;
      let fieldsWithWrongSigner = 0;
      let optionalFieldsLinked = 0;

      // Define which field types should be associated with signers
      const signerRequiredTypes = ["signature", "initial"];
      const signerOptionalTypes = [
        "text",
        "date",
        "checkbox",
        "dropdown",
        "email",
        "phone",
        "radio",
        "number",
      ];

      fields = fields.map((field) => {
        // For fields that must have a signer (signature, initial)
        if (signerRequiredTypes.includes(field.type)) {
          // If no signer assigned or different signer assigned
          if (
            !field.signerId ||
            field.signerId === null ||
            field.signerId.trim() === ""
          ) {
            fieldsWithoutSigner++;
            // Link the field to the signer
            return { ...field, signerId: signer.id };
          } else if (field.signerId !== signer.id) {
            // Field is assigned to a different signer
            fieldsWithWrongSigner++;
            console.log(
              `Field ${field.id} of type ${field.type} was assigned to incorrect signer ${field.signerId}, updating to ${signer.id}`,
            );
            // Update to current signer
            return { ...field, signerId: signer.id };
          }
        }

        // For other field types that can have a signer
        else if (signerOptionalTypes.includes(field.type)) {
          // For required fields, always ensure they have a signer
          if (
            field.required &&
            (!field.signerId ||
              field.signerId === null ||
              field.signerId.trim() === "")
          ) {
            fieldsWithoutSigner++;
            return { ...field, signerId: signer.id };
          }
          // For optional fields that already have a signer but it's wrong, fix it
          else if (
            field.signerId &&
            field.signerId.trim() !== "" &&
            field.signerId !== signer.id
          ) {
            optionalFieldsLinked++;
            return { ...field, signerId: signer.id };
          }
        }

        return field;
      });

      console.log(
        `Updated signer assignments: ${fieldsWithoutSigner} fields with no signer and ${fieldsWithWrongSigner} fields with wrong signer connected to signer ${signer.id}. Additionally, ${optionalFieldsLinked} optional fields were relinked.`,
      );
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

    // If document has signers and the document is already in PENDING state, notify them that the document has been updated
    if (
      document.signers &&
      document.signers.length > 0 &&
      document.status === "PENDING"
    ) {
      try {
        // Import the sendDocumentUpdateEmail function
        const { sendDocumentUpdateEmail } = await import("@/actions/email");

        // Send update email to each signer
        for (const signer of document.signers) {
          await sendDocumentUpdateEmail(
            signer.name || "Signer",
            signer.email,
            document.title,
            documentId,
            session.user.name || "Document Admin",
            session.user.email || "",
            "This document has been updated. Please review and sign the latest version.",
          );

          // Update the notifiedAt timestamp for the signer
          await prisma.signer.update({
            where: {
              id: signer.id,
            },
            data: {
              notifiedAt: new Date(),
            },
          });
        }
      } catch (error) {
        console.error("Error sending document update emails:", error);
        // Non-fatal error, continue
      }
    }

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
    const createdSigners = await prisma.signer.createMany({
      data: signerData,
    });

    // After creating new signers, get the first signer to update fields
    if (signers.length > 0 && createdSigners) {
      // Get the newly created signer
      const newSigner = await prisma.signer.findFirst({
        where: {
          documentId,
          email: signers[0].email,
        },
      });

      if (newSigner) {
        // Get all signature and initial fields that need a signer
        const signatureFields = await prisma.documentField.findMany({
          where: {
            documentId,
            type: {
              in: ["signature", "initial"],
            },
          },
        });

        // Get all other required fields (text, date, checkbox, etc.)
        const requiredFields = await prisma.documentField.findMany({
          where: {
            documentId,
            type: {
              notIn: ["signature", "initial"],
            },
            required: true,
          },
        });

        // Update all signature and initial fields to use the new signer
        if (signatureFields.length > 0) {
          for (const field of signatureFields) {
            await prisma.documentField.update({
              where: { id: field.id },
              data: { signerId: newSigner.id },
            });
          }
          console.log(
            `Updated ${signatureFields.length} signature/initial fields to use signer ${newSigner.id}`,
          );
        }

        // Update all required fields to use the new signer
        if (requiredFields.length > 0) {
          for (const field of requiredFields) {
            await prisma.documentField.update({
              where: { id: field.id },
              data: { signerId: newSigner.id },
            });
          }
          console.log(
            `Updated ${requiredFields.length} required fields to use signer ${newSigner.id}`,
          );
        }

        // Check for any other fields that might have a signer ID assigned
        // but it doesn't match our new signer - these need to be updated
        const misconfiguredFields = await prisma.documentField.findMany({
          where: {
            documentId,
            signerId: { not: null },
            NOT: {
              signerId: newSigner.id,
            },
          },
        });

        // Update any misconfigured fields to point to the new signer
        if (misconfiguredFields.length > 0) {
          for (const field of misconfiguredFields) {
            await prisma.documentField.update({
              where: { id: field.id },
              data: { signerId: newSigner.id },
            });
          }
          console.log(
            `Fixed ${misconfiguredFields.length} misconfigured fields to use signer ${newSigner.id}`,
          );
        }
      }
    }

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

    // Handle the signer - ensure they have an account and send them the document
    const signer =
      document.signers && document.signers.length > 0
        ? document.signers[0]
        : null;

    if (signer) {
      // First, ensure all signature and initial fields are linked to this signer
      const signatureFields =
        document.fields?.filter((field) =>
          ["signature", "initial"].includes(field.type),
        ) || [];

      // Check if any signature fields are missing the signer assignment
      let fieldsWithoutCorrectSigner = 0;
      for (const field of signatureFields) {
        if (!field.signerId || field.signerId !== signer.id) {
          fieldsWithoutCorrectSigner++;
          // Update the field to link to the current signer
          await prisma.documentField.update({
            where: { id: field.id },
            data: { signerId: signer.id },
          });
        }
      }

      // Also find all required fields to make sure they're linked to the signer
      const requiredFields =
        document.fields?.filter(
          (field) =>
            !["signature", "initial"].includes(field.type) && field.required,
        ) || [];

      let requiredFieldsWithoutSigner = 0;
      for (const field of requiredFields) {
        if (!field.signerId || field.signerId !== signer.id) {
          requiredFieldsWithoutSigner++;
          // Update the required field to link to the current signer
          await prisma.documentField.update({
            where: { id: field.id },
            data: { signerId: signer.id },
          });
        }
      }

      // Check for any fields that might be linked to a different/wrong signer
      const allFields = document.fields || [];
      let fieldsWithWrongSigner = 0;
      for (const field of allFields) {
        if (field.signerId && field.signerId !== signer.id) {
          fieldsWithWrongSigner++;
          // Update the field to link to the current signer
          await prisma.documentField.update({
            where: { id: field.id },
            data: { signerId: signer.id },
          });
        }
      }

      if (
        fieldsWithoutCorrectSigner > 0 ||
        requiredFieldsWithoutSigner > 0 ||
        fieldsWithWrongSigner > 0
      ) {
        console.log(
          `Before sending document, fixed field-signer connections: ${fieldsWithoutCorrectSigner} signature/initial fields, ${requiredFieldsWithoutSigner} required fields, and ${fieldsWithWrongSigner} misconfigured fields now use signer ${signer.id}`,
        );
      }

      // Import here to avoid circular dependencies
      const { sendSigningRequestWithAccountInfo } = await import(
        "@/actions/signer-account"
      );

      // Send the document for signing with appropriate email - no need to check for account
      // since we already created it when assigning the signer
      await sendSigningRequestWithAccountInfo(
        signer.email,
        signer.name || "Signer",
        document.id,
        document.title,
        session.user.name || "Document Author",
        session.user.email || "",
        undefined, // No password needed since account already exists
        completionMessage, // Forward any custom completion message
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
      // Import here to avoid circular dependencies
      const { ensureSignerAccount, sendSigningRequestWithAccountInfo } =
        await import("@/actions/signer-account");

      // Check if signer has an account but don't create a new one if they don't
      const signerAccount = await ensureSignerAccount(
        signer.email,
        signer.name || undefined,
      );

      // Send reminder with appropriate message
      await sendSigningRequestWithAccountInfo(
        signer.email,
        signerAccount.user?.name || signer.name || "Signer",
        documentId,
        document.title,
        session.user.name || "Document Author",
        session.user.email || "",
        signerAccount.user?.isNewUser ? signerAccount.password : undefined, // Only send password if new user
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

/**
 * Delete a document permanently
 * @param documentId The ID of the document to delete
 * @returns Result of the operation
 */
export async function deleteDocument(documentId: string) {
  try {
    const session = await auth();

    if (!session || !session.user.id) {
      return {
        success: false,
        message: "You must be logged in to delete this document",
      };
    }

    // First, get the document to ensure it belongs to the user
    const document = await prisma.document.findFirst({
      where: {
        id: documentId,
        authorId: session.user.id,
      },
      include: {
        signers: true,
      },
    });

    if (!document) {
      return {
        success: false,
        message: "Document not found or you don't have permission to delete it",
      };
    }

    // Delete document file from R2 storage if it exists
    if (document.key) {
      const { deleteFromR2 } = await import("./r2");
      const deleteResult = await deleteFromR2({
        Key: document.key,
        Bucket: process.env.R2_BUCKET_NAME,
      });

      if (!deleteResult.success) {
        console.error(
          "Warning: Could not delete document file from storage:",
          deleteResult.message,
        );
        // Continue with database deletion even if R2 deletion fails
      }
    }

    // Delete related document fields
    await prisma.documentField.deleteMany({
      where: {
        documentId,
      },
    });

    // Delete document history
    await prisma.documentHistory.deleteMany({
      where: {
        documentId,
      },
    });

    // Delete document attachments from R2 and then from database
    const attachments = await prisma.attachment.findMany({
      where: {
        documentId,
      },
    });

    for (const attachment of attachments) {
      if (attachment.key) {
        const { deleteFromR2 } = await import("./r2");
        await deleteFromR2({
          Key: attachment.key,
          Bucket: process.env.R2_BUCKET_NAME,
        });
      }
    }

    // Delete all attachments from database
    await prisma.attachment.deleteMany({
      where: {
        documentId,
      },
    });

    // Delete signers
    await prisma.signer.deleteMany({
      where: {
        documentId,
      },
    });

    // Finally delete the document itself
    await prisma.document.delete({
      where: {
        id: documentId,
      },
    });

    // Revalidate paths for cache
    revalidatePath(`/admin/documents`);
    revalidatePath(`/documents`);

    return {
      success: true,
      message: "Document deleted successfully",
    };
  } catch (error) {
    console.error("Error deleting document:", error);
    return {
      success: false,
      message: "Failed to delete document",
      error: String(error),
    };
  }
}
