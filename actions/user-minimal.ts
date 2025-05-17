"use server";

import { prisma } from "@/prisma/prisma";

/**
 * Get user by email address
 * Used for checking if a user exists when adding signers
 *
 * This is a simplified version of getUserByEmail for use in SignerManager
 */
export async function getUserByEmail(email: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
      },
    });

    return user;
  } catch (error) {
    console.error("Error getting user by email:", error);
    return null;
  }
}
