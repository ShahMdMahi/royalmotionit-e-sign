import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/prisma/prisma";
import { DocumentStatus, DocumentType } from "@prisma/client";

export async function POST(request: NextRequest): Promise<NextResponse> {
  const session = await auth();

  // Ensure the user is authenticated
  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Parse the request body
    const { title, description, documentSetId } = await request.json();

    // Validate required fields with more detailed errors
    const missingFields = [];
    if (!title) missingFields.push("title");
    if (!documentSetId) missingFields.push("documentSetId");

    if (missingFields.length > 0) {
      console.error(`Missing required fields: ${missingFields.join(", ")}`);
      return NextResponse.json(
        {
          error: `Required fields missing: ${missingFields.join(", ")}`,
          fields: {
            title,
            documentSetId,
          },
        },
        { status: 400 }
      );
    }

    // Verify document set exists
    const documentSet = await prisma.documentSet.findUnique({
      where: { id: documentSetId },
    });

    if (!documentSet) {
      return NextResponse.json({ error: "Document set not found" }, { status: 404 });
    }

    // Create a placeholder document entry - actual file details will be updated later
    const document = await prisma.document.create({
      data: {
        title,
        description: description || "",
        pathname: "",
        contentType: "application/pdf",
        contentDisposition: "",
        url: "",
        downloadUrl: "",
        status: DocumentStatus.PENDING,
        authorId: session.user.id,
        documentSetId,
        documentType: DocumentType.UNSIGNED,
      },
    });

    return NextResponse.json(
      {
        success: true,
        document,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating document entry:", error);
    return NextResponse.json({ error: "Error creating document entry", details: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}
