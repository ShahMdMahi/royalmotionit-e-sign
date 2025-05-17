"use server";

import { DocumentField } from "@/types/document";
import { prisma } from "@/prisma/prisma";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";

// Original wrapper functions
export async function handleFieldDragEnd(id: string, x: number, y: number) {
  // Wrapper for client component actions
  return { id, x: Number(x), y: Number(y) };
}

export async function handleFieldResize(
  id: string,
  width: number,
  height: number,
) {
  // Wrapper for client component actions
  return { id, width: Number(width), height: Number(height) };
}

export async function handleFieldSelect(field: DocumentField | null) {
  // Wrapper for client component actions
  return field;
}

export async function handleFieldDelete(fieldId: string) {
  // Wrapper for client component actions
  return fieldId;
}

/**
 * Create a new document field in the database
 * @param field Field data to create
 */
export async function createField(field: Partial<DocumentField>) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return {
        success: false,
        message: "Authentication required",
      };
    }

    // Get the document to ensure user can edit it
    const document = await prisma.document.findFirst({
      where: {
        id: field.documentId as string,
        authorId: session.user.id,
      },
    });

    if (!document) {
      return {
        success: false,
        message: "Document not found or you don't have permission",
      };
    }

    // Create the field with explicit numeric type conversion
    const newField = await prisma.documentField.create({
      data: {
        type: field.type!,
        label: field.label!,
        required: field.required ?? false,
        placeholder: field.placeholder,
        x: Number(field.x),
        y: Number(field.y),
        width: Number(field.width),
        height: Number(field.height),
        pageNumber: Number(field.pageNumber),
        document: { connect: { id: field.documentId! } },
        value: field.value,
        color: field.color,
        fontFamily: field.fontFamily,
        fontSize: field.fontSize ? Number(field.fontSize) : undefined,
        validationRule: field.validationRule,
        conditionalLogic: field.conditionalLogic,
        options: field.options,
        backgroundColor: field.backgroundColor,
        borderColor: field.borderColor,
        textColor: field.textColor,
      },
    });

    // Revalidate both the document page and API routes
    revalidatePath(`/documents/${field.documentId}`);

    return {
      success: true,
      field: newField,
    };
  } catch (error) {
    console.error("Error creating field:", error);
    return {
      success: false,
      message: "Failed to create field",
      error: String(error),
    };
  }
}

/**
 * Update an existing document field in the database
 * @param field Field data to update
 */
export async function updateField(field: DocumentField) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return {
        success: false,
        message: "Authentication required",
      };
    }

    // Get the document to ensure user can edit it
    const document = await prisma.document.findFirst({
      where: {
        id: field.documentId,
        authorId: session.user.id,
      },
    });

    if (!document) {
      return {
        success: false,
        message: "Document not found or you don't have permission",
      };
    }

    // Update the field with explicit numeric conversions for consistent types
    const updatedField = await prisma.documentField.update({
      where: {
        id: field.id,
      },
      data: {
        label: field.label,
        required: field.required,
        placeholder: field.placeholder,
        x: Number(field.x),
        y: Number(field.y),
        width: Number(field.width),
        height: Number(field.height),
        pageNumber: Number(field.pageNumber),
        value: field.value,
        color: field.color,
        fontFamily: field.fontFamily,
        fontSize: field.fontSize ? Number(field.fontSize) : undefined,
        validationRule: field.validationRule,
        conditionalLogic: field.conditionalLogic,
        options: field.options,
        backgroundColor: field.backgroundColor,
        borderColor: field.borderColor,
        textColor: field.textColor,
      },
    });

    // Revalidate paths
    revalidatePath(`/documents/${field.documentId}`);

    return {
      success: true,
      field: updatedField,
    };
  } catch (error) {
    console.error("Error updating field:", error);
    return {
      success: false,
      message: "Failed to update field",
      error: String(error),
    };
  }
}

/**
 * Delete a document field from the database
 * @param fieldId Field ID to delete
 * @param documentId Document ID for revalidation
 */
export async function deleteField(fieldId: string, documentId: string) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return {
        success: false,
        message: "Authentication required",
      };
    }

    // Get the field with document to ensure user can delete it
    const field = await prisma.documentField.findFirst({
      where: {
        id: fieldId,
      },
      include: {
        document: true,
      },
    });

    if (!field || field.document.authorId !== session.user.id) {
      return {
        success: false,
        message: "Field not found or you don't have permission",
      };
    }

    // Delete the field
    await prisma.documentField.delete({
      where: {
        id: fieldId,
      },
    });

    // Revalidate paths
    revalidatePath(`/documents/${documentId}`);

    return {
      success: true,
    };
  } catch (error) {
    console.error("Error deleting field:", error);
    return {
      success: false,
      message: "Failed to delete field",
      error: String(error),
    };
  }
}
