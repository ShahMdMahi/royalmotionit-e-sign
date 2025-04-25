"use client";

import { useState, FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Upload } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { upload } from "@vercel/blob/client";

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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.type !== "application/pdf") {
        setError("Only PDF files are supported");
        setFile(null);
        e.target.value = "";
        return;
      }
      setFile(selectedFile);
      setError(null);
    }
  };

  const createDocumentSet = async () => {
    if (!documentSetName.trim()) {
      setError("Document set name is required");
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const response = await fetch("/api/document-sets", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: documentSetName,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create document set");
      }

      const data = await response.json();
      setDocumentSetId(data.documentSet.id);
      setStep("upload");
    } catch (err) {
      console.error("Error creating document set:", err);
      setError("Failed to create document set. Please try again.");
    } finally {
      setUploading(false);
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
      });

      if (!createDocResponse.ok) {
        throw new Error("Failed to create document entry");
      }

      const docData = await createDocResponse.json();
      const documentId = docData.document.id;

      // Now use the document ID in the filename
      const customFilename = `${documentSetId}/${documentId}`;

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
      if (!documentSetId) {
        console.error("Document set ID is missing before callback");
        setError("Document set ID is missing. Please try again.");
        setUploading(false);
        return;
      }

      // Log the document set ID to ensure it's valid
      console.log("Using documentSetId:", documentSetId);
      console.log("Using documentId:", documentId);

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
        documentId // Pass documentId to the callback
      );

      // Reset states
      setUploading(false);
      setFile(null);
      setTitle("");
      setDescription("");
      setDocumentSetName("");
      setUploadProgress(0);
      setStep("docSet");
    } catch (err) {
      console.error("Upload failed:", err);
      setError("Upload failed. Please try again.");
      setUploading(false);
    }
  };

  const handleClose = async () => {
    if (!uploading) {
      setStep("docSet");
      setDocumentSetName("");
      setTitle("");
      setDescription("");
      setFile(null);
      setDocumentSetId(null);
      await onCloseAction();
    }
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
                <Input id="document-file" type="file" accept=".pdf" onChange={handleFileChange} disabled={uploading} />
                <p className="text-xs text-muted-foreground">Only PDF files are supported.</p>
              </div>
            </>
          )}

          {error && <p className="text-xs text-red-500">{error}</p>}

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
              <Button type="submit" className="w-full" disabled={uploading || (step === "upload" && !file)}>
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
