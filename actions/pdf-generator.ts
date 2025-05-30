"use server";

import fs from 'fs';
import path from 'path';
import { PDFDocument, rgb, StandardFonts, PDFForm, PDFPage, degrees } from "pdf-lib";
import { DocumentField, DocumentFieldType, Document } from "@/types/document";
import { convertToDocumentField, convertToDocumentFields } from "@/utils/document-field-converter";
import { deleteFromR2, getFromR2, uploadToR2 } from "@/actions/r2";
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
  y: number
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
async function addWatermark(pdfDoc: PDFDocument, text: string, opacity: number = 0.15) {
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
 * Add document ID header to the top left corner of each page
 * @param pdfDoc PDF document object
 * @param documentId The document ID to display
 */
async function addDocumentIdHeader(pdfDoc: PDFDocument, documentId: string) {
  const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const headerText = `Royal Sign Document Id: ${documentId}`;
  const fontSize = 10; // Small but readable size for header

  // Add header to each page
  for (let i = 0; i < pdfDoc.getPageCount(); i++) {
    const page = pdfDoc.getPage(i);
    const { height } = page.getSize();

    // Position in top left corner with small margin
    const x = 15;
    const y = height - 20; // From top edge

    // Draw header text
    page.drawText(headerText, {
      x,
      y,
      size: fontSize,
      font: font,
      color: rgb(0, 0, 0), // Black color for better visibility
      opacity: 1.0, // Fully opaque for readability
    });
  }
}

/**
 * Add document metadata to the PDF
 * @param pdfDoc PDF document object
 * @param document Document object with metadata
 * @param signers Array of signers
 */
function addDocumentMetadata(pdfDoc: PDFDocument, document: any, signers: any[]) {
  // Set document metadata
  pdfDoc.setTitle(document.title || "Signed Document");
  pdfDoc.setSubject("Electronically Signed Document");
  pdfDoc.setKeywords(["electronic signature", "signed document", "legal document", document.id, ...signers.map((s) => s.email)]);
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
    DocumentHash: document.fileHash || "Not available",
  };
  // Add signer information
  signers.forEach((signer, index) => {
    if (signer.completedAt) {
      const signerKey = `Signer${index + 1}` as keyof typeof metadata;
      // Use explicit type casting to avoid index signature issues
      (metadata as Record<string, string>)[signerKey] = `${signer.name || signer.email}:${new Date(signer.completedAt).toISOString()}`;
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
function processFieldConditionalsAndFormulas(fields: DocumentField[]): DocumentField[] {
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
    // Make sure checkbox fields have proper value representation
    if (field.type === "checkbox" && !field.value) {
      return {
        ...field,
        value: "false", // Default checkbox value when empty
      };
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
        console.error(`Error evaluating visibility for field ${field.id}:`, error);
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

// Document hash is retrieved from the database, no need for a calculation function

/**
 * Generate a final signed PDF with all fields and signatures embedded
 * @param documentId The ID of the document
 * @returns Result of the operation with the URL of the final document
 */
export async function generateFinalPDF(documentId: string) {
  // print document id in big red style in console
  console.log(`%cGenerating final PDF for document ID: ${documentId}`, "color: red; font-size: 20px; font-weight: bold;");
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
        author: true,
      },
    });

    if (!document) {
      return {
        success: false,
        message: "Document not found",
      };
    }

    // // print document details in big red style in console
    // console.log(`%cDocument details: ${JSON.stringify(document, null, 2)}`, "color: red; font-size: 16px; font-weight: bold;");

    // Check access rights
    const session = await auth();
    const isAuthor = document.authorId === session?.user?.id;
    const isSigner = document.signers.some((s: { email: string }) => s.email === session?.user?.email);

    if (!isAuthor && !isSigner) {
      return {
        success: false,
        message: "You don't have permission to access this document",
      };
    }

    // Check if the signer has completed
    const signerCompleted = document.signers.length > 0 && document.signers[0].status === "COMPLETED";

    if (!signerCompleted) {
      return {
        success: false,
        message: "The signer has not completed the document",
      };
    }

    // // print singerCompleted in big red style in console
    // console.log(`%cSigner completed: ${signerCompleted}`, "color: red; font-size: 16px; font-weight: bold;");

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

    // // print originalPdfResult in big red style in console
    // console.log(`%cOriginal PDF retrieved successfully: ${JSON.stringify(originalPdfResult, null, 2)}`, "color: red; font-size: 16px; font-weight: bold;");

    // Load the PDF document
    const pdfBytes = originalPdfResult.data.Body;
    const pdfDoc = await PDFDocument.load(pdfBytes);

    // Get the form from the PDF
    const form = pdfDoc.getForm(); // Convert database fields to properly typed DocumentField objects
    const typedFields = convertToDocumentFields(document.fields);

    // Process all conditional logic and formulas
    const processedFields = processFieldConditionalsAndFormulas(typedFields);

    // Extract signatures for certification page
    const signatures = new Map<string, string>();

    // Embed fields and signatures
    for (const field of processedFields) {
      // Collect signature data for certification page
      if (field.type === 'signature' && field.value && field.value.startsWith('data:image')) {
        // Find the signer email for this signature field
        const signer = document.signers.find((s: any) => s.id === field.signerId);
        if (signer?.email) {
          signatures.set(signer.email, field.value);
        }
      }

      // Skip fields with no value or that should be hidden
      if ((!field.value && field.type !== "checkbox") || field.isVisible === false) continue;

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
          if (field.value && field.value.startsWith("data:image")) {
            try {
              // Extract base64 data
              const base64Data = field.value.split(",")[1];
              if (!base64Data) continue;

              // Determine image format - default to PNG but check for JPEG
              let signatureImage;
              if (field.value.includes("data:image/jpeg") || field.value.includes("data:image/jpg")) {
                signatureImage = await pdfDoc.embedJpg(Buffer.from(base64Data, "base64"));
              } else {
                signatureImage = await pdfDoc.embedPng(Buffer.from(base64Data, "base64"));
              }

              // Calculate proportional dimensions to maintain aspect ratio
              const imgWidth = signatureImage.width;
              const imgHeight = signatureImage.height;

              // Maintain aspect ratio while fitting within field boundaries
              let drawWidth = field.width;
              let drawHeight = field.height;

              const imgAspect = imgWidth / imgHeight;
              const fieldAspect = field.width / field.height;

              if (imgAspect > fieldAspect) {
                // Image is wider than field proportionally
                drawHeight = field.width / imgAspect;
              } else {
                // Image is taller than field proportionally
                drawWidth = field.height * imgAspect;
              }

              // Center the image within the field
              const offsetX = (field.width - drawWidth) / 2;
              const offsetY = (field.height - drawHeight) / 2;

              // Draw the image with better positioning
              page.drawImage(signatureImage, {
                x: x + offsetX,
                y: y + offsetY,
                width: drawWidth,
                height: drawHeight,
                opacity: 1.0, // Full opacity for better visibility
              });
            } catch (error) {
              console.error("Error embedding signature:", error);
              // Add fallback text if signature embedding fails
              try {
                const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
                const fontSize = 10;
                page.drawText(field.type === "signature" ? "Signature" : "Initial", {
                  x: x + 4,
                  y: y + field.height / 2 - fontSize / 2,
                  size: fontSize,
                  font,
                  color: rgb(0.5, 0.5, 0.5),
                });
              } catch (fallbackError) {
                console.error("Error adding fallback signature text:", fallbackError);
              }
            }
          }
          break;

        case "checkbox":
          // For checkboxes, draw a checked box if value is true
          {
            // Ensure proper box dimensions - make it more square if needed
            const boxSize = Math.min(field.width, field.height);
            const centerX = x + (field.width - boxSize) / 2;
            const centerY = y + (field.height - boxSize) / 2;

            // Draw the checkbox border with consistent style
            page.drawRectangle({
              x: centerX,
              y: centerY,
              width: boxSize,
              height: boxSize,
              borderWidth: 1.5,
              borderColor: rgb(0, 0, 0),
            });

            // Draw checkmark if checked
            if (field.value === "true" || field.value === "checked") {
              // Calculate checkmark points based on box size
              const checkStartX = centerX + boxSize * 0.2;
              const checkMiddleX = centerX + boxSize * 0.4;
              const checkEndX = centerX + boxSize * 0.8;

              const checkStartY = centerY + boxSize * 0.5;
              const checkMiddleY = centerY + boxSize * 0.3;
              const checkEndY = centerY + boxSize * 0.7;

              // Draw the checkmark with thicker lines
              page.drawLine({
                start: { x: checkStartX, y: checkStartY },
                end: { x: checkMiddleX, y: checkMiddleY },
                thickness: 2,
                color: rgb(0, 0, 0),
              });

              page.drawLine({
                start: { x: checkMiddleX, y: checkMiddleY },
                end: { x: checkEndX, y: checkEndY },
                thickness: 2,
                color: rgb(0, 0, 0),
              });
            }
          }
          break;

        case "text":
        case "email":
        case "phone":
        case "number":
          // For text fields, add the text
          {
            // Load font
            const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
            const fontSize = field.fontSize || 12;

            // Apply any text color
            const textColor = field.textColor ? parseHexColor(field.textColor) : rgb(0, 0, 0);

            // Draw text with precise positioning and overflow handling
            const textValue = String(field.value || "");
            // Calculate text width to handle overflow with ellipsis
            const textWidth = font.widthOfTextAtSize(textValue, fontSize);
            const fieldContentWidth = field.width - 8; // Padding on both sides

            // Handle text overflow with ellipsis if needed
            let displayText = textValue;
            if (textWidth > fieldContentWidth) {
              // Text is too long, add ellipsis
              let truncated = textValue;
              while (font.widthOfTextAtSize(truncated + "...", fontSize) > fieldContentWidth && truncated.length > 0) {
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
          {
            const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
            let dateText = field.value || "";

            // Try to format date if it's a valid date
            try {
              if (dateText) {
                const date = new Date(dateText);
                if (!isNaN(date.getTime())) {
                  // Format date as MM/DD/YYYY for better readability
                  const month = (date.getMonth() + 1).toString().padStart(2, "0");
                  const day = date.getDate().toString().padStart(2, "0");
                  const year = date.getFullYear();
                  dateText = `${month}/${day}/${year}`;
                }
              }
            } catch (err) {
              console.error("Error formatting date:", err);
              // Use the original value if parsing fails
            }

            // Draw date text with better styling
            const fontSize = field.fontSize || 12;
            const textColor = field.textColor ? parseHexColor(field.textColor) : rgb(0, 0, 0);

            // Calculate text width for potential truncation
            const textWidth = font.widthOfTextAtSize(dateText, fontSize);
            const fieldWidth = field.width - 8;

            // Truncate if needed
            if (textWidth > fieldWidth) {
              dateText = dateText.substring(0, Math.floor(dateText.length * (fieldWidth / textWidth)) - 3) + "...";
            }

            // Calculate vertical position for better alignment
            const textHeight = font.heightAtSize(fontSize);
            const centerY = y + field.height / 2 - textHeight / 3;

            page.drawText(dateText, {
              x: x + 4,
              y: centerY,
              size: fontSize,
              font,
              color: textColor,
            });
          }
          break;
        case "dropdown":
        case "radio":
          // For dropdown and radio fields, draw the selected option
          {
            const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
            const fontSize = field.fontSize || 12;
            const textColor = field.textColor ? parseHexColor(field.textColor) : rgb(0, 0, 0);

            const displayValue = field.value || "";

            // Calculate text width for potential truncation
            const textWidth = font.widthOfTextAtSize(displayValue, fontSize);
            const fieldWidth = field.width - 8;

            // Handle text overflow with ellipsis if needed
            let formattedValue = displayValue;
            if (textWidth > fieldWidth) {
              let truncated = displayValue;
              while (font.widthOfTextAtSize(truncated + "...", fontSize) > fieldWidth && truncated.length > 0) {
                truncated = truncated.slice(0, -1);
              }
              formattedValue = truncated + "...";
            }

            // Calculate vertical position for better alignment
            const textHeight = font.heightAtSize(fontSize);
            const centerY = y + field.height / 2 - textHeight / 3;

            // Draw the text with proper positioning
            page.drawText(formattedValue, {
              x: x + 4,
              y: centerY,
              size: fontSize,
              font,
              color: textColor,
            });

            // For radio buttons, draw a visual indication of selection
            if (field.type === "radio" && field.options) {
              try {
                // Check if options are available and draw a radio button
                const options = field.options?.split(",").map((o) => o.trim()) || [];
                if (field.value && options.includes(field.value)) {
                  // Draw a filled circle for the selected option
                  const circleRadius = Math.min(8, field.height * 0.2);
                  const circleX = x + field.width - circleRadius * 2;
                  const circleY = y + field.height / 2;

                  // Draw outer circle
                  page.drawCircle({
                    x: circleX,
                    y: circleY,
                    size: circleRadius * 2,
                    borderWidth: 1,
                    borderColor: rgb(0, 0, 0),
                    opacity: 0.8,
                  });

                  // Draw inner filled circle to indicate selection
                  page.drawCircle({
                    x: circleX,
                    y: circleY,
                    size: circleRadius * 1.2, // Diameter is twice the radius
                    color: rgb(0, 0, 0),
                    opacity: 0.8,
                  });
                }
              } catch (error) {
                console.error("Error drawing radio options:", error);
              }
            }
          }
          break;

        case "formula":
          // For formula fields, draw the computed value with special formatting
          {
            const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
            const fontSize = field.fontSize || 12;
            const textColor = field.textColor ? parseHexColor(field.textColor) : rgb(0, 0, 0);

            let displayValue = field.value || "";

            // Try to identify and format numeric results
            const numValue = parseFloat(displayValue);
            if (!isNaN(numValue)) {
              // If it seems to be a monetary value (has 2 decimal places)
              if (field.validationRule && (field.validationRule.includes("*") || field.validationRule.includes("+") || field.validationRule.includes("-") || field.validationRule.includes("/"))) {
                // Format with 2 decimal places for calculations
                displayValue = numValue.toFixed(2);
              } else if (Number.isInteger(numValue)) {
                // Use integer format if it's a whole number
                displayValue = numValue.toString();
              }
            }

            // Calculate text width for potential truncation
            const textWidth = font.widthOfTextAtSize(displayValue, fontSize);
            const fieldWidth = field.width - 8;

            // Handle text overflow with ellipsis if needed
            if (textWidth > fieldWidth) {
              let truncated = displayValue;
              while (font.widthOfTextAtSize(truncated + "...", fontSize) > fieldWidth && truncated.length > 0) {
                truncated = truncated.slice(0, -1);
              }
              displayValue = truncated + "...";
            }

            // Calculate vertical position for better alignment
            const textHeight = font.heightAtSize(fontSize);
            const centerY = y + field.height / 2 - textHeight / 3;

            // Draw the formula result
            page.drawText(displayValue, {
              x: x + 4,
              y: centerY,
              size: fontSize,
              font,
              color: textColor,
            });
          }
          break;

        case "payment":
          // For payment fields, format the value as currency
          {
            const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
            const fontSize = field.fontSize || 12;
            const textColor = field.textColor ? parseHexColor(field.textColor) : rgb(0, 0, 0);

            // Format as currency
            let formattedValue = field.value || "$0.00";
            if (field.value) {
              try {
                const numValue = parseFloat(field.value);
                if (!isNaN(numValue)) {
                  formattedValue = new Intl.NumberFormat("en-US", {
                    style: "currency",
                    currency: "USD",
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  }).format(numValue);
                }
              } catch (error) {
                console.error("Error formatting payment value:", error);
                // Use original value if formatting fails
              }
            }

            // Calculate text width for potential truncation
            const textWidth = font.widthOfTextAtSize(formattedValue, fontSize);
            const fieldWidth = field.width - 8;

            // Handle text overflow with ellipsis if needed
            if (textWidth > fieldWidth) {
              let truncated = formattedValue;
              while (font.widthOfTextAtSize(truncated + "...", fontSize) > fieldWidth && truncated.length > 0) {
                truncated = truncated.slice(0, -1);
              }
              formattedValue = truncated + "...";
            }

            // Calculate vertical position for better alignment
            const textHeight = font.heightAtSize(fontSize);
            const centerY = y + field.height / 2 - textHeight / 3;

            // Draw the payment value with proper currency formatting
            page.drawText(formattedValue, {
              x: x + 4,
              y: centerY,
              size: fontSize,
              font,
              color: textColor,
            });
          }
          break;

        default:
          // Default handling for any other field types
          {
            const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
            const fontSize = field.fontSize || 12;
            const textColor = field.textColor ? parseHexColor(field.textColor) : rgb(0, 0, 0);

            const displayValue = field.value || "";

            // Calculate text width for potential truncation
            const textWidth = font.widthOfTextAtSize(displayValue, fontSize);
            const fieldWidth = field.width - 8;

            // Handle text overflow with ellipsis if needed
            let formattedValue = displayValue;
            if (textWidth > fieldWidth) {
              let truncated = displayValue;
              while (font.widthOfTextAtSize(truncated + "...", fontSize) > fieldWidth && truncated.length > 0) {
                truncated = truncated.slice(0, -1);
              }
              formattedValue = truncated + "...";
            }

            // Calculate vertical position for better alignment
            const textHeight = font.heightAtSize(fontSize);
            const centerY = y + field.height / 2 - textHeight / 3;

            // Draw the generic field value
            page.drawText(formattedValue, {
              x: x + 4,
              y: centerY,
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

    // Add document ID in the top left corner of every page
    await addDocumentIdHeader(pdfDoc, document.id);

    // Add document metadata
    pdfDoc.setTitle(document.title || "Signed Document by Royal Sign");
    pdfDoc.setSubject("Electronically Signed Document by Royal Sign");
    pdfDoc.setKeywords(["royalmotionit", "electronic signature", "signed document", "legal document", document.id]);
    pdfDoc.setProducer("Royal Sign E-Signature Platform");
    pdfDoc.setCreator("Royal Sign");
    pdfDoc.setAuthor(document.authorName || "Royal Sign");

    // Set creation and modification dates
    if (document.createdAt) {
      // For PDF metadata, we still need to use JavaScript Date objects,
      // but we'll adjust to Bangladesh time (+6 hours)
      const creationDate = new Date(document.createdAt);
      creationDate.setTime(creationDate.getTime() + 6 * 60 * 60 * 1000);
      pdfDoc.setCreationDate(creationDate);
    }

    // Set modification date to current time in Bangladesh
    const modificationDate = new Date();
    modificationDate.setTime(modificationDate.getTime() + 6 * 60 * 60 * 1000);
    pdfDoc.setModificationDate(modificationDate); // Flatten the form - this makes all form fields part of the document content
    form.flatten();

    // Use the existing document hash from the database
    const documentHash = document.hash || "Not available";

    // Get client info from signers (if available)
    const signerClientInfo = {
      userAgent: document.signers[0].userAgent || "Not Recorded",
      ipAddress: document.signers[0].ipAddress || "Not Recorded",
    };

    // Add certification page with signature verification information
    await addCertificationPage(pdfDoc, document, document.signers, documentHash, signerClientInfo, signatures);

    // Save the PDF
    let finalPdfBytes;
    try {
      finalPdfBytes = await pdfDoc.save();

      // Embed attachments if any exist
      // We'll import our attachment handler to embed files in the PDF
      const { embedAttachmentsInPdf } = await import("./attachment-actions");
      finalPdfBytes = await embedAttachmentsInPdf(document.id, finalPdfBytes);
      
      // Secure the PDF using node-qpdf to prevent manipulation
      console.log("Securing PDF with node-qpdf...");
      const { Qpdf } = await import('node-qpdf');
      const fs = await import('fs');
      const path = await import('path');
      const os = await import('os');
      
      // Create temporary files for the qpdf process
      const tempDir = os.tmpdir();
      const inputPath = path.join(tempDir, `${document.id}-original.pdf`);
      const outputPath = path.join(tempDir, `${document.id}-secured.pdf`);
      
      // Write the PDF bytes to a temporary file
      await fs.promises.writeFile(inputPath, Buffer.from(finalPdfBytes));
      
      // Create a secure owner password (only used internally)
      const ownerPassword = `Royal-${document.id}-${Date.now()}`;
      
      // Configure qpdf options
      const qpdf = new Qpdf();
      await qpdf.encrypt({
        keyLength: 256,
        inputFile: inputPath,
        outputFile: outputPath,
        password: "", // No user password needed - document can be opened by anyone
        ownerPassword: ownerPassword, // But owner password prevents editing
        allowPrinting: true,
        allowModify: false, // No editing allowed
        allowCopy: true, // Allow copying text
        allowAnnotations: false, // No annotations allowed
      });
      
      // Read the secured PDF back into memory
      finalPdfBytes = await fs.promises.readFile(outputPath);
      
      // Clean up temporary files
      try {
        await fs.promises.unlink(inputPath);
        await fs.promises.unlink(outputPath);
      } catch (cleanupError) {
        console.error("Error cleaning up temporary PDF files:", cleanupError);
        // Non-fatal error - continue with the process
      }
      
      console.log("PDF secured successfully");
    } catch (error) {
      console.error("Error saving or securing PDF document:", error);
      return {
        success: false,
        message: "Failed to generate final PDF document",
        error: String(error),
      };
    }

    // Create a unique key for the signed document
    // Include timestamp to ensure it's always a unique file (using Bangladesh time)
    const bdTimestamp = Date.now() + 6 * 60 * 60 * 1000; // Adjust timestamp to Bangladesh time
    const finalKey = `documents/${document.id}-${bdTimestamp}-signed.pdf`;

    // Store reference to previous signed document if exists for cleanup later
    const previousSignedUrl = document.url;
    const previousKey = document.key;

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

    try {
      await deleteFromR2({
        Bucket: process.env.R2_BUCKET_NAME,
        Key: previousKey,
      });
    } catch (e) {
      console.error("Error deleting previous signed document from R2:", e);
      // Non-fatal error - we continue even if the deletion fails
    }

    // Update document status and URL
    // Create a date object representing current time in Bangladesh
    const bdSignedAt = new Date();
    bdSignedAt.setTime(bdSignedAt.getTime() + 6 * 60 * 60 * 1000);

    await prisma.document.update({
      where: { id: documentId },
      data: {
        status: "COMPLETED",
        documentType: "SIGNED",
        signedAt: bdSignedAt,
        url: `${process.env.R2_PUBLIC_URL}/${finalKey}`,
        key: finalKey,
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
        details: JSON.stringify({
          fieldsEmbedded: true,
          finalDocumentUrl: `${process.env.R2_PUBLIC_URL}/${finalKey}`,
        }),
      },
    });

    // Send the signed PDF document to the signer via email
    try {
      // Get the first signer (single signer model)
      const signer = document.signers[0];

      if (signer && signer.email) {
        // Import the email action to send signed document with PDF attachment
        const { sendSignedDocumentWithPdf, sendSignedDocumentWithPdfToAdmin } = await import("@/actions/email");

        // Send email with PDF attachment to the signer
        await sendSignedDocumentWithPdf(
          signer.name || "Signer",
          signer.email,
          document.title || "Signed Document",
          documentId,
          finalPdfBytes,
          document.authorName || "Royal Sign",
          document.authorEmail || undefined,
          "Your document has been successfully signed. Please find the attached PDF for your records."
        );

        console.log(`Sent signed PDF via email to ${signer.email}`);

        await sendSignedDocumentWithPdfToAdmin(
          document.author.name,
          document.author.email,
          document.title,
          documentId,
          signer.name,
          signer.email,
          finalPdfBytes,
          "The document has been successfully signed by the signer. Please find the attached PDF for your records."
        );

        console.log(`Sent signed PDF to admin for document ${documentId}`);
      }
    } catch (emailError) {
      console.error("Error sending signed PDF via email:", emailError);
      // Non-fatal error - we continue even if the email fails
    }

    // Revalidate paths
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

/**
 * Add a certification page at the end of the PDF document
 * This page includes details about the signing process, document hash, and participant information
 *
 * @param pdfDoc PDF document object
 * @param document Document object with metadata
 * @param signers Array of signers
 * @param documentHash SHA256 hash of the original document
 * @param clientInfo Client information including IP address and user agent
 * @param signatures Map of signer email to signature image data
 */
async function addCertificationPage(pdfDoc: PDFDocument, document: any, signers: any[], documentHash: string, clientInfo?: { userAgent?: string; ipAddress?: string }, signatures?: Map<string, string>) {
  // Add a new page at the end of the document for certification
  const certPage = pdfDoc.addPage();
  const { width, height } = certPage.getSize();

  // Embed fonts we'll use on the page
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica);

  // Define text sizes and colors
  const titleSize = 16;
  const headingSize = 12;
  const textSize = 10;
  const smallTextSize = 8;

  // Define colors
  const titleColor = rgb(0.1, 0.1, 0.4); // Dark blue
  const headingColor = rgb(0.2, 0.2, 0.2); // Dark gray
  const textColor = rgb(0.3, 0.3, 0.3); // Medium gray
  const lineColor = rgb(0.8, 0.8, 0.8); // Light gray

  // Add logo to the top right corner of the certification page
  try {
    // Read the logo file - resolve path correctly from project root
    const logoPath = path.resolve(process.cwd(), 'assets', 'name_logo.png');
    const logoBytes = fs.readFileSync(logoPath);
    const logoImage = await pdfDoc.embedPng(logoBytes);
    
    // Get dimensions of the logo
    const logoWidth = 120; // Set fixed width for the logo
    const aspectRatio = logoImage.height / logoImage.width;
    const logoHeight = logoWidth * aspectRatio;
    
    // Draw the logo in the top right corner
    certPage.drawImage(logoImage, {
      x: width - logoWidth - 50, // Position from right edge with 50pt margin
      y: height - logoHeight - 30, // Position from top edge with 30pt margin
      width: logoWidth,
      height: logoHeight,
    });
    
    // Add certificate generation time below the logo
    const generationTime = formatBangladeshiTime(new Date());
    const timeText = `Generated: ${generationTime}`;
    
    // Draw the generation time text below the logo
    certPage.drawText(timeText, {
      x: width - regularFont.widthOfTextAtSize(timeText, smallTextSize) - 50, // Right align with same margin as logo
      y: height - logoHeight - 45, // Position below the logo with some spacing
      size: smallTextSize,
      font: regularFont,
      color: textColor,
    });
  } catch (error) {
    console.error("Error embedding logo in certification page:", error);
    // Continue without logo if there's an error
    
    // Still add generation time even if logo fails
    const generationTime = formatBangladeshiTime(new Date());
    const timeText = `Generated: ${generationTime}`;
    
    certPage.drawText(timeText, {
      x: width - regularFont.widthOfTextAtSize(timeText, smallTextSize) - 50,
      y: height - 45, // Position at top right if no logo
      size: smallTextSize,
      font: regularFont,
      color: textColor,
    });
  }

  // Title of certification page
  certPage.drawText("Electronic Signature Certification", {
    x: 50,
    y: height - 50,
    size: titleSize,
    font: boldFont,
    color: titleColor,
  });

  // Section: Document Information
  let yPosition = height - 90;

  certPage.drawText("Document Information", {
    x: 50,
    y: yPosition,
    size: headingSize,
    font: boldFont,
    color: headingColor,
  });

  yPosition -= 25;

  // Document ID
  certPage.drawText("Document ID:", {
    x: 50,
    y: yPosition,
    size: textSize,
    font: boldFont,
    color: textColor,
  });

  certPage.drawText(document.id || "Unknown", {
    x: 150,
    y: yPosition,
    size: textSize,
    font: regularFont,
    color: textColor,
  });

  yPosition -= 20;

  // Document Title
  certPage.drawText("Title:", {
    x: 50,
    y: yPosition,
    size: textSize,
    font: boldFont,
    color: textColor,
  });

  certPage.drawText(document.title || "Untitled Document", {
    x: 150,
    y: yPosition,
    size: textSize,
    font: regularFont,
    color: textColor,
  });

  yPosition -= 20;

  // Document Hash
  certPage.drawText("Document Hash:", {
    x: 50,
    y: yPosition,
    size: textSize,
    font: boldFont,
    color: textColor,
  });

  // For hash display, check if it's long and needs to be displayed in a special way
  const hash = documentHash || "Not available";
  if (hash.length > 40) {
    // Display hash in a shorter format by showing first and last parts
    const displayHash = `${hash.substring(0, 15)}...${hash.substring(hash.length - 15)}`;
    certPage.drawText(displayHash, {
      x: 150,
      y: yPosition,
      size: textSize,
      font: regularFont,
      color: textColor,
    });

    // Add full hash in smaller text below
    yPosition -= 15;
    certPage.drawText("Full hash:", {
      x: 50,
      y: yPosition,
      size: smallTextSize,
      font: boldFont,
      color: textColor,
    });

    certPage.drawText(hash, {
      x: 150,
      y: yPosition,
      size: smallTextSize,
      font: regularFont,
      color: textColor,
    });
  } else {
    certPage.drawText(hash, {
      x: 150,
      y: yPosition,
      size: textSize,
      font: regularFont,
      color: textColor,
    });
  }

  yPosition -= 20;

  // Created Date
  certPage.drawText("Created Date:", {
    x: 50,
    y: yPosition,
    size: textSize,
    font: boldFont,
    color: textColor,
  });

  const createdDate = document.createdAt ? formatBangladeshiTime(document.createdAt) : "Unknown";

  certPage.drawText(createdDate, {
    x: 150,
    y: yPosition,
    size: textSize,
    font: regularFont,
    color: textColor,
  });

  yPosition -= 20;

  // Completion Date
  certPage.drawText("Completed Date:", {
    x: 50,
    y: yPosition,
    size: textSize,
    font: boldFont,
    color: textColor,
  });

  const completedDate = document.signedAt ? formatBangladeshiTime(document.signedAt) : formatBangladeshiTime(new Date());

  certPage.drawText(completedDate, {
    x: 150,
    y: yPosition,
    size: textSize,
    font: regularFont,
    color: textColor,
  });

  // Horizontal line
  yPosition -= 30;
  certPage.drawLine({
    start: { x: 50, y: yPosition },
    end: { x: width - 50, y: yPosition },
    thickness: 1,
    color: lineColor,
  });

  // Section: Author Information
  yPosition -= 30;

  certPage.drawText("Document Author", {
    x: 50,
    y: yPosition,
    size: headingSize,
    font: boldFont,
    color: headingColor,
  });

  yPosition -= 25;

  // Author Name
  certPage.drawText("Name:", {
    x: 50,
    y: yPosition,
    size: textSize,
    font: boldFont,
    color: textColor,
  });

  certPage.drawText(document.author.name || "Unknown", {
    x: 150,
    y: yPosition,
    size: textSize,
    font: regularFont,
    color: textColor,
  });

  yPosition -= 20;

  // Author Email
  certPage.drawText("Email:", {
    x: 50,
    y: yPosition,
    size: textSize,
    font: boldFont,
    color: textColor,
  });

  certPage.drawText(document.author.email || "Unknown", {
    x: 150,
    y: yPosition,
    size: textSize,
    font: regularFont,
    color: textColor,
  });

  // Horizontal line
  yPosition -= 30;
  certPage.drawLine({
    start: { x: 50, y: yPosition },
    end: { x: width - 50, y: yPosition },
    thickness: 1,
    color: lineColor,
  });

  // Section: Signer Information
  yPosition -= 30;

  certPage.drawText("Signature Information", {
    x: 50,
    y: yPosition,
    size: headingSize,
    font: boldFont,
    color: headingColor,
  });

  // For each signer
  for (const signer of signers) {
    if (signer.status === "COMPLETED") {
      yPosition -= 25;

      // Signer Name
      certPage.drawText("Signer Name:", {
        x: 50,
        y: yPosition,
        size: textSize,
        font: boldFont,
        color: textColor,
      });

      certPage.drawText(signer.name || "Unknown", {
        x: 150,
        y: yPosition,
        size: textSize,
        font: regularFont,
        color: textColor,
      });

      yPosition -= 20;

      // Signer Email
      certPage.drawText("Signer Email:", {
        x: 50,
        y: yPosition,
        size: textSize,
        font: boldFont,
        color: textColor,
      });

      certPage.drawText(signer.email || "Unknown", {
        x: 150,
        y: yPosition,
        size: textSize,
        font: regularFont,
        color: textColor,
      });

      yPosition -= 20;

      // Signed Date
      certPage.drawText("Signed Date:", {
        x: 50,
        y: yPosition,
        size: textSize,
        font: boldFont,
        color: textColor,
      });

      const signedDate = signer.completedAt ? formatBangladeshiTime(signer.completedAt) : "Unknown";

      certPage.drawText(signedDate, {
        x: 150,
        y: yPosition,
        size: textSize,
        font: regularFont,
        color: textColor,
      });

      yPosition -= 30;

      // Add signer's signature if available
      certPage.drawText("Signature:", {
        x: 50,
        y: yPosition,
        size: textSize,
        font: boldFont,
        color: textColor,
      });

      // Look for a signature in the passed signatures map first, then fallback to document fields
      let signerSignatureValue = signatures?.get(signer.email);
      
      if (!signerSignatureValue) {
        // Fallback to looking in document fields if not found in signatures map
        const signerSignatureField = document.fields.find((field: any) => 
          field.type === 'signature' && field.signerEmail === signer.email && field.value
        );
        signerSignatureValue = signerSignatureField?.value;
      }

      if (signerSignatureValue && signerSignatureValue.startsWith('data:image')) {
        try {
          // Extract base64 data
          const base64Data = signerSignatureValue.split(",")[1];
          if (base64Data) {
            // Determine image format and embed
            let signatureImage;
            if (signerSignatureValue.includes("data:image/jpeg") || signerSignatureValue.includes("data:image/jpg")) {
              signatureImage = await pdfDoc.embedJpg(Buffer.from(base64Data, "base64"));
            } else {
              signatureImage = await pdfDoc.embedPng(Buffer.from(base64Data, "base64"));
            }

            // Calculate proportional dimensions while keeping signature a reasonable size
            const imgWidth = signatureImage.width;
            const imgHeight = signatureImage.height;
            
            // Set a maximum width for the signature on the certification page
            const maxSignatureWidth = 150;
            const maxSignatureHeight = 50;
            
            // Calculate display dimensions maintaining aspect ratio
            let drawWidth = imgWidth;
            let drawHeight = imgHeight;
            
            if (drawWidth > maxSignatureWidth) {
              const scale = maxSignatureWidth / drawWidth;
              drawWidth = maxSignatureWidth;
              drawHeight = imgHeight * scale;
            }
            
            if (drawHeight > maxSignatureHeight) {
              const scale = maxSignatureHeight / drawHeight;
              drawHeight = maxSignatureHeight;
              drawWidth = drawWidth * scale;
            }

            // Draw the signature image
            certPage.drawImage(signatureImage, {
              x: 150,
              y: yPosition - drawHeight + 10, // Position it nicely relative to the text
              width: drawWidth,
              height: drawHeight,
              opacity: 1.0
            });
            
            // Adjust position further based on signature height
            yPosition -= Math.max(20, drawHeight);
          } else {
            // Text fallback if no valid base64 data
            certPage.drawText("(Digital signature applied)", {
              x: 150,
              y: yPosition,
              size: textSize,
              font: regularFont,
              color: textColor,
            });
            yPosition -= 20;
          }
        } catch (error) {
          console.error("Error embedding signature in certification page:", error);
          // Fallback text
          certPage.drawText("(Digital signature applied)", {
            x: 150,
            y: yPosition,
            size: textSize,
            font: regularFont,
            color: textColor,
          });
          yPosition -= 20;
        }
      } else {
        // No signature image available
        certPage.drawText("(Digital signature applied)", {
          x: 150,
          y: yPosition,
          size: textSize,
          font: regularFont,
          color: textColor,
        });
        yPosition -= 20;
      }
    }
  }

  // Horizontal line
  yPosition -= 30;
  certPage.drawLine({
    start: { x: 50, y: yPosition },
    end: { x: width - 50, y: yPosition },
    thickness: 1,
    color: lineColor,
  });

  // Section: System Information
  yPosition -= 30;

  certPage.drawText("System Information", {
    x: 50,
    y: yPosition,
    size: headingSize,
    font: boldFont,
    color: headingColor,
  });

  yPosition -= 25;

  // IP Address
  certPage.drawText("IP Address:", {
    x: 50,
    y: yPosition,
    size: textSize,
    font: boldFont,
    color: textColor,
  });

  certPage.drawText(clientInfo?.ipAddress || "Not recorded", {
    x: 150,
    y: yPosition,
    size: textSize,
    font: regularFont,
    color: textColor,
  });

  yPosition -= 20;

  // User Agent
  certPage.drawText("User Agent:", {
    x: 50,
    y: yPosition,
    size: textSize,
    font: boldFont,
    color: textColor,
  });

  // User agent might be long, so handle wrapping if needed
  const userAgent = clientInfo?.userAgent || "Not recorded";
  const maxWidth = width - 200;
  const userAgentWidth = regularFont.widthOfTextAtSize(userAgent, textSize);

  if (userAgentWidth > maxWidth) {
    // Split into multiple lines if too long
    let userAgentText = "";
    let currentLine = "";
    const words = userAgent.split(" ");

    for (const word of words) {
      const testLine = currentLine + (currentLine ? " " : "") + word;
      const lineWidth = regularFont.widthOfTextAtSize(testLine, textSize);

      if (lineWidth < maxWidth) {
        currentLine = testLine;
      } else {
        // Draw the current line
        certPage.drawText(currentLine, {
          x: 150,
          y: yPosition,
          size: textSize,
          font: regularFont,
          color: textColor,
        });

        // Move to next line
        yPosition -= 15;
        currentLine = word;
      }
    }

    // Draw the last line
    if (currentLine) {
      certPage.drawText(currentLine, {
        x: 150,
        y: yPosition,
        size: textSize,
        font: regularFont,
        color: textColor,
      });
    }
  } else {
    // Single line is fine
    certPage.drawText(userAgent, {
      x: 150,
      y: yPosition,
      size: textSize,
      font: regularFont,
      color: textColor,
    });
  }

  // Footer with verification text
  const footerY = 50;
  const footerText = `This document was electronically signed through Royal Sign E-Signature Platform. To verify this document, please visit ${process.env.NEXT_PUBLIC_APP_URL || "the Royal Sign platform"}.`;

  // Calculate text wrap for footer
  const maxFooterWidth = width - 100;
  const words = footerText.split(" ");
  let currentLine = "";
  let footerYPosition = footerY;

  for (const word of words) {
    const testLine = currentLine + (currentLine ? " " : "") + word;
    const lineWidth = regularFont.widthOfTextAtSize(testLine, smallTextSize);

    if (lineWidth < maxFooterWidth) {
      currentLine = testLine;
    } else {
      // Draw the current line
      certPage.drawText(currentLine, {
        x: 50,
        y: footerYPosition,
        size: smallTextSize,
        font: regularFont,
        color: textColor,
      });

      // Move to next line
      footerYPosition -= 12;
      currentLine = word;
    }
  }

  // Draw the last line
  if (currentLine) {
    certPage.drawText(currentLine, {
      x: 50,
      y: footerYPosition,
      size: smallTextSize,
      font: regularFont,
      color: textColor,
    });
  }
}

/**
 * Format a date object or date string to Bangladeshi time format: DD-MMM-YYYY HH:MM:SS
 *
 * @param date Date object or date string
 * @returns Formatted date string in Bangladeshi time
 */
function formatBangladeshiTime(date: Date | string | undefined): string {
  if (!date) return "Unknown";

  const dateObj = typeof date === "string" ? new Date(date) : date;

  // Bangladesh is UTC+6
  const bangladeshiTime = new Date(dateObj.getTime() + 6 * 60 * 60 * 1000);

  // Format to DD-MMM-YYYY HH:MM:SS
  const day = bangladeshiTime.getUTCDate().toString().padStart(2, "0");
  const month = bangladeshiTime.toLocaleString("en", { month: "short", timeZone: "UTC" });
  const year = bangladeshiTime.getUTCFullYear();
  const hours = bangladeshiTime.getUTCHours().toString().padStart(2, "0");
  const minutes = bangladeshiTime.getUTCMinutes().toString().padStart(2, "0");
  const seconds = bangladeshiTime.getUTCSeconds().toString().padStart(2, "0");

  return `${day}-${month}-${year} ${hours}:${minutes}:${seconds}`;
}
