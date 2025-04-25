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
    const { name } = await request.json();

    // Validate required fields with detailed errors
    if (!name || name.trim() === "") {
      return NextResponse.json(
        {
          error: "Document set name is required",
          details: "Please provide a non-empty name for the document set",
        },
        { status: 400 }
      );
    }

    // Use transaction to ensure atomicity
    const documentSet = await prisma
      .$transaction(async (tx) => {
        // Check if a document set with the same name already exists
        const existingSet = await tx.documentSet.findFirst({
          where: { name: { equals: name, mode: "insensitive" } },
        });

        if (existingSet) {
          throw new Error(`A document set with name "${name}" already exists`);
        }

        // Create the document set in the database
        return tx.documentSet.create({
          data: {
            name,
          },
        });
      })
      .catch((error) => {
        // Handle specific transaction errors
        if (error.message && error.message.includes("already exists")) {
          throw error; // Re-throw for specific handling
        }
        // For other DB errors
        console.error("Database transaction failed:", error);
        throw new Error("Failed to create document set due to database error");
      });

    return NextResponse.json(
      {
        success: true,
        documentSet,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating document set:", error);

    // Return more specific error messages based on error type
    if (error instanceof Error && error.message.includes("already exists")) {
      return NextResponse.json(
        {
          error: "Duplicate document set",
          details: error.message,
        },
        { status: 409 }
      );
    }

    return NextResponse.json(
      {
        error: "Error creating document set",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
