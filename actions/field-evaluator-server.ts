"use server";

import { DocumentField, DocumentFieldType } from "@/types/document";
import { isFieldVisible, evaluateFormula } from "./formula-evaluator";

/**
 * Server wrapper for isFieldVisible function
 */
export async function checkFieldVisibility(
  field: DocumentField,
  allFields: DocumentField[],
): Promise<boolean> {
  // Ensure the field has the proper type
  const typedField = {
    ...field,
    type: field.type as DocumentFieldType,
    value: field.value ?? undefined,
  };

  // Ensure all fields have proper types
  const typedFields = allFields.map((f) => ({
    ...f,
    type: f.type as DocumentFieldType,
    value: f.value ?? undefined,
  }));

  return isFieldVisible(typedField, typedFields);
}

/**
 * Server wrapper for evaluateFormula function
 */
export async function evaluateFieldFormula(
  formula: string,
  allFields: DocumentField[],
): Promise<string> {
  // Ensure all fields have proper types
  const typedFields = allFields.map((f) => ({
    ...f,
    type: f.type as DocumentFieldType,
    value: f.value ?? undefined,
  }));

  return evaluateFormula(formula, typedFields);
}
