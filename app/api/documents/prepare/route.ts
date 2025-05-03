import { auth } from "@/auth";
import { prisma } from "@/prisma/prisma";
import { DocumentStatus } from "@prisma/client";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    // Check authentication
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { documentId, fields, signeeId, dueDate, message } = body;

    if (!documentId) {
      return NextResponse.json(
        { success: false, message: "Document ID is required" },
        { status: 400 }
      );
    }

    // Check if document exists and user has permission
    const document = await prisma.document.findUnique({
      where: { id: documentId },
    });

    if (!document) {
      return NextResponse.json(
        { success: false, message: "Document not found" },
        { status: 404 }
      );
    }

    // Check permissions (only document author or admin can prepare it)
    if (document.authorId !== session.user.id && session.user.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, message: "Not authorized to prepare this document" },
        { status: 403 }
      );
    }

    // First, delete any existing fields for this document
    await prisma.documentField.deleteMany({
      where: { documentId },
    });

    // Create new document fields
    if (fields && fields.length > 0) {
      await Promise.all(
        fields.map(async (field: any) => {
          if (!field.position) return;
          
          await prisma.documentField.create({
            data: {
              documentId,
              type: field.type,
              label: field.label,
              required: field.required,
              placeholder: field.placeholder,
              x: field.position.x,
              y: field.position.y,
              width: field.position.width,
              height: field.position.height,
              pageNumber: field.position.pageNumber,
            },
          });
        })
      );
    }

    // Update document with signee and other information
    const dueDateValue = dueDate ? new Date(dueDate) : undefined;

    const updatedDocument = await prisma.document.update({
      where: { id: documentId },
      data: {
        signeeId: signeeId || undefined,
        dueDate: dueDateValue,
        message: message || undefined,
        status: signeeId ? DocumentStatus.PENDING : undefined,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Document prepared successfully",
      document: updatedDocument,
    });
  } catch (error) {
    console.error("Error preparing document:", error);
    return NextResponse.json(
      { success: false, message: "Failed to prepare document", error: String(error) },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    // Check authentication
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get document ID from URL
    const { searchParams } = new URL(request.url);
    const documentId = searchParams.get("documentId");

    if (!documentId) {
      return NextResponse.json(
        { success: false, message: "Document ID is required" },
        { status: 400 }
      );
    }

    // Fetch document fields
    const fields = await prisma.documentField.findMany({
      where: { documentId },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json({
      success: true,
      fields,
    });
  } catch (error) {
    console.error("Error fetching document fields:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch document fields", error: String(error) },
      { status: 500 }
    );
  }
}