"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { AlertCircle, CheckCircle, FileText, RefreshCw } from "lucide-react";
import { listAttachmentsWithStatus } from "@/actions/attachment-verification";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

interface AttachmentPreviewProps {
  documentId: string;
}

type AttachmentWithStatus = {
  id: string;
  name: string;
  size: number;
  mimeType: string;
  canEmbed: boolean;
  status: string;
};

export function AttachmentPreviewComponent({
  documentId,
}: AttachmentPreviewProps) {
  const [loading, setLoading] = useState(true);
  const [attachments, setAttachments] = useState<AttachmentWithStatus[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  // Format file size helper
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + " B";
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB";
    else return (bytes / 1048576).toFixed(1) + " MB";
  };

  // Status badge renderer
  const renderStatusBadge = (status: string) => {
    switch (status) {
      case "ready":
        return (
          <Badge variant="success" className="ml-2">
            Ready
          </Badge>
        );
      case "missing":
        return (
          <Badge variant="destructive" className="ml-2">
            Missing
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="ml-2">
            Unknown
          </Badge>
        );
    }
  };

  // Load attachments on component mount
  useEffect(() => {
    const loadAttachments = async () => {
      setLoading(true);
      try {
        const result = await listAttachmentsWithStatus(documentId);
        if (result && result.success && Array.isArray(result.attachments)) {
          setAttachments(result.attachments);
        } else {
          setAttachments([]);
          toast.error(
            (result && result.message) || "Failed to load attachments",
          );
        }
      } catch (error) {
        console.error("Error loading attachments:", error);
        toast.error("Error loading attachments");
      } finally {
        setLoading(false);
      }
    };

    loadAttachments();
  }, [documentId]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const result = await listAttachmentsWithStatus(documentId);
      if (result && result.success && Array.isArray(result.attachments)) {
        setAttachments(result.attachments);
        toast.success("Attachment status refreshed");
      } else {
        setAttachments([]);
        toast.error(
          (result && result.message) || "Failed to refresh attachment status",
        );
      }
    } catch (error) {
      console.error("Error refreshing attachments:", error);
      toast.error("Error refreshing attachments");
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle className="text-lg">Document Attachments</CardTitle>
          <CardDescription>
            {loading
              ? "Loading attachments..."
              : attachments.length
                ? `${attachments.length} attachment${attachments.length > 1 ? "s" : ""} to be embedded`
                : "No attachments found"}
          </CardDescription>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={loading || refreshing}
        >
          <RefreshCw
            className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`}
          />
          Refresh
        </Button>
      </CardHeader>

      <CardContent>
        {loading ? (
          <div className="space-y-2">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : attachments.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 text-center border rounded-md border-dashed">
            <FileText className="h-10 w-10 text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">
              No attachments found for this document
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {attachments.map((attachment) => (
              <div
                key={attachment.id}
                className={`p-3 border rounded-md flex items-center justify-between ${
                  attachment.canEmbed ? "bg-emerald-50/50" : "bg-red-50/50"
                }`}
              >
                <div className="flex items-center space-x-3">
                  {attachment.canEmbed ? (
                    <CheckCircle className="h-5 w-5 text-emerald-500" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-red-500" />
                  )}
                  <div>
                    <p className="text-sm font-medium">{attachment.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(attachment.size)} • {attachment.mimeType}
                    </p>
                  </div>
                </div>
                {renderStatusBadge(attachment.status)}
              </div>
            ))}

            <div className="mt-4 p-3 border rounded-md bg-blue-50/50">
              <p className="text-sm">
                <strong>Note:</strong> All attachments will be embedded in the
                final PDF when the document is signed.
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
