import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/prisma/prisma";
import { del } from "@vercel/blob";

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();

  // Ensure the user is authenticated
  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const documentId = (await params).id;

  try {
    // First, find the document to get the blob URL if it exists
    const document = await prisma.document.findUnique({
      where: { id: documentId },
      include: {
        documentSet: true,
      },
    });

    if (!document) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    // Use transaction to ensure atomicity
    await prisma.$transaction(async (tx) => {
      // Delete the document from database
      await tx.document.delete({
        where: { id: documentId },
      });

      // If document has a URL and was successfully uploaded to Vercel Blob,
      // also attempt to delete the blob to avoid orphaned files
      if (document.url) {
        try {
          // Attempt to delete the blob but don't let it block the database deletion
          await del(document.url);
          console.log(`Successfully deleted blob for document ${documentId}`);
        } catch (blobError) {
          // Log but continue - the database record removal is more critical
          console.error(`Failed to delete blob for document ${documentId}:`, blobError);
        }
      }
    });

    return NextResponse.json(
      {
        success: true,
        message: `Document ${documentId} successfully deleted`,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(`Error deleting document ${documentId}:`, error);
    return NextResponse.json(
      {
        error: "Failed to delete document",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
