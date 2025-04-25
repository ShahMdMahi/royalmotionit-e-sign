"use client";

import { useState, FormEvent, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Upload, AlertCircle, FileType } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { upload } from "@vercel/blob/client";
import { toast } from "sonner";

// Define the UploadProgressEvent interface based on Vercel Blob documentation
interface UploadProgressEvent {
  loaded: number;
  total: number;
  percentage: number;
}

interface DocumentUploadProps {
  isOpen: boolean;
  onCloseAction: () => Promise<void>;
  onUploadCompleteAction: (blobUrl: string, title: string, description: string, blobDetails: BlobDetails, documentSetId: string, documentId: string) => Promise<void>;
}

interface BlobDetails {
  pathname: string;
  contentType: string;
  contentDisposition: string;
  url: string;
  downloadUrl: string;
}

const MAX_RETRIES = 3;
const RETRY_DELAY = 1500; // 1.5 seconds

export function DocumentUpload({ isOpen, onCloseAction, onUploadCompleteAction }: DocumentUploadProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [documentSetName, setDocumentSetName] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<"docSet" | "upload">("docSet");
  const [documentSetId, setDocumentSetId] = useState<string | null>(null);
  const [documentId, setDocumentId] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [shouldRetry, setShouldRetry] = useState(false);
  const [isPDFValidated, setIsPDFValidated] = useState(false);

  // Cleanup function to be called when upload fails after document entry creation
  const cleanupDocumentEntry = useCallback(async () => {
    if (documentId) {
      try {
        // Show cleanup toast
        toast.info("Cleaning up incomplete document upload...");

        // Call an API endpoint to delete the document entry
        const response = await fetch(`/api/documents/${documentId}`, {
          method: "DELETE",
        });

        if (!response.ok) {
          console.error("Failed to clean up document entry:", await response.text());
          toast.error("Failed to clean up document entry. Please contact support.");
        } else {
          console.log("Successfully cleaned up document entry");
        }
      } catch (err) {
        console.error("Error cleaning up document entry:", err);
      }
    }
  }, [documentId]);

  // Handle retry logic
  useEffect(() => {
    if (shouldRetry && retryCount < MAX_RETRIES) {
      const timer = setTimeout(
        () => {
          console.log(`Retrying upload (attempt ${retryCount + 1} of ${MAX_RETRIES})...`);
          setError(`Upload failed. Retrying (${retryCount + 1}/${MAX_RETRIES})...`);
          setShouldRetry(false);
          // Use the stored documentId for retry attempts
          uploadFile(documentId || undefined);
        },
        RETRY_DELAY * (retryCount + 1)
      ); // Exponential backoff

      return () => clearTimeout(timer);
    } else if (shouldRetry && retryCount >= MAX_RETRIES) {
      setError(`Upload failed after ${MAX_RETRIES} attempts. Please try again later.`);
      setShouldRetry(false);
      setUploading(false);

      // Clean up the created document entry if upload ultimately fails
      cleanupDocumentEntry();
    }
  }, [shouldRetry, retryCount, cleanupDocumentEntry, documentId]);

  // Check if a file is actually a PDF by examining its header
  const validatePDFHeader = async (file: File): Promise<boolean> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const arr = new Uint8Array(e.target?.result as ArrayBuffer).subarray(0, 5);
        const header = String.fromCharCode.apply(null, Array.from(arr));
        resolve(header === "%PDF-");
      };
      reader.onerror = () => resolve(false);
      reader.readAsArrayBuffer(file.slice(0, 5));
    });
  };

  const validateFile = async (file: File): Promise<boolean> => {
    // Check file type
    if (file.type !== "application/pdf") {
      setError("Only PDF files are supported");
      return false;
    }

    // Check file size (10MB max)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      setError(`File is too large. Maximum size is 10MB. Current size: ${(file.size / (1024 * 1024)).toFixed(2)}MB`);
      return false;
    }

    // Check PDF header signature
    try {
      const isPdf = await validatePDFHeader(file);
      if (!isPdf) {
        setError("The selected file doesn't appear to be a valid PDF");
        return false;
      }
      setIsPDFValidated(true);
      return true;
    } catch (err) {
      console.error("Error validating PDF:", err);
      setError("Could not validate PDF file");
      return false;
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setIsPDFValidated(false);
    setError(null);

    // Show validating message
    toast.info("Validating file...");

    if (!(await validateFile(selectedFile))) {
      setFile(null);
      e.target.value = "";
      toast.error("File validation failed");
      return;
    }

    setFile(selectedFile);
    toast.success("File validated successfully");
  };

  const createDocumentSet = async () => {
    if (!documentSetName.trim()) {
      setError("Document set name is required");
      return;
    }

    setUploading(true);
    setError(null);

    try {
      // Add request timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

      const response = await fetch("/api/document-sets", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: documentSetName,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        if (response.status === 409) {
          throw new Error(`A document set with this name already exists`);
        }
        throw new Error(errorData.error || "Failed to create document set");
      }

      const data = await response.json();
      setDocumentSetId(data.documentSet.id);
      setStep("upload");
      toast.success("Document set created successfully");
    } catch (err: any) {
      console.error("Error creating document set:", err);

      if (err.name === "AbortError") {
        setError("Request timed out. Please try again.");
      } else {
        setError(`Failed to create document set: ${err instanceof Error ? err.message : "Unknown error"}`);
      }

      toast.error("Failed to create document set");
    } finally {
      setUploading(false);
    }
  };

  const uploadFile = async (docId?: string) => {
    const currentDocId = docId || documentId;

    if (!file || !documentSetId || !currentDocId) {
      console.error("Missing required data for upload", {
        file: !!file,
        documentSetId,
        documentId: currentDocId,
      });
      setError("Missing required data for upload");
      setUploading(false);
      return;
    }

    try {
      // Now use the document ID in the filename
      const customFilename = `${documentSetId}/${currentDocId}`;

      // Update the upload function with progress tracking
      const newBlob = await upload(`${customFilename}.pdf`, file, {
        access: "public",
        handleUploadUrl: "/api/upload",
        onUploadProgress: (progressEvent: UploadProgressEvent) => {
          setUploadProgress(progressEvent.percentage / 100);
          console.log(`Loaded ${progressEvent.loaded} bytes`);
          console.log(`Total ${progressEvent.total} bytes`);
          console.log(`Percentage ${progressEvent.percentage}%`);
        },
      });

      // Debug what's being returned from Vercel Blob
      console.log("Blob response:", newBlob);

      // Call the callback with all the blob properties returned by Vercel
      await onUploadCompleteAction(
        newBlob.url,
        title,
        description,
        {
          pathname: newBlob.pathname,
          contentType: newBlob.contentType,
          contentDisposition: newBlob.contentDisposition,
          url: newBlob.url,
          downloadUrl: newBlob.downloadUrl,
        },
        documentSetId,
        currentDocId
      );

      // Reset states
      setUploading(false);
      setFile(null);
      setTitle("");
      setDescription("");
      setDocumentSetName("");
      setDocumentId(null);
      setUploadProgress(0);
      setStep("docSet");
      setRetryCount(0);
      setIsPDFValidated(false);

      toast.success("Document uploaded successfully");
    } catch (err) {
      console.error("Upload failed:", err);

      // Increment retry counter and trigger retry logic
      setRetryCount((prev) => prev + 1);
      setShouldRetry(true);

      toast.error(`Upload attempt ${retryCount + 1}/${MAX_RETRIES} failed, retrying...`);
    }
  };

  const createDocumentEntry = async () => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

      // First create the document entry to get an ID
      const createDocResponse = await fetch("/api/documents/create-entry", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          description,
          documentSetId,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!createDocResponse.ok) {
        const errorData = await createDocResponse.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to create document entry");
      }

      const docData = await createDocResponse.json();
      return docData.document.id;
    } catch (err: any) {
      console.error("Error creating document entry:", err);
      if (err.name === "AbortError") {
        throw new Error("Request timed out while creating document entry");
      }
      throw err;
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (step === "docSet") {
      await createDocumentSet();
      return;
    }

    if (!file) {
      setError("Please select a file to upload");
      return;
    }

    if (!isPDFValidated) {
      setError("Please wait for file validation to complete");
      return;
    }

    if (!title.trim()) {
      setError("Document title is required");
      return;
    }

    if (!documentSetId) {
      setError("Document set ID is missing");
      return;
    }

    try {
      setUploading(true);
      setUploadProgress(0);
      setError(null);
      setRetryCount(0);

      toast.info("Creating document entry...");

      // First create the document entry
      const newDocumentId = await createDocumentEntry();
      setDocumentId(newDocumentId);

      toast.info("Document entry created, uploading file...");

      // Then upload the file with the new document ID
      await uploadFile(newDocumentId);
    } catch (err: any) {
      console.error("Process failed:", err);
      setError(`Upload process failed: ${err instanceof Error ? err.message : "Unknown error"}`);
      setUploading(false);
      toast.error("Upload process failed");
    }
  };

  const handleClose = async () => {
    if (uploading) {
      toast.warning("Please wait until the current operation completes");
      return Promise.resolve();
    }

    setStep("docSet");
    setDocumentSetName("");
    setTitle("");
    setDescription("");
    setFile(null);
    setDocumentSetId(null);
    setDocumentId(null);
    setError(null);
    setRetryCount(0);
    setShouldRetry(false);
    setIsPDFValidated(false);
    await onCloseAction();
  };

  return (
    <Dialog open={isOpen} modal={true}>
      <DialogContent className="sm:max-w-md" hideCloseButton>
        <DialogHeader>
          <DialogTitle>{step === "docSet" ? "Create Document Set" : "Upload Document"}</DialogTitle>
          <DialogDescription>{step === "docSet" ? "Create a document set before uploading documents." : "Upload a new document to the system. Supported formats: PDF."}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          {step === "docSet" ? (
            <div className="grid gap-2">
              <label htmlFor="document-set-name" className="text-sm font-medium">
                Document Set Name
              </label>
              <Input id="document-set-name" placeholder="Enter document set name" value={documentSetName} onChange={(e) => setDocumentSetName(e.target.value)} required disabled={uploading} />
            </div>
          ) : (
            <>
              <div className="grid gap-2">
                <label htmlFor="document-title" className="text-sm font-medium">
                  Document Title
                </label>
                <Input id="document-title" placeholder="Enter document title" value={title} onChange={(e) => setTitle(e.target.value)} required disabled={uploading} />
              </div>
              <div className="grid gap-2">
                <label htmlFor="document-description" className="text-sm font-medium">
                  Description (optional)
                </label>
                <Input id="document-description" placeholder="Enter document description" value={description} onChange={(e) => setDescription(e.target.value)} disabled={uploading} />
              </div>
              <div className="grid gap-2">
                <label htmlFor="document-file" className="text-sm font-medium">
                  Document File
                </label>
                <div className="relative">
                  <Input id="document-file" type="file" accept=".pdf" onChange={handleFileChange} disabled={uploading} />
                  {isPDFValidated && (
                    <div className="absolute right-2 top-1/2 transform -translate-y-1/2 text-green-500 flex items-center">
                      <FileType className="h-4 w-4 mr-1" />
                      <span className="text-xs">Valid PDF</span>
                    </div>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">Only PDF files are supported (max 10MB).</p>
              </div>
            </>
          )}

          {error && (
            <div className="flex items-center gap-2 text-xs text-red-500">
              <AlertCircle className="h-4 w-4" />
              <p>{error}</p>
            </div>
          )}

          {uploading && (
            <div className="grid gap-2">
              <p className="text-sm font-medium">{step === "docSet" ? "Creating document set..." : "Uploading..."}</p>
              {step === "upload" && (
                <>
                  <Progress value={uploadProgress * 100} className="w-full" />
                  <p className="text-xs text-muted-foreground">{Math.round(uploadProgress * 100)}% complete</p>
                </>
              )}
            </div>
          )}

          <DialogFooter className="sm:justify-between flex flex-row gap-2">
            <div className="flex-1">
              <Button type="button" variant="outline" className="w-full" onClick={handleClose} disabled={uploading}>
                Cancel
              </Button>
            </div>
            <div className="flex-1">
              <Button type="submit" className="w-full" disabled={uploading || (step === "upload" && (!file || !isPDFValidated))}>
                <Upload className="mr-2 h-4 w-4" />
                {uploading ? (step === "docSet" ? "Creating..." : "Uploading...") : step === "docSet" ? "Create Set" : "Upload File"}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
