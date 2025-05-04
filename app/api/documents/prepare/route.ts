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
    const { documentId, fields, signeeId, dueDate, message, expiryDays } = body;

    if (!documentId) {
      return NextResponse.json(
        { success: false, message: "Document ID is required" },
        { status: 400 }
      );
    }

    // Check if document exists and user has permission
    const document = await prisma.document.findUnique({
      where: { id: documentId },
      include: {
        author: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
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

    // Basic validation for fields
    if (fields && !Array.isArray(fields)) {
      return NextResponse.json(
        { success: false, message: "Fields must be an array" },
        { status: 400 }
      );
    }

    // First, delete any existing fields for this document
    await prisma.documentField.deleteMany({
      where: { documentId },
    });

    // Create new document fields with proper validation
    if (fields && fields.length > 0) {
      try {
        await Promise.all(
          fields.map(async (field: any) => {
            if (!field.position) {
              console.warn(`Field without position skipped: ${field.type} - ${field.label}`);
              return;
            }
            
            // Ensure field has valid values with defaults where needed
            await prisma.documentField.create({
              data: {
                documentId,
                type: field.type || "text",
                label: field.label || "Untitled Field",
                required: Boolean(field.required),
                placeholder: field.placeholder || "",
                x: Math.max(0, Number(field.position.x) || 0),
                y: Math.max(0, Number(field.position.y) || 0),
                width: Math.max(20, Number(field.position.width) || 150),
                height: Math.max(20, Number(field.position.height) || 40),
                pageNumber: Math.max(1, Number(field.position.pageNumber) || 1),
              },
            });
          })
        );
      } catch (fieldError) {
        console.error("Error creating document fields:", fieldError);
        return NextResponse.json(
          { 
            success: false, 
            message: "Error creating document fields", 
            error: String(fieldError) 
          },
          { status: 500 }
        );
      }
    }

    // Update document with signee and other information
    const dueDateValue = dueDate ? new Date(dueDate) : undefined;
    
    // Get the signee information if provided
    let signee = null;
    if (signeeId) {
      signee = await prisma.user.findUnique({
        where: { id: signeeId },
        select: {
          id: true,
          email: true,
          name: true,
        },
      });
      
      if (!signee) {
        return NextResponse.json(
          { success: false, message: "Signee not found" },
          { status: 400 }
        );
      }
    }

    const updatedDocument = await prisma.document.update({
      where: { id: documentId },
      data: {
        signeeId: signeeId || undefined,
        dueDate: dueDateValue,
        message: message || undefined,
        status: signeeId ? DocumentStatus.PENDING : undefined,
        preparedAt: new Date(), // Using the field now properly defined in the schema
        expiresInDays: expiryDays || undefined, // Using the expiresInDays field now defined in schema
      },
      include: {
        signee: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    });

    // If a signee is assigned and there are fields, send an email notification
    if (signee && fields && fields.length > 0) {
      try {
        // Email notification logic would go here
        // You could import a sendEmail function from your actions/email.ts file
        console.log(`Document ready for signing notification would be sent to: ${signee.email}`);
      } catch (emailError) {
        console.error("Error sending email notification:", emailError);
        // Continue with success response even if email fails
      }
    }

    return NextResponse.json({
      success: true,
      message: signeeId 
        ? "Document prepared successfully and sent for signature"
        : "Document prepared successfully",
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

    // Check document permissions
    const document = await prisma.document.findUnique({
      where: { id: documentId },
    });

    if (!document) {
      return NextResponse.json(
        { success: false, message: "Document not found" },
        { status: 404 }
      );
    }

    // Only document author or admin can view fields
    if (document.authorId !== session.user.id && session.user.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, message: "Not authorized to view this document's fields" },
        { status: 403 }
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
      document: {
        id: document.id,
        signeeId: document.signeeId,
        dueDate: document.dueDate,
        message: document.message,
        status: document.status,
      }
    });
  } catch (error) {
    console.error("Error fetching document fields:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch document fields", error: String(error) },
      { status: 500 }
    );
  }
}