import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/prisma/prisma";

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

    // Update the document with the provided ID directly
    const document = await prisma.document.update({
      where: {
        id: documentId,
      },
      data: {
        pathname,
        contentType,
        contentDisposition,
        url,
        downloadUrl,
      },
    });

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
