import { DocumentField, DocumentFieldType } from "@/types/document";

/**
 * Convert a database DocumentField to the correct type that matches the DocumentField interface
 * This handles the null vs. undefined type differences
 */
export function convertToDocumentField(dbField: any): DocumentField {
  return {
    id: dbField.id,
    documentId: dbField.documentId,
    type: dbField.type as DocumentFieldType,
    label: dbField.label,
    required: dbField.required,
    placeholder: dbField.placeholder ?? undefined,
    x: dbField.x,
    y: dbField.y,
    width: dbField.width,
    height: dbField.height,
    pageNumber: dbField.pageNumber,
    value: dbField.value ?? undefined,
    signerId: dbField.signerId ?? undefined,
    color: dbField.color ?? undefined,
    fontFamily: dbField.fontFamily ?? undefined,
    fontSize: dbField.fontSize ?? undefined,
    validationRule: dbField.validationRule ?? undefined,
    conditionalLogic: dbField.conditionalLogic ?? undefined,
    options: dbField.options ?? undefined,
    backgroundColor: dbField.backgroundColor ?? undefined,
    borderColor: dbField.borderColor ?? undefined,
    textColor: dbField.textColor ?? undefined,
    createdAt: dbField.createdAt,
    updatedAt: dbField.updatedAt,
  };
}

/**
 * Convert an array of database DocumentFields to the correct type
 */
export function convertToDocumentFields(dbFields: any[]): DocumentField[] {
  return dbFields.map(convertToDocumentField);
}
