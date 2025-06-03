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
    <div className="min-h-screen bg-gray-50/50">
      {/* Responsive Header */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-sm border-b border-gray-200">
        <div className="container mx-auto px-3 sm:px-4 lg:px-6">
          <div className="flex items-center justify-between h-14 sm:h-16">
            <div className="flex items-center space-x-2 sm:space-x-4 min-w-0 flex-1">
              <h1 className="text-base sm:text-lg lg:text-xl font-semibold text-gray-900 truncate">
                {document.title}
              </h1>
              <div className="hidden sm:block text-xs sm:text-sm text-gray-500">
                Signing Document
              </div>
            </div>

            {/* Progress Indicator */}
            <div className="flex items-center space-x-2 sm:space-x-4">
              <div className="hidden sm:flex items-center space-x-2 text-xs sm:text-sm text-gray-600">
                <span className="font-medium">
                  {Object.keys(fieldValues).length} / {requiredFieldIds.length}
                </span>
                <span className="hidden md:inline">fields completed</span>
              </div>

              {/* Mobile Progress Bar */}
              <div className="sm:hidden w-16 bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{
                    width: `${requiredFieldIds.length > 0 ? (Object.keys(fieldValues).length / requiredFieldIds.length) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6 lg:gap-8">
          {/* PDF Viewer Section */}
          <div className="lg:col-span-3 xl:col-span-4 order-2 lg:order-1">
            <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
              <div className="h-[50vh] sm:h-[60vh] lg:h-[70vh] xl:h-[75vh]">
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

          {/* Sidebar Section */}
          <div className="lg:col-span-1 xl:col-span-1 order-1 lg:order-2">
            <div className="space-y-4 sm:space-y-6">
              {/* Document Info Card */}
              <Card className="border-gray-200 shadow-sm">
                <CardContent className="p-4 sm:p-6">
                  <div className="space-y-3 sm:space-y-4">
                    <div>
                      <h2 className="text-lg sm:text-xl font-semibold text-gray-900 line-clamp-2">
                        {document.title}
                      </h2>
                      {document.description && (
                        <p className="mt-2 text-xs sm:text-sm text-gray-600 line-clamp-3">
                          {document.description}
                        </p>
                      )}
                    </div>

                    <div className="text-xs sm:text-sm text-gray-600">
                      <p>
                        <span className="font-medium text-gray-900">
                          From:{" "}
                        </span>
                        <span className="break-words">
                          {document.authorName || document.authorEmail}
                        </span>
                      </p>
                    </div>

                    {/* Progress Summary */}
                    <div className="bg-gray-50 rounded-lg p-3 sm:p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs sm:text-sm font-medium text-gray-700">
                          Progress
                        </span>
                        <span className="text-xs sm:text-sm text-gray-600">
                          {Object.keys(fieldValues).length} /
                          {requiredFieldIds.length}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{
                            width: `${requiredFieldIds.length > 0 ? (Object.keys(fieldValues).length / requiredFieldIds.length) * 100 : 0}%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Signing Fields Card */}
              <Card className="border-gray-200 shadow-sm">
                <CardContent className="p-4 sm:p-6">
                  <div className="space-y-4 sm:space-y-6">
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900">
                      Required Fields
                    </h3>

                    <SigningFieldsTab
                      fields={signerFields}
                      currentPage={currentPage}
                      fieldValues={fieldValues}
                      validationErrors={validationErrors}
                      onFieldChangeAction={handleFieldChange}
                      onNavigateToFieldAction={handleNavigateToField}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Agreement and Submit Card */}
              <Card className="border-gray-200 shadow-sm">
                <CardContent className="p-4 sm:p-6">
                  <div className="space-y-4 sm:space-y-6">
                    <div className="space-y-3 sm:space-y-4">
                      <div className="flex items-start space-x-3">
                        <Checkbox
                          id="agreement"
                          checked={agreementChecked}
                          onCheckedChange={(checked) =>
                            setAgreementChecked(!!checked)
                          }
                          className="mt-0.5 h-4 w-4 sm:h-5 sm:w-5"
                        />
                        <Label
                          htmlFor="agreement"
                          className="text-xs sm:text-sm text-gray-700 leading-relaxed cursor-pointer"
                        >
                          I agree that my electronic signature constitutes a
                          legal signature and has the same force and effect as a
                          handwritten signature.
                        </Label>
                      </div>

                      {/* Validation Summary */}
                      {Object.keys(validationErrors).length > 0 && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-3 sm:p-4">
                          <p className="text-xs sm:text-sm text-red-700 font-medium mb-2">
                            Please fix the following errors:
                          </p>
                          <ul className="space-y-1 text-xs sm:text-sm text-red-600">
                            {Object.values(validationErrors).map(
                              (error, index) => (
                                <li key={index} className="flex items-start">
                                  <span className="mr-2">•</span>
                                  <span>{error}</span>
                                </li>
                              ),
                            )}
                          </ul>
                        </div>
                      )}
                    </div>

                    <Button
                      onClick={handleSubmit}
                      disabled={
                        !isComplete || !agreementChecked || isSubmitting
                      }
                      className="w-full h-10 sm:h-12 text-sm sm:text-base font-medium"
                      size="lg"
                    >
                      {isSubmitting ? (
                        <div className="flex items-center space-x-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                          <span>Submitting...</span>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-2">
                          <span>Sign Document</span>
                          <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5" />
                        </div>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
