/**
 * Interface for field validation errors
 */
export interface FieldValidationError {
  fieldId: string;
  message: string;
  code?: string; // Optional error code for programmatic handling
  severity?: "error" | "warning"; // Allows for different levels of validation issues
}

/**
 * Interface for document validation results
 */
export interface DocumentValidationResult {
  success: boolean;
  message: string;
  validationErrors?: FieldValidationError[];
}

/**
 * Type definition for validation rules
 */
export interface ValidationRule {
  type: string; // Type of validation (required, email, regexp, etc.)
  message?: string; // Custom message to display
  value?: string | number; // Value to check against (min/max value, regex pattern, etc.)
}
