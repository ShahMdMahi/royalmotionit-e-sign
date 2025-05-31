"use client";

import { Document as PrismaDocument, Signer } from "@prisma/client";
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { SignDocumentPdfViewerSimple } from "@/components/document/sign-document-pdf-viewer-simple";
import { getFromR2 } from "@/actions/r2";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  ArrowLeft,
  Save,
  Send,
  AlertTriangle,
  AlertCircle,
  Menu,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import SignatureCanvasWrapper, {
  SignatureCanvasRef,
} from "./signature-canvas-wrapper";
import { format } from "date-fns";
import { completeDocumentSigning } from "@/actions/sign-document";
import { getIpAddress, getUserAgent } from "@/lib/client-info";
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

export function SignDocumentComponent({
  document,
  signer,
  fields,
}: SignDocumentComponentProps) {
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
  const [autoSaveTimer, setAutoSaveTimer] = useState<NodeJS.Timeout | null>(
    null,
  );
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const signatureRef = useRef<SignatureCanvasRef | null>(null);
  const [date] = useState<Date | undefined>(new Date());
  console.log("Total page", totalPages);
  // Memoized calculations for performance
  const requiredFields = useMemo(
    () => fields.filter((field) => field.required),
    [fields],
  );

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
            console.error(
              "Failed to fetch PDF: Response successful but no body content.",
            );
            setError("PDF content is missing in the response.");
          }
        } else {
          console.error(
            "Failed to fetch PDF:",
            response.message,
            response.error,
          );
          setError(response.message || "Failed to load PDF document.");
        }
      } catch (e) {
        console.error("Error fetching document:", e);
        setError(
          e instanceof Error ? e.message : "An unexpected error occurred.",
        );
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
          if (
            initializedValues[field.id] === null ||
            initializedValues[field.id] === undefined
          ) {
            // Convert field.value to string, defaulting to empty string if null/undefined
            initializedValues[field.id] =
              field.value && typeof field.value === "string" ? field.value : "";
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
            cleanedFieldValues[fieldId] =
              value && typeof value === "string" ? value : "";
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
          sessionStorage.setItem(
            `signing-backup-${document.id}`,
            JSON.stringify(backupData),
          );
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
            handleFieldChange(
              fieldId,
              format(date || new Date(), "yyyy-MM-dd"),
            );
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
            handleFieldChange(
              fieldId,
              currentValue === "true" ? "false" : "true",
            );
            break;
          case "dropdown":
          case "radio":
          case "image":
          case "formula":
          case "payment":
            setActiveFieldId(fieldId);
            // For dropdown, radio, image, formula, and payment fields, handle in the side panel
            // Show a toast to guide the user
            toast.info(
              `Please use the field panel on the left to complete "${field.label || field.type}"`,
            );
            break;
          default:
            // Handle any other field types
            setActiveFieldId(fieldId);
            console.warn(`Unhandled field type: ${field.type}`);
            break;
        }
      } catch (error) {
        console.error(
          `Error handling field click for field ${fieldId}:`,
          error,
        );
        toast?.error?.("Failed to interact with the field. Please try again.");
      }
    },
    [fields, fieldValues, date],
  );

  // Handle field value changes with auto-save
  const handleFieldChange = useCallback(
    (fieldId: string, value: string) => {
      setFieldValues((prev) => ({
        ...prev,
        [fieldId]: value,
      }));

      // Remove validation error for the field if it exists
      setFieldErrors((prev) =>
        prev.filter((error) => error.fieldId !== fieldId),
      );

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
          sessionStorage.setItem(
            `signing-backup-${document.id}`,
            JSON.stringify(backupData),
          );
        } catch (error) {
          console.warn("Failed to save backup:", error);
        }
      }, 2000);

      setAutoSaveTimer(timer);
    },
    [autoSaveTimer, fieldValues, document.id, signer.id],
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
      console.log(`Validating field ${field.id} (${field.label}):`, {
        value,
        type: typeof value,
      });

      // Handle null, undefined, and empty string values safely
      if (
        value === null ||
        value === undefined ||
        (typeof value === "string" && value.trim() === "")
      ) {
        errors.push({
          fieldId: field.id,
          message: `Required field "${field.label || field.type}" must be completed`,
          severity: "error",
        });
        console.log(
          `Field ${field.id} failed validation: value is null/undefined/empty`,
        );
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
            const minLength = parseInt(
              field.validationRule.substring(
                field.validationRule.indexOf("minLength:") + 10,
              ),
            );
            if (!isNaN(minLength) && value.length < minLength) {
              errors.push({
                fieldId: field.id,
                message: `"${field.label || "Text"}" must be at least ${minLength} characters`,
                severity: "error",
              });
            }
          }
          if (field.validationRule?.includes("maxLength:")) {
            const maxLength = parseInt(
              field.validationRule.substring(
                field.validationRule.indexOf("maxLength:") + 10,
              ),
            );
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
            const minLength = parseInt(
              field.validationRule.substring(
                field.validationRule.indexOf("minLength:") + 10,
              ),
            );
            if (!isNaN(minLength) && value.length < minLength) {
              errors.push({
                fieldId: field.id,
                message: `"${field.label || "Text"}" must be at least ${minLength} characters`,
                severity: "error",
              });
            }
          }
          if (field.validationRule?.includes("maxLength:")) {
            const maxLength = parseInt(
              field.validationRule.substring(
                field.validationRule.indexOf("maxLength:") + 10,
              ),
            );
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
          if (
            !value.includes("data:image") ||
            value === "data:image/png;base64,"
          ) {
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
    // // Print field values in a big red style in the browser console
    // console.log(
    //   "%cField values before signing:",
    //   "color: white; background: red; font-size: 2rem; font-weight: bold; padding: 8px 16px; border-radius: 4px;", fieldValues
    // );

    try {
      setIsSigning(true);

      // Get client user agent for tracking
      const userAgent = getUserAgent();
      const ipAddress = await getIpAddress();

      // // Print user agent in a big red style in the browser console
      // console.log(
      //   "%cUser Agent before signing:",
      //   "color: white; background: red; font-size: 2rem; font-weight: bold; padding: 8px 16px; border-radius: 4px;",
      //   userAgent
      // );

      // Call the server action to complete the document signing process
      const result = await completeDocumentSigning(
        document.id,
        signer.id,
        fieldValues,
        { userAgent, ipAddress },
      );

      // Print result in a big red style in the browser console
      console.log(
        "%cSign Document Result:",
        "color: white; background: red; font-size: 2rem; font-weight: bold; padding: 8px 16px; border-radius: 4px;",
        result,
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
        const remainingSigners = document.signers.filter(
          (s) => s.id !== signer.id && s.status !== "COMPLETED",
        );
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
        if (
          result?.validationErrors &&
          Array.isArray(result.validationErrors)
        ) {
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
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="flex flex-col items-center space-y-4 max-w-sm text-center">
          <div className="animate-spin rounded-full h-12 w-12 sm:h-16 sm:w-16 border-t-2 border-b-2 border-primary"></div>
          <div className="space-y-2">
            <h3 className="text-lg sm:text-xl font-semibold">
              Loading Document
            </h3>
            <p className="text-sm sm:text-base text-muted-foreground">
              Please wait while we prepare your document for signing...
            </p>
            <div className="w-full max-w-xs">
              <Progress value={30} className="w-full h-2" />
              <p className="text-xs text-muted-foreground mt-1">
                Retrieving document data...
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error && !pdfData) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="flex flex-col items-center space-y-4 max-w-md text-center">
          <div className="p-4 rounded-full bg-destructive/10">
            <AlertTriangle className="h-8 w-8 text-destructive" />
          </div>
          <div className="space-y-2">
            <h3 className="text-lg sm:text-xl font-semibold text-destructive">
              Document Error
            </h3>
            <p className="text-sm sm:text-base text-muted-foreground">
              {error || "Unable to load the document. Please try again later."}
            </p>
            <div className="flex flex-col sm:flex-row gap-2 mt-4">
              <Button
                variant="outline"
                onClick={() => window.location.reload()}
              >
                Retry Loading
              </Button>
              <Button
                variant="outline"
                onClick={() => router.push(`/documents/${document.id}`)}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/20">
      {/* Enhanced Header with better mobile responsiveness */}
      <div className="sticky top-0 z-20 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-sm">
        <div className="p-3 sm:p-4 lg:p-6">
          <div className="flex items-center justify-between gap-2 sm:gap-4">
            {/* Left section - Navigation and title */}
            <div className="flex items-center space-x-2 sm:space-x-4 min-w-0 flex-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push(`/documents/${document.id}`)}
                className="flex-shrink-0 h-8 sm:h-9"
              >
                <ArrowLeft className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                <span className="hidden xs:inline text-xs sm:text-sm">
                  Back
                </span>
                <span className="hidden sm:inline ml-1">to Document</span>
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
                className="lg:hidden flex-shrink-0 h-8 sm:h-9"
              >
                {isMobileSidebarOpen ? (
                  <X className="h-3 w-3 sm:h-4 sm:w-4" />
                ) : (
                  <Menu className="h-3 w-3 sm:h-4 sm:w-4" />
                )}
                <span className="ml-1 sm:ml-2 text-xs sm:text-sm">Fields</span>
              </Button>

              {/* Document title with responsive behavior */}
              <div className="min-w-0 flex-1">
                <h1 className="text-sm sm:text-lg lg:text-xl font-medium truncate">
                  <span className="hidden sm:inline">
                    {document.title || "Untitled Document"}
                  </span>
                  <span className="sm:hidden">
                    {(document.title || "Document").length > 12
                      ? `${(document.title || "Document").substring(0, 12)}...`
                      : document.title || "Document"}
                  </span>
                </h1>
                <p className="text-xs text-muted-foreground sm:hidden">
                  Signing
                </p>
              </div>
            </div>

            {/* Right section - Progress and actions */}
            <div className="flex items-center space-x-2 sm:space-x-3 flex-shrink-0">
              {/* Progress indicator - responsive visibility */}
              <div className="hidden md:flex items-center space-x-2">
                <Progress
                  value={completionPercentage}
                  className="w-32 lg:w-40 h-2"
                />
                <span className="text-sm text-muted-foreground whitespace-nowrap">
                  {completionPercentage}%
                </span>
              </div>

              {/* Mobile progress indicator */}
              <div className="md:hidden">
                <div className="text-xs text-muted-foreground">
                  {completionPercentage}%
                </div>
              </div>

              {/* Save progress button */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  try {
                    const backupData = {
                      documentId: document.id,
                      signerId: signer.id,
                      fieldValues,
                      timestamp: new Date().toISOString(),
                    };
                    sessionStorage.setItem(
                      `signing-backup-${document.id}`,
                      JSON.stringify(backupData),
                    );
                    toast.success("Progress saved locally");
                  } catch (error) {
                    console.log("Error while saving progress", error);
                    toast.error("Failed to save progress");
                  }
                }}
                className="hidden sm:flex h-8 sm:h-9 px-2 sm:px-3 text-xs sm:text-sm"
              >
                <Save className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
                <span className="hidden sm:inline">Save</span>
                <span className="hidden lg:inline ml-1">Progress</span>
              </Button>

              {/* Sign button */}
              <Button
                onClick={() => {
                  if (!validateFields()) {
                    toast.error(
                      "Please complete all required fields before signing",
                    );
                    return;
                  }
                  setIsConfirmationModalOpen(true);
                }}
                disabled={isSigning || completionPercentage < 100}
                className={`relative h-8 sm:h-9 px-3 sm:px-4 text-xs sm:text-sm ${isSigning ? "opacity-80" : ""}`}
              >
                {isSigning ? (
                  <>
                    <span className="animate-pulse">Signing...</span>
                    <span className="absolute inset-0 flex items-center justify-center">
                      <span className="animate-spin h-3 w-3 sm:h-4 sm:w-4 border-t-2 border-white border-opacity-50 rounded-full"></span>
                    </span>
                  </>
                ) : (
                  <>
                    <Send className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
                    <span className="hidden sm:inline">Sign</span>
                    <span className="hidden lg:inline ml-1">Document</span>
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Mobile progress bar */}
          <div className="mt-3 md:hidden">
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
              <span>Progress</span>
              <span>{completionPercentage}% complete</span>
            </div>
            <Progress value={completionPercentage} className="w-full h-2" />
          </div>
        </div>
      </div>

      {/* Main container with responsive layout */}
      <div className="flex-1 container mx-auto py-3 sm:py-6 lg:py-8 px-2 sm:px-4 lg:px-6">
        {/* Validation errors summary */}
        {fieldErrors.length > 0 && (
          <div className="mb-4 sm:mb-6">
            <ValidationErrorsSummary
              errors={fieldErrors}
              onFieldClickAction={(fieldId) => {
                const field = fields.find((f) => f.id === fieldId);
                if (field) {
                  setCurrentPage(field.pageNumber);
                  setTimeout(() => {
                    const fieldElement = window.document.querySelector(
                      `[data-field-id="${fieldId}"]`,
                    );
                    if (fieldElement) {
                      fieldElement.scrollIntoView({
                        behavior: "smooth",
                        block: "center",
                      });
                    }
                  }, 100);
                }
                handleFieldClick(fieldId);
              }}
              fieldLabels={Object.fromEntries(
                fields.map((f) => [f.id, f.label || f.type]),
              )}
            />
          </div>
        )}

        {/* Responsive grid layout */}
        <div className="grid grid-cols-1 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4 lg:gap-6 relative">
          {/* Sidebar for fields - Enhanced responsive behavior */}
          <div
            className={`
              space-y-3 sm:space-y-4 lg:space-y-6 
              ${isMobileSidebarOpen ? "block" : "hidden"} 
              lg:block lg:col-span-1 xl:col-span-1
              ${isMobileSidebarOpen ? "fixed inset-0 bg-background/95 backdrop-blur-sm z-50 overflow-auto p-4" : ""}
            `}
          >
            {/* Mobile sidebar header */}
            {isMobileSidebarOpen && (
              <div className="flex justify-between items-center mb-4 lg:hidden">
                <h2 className="text-lg font-semibold">Document Fields</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsMobileSidebarOpen(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}

            {/* Instructions card */}
            <Card className="shadow-sm">
              <CardHeader className="py-3 sm:py-4 lg:py-6">
                <CardTitle className="text-base sm:text-lg">
                  Signing Instructions
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  Complete all required fields to sign this document
                </CardDescription>
              </CardHeader>
              <CardContent className="py-2 px-3 sm:py-4 sm:px-6 space-y-3 sm:space-y-4">
                <div className="space-y-2">
                  <p className="text-sm font-medium">
                    Required fields: {fields.filter((f) => f.required).length}
                  </p>
                  <Progress
                    value={completionPercentage}
                    className="w-full h-2"
                  />
                  <p className="text-xs text-muted-foreground">
                    {completionPercentage}% complete
                  </p>
                </div>

                <div className="pt-2">
                  <h3 className="text-sm font-medium mb-2">How to sign:</h3>
                  <ul className="text-xs text-muted-foreground space-y-1">
                    <li>• Fill out all required fields (*) below</li>
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
                        {fieldErrors.length} error
                        {fieldErrors.length > 1 ? "s" : ""} found:
                      </p>
                      <ul className="text-xs text-destructive space-y-1">
                        {fieldErrors.slice(0, 3).map((error, index) => (
                          <li key={index}>• {error.message}</li>
                        ))}
                        {fieldErrors.length > 3 && (
                          <li>• And {fieldErrors.length - 3} more...</li>
                        )}
                      </ul>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Fields summary card */}
            <Card className="shadow-sm">
              <CardHeader className="py-3 sm:py-4">
                <CardTitle className="text-base sm:text-lg">
                  Field Summary
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  Complete all required fields to sign
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 sm:space-y-3">
                {fields.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No fields assigned to you
                  </p>
                ) : (
                  fields.map((field) => {
                    const isCompleted = !!fieldValues[field.id];
                    const fieldError = fieldErrors.find(
                      (err) => err.fieldId === field.id,
                    );

                    return (
                      <FieldErrorTooltip
                        key={field.id}
                        fieldId={field.id}
                        fieldErrors={fieldErrors}
                      >
                        <div
                          className={`
                            p-2 sm:p-3 rounded-lg border transition-all duration-200 hover:shadow-sm
                            ${
                              fieldError
                                ? "border-destructive bg-destructive/5"
                                : isCompleted
                                  ? "border-primary/40 bg-primary/5"
                                  : "border-border hover:border-primary/20"
                            }
                          `}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2 min-w-0">
                              {fieldError && (
                                <AlertCircle className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0 text-destructive" />
                              )}
                              <span
                                className={`text-xs sm:text-sm font-medium truncate ${field.required ? "text-primary" : ""}`}
                              >
                                {field.label || field.type}
                                {field.required && (
                                  <span className="text-primary">*</span>
                                )}
                              </span>
                            </div>
                            <Badge
                              variant={
                                fieldError
                                  ? "destructive"
                                  : isCompleted
                                    ? "default"
                                    : "outline"
                              }
                              className="text-xs whitespace-nowrap"
                            >
                              {fieldError
                                ? "Error"
                                : isCompleted
                                  ? "Done"
                                  : "Pending"}
                            </Badge>
                          </div>

                          {/* Enhanced inline field editing */}
                          <div className="space-y-2">
                            {(field.type === "text" ||
                              field.type === "email" ||
                              field.type === "phone" ||
                              field.type === "number") && (
                              <Input
                                type={
                                  field.type === "email"
                                    ? "email"
                                    : field.type === "phone"
                                      ? "tel"
                                      : field.type === "number"
                                        ? "number"
                                        : "text"
                                }
                                placeholder={
                                  field.placeholder ||
                                  `Enter ${field.label || field.type}`
                                }
                                value={fieldValues[field.id] || ""}
                                onChange={(e) =>
                                  handleFieldChange(field.id, e.target.value)
                                }
                                className="h-7 sm:h-8 text-xs sm:text-sm"
                              />
                            )}

                            {field.type === "date" && (
                              <Input
                                type="date"
                                value={fieldValues[field.id] || ""}
                                onChange={(e) =>
                                  handleFieldChange(field.id, e.target.value)
                                }
                                className="h-7 sm:h-8 text-xs sm:text-sm"
                              />
                            )}

                            {field.type === "textarea" && (
                              <Textarea
                                placeholder={
                                  field.placeholder ||
                                  `Enter ${field.label || field.type}`
                                }
                                value={fieldValues[field.id] || ""}
                                onChange={(e) =>
                                  handleFieldChange(field.id, e.target.value)
                                }
                                className="min-h-12 sm:min-h-16 text-xs sm:text-sm resize-none"
                                rows={2}
                              />
                            )}

                            {field.type === "checkbox" && (
                              <div className="flex items-center space-x-2">
                                <Checkbox
                                  id={field.id}
                                  checked={fieldValues[field.id] === "true"}
                                  onCheckedChange={(checked) =>
                                    handleFieldChange(
                                      field.id,
                                      checked ? "true" : "false",
                                    )
                                  }
                                />
                                <Label
                                  htmlFor={field.id}
                                  className="text-xs sm:text-sm"
                                >
                                  {field.placeholder || "Check this box"}
                                </Label>
                              </div>
                            )}

                            {field.type === "radio" && (
                              <RadioGroup
                                value={fieldValues[field.id] || ""}
                                onValueChange={(value) =>
                                  handleFieldChange(field.id, value)
                                }
                                className="space-y-1"
                              >
                                {field.options ? (
                                  field.options
                                    .split(",")
                                    .map((option, index) => (
                                      <div
                                        key={index}
                                        className="flex items-center space-x-2"
                                      >
                                        <RadioGroupItem
                                          value={option.trim()}
                                          id={`${field.id}-${index}`}
                                        />
                                        <Label
                                          htmlFor={`${field.id}-${index}`}
                                          className="text-xs sm:text-sm"
                                        >
                                          {option.trim()}
                                        </Label>
                                      </div>
                                    ))
                                ) : (
                                  <div className="flex items-center space-x-2">
                                    <RadioGroupItem
                                      value="option1"
                                      id={`${field.id}-1`}
                                    />
                                    <Label
                                      htmlFor={`${field.id}-1`}
                                      className="text-xs sm:text-sm"
                                    >
                                      Option 1
                                    </Label>
                                  </div>
                                )}
                              </RadioGroup>
                            )}

                            {field.type === "dropdown" && (
                              <Select
                                value={fieldValues[field.id] || ""}
                                onValueChange={(value) =>
                                  handleFieldChange(field.id, value)
                                }
                              >
                                <SelectTrigger className="h-7 sm:h-8 text-xs sm:text-sm">
                                  <SelectValue
                                    placeholder={
                                      field.placeholder || "Select option"
                                    }
                                  />
                                </SelectTrigger>
                                <SelectContent>
                                  {field.options ? (
                                    field.options
                                      .split(",")
                                      .map((option, index) => (
                                        <SelectItem
                                          key={index}
                                          value={option.trim()}
                                        >
                                          {option.trim()}
                                        </SelectItem>
                                      ))
                                  ) : (
                                    <SelectItem value="option1">
                                      Option 1
                                    </SelectItem>
                                  )}
                                </SelectContent>
                              </Select>
                            )}

                            {(field.type === "signature" ||
                              field.type === "initial") && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleFieldClick(field.id)}
                                className="w-full h-7 sm:h-8 text-xs sm:text-sm"
                              >
                                {isCompleted
                                  ? "Update Signature"
                                  : "Add Signature"}
                              </Button>
                            )}

                            {field.type === "image" && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleFieldClick(field.id)}
                                className="w-full h-7 sm:h-8 text-xs sm:text-sm"
                              >
                                {isCompleted ? "Update Image" : "Upload Image"}
                              </Button>
                            )}

                            {field.type === "formula" && (
                              <div className="p-2 bg-muted rounded text-xs sm:text-sm">
                                <span className="text-muted-foreground">
                                  Result:{" "}
                                  {fieldValues[field.id] || "Calculating..."}
                                </span>
                              </div>
                            )}

                            {field.type === "payment" && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleFieldClick(field.id)}
                                className="w-full h-7 sm:h-8 text-xs sm:text-sm"
                              >
                                {isCompleted
                                  ? "Payment Completed"
                                  : "Complete Payment"}
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

          {/* Main document viewer with enhanced responsiveness */}
          <div className="col-span-1 lg:col-span-3 xl:col-span-4 space-y-3 sm:space-y-4">
            <Card className="overflow-hidden shadow-lg">
              <CardContent className="p-0">
                {pdfData && (
                  <div className="h-[80vh] sm:h-[85vh] lg:h-[95vh] xl:h-[100vh] w-full">
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
            </Card>
          </div>
        </div>
      </div>
      {/* Enhanced Signature Dialog with full responsiveness */}
      <Dialog
        open={isSignatureModalOpen}
        onOpenChange={setIsSignatureModalOpen}
      >
        <DialogContent className="w-[95vw] max-w-lg sm:max-w-xl lg:max-w-2xl p-0 overflow-hidden">
          <DialogHeader className="p-4 sm:p-6">
            <DialogTitle className="text-lg sm:text-xl">
              Add your signature
            </DialogTitle>
            <DialogDescription className="text-sm sm:text-base">
              Please sign in the box below using your mouse or touch screen.
            </DialogDescription>
          </DialogHeader>

          <div className="mx-4 sm:mx-6 mb-4 sm:mb-6">
            <div className="h-48 sm:h-64 lg:h-72 border-2 border-dashed border-border rounded-lg bg-white shadow-inner">
              <SignatureCanvasWrapper
                ref={signatureRef}
                canvasProps={{
                  className: "w-full h-full rounded-lg",
                  style: { background: "white" },
                }}
                penColor="black"
              />
            </div>

            {/* Signature tips for mobile */}
            <div className="mt-3 p-3 bg-muted/50 rounded-lg">
              <p className="text-xs sm:text-sm text-muted-foreground">
                <strong>Tip:</strong> Use a stylus or your finger for the best
                signature quality on touch devices.
              </p>
            </div>
          </div>

          <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3 p-4 sm:p-6 pt-0 sm:pt-0">
            <Button
              variant="outline"
              onClick={clearSignature}
              className="w-full sm:w-auto"
            >
              Clear Signature
            </Button>
            <Button onClick={saveSignature} className="w-full sm:w-auto">
              <Save className="h-4 w-4 mr-2" />
              Save Signature
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Completion and confirmation dialogs */}
      {signingCompleted && (
        <SigningCompletedDialog
          documentId={document.id}
          documentTitle={document.title || "Document"}
          isLastSigner={isLastSigner}
        />
      )}

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
