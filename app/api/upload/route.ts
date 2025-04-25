import { handleUpload } from "@vercel/blob/client";
import { del } from "@vercel/blob";
import { NextResponse } from "next/server";
import { auth } from "@/auth";

// Function to validate PDF file signature
const isPdfFile = async (buffer: ArrayBuffer): Promise<boolean> => {
  // Check for PDF file signature (%PDF-)
  // Convert the first 5 bytes to a string
  const signature = new Uint8Array(buffer.slice(0, 5));
  const header = String.fromCharCode(...signature);
  return header === "%PDF-";
};

export async function POST(request: Request) {
  const session = await auth();

  // Ensure the user is authenticated
  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Clone the request to allow us to read the body multiple times
    const clonedRequest = request.clone();

    // Get body from the request first
    const body = await request.json();

    const response = await handleUpload({
      body,
      request: clonedRequest,
      token: process.env.BLOB_READ_WRITE_TOKEN,
      onBeforeGenerateToken: async (pathname) => {
        // Log the pathname being used
        console.log("Uploading file with pathname:", pathname);

        // Implement more specific validations
        return {
          allowedContentTypes: ["application/pdf"],
          maximumSizeInBytes: 10 * 1024 * 1024, // 10MB
          tokenExpiresInSeconds: 600, // 10 minutes
        };
      },
      onUploadCompleted: async ({ blob }) => {
        try {
          console.log("Upload completed", blob);

          // Additional validation can be performed here
          // For a PDF file, we could verify its structure
          const resp = await fetch(blob.url);
          if (!resp.ok) {
            console.error(`Failed to fetch uploaded file: ${resp.status} ${resp.statusText}`);
            throw new Error(`Failed to fetch uploaded file: ${resp.status} ${resp.statusText}`);
          }

          const buffer = await resp.arrayBuffer();
          const isPdf = await isPdfFile(buffer);

          if (!isPdf) {
            // If not a valid PDF, delete it from blob storage
            console.error("Uploaded file is not a valid PDF, deleting");
            await del(blob.url);
            throw new Error("Uploaded file is not a valid PDF");
          }
        } catch (error) {
          console.error("Error in onUploadCompleted:", error);
          // We can't directly affect the response from here, but we log the issue
          // and can delete invalid files
        }
      },
    });

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error during blob upload:", error);

    // Provide more detailed error information
    const errorMessage = error instanceof Error ? error.message : "Unknown error during file upload";

    return NextResponse.json(
      {
        error: "Error uploading file",
        details: errorMessage,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

export const config = {
  runtime: "edge",
};
