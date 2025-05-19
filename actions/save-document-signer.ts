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
      // Look up user by email to connect the signer to their account
      const existingUser = await prisma.user.findUnique({
        where: { email: signer.email.toLowerCase() },
        select: { id: true },
      });

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
          // Connect to existing user if found
          userId: existingUser?.id || null,
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

      // Look up user by email to connect the signer to their account
      const existingUser = await prisma.user.findUnique({
        where: { email: signer.email.toLowerCase() },
        select: { id: true },
      });

      savedSigner = await prisma.signer.create({
        data: {
          id: signerId,
          documentId: signer.documentId,
          email: signer.email,
          name: signer.name,
          role: signer.role,
          status: signer.status || "PENDING",
          userAgent: signer.color, // Store color
          // Connect to existing user if found
          userId: existingUser?.id || null,
        },
      });

      console.log(
        `Created new signer ${savedSigner.id} for document ${signer.documentId}`,
      );

      // Update any existing fields to use this signer
      const documentFields = await prisma.documentField.findMany({
        where: { documentId: signer.documentId },
      });

      // Update signature/initial fields and any required fields to use this signer
      const fieldsToUpdate = documentFields.filter(
        (field) =>
          ["signature", "initial"].includes(field.type) || field.required,
      );

      if (fieldsToUpdate.length > 0) {
        for (const field of fieldsToUpdate) {
          await prisma.documentField.update({
            where: { id: field.id },
            data: { signerId: savedSigner.id },
          });
        }
        console.log(
          `Assigned ${fieldsToUpdate.length} fields to new signer ${savedSigner.id}`,
        );
      }
    }

    // Revalidate paths
    revalidatePath(`/documents/${signer.documentId}`);
    revalidatePath(`/documents/${signer.documentId}/edit`);
    revalidatePath(`/admin/documents/${signer.documentId}/edit`);

    // Get document and author details for email notification
    const documentWithAuthor = await prisma.document.findUnique({
      where: { id: signer.documentId },
      include: { author: true },
    });

    // Send email notification to the signer if document exists
    if (documentWithAuthor) {
      try {
        // Import the sendDocumentSignRequestEmail to avoid circular dependencies
        const { sendDocumentSignRequestEmail } = await import(
          "@/actions/email"
        );

        // Send focused document signing email without account credentials
        await sendDocumentSignRequestEmail(
          savedSigner.name || "Signer",
          savedSigner.email,
          documentWithAuthor.title,
          signer.documentId,
          "You have been assigned to sign this document. Please review and sign it at your earliest convenience.",
          documentWithAuthor.author?.name || "Document Owner",
          documentWithAuthor.author?.email || "",
        );

        // Update the notifiedAt timestamp
        await prisma.signer.update({
          where: { id: savedSigner.id },
          data: { notifiedAt: new Date() },
        });

        console.log(
          `Sent signing notification email to ${savedSigner.email} for document ${signer.documentId}`,
        );
      } catch (emailError) {
        console.error("Error sending signer notification email:", emailError);
        // Non-fatal error, continue with the flow
      }
    }

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
