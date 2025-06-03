"use server";

import {
  ChangeNameSchema,
  ChangePasswordSchema,
  UpdateUserSchema,
  CreateUserSchema,
} from "@/schema";
import { prisma } from "@/prisma/prisma";
import bcryptjs from "bcryptjs";
import { auth } from "@/auth";
import { Role, User } from "@prisma/client";
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

type UpdateUserFormState = {
  errors?: {
    name?: string[];
    email?: string[];
    role?: string[];
  };
  message?: string | null;
  success?: boolean;
  user?: User | null;
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
 * Update user by ID
 * Only admins can update users
 */
export async function updateUser(
  userId: string,
  prevState: UpdateUserFormState,
  formData: FormData,
): Promise<UpdateUserFormState> {
  try {
    const session = await auth();

    // Check if the current user is authenticated and has admin privileges
    if (!session || !session.user || session.user.role !== Role.ADMIN) {
      return {
        success: false,
        message: "Unauthorized: Only administrators can update users.",
      };
    }

    // Validate form fields
    const validatedFields = UpdateUserSchema.safeParse({
      name: formData.get("name"),
      email: formData.get("email"),
      role: formData.get("role"),
      emailVerified: formData.get("emailVerified") === "on",
      notification: formData.get("notification") === "on",
    });

    // If form validation fails, return errors early
    if (!validatedFields.success) {
      return {
        errors: validatedFields.error.flatten().fieldErrors,
        message: "Please correct the errors in the form.",
        success: false,
      };
    }

    const { name, email, role, emailVerified, notification } =
      validatedFields.data;

    // Check if user exists
    const userExists = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!userExists) {
      return {
        success: false,
        message: "User not found.",
      };
    }

    // Check if the email is already used by another user
    if (email !== userExists.email) {
      const emailExists = await prisma.user.findUnique({
        where: { email },
      });

      if (emailExists) {
        return {
          errors: { email: ["Email already in use"] },
          message: "Email is already in use by another user.",
          success: false,
        };
      }
    }

    // Update the user
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        name,
        email,
        role: role as Role,
        emailVerified: emailVerified ? new Date() : null, // Allow unverifying users
        notification,
      },
    });

    // Revalidate the users page to refresh the list
    revalidatePath("/admin/users");

    return {
      message: "User updated successfully.",
      success: true,
      user: updatedUser,
    };
  } catch (error) {
    console.error("Error updating user:", error);
    return {
      message: "An error occurred while updating the user.",
      success: false,
    };
  }
}

/**
 * Verify user's email directly by admin
 * Only admins can verify users
 */
export async function verifyUserDirectly(userId: string) {
  try {
    const session = await auth();

    // Check if the current user is authenticated and has admin privileges
    if (!session || !session.user || session.user.role !== Role.ADMIN) {
      return {
        success: false,
        message: "Unauthorized: Only administrators can verify users.",
      };
    }

    // Check if the user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return {
        success: false,
        message: "User not found.",
      };
    }

    // Set email as verified
    await prisma.user.update({
      where: { id: userId },
      data: { emailVerified: new Date() },
    });

    // Revalidate the users page to refresh the list
    revalidatePath("/admin/users");

    return {
      success: true,
      message: "User email verified successfully.",
    };
  } catch (error) {
    console.error("Error verifying user:", error);
    return {
      success: false,
      message: "An error occurred while verifying the user.",
    };
  }
}

/**
 * Send verification email to user
 * Only admins can send verification emails
 */
export async function sendVerificationEmail(userId: string) {
  try {
    const session = await auth();

    // Check if the current user is authenticated and has admin privileges
    if (!session || !session.user || session.user.role !== Role.ADMIN) {
      return {
        success: false,
        message:
          "Unauthorized: Only administrators can send verification emails.",
      };
    }

    // Check if the user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || !user.email) {
      return {
        success: false,
        message: "User not found or has no email.",
      };
    }

    // Check if the email is already verified
    if (user.emailVerified) {
      return {
        success: false,
        message: "User's email is already verified.",
      };
    }

    // Generate a verification token
    const { generateVerificationToken } = await import("@/lib/token");
    const verificationToken = await generateVerificationToken(user.email);

    // Send the verification email
    if (verificationToken.verificationToken?.token) {
      const { sendAccountVerificationEmail } = await import("@/actions/email");
      await sendAccountVerificationEmail(
        user.name || "User",
        user.email,
        verificationToken.verificationToken.token,
      );

      return {
        success: true,
        message: "Verification email sent successfully.",
      };
    } else {
      return {
        success: false,
        message: "Failed to generate verification token.",
      };
    }
  } catch (error) {
    console.error("Error sending verification email:", error);
    return {
      success: false,
      message: "An error occurred while sending the verification email.",
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

/**
 * Create a new user
 * Only admins can create users
 */
export async function createUser(formData: FormData) {
  try {
    const session = await auth();

    // Check if the current user is authenticated and has admin privileges
    if (!session || !session.user || session.user.role !== Role.ADMIN) {
      return {
        success: false,
        message: "Unauthorized: Only administrators can create users.",
      };
    }

    // Validate form fields
    const validatedFields = CreateUserSchema.safeParse({
      name: formData.get("name"),
      email: formData.get("email"),
      password: formData.get("password"),
      role: formData.get("role"),
      emailVerified: formData.get("emailVerified") === "on",
      notification: formData.get("notification") === "on",
    });

    // If form validation fails, return errors early
    if (!validatedFields.success) {
      return {
        errors: validatedFields.error.flatten().fieldErrors,
        message: "Please correct the errors in the form.",
        success: false,
      };
    }

    const { name, email, password, role, emailVerified, notification } =
      validatedFields.data;

    // Check if user with this email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return {
        success: false,
        message: "A user with this email already exists.",
      };
    }

    // Hash the password
    const hashedPassword = await bcryptjs.hash(password, 10);

    // Create new user
    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role,
        emailVerified: emailVerified ? new Date() : null,
        notification,
      },
    });

    // Send welcome and credentials email
    const { sendAdminCreatedUserEmail, sendWelcomeEmail } = await import(
      "@/actions/email"
    );
    await sendAdminCreatedUserEmail(
      name || "User",
      email,
      password, // Send the plain text password in the email
      emailVerified === true, // Ensure it's a boolean value
    );

    // If not email verified, send verification email
    if (!emailVerified && email) {
      const { generateVerificationToken } = await import("@/lib/token");
      const verificationToken = await generateVerificationToken(email);

      if (verificationToken.verificationToken?.token) {
        const { sendAccountVerificationEmail } = await import(
          "@/actions/email"
        );
        await sendAccountVerificationEmail(
          name || "User",
          email,
          verificationToken.verificationToken.token,
        );
      }
    }

    // Also send a welcome email with general information
    await sendWelcomeEmail(name || "User", email);

    // Revalidate the users page to refresh the list
    revalidatePath("/admin/users");

    return {
      success: true,
      message: "User created successfully and emails sent.",
    };
  } catch (error) {
    console.error("Error creating user:", error);
    return {
      success: false,
      message: "An error occurred while creating the user.",
    };
  }
}
