import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/prisma/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await auth();

    // User must be logged in
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 },
      );
    }

    // Safely get the document ID from params
    const { id: documentId } = await Promise.resolve(params);

    // Check if document exists and user has permission
    const document = await prisma.document.findFirst({
      where: {
        id: documentId,
        authorId: session.user.id,
      },
    });

    if (!document) {
      return NextResponse.json(
        { error: "Document not found or you don't have permission" },
        { status: 404 },
      );
    }

    // Get the document's signer
    // Currently we only support one signer per document
    const signer = await prisma.signer.findFirst({
      where: {
        documentId,
      },
    });

    return NextResponse.json({ signer });
  } catch (error) {
    console.error("Error fetching document signer:", error);
    return NextResponse.json(
      { error: "Failed to fetch document signer" },
      { status: 500 },
    );
  }
}
