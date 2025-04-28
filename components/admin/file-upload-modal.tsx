"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Upload, X, File, AlertCircle } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface FileUploadModalProps {
  isOpen: boolean;
  onCloseAction: () => void;
  onUploadSuccess?: (documentId: string) => void;
}

export function FileUploadModal({ isOpen, onCloseAction, onUploadSuccess }: FileUploadModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState("");
  const [description, setDescription] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    setError(null);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.type === "application/pdf") {
        if (droppedFile.size <= 10 * 1024 * 1024) {
          setFile(droppedFile);
          // Extract filename without extension as title suggestion
          const name = droppedFile.name.replace(/\.[^/.]+$/, "");
          setFileName(name);
        } else {
          setError("File size exceeds 10MB limit");
        }
      } else {
        setError("Only PDF files are allowed");
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (selectedFile.type === "application/pdf") {
        if (selectedFile.size <= 10 * 1024 * 1024) {
          setFile(selectedFile);
          // Extract filename without extension as title suggestion
          const name = selectedFile.name.replace(/\.[^/.]+$/, "");
          setFileName(name);
        } else {
          setError("File size exceeds 10MB limit");
        }
      } else {
        setError("Only PDF files are allowed");
      }
    }
  };

  const removeFile = () => {
    setFile(null);
    setFileName("");
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !fileName.trim()) return;

    setError(null);
    setUploading(true);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("fileName", fileName.trim());

      if (description.trim()) {
        formData.append("description", description.trim());
      }

      // Use XMLHttpRequest to track upload progress
      const xhr = new XMLHttpRequest();

      xhr.open("POST", "/api/upload", true);

      xhr.upload.addEventListener("progress", (event) => {
        if (event.lengthComputable) {
          const percentComplete = Math.round((event.loaded / event.total) * 100);
          setUploadProgress(percentComplete);
        }
      });

      xhr.onload = function () {
        setUploading(false);

        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const response = JSON.parse(xhr.responseText);
            if (response.success) {
              resetForm();
              onCloseAction();
              if (onUploadSuccess && response.documentId) {
                onUploadSuccess(response.documentId);
              }
            } else {
              setError(response.message || "Upload failed");
            }
          } catch {
            setError("Failed to process server response");
          }
        } else {
          try {
            const response = JSON.parse(xhr.responseText);
            setError(response.message || `Upload failed with status ${xhr.status}`);
          } catch {
            setError(`Upload failed with status ${xhr.status}`);
          }
        }
      };

      xhr.onerror = function () {
        setUploading(false);
        setError("Network error occurred during upload");
      };

      xhr.onabort = function () {
        setUploading(false);
        setError("Upload was aborted");
      };

      xhr.send(formData);
    } catch (error) {
      console.error("Error in upload process:", error);
      setUploading(false);
      setError(error instanceof Error ? error.message : "An unknown error occurred");
    }
  };

  const resetForm = () => {
    setFile(null);
    setFileName("");
    setDescription("");
    setUploadProgress(0);
    setError(null);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onCloseAction()}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Upload Document</DialogTitle>
            <DialogDescription>Upload a document for signature. Supported format: PDF (max 10MB).</DialogDescription>
          </DialogHeader>

          {error && (
            <Alert variant="destructive" className="mt-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {!file ? (
            <div
              className={`border-2 border-dashed rounded-lg p-10 transition-colors ${
                isDragging ? "border-primary bg-primary/5" : "border-muted-foreground/20"
              } flex flex-col items-center justify-center gap-4 my-4 cursor-pointer`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => document.getElementById("file-upload")?.click()}
            >
              <Upload className="h-10 w-10 text-muted-foreground" />
              <p className="text-sm text-muted-foreground text-center">
                <span className="font-medium">Click to upload</span> or drag and drop
                <br />
                PDF (max. 10MB)
              </p>
              <Input id="file-upload" type="file" accept="application/pdf" onChange={handleFileChange} className="hidden" />
            </div>
          ) : (
            <div className="border rounded-lg p-4 my-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-md">
                  <File className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{file.name}</p>
                  <p className="text-xs text-muted-foreground">{(file.size / 1024 / 1024).toFixed(2)} MB • PDF</p>
                </div>
                <Button type="button" variant="ghost" size="icon" onClick={removeFile} className="h-8 w-8 rounded-full">
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {uploading && (
            <div className="my-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">Uploading...</span>
                <span className="text-sm text-muted-foreground">{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} className="h-2" />
            </div>
          )}

          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label htmlFor="fileName">Document Title</Label>
              <Input id="fileName" placeholder="Enter document title" value={fileName} onChange={(e) => setFileName(e.target.value)} disabled={uploading} required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                placeholder="Add a description for this document"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={uploading}
                className="resize-none"
                rows={3}
              />
            </div>
          </div>

          <DialogFooter className="mt-4">
            <Button type="button" variant="outline" onClick={onCloseAction} disabled={uploading}>
              Cancel
            </Button>
            <Button type="submit" disabled={!file || !fileName.trim() || uploading} className="relative">
              {uploading ? `Uploading ${uploadProgress}%` : "Upload Document"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
