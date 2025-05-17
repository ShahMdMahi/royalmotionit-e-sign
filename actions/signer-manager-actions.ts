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

    // Update all fields associated with this signer to use the same color scheme
    await prisma.documentField.updateMany({
      where: {
        signerId: signerId,
      },
      data: {
        color: color,
        borderColor: color,
        backgroundColor: backgroundColor,
        textColor: textColor,
      },
    });

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
