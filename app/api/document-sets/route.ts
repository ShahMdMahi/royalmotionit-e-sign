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

    // Validate required fields
    if (!name) {
      return NextResponse.json({ error: "Document set name is required" }, { status: 400 });
    }

    // Create the document set in the database
    const documentSet = await prisma.documentSet.create({
      data: {
        name,
      },
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
    return NextResponse.json({ error: "Error creating document set" }, { status: 500 });
  }
}
