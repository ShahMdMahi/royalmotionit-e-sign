"use server";

import { ChangeNameSchema, ChangePasswordSchema } from "@/schema";
import { prisma } from "@/prisma/prisma";
import bcryptjs from "bcryptjs";
import { auth } from "@/auth";
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

/**
 * Change user's name
 */
export async function changeName(prevState: ChangeNameFormState, formData: FormData): Promise<ChangeNameFormState> {
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
export async function changePassword(prevState: ChangePasswordFormState, formData: FormData): Promise<ChangePasswordFormState> {
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
      const isCurrentPasswordValid = await bcryptjs.compare(currentPassword, user.password);
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
      message: "An error occurred while changing your password. Please try again.",
      success: false,
    };
  }
}
