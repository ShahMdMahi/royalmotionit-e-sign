"use client";

import { useState, useMemo } from "react";
import { Document, DocumentField, Signer } from "@/types/document";
import { PDFViewer } from "@/components/common/pdf-viewer";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronRight } from "lucide-react";
import { completeDocumentSigning } from "@/actions/sign-document";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { SigningFieldsTab } from "@/components/document/signing-fields-tab";
import { handleNavigateToField } from "@/actions/signing-field-actions";
import {
  handlePageChange,
  handleTotalPagesChange,
} from "@/actions/pdf-viewer-actions";

interface DocumentSigningProps {
  document: Document;
  pdfData: Uint8Array;
  fields: DocumentField[];
  signer: Signer;
  isLastSigner: boolean;
}

export function DocumentSigning({
  document,
  pdfData,
  fields,
  signer,
  isLastSigner,
}: DocumentSigningProps) {
  const [currentPage] = useState(1);
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({});
  const [validationErrors, setValidationErrors] = useState<
    Record<string, string>
  >({});
  const [agreementChecked, setAgreementChecked] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter(); // These are just wrappers for the imported server actions

  // This function is used by the SigningFieldsTab component
  // Prefixed with underscore to indicate it's defined for future use
  // const navigateToField = async (page: number) => {
  //   setCurrentPage(page);
  //   await handleNavigateToField(page);
  //   return page;
  // };

  // Filter fields assigned to this signer
  const signerFields = useMemo(() => {
    return fields.filter((field) => field.signerId === signer.id);
  }, [fields, signer.id]);

  // Group fields by page - can be used for future optimizations
  // Removed due to unused variable warning
  /* const fieldsByPage = useMemo(() => {
    const grouped: Record<number, DocumentField[]> = {};
    signerFields.forEach((field) => {
      if (!grouped[field.pageNumber]) {
        grouped[field.pageNumber] = [];
      }
      grouped[field.pageNumber].push(field);
    });
    return grouped;
  }, [signerFields]); */

  // Get required field ids
  const requiredFieldIds = useMemo(() => {
    return signerFields
      .filter((field) => field.required)
      .map((field) => field.id);
  }, [signerFields]);

  // Check if all required fields have values
  const isComplete = useMemo(() => {
    return requiredFieldIds.every((id) => !!fieldValues[id]);
  }, [requiredFieldIds, fieldValues]);

  // Get validation errors
  const validateFields = (): boolean => {
    const errors: Record<string, string> = {};
    let isValid = true;

    signerFields.forEach((field) => {
      const value = fieldValues[field.id];

      // Skip validation for optional empty fields
      if (
        !field.required &&
        (!value || (typeof value === "string" && value.trim() === ""))
      ) {
        return;
      }

      // Check required fields
      if (
        field.required &&
        (!value || (typeof value === "string" && value.trim() === ""))
      ) {
        errors[field.id] = "This field is required";
        isValid = false;
        return;
      }

      // Validate based on field type
      if (value) {
        switch (field.type) {
          case "email":
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(value)) {
              errors[field.id] = "Please enter a valid email address";
              isValid = false;
            }
            break;

          case "phone":
            const phoneRegex =
              /^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/;
            if (!phoneRegex.test(value)) {
              errors[field.id] = "Please enter a valid phone number";
              isValid = false;
            }
            break;

          case "number":
            const numberRegex = /^-?\d*\.?\d+$/;
            if (!numberRegex.test(value)) {
              errors[field.id] = "Please enter a valid number";
              isValid = false;
            }
            break;
        }
      }

      // Custom validation rule if specified
      if (field.validationRule && value) {
        try {
          // Currently not implementing JSON-based rules
          // const rule = JSON.parse(field.validationRule);
          // Future: Implement custom validation logic here
          JSON.parse(field.validationRule); // Just check if it's valid JSON
        } catch {
          // If not valid JSON, use as regex pattern
          try {
            const regex = new RegExp(field.validationRule);
            if (!regex.test(value)) {
              errors[field.id] = "Field does not match the required format";
              isValid = false;
            }
          } catch {
            // Invalid regex, skip validation
          }
        }
      }
    });

    setValidationErrors(errors);
    return isValid;
  };
  // Updated handleFieldChange implementation
  const handleFieldChange = async (fieldId: string, value: string) => {
    setFieldValues((prev) => ({
      ...prev,
      [fieldId]: value,
    }));

    // Clear validation error if any
    if (validationErrors[fieldId]) {
      setValidationErrors((prev) => {
        const updated = { ...prev };
        delete updated[fieldId];
        return updated;
      });
    }

    return { fieldId, value };
  };

  const handleSubmit = async () => {
    // Validate all fields
    const isValid = validateFields();
    if (!isValid) {
      toast.error("Validation Error", {
        description: "Please complete all required fields correctly",
      });
      return;
    }

    // Check agreement
    if (!agreementChecked) {
      toast.error("Agreement Required", {
        description: "Please agree to the terms and conditions",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await completeDocumentSigning(
        document.id,
        signer.id,
        fieldValues,
      );

      if (result.success) {
        toast.success("Success", {
          description: "Document signed successfully",
        });

        // Redirect based on completion status
        if (isLastSigner) {
          router.push(`/documents/${document.id}/complete`);
        } else {
          router.push(`/documents/${document.id}/waiting`);
        }
      } else {
        toast.error("Error", {
          description: result.message || "Failed to submit signature",
        });
      }
    } catch (error) {
      console.error("Error signing document:", error);
      toast.error("Error", {
        description: "Failed to submit signature",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="col-span-1 md:col-span-2">
        <div className="flex flex-col space-y-4">
          <div className="bg-background border rounded-lg overflow-hidden">
            <PDFViewer
              pdfData={pdfData}
              onPageChangeAction={handlePageChange}
              onTotalPagesChangeAction={handleTotalPagesChange}
              fields={fields}
              fieldValues={fieldValues}
              highlightFields={true}
            />
          </div>
        </div>
      </div>

      <div className="col-span-1">
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col space-y-4">
              <h2 className="text-2xl font-semibold">{document.title}</h2>
              <div className="text-sm text-muted-foreground">
                {document.description && (
                  <p className="mb-2">{document.description}</p>
                )}
                <p>
                  <span className="font-medium">From: </span>
                  {document.authorName || document.authorEmail}
                </p>
              </div>
              <SigningFieldsTab
                fields={signerFields}
                currentPage={currentPage}
                fieldValues={fieldValues}
                validationErrors={validationErrors}
                onFieldChangeAction={handleFieldChange}
                onNavigateToFieldAction={handleNavigateToField}
              />
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="agreement"
                  checked={agreementChecked}
                  onCheckedChange={(checked) => setAgreementChecked(!!checked)}
                />
                <Label htmlFor="agreement" className="text-sm">
                  I agree that my electronic signature constitutes a legal
                  signature
                </Label>
              </div>
              <div className="pt-4 flex justify-end">
                <Button
                  onClick={handleSubmit}
                  disabled={!isComplete || !agreementChecked || isSubmitting}
                >
                  {isSubmitting ? "Submitting..." : "Sign Document"}
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
