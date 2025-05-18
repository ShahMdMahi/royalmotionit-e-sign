"use server";

import { prisma } from "@/prisma/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { Signer } from "@/types/document";

/**
 * Update signer color and apply it to associated fields
 * Enhanced with better field styling consistency
 *
 * @param signerId The ID of the signer
 * @param color The color to assign to the signer
 * @returns The updated signer with color
 */
export async function handleSignerFieldsUpdate(
  signerId: string,
  color: string,
) {
  try {
    const session = await auth();

    if (!session || !session.user.id) {
      throw new Error("You must be logged in to perform this action");
    }

    // If signerId is empty, clear associations for all signature fields
    if (!signerId) {
      // Find all documents created by this user
      const documents = await prisma.document.findMany({
        where: {
          authorId: session.user.id,
        },
        select: {
          id: true,
        },
      });

      const documentIds = documents.map((doc) => doc.id);

      // Clear signer associations for signature fields in user's documents
      await prisma.documentField.updateMany({
        where: {
          documentId: { in: documentIds },
          type: { in: ["signature", "initial"] },
        },
        data: {
          signerId: null,
        },
      });

      return { signerId: "", color: "" };
    }

    // Validate the color format (ensure it's a valid hex color)
    if (!color.match(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/)) {
      throw new Error("Invalid color format. Please use a valid hex color.");
    }

    // Get the signer first to check permissions
    const signer = await prisma.signer.findUnique({
      where: {
        id: signerId,
      },
      include: {
        document: {
          select: {
            authorId: true,
          },
        },
      },
    });

    if (!signer) {
      throw new Error("Signer not found");
    }

    // Security check: Only document author can update signer properties
    if (signer.document.authorId !== session.user.id) {
      throw new Error("You don't have permission to modify this signer");
    }

    // Update signer color in the database
    const updatedSigner = await prisma.signer.update({
      where: {
        id: signerId,
      },
      data: {
        // Store color in a custom field like userAgent since we don't have a color field directly
        userAgent: color,
      },
    });

    // Import color utility for contrast calculation
    const { getContrastingTextColor } = await import("@/utils/color-utils");
    const textColor = getContrastingTextColor(color);

    // Calculate a lighter version for the background (20% opacity)
    const backgroundColor = color + "20"; // Hex with alpha

    // Find signature and initial fields that need to be associated with this signer
    const signatureFields = await prisma.documentField.findMany({
      where: {
        documentId: signer.documentId,
        type: {
          in: ["signature", "initial"],
        },
      },
    });

    console.log(
      `Found ${signatureFields.length} signature fields to update for signer ${signerId}`,
    );

    // Verify we have signature fields to update
    if (signatureFields.length === 0) {
      console.log(
        `Warning: No signature fields found for document ${signer.documentId}`,
      );
    }

    // Update signature and initial fields to be associated with this signer
    for (const field of signatureFields) {
      console.log(
        `Updating field ${field.id} to associate with signer ${signerId}`,
      );
      await prisma.documentField.update({
        where: {
          id: field.id,
        },
        data: {
          signerId: signerId,
          color: color,
          borderColor: color,
          backgroundColor: backgroundColor,
          textColor: textColor,
        },
      });
    }

    // Find required fields that should also be associated with this signer
    const requiredFields = await prisma.documentField.findMany({
      where: {
        documentId: signer.documentId,
        required: true,
        type: {
          notIn: ["signature", "initial"], // Exclude signature fields which we already handled
        },
      },
    });

    if (requiredFields.length > 0) {
      console.log(
        `Found ${requiredFields.length} required fields to associate with signer ${signerId}`,
      );

      // Update required fields with signer ID and appropriate styling
      for (const field of requiredFields) {
        await prisma.documentField.update({
          where: {
            id: field.id,
          },
          data: {
            signerId: signerId,
            // Apply more subtle styling for non-signature fields
            borderColor: color,
          },
        });
      }
    }

    // Find any fields that might be associated with a different signer
    // This helps clean up any misconfigurations
    const misconfiguredFields = await prisma.documentField.findMany({
      where: {
        documentId: signer.documentId,
        signerId: {
          not: null,
        },
        NOT: {
          signerId: signerId,
        },
      },
    });

    if (misconfiguredFields.length > 0) {
      console.log(
        `Found ${misconfiguredFields.length} fields with wrong signer associations`,
      );

      // Fix signer IDs for misconfigured fields
      for (const field of misconfiguredFields) {
        await prisma.documentField.update({
          where: {
            id: field.id,
          },
          data: {
            signerId: signerId,
          },
        });
      }

      console.log(
        `Fixed signer assignment for ${misconfiguredFields.length} misconfigured fields`,
      );
    }

    // Get the document ID to revalidate paths
    const signerInfo = await prisma.signer.findUnique({
      where: {
        id: signerId,
      },
      select: {
        documentId: true,
      },
    });

    if (signerInfo) {
      revalidatePath(`/documents/${signerInfo.documentId}`);
      revalidatePath(`/documents/${signerInfo.documentId}/edit`);
    }

    return { signerId, color };
  } catch (error) {
    console.error("Error updating signer color:", error);
    throw error;
  }
}
