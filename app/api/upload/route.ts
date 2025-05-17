import { NextRequest, NextResponse } from "next/server";
import { S3ServiceException } from "@aws-sdk/client-s3";
import { uploadFileToR2, deleteFromR2 } from "@/actions/r2";
import { auth } from "@/auth";
import { prisma } from "@/prisma/prisma";
import { Prisma } from "@prisma/client";
import crypto from "crypto";
import { revalidatePath } from "next/cache";

// Define constants for request limits and validation
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_FILE_TYPES = ["application/pdf"];
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 500;
// Rate limiting: max uploads per user per minute
const MAX_UPLOADS_PER_MINUTE = 5;
// Implement in-memory store for rate limiting (in production, use Redis)
const uploadAttempts = new Map<string, { count: number; resetAt: number }>();

/**
 * Validate file integrity before uploading
 * @param file File to check
 * @returns Object with validation result and optional error message
 */
async function validateFileIntegrity(
  file: File,
): Promise<{ valid: boolean; error?: string }> {
  try {
    // For PDFs, check for the magic number signature in header
    if (file.type === "application/pdf") {
      const slice = await file.slice(0, 5).arrayBuffer();
      const header = Buffer.from(slice).toString("ascii");

      // PDF files start with '%PDF-'
      if (!header.startsWith("%PDF-")) {
        return {
          valid: false,
          error: "Invalid PDF file: Missing PDF header signature",
        };
      }

      // For extra validation, we could check for EOF marker too
      // But for performance reasons, we'll skip it for now
    }

    // File passed integrity checks
    return { valid: true };
  } catch (error) {
    console.error("File validation error:", error);
    return {
      valid: false,
      error: "Failed to validate file integrity",
    };
  }
}

/**
 * Calculate hash/checksum of a file
 * This can be used to verify file integrity and detect duplicates
 */
async function calculateFileHash(file: File): Promise<string> {
  return new Promise(async (resolve, reject) => {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const hash = crypto.createHash("sha256");
      hash.update(buffer);
      resolve(hash.digest("hex"));
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Check and enforce rate limits for uploads
 * @param userId User ID to check
 * @returns Object indicating if rate limit is exceeded
 */
function checkRateLimit(userId: string): {
  allowed: boolean;
  resetIn?: number;
} {
  const now = Date.now();
  const resetTime = now + 60000; // 1 minute from now
  const userAttempts = uploadAttempts.get(userId);

  // If no previous attempts or reset time has passed
  if (!userAttempts || now > userAttempts.resetAt) {
    uploadAttempts.set(userId, { count: 1, resetAt: resetTime });
    return { allowed: true };
  }

  // If under the limit, increment count
  if (userAttempts.count < MAX_UPLOADS_PER_MINUTE) {
    uploadAttempts.set(userId, {
      count: userAttempts.count + 1,
      resetAt: userAttempts.resetAt,
    });
    return { allowed: true };
  }

  // Rate limit exceeded
  const resetIn = Math.ceil((userAttempts.resetAt - now) / 1000);
  return {
    allowed: false,
    resetIn,
  };
}

/**
 * Helper function to implement retry logic with exponential backoff
 */
async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = MAX_RETRIES,
  initialDelay: number = RETRY_DELAY_MS,
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Don't retry on certain errors
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        // P2002 is a unique constraint violation - no point retrying
        if (error.code === "P2002") throw error;
      }

      if (attempt < maxRetries) {
        const delay = initialDelay * Math.pow(2, attempt);
        console.log(
          `Retrying operation after ${delay}ms (attempt ${attempt + 1}/${maxRetries})`,
        );
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError || new Error("Operation failed after maximum retries");
}

/**
 * Clean up resources if the upload process fails
 */
async function cleanupOnFailure(
  documentId: string | null,
  r2ObjectKey: string | null,
) {
  try {
    // Delete the document record if it was created
    if (documentId) {
      await prisma.document
        .delete({
          where: { id: documentId },
        })
        .catch((err) =>
          console.error(`Failed to delete document ${documentId}:`, err),
        );
    }

    // Delete the R2 object if it exists
    if (r2ObjectKey) {
      await deleteFromR2({
        Bucket: process.env.R2_BUCKET_NAME,
        Key: r2ObjectKey,
      }).catch((err) =>
        console.error(`Failed to delete R2 object ${r2ObjectKey}:`, err),
      );
    }
  } catch (error) {
    console.error("Error in cleanup process:", error);
  }
}

export async function POST(req: NextRequest) {
  let createdDocumentId: string | null = null;
  let uploadedObjectKey: string | null = null;

  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json(
        {
          success: false,
          error: true,
          message: "Unauthorized",
        },
        { status: 401 },
      );
    }
    if (!session.user) {
      return NextResponse.json(
        {
          success: false,
          error: true,
          message: "User not found",
        },
        { status: 401 },
      );
    }

    // Check rate limits
    const rateLimit = checkRateLimit(session.user.id);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: true,
          message: `Rate limit exceeded. Try again in ${rateLimit.resetIn} seconds.`,
        },
        { status: 429 },
      );
    }

    // Check if request is too large (10MB limit)
    const contentLength = req.headers.get("content-length");
    if (contentLength && parseInt(contentLength) > MAX_FILE_SIZE) {
      return NextResponse.json(
        {
          success: false,
          error: true,
          message: `File too large (max ${MAX_FILE_SIZE / 1024 / 1024}MB)`,
        },
        { status: 413 },
      );
    }

    // Validate content type
    const contentType = req.headers.get("content-type");
    if (!contentType || !contentType.includes("multipart/form-data")) {
      return NextResponse.json(
        {
          success: false,
          error: true,
          message: "Invalid request format. Expected multipart/form-data",
        },
        { status: 400 },
      );
    }

    // Parse form data with error handling
    let formData: FormData;
    try {
      formData = await req.formData();
    } catch (formError) {
      console.error("Form data parsing error:", formError);
      return NextResponse.json(
        {
          success: false,
          error: true,
          message: "Failed to parse form data",
          details:
            formError instanceof Error
              ? formError.message
              : "Unknown parsing error",
        },
        { status: 400 },
      );
    }

    // Extract and validate file and fileName
    const file = formData.get("file");
    const fileName = formData.get("fileName");
    const description = formData.get("description") as string | null;

    // Type checking for file
    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        {
          success: false,
          error: true,
          message: "Valid file is required",
        },
        { status: 400 },
      );
    }

    // Type checking and validation for fileName
    if (!fileName || typeof fileName !== "string" || fileName.trim() === "") {
      return NextResponse.json(
        {
          success: false,
          error: true,
          message: "Valid file name is required",
        },
        { status: 400 },
      );
    }

    // Check file size again (double validation)
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        {
          success: false,
          error: true,
          message: `File too large (max ${MAX_FILE_SIZE / 1024 / 1024}MB)`,
        },
        { status: 413 },
      );
    }

    // Validate file type against allowed types
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      return NextResponse.json(
        {
          success: false,
          error: true,
          message: `Invalid file type: ${file.type}. Allowed types: ${ALLOWED_FILE_TYPES.join(", ")}`,
        },
        { status: 400 },
      );
    }

    // Validate file integrity
    const integrityCheck = await validateFileIntegrity(file);
    if (!integrityCheck.valid) {
      return NextResponse.json(
        {
          success: false,
          error: true,
          message: integrityCheck.error || "File integrity validation failed",
        },
        { status: 400 },
      );
    }

    // Calculate file hash
    const fileHash = await calculateFileHash(file);

    // Create a document record with retry logic
    const newDocument = await withRetry(async () => {
      return await prisma.document.create({
        data: {
          title: fileName,
          description: description || undefined,
          authorId: session.user!.id,
          hash: fileHash,
        },
      });
    });

    createdDocumentId = newDocument.id;

    if (!newDocument.id) {
      return NextResponse.json(
        {
          success: false,
          error: true,
          message: "Failed to create document record",
        },
        { status: 500 },
      );
    }

    // Create a unique and sanitized file key
    const sanitizedFileName = fileName.trim().replace(/[^\w\s.-]/g, "_");
    const key = `documents/${newDocument.id}`;
    uploadedObjectKey = key;

    // Convert file to buffer with error handling
    let buffer: Buffer;
    try {
      const arrayBuffer = await file.arrayBuffer();
      buffer = Buffer.from(arrayBuffer);
    } catch (bufferError) {
      console.error("File buffer error:", bufferError);
      await cleanupOnFailure(createdDocumentId, null);
      return NextResponse.json(
        {
          success: false,
          error: true,
          message: "Failed to process file data",
          details:
            bufferError instanceof Error
              ? bufferError.message
              : "Unknown buffer error",
        },
        { status: 500 },
      );
    }

    // Use the enhanced uploadFileToR2 function from actions/r2.ts with retry logic
    const uploadResult = await withRetry(
      () => uploadFileToR2(buffer, key, file.type, sanitizedFileName),
      3, // Max retries for upload
      1000, // Initial delay of 1s for upload retries
    );

    // Handle upload failures
    if (!uploadResult.success) {
      console.error(
        "R2 upload failed:",
        uploadResult.message,
        uploadResult.error,
      );
      await cleanupOnFailure(createdDocumentId, uploadedObjectKey);
      return NextResponse.json(
        {
          success: false,
          error: true,
          message: uploadResult.message || "Upload failed",
          errorType: "StorageError",
          details:
            uploadResult.error instanceof Error
              ? uploadResult.error.message
              : String(uploadResult.error),
        },
        { status: uploadResult.statusCode || 500 },
      );
    }

    // Update document with storage details using transaction for atomicity
    try {
      const updateDocument = await prisma.document.update({
        where: { id: newDocument.id },
        data: {
          pathname: key,
          url: uploadResult.data.url,
          key: uploadResult.data.key,
          fileName: sanitizedFileName,
        },
      });

      if (!updateDocument) {
        throw new Error("Failed to update document with storage details");
      }
    } catch (updateError) {
      console.error(
        "Failed to update document with storage details:",
        updateError,
      );
      await cleanupOnFailure(createdDocumentId, uploadedObjectKey);

      return NextResponse.json(
        {
          success: false,
          error: true,
          message: "Failed to finalize document record",
          details:
            updateError instanceof Error
              ? updateError.message
              : String(updateError),
        },
        { status: 500 },
      );
    }

    // Return success response with file details
    revalidatePath("/admin/documents");
    return NextResponse.json(
      {
        success: true,
        error: false,
        message: "File uploaded successfully",
        documentId: newDocument.id,
        url: uploadResult.data.url,
        key: uploadResult.data.key,
        fileName: sanitizedFileName,
      },
      { status: 200 },
    );
  } catch (error) {
    // Run cleanup for any created resources
    await cleanupOnFailure(createdDocumentId, uploadedObjectKey);

    console.error("Unexpected upload error:", error);

    // Handle database connectivity issues
    if (
      error instanceof Prisma.PrismaClientInitializationError ||
      error instanceof Prisma.PrismaClientRustPanicError
    ) {
      return NextResponse.json(
        {
          success: false,
          error: true,
          message: "Database connection error",
          errorType: "DatabaseError",
          details: error instanceof Error ? error.message : String(error),
        },
        { status: 503 },
      );
    }

    // Handle AWS SDK S3ServiceException specifically
    if (error instanceof S3ServiceException) {
      const statusCode = error.$metadata?.httpStatusCode || 500;
      return NextResponse.json(
        {
          success: false,
          error: true,
          message: `Storage service error: ${error.message}`,
          requestId: error.$metadata?.requestId,
          errorCode: error.name,
          errorType: "S3ServiceException",
        },
        { status: statusCode },
      );
    }

    // Handle standard Error objects
    if (error instanceof Error) {
      // Check for network-related errors
      if (
        error.name === "NetworkError" ||
        error.message.includes("network") ||
        error.message.includes("connection")
      ) {
        return NextResponse.json(
          {
            success: false,
            error: true,
            message: "Network error while uploading file",
            details: error.message,
            errorType: error.name,
          },
          { status: 503 },
        );
      }

      // Handle timeout errors
      if (error.name === "TimeoutError" || error.message.includes("timeout")) {
        return NextResponse.json(
          {
            success: false,
            error: true,
            message: "Upload request timed out",
            details: error.message,
            errorType: error.name,
          },
          { status: 504 },
        );
      }

      // Handle Prisma errors more specifically
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        // P2003 is foreign key constraint violation
        if (error.code === "P2003") {
          return NextResponse.json(
            {
              success: false,
              error: true,
              message: "Invalid reference to related record",
              details: error.message,
              errorCode: error.code,
              errorType: "DatabaseConstraintError",
            },
            { status: 400 },
          );
        }
      }

      // Generic error handler
      return NextResponse.json(
        {
          success: false,
          error: true,
          message: "Upload failed",
          details: error.message,
          errorType: error.name,
        },
        { status: 500 },
      );
    }

    // Handle completely unknown errors
    return NextResponse.json(
      {
        success: false,
        error: true,
        message: "An unknown error occurred during upload",
        details: String(error),
      },
      { status: 500 },
    );
  }
}
