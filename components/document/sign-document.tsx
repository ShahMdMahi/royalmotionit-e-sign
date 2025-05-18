"use client";

import { Document as PrismaDocument, Signer } from "@prisma/client";
import { useState, useEffect, useRef } from "react";
import { PDFViewer } from "@/components/common/pdf-viewer";
import { getFromR2 } from "@/actions/r2";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { ArrowLeft, CheckCircle, Save, Send, AlertTriangle, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useRouter } from "next/navigation";
import { PageNavigation } from "@/components/document/page-navigation";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import SignatureCanvasWrapper, { SignatureCanvasRef } from "./signature-canvas-wrapper";
import { format } from "date-fns";
import { completeDocumentSigning } from "@/actions/sign-document";
import { getUserAgent } from "@/lib/client-info";
import { SigningCompletedDialog } from "@/components/document/signing-completed-dialog";
import { SignConfirmationDialog } from "@/components/document/sign-confirmation-dialog";
import { DocumentField } from "@/types/document";
import { FieldErrorTooltip } from "@/components/document/field-error-tooltip";
import { ValidationErrorsSummary } from "@/components/document/validation-errors-summary";
import { FieldValidationError } from "@/types/validation";

interface ValidationError {
  fieldId: string;
  message: string;
}

interface SignDocumentComponentProps {
  document: PrismaDocument & {
    fields?: any[];
    signers: Signer[];
  };
  signer: Signer;
  fields: DocumentField[];
}

export function SignDocumentComponent({ document, signer, fields }: SignDocumentComponentProps) {
  const router = useRouter();
  const [pdfData, setPdfData] = useState<Uint8Array | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({});
  const [fieldErrors, setFieldErrors] = useState<FieldValidationError[]>([]);
  const [isSigning, setIsSigning] = useState(false);
  const [isSignatureModalOpen, setIsSignatureModalOpen] = useState(false);
  const [isConfirmationModalOpen, setIsConfirmationModalOpen] = useState(false);
  const [activeFieldId, setActiveFieldId] = useState<string | null>(null);
  const [completionPercentage, setCompletionPercentage] = useState(0);
  const [signingCompleted, setSigningCompleted] = useState(false);
  const [isLastSigner, setIsLastSigner] = useState(false);
  const signatureRef = useRef<SignatureCanvasRef | null>(null);
  const [date, setDate] = useState<Date | undefined>(new Date());

  // Fetch PDF data from R2
  useEffect(() => {
    const fetchPdf = async () => {
      if (!document.key) {
        setError("Document key is missing.");
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const response = await getFromR2({ Key: document.key });

        if (response.success) {
          if (response.data && response.data.Body) {
            setPdfData(response.data.Body);
            setError(null);
          } else {
            console.error("Failed to fetch PDF: Response successful but no body content.");
            setError("PDF content is missing in the response.");
          }
        } else {
          console.error("Failed to fetch PDF:", response.message, response.error);
          setError(response.message || "Failed to load PDF document.");
        }
      } catch (e) {
        console.error("Error fetching document:", e);
        setError(e instanceof Error ? e.message : "An unexpected error occurred.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchPdf();
  }, [document.key]);

  // Calculate completion percentage
  useEffect(() => {
    if (fields.length === 0) {
      setCompletionPercentage(100);
      return;
    }

    const requiredFields = fields.filter((field) => field.required);
    if (requiredFields.length === 0) {
      setCompletionPercentage(100);
      return;
    }

    const completedFields = requiredFields.filter((field) => {
      const value = fieldValues[field.id];
      return value !== undefined && value !== "";
    });

    const percentage = Math.round((completedFields.length / requiredFields.length) * 100);
    setCompletionPercentage(percentage);
  }, [fields, fieldValues]);

  // Handle field click
  const handleFieldClick = (fieldId: string) => {
    const field = fields.find((f) => f.id === fieldId);
    if (!field) return;

    switch (field.type) {
      case "signature":
      case "initial":
        setActiveFieldId(fieldId);
        setIsSignatureModalOpen(true);
        break;
      case "date":
        handleFieldChange(fieldId, format(date || new Date(), "yyyy-MM-dd"));
        break;
    }
  };

  // Handle field value changes
  const handleFieldChange = (fieldId: string, value: string) => {
    setFieldValues((prev) => ({
      ...prev,
      [fieldId]: value,
    }));

    // Remove validation error for the field if it exists
    setFieldErrors((prev) => prev.filter((error) => error.fieldId !== fieldId));
  };

  // Clear signature canvas
  const clearSignature = () => {
    if (signatureRef.current) {
      signatureRef.current.clear();
    }
  };

  // Save signature
  const saveSignature = () => {
    if (!signatureRef.current || signatureRef.current.isEmpty()) {
      toast.error("Please provide a signature");
      return;
    }

    const signature = signatureRef.current.toDataURL();
    handleFieldChange(activeFieldId!, signature);
    setIsSignatureModalOpen(false);
  };

  // Validate fields
  const validateFields = () => {
    const errors: FieldValidationError[] = [];

    // Check for missing required fields
    const requiredFields = fields.filter((field) => field.required);
    requiredFields.forEach((field) => {
      const value = fieldValues[field.id];
      if (!value || value.trim() === "") {
        errors.push({
          fieldId: field.id,
          message: `Required field "${field.label || field.type}" must be completed`,
        });
      }
    });

    // Type-specific validations
    fields.forEach((field) => {
      const value = fieldValues[field.id];
      if (!value || value.trim() === "") return; // Skip empty non-required fields

      switch (field.type) {
        case "email":
          if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
            errors.push({
              fieldId: field.id,
              message: `Please enter a valid email address`,
            });
          }
          break;
        case "phone":
          if (!/^[0-9+\-() ]{10,}$/.test(value)) {
            errors.push({
              fieldId: field.id,
              message: `Please enter a valid phone number`,
            });
          }
          break;
        case "date":
          if (isNaN(new Date(value).getTime())) {
            errors.push({
              fieldId: field.id,
              message: `Please enter a valid date`,
            });
          }
          break;
        case "number":
          if (isNaN(Number(value))) {
            errors.push({
              fieldId: field.id,
              message: `Please enter a valid number`,
            });
          }
          break;
        // Add more type validations as needed
      }

      // Check field-specific validation rules if present
      if (field.validationRule && field.validationRule.trim() !== "") {
        try {
          // Simple regex validation rule support
          if (field.validationRule.startsWith("regex:")) {
            const regexPattern = field.validationRule.substring(6);
            const regex = new RegExp(regexPattern);
            if (!regex.test(value)) {
              errors.push({
                fieldId: field.id,
                message: `Field "${field.label || field.type}" has invalid format`,
              });
            }
          }
        } catch (error) {
          console.error("Error applying validation rule:", error);
        }
      }
    });

    setFieldErrors(errors);
    return errors.length === 0;
  };
  // Handle document signing
  const handleSignDocument = async () => {
    // Validate all fields before submitting
    if (!validateFields()) {
      toast.error("Please correct the errors before signing the document");
      return;
    }

    try {
      setIsSigning(true);

      // Get client user agent for tracking
      const userAgent = getUserAgent();

      // Call the server action to complete the document signing process
      const result = await completeDocumentSigning(
        document.id,
        signer.id,
        fieldValues,
        { userAgent, ipAddress: "127.0.0.1" } // In a real app, IP would be collected server-side
      );

      if (result.success) {
        toast.success(result.message || "Document signed successfully!");

        // Check if this was the last signer
        const remainingSigners = document.signers.filter((s) => s.id !== signer.id && s.status !== "COMPLETED");
        setIsLastSigner(remainingSigners.length === 0);

        // Close the confirmation dialog and show completion dialog
        setIsConfirmationModalOpen(false);
        setSigningCompleted(true);
      } else if (result.requiresLogin) {
        // Handle login requirement - redirect to login page with return URL
        toast.error("Please login to continue signing");
        setIsConfirmationModalOpen(false);

        // Generate the redirect URL with return path
        const returnUrl = encodeURIComponent(`/documents/${document.id}/sign`);
        const loginUrl = `/auth/login?returnUrl=${returnUrl}&email=${encodeURIComponent(result.signerEmail || "")}`;

        // Use router to redirect
        router.push(loginUrl);
      } else {
        // If there's a server validation error, update our field errors
        if (result?.validationErrors && Array.isArray(result.validationErrors)) {
          setFieldErrors(result.validationErrors);
          // Scroll to the first field with an error
          if (result.validationErrors && result.validationErrors.length > 0) {
            const errorFieldId = result.validationErrors[0].fieldId;
            const firstErrorField = fields.find((f) => f.id === errorFieldId);
            if (firstErrorField) {
              // Set the page to the one containing the error
              setCurrentPage(firstErrorField.pageNumber);
            }
          }
        }
        toast.error(result.message || "Failed to sign document");
      }
    } catch (error) {
      console.error("Error signing document:", error);
      toast.error("Failed to sign document. Please try again.");
    } finally {
      setIsSigning(false);
    }
  };

  if (isLoading) {
    return (
      <Card className="w-full max-w-7xl mx-auto my-8 border-border shadow-lg">
        <CardHeader className="border-b border-border">
          <CardTitle className="text-xl sm:text-2xl font-semibold flex items-center gap-2">
            <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center">
              <CheckCircle className="size-4 text-primary" />
            </div>
            Loading Document for Signing...
          </CardTitle>
          <CardDescription>Please wait while we prepare the document for your signature.</CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <div className="flex flex-col justify-center items-center h-[60vh] space-y-4">
            <Progress value={30} className="w-full max-w-md" />
            <p className="text-muted-foreground">Retrieving document data...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error && !pdfData) {
    return (
      <Card className="w-full max-w-7xl mx-auto my-8 border-border shadow-lg">
        <CardHeader className="border-b border-border bg-destructive/5">
          <CardTitle className="text-xl sm:text-2xl font-semibold flex items-center gap-2">
            <div className="size-8 rounded-full bg-destructive/10 flex items-center justify-center">
              <AlertTriangle className="size-4 text-destructive" />
            </div>
            Error Loading Document
          </CardTitle>
          <CardDescription>There was an issue retrieving the document.</CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <div className="flex flex-col justify-center items-center h-96 text-destructive space-y-4">
            <div className="p-4 border border-destructive/50 bg-destructive/10 rounded-md max-w-md w-full">
              <p className="flex items-start gap-2">
                <AlertTriangle className="size-4 shrink-0 mt-1" /> {error}
              </p>
            </div>
            <Button variant="outline" onClick={() => window.location.reload()}>
              Retry Loading
            </Button>
          </div>
        </CardContent>
        <CardFooter className="border-t p-4 flex justify-between">
          <Button variant="outline" size="sm" onClick={() => router.push(`/documents/${document.id}`)}>
            <ArrowLeft className="size-4 mr-2" /> Back
          </Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <div className="flex flex-col w-full">
      <div className="p-4 border-b flex items-center justify-between bg-background shadow-sm">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" onClick={() => router.push(`/documents/${document.id}`)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Document
          </Button>

          <h1 className="text-lg font-medium hidden md:block">{document.title || "Untitled Document"}</h1>
        </div>

        <div className="flex items-center space-x-3">
          <div className="hidden md:block">
            <div className="flex items-center space-x-2">
              <Progress value={completionPercentage} className="w-40 h-2" />
              <span className="text-sm text-muted-foreground">{completionPercentage}%</span>
            </div>
          </div>
          <Button
            onClick={() => {
              if (!validateFields()) {
                toast.error("Please complete all required fields before signing");
                return;
              }

              setIsConfirmationModalOpen(true);
            }}
            disabled={isSigning || completionPercentage < 100}
            className={`relative ${isSigning ? "opacity-80" : ""}`}
          >
            {isSigning ? (
              <>
                <span className="animate-pulse">Signing Document...</span>
                <span className="absolute inset-0 flex items-center justify-center">
                  <span className="animate-spin h-4 w-4 border-t-2 border-primary border-opacity-50 rounded-full"></span>
                </span>
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Sign Document
              </>
            )}
          </Button>
        </div>
      </div>{" "}
      <div className="container mx-auto py-4 sm:py-8 px-2 sm:px-4">
        {/* Show validation errors summary if there are any */}
        {fieldErrors.length > 0 && (
          <div className="mb-4 sm:mb-6">
            <ValidationErrorsSummary errors={fieldErrors} onFieldClickAction={handleFieldClick} fieldLabels={Object.fromEntries(fields.map((f) => [f.id, f.label || f.type]))} />
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 sm:gap-6">
          {/* Instruction sidebar - collapses to expandable section on mobile */}
          <div className="space-y-4 sm:space-y-6">
            <Card>
              <CardHeader className="py-3 sm:py-6">
                <CardTitle className="text-base sm:text-lg">Signing Instructions</CardTitle>
                <CardDescription className="text-xs sm:text-sm">Complete all required fields to sign this document</CardDescription>
              </CardHeader>
              <CardContent className="py-2 px-3 sm:py-4 sm:px-6 space-y-3 sm:space-y-4">
                <div className="space-y-2">
                  <p className="text-sm font-medium">Required fields: {fields.filter((f) => f.required).length}</p>
                  <Progress value={completionPercentage} className="w-full h-2" />
                  <p className="text-xs text-muted-foreground">{completionPercentage}% complete</p>
                </div>

                <div className="pt-2">
                  <h3 className="text-sm font-medium mb-2">Tips:</h3>
                  <ul className="text-xs text-muted-foreground space-y-1">
                    <li>• Click on highlighted fields to complete them</li>
                    <li>• Required fields are marked with an asterisk (*)</li>
                    <li>• All required fields must be completed to sign</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* Field Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Field Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {fields.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No fields assigned to you</p>
                ) : (
                  fields.map((field) => {
                    const isCompleted = !!fieldValues[field.id];
                    const fieldStyle = field.color
                      ? {
                          borderColor: field.color,
                          backgroundColor: `${field.color}10`,
                        }
                      : {};
                    const fieldError = fieldErrors.find((err) => err.fieldId === field.id);
                    return (
                      <FieldErrorTooltip key={field.id} fieldId={field.id} fieldErrors={fieldErrors}>
                        <div
                          className={`flex items-center justify-between p-1.5 sm:p-2 rounded border ${
                            fieldError ? "border-destructive bg-destructive/5" : isCompleted ? "border-primary/40 bg-primary/5" : "border-border"
                          } hover:bg-muted/50 active:bg-muted/70 cursor-pointer transition-colors`}
                          style={fieldError || isCompleted ? {} : fieldStyle}
                          onClick={() => handleFieldClick(field.id)}
                        >
                          <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                            {fieldError ? <AlertCircle className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0 text-destructive" /> : null}
                            <span className={`text-xs font-medium truncate ${field.required ? "text-primary" : ""}`}>
                              {field.label || field.type}
                              {field.required && <span className="text-primary">*</span>}
                            </span>
                          </div>
                          <Badge variant={fieldError ? "destructive" : isCompleted ? "default" : "outline"} className="text-[9px] sm:text-[10px] whitespace-nowrap ml-1">
                            {fieldError ? "Error" : isCompleted ? "Completed" : "Pending"}
                          </Badge>
                        </div>
                      </FieldErrorTooltip>
                    );
                  })
                )}
              </CardContent>
            </Card>
          </div>

          {/* Main document viewer */}
          <div className="col-span-1 md:col-span-3 space-y-4">
            <Card className="overflow-hidden">
              <CardContent className="p-0">
                {pdfData && (
                  <div className="w-full">
                    <PDFViewer
                      pdfData={pdfData}
                      fields={fields}
                      fieldValues={fieldValues}
                      highlightFields={true}
                      currentSignerId={signer.id}
                      onPageChangeAction={async (page) => {
                        setCurrentPage(page);
                        return page;
                      }}
                      onTotalPagesChangeAction={async (pages) => {
                        setTotalPages(pages);
                        return pages;
                      }}
                      onFieldClickAction={handleFieldClick}
                    />
                  </div>
                )}
              </CardContent>
              <CardFooter className="border-t p-2">
                <PageNavigation
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChangeAction={async (page) => {
                    setCurrentPage(page);
                    return page;
                  }}
                />
              </CardFooter>
            </Card>
          </div>
        </div>
      </div>
      {/* Signature Dialog */}
      <Dialog open={isSignatureModalOpen} onOpenChange={setIsSignatureModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add your signature</DialogTitle>
            <DialogDescription>Please sign in the box below using your mouse or touch screen.</DialogDescription>
          </DialogHeader>
          <div className="h-64 border border-border rounded-md">
            <SignatureCanvasWrapper
              ref={signatureRef}
              canvasProps={{
                className: "w-full h-full",
                style: { background: "white" },
              }}
              penColor="black"
            />
          </div>
          <DialogFooter className="flex flex-row gap-2 justify-between sm:justify-between">
            <Button variant="outline" onClick={clearSignature}>
              Clear
            </Button>
            <Button onClick={saveSignature}>
              <Save className="h-4 w-4 mr-2" />
              Save Signature
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Date Picker Dialog for date fields would be added here */}
      {/* Show completion dialog when signing is completed */}
      <Dialog open={signingCompleted} onOpenChange={setSigningCompleted}>
        <DialogContent className="sm:max-w-md">
          <SigningCompletedDialog documentId={document.id} documentTitle={document.title || "Document"} isLastSigner={isLastSigner} />
        </DialogContent>
      </Dialog>
      {/* Signing confirmation dialog */}
      <SignConfirmationDialog
        open={isConfirmationModalOpen}
        onOpenChangeAction={setIsConfirmationModalOpen}
        onConfirmAction={handleSignDocument}
        documentTitle={document.title || "Document"}
        isLoading={isSigning}
      />
    </div>
  );
}
