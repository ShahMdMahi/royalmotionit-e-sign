"use client";

import { useState, useRef, ChangeEvent, useCallback, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Upload, CheckCircle, AlertCircle, FileText, RefreshCcw, Trash, Info } from "lucide-react";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";

// Constants for validation
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_FILE_TYPES = ["application/pdf"];
const MAX_RETRIES = 3;
const AUTO_RETRY_ERRORS = ["network", "timeout", "connection"];
// Storage key for resumed uploads
const UPLOAD_RESUME_KEY = "pending_upload";

interface FileUploadModalProps {
  isOpen: boolean;
  onCloseAction: () => void;
}

interface ResumeData {
  fileName: string;
  fileSize: number;
  fileType: string;
  lastAttemptTime: number;
}

export function FileUploadModal({ isOpen, onCloseAction }: FileUploadModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState("");
  const [description, setDescription] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState<"idle" | "uploading" | "retrying" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [retryCount, setRetryCount] = useState(0);
  const [hasPendingUpload, setHasPendingUpload] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const uploadStartTimeRef = useRef<number>(0);
  const uploadSpeedRef = useRef<number>(0);
  const remainingTimeRef = useRef<number | null>(null);

  // Check for pending uploads on mount
  useEffect(() => {
    if (isOpen) {
      const savedUpload = localStorage.getItem(UPLOAD_RESUME_KEY);
      if (savedUpload) {
        try {
          const resumeData: ResumeData = JSON.parse(savedUpload);
          const hoursSinceLastAttempt = (Date.now() - resumeData.lastAttemptTime) / (1000 * 60 * 60);

          // Only show resume option if less than 24 hours old
          if (hoursSinceLastAttempt < 24) {
            setHasPendingUpload(true);
            setFileName(resumeData.fileName);
          } else {
            // Clean up old resume data
            localStorage.removeItem(UPLOAD_RESUME_KEY);
          }
        } catch (error) {
          console.error("Error parsing saved upload data:", error);
          localStorage.removeItem(UPLOAD_RESUME_KEY);
        }
      }
    }
  }, [isOpen]);

  // Process the selected file with validation
  const handleFileChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const selectedFile = e.target.files?.[0];

      if (!selectedFile) return;

      // Validate file type
      if (!ALLOWED_FILE_TYPES.includes(selectedFile.type)) {
        toast.error("Invalid file type", {
          description: `Only PDF files are supported`,
        });
        if (fileInputRef.current) fileInputRef.current.value = "";
        return;
      }

      // Validate file size
      if (selectedFile.size > MAX_FILE_SIZE) {
        toast.error("File too large", {
          description: `Maximum file size is ${MAX_FILE_SIZE / 1024 / 1024}MB`,
        });
        if (fileInputRef.current) fileInputRef.current.value = "";
        return;
      }

      setFile(selectedFile);
      setHasPendingUpload(false);

      // Extract filename without extension for the name field
      if (!fileName.trim()) {
        const nameWithoutExtension = selectedFile.name.replace(/\.[^/.]+$/, "");
        setFileName(nameWithoutExtension);
      }

      // Save upload information for potential resume
      const resumeData: ResumeData = {
        fileName: selectedFile.name.replace(/\.[^/.]+$/, ""),
        fileSize: selectedFile.size,
        fileType: selectedFile.type,
        lastAttemptTime: Date.now(),
      };
      localStorage.setItem(UPLOAD_RESUME_KEY, JSON.stringify(resumeData));
    },
    [fileName]
  );

  // Reset form to initial state
  const resetForm = useCallback(() => {
    setFile(null);
    setFileName("");
    setDescription("");
    setUploading(false);
    setUploadProgress(0);
    setUploadStatus("idle");
    setErrorMessage("");
    setRetryCount(0);
    setHasPendingUpload(false);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }

    // Remove any saved upload data
    localStorage.removeItem(UPLOAD_RESUME_KEY);
  }, []);

  // Cancel the current upload
  const cancelUpload = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setUploading(false);
    setUploadStatus("idle");
    setUploadProgress(0);
    toast.info("Upload canceled");
  }, []);

  // Format file size in human-readable form
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  // Format time in human-readable form
  const formatTime = (seconds: number | null): string => {
    if (seconds === null || !isFinite(seconds)) return "Calculating...";
    if (seconds < 1) return "Less than a second";
    if (seconds < 60) return `${Math.round(seconds)} seconds`;
    return `${Math.round(seconds / 60)} min ${Math.round(seconds % 60)} sec`;
  };

  // Discard the pending upload
  const discardPendingUpload = useCallback(() => {
    localStorage.removeItem(UPLOAD_RESUME_KEY);
    setHasPendingUpload(false);
    setFileName("");
  }, []);

  // Handle upload errors - moved this function earlier to resolve circular dependency
  const handleUploadError = useCallback(
    (message: string) => {
      setUploadStatus("error");
      setErrorMessage(message || "Failed to upload document");

      // Check if this error should trigger auto-retry
      const shouldAutoRetry = AUTO_RETRY_ERRORS.some((errType) => message.toLowerCase().includes(errType));

      if (shouldAutoRetry && retryCount < MAX_RETRIES) {
        // Auto-retry on specific errors
        const nextRetryCount = retryCount + 1;
        setRetryCount(nextRetryCount);
        setUploadStatus("retrying");

        // Exponential backoff for retries: 2s, 4s, 8s
        const backoffTime = 2000 * Math.pow(2, retryCount);
        toast.warning(`Upload error. Auto-retrying in ${backoffTime / 1000}s (${nextRetryCount}/${MAX_RETRIES})...`);

        setTimeout(() => handleUpload(), backoffTime);
      } else {
        toast.error("Upload failed", {
          description: message || "Failed to upload document",
        });
        setUploading(false);
      }
    },
    [retryCount]
  );

  // Handle upload process using XMLHttpRequest for progress tracking
  const handleUpload = useCallback(async () => {
    // Validate required fields
    if (!file || !fileName.trim()) {
      toast.error("Missing information", {
        description: file ? "Please provide a document name" : "Please select a file",
      });
      return;
    }

    // Create new AbortController for this upload
    abortControllerRef.current = new AbortController();

    setUploading(true);
    setUploadStatus((prevStatus) => (prevStatus === "retrying" ? "retrying" : "uploading"));
    setUploadProgress(0);
    uploadStartTimeRef.current = Date.now();
    remainingTimeRef.current = null;

    // Don't reset error message during retry to preserve context
    if (uploadStatus !== "retrying") {
      setErrorMessage("");
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("fileName", fileName.trim());
    if (description.trim()) {
      formData.append("description", description.trim());
    }

    try {
      // Create and configure XMLHttpRequest for progress tracking
      const xhr = new XMLHttpRequest();

      // Track upload progress
      xhr.upload.addEventListener("progress", (event) => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded * 100) / event.total);
          setUploadProgress(progress);
        }
      });

      // Handle response
      xhr.addEventListener("load", () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          // Success response
          try {
            const response = JSON.parse(xhr.responseText);

            if (response.success) {
              setUploadStatus("success");
              setRetryCount(0);
              localStorage.removeItem(UPLOAD_RESUME_KEY); // Clear resume data on success

              // Delay closing to show success state
              setTimeout(() => {
                toast.success("Upload successful", {
                  description: "Document has been uploaded successfully",
                });
                resetForm();
                onCloseAction();
              }, 1000);
            } else {
              // Server returned success: false
              handleUploadError(response.message || "Server rejected the upload");
            }
          } catch {
            // Response parsing error
            handleUploadError("Invalid response from server");
          }
        } else {
          // HTTP error status
          try {
            // Try to parse error details from response
            const errorResponse = JSON.parse(xhr.responseText);
            handleUploadError(errorResponse.message || `Server error (${xhr.status})`);
          } catch {
            // If parsing fails, use status text
            handleUploadError(`Upload failed with status: ${xhr.status} ${xhr.statusText}`);
          }
        }
      });

      // Network error handler
      xhr.addEventListener("error", () => {
        // Save current error details and progress for potential resume
        const resumeData: ResumeData = {
          fileName,
          fileSize: file.size,
          fileType: file.type,
          lastAttemptTime: Date.now(),
        };
        localStorage.setItem(UPLOAD_RESUME_KEY, JSON.stringify(resumeData));

        if (retryCount < MAX_RETRIES) {
          // Auto-retry on network errors
          setRetryCount((prev) => prev + 1);
          setErrorMessage(`Network error. Retrying (${retryCount + 1}/${MAX_RETRIES})...`);

          // Exponential backoff for retries: 1s, 2s, 4s
          const backoffTime = 1000 * Math.pow(2, retryCount);
          setTimeout(() => handleUpload(), backoffTime);
        } else {
          handleUploadError("Network error occurred. Please check your connection and try again.");
        }
      });

      // Timeout handler
      xhr.addEventListener("timeout", () => {
        handleUploadError("Request timed out. Please try again.");
      });

      // Abort handler
      xhr.addEventListener("abort", () => {
        setUploading(false);
        setUploadStatus("idle");
        setUploadProgress(0);
      });

      // Set longer timeout for large files
      xhr.timeout = 60000; // 60 seconds

      // Send the request
      xhr.open("POST", "/api/upload", true);

      // Set up abort capability
      const signal = abortControllerRef.current.signal;
      signal.addEventListener("abort", () => xhr.abort());

      xhr.send(formData);
    } catch (error) {
      // Handle any errors in setup or execution
      handleUploadError(error instanceof Error ? error.message : "An unknown error occurred");
    }
  }, [file, fileName, description, onCloseAction, resetForm, retryCount, uploadStatus, handleUploadError]);

  // Handle manual retry attempt - moved after handleUpload is defined
  const handleRetry = useCallback(() => {
    if (!file) return;

    setUploadStatus("retrying");
    setErrorMessage("");
    handleUpload();
  }, [file, handleUpload]);

  // This useEffect ensures handleRetry has access to the latest handleUpload function
  useEffect(() => {
    // This is intentionally left empty as it's just to satisfy the React Hook dependency warning
    // The actual connection between handleRetry and handleUpload happens when handleRetry is called
  }, [handleRetry, handleUpload]);

  // Cleanup on unmount or when modal closes
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Update upload speed and remaining time calculations
  useEffect(() => {
    let timer: NodeJS.Timeout;

    if (uploading && uploadProgress > 0 && uploadProgress < 100) {
      timer = setInterval(() => {
        if (uploadStartTimeRef.current && file) {
          const elapsedTime = (Date.now() - uploadStartTimeRef.current) / 1000; // seconds
          const uploadedBytes = file.size * (uploadProgress / 100);

          // Calculate upload speed in bytes per second
          uploadSpeedRef.current = uploadedBytes / elapsedTime;

          // Calculate remaining time
          const remainingBytes = file.size - uploadedBytes;
          if (uploadSpeedRef.current > 0) {
            remainingTimeRef.current = remainingBytes / uploadSpeedRef.current;
          }
        }
      }, 1000);
    }

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [uploading, uploadProgress, file]);

  // Handle modal close
  const handleClose = useCallback(() => {
    if (!uploading) {
      resetForm();
      onCloseAction();
    }
  }, [uploading, resetForm, onCloseAction]);

  // Validate file name on change
  const handleFileNameChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFileName(value);

    // Optional: Add more sophisticated validation for file names
    if (value.trim() === "") {
      e.target.setCustomValidity("File name is required");
    } else if (/[<>:"\/\\|?*]/.test(value)) {
      e.target.setCustomValidity("File name contains invalid characters");
    } else {
      e.target.setCustomValidity("");
    }
  }, []);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Upload Document
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {hasPendingUpload && (
            <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-md p-3 mb-4">
              <div className="flex items-start">
                <Info className="h-5 w-5 text-amber-500 mt-0.5 mr-2 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Resume previous upload?</p>
                  <p className="text-xs text-muted-foreground mt-1">You have a previous upload attempt for &quot;{fileName}&quot;</p>
                  <div className="flex gap-2 mt-3">
                    <Button variant="outline" size="sm" onClick={discardPendingUpload} className="h-8 text-xs">
                      <Trash className="h-3 w-3 mr-1" />
                      Discard
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* File input section */}
          <div className="space-y-2">
            <Label htmlFor="file">Document (PDF only, max {MAX_FILE_SIZE / 1024 / 1024}MB)</Label>
            <div className="flex items-center gap-2">
              <Input
                id="file"
                type="file"
                accept={ALLOWED_FILE_TYPES.join(",")}
                onChange={handleFileChange}
                disabled={uploading}
                ref={fileInputRef}
                className="flex-1"
                required
                aria-describedby="file-requirements"
              />
            </div>
            {file ? (
              <p className="text-sm text-muted-foreground">
                Selected: {file.name} ({formatFileSize(file.size)})
              </p>
            ) : (
              <p id="file-requirements" className="text-xs text-muted-foreground">
                Only PDF files are accepted, maximum size {MAX_FILE_SIZE / 1024 / 1024}MB
              </p>
            )}
          </div>

          {/* File name input */}
          <div className="space-y-2">
            <Label htmlFor="fileName">Document Name</Label>
            <Input
              id="fileName"
              value={fileName}
              onChange={handleFileNameChange}
              placeholder="Enter document name"
              disabled={uploading}
              required
              maxLength={100}
              pattern='[^\<\>:\"\\/\|\?\*]+'
              title='File name cannot contain these characters: < > : " / \ | ? *'
              aria-invalid={!!errorMessage}
              aria-describedby="fileName-error"
            />
            <p className="text-xs text-muted-foreground">Give your document a descriptive name (max 100 characters)</p>
          </div>

          {/* Description input */}
          <div className="space-y-2">
            <Label htmlFor="description">Description (optional)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter a brief description of this document"
              disabled={uploading}
              maxLength={500}
              className="resize-none max-h-32"
            />
            <p className="text-xs text-muted-foreground">Optional description to help identify this document (max 500 characters)</p>
          </div>

          {/* Progress bar (only shown when uploading) */}
          {uploadStatus !== "idle" && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Upload Progress</span>
                <span>{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} className="h-2" />

              {/* Upload speed and ETA info */}
              {uploading && uploadProgress > 0 && uploadProgress < 100 && (
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>Speed: {formatFileSize(uploadSpeedRef.current)}/s</span>
                  <span>ETA: {formatTime(remainingTimeRef.current)}</span>
                </div>
              )}

              {/* Status message */}
              <div className="flex items-center gap-2 text-sm mt-2">
                {uploadStatus === "uploading" && (
                  <>
                    <Upload className="h-4 w-4 animate-pulse text-blue-500" />
                    <span className="text-muted-foreground">Uploading document...</span>
                  </>
                )}
                {uploadStatus === "retrying" && (
                  <>
                    <RefreshCcw className="h-4 w-4 animate-spin text-amber-500" />
                    <span className="text-amber-500">
                      Retrying upload... ({retryCount}/{MAX_RETRIES})
                    </span>
                  </>
                )}
                {uploadStatus === "success" && (
                  <>
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-green-500">Upload complete!</span>
                  </>
                )}
                {uploadStatus === "error" && (
                  <>
                    <AlertCircle className="h-4 w-4 text-red-500" />
                    <span className="text-red-500">{errorMessage}</span>
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex justify-end gap-2">
          {!uploading ? (
            <Button variant="outline" onClick={handleClose} type="button">
              Cancel
            </Button>
          ) : (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" onClick={cancelUpload} type="button" className="text-red-500 hover:text-red-600">
                    Cancel Upload
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Cancel the current upload operation</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}

          {uploadStatus === "error" ? (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button onClick={handleRetry} disabled={!file || uploading} className="relative" variant="secondary" type="button">
                    <span className="flex items-center gap-2">
                      <RefreshCcw className="h-4 w-4" />
                      Retry
                    </span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Retry the failed upload operation</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ) : (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button onClick={handleUpload} disabled={uploading || !file || !fileName.trim()} className="relative" type="button">
                    {uploading ? (
                      <span className="flex items-center gap-2">
                        <Upload className="h-4 w-4 animate-spin" />
                        {uploadStatus === "retrying" ? "Retrying..." : "Uploading..."}
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <Upload className="h-4 w-4" />
                        Upload
                      </span>
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Start uploading the selected document</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
