"use server";

import {
  PDFDocument,
  rgb,
  StandardFonts,
  PDFForm,
  PDFPage,
  degrees,
} from "pdf-lib";
import { DocumentField, DocumentFieldType, Document } from "@/types/document";
import {
  convertToDocumentField,
  convertToDocumentFields,
} from "@/utils/document-field-converter";
import { getFromR2, uploadToR2 } from "@/actions/r2";
import { prisma } from "@/prisma/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { isFieldVisible, evaluateFormula } from "./formula-evaluator";
// Note: These are now imported directly from the non-server module since we're in a server context already

/**
 * Convert a hex color string to PDF rgb object
 * @param hexColor Hex color string (e.g., #FF0000)
 * @returns RGB color object for pdf-lib
 */
function parseHexColor(hexColor: string) {
  const hex = hexColor.replace("#", "");
  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;
  return rgb(r, g, b);
}

/**
 * Draw field background and border on the PDF
 * Enhanced with precise positioning and better type handling
 *
 * @param page PDF page
 * @param field Document field
 * @param x X coordinate
 * @param y Y coordinate
 */
async function drawFieldBackgroundAndBorder(
  page: PDFPage,
  field: any, // Using any here as we'll handle the type conversion internally
  x: number,
  y: number,
) {
  // Convert field to proper DocumentField type if needed
  const typedField = convertToDocumentField(field);

  // Ensure numeric values with precise 2-decimal rounding to avoid floating point issues
  const fieldX = Math.round(Number(x) * 100) / 100;
  const fieldY = Math.round(Number(y) * 100) / 100;
  const fieldWidth = Math.round(Number(typedField.width) * 100) / 100;
  const fieldHeight = Math.round(Number(typedField.height) * 100) / 100;

  // Draw background if specified
  if (typedField.backgroundColor) {
    try {
      page.drawRectangle({
        x: fieldX,
        y: fieldY,
        width: fieldWidth,
        height: fieldHeight,
        color: parseHexColor(typedField.backgroundColor),
        opacity: 0.3, // Semi-transparent background
      });
    } catch (error) {
      console.error("Error drawing field background:", error);
      // Fallback to default color if parsing fails
      page.drawRectangle({
        x: fieldX,
        y: fieldY,
        width: fieldWidth,
        height: fieldHeight,
        color: rgb(0.9, 0.9, 0.9), // Light gray fallback
        opacity: 0.3,
      });
    }
  }

  // Draw border if specified
  if (typedField.borderColor) {
    try {
      // Draw border with consistent 1pt width
      page.drawRectangle({
        x: fieldX,
        y: fieldY,
        width: fieldWidth,
        height: fieldHeight,
        borderWidth: 1,
        borderColor: parseHexColor(typedField.borderColor),
        borderOpacity: 0.8,
      });
    } catch (error) {
      console.error("Error drawing field border:", error);
      // Fallback to default border if parsing fails
      page.drawRectangle({
        x: fieldX,
        y: fieldY,
        width: fieldWidth,
        height: fieldHeight,
        borderWidth: 1,
        borderColor: rgb(0.5, 0.5, 0.5), // Gray fallback
        borderOpacity: 0.8,
      });
    }
  }
}

/**
 * Add a watermark to each page of the PDF
 * @param pdfDoc PDF document object
 * @param text Watermark text
 * @param opacity Opacity of the watermark (0-1)
 */
async function addWatermark(
  pdfDoc: PDFDocument,
  text: string,
  opacity: number = 0.15,
) {
  const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  // Add watermark to each page
  for (let i = 0; i < pdfDoc.getPageCount(); i++) {
    const page = pdfDoc.getPage(i);
    const { width, height } = page.getSize();

    // Draw diagonal text watermark
    const fontSize = Math.min(width, height) * 0.05; // Scale based on page size
    const textWidth = font.widthOfTextAtSize(text, fontSize);
    const textHeight = font.heightAtSize(fontSize); // Calculate positions for rotated text
    const centerX = width / 2;
    const centerY = height / 2;

    // Use drawText with rotation transform
    page.drawText(text, {
      x: centerX - textWidth / 2,
      y: centerY - textHeight / 2,
      size: fontSize,
      font: font,
      color: rgb(0.5, 0.5, 0.5),
      opacity: opacity,
      rotate: degrees(-30),
    });
  }
}

/**
 * Add document metadata to the PDF
 * @param pdfDoc PDF document object
 * @param document Document object with metadata
 * @param signers Array of signers
 */
function addDocumentMetadata(
  pdfDoc: PDFDocument,
  document: any,
  signers: any[],
) {
  // Set document metadata
  pdfDoc.setTitle(document.title || "Signed Document");
  pdfDoc.setSubject("Electronically Signed Document");
  pdfDoc.setKeywords([
    "electronic signature",
    "signed document",
    "legal document",
    document.id,
    ...signers.map((s) => s.email),
  ]);
  pdfDoc.setProducer("Royal Sign E-Signature Platform");
  pdfDoc.setCreator("Royal Sign");

  // Set creation and modification dates
  if (document.createdAt) {
    pdfDoc.setCreationDate(new Date(document.createdAt));
  }
  pdfDoc.setModificationDate(new Date());

  // Add custom metadata using Info dictionary (pdf-lib doesn't have direct setCustomMetadata)
  const metadata = {
    DocumentId: document.id,
    SignedAt: new Date().toISOString(),
  };
  // Add signer information
  signers.forEach((signer, index) => {
    if (signer.completedAt) {
      const signerKey = `Signer${index + 1}` as keyof typeof metadata;
      // Use explicit type casting to avoid index signature issues
      (metadata as Record<string, string>)[signerKey] =
        `${signer.name || signer.email}:${new Date(signer.completedAt).toISOString()}`;
    }
  });

  // Add metadata to the document info dictionary
  Object.entries(metadata).forEach(([key, value]) => {
    // @ts-ignore - Using internal API to set custom metadata
    if (pdfDoc.context && pdfDoc.context.trailerInfo) {
      // @ts-ignore - Access the low-level PDFContext if available
      pdfDoc.context.trailerInfo.set(key, value);
    }
  });
}

/**
 * Process all conditional logic and formulas to determine the final field values and visibility
 * @param fields Array of document fields
 * @returns Processed fields with updated values and visibility flags
 */
function processFieldConditionalsAndFormulas(
  fields: DocumentField[],
): DocumentField[] {
  // First pass - evaluate all formula fields
  const fieldsWithFormulas = fields.map((field) => {
    // If this is a formula field, evaluate its value
    if (field.type === "formula" && field.validationRule) {
      try {
        const formulaResult = evaluateFormula(field.validationRule, fields);
        return {
          ...field,
          value: formulaResult,
        };
      } catch (error) {
        console.error(`Error evaluating formula for field ${field.id}:`, error);
        return field;
      }
    }
    return field;
  });

  // Second pass - evaluate conditional visibility for all fields
  return fieldsWithFormulas.map((field) => {
    // If the field has conditional logic, determine if it should be visible
    if (field.conditionalLogic) {
      try {
        const isVisible = isFieldVisible(field, fieldsWithFormulas);
        return {
          ...field,
          isVisible,
        };
      } catch (error) {
        console.error(
          `Error evaluating visibility for field ${field.id}:`,
          error,
        );
        // Default to showing the field if there's an error
        return {
          ...field,
          isVisible: true,
        };
      }
    }

    // Default state is visible
    return {
      ...field,
      isVisible: true,
    };
  });
}

/**
 * Generate a final signed PDF with all fields and signatures embedded
 * @param documentId The ID of the document
 * @returns Result of the operation with the URL of the final document
 */
export async function generateFinalPDF(documentId: string) {
  try {
    const userSession = await auth();

    if (!userSession || !userSession.user?.id) {
      return {
        success: false,
        message: "You must be logged in to perform this action",
      };
    }

    // Get the document with fields and signers
    const document: any = await prisma.document.findFirst({
      where: {
        id: documentId,
      },
      include: {
        fields: true,
        signers: true,
      },
    });

    if (!document) {
      return {
        success: false,
        message: "Document not found",
      };
    }

    // Check access rights
    const session = await auth();
    const isAuthor = document.authorId === session?.user?.id;
    const isSigner = document.signers.some(
      (s: { email: string }) => s.email === session?.user?.email,
    );

    if (!isAuthor && !isSigner) {
      return {
        success: false,
        message: "You don't have permission to access this document",
      };
    }

    // Check if the signer has completed
    const signerCompleted =
      document.signers.length > 0 && document.signers[0].status === "COMPLETED";

    if (!signerCompleted) {
      return {
        success: false,
        message: "The signer has not completed the document",
      };
    }

    // Get the original PDF from storage
    if (!document.key) {
      return {
        success: false,
        message: "Original document not found in storage",
      };
    }

    const originalPdfResult = await getFromR2({
      Key: document.key,
    });

    if (!originalPdfResult.success) {
      return {
        success: false,
        message: "Failed to retrieve original document",
      };
    }

    // Load the PDF document
    const pdfBytes = originalPdfResult.data.Body;
    const pdfDoc = await PDFDocument.load(pdfBytes);

    // Get the form from the PDF
    const form = pdfDoc.getForm(); // Convert database fields to properly typed DocumentField objects
    const typedFields = convertToDocumentFields(document.fields);

    // Process all conditional logic and formulas
    const processedFields = processFieldConditionalsAndFormulas(typedFields);

    // Embed fields and signatures
    for (const field of processedFields) {
      // Skip fields with no value or that should be hidden
      if (!field.value || !field.isVisible) continue;

      const page = pdfDoc.getPage(field.pageNumber - 1);
      const { width: pageWidth, height: pageHeight } = page.getSize(); // Convert coordinates to PDF coordinate system (0,0 is bottom-left in PDF)
      const x = field.x;
      const y = pageHeight - field.y - field.height; // Flip y-coordinate

      // Draw field background and border with precise positioning
      await drawFieldBackgroundAndBorder(page, field, x, y);

      switch (field.type) {
        case "signature":
        case "initial":
          // For signatures and initials, embed the image
          if (field.value.startsWith("data:image")) {
            try {
              // Extract base64 data
              const base64Data = field.value.split(",")[1];
              if (!base64Data) continue;

              // Embed the image
              const signatureImage = await pdfDoc.embedPng(
                Buffer.from(base64Data, "base64"),
              );

              // Draw the image
              page.drawImage(signatureImage, {
                x,
                y,
                width: field.width,
                height: field.height,
                opacity: 0.95,
              });
            } catch (error) {
              console.error("Error embedding signature:", error);
              // Continue with other fields even if one fails
            }
          }
          break;

        case "checkbox":
          // For checkboxes, draw a checked box if value is true
          if (field.value === "true" || field.value === "checked") {
            // Embed checkbox using custom drawing
            page.drawRectangle({
              x,
              y,
              width: field.width,
              height: field.height,
              borderWidth: 1,
              borderColor: rgb(0, 0, 0),
            });

            // Draw checkmark (using lines)
            const checkX = x + field.width * 0.2;
            const checkY = y + field.height * 0.5;
            page.drawLine({
              start: { x: checkX, y: checkY },
              end: {
                x: checkX + field.width * 0.2,
                y: checkY - field.height * 0.2,
              },
              thickness: 2,
              color: rgb(0, 0, 0),
            });
            page.drawLine({
              start: {
                x: checkX + field.width * 0.2,
                y: checkY - field.height * 0.2,
              },
              end: {
                x: checkX + field.width * 0.6,
                y: checkY + field.height * 0.3,
              },
              thickness: 2,
              color: rgb(0, 0, 0),
            });
          } else {
            // Just draw empty box
            page.drawRectangle({
              x,
              y,
              width: field.width,
              height: field.height,
              borderWidth: 1,
              borderColor: rgb(0, 0, 0),
            });
          }
          break;

        case "text":
        case "email":
        case "phone":
        case "number":
          // For text fields, add the text
          if (field.value) {
            // Load font
            const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
            const fontSize = field.fontSize || 12;

            // Apply any text color
            const textColor = field.textColor
              ? parseHexColor(field.textColor)
              : rgb(0, 0, 0);

            // Draw text with precise positioning and overflow handling
            const textValue = String(field.value);
            // Calculate text width to handle overflow with ellipsis
            const textWidth = font.widthOfTextAtSize(textValue, fontSize);
            const fieldContentWidth = field.width - 8; // Padding on both sides

            // Handle text overflow with ellipsis if needed
            let displayText = textValue;
            if (textWidth > fieldContentWidth) {
              // Text is too long, add ellipsis
              let truncated = textValue;
              while (
                font.widthOfTextAtSize(truncated + "...", fontSize) >
                  fieldContentWidth &&
                truncated.length > 0
              ) {
                truncated = truncated.slice(0, -1);
              }
              displayText = truncated + "...";
            }

            // Calculate vertical position for proper centering based on font metrics
            const textHeight = font.heightAtSize(fontSize);
            const centerY = y + field.height / 2 - textHeight / 3;

            // Draw the text with precise positioning
            page.drawText(displayText, {
              x: x + 4, // Left padding
              y: centerY, // Better vertical centering using font metrics
              size: fontSize,
              font,
              color: textColor,
              lineHeight: fontSize * 1.2, // Proper line height for better text rendering
            });
          }
          break;

        case "date":
          // For date fields, format and add the date
          if (field.value) {
            const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
            let dateText = field.value;

            // Try to format date if it's a valid date
            try {
              const date = new Date(field.value);
              if (!isNaN(date.getTime())) {
                dateText = date.toLocaleDateString();
              }
            } catch (err) {
              // Use the original value if parsing fails
            }

            // Draw date text with better styling
            const fontSize = field.fontSize || 12;
            const textColor = field.textColor
              ? parseHexColor(field.textColor)
              : rgb(0, 0, 0);

            page.drawText(dateText, {
              x: x + 4,
              y: y + field.height / 2 - fontSize / 2,
              size: fontSize,
              font,
              color: textColor,
            });
          }
          break;
        case "dropdown":
        case "radio":
          // For dropdown and radio fields, draw the selected option
          if (field.value) {
            const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
            const fontSize = field.fontSize || 12;
            const textColor = field.textColor
              ? parseHexColor(field.textColor)
              : rgb(0, 0, 0);

            page.drawText(field.value, {
              x: x + 4,
              y: y + field.height / 2 - fontSize / 2,
              size: fontSize,
              font,
              color: textColor,
            });
          }
          break;

        case "formula":
          // For formula fields, draw the computed value
          if (field.value) {
            const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
            const fontSize = field.fontSize || 12;
            const textColor = field.textColor
              ? parseHexColor(field.textColor)
              : rgb(0, 0, 0);

            // Add a special format for formula fields to indicate they're computed
            page.drawText(field.value, {
              x: x + 4,
              y: y + field.height / 2 - fontSize / 2,
              size: fontSize,
              font,
              color: textColor,
            });
          }
          break;

        case "payment":
          // For payment fields, format the value as currency
          if (field.value) {
            const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
            const fontSize = field.fontSize || 12;
            const textColor = field.textColor
              ? parseHexColor(field.textColor)
              : rgb(0, 0, 0);

            // Format as currency
            let formattedValue = field.value;
            try {
              formattedValue = new Intl.NumberFormat("en-US", {
                style: "currency",
                currency: "USD",
              }).format(Number(field.value));
            } catch (error) {
              // Use original value if formatting fails
            }

            page.drawText(formattedValue, {
              x: x + 4,
              y: y + field.height / 2 - fontSize / 2,
              size: fontSize,
              font,
              color: textColor,
            });
          }
          break;

        default:
          // Default handling for any other field types
          if (field.value) {
            const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
            const fontSize = field.fontSize || 12;
            const textColor = field.textColor
              ? parseHexColor(field.textColor)
              : rgb(0, 0, 0);

            page.drawText(field.value, {
              x: x + 4,
              y: y + field.height / 2 - fontSize / 2,
              size: fontSize,
              font,
              color: textColor,
            });
          }
          break;
      }
    } // Add watermark if document has watermarking enabled
    if (document.enableWatermark) {
      // Add watermark with text from document settings or use default
      const watermarkText = document.watermarkText || "Confidential";

      // Add watermark to each page
      const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

      for (let i = 0; i < pdfDoc.getPageCount(); i++) {
        const page = pdfDoc.getPage(i);
        const { width, height } = page.getSize();

        // Draw diagonal text watermark
        const fontSize = Math.min(width, height) * 0.05; // Scale based on page size
        const textWidth = font.widthOfTextAtSize(watermarkText, fontSize);
        // Draw the text diagonally across the page
        page.drawText(watermarkText, {
          x: width / 2 - textWidth / 2,
          y: height / 2,
          size: fontSize,
          font: font,
          color: rgb(0.5, 0.5, 0.5),
          opacity: 0.15,
          rotate: degrees(-30),
        });
      }
    }

    // Add document metadata
    pdfDoc.setTitle(document.title || "Signed Document");
    pdfDoc.setSubject("Electronically Signed Document");
    pdfDoc.setKeywords([
      "electronic signature",
      "signed document",
      "legal document",
      document.id,
    ]);
    pdfDoc.setProducer("Royal Sign E-Signature Platform");
    pdfDoc.setCreator("Royal Sign");

    // Set creation and modification dates
    if (document.createdAt) {
      pdfDoc.setCreationDate(new Date(document.createdAt));
    }
    pdfDoc.setModificationDate(new Date()); // Flatten the form - this makes all form fields part of the document content
    form.flatten();

    // Save the PDF
    let finalPdfBytes;
    try {
      finalPdfBytes = await pdfDoc.save();

      // Embed attachments if any exist
      // We'll import our attachment handler to embed files in the PDF
      const { embedAttachmentsInPdf } = await import("./attachment-actions");
      finalPdfBytes = await embedAttachmentsInPdf(document.id, finalPdfBytes);
    } catch (error) {
      console.error("Error saving PDF document:", error);
      return {
        success: false,
        message: "Failed to generate final PDF document",
        error: String(error),
      };
    }

    // Create a unique key for the signed document
    const finalKey = `signed/${document.id}/${Date.now()}.pdf`;

    // Try uploading with retry logic
    let uploadAttempts = 0;
    let uploadResult;

    do {
      uploadAttempts++;

      try {
        uploadResult = await uploadToR2({
          Bucket: process.env.R2_BUCKET_NAME,
          Key: finalKey,
          Body: finalPdfBytes,
          ContentType: "application/pdf",
        });

        if (uploadResult.success) break;

        // Wait a bit before retrying
        if (uploadAttempts < 3) {
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      } catch (error) {
        console.error(`Upload attempt ${uploadAttempts} failed:`, error);

        if (uploadAttempts >= 3) {
          return {
            success: false,
            message: "Failed to save final document after multiple attempts",
            error: String(error),
          };
        }
      }
    } while (uploadAttempts < 3);

    if (!uploadResult || !uploadResult.success) {
      return {
        success: false,
        message: "Failed to save final document",
      };
    }

    // Update document status and URL
    await prisma.document.update({
      where: { id: documentId },
      data: {
        status: "COMPLETED",
        documentType: "SIGNED",
        signedAt: new Date(),
        url: `${process.env.R2_PUBLIC_URL}/${finalKey}`,
      },
    });

    // Add document history entry
    await prisma.documentHistory.create({
      data: {
        documentId,
        action: "COMPLETED",
        actorEmail: session?.user?.email ?? undefined,
        actorName: session?.user?.name ?? undefined,
        actorRole: isAuthor ? "AUTHOR" : "SIGNER",
      },
    }); // Revalidate paths
    revalidatePath(`/documents/${documentId}`);
    revalidatePath(`/documents`);

    return {
      success: true,
      message: "Document completed successfully",
      url: `${process.env.R2_PUBLIC_URL}/${finalKey}`,
    };
  } catch (error) {
    console.error("Error generating final PDF:", error);

    return {
      success: false,
      message: "Failed to generate final document",
      error: String(error),
    };
  }
}
