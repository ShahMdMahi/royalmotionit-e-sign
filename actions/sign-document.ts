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
    // Get current user - note we don't require authentication for signing
    // as the signing URL may be used by unauthenticated users
    const session = await auth();
    // We check valid signer access via token instead of requiring login

    // Get the document with fields and signer
    const document = await prisma.document.findFirst({
      where: {
        id: documentId,
      },
      include: {
        fields: {
          where: {
            signerId,
          },
        },
        signers: true,
      },
    });

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

    // Update signer status with client info if available and ensure userId is connected
    await prisma.signer.update({
      where: {
        id: signerId,
      },
      data: {
        status: "COMPLETED",
        completedAt: new Date(),
        ipAddress: clientInfo?.ipAddress || "127.0.0.1",
        userAgent: clientInfo?.userAgent || "Unknown",
        // Ensure the userId is set when completing the signature
        userId: session.user.id,
      },
    });
    // Import the enhanced field validator
    const { validateAllFields } = await import("@/utils/field-validator");

    // Prepare fields with their entered values for validation
    const fieldsToValidate = document.fields.map((field) => {
      if (field.signerId === signerId) {
        return {
          ...field,
          value: fieldValues[field.id] || field.value || "",
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
    } // Update field values with validation
    const validationErrors: FieldValidationError[] = [];

    for (const fieldId in fieldValues) {
      // Make sure the field belongs to the document and signer
      const field = document.fields.find((f) => f.id === fieldId);
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
            const typedFields = convertToDocumentFields(document.fields);
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
        // Update the field value
        await prisma.documentField.update({
          where: {
            id: fieldId,
          },
          data: {
            value,
          },
        }); // After updating a field, evaluate any formula fields that might depend on it
        const formulaFields = document.fields.filter(
          (f) => f.type === "formula" && f.validationRule,
        );
        for (const formulaField of formulaFields) {
          if (formulaField.validationRule) {
            // Create a properly typed array of fields for formula evaluation
            const updatedFields = document.fields.map((f) => {
              // If this is the field we just updated, use the new value
              if (f.id === field.id) {
                const updatedField = { ...f, value };
                return convertToDocumentField(updatedField);
              }
              // Otherwise use the original field
              return convertToDocumentField(f);
            });

            const newValue = evaluateFormula(
              formulaField.validationRule,
              updatedFields,
            );

            // Update the formula field value
            await prisma.documentField.update({
              where: { id: formulaField.id },
              data: { value: newValue },
            });
          }
        }
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

    // Add document history entry with detailed tracking
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

    // Send notification to document author
    try {
      // Get document author information
      const documentAuthor = await prisma.user.findUnique({
        where: { id: document.authorId },
        select: { name: true, email: true },
      });

      // Send email notification to document author
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

    // With single signer model, we always generate the final PDF when the signer completes
    // since there's only one signer
    try {
      // Generate final PDF with all signatures and fields
      // Generate final PDF with all signatures and fields
      const result = await generateFinalPDF(documentId);

      if (result.success) {
        // The generateFinalPDF function already updates the document status to COMPLETED
        // and handles history recording, so we don't need to duplicate that here

        // Send completion notification to document author
        try {
          // Get document author information
          const documentAuthor = await prisma.user.findUnique({
            where: { id: document.authorId },
            select: { name: true, email: true },
          });

          // Send email notification to document author about completion
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
          console.error(
            "Error sending completion notification to document author:",
            error,
          );
          // Non-fatal error, continue with the process
        }

        console.log(`Document ${documentId} fully signed and completed.`);
      } else {
        console.error("Error generating final PDF:", result.message);

        // If PDF generation fails, still update document status manually
        await prisma.document.update({
          where: {
            id: documentId,
          },
          data: {
            status: "COMPLETED",
            signedAt: new Date(),
          },
        });
      }
    } catch (error) {
      console.error("Error in final document processing:", error);

      // Even if there's an error generating the PDF, still update the document status
      await prisma.document.update({
        where: {
          id: documentId,
        },
        data: {
          status: "COMPLETED",
          signedAt: new Date(),
        },
      });
    }
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
