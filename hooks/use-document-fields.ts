"use client";

import { useState, useEffect } from "react";
import { DocumentField, DocumentFieldType } from "@/types/document";
import { getDocumentFields } from "@/actions/document";
import { v4 as uuidv4 } from "uuid";
import { toast } from "sonner";

export function useDocumentFields(documentId: string) {
  const [fields, setFields] = useState<DocumentField[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedField, setSelectedField] = useState<DocumentField | null>(
    null,
  );

  // Load fields from database
  useEffect(() => {
    const loadFields = async () => {
      try {
        setIsLoading(true);
        const result = await getDocumentFields(documentId);
        if (result.success && result.fields) {
          // Ensure we have a valid array of fields
          const validFields = Array.isArray(result.fields)
            ? (result.fields as DocumentField[])
            : [];
          setFields(validFields);
        } else {
          toast.error("Failed to load document fields");
        }
      } catch (error) {
        console.error("Error loading document fields:", error);
        toast.error("Error loading document fields");
      } finally {
        setIsLoading(false);
      }
    };

    loadFields();
  }, [documentId]);

  // Create default properties based on field type
  const getDefaultFieldProperties = (
    fieldType: DocumentFieldType,
    pageNumber: number,
  ): Partial<DocumentField> => {
    const baseProperties = {
      documentId,
      pageNumber,
      required: false,
      x: 100,
      y: 100,
    };

    switch (fieldType) {
      case "signature":
        return {
          ...baseProperties,
          label: "Signature",
          width: 200,
          height: 80,
        };

      case "initial":
        return {
          ...baseProperties,
          label: "Initial",
          width: 100,
          height: 60,
        };

      case "text":
        return {
          ...baseProperties,
          label: "Text Field",
          placeholder: "Enter text",
          width: 200,
          height: 50,
          fontSize: 12,
          fontFamily: "Arial",
        };

      case "email":
        return {
          ...baseProperties,
          label: "Email",
          placeholder: "Enter email",
          validationRule: "email",
          width: 200,
          height: 50,
        };

      case "phone":
        return {
          ...baseProperties,
          label: "Phone",
          placeholder: "Enter phone number",
          width: 200,
          height: 50,
        };

      case "number":
        return {
          ...baseProperties,
          label: "Number",
          placeholder: "Enter a number",
          validationRule: "numeric",
          width: 140,
          height: 50,
        };

      case "date":
        return {
          ...baseProperties,
          label: "Date",
          width: 160,
          height: 50,
        };

      case "checkbox":
        return {
          ...baseProperties,
          label: "Checkbox",
          width: 30,
          height: 30,
        };

      case "dropdown":
        return {
          ...baseProperties,
          label: "Dropdown",
          options: "Option 1, Option 2, Option 3",
          width: 200,
          height: 50,
        };

      case "radio":
        return {
          ...baseProperties,
          label: "Radio Group",
          options: "Option 1, Option 2, Option 3",
          width: 200,
          height: 120,
        };

      case "image":
        return {
          ...baseProperties,
          label: "Image",
          width: 200,
          height: 150,
        };

      case "formula":
        return {
          ...baseProperties,
          label: "Calculated Field",
          width: 200,
          height: 50,
        };

      case "payment":
        return {
          ...baseProperties,
          label: "Payment Field",
          width: 240,
          height: 60,
        };

      default:
        return {
          ...baseProperties,
          label: "Field",
          width: 200,
          height: 50,
        };
    }
  };
  // Add a new field
  const addField = (fieldType: DocumentFieldType, pageNumber = 1) => {
    const defaultProps = getDefaultFieldProperties(fieldType, pageNumber);

    // Smart field positioning with proper viewport calculation
    // Default position if viewport calculation fails
    let posX = 100;
    let posY = 100;

    // Check if we can get viewport information from browser
    if (typeof window !== "undefined") {
      try {
        // Look for the PDF container element using multiple possible selectors
        // This makes the selection more robust across different views
        const pdfContainer = document.querySelector(
          ".pdf-container, .rpv-core__viewer, .react-pdf__Document, .pdf-edit-container",
        );

        if (pdfContainer) {
          const viewerRect = pdfContainer.getBoundingClientRect();

          // Get the current scale factor if available from the viewer
          // Default to 1 if not found
          const scaleElement = document.querySelector(
            ".text-sm.font-medium.min-w-\\[40px\\]",
          );
          const scaleText = scaleElement
            ? scaleElement.textContent || "100%"
            : "100%";
          const scale = parseInt(scaleText) / 100 || 1;

          // Calculate centered position based on viewport and scale
          const fieldWidth = defaultProps.width || 200;
          const fieldHeight = defaultProps.height || 50;

          // Position field in golden ratio point (more visually pleasing than center)
          const goldenRatio = 0.382; // Approximate 1/φ for vertical position

          posX = Math.max(30, (viewerRect.width / 2 - fieldWidth / 2) / scale);
          posY = Math.max(
            30,
            (viewerRect.height * goldenRatio - fieldHeight / 2) / scale,
          );

          console.log(
            `Positioning field at ${posX}, ${posY} with scale ${scale}`,
          );
        }
      } catch (error) {
        console.error("Error calculating field position:", error);
      }
    }

    // Ensure we're using the correct page number that was passed in
    console.log(`Adding field to page ${pageNumber}`);

    const newField: DocumentField = {
      id: `temp-${uuidv4()}`, // Temporary ID until saved to database
      documentId: documentId,
      type: fieldType,
      label: defaultProps.label || "Field",
      required: defaultProps.required || false,
      placeholder: defaultProps.placeholder,
      x: posX,
      y: posY,
      width: defaultProps.width || 200,
      height: defaultProps.height || 50,
      pageNumber: pageNumber,
      value: defaultProps.value,
      signerId: defaultProps.signerId,
      color: defaultProps.color,
      fontFamily: defaultProps.fontFamily,
      fontSize: defaultProps.fontSize,
      validationRule: defaultProps.validationRule,
      conditionalLogic: defaultProps.conditionalLogic,
      options: defaultProps.options,
      backgroundColor: defaultProps.backgroundColor,
      borderColor: defaultProps.borderColor,
      textColor: defaultProps.textColor,
    };

    setFields((prevFields) => [...prevFields, newField]);
    setSelectedField(newField);

    toast.success(`Added new ${fieldType} field`);
  };

  // Update a field with improved type handling and position normalization
  const updateField = (updatedField: DocumentField) => {
    // Ensure all numeric properties are properly set as numbers
    // This prevents issues with string/number type inconsistencies
    const normalizedField: DocumentField = {
      ...updatedField,
      x: Number(updatedField.x),
      y: Number(updatedField.y),
      width: Number(updatedField.width),
      height: Number(updatedField.height),
      pageNumber: Number(updatedField.pageNumber),
      fontSize: updatedField.fontSize
        ? Number(updatedField.fontSize)
        : undefined,
    };

    // Only update if there are actual changes to avoid unnecessary rerenders
    setFields((prevFields) => {
      const existingField = prevFields.find((f) => f.id === normalizedField.id);

      // If no existing field or actual changes detected, update the field
      if (!existingField || hasFieldChanged(existingField, normalizedField)) {
        return prevFields.map((field) =>
          field.id === normalizedField.id ? normalizedField : field,
        );
      }

      // No changes detected, return the original array reference to prevent rerender
      return prevFields;
    });

    // Update the selected field if it's the same one
    if (selectedField?.id === normalizedField.id) {
      setSelectedField(normalizedField);
    }
  };

  // Helper to check if a field has changed to minimize unnecessary updates
  const hasFieldChanged = (
    original: DocumentField,
    updated: DocumentField,
  ): boolean => {
    // Check numeric properties with small tolerance to ignore insignificant floating point differences
    const numericPropsChanged =
      Math.abs(original.x - updated.x) > 0.01 ||
      Math.abs(original.y - updated.y) > 0.01 ||
      Math.abs(original.width - updated.width) > 0.01 ||
      Math.abs(original.height - updated.height) > 0.01 ||
      original.pageNumber !== updated.pageNumber;

    // Check non-numeric properties
    const otherPropsChanged =
      original.label !== updated.label ||
      original.required !== updated.required ||
      original.placeholder !== updated.placeholder ||
      original.color !== updated.color ||
      original.fontFamily !== updated.fontFamily ||
      original.validationRule !== updated.validationRule ||
      original.conditionalLogic !== updated.conditionalLogic ||
      original.options !== updated.options ||
      original.backgroundColor !== updated.backgroundColor ||
      original.borderColor !== updated.borderColor ||
      original.textColor !== updated.textColor ||
      original.value !== updated.value;

    return numericPropsChanged || otherPropsChanged;
  };

  // Delete a field
  const deleteField = (fieldId: string) => {
    setFields((prevFields) =>
      prevFields.filter((field) => field.id !== fieldId),
    );

    if (selectedField?.id === fieldId) {
      setSelectedField(null);
    }

    toast.success("Field deleted");
  };

  // Clear all fields
  const clearFields = () => {
    setFields([]);
    setSelectedField(null);

    toast.success("All fields cleared");
  };

  // Select a field
  const selectField = (field: DocumentField | null) => {
    setSelectedField(field);
  };

  return {
    fields,
    isLoading,
    selectedField,
    addField,
    updateField,
    deleteField,
    clearFields,
    selectField,
  };
}
