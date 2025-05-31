/**
 * Enhanced field validation utility functions
 */
import { DocumentField, DocumentFieldType } from "@/types/document";
import { FieldValidationError } from "@/types/validation";

/**
 * Validate a document field based on its type and validation rules
 * @param field The field to validate
 * @returns Validation result with errors if invalid
 */
export function validateDocumentField(field: DocumentField): {
  valid: boolean;
  errors: FieldValidationError[];
} {
  const errors: FieldValidationError[] = [];

  // Required field validation
  if (
    field.required &&
    (!field.value ||
      (typeof field.value === "string" && field.value.trim() === ""))
  ) {
    errors.push({
      fieldId: field.id,
      code: "required",
      message: `"${field.label || "Field"}" is required`,
    });

    // No need to continue with other validations if required check fails
    return { valid: errors.length === 0, errors };
  }

  // If field is not required and has no value, it's valid
  if (
    !field.value ||
    (typeof field.value === "string" && field.value.trim() === "")
  ) {
    return { valid: true, errors: [] };
  }

  // Type-specific validation
  switch (field.type) {
    case "email":
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(field.value)) {
        errors.push({
          fieldId: field.id,
          code: "format",
          message: `"${field.label || "Email"}" must be a valid email address`,
        });
      }
      break;

    case "phone":
      if (!/^[\d\s\-+()]{7,20}$/.test(field.value)) {
        errors.push({
          fieldId: field.id,
          code: "format",
          message: `"${field.label || "Phone"}" must be a valid phone number`,
        });
      }
      break;

    case "number":
      if (isNaN(Number(field.value))) {
        errors.push({
          fieldId: field.id,
          code: "format",
          message: `"${field.label || "Number"}" must be a valid number`,
        });
      } else {
        // Numeric range validation if validationRule includes range
        if (field.validationRule?.includes("range:")) {
          const rangeMatch = field.validationRule.match(
            /range:(-?\d+\.?\d*),(-?\d+\.?\d*)/,
          );
          if (rangeMatch) {
            const min = parseFloat(rangeMatch[1]);
            const max = parseFloat(rangeMatch[2]);
            const numValue = parseFloat(field.value);

            if (numValue < min || numValue > max) {
              errors.push({
                fieldId: field.id,
                code: "range",
                message: `"${field.label || "Number"}" must be between ${min} and ${max}`,
              });
            }
          }
        }
      }
      break;

    case "date":
      const date = new Date(field.value);
      if (isNaN(date.getTime())) {
        errors.push({
          fieldId: field.id,
          code: "format",
          message: `"${field.label || "Date"}" must be a valid date`,
        });
      } else {
        // Date range validation
        if (field.validationRule?.includes("range:")) {
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
            } else if (minStr !== "none") {
              min = new Date(minStr);
            }

            if (maxStr === "today") {
              max = new Date();
              max.setHours(23, 59, 59, 999);
            } else if (maxStr !== "none") {
              max = new Date(maxStr);
            }

            if (min && !isNaN(min.getTime()) && date < min) {
              errors.push({
                fieldId: field.id,
                code: "range",
                message: `"${field.label || "Date"}" must be on or after ${min.toLocaleDateString()}`,
              });
            }

            if (max && !isNaN(max.getTime()) && date > max) {
              errors.push({
                fieldId: field.id,
                code: "range",
                message: `"${field.label || "Date"}" must be on or before ${max.toLocaleDateString()}`,
              });
            }
          }
        }
      }
      break;

    case "text":
      // Length validation
      if (field.validationRule?.includes("length:")) {
        const lengthMatch = field.validationRule.match(/length:(\d+),(\d+)/);
        if (lengthMatch) {
          const min = parseInt(lengthMatch[1]);
          const max = parseInt(lengthMatch[2]);

          if (field.value.length < min) {
            errors.push({
              fieldId: field.id,
              code: "length",
              message: `"${field.label || "Text"}" must be at least ${min} characters`,
            });
          } else if (field.value.length > max) {
            errors.push({
              fieldId: field.id,
              code: "length",
              message: `"${field.label || "Text"}" cannot exceed ${max} characters`,
            });
          }
        }
      }

      // Pattern validation (regex)
      if (field.validationRule?.includes("pattern:")) {
        const patternMatch = field.validationRule.match(
          /pattern:\/(.+)\/(i|g|m|gi|gm|im|gim)?/,
        );
        if (patternMatch) {
          const pattern = patternMatch[1];
          const flags = patternMatch[2] || "";
          const regex = new RegExp(pattern, flags);

          if (!regex.test(field.value)) {
            errors.push({
              fieldId: field.id,
              code: "pattern",
              message: `"${field.label || "Text"}" does not match the required format`,
            });
          }
        }
      }
      break;
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Validate all document fields
 * @param fields Array of fields to validate
 * @returns Validation results with all errors
 */
export function validateAllFields(fields: DocumentField[]): {
  valid: boolean;
  fieldErrors: Record<string, FieldValidationError[]>;
} {
  const fieldErrors: Record<string, FieldValidationError[]> = {};
  let valid = true;

  // Process fields that should be visible based on conditional logic
  const visibleFields = fields.filter((field) => {
    // If field has conditional logic, check if it should be visible
    if (field.conditionalLogic) {
      // import the isFieldVisible function dynamically to avoid circular dependencies
      const { isFieldVisible } = require("@/actions/formula-evaluator");
      return isFieldVisible(field, fields);
    }
    // No conditional logic, field is visible
    return true;
  });

  // Validate each visible field
  visibleFields.forEach((field) => {
    const result = validateDocumentField(field);
    if (!result.valid) {
      fieldErrors[field.id] = result.errors;
      valid = false;
    }
  });

  return { valid, fieldErrors };
}
