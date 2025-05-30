"use server";

import fs from "fs";
import path from "path";
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
      if (field.type === "signature" && field.value && field.value.startsWith("data:image")) {
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
    } catch (error) {
      console.error("Error saving PDF document:", error);
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
async function addCertificationPage(
  pdfDoc: PDFDocument,
  document: any,
  signers: any[],
  documentHash: string,
  clientInfo?: { userAgent?: string; ipAddress?: string },
  signatures?: Map<string, string>
) {
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
    // Use base64 encoded logo instead of reading from filesystem
    // This ensures the logo is available in any deployment environment
    const logoBase64 =
      "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";

    // Decode and embed the logo
    const logoBytes = Buffer.from(logoBase64, "base64");
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
        const signerSignatureField = document.fields.find((field: any) => field.type === "signature" && field.signerEmail === signer.email && field.value);
        signerSignatureValue = signerSignatureField?.value;
      }

      if (signerSignatureValue && signerSignatureValue.startsWith("data:image")) {
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
              opacity: 1.0,
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
