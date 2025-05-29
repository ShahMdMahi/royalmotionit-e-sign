"use client";

import { Document as PrismaDocument, Signer } from "@prisma/client";
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
// Replace PDFViewer with our new component
import { SignDocumentPdfViewerSimple } from "@/components/document/sign-document-pdf-viewer-simple";
import { getFromR2 } from "@/actions/r2";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { ArrowLeft, CheckCircle, Save, Send, AlertTriangle, AlertCircle, Menu, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useRouter } from "next/navigation";
import { PageNavigation } from "@/components/document/page-navigation";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
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

interface SignDocumentComponentProps {
  document: PrismaDocument & {
    fields?: DocumentField[];
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
  const [signingCompleted, setSigningCompleted] = useState(false);
  const [isLastSigner, setIsLastSigner] = useState(false);
  const [autoSaveTimer, setAutoSaveTimer] = useState<NodeJS.Timeout | null>(null);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const signatureRef = useRef<SignatureCanvasRef | null>(null);
  const [date] = useState<Date | undefined>(new Date());

  // Memoized calculations for performance
  const requiredFields = useMemo(() => fields.filter((field) => field.required), [fields]);

  const completionPercentage = useMemo(() => {
    if (fields.length === 0) return 100;
    if (requiredFields.length === 0) return 100;

    const completedFields = requiredFields.filter((field) => {
      const value = fieldValues[field.id];
      return value !== undefined && value !== "";
    });

    return Math.round((completedFields.length / requiredFields.length) * 100);
  }, [fields.length, requiredFields, fieldValues]);

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

  // Initialize field values as empty strings when fields are loaded
  useEffect(() => {
    if (fields.length > 0) {
      setFieldValues((prev) => {
        const initializedValues: Record<string, string> = { ...prev };

        // Initialize all field values as empty strings if they don't exist or are null
        fields.forEach((field) => {
          // Ensure all field values are strings, never null
          if (initializedValues[field.id] === null || initializedValues[field.id] === undefined) {
            // Convert field.value to string, defaulting to empty string if null/undefined
            initializedValues[field.id] = field.value && typeof field.value === "string" ? field.value : "";
          }
        });

        console.log("Field values initialized:", initializedValues);
        return initializedValues;
      });
    }
  }, [fields]);

  // Load backup data on component mount (after field initialization)
  useEffect(() => {
    // Try to restore from backup on component mount
    try {
      const backupKey = `signing-backup-${document.id}`;
      const backupData = sessionStorage.getItem(backupKey);
      if (backupData) {
        const parsed = JSON.parse(backupData);
        if (parsed.signerId === signer.id && parsed.fieldValues) {
          // Ensure backup values are strings, not null
          const cleanedFieldValues: Record<string, string> = {};
          Object.entries(parsed.fieldValues).forEach(([fieldId, value]) => {
            // Convert any null/undefined values to empty strings
            cleanedFieldValues[fieldId] = value && typeof value === "string" ? value : "";
          });

          setFieldValues((prev) => ({
            ...prev,
            ...cleanedFieldValues,
          }));

          console.log("Restored backup data:", cleanedFieldValues);
          toast.info("Restored your previous progress");
        }
      }
    } catch (error) {
      console.warn("Failed to restore backup:", error);
    }
  }, [document.id, signer.id, fields]); // Added fields dependency

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (autoSaveTimer) {
        clearTimeout(autoSaveTimer);
      }
    };
  }, [autoSaveTimer]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ctrl/Cmd + S to save progress
      if ((event.ctrlKey || event.metaKey) && event.key === "s") {
        event.preventDefault();
        try {
          const backupData = {
            documentId: document.id,
            signerId: signer.id,
            fieldValues,
            timestamp: new Date().toISOString(),
          };
          sessionStorage.setItem(`signing-backup-${document.id}`, JSON.stringify(backupData));
          toast.success("Progress saved");
        } catch (error) {
          console.log("Error while saving progress", error);
          toast.error("Failed to save progress");
        }
      }

      // Ctrl/Cmd + Enter to sign (if all fields are completed)
      if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
        event.preventDefault();
        if (completionPercentage === 100 && !isSigning) {
          setIsConfirmationModalOpen(true);
        } else {
          toast.info("Please complete all required fields first");
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [completionPercentage, isSigning, fieldValues, document.id, signer.id]);

  // Handle field click
  const handleFieldClick = useCallback(
    (fieldId: string) => {
      const field = fields.find((f) => f.id === fieldId);
      if (!field) return;

      try {
        switch (field.type) {
          case "signature":
          case "initial":
            setActiveFieldId(fieldId);
            // Force signature modal to open when clicking on a signature field
            console.log(`Opening signature modal for field: ${fieldId}`);
            setTimeout(() => setIsSignatureModalOpen(true), 0);
            break;
          case "date":
            handleFieldChange(fieldId, format(date || new Date(), "yyyy-MM-dd"));
            break;
          case "text":
          case "email":
          case "phone":
          case "number":
          case "textarea":
            setActiveFieldId(fieldId);
            // For text-based fields, handle directly (implementation moved to side panel)
            break;
          case "checkbox":
            // Toggle checkbox value
            const currentValue = fieldValues[fieldId];
            handleFieldChange(fieldId, currentValue === "true" ? "false" : "true");
            break;
          case "dropdown":
          case "radio":
          case "image":
          case "formula":
          case "payment":
            setActiveFieldId(fieldId);
            // For dropdown, radio, image, formula, and payment fields, handle in the side panel
            // Show a toast to guide the user
            toast.info(`Please use the field panel on the left to complete "${field.label || field.type}"`);
            break;
          default:
            // Handle any other field types
            setActiveFieldId(fieldId);
            console.warn(`Unhandled field type: ${field.type}`);
            break;
        }
      } catch (error) {
        console.error(`Error handling field click for field ${fieldId}:`, error);
        toast?.error?.("Failed to interact with the field. Please try again.");
      }
    },
    [fields, fieldValues, date]
  );

  // Handle field value changes with auto-save
  const handleFieldChange = useCallback(
    (fieldId: string, value: string) => {
      setFieldValues((prev) => ({
        ...prev,
        [fieldId]: value,
      }));

      // Remove validation error for the field if it exists
      setFieldErrors((prev) => prev.filter((error) => error.fieldId !== fieldId));

      // Auto-save after a delay
      if (autoSaveTimer) {
        clearTimeout(autoSaveTimer);
      }

      const timer = setTimeout(() => {
        // Save field value to session storage as backup
        try {
          const backupData = {
            documentId: document.id,
            signerId: signer.id,
            fieldValues: { ...fieldValues, [fieldId]: value },
            timestamp: new Date().toISOString(),
          };
          sessionStorage.setItem(`signing-backup-${document.id}`, JSON.stringify(backupData));
        } catch (error) {
          console.warn("Failed to save backup:", error);
        }
      }, 2000);

      setAutoSaveTimer(timer);
    },
    [autoSaveTimer, fieldValues, document.id, signer.id]
  );

  // Clear signature canvas
  const clearSignature = useCallback(() => {
    if (signatureRef.current) {
      signatureRef.current.clear();
    }
  }, []);

  // Save signature
  const saveSignature = useCallback(() => {
    if (!signatureRef.current || signatureRef.current.isEmpty()) {
      toast.error("Please provide a signature");
      return;
    }

    if (!activeFieldId) {
      toast.error("No active signature field selected");
      return;
    }

    try {
      const signature = signatureRef.current.toDataURL();
      console.log(`Saving signature for field: ${activeFieldId}`);
      handleFieldChange(activeFieldId, signature);
      toast.success("Signature saved successfully");
      setIsSignatureModalOpen(false);
    } catch (error) {
      console.error("Error saving signature:", error);
      toast.error("Failed to save signature. Please try again.");
    }
  }, [activeFieldId, handleFieldChange]);

  // Validate fields with enhanced error reporting
  const validateFields = () => {
    const errors: FieldValidationError[] = [];

    console.log("Validating fields. Current fieldValues:", fieldValues);

    // Check for missing required fields
    const requiredFields = fields.filter((field) => field.required);
    requiredFields.forEach((field) => {
      const value = fieldValues[field.id];
      console.log(`Validating field ${field.id} (${field.label}):`, { value, type: typeof value });

      // Handle null, undefined, and empty string values safely
      if (value === null || value === undefined || (typeof value === "string" && value.trim() === "")) {
        errors.push({
          fieldId: field.id,
          message: `Required field "${field.label || field.type}" must be completed`,
          severity: "error",
        });
        console.log(`Field ${field.id} failed validation: value is null/undefined/empty`);
      }
    });

    // Type-specific validations with better error messages
    fields.forEach((field) => {
      const value = fieldValues[field.id];
      // Handle null, undefined, and empty string values safely
      if (!value || (typeof value === "string" && value.trim() === "")) return; // Skip empty non-required fields

      switch (field.type) {
        case "text":
          // Check field-specific validation rules for text fields
          if (field.validationRule?.includes("minLength:")) {
            const minLength = parseInt(field.validationRule.substring(field.validationRule.indexOf("minLength:") + 10));
            if (!isNaN(minLength) && value.length < minLength) {
              errors.push({
                fieldId: field.id,
                message: `"${field.label || "Text"}" must be at least ${minLength} characters`,
                severity: "error",
              });
            }
          }
          if (field.validationRule?.includes("maxLength:")) {
            const maxLength = parseInt(field.validationRule.substring(field.validationRule.indexOf("maxLength:") + 10));
            if (!isNaN(maxLength) && value.length > maxLength) {
              errors.push({
                fieldId: field.id,
                message: `"${field.label || "Text"}" must be no more than ${maxLength} characters`,
                severity: "error",
              });
            }
          }
          break;
        case "email":
          if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
            errors.push({
              fieldId: field.id,
              message: `Please enter a valid email address for "${field.label || "Email"}"`,
              severity: "error",
            });
          }
          break;
        case "phone":
          if (!/^[0-9+\-() ]{10,}$/.test(value)) {
            errors.push({
              fieldId: field.id,
              message: `Please enter a valid phone number for "${field.label || "Phone"}"`,
              severity: "error",
            });
          }
          break;
        case "date":
          if (isNaN(new Date(value).getTime())) {
            errors.push({
              fieldId: field.id,
              message: `Please enter a valid date for "${field.label || "Date"}"`,
              severity: "error",
            });
          }
          break;
        case "number":
          if (isNaN(Number(value))) {
            errors.push({
              fieldId: field.id,
              message: `Please enter a valid number for "${field.label || "Number"}"`,
              severity: "error",
            });
          }
          break;
        case "textarea":
          // Textarea follows the same validation as text fields
          if (field.validationRule?.includes("minLength:")) {
            const minLength = parseInt(field.validationRule.substring(field.validationRule.indexOf("minLength:") + 10));
            if (!isNaN(minLength) && value.length < minLength) {
              errors.push({
                fieldId: field.id,
                message: `"${field.label || "Text"}" must be at least ${minLength} characters`,
                severity: "error",
              });
            }
          }
          if (field.validationRule?.includes("maxLength:")) {
            const maxLength = parseInt(field.validationRule.substring(field.validationRule.indexOf("maxLength:") + 10));
            if (!isNaN(maxLength) && value.length > maxLength) {
              errors.push({
                fieldId: field.id,
                message: `"${field.label || "Text"}" must be no more than ${maxLength} characters`,
                severity: "error",
              });
            }
          }
          break;
        case "image":
          // Check if image is uploaded
          if (!value.includes("data:image") && !value.startsWith("http")) {
            errors.push({
              fieldId: field.id,
              message: `Please upload an image for "${field.label || "Image"}"`,
              severity: "error",
            });
          }
          break;
        case "payment":
          // Check if payment is completed
          if (!value || value !== "completed") {
            errors.push({
              fieldId: field.id,
              message: `Payment for "${field.label || "Payment"}" must be completed`,
              severity: "error",
            });
          }
          break;
        case "formula":
          // Formula fields are typically calculated, but check if result is valid
          if (!value || value === "error") {
            errors.push({
              fieldId: field.id,
              message: `Formula calculation error for "${field.label || "Formula"}"`,
              severity: "warning",
            });
          }
          break;
        case "signature":
        case "initial":
          // Check if signature is just a data URL placeholder or actually has content
          if (!value.includes("data:image") || value === "data:image/png;base64,") {
            errors.push({
              fieldId: field.id,
              message: `Please provide a ${field.type} for "${field.label || field.type}"`,
              severity: "error",
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
                message: `Field "${field.label || field.type}" format is invalid`,
                severity: "error",
              });
            }
          }

          // Minimum length validation
          if (field.validationRule.startsWith("minLength:")) {
            const minLength = parseInt(field.validationRule.substring(10));
            if (value.length < minLength) {
              errors.push({
                fieldId: field.id,
                message: `"${field.label || field.type}" must be at least ${minLength} characters`,
                severity: "error",
              });
            }
          }

          // Maximum length validation
          if (field.validationRule.startsWith("maxLength:")) {
            const maxLength = parseInt(field.validationRule.substring(10));
            if (value.length > maxLength) {
              errors.push({
                fieldId: field.id,
                message: `"${field.label || field.type}" must not exceed ${maxLength} characters`,
                severity: "error",
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

        // Clear the backup data
        try {
          sessionStorage.removeItem(`signing-backup-${document.id}`);
        } catch (error) {
          console.warn("Failed to clear backup:", error);
        }

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
        <div className="flex items-center space-x-2 sm:space-x-4">
          <Button variant="ghost" size="sm" onClick={() => router.push(`/documents/${document.id}`)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Back to Document</span>
            <span className="sm:hidden">Back</span>
          </Button>

          <Button variant="outline" size="sm" onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)} className="md:hidden">
            {isMobileSidebarOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            <span className="ml-2">Fields</span>
          </Button>

          <h1 className="text-sm sm:text-lg font-medium hidden sm:block">{document.title || "Untitled Document"}</h1>
        </div>

        <div className="flex items-center space-x-3">
          <div className="hidden md:block">
            <div className="flex items-center space-x-2">
              <Progress value={completionPercentage} className="w-40 h-2" />
              <span className="text-sm text-muted-foreground">{completionPercentage}%</span>
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              // Manual save to session storage
              try {
                const backupData = {
                  documentId: document.id,
                  signerId: signer.id,
                  fieldValues,
                  timestamp: new Date().toISOString(),
                };
                sessionStorage.setItem(`signing-backup-${document.id}`, JSON.stringify(backupData));
                toast.success("Progress saved locally");
              } catch (error) {
                console.log("Error while saving progress", error);
                toast.error("Failed to save progress");
              }
            }}
            className="hidden sm:flex"
          >
            <Save className="h-4 w-4 mr-2" />
            Save Progress
          </Button>

          {/* Debug button - temporary for troubleshooting */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              console.log("=== FIELD DEBUG INFO ===");
              console.log("Current fieldValues:", fieldValues);
              console.log("Fields:", fields);

              // Clean up any null values manually
              const cleanedValues: Record<string, string> = {};
              fields.forEach((field) => {
                const currentValue = fieldValues[field.id];
                cleanedValues[field.id] = currentValue && typeof currentValue === "string" ? currentValue : "";
              });

              console.log("Cleaned values:", cleanedValues);
              setFieldValues(cleanedValues);
              toast.info("Field values cleaned up");
            }}
            className="text-xs"
          >
            🐛 Debug
          </Button>

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
      </div>
      <div className="container mx-auto py-4 sm:py-8 px-2 sm:px-4">
        {/* Show validation errors summary if there are any */}
        {fieldErrors.length > 0 && (
          <div className="mb-4 sm:mb-6">
            <ValidationErrorsSummary
              errors={fieldErrors}
              onFieldClickAction={(fieldId) => {
                // Find the field and navigate to its page
                const field = fields.find((f) => f.id === fieldId);
                if (field) {
                  setCurrentPage(field.pageNumber);
                  // Scroll the field into view after a short delay
                  setTimeout(() => {
                    const fieldElement = window.document.querySelector(`[data-field-id="${fieldId}"]`);
                    if (fieldElement) {
                      fieldElement.scrollIntoView({ behavior: "smooth", block: "center" });
                    }
                  }, 100);
                }
                handleFieldClick(fieldId);
              }}
              fieldLabels={Object.fromEntries(fields.map((f) => [f.id, f.label || f.type]))}
            />
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 sm:gap-6 relative">
          {/* Instruction sidebar - collapses to expandable section on mobile */}
          <div
            className={`space-y-4 sm:space-y-6 ${isMobileSidebarOpen ? "block" : "hidden"} md:block${isMobileSidebarOpen ? " fixed inset-0 bg-background/95 backdrop-blur-sm z-50 overflow-auto p-4" : ""}`}
          >
            {isMobileSidebarOpen && (
              <div className="flex justify-between items-center mb-4 md:hidden">
                <h2 className="text-lg font-semibold">Document Fields</h2>
                <Button variant="ghost" size="sm" onClick={() => setIsMobileSidebarOpen(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
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
                  <h3 className="text-sm font-medium mb-2">How to sign:</h3>
                  <ul className="text-xs text-muted-foreground space-y-1">
                    <li>• Fill out all required fields (*) in the panel below</li>
                    <li>• Click on PDF fields to jump to that section</li>
                    <li>• Use Ctrl+S to save your progress</li>
                    <li>• Use Ctrl+Enter to sign when ready</li>
                    <li>• Your progress is automatically saved</li>
                  </ul>
                </div>

                {fieldErrors.length > 0 && (
                  <div className="pt-2">
                    <div className="bg-destructive/10 border border-destructive/20 rounded-md p-2">
                      <p className="text-xs font-medium text-destructive mb-1">
                        {fieldErrors.length} error{fieldErrors.length > 1 ? "s" : ""} found:
                      </p>
                      <ul className="text-xs text-destructive space-y-1">
                        {fieldErrors.slice(0, 3).map((error, index) => (
                          <li key={index}>• {error.message}</li>
                        ))}
                        {fieldErrors.length > 3 && <li>• And {fieldErrors.length - 3} more...</li>}
                      </ul>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Field Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Field Summary</CardTitle>
                <CardDescription>Complete all required fields to sign</CardDescription>
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
                          className={`p-2 rounded border ${fieldError ? "border-destructive bg-destructive/5" : isCompleted ? "border-primary/40 bg-primary/5" : "border-border"} transition-colors`}
                          style={fieldError || isCompleted ? {} : fieldStyle}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2 min-w-0">
                              {fieldError ? <AlertCircle className="h-4 w-4 flex-shrink-0 text-destructive" /> : null}
                              <span className={`text-sm font-medium truncate ${field.required ? "text-primary" : ""}`}>
                                {field.label || field.type}
                                {field.required && <span className="text-primary">*</span>}
                              </span>
                            </div>
                            <Badge variant={fieldError ? "destructive" : isCompleted ? "default" : "outline"} className="text-xs whitespace-nowrap">
                              {fieldError ? "Error" : isCompleted ? "Completed" : "Pending"}
                            </Badge>
                          </div>

                          {/* Inline field editing */}
                          <div className="space-y-2">
                            {field.type === "text" || field.type === "email" || field.type === "phone" || field.type === "number" ? (
                              <Input
                                type={field.type === "email" ? "email" : field.type === "phone" ? "tel" : field.type === "number" ? "number" : "text"}
                                placeholder={field.placeholder || `Enter ${field.label || field.type}`}
                                value={fieldValues[field.id] || ""}
                                onChange={(e) => handleFieldChange(field.id, e.target.value)}
                                className="h-8 text-xs"
                              />
                            ) : field.type === "date" ? (
                              <Input type="date" value={fieldValues[field.id] || ""} onChange={(e) => handleFieldChange(field.id, e.target.value)} className="h-8 text-xs" />
                            ) : field.type === "textarea" ? (
                              <Textarea
                                placeholder={field.placeholder || `Enter ${field.label || field.type}`}
                                value={fieldValues[field.id] || ""}
                                onChange={(e) => handleFieldChange(field.id, e.target.value)}
                                className="min-h-16 text-xs resize-none"
                                rows={2}
                              />
                            ) : field.type === "checkbox" ? (
                              <div className="flex items-center space-x-2">
                                <Checkbox id={field.id} checked={fieldValues[field.id] === "true"} onCheckedChange={(checked) => handleFieldChange(field.id, checked ? "true" : "false")} />
                                <Label htmlFor={field.id} className="text-xs">
                                  {field.placeholder || "Check this box"}
                                </Label>
                              </div>
                            ) : field.type === "radio" ? (
                              <RadioGroup value={fieldValues[field.id] || ""} onValueChange={(value) => handleFieldChange(field.id, value)} className="space-y-1">
                                {field.options ? (
                                  field.options.split(",").map((option, index) => (
                                    <div key={index} className="flex items-center space-x-2">
                                      <RadioGroupItem value={option.trim()} id={`${field.id}-${index}`} />
                                      <Label htmlFor={`${field.id}-${index}`} className="text-xs">
                                        {option.trim()}
                                      </Label>
                                    </div>
                                  ))
                                ) : (
                                  <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="option1" id={`${field.id}-1`} />
                                    <Label htmlFor={`${field.id}-1`} className="text-xs">
                                      Option 1
                                    </Label>
                                  </div>
                                )}
                              </RadioGroup>
                            ) : field.type === "dropdown" ? (
                              <Select value={fieldValues[field.id] || ""} onValueChange={(value) => handleFieldChange(field.id, value)}>
                                <SelectTrigger className="h-8 text-xs">
                                  <SelectValue placeholder={field.placeholder || "Select an option"} />
                                </SelectTrigger>
                                <SelectContent>
                                  {field.options ? (
                                    field.options.split(",").map((option, index) => (
                                      <SelectItem key={index} value={option.trim()}>
                                        {option.trim()}
                                      </SelectItem>
                                    ))
                                  ) : (
                                    <SelectItem value="option1">Option 1</SelectItem>
                                  )}
                                </SelectContent>
                              </Select>
                            ) : field.type === "signature" || field.type === "initial" ? (
                              <Button variant="outline" size="sm" onClick={() => handleFieldClick(field.id)} className="w-full h-8 text-xs">
                                {isCompleted ? "Update Signature" : "Add Signature"}
                              </Button>
                            ) : field.type === "image" ? (
                              <Button variant="outline" size="sm" onClick={() => handleFieldClick(field.id)} className="w-full h-8 text-xs">
                                {isCompleted ? "Update Image" : "Upload Image"}
                              </Button>
                            ) : field.type === "formula" ? (
                              <div className="p-2 bg-muted rounded text-xs">
                                <span className="text-muted-foreground">Formula Result: {fieldValues[field.id] || "Calculating..."}</span>
                              </div>
                            ) : field.type === "payment" ? (
                              <Button variant="outline" size="sm" onClick={() => handleFieldClick(field.id)} className="w-full h-8 text-xs">
                                {isCompleted ? "Payment Completed" : "Complete Payment"}
                              </Button>
                            ) : (
                              <Button variant="outline" size="sm" onClick={() => handleFieldClick(field.id)} className="w-full h-8 text-xs">
                                Click to edit
                              </Button>
                            )}
                          </div>
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
                  <div className="h-[100vh] w-full mx-auto">
                    <SignDocumentPdfViewerSimple
                      pdfData={pdfData}
                      fields={fields}
                      fieldValues={fieldValues}
                      fieldErrors={fieldErrors}
                      currentPage={currentPage}
                      currentSignerId={signer.id}
                      onPageChangeAction={async (page: number) => {
                        setCurrentPage(page);
                        return page;
                      }}
                      onTotalPagesChangeAction={async (pages: number) => {
                        setTotalPages(pages);
                        return pages;
                      }}
                      onFieldClickAction={handleFieldClick}
                      onFieldChangeAction={handleFieldChange}
                    />
                  </div>
                )}
              </CardContent>
              {/* <CardFooter className="border-t p-2">
                <PageNavigation
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChangeAction={async (page) => {
                    setCurrentPage(page);
                    return page;
                  }}
                />
              </CardFooter> */}
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
