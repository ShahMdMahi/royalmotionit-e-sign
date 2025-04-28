"use server";

import { PutObjectCommand, PutObjectCommandInput, GetObjectCommand, GetObjectCommandInput, S3ServiceException, DeleteObjectCommand, DeleteObjectCommandInput } from "@aws-sdk/client-s3";
import r2Client from "@/lib/r2-client";
import { setTimeout } from "timers/promises";

// Define more specific return types for better type safety
type R2Result<T> =
  | { success: true; data: T; statusCode?: number }
  | {
      success: false;
      error: unknown;
      message: string;
      statusCode?: number;
      retryable?: boolean;
    };

/**
 * Upload an object to R2 storage
 * @param params - S3 PutObjectCommandInput parameters
 * @param retries - Number of retry attempts for transient errors (default: 3)
 */
export async function uploadToR2(params: PutObjectCommandInput, retries = 3): Promise<R2Result<any>> {
  // Validate required parameters
  if (!params.Bucket) {
    return {
      success: false,
      error: new Error("Missing bucket parameter"),
      message: "Bucket name is required",
      statusCode: 400,
    };
  }

  if (!params.Key) {
    return {
      success: false,
      error: new Error("Missing key parameter"),
      message: "Object key is required",
      statusCode: 400,
    };
  }

  if (!params.Body) {
    return {
      success: false,
      error: new Error("Missing body parameter"),
      message: "Object body is required",
      statusCode: 400,
    };
  }

  // Make sure Bucket is using environment variable if possible
  const bucket = params.Bucket || process.env.R2_BUCKET_NAME;
  if (!bucket) {
    return {
      success: false,
      error: new Error("R2 bucket not configured"),
      message: "Storage bucket not configured",
      statusCode: 500,
    };
  }

  let currentTry = 0;

  while (currentTry <= retries) {
    try {
      // Apply bucket from params or environment
      const requestParams = { ...params, Bucket: bucket };

      const result = await r2Client.send(new PutObjectCommand(requestParams));

      return {
        success: true,
        data: result,
        statusCode: 200,
      };
    } catch (error) {
      currentTry++;

      // Specific error handling for S3/R2 service errors
      if (error instanceof S3ServiceException) {
        const statusCode = error.$metadata?.httpStatusCode || 500;

        // Determine if error is retryable
        const retryable =
          statusCode >= 500 || // Server errors
          statusCode === 429 || // Too many requests
          error.name === "ConnectionError" ||
          error.name === "TimeoutError";

        // Only retry if it's a retryable error and we have retries left
        if (retryable && currentTry <= retries) {
          // Exponential backoff: 100ms, 200ms, 400ms, etc.
          const backoffTime = Math.min(100 * Math.pow(2, currentTry - 1), 3000);
          await setTimeout(backoffTime);
          continue;
        }

        // We've exhausted retries or it's not a retryable error
        return {
          success: false,
          error,
          message: `R2 service error: ${error.message}`,
          statusCode,
          retryable,
        };
      }

      // Handle non-S3 errors (should not retry)
      if (currentTry > retries) {
        return {
          success: false,
          error,
          message: error instanceof Error ? `Upload error: ${error.message}` : "Unknown upload error",
          statusCode: 500,
        };
      }

      // For unexpected errors, apply backoff but shorter
      await setTimeout(100 * currentTry);
    }
  }

  // This should never happen due to the while loop condition
  return {
    success: false,
    error: new Error("Maximum retries exceeded"),
    message: "Failed to upload after multiple attempts",
    statusCode: 500,
  };
}

/**
 * Retrieve an object from R2 storage
 * @param params - S3 GetObjectCommandInput parameters
 * @param retries - Number of retry attempts for transient errors (default: 3)
 */
export async function getFromR2(params: GetObjectCommandInput, retries = 3): Promise<R2Result<any>> {
  // Validate required parameters
  // if (!params.Bucket) {
  //   return {
  //     success: false,
  //     error: new Error("Missing bucket parameter"),
  //     message: "Bucket name is required",
  //     statusCode: 400,
  //   };
  // }

  if (!params.Key) {
    return {
      success: false,
      error: new Error("Missing key parameter"),
      message: "Object key is required",
      statusCode: 400,
    };
  }

  // Make sure Bucket is using environment variable if possible
  const bucket = params.Bucket || process.env.R2_BUCKET_NAME;
  if (!bucket) {
    return {
      success: false,
      error: new Error("R2 bucket not configured"),
      message: "Storage bucket not configured",
      statusCode: 500,
    };
  }

  let currentTry = 0;

  while (currentTry <= retries) {
    try {
      // Apply bucket from params or environment
      const requestParams = { ...params, Bucket: bucket };

      const result = await r2Client.send(new GetObjectCommand(requestParams));

      return {
        success: true,
        data: result,
        statusCode: 200,
      };
    } catch (error) {
      currentTry++;

      // Handle S3/R2 specific errors
      if (error instanceof S3ServiceException) {
        const statusCode = error.$metadata?.httpStatusCode || 500;

        // Special handling for "not found" errors - no need to retry these
        if (statusCode === 404) {
          return {
            success: false,
            error,
            message: "Object not found",
            statusCode: 404,
          };
        }

        // Determine if error is retryable
        const retryable =
          statusCode >= 500 || // Server errors
          statusCode === 429 || // Too many requests
          error.name === "ConnectionError" ||
          error.name === "TimeoutError";

        // Only retry if it's a retryable error and we have retries left
        if (retryable && currentTry <= retries) {
          // Exponential backoff: 100ms, 200ms, 400ms, etc.
          const backoffTime = Math.min(100 * Math.pow(2, currentTry - 1), 3000);
          await setTimeout(backoffTime);
          continue;
        }

        // We've exhausted retries or it's not a retryable error
        return {
          success: false,
          error,
          message: `R2 service error: ${error.message}`,
          statusCode,
          retryable,
        };
      }

      if (currentTry > retries) {
        return {
          success: false,
          error,
          message: error instanceof Error ? `Retrieval error: ${error.message}` : "Unknown retrieval error",
          statusCode: 500,
        };
      }

      await setTimeout(100 * currentTry);
    }
  }

  return {
    success: false,
    error: new Error("Maximum retries exceeded"),
    message: "Failed to retrieve object after multiple attempts",
    statusCode: 500,
  };
}

/**
 * Delete an object from R2 storage
 * @param params - S3 DeleteObjectCommandInput parameters
 * @param retries - Number of retry attempts for transient errors (default: 3)
 */
export async function deleteFromR2(params: DeleteObjectCommandInput, retries = 3): Promise<R2Result<any>> {
  // Validate required parameters
  if (!params.Bucket) {
    return {
      success: false,
      error: new Error("Missing bucket parameter"),
      message: "Bucket name is required",
      statusCode: 400,
    };
  }

  if (!params.Key) {
    return {
      success: false,
      error: new Error("Missing key parameter"),
      message: "Object key is required",
      statusCode: 400,
    };
  }

  // Make sure Bucket is using environment variable if possible
  const bucket = params.Bucket || process.env.R2_BUCKET_NAME;
  if (!bucket) {
    return {
      success: false,
      error: new Error("R2 bucket not configured"),
      message: "Storage bucket not configured",
      statusCode: 500,
    };
  }

  let currentTry = 0;

  while (currentTry <= retries) {
    try {
      // Apply bucket from params or environment
      const requestParams = { ...params, Bucket: bucket };

      const result = await r2Client.send(new DeleteObjectCommand(requestParams));

      return {
        success: true,
        data: result,
        statusCode: 200,
      };
    } catch (error) {
      currentTry++;

      // Specific error handling for S3/R2 service errors
      if (error instanceof S3ServiceException) {
        const statusCode = error.$metadata?.httpStatusCode || 500;

        // Not Found - consider this a success since the object is already gone
        if (statusCode === 404) {
          return {
            success: true,
            data: { message: "Object already deleted or does not exist" },
            statusCode: 200,
          };
        }

        // Determine if error is retryable
        const retryable =
          statusCode >= 500 || // Server errors
          statusCode === 429 || // Too many requests
          error.name === "ConnectionError" ||
          error.name === "TimeoutError";

        // Only retry if it's a retryable error and we have retries left
        if (retryable && currentTry <= retries) {
          const backoffTime = Math.min(100 * Math.pow(2, currentTry - 1), 3000);
          await setTimeout(backoffTime);
          continue;
        }

        return {
          success: false,
          error,
          message: `R2 service error: ${error.message}`,
          statusCode,
          retryable,
        };
      }

      if (currentTry > retries) {
        return {
          success: false,
          error,
          message: error instanceof Error ? `Delete error: ${error.message}` : "Unknown delete error",
          statusCode: 500,
        };
      }

      await setTimeout(100 * currentTry);
    }
  }

  return {
    success: false,
    error: new Error("Maximum retries exceeded"),
    message: "Failed to delete object after multiple attempts",
    statusCode: 500,
  };
}

/**
 * Upload a file to R2 storage with streamlined parameters
 * @param file - Buffer containing file data
 * @param key - Storage key (path) for the file
 * @param contentType - MIME type of the file
 * @param fileName - Original file name (for Content-Disposition)
 * @param retries - Number of retry attempts
 */
export async function uploadFileToR2(file: Buffer | null, key: string, contentType: string, fileName: string, retries = 3): Promise<R2Result<any>> {
  // Input validation
  if (!file || file.length === 0) {
    return {
      success: false,
      error: new Error("Empty file buffer"),
      message: "No file data provided",
      statusCode: 400,
    };
  }

  if (!key || !key.trim()) {
    return {
      success: false,
      error: new Error("Invalid file key"),
      message: "File storage key is required",
      statusCode: 400,
    };
  }

  if (!fileName || !fileName.trim()) {
    return {
      success: false,
      error: new Error("Invalid file name"),
      message: "File name is required",
      statusCode: 400,
    };
  }

  // Environment validation
  if (!process.env.R2_BUCKET_NAME) {
    return {
      success: false,
      error: new Error("R2_BUCKET_NAME not configured"),
      message: "Storage bucket not configured",
      statusCode: 500,
    };
  }

  if (!process.env.R2_ENDPOINT) {
    return {
      success: false,
      error: new Error("R2_ENDPOINT not configured"),
      message: "Storage endpoint not configured",
      statusCode: 500,
    };
  }

  try {
    // Sanitize file name for Content-Disposition
    const sanitizedFileName = fileName.replace(/[^\w\s.-]/g, "_");

    // Call uploadToR2 with the prepared parameters
    const result = await uploadToR2(
      {
        Bucket: process.env.R2_BUCKET_NAME,
        Key: key,
        Body: file,
        ContentType: contentType || "application/octet-stream",
        ContentDisposition: `inline; filename="${sanitizedFileName}"`,
      },
      retries
    );

    if (!result.success) {
      return result; // Forward the error from uploadToR2
    }

    // Add URL to successful result
    return {
      success: true,
      data: {
        ...result.data,
        url: `${process.env.R2_ENDPOINT}/${process.env.R2_BUCKET_NAME}/${key}`,
        key,
      },
      statusCode: 200,
    };
  } catch (error) {
    // This catch should rarely be hit since uploadToR2 handles its own errors
    console.error("Unexpected error in uploadFileToR2:", error);
    return {
      success: false,
      error,
      message: error instanceof Error ? error.message : "Unknown upload error",
      statusCode: 500,
    };
  }
}
