import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/prisma/prisma";
import { DocumentStatus } from "@prisma/client";

export async function POST(request: NextRequest): Promise<NextResponse> {
  const session = await auth();

  // Ensure the user is authenticated
  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Parse the request body
    const { documentId, pathname, contentType, contentDisposition, url, downloadUrl } = await request.json();

    // Validate required fields with more detailed errors
    const missingFields = [];
    if (!documentId) missingFields.push("documentId");
    if (!url) missingFields.push("url");
    if (!downloadUrl) missingFields.push("downloadUrl");
    if (!pathname) missingFields.push("pathname");

    if (missingFields.length > 0) {
      console.error(`Missing required fields: ${missingFields.join(", ")}`);
      return NextResponse.json(
        {
          error: `Required fields missing: ${missingFields.join(", ")}`,
        },
        { status: 400 }
      );
    }

    // Log all inputs for debugging
    console.log("Document update request:", {
      documentId,
      pathname,
      contentType,
      contentDisposition,
    });

    // Use transaction for document update to ensure consistency
    const document = await prisma
      .$transaction(async (tx) => {
        // First check if document exists
        const existingDocument = await tx.document.findUnique({
          where: { id: documentId },
        });

        if (!existingDocument) {
          throw new Error(`Document with ID ${documentId} not found`);
        }

        // Update the document with the provided ID
        return tx.document.update({
          where: {
            id: documentId,
          },
          data: {
            pathname,
            contentType,
            contentDisposition,
            url,
            downloadUrl,
            status: DocumentStatus.PENDING, // Ensure correct status after successful upload
          },
        });
      })
      .catch((error) => {
        if (error.message.includes("not found")) {
          return null;
        }
        throw error;
      });

    if (!document) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    return NextResponse.json(
      {
        success: true,
        document,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating document:", error);
    // Return more detailed error information for debugging
    return NextResponse.json(
      {
        error: "Error updating document",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
