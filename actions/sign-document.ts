"use server";

import { prisma } from "@/prisma/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { generateFinalPDF } from "./pdf-generator";
import {
  sendDocumentSignRequestEmail,
  sendDocumentSignedNotification,
} from "./email";
import { evaluateFormula, isFieldVisible } from "./formula-evaluator";

import { validateField } from "@/schema/document-fields";
import { DocumentFieldType } from "@/types/document";
import {
  convertToDocumentField,
  convertToDocumentFields,
} from "@/utils/document-field-converter";
import {
  FieldValidationError,
  DocumentValidationResult,
} from "@/types/validation";

/**
 * Validate field values based on their type before saving
 * Enhanced with better error handling and type-specific validations
 *
 * @param field The complete field object
 * @param value Value to validate
 * @returns Validation result with error message if invalid
 */
function validateFieldValue(
  field: any,
  value: string,
): { valid: boolean; error?: string } {
  // Skip validation if value is empty (unless field is required, handled separately)
  if (
    !value ||
    (typeof value === "string" && value.trim() === "" && !field.required)
  ) {
    return { valid: true };
  }

  try {
    // Type-specific custom validation before using Zod
    switch (field.type) {
      case "email":
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          return {
            valid: false,
            error: `Invalid email address for "${field.label}"`,
          };
        }
        break;
      case "date":
        if (value && !isNaN(new Date(value).getTime())) {
          // Valid date, but check for range constraints if specified
          if (field.validationRule && field.validationRule.includes("range:")) {
            const rangeMatch = field.validationRule.match(
              /range:([^,]+),([^,]+)/,
            );
            if (rangeMatch) {
              const [_, minStr, maxStr] = rangeMatch;
              let min: Date | null = null;
              let max: Date | null = null;

              // Parse date ranges - support special values like "today"
              if (minStr === "today") {
                min = new Date();
                min.setHours(0, 0, 0, 0);
              } else {
                min = new Date(minStr);
              }

              if (maxStr === "today") {
                max = new Date();
                max.setHours(23, 59, 59, 999);
              } else {
                max = new Date(maxStr);
              }

              const dateValue = new Date(value);

              if (min && !isNaN(min.getTime()) && dateValue < min) {
                return {
                  valid: false,
                  error: `Date for "${field.label}" must be on or after ${min.toLocaleDateString()}`,
                };
              }

              if (max && !isNaN(max.getTime()) && dateValue > max) {
                return {
                  valid: false,
                  error: `Date for "${field.label}" must be on or before ${max.toLocaleDateString()}`,
                };
              }
            }
          }
        } else {
          return {
            valid: false,
            error: `Invalid date format for "${field.label}"`,
          };
        }
        break;
    }

    // Create a copy of the field with the value to validate
    const fieldToValidate = { ...field, value };
    // Use our Zod schemas to validate
    const result = validateField(fieldToValidate);

    if (!result.success) {
      // Extract error message from Zod validation result with improved formatting
      let errorMessage = "Invalid value";

      if (
        typeof result.error === "object" &&
        result.error &&
        "issues" in result.error
      ) {
        const issue = result.error.issues[0];
        errorMessage = issue?.message || "Invalid value";

        // Enhance error message based on the validation issue
        if (issue?.code === "too_small") {
          errorMessage = `Value is too short (minimum ${issue.minimum} characters)`;
        } else if (issue?.code === "too_big") {
          errorMessage = `Value is too long (maximum ${issue.maximum} characters)`;
        }
      }

      return {
        valid: false,
        error: `${errorMessage} for "${field.label || field.id}"`,
      };
    }

    return { valid: true };
  } catch (error) {
    console.error(`Validation error for field ${field.id}:`, error);
    return {
      valid: false,
      error: `Validation error for "${field.label || field.id}": ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

/**
 * Process conditional logic for document fields
 * @param logic Conditional logic object
 * @param sourceFieldId ID of the field that triggered the logic
 * @param sourceValue Value of the source field
 * @param allFields All document fields
 */
async function handleConditionalLogic(
  logic: any,
  sourceFieldId: string,
  sourceValue: string,
  allFields: any[],
) {
  // Validate logic structure
  if (!logic.condition || !logic.action || !logic.targetFieldId) {
    console.error("Invalid conditional logic structure:", logic);
    return;
  }

  // Find the target field
  const targetField = allFields.find((f) => f.id === logic.targetFieldId);
  if (!targetField) {
    console.error("Target field not found:", logic.targetFieldId);
    return;
  }

  // Evaluate the condition
  let conditionMet = false;

  switch (logic.condition.type) {
    case "equals":
      conditionMet = sourceValue === logic.condition.value;
      break;
    case "notEquals":
      conditionMet = sourceValue !== logic.condition.value;
      break;
    case "contains":
      conditionMet = sourceValue.includes(logic.condition.value);
      break;
    case "notContains":
      conditionMet = !sourceValue.includes(logic.condition.value);
      break;
    case "greaterThan":
      conditionMet = Number(sourceValue) > Number(logic.condition.value);
      break;
    case "lessThan":
      conditionMet = Number(sourceValue) < Number(logic.condition.value);
      break;
    case "isChecked":
      conditionMet = sourceValue === "true" || sourceValue === "checked";
      break;
    case "isNotChecked":
      conditionMet = sourceValue !== "true" && sourceValue !== "checked";
      break;
    case "isEmpty":
      // Handle null, undefined, and empty string values safely
      conditionMet = !sourceValue || (typeof sourceValue === 'string' && sourceValue.trim() === "");
      break;
    case "isNotEmpty":
      // Handle null, undefined, and empty string values safely
      conditionMet = !!sourceValue && (typeof sourceValue === 'string' && sourceValue.trim() !== "");
      break;
    default:
      console.error("Unknown condition type:", logic.condition.type);
      return;
  }
  // Apply the action if condition is met
  if (conditionMet) {
    switch (logic.action.type) {
      case "show":
        // Since there's no visible field, we'll use conditionalLogic to track visibility
        // We'll store visibility state in the conditional logic itself
        const showLogic = JSON.stringify({
          ...JSON.parse(targetField.conditionalLogic || "{}"),
          isVisible: true,
        });
        await prisma.documentField.update({
          where: { id: targetField.id },
          data: { conditionalLogic: showLogic },
        });
        break;
      case "hide":
        // Store visibility state in conditionalLogic
        const hideLogic = JSON.stringify({
          ...JSON.parse(targetField.conditionalLogic || "{}"),
          isVisible: false,
        });
        await prisma.documentField.update({
          where: { id: targetField.id },
          data: { conditionalLogic: hideLogic },
        });
        break;
      case "require":
        await prisma.documentField.update({
          where: { id: targetField.id },
          data: { required: true },
        });
        break;
      case "makeOptional":
        await prisma.documentField.update({
          where: { id: targetField.id },
          data: { required: false },
        });
        break;
      case "setValue":
        await prisma.documentField.update({
          where: { id: targetField.id },
          data: { value: logic.action.value || "" },
        });
        break;
      default:
        console.error("Unknown action type:", logic.action.type);
        break;
    }
  }
}

/**
 * Complete the signing process for a signer, updating field values
 * @param documentId Document ID
 * @param signerId Signer ID
 * @param fieldValues Object with field values keyed by field ID
 * @param clientInfo Optional client info including user agent and IP address
 * @returns Result of the operation with optional validation errors
 */
export async function completeDocumentSigning(
  documentId: string,
  signerId: string,
  fieldValues: Record<string, string>,
  clientInfo?: { userAgent?: string; ipAddress?: string },
): Promise<{
  success: boolean;
  message: string;
  error?: string;
  validationErrors?: FieldValidationError[];
  requiresLogin?: boolean;
  signerEmail?: string;
}> {
  try {
    // Performance optimization: Run authentication and database queries in parallel
    const queryStart = Date.now();
    
    const [session, document, documentFields] = await Promise.all([
      auth(), // Get authentication session
      prisma.document.findFirst({
        where: { id: documentId },
        include: { 
          signers: true,
          author: {
            select: { name: true, email: true }
          }
        },
      }),
      prisma.documentField.findMany({
        where: { 
          documentId,
          signerId 
        },
      }),
    ]);
    
    console.log(`Parallel database queries completed in ${Date.now() - queryStart}ms`);

    if (!document) {
      return {
        success: false,
        message: "Document not found",
      };
    }

    // Get the signer from the signers array
    const signer = document.signers.find((s) => s.id === signerId);
    if (!signer) {
      return {
        success: false,
        message: "Signer not found",
      };
    }

    // Create a typed document object with fields for compatibility
    const documentWithFields = {
      ...document,
      fields: documentFields,
    };

    // Extract author info for later use
    const documentAuthor = document.author;

    // Check if user is authenticated and is authorized to sign
    if (!session || !session.user) {
      // User is not authenticated, return error that requires login
      return {
        success: false,
        message:
          "You need to login with the email address of the signer to complete this action",
        requiresLogin: true,
        signerEmail: signer.email,
      };
    }

    // Verify email matches (basic auth)
    if (
      !session.user.email ||
      signer.email.toLowerCase() !== session.user.email.toLowerCase()
    ) {
      return {
        success: false,
        message:
          "You are not authorized to sign this document. Please login with the email address the document was sent to.",
        requiresLogin: true,
        signerEmail: signer.email,
      };
    }

    // Send notification to document author - moved to background for better performance
    setImmediate(async () => {
      try {
        // Use pre-fetched document author information (no additional DB query needed)
        if (documentAuthor && documentAuthor.email) {
          await sendDocumentSignedNotification(
            documentAuthor.name || "Document Owner",
            documentAuthor.email,
            document.title || "Untitled Document",
            document.id,
            session?.user?.name ?? signer.name ?? "Signer",
            session?.user?.email ?? signer.email ?? "",
          );
        }
      } catch (error) {
        console.error("Error sending notification to document author:", error);
        // Non-fatal error, continue with the process
      }
    });

    // Import the enhanced field validator
    const { validateAllFields } = await import("@/utils/field-validator");

    console.log("Field values received from client:", fieldValues);

    // Prepare fields with their entered values for validation
    const fieldsToValidate = documentWithFields.fields.map((field: any) => {
      if (field.signerId === signerId) {
        const finalValue = fieldValues[field.id] !== undefined ? fieldValues[field.id] : field.value || "";
        console.log(`Field ${field.id} (${field.label}): client value = "${fieldValues[field.id]}", db value = "${field.value}", final value = "${finalValue}"`);
        return {
          ...field,
          value: finalValue,
          // Ensure type is a valid DocumentFieldType
          type: field.type as DocumentFieldType,
        };
      }
      return field;
    });

    // Convert to proper DocumentField type before validation
    const typedFields = convertToDocumentFields(fieldsToValidate);

    // Validate all fields with the enhanced validator
    const validationResult = validateAllFields(typedFields);

    if (!validationResult.valid) {
      // Format error messages for display
      const errorMessages = Object.values(validationResult.fieldErrors)
        .flat()
        .map((error) => error.message);

      // Get the list of validation errors for API response
      const validationErrors = Object.values(
        validationResult.fieldErrors,
      ).flat();

      return {
        success: false,
        message: "Please correct the following issues:",
        error: errorMessages.join(" "), // Convert array to string for the error property
        validationErrors,
      };
    }

    // Batch update all field values for better performance
    const fieldUpdates = [];
    const validationErrors: FieldValidationError[] = [];

    for (const fieldId in fieldValues) {
      // Make sure the field belongs to the document and signer
      const field = documentWithFields.fields.find((f: any) => f.id === fieldId);
      if (field) {
        let value = fieldValues[fieldId];

        // Perform field-specific validation
        const validation = validateFieldValue(field, value);
        if (!validation.valid) {
          validationErrors.push({
            fieldId: field.id,
            message:
              validation.error ||
              `Invalid value for field ${field.label || field.id}`,
          });
          continue; // Skip this field as it failed validation
        }

        // Process conditional logic if present
        if (field.conditionalLogic) {
          try {
            const logic = JSON.parse(field.conditionalLogic);
            const typedFields = convertToDocumentFields(documentWithFields.fields);
            // Execute conditional logic
            handleConditionalLogic(logic, field.id, value, typedFields);
          } catch (error) {
            console.error("Error processing conditional logic:", error);
            // Non-fatal, continue with the process
          }
        }

        // Format data for specific field types before saving
        if (field.type === "checkbox" && value) {
          // Normalize checkbox values
          value =
            value.toLowerCase() === "true" || value.toLowerCase() === "checked"
              ? "true"
              : "false";
        } else if (field.type === "date" && value) {
          // Attempt to format date values consistently
          try {
            const date = new Date(value);
            if (!isNaN(date.getTime())) {
              value = date.toISOString().split("T")[0]; // YYYY-MM-DD format
            }
          } catch (e) {
            // Keep original if parsing fails
          }
        }

        // Add to batch update
        fieldUpdates.push({
          where: { id: fieldId },
          data: { value },
        });
      }
    }

    // If there were validation errors, return them instead of proceeding
    if (validationErrors.length > 0) {
      return {
        success: false,
        message: `Please correct ${validationErrors.length} field(s) with errors`,
        validationErrors,
      };
    }

    // Perform batch update of all fields using transaction for better performance
    if (fieldUpdates.length > 0) {
      console.log(`Batch updating ${fieldUpdates.length} fields`);
      const startTime = Date.now();
      
      // Use a single transaction to update fields, signer status, and document status
      // This reduces database round trips and improves consistency
      await prisma.$transaction([
        // Update all field values
        ...fieldUpdates.map(update => 
          prisma.documentField.update(update)
        ),
        // Update signer status
        prisma.signer.update({
          where: { id: signerId },
          data: {
            status: "COMPLETED",
            completedAt: new Date(),
            ipAddress: clientInfo?.ipAddress || "127.0.0.1",
            userAgent: clientInfo?.userAgent || "Unknown",
            userId: session.user.id,
          },
        }),
        // Update document status
        prisma.document.update({
          where: { id: documentId },
          data: {
            status: "COMPLETED",
            signedAt: new Date(),
          },
        }),
      ]);
      
      console.log(`Combined field, signer, and document updates completed in ${Date.now() - startTime}ms`);
    } else {
      // If no field updates, still update signer and document status in a transaction
      console.log(`Updating signer and document status for ${documentId}`);
      const statusUpdateStart = Date.now();
      
      await prisma.$transaction([
        prisma.signer.update({
          where: { id: signerId },
          data: {
            status: "COMPLETED",
            completedAt: new Date(),
            ipAddress: clientInfo?.ipAddress || "127.0.0.1",
            userAgent: clientInfo?.userAgent || "Unknown",
            userId: session.user.id,
          },
        }),
        prisma.document.update({
          where: { id: documentId },
          data: {
            status: "COMPLETED",
            signedAt: new Date(),
          },
        }),
      ]);
      
      console.log(`Signer and document status updates completed in ${Date.now() - statusUpdateStart}ms`);
    }

    // Add document history entry with detailed tracking
    // Move to background for better performance
    setImmediate(async () => {
      try {
        await prisma.documentHistory.create({
          data: {
            documentId,
            action: "SIGNED",
            actorEmail: session?.user?.email ?? signer.email ?? undefined,
            actorName: session?.user?.name ?? signer.name ?? undefined,
            actorRole: "SIGNER",
            ipAddress: clientInfo?.ipAddress,
            userAgent: clientInfo?.userAgent,
            details: JSON.stringify({
              timeCompleted: new Date().toISOString(),
              fieldsCompleted: Object.keys(fieldValues).length,
              // Add other relevant metadata
            }),
          },
        });
      } catch (error) {
        console.error("Error creating document history entry:", error);
      }
    });

    // Send notification to document author - moved to background for better performance
    setImmediate(async () => {
      try {
        // Use pre-fetched document author information (no additional DB query needed)
        if (documentAuthor && documentAuthor.email) {
          await sendDocumentSignedNotification(
            documentAuthor.name || "Document Owner",
            documentAuthor.email,
            document.title || "Untitled Document",
            document.id,
            session?.user?.name ?? signer.name ?? "Signer",
            session?.user?.email ?? signer.email ?? "",
          );
        }
      } catch (error) {
        console.error("Error sending notification to document author:", error);
        // Non-fatal error, continue with the process
      }
    });

    // Process PDF generation asynchronously for better performance
    setImmediate(async () => {
      try {
        console.log(`Starting background PDF generation for document ${documentId}`);
        const pdfStart = Date.now();
        
        // Generate final PDF with all signatures and fields
        const result = await generateFinalPDF(documentId);

        console.log(`PDF generation completed in ${Date.now() - pdfStart}ms`);

        if (result.success) {
          console.log(`Document ${documentId} PDF generated successfully: ${result.url}`);
        } else {
          console.error(`PDF generation failed for document ${documentId}:`, result.message);
        }

        console.log(`Background processing completed for document ${documentId}`);
      } catch (error) {
        console.error(`Error in background document processing for ${documentId}:`, error);
      }
    });
    // Revalidate paths
    revalidatePath(`/documents/${documentId}`);
    revalidatePath(`/documents`);

    return {
      success: true,
      message: "Document signed successfully",
    };
  } catch (error) {
    console.error("Error completing document signing:", error);
    return {
      success: false,
      message: "Failed to complete signing process",
      error: String(error),
    };
  }
}
