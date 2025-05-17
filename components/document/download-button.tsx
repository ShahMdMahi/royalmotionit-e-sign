"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";
import { downloadDocument } from "@/actions/download-document";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { ButtonHTMLAttributes } from "react";

interface DownloadButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  documentId: string;
  fileName?: string;
  variant?:
    | "default"
    | "destructive"
    | "outline"
    | "secondary"
    | "ghost"
    | "link";
  size?: "default" | "sm" | "lg" | "icon";
}

export function DownloadButton({
  documentId,
  fileName,
  className,
  children,
  ...props
}: DownloadButtonProps) {
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = async () => {
    try {
      setIsDownloading(true);

      const result = await downloadDocument(documentId);

      if (!result.success) {
        toast.error(result.message || "Failed to download document");
        return;
      }

      // Download the file in the browser
      if (!result.data) {
        toast.error("No data received from the server");
        return;
      }

      const blob = new Blob([result.data], { type: result.contentType });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = url;
      link.download = fileName || result.filename || "document.pdf";
      document.body.appendChild(link);
      link.click();

      // Clean up
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success("Document downloaded successfully");
    } catch (error) {
      console.error("Error downloading document:", error);
      toast.error("Failed to download document");
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleDownload}
      disabled={isDownloading}
      className={cn("", className)}
      {...props}
    >
      {isDownloading ? (
        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
      ) : (
        <Download className="h-4 w-4 mr-2" />
      )}
      {children || "Download"}
    </Button>
  );
}
