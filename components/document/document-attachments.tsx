"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Attachment } from "@prisma/client";
import { toast } from "sonner";
import { FileIcon, Trash2, Download, Paperclip } from "lucide-react";
import {
  addDocumentAttachment,
  deleteDocumentAttachment,
  getAttachmentDownloadUrl,
} from "@/actions/attachment-actions";
import { UploadCloud, FileText } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";

interface DocumentAttachmentsProps {
  documentId: string;
  initialAttachments?: Attachment[];
  readOnly?: boolean;
}

export function DocumentAttachments({
  documentId,
  initialAttachments = [],
  readOnly = false,
}: DocumentAttachmentsProps) {
  const [attachments, setAttachments] =
    useState<Attachment[]>(initialAttachments);
  const [uploading, setUploading] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [attachmentName, setAttachmentName] = useState("");
  const [attachmentDescription, setAttachmentDescription] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setSelectedFile(e.target.files[0]);
      // Auto-fill name field with file name if empty
      if (!attachmentName) {
        setAttachmentName(e.target.files[0].name);
      }
    }
  };

  const simulateProgressBar = () => {
    setUploadProgress(0);
    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 95) {
          clearInterval(interval);
          return 95;
        }
        return prev + 5;
      });
    }, 100);
    return interval;
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error("Please select a file to upload");
      return;
    }

    try {
      setUploading(true);
      const progressInterval = simulateProgressBar();

      const result = await addDocumentAttachment(
        documentId,
        selectedFile,
        attachmentName || selectedFile.name,
        attachmentDescription,
      );

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (result.success) {
        // Simulate a small delay to show 100% progress
        setTimeout(() => {
          toast.success(result.message || "Attachment uploaded successfully");
          // Reset form
          setSelectedFile(null);
          setAttachmentName("");
          setAttachmentDescription("");
          setUploading(false);
          setUploadProgress(0);

          // Add the new attachment to the list (in a real app, you'd fetch from server)
          // Here we're creating a mock attachment for UI update
          const mockAttachment = {
            id: `temp-${Date.now()}`,
            documentId,
            name: attachmentName || selectedFile.name,
            description: attachmentDescription,
            key: "",
            url: "",
            size: selectedFile.size,
            mimeType: selectedFile.type,
            uploadedBy: "",
            createdAt: new Date(),
            updatedAt: new Date(),
          };
          setAttachments([mockAttachment, ...attachments]);
        }, 500);
      } else {
        toast.error(result.message || "Failed to upload attachment");
        setUploading(false);
        setUploadProgress(0);
      }
    } catch (error) {
      console.error("Error uploading attachment:", error);
      toast.error("An error occurred while uploading");
      setUploading(false);
      setUploadProgress(0);
    }
  };
  // Define specific types for the API response
  type UrlResponse = { url: string };
  type DataUrlResponse = { data: { url: string } };

  const handleDownload = async (attachmentId: string) => {
    try {
      const result = await getAttachmentDownloadUrl(attachmentId); // Handle different result formats
      if (typeof result === "string") {
        // Handle direct URL string
        window.open(result, "_blank");
      } else if (result && typeof result === "object") {
        // Type guard to handle objects with url property
        const hasUrlProperty = (obj: unknown): obj is UrlResponse =>
          obj !== null &&
          typeof obj === "object" &&
          "url" in obj &&
          typeof (obj as { url: unknown }).url === "string";

        // Type guard to handle objects with data.url property
        const hasDataUrlProperty = (obj: unknown): obj is DataUrlResponse =>
          obj !== null &&
          typeof obj === "object" &&
          "data" in obj &&
          (obj as { data: unknown }).data !== null &&
          typeof (obj as { data: unknown }).data === "object" &&
          "url" in (obj as { data: object }).data &&
          typeof (obj as { data: { url: string } }).data.url === "string";

        if (hasUrlProperty(result)) {
          // Direct URL property
          window.open(result.url, "_blank");
        } else if (
          "success" in result &&
          (result as { success: boolean }).success
        ) {
          // It's a success response, extract URL if possible
          if (hasUrlProperty(result)) {
            window.open(result.url, "_blank");
          } else if (hasDataUrlProperty(result)) {
            window.open(result.data.url, "_blank");
          } else {
            toast.error(
              "Could not find download URL in the successful response",
            );
          }
        } else {
          // It's an error response
          const message =
            "message" in result && typeof result.message === "string"
              ? result.message
              : "Failed to generate download URL";
          toast.error(message);
        }
      } else {
        toast.error("Invalid response format");
      }
    } catch (error) {
      console.error("Error downloading attachment:", error);
      toast.error("Error downloading attachment");
    }
  };

  const handleDelete = async (attachmentId: string) => {
    try {
      const result = await deleteDocumentAttachment(attachmentId);
      if (result.success) {
        toast.success(result.message || "Attachment deleted");
        setAttachments(attachments.filter((a) => a.id !== attachmentId));
      } else {
        toast.error(result.message || "Failed to delete attachment");
      }
    } catch (error) {
      console.error("Error deleting attachment:", error);
      toast.error("Error deleting attachment");
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + " B";
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB";
    else return (bytes / 1048576).toFixed(1) + " MB";
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Paperclip className="h-5 w-5" />
          Document Attachments
        </CardTitle>
        <CardDescription>Add supporting files to this document</CardDescription>
      </CardHeader>

      <CardContent>
        {!readOnly && (
          <div className="space-y-4 mb-6">
            <div className="grid w-full max-w-sm items-center gap-1.5">
              <Label htmlFor="attachment">File</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="attachment"
                  type="file"
                  onChange={handleFileSelect}
                  disabled={uploading}
                  className="w-full"
                />
              </div>
            </div>

            <div className="grid w-full max-w-sm items-center gap-1.5">
              <Label htmlFor="attachmentName">Name</Label>
              <Input
                id="attachmentName"
                placeholder="Attachment name"
                value={attachmentName}
                onChange={(e) => setAttachmentName(e.target.value)}
                disabled={uploading}
              />
            </div>

            <div className="grid w-full max-w-sm items-center gap-1.5">
              <Label htmlFor="attachmentDescription">
                Description (optional)
              </Label>
              <Textarea
                id="attachmentDescription"
                placeholder="Brief description of this file"
                value={attachmentDescription}
                onChange={(e) => setAttachmentDescription(e.target.value)}
                disabled={uploading}
              />
            </div>

            {uploading && (
              <div className="w-full">
                <Progress value={uploadProgress} className="h-2" />
                <p className="text-sm text-muted-foreground mt-1">
                  {uploadProgress < 100 ? "Uploading..." : "Processing..."}
                </p>
              </div>
            )}

            <Button
              onClick={handleUpload}
              disabled={!selectedFile || uploading}
              className="mt-2"
            >
              <UploadCloud className="mr-2 h-4 w-4" />
              Upload Attachment
            </Button>
          </div>
        )}

        <div className="border rounded-md">
          {attachments.length > 0 ? (
            <ScrollArea className="h-[300px]">
              <div className="p-4 space-y-4">
                {attachments.map((attachment) => (
                  <div
                    key={attachment.id}
                    className="flex justify-between items-center p-3 border rounded-md"
                  >
                    <div className="flex items-center">
                      <FileIcon className="h-8 w-8 mr-3 text-blue-500" />
                      <div>
                        <p className="font-medium">{attachment.name}</p>
                        <div className="flex items-center text-sm text-muted-foreground">
                          <span>{formatFileSize(attachment.size)}</span>
                          <span className="mx-2">•</span>
                          <span>
                            {new Date(
                              attachment.createdAt,
                            ).toLocaleDateString()}
                          </span>
                        </div>
                        {attachment.description && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {attachment.description}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDownload(attachment.id)}
                        title="Download"
                      >
                        <Download className="h-4 w-4" />
                      </Button>

                      {!readOnly && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(attachment.id)}
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          ) : (
            <div className="p-8 text-center">
              <FileText className="mx-auto h-12 w-12 text-muted-foreground opacity-50 mb-3" />
              <p className="text-muted-foreground">No attachments yet</p>
              {!readOnly && (
                <p className="text-sm text-muted-foreground mt-1">
                  Upload files to include with this document
                </p>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
