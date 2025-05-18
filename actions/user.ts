"use server";

import { ChangeNameSchema, ChangePasswordSchema } from "@/schema";
import { prisma } from "@/prisma/prisma";
import bcryptjs from "bcryptjs";
import { auth } from "@/auth";
import { Role } from "@prisma/client";
import { revalidatePath } from "next/cache";

// Types for form states
type ChangeNameFormState = {
  errors?: {
    name?: string[];
    password?: string[];
  };
  message?: string | null;
  success?: boolean;
};

type ChangePasswordFormState = {
  errors?: {
    currentPassword?: string[];
    newPassword?: string[];
    confirmNewPassword?: string[];
  };
  message?: string | null;
  success?: boolean;
};

type ChangeNotificationSettingsState = {
  message?: string | null;
  success?: boolean;
};

/**
 * Change user's name
 */
export async function changeName(
  prevState: ChangeNameFormState,
  formData: FormData,
): Promise<ChangeNameFormState> {
  // Validate form fields
  const validatedFields = ChangeNameSchema.safeParse({
    name: formData.get("name"),
    password: formData.get("password"),
  });

  // If form validation fails, return errors early
  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: "Please correct the errors in the form.",
      success: false,
    };
  }

  const { name, password } = validatedFields.data;

  try {
    // Get the current user session
    const session = await auth();

    if (!session || !session.user || !session.user.email) {
      return {
        message: "You must be logged in to change your name.",
        success: false,
      };
    }

    const email = session.user.email;

    // Find the user in the database
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return {
        message: "User not found.",
        success: false,
      };
    }

    // Check if the password is correct
    if (user.password) {
      const isPasswordValid = await bcryptjs.compare(password, user.password);
      if (!isPasswordValid) {
        return {
          errors: { password: ["Invalid password"] },
          message: "Invalid password",
          success: false,
        };
      }
    } else {
      return {
        message: "Cannot change name. User has no password set.",
        success: false,
      };
    }

    // Update the user's name
    await prisma.user.update({
      where: { email },
      data: { name },
    });

    return {
      message: "Name changed successfully.",
      success: true,
    };
  } catch (error) {
    console.error("Name change error:", error);
    return {
      message: "An error occurred while changing your name. Please try again.",
      success: false,
    };
  }
}

/**
 * Change user's password
 */
export async function changePassword(
  prevState: ChangePasswordFormState,
  formData: FormData,
): Promise<ChangePasswordFormState> {
  // Validate form fields
  const validatedFields = ChangePasswordSchema.safeParse({
    currentPassword: formData.get("currentPassword"),
    newPassword: formData.get("newPassword"),
    confirmNewPassword: formData.get("confirmNewPassword"),
  });

  // If form validation fails, return errors early
  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: "Please correct the errors in the form.",
      success: false,
    };
  }

  const { currentPassword, newPassword } = validatedFields.data;

  try {
    // Get the current user session
    const session = await auth();

    if (!session || !session.user || !session.user.email) {
      return {
        message: "You must be logged in to change your password.",
        success: false,
      };
    }

    const email = session.user.email;

    // Find the user in the database
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return {
        message: "User not found.",
        success: false,
      };
    }

    // Check if the current password is correct
    if (user.password) {
      const isCurrentPasswordValid = await bcryptjs.compare(
        currentPassword,
        user.password,
      );
      if (!isCurrentPasswordValid) {
        return {
          errors: { currentPassword: ["Current password is incorrect"] },
          message: "Current password is incorrect",
          success: false,
        };
      }
    } else {
      return {
        message: "Cannot change password. User has no password set.",
        success: false,
      };
    }

    // Hash the new password
    const hashedPassword = await bcryptjs.hash(newPassword, 10);

    // Update the user's password
    await prisma.user.update({
      where: { email },
      data: { password: hashedPassword },
    });

    return {
      message: "Password changed successfully.",
      success: true,
    };
  } catch (error) {
    console.error("Password change error:", error);
    return {
      message:
        "An error occurred while changing your password. Please try again.",
      success: false,
    };
  }
}

/**
 * Change notification settings
 */
export async function changeNotificationSettings(
  status: boolean,
): Promise<ChangeNotificationSettingsState> {
  try {
    const session = await auth();

    if (!session || !session.user || !session.user.id) {
      return {
        message: "You must be logged in to change your notification settings.",
        success: false,
      };
    }

    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: { notification: status },
    });

    if (!updatedUser) {
      return {
        message: "Failed to update notification settings.",
        success: false,
      };
    }

    return {
      message: "Notification settings updated successfully.",
      success: true,
    };
  } catch (error) {
    console.error("Notification settings error:", error);
    return {
      message:
        "An error occurred while changing your notification settings. Please try again.",
      success: false,
    };
  }
}

/**
 * Get user by email address
 * Used for checking if a user exists when adding signers
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
        createdAt: true,
      },
    });

    return {
      success: true,
      user,
    };
  } catch (error) {
    console.error("Error getting user by email:", error);
    return {
      success: false,
      message: "Error retrieving user information",
    };
  }
}

/**
 * Delete user by ID
 * Only admins can delete users
 */
export async function deleteUser(userId: string) {
  try {
    const session = await auth();

    // Check if the current user is authenticated and has admin privileges
    if (!session || !session.user || session.user.role !== Role.ADMIN) {
      return {
        success: false,
        message: "Unauthorized: Only administrators can delete users.",
      };
    }

    // Check if the user exists
    const userToDelete = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!userToDelete) {
      return {
        success: false,
        message: "User not found.",
      };
    }

    // Don't allow admins to delete themselves
    if (userToDelete.id === session.user.id) {
      return {
        success: false,
        message: "You cannot delete your own account.",
      };
    }

    // Delete the user
    await prisma.user.delete({
      where: { id: userId },
    });

    // Revalidate the users page to refresh the list
    revalidatePath("/admin/users");

    return {
      success: true,
      message: "User deleted successfully.",
    };
  } catch (error) {
    console.error("Error deleting user:", error);
    return {
      success: false,
      message: "An error occurred while deleting the user.",
    };
  }
}
