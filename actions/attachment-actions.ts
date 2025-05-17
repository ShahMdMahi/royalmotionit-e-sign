"use server";

import { prisma } from "@/prisma/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { uploadToR2, getFromR2, deleteFromR2 } from "./r2";
import { PDFDocument, rgb } from "pdf-lib";

/**
 * Add an attachment to a document
 * @param documentId The document ID to attach the file to
 * @param file The file to attach
 * @param name Optional name for the attachment
 * @param description Optional description for the attachment
 * @returns Success status and message
 */
export async function addDocumentAttachment(
  documentId: string,
  file: File,
  name?: string,
  description?: string,
) {
  // Verify authentication and authorization
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, message: "Authentication required" };
  }

  try {
    // Check if document exists and user has proper permissions
    const document = await prisma.document.findFirst({
      where: {
        id: documentId,
        authorId: session.user.id, // Only allow document author to add attachments
      },
    });

    if (!document) {
      return {
        success: false,
        message: "Document not found or insufficient permissions",
      };
    } // Generate unique key for R2 storage
    const key = `attachments/${documentId}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;

    // Convert file to array buffer for upload
    const fileBuffer = await file.arrayBuffer();

    // Upload file to R2 storage
    const uploadResult = await uploadToR2({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: key,
      Body: Buffer.from(fileBuffer),
      ContentType: file.type,
    });

    if (!uploadResult.success) {
      return { success: false, message: "Failed to upload attachment" };
    } // Store attachment metadata in database
    await prisma.attachment.create({
      data: {
        documentId,
        name: name || file.name,
        description,
        key,
        url: `${process.env.R2_PUBLIC_URL}/${key}`,
        size: file.size,
        mimeType: file.type,
        uploadedBy: session.user.id,
      },
    });

    revalidatePath(`/documents/${documentId}`);
    return { success: true, message: "Attachment added successfully" };
  } catch (error) {
    console.error("Error adding document attachment:", error);
    return { success: false, message: "Failed to add attachment" };
  }
}

/**
 * List all attachments for a document
 * @param documentId The document ID
 * @returns Array of attachments
 */
export async function getDocumentAttachments(documentId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    return {
      success: false,
      message: "Authentication required",
      attachments: [],
    };
  }

  try {
    // Check if user has access to the document
    const document = await prisma.document.findFirst({
      where: {
        id: documentId,
        OR: [
          { authorId: session.user.id }, // Document author
          { signers: { some: { email: session.user.email ?? "" } } }, // Document signer
        ],
      },
    });

    if (!document) {
      return {
        success: false,
        message: "Document not found or insufficient permissions",
        attachments: [],
      };
    }

    // Get attachments for the document
    const attachments = await prisma.attachment.findMany({
      where: { documentId },
      orderBy: { createdAt: "desc" },
    });

    return { success: true, attachments };
  } catch (error) {
    console.error("Error fetching document attachments:", error);
    return {
      success: false,
      message: "Failed to fetch attachments",
      attachments: [],
    };
  }
}

/**
 * Delete an attachment
 * @param attachmentId The attachment ID to delete
 * @returns Success status and message
 */
export async function deleteDocumentAttachment(attachmentId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, message: "Authentication required" };
  }

  try {
    // Get attachment with document to verify permissions
    const attachment = await prisma.attachment.findFirst({
      where: { id: attachmentId },
      include: { document: true },
    });

    if (!attachment) {
      return { success: false, message: "Attachment not found" };
    }

    // Verify user is the document author
    if (attachment.document.authorId !== session.user.id) {
      return {
        success: false,
        message: "Insufficient permissions to delete attachment",
      };
    } // Delete from R2 storage
    if (attachment.key) {
      await deleteFromR2({
        Bucket: process.env.R2_BUCKET_NAME,
        Key: attachment.key,
      });
    }

    // Delete from database
    await prisma.attachment.delete({
      where: { id: attachmentId },
    });

    revalidatePath(`/documents/${attachment.documentId}`);
    return { success: true, message: "Attachment deleted successfully" };
  } catch (error) {
    console.error("Error deleting document attachment:", error);
    return { success: false, message: "Failed to delete attachment" };
  }
}

/**
 * Generate a signed URL for downloading an attachment
 * @param attachmentId The attachment ID
 * @returns URL for downloading the attachment
 */
export async function getAttachmentDownloadUrl(attachmentId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, message: "Authentication required" };
  }

  try {
    // Get attachment with document to verify permissions
    const attachment = await prisma.attachment.findFirst({
      where: { id: attachmentId },
      include: { document: true },
    });

    if (!attachment) {
      return { success: false, message: "Attachment not found" };
    }

    // Verify user has access to the document
    const hasAccess =
      attachment.document.authorId === session.user.id ||
      (await prisma.signer.findFirst({
        where: {
          documentId: attachment.documentId,
          email: session.user.email ?? "",
        },
      }));

    if (!hasAccess) {
      return {
        success: false,
        message: "Insufficient permissions to access attachment",
      };
    }

    // Generate signed URL
    if (attachment.key) {
      const url = await getFromR2({ Key: attachment.key });
      return { success: true, url };
    } else {
      return { success: false, message: "Attachment storage key not found" };
    }
  } catch (error) {
    console.error("Error generating attachment download URL:", error);
    return { success: false, message: "Failed to generate download URL" };
  }
}

/**
 * Include document attachments in the final PDF
 * @param documentId The document ID
 * @param pdfBytes The original PDF bytes
 * @returns Updated PDF bytes with attachments
 */
export async function embedAttachmentsInPdf(
  documentId: string,
  pdfBytes: Uint8Array,
): Promise<Uint8Array> {
  try {
    // Get all attachments for this document
    const { prisma } = await import("@/prisma/prisma");
    const { PDFDocument } = await import("pdf-lib");

    const attachments = await prisma.attachment.findMany({
      where: { documentId },
    });
    // If no attachments, return original PDF
    if (!attachments.length) {
      return pdfBytes;
    }

    // Load the PDF document
    const pdfDoc = await PDFDocument.load(pdfBytes);
    const { StandardFonts } = await import("pdf-lib");

    // Create a dedicated attachments page if there are attachments
    if (attachments.length > 0) {
      // Create a new page for attachment listing
      let page = pdfDoc.addPage();
      const { height, width } = page.getSize();
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const fontSize = 12;
      const lineHeight = fontSize * 1.2;

      // Add title
      page.drawText("Document Attachments", {
        x: 50,
        y: height - 50,
        size: 18,
        font,
      });

      // Add subtitle with count
      page.drawText(
        `This document contains ${attachments.length} attachment${attachments.length !== 1 ? "s" : ""}`,
        {
          x: 50,
          y: height - 80,
          size: fontSize,
          font,
        },
      );

      // Add table header
      let yPosition = height - 120;
      page.drawText("File Name", {
        x: 50,
        y: yPosition,
        size: fontSize,
        font,
      });

      page.drawText("Size", {
        x: 300,
        y: yPosition,
        size: fontSize,
        font,
      });

      page.drawText("Type", {
        x: 400,
        y: yPosition,
        size: fontSize,
        font,
      });
      // Add separator line
      page.drawLine({
        start: { x: 50, y: yPosition - 5 },
        end: { x: width - 50, y: yPosition - 5 },
        thickness: 1,
        color: rgb(0, 0, 0),
      });

      // List all attachments
      yPosition -= lineHeight * 2;

      for (const attachment of attachments) {
        // Get file from R2
        const { getFromR2 } = await import("./r2");
        const fileUrl = await getFromR2({ Key: attachment.key });
        let fileBytes: ArrayBuffer | null = null;
        try {
          if (fileUrl && fileUrl.success && fileUrl.data && fileUrl.data.Body) {
            // Use the data directly from R2 result and ensure it's an ArrayBuffer
            const buffer = fileUrl.data.Body.buffer; // Create a fixed copy of the data that's guaranteed to be an ArrayBuffer
            const array = new Uint8Array(buffer);
            const newBuffer = new ArrayBuffer(array.byteLength);
            const newArray = new Uint8Array(newBuffer);
            newArray.set(array);
            fileBytes = newBuffer;
          } else if (fileUrl && typeof fileUrl === "string") {
            // If result is a string URL, fetch it
            const response = await fetch(fileUrl);
            fileBytes = await response.arrayBuffer();
          }
        } catch (err) {
          console.error(`Failed to fetch attachment: ${attachment.name}`, err);
        }

        // Draw attachment info
        page.drawText(attachment.name, {
          x: 50,
          y: yPosition,
          size: fontSize,
          font,
        });

        // Format file size
        const formatFileSize = (bytes: number): string => {
          if (bytes < 1024) return bytes + " B";
          else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB";
          else return (bytes / 1048576).toFixed(1) + " MB";
        };

        page.drawText(formatFileSize(attachment.size), {
          x: 300,
          y: yPosition,
          size: fontSize,
          font,
        });

        page.drawText(attachment.mimeType, {
          x: 400,
          y: yPosition,
          size: fontSize,
          font,
        });
        // Embed the actual file if we were able to fetch it
        if (fileBytes) {
          try {
            // Create embedded file using a compatible embedding method
            // Instead of using embedFile which doesn't exist, we'll use raw PDF API
            const embeddedFileStream = pdfDoc.context.flateStream(
              new Uint8Array(fileBytes),
            );
            const embeddedFile = pdfDoc.context.register(embeddedFileStream);

            // We'll manually set creation date and modification date
            const creationDate = new Date();
            const modificationDate = new Date();
            const annotation = pdfDoc.context.obj({
              Type: "Annot",
              Subtype: "FileAttachment",
              Rect: [50, yPosition - 20, 100, yPosition + 10],
              FS: embeddedFile,
              Contents: attachment.name,
              Name: "PushPin",
              NM: attachment.name,
            });
            const annotations = pdfDoc.context.obj([annotation]);
            // Create a name object for 'Annots' without using nameAsObj
            const annotsName = pdfDoc.context.obj("Annots");
            page.node.set(annotsName, annotations);
          } catch (err) {
            console.error(
              `Failed to embed attachment: ${attachment.name}`,
              err,
            );
          }
        }

        yPosition -= lineHeight * 1.5;

        // Add a new page if we're running out of space
        if (yPosition < 50) {
          page = pdfDoc.addPage();
          yPosition = height - 50;
        }
      }
    }

    // Save the PDF with embedded attachments
    const updatedPdfBytes = await pdfDoc.save();
    return new Uint8Array(updatedPdfBytes);
  } catch (error) {
    console.error("Error embedding attachments in PDF:", error);
    // Return original PDF if embedding fails
    return pdfBytes;
  }
}
