"use client";

import { useState } from "react";
import { Document, DocumentField, DocumentHistory } from "@/types/document";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { PDFViewer } from "@/components/common/pdf-viewer";
import { DownloadButton } from "@/components/document/download-button";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  ExternalLink,
  Mail,
  RefreshCw,
  Send,
  User,
} from "lucide-react";
import { cancelDocument, remindSigners } from "@/actions/document";

interface DocumentDetailsProps {
  document: Document;
  pdfData: Uint8Array;
  fields: DocumentField[];
  history: DocumentHistory[];
}

export function DocumentDetails({
  document,
  pdfData,
  fields,
  history,
}: DocumentDetailsProps) {
  const router = useRouter();
  const [isSendingReminder, setSendingReminder] = useState<boolean>(false);
  const [isCancelling, setIsCancelling] = useState<boolean>(false);

  // Helper to determine status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return "bg-green-500/10 text-green-600 border-green-600/20";
      case "PENDING":
        return "bg-yellow-500/10 text-yellow-600 border-yellow-600/20";
      case "DRAFT":
        return "bg-blue-500/10 text-blue-600 border-blue-600/20";
      case "EXPIRED":
      case "DECLINED":
      case "CANCELED":
        return "bg-red-500/10 text-red-600 border-red-600/20";
      default:
        return "bg-slate-500/10 text-slate-600 border-slate-600/20";
    }
  };

  // Helper to format date
  const formatDate = (date: Date | undefined) => {
    if (!date) return "N/A";
    return format(new Date(date), "MMM dd, yyyy h:mm a");
  };

  // Handle sending reminders
  const handleSendReminders = async () => {
    setSendingReminder(true);
    try {
      const result = await remindSigners(document.id);
      if (result.success) {
        toast.success("Reminders sent to pending signers");
      } else {
        toast.error(result.message || "Failed to send reminders");
      }
    } catch (error) {
      console.error("Error sending reminders:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setSendingReminder(false);
    }
  };

  // Handle cancelling document
  const handleCancelDocument = async () => {
    if (document.status === "COMPLETED") {
      toast.error("Cannot cancel a completed document");
      return;
    }

    setIsCancelling(true);
    try {
      const result = await cancelDocument(document.id);
      if (result.success) {
        toast.success("Document cancelled successfully");
        router.refresh();
      } else {
        toast.error(result.message || "Failed to cancel document");
      }
    } catch (error) {
      console.error("Error cancelling document:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setIsCancelling(false);
    }
  };

  // Determine if document should show warnings
  const showWarning =
    document.status === "EXPIRED" ||
    document.status === "DECLINED" ||
    document.status === "CANCELED";

  // Count signed vs total
  const signedCount = document.signers.filter(
    (s) => s.status === "COMPLETED",
  ).length;
  const totalSigners = document.signers.length;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">{document.title}</h1>
          <div className="text-muted-foreground text-sm mt-1">
            Created {formatDate(document.createdAt)}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge className={getStatusColor(document.status)}>
            {document.status}
          </Badge>

          {document.status === "COMPLETED" && (
            <DownloadButton documentId={document.id} />
          )}

          {document.status === "PENDING" && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleSendReminders}
              disabled={isSendingReminder}
            >
              {isSendingReminder ? (
                <>Sending...</>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Send Reminders
                </>
              )}
            </Button>
          )}

          {(document.status === "PENDING" || document.status === "DRAFT") && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleCancelDocument}
              disabled={isCancelling}
            >
              {isCancelling ? "Cancelling..." : "Cancel Document"}
            </Button>
          )}
        </div>
      </div>

      {showWarning && (
        <Alert
          variant={document.status === "EXPIRED" ? "destructive" : "default"}
        >
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {document.status === "EXPIRED" &&
              "This document has expired without being completed."}
            {document.status === "DECLINED" &&
              "This document was declined by a signer."}
            {document.status === "CANCELED" && "This document was cancelled."}
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Document</CardTitle>
            </CardHeader>{" "}
            <CardContent>
              <div className="h-[600px] w-full border rounded">
                <PDFViewer
                  pdfData={pdfData}
                  fields={fields}
                  highlightFields={true}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Signing Progress</CardTitle>
              <CardDescription>
                {signedCount} of {totalSigners} signers completed
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {document.signers.map((signer) => (
                  <div key={signer.id} className="flex items-start gap-3">
                    <div
                      className={`mt-1 h-6 w-6 rounded-full flex items-center justify-center text-white ${signer.status === "COMPLETED" ? "bg-green-500" : "bg-gray-300"}`}
                    >
                      {signer.status === "COMPLETED" ? (
                        <CheckCircle className="h-4 w-4" />
                      ) : (
                        <User className="h-4 w-4" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between">
                        <div>
                          <p className="font-medium">
                            {signer.name || signer.email}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {signer.email}
                          </p>
                        </div>
                        <Badge
                          variant={
                            signer.status === "COMPLETED"
                              ? "default"
                              : "outline"
                          }
                        >
                          {signer.status}
                        </Badge>
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {signer.status === "COMPLETED" &&
                          `Completed ${formatDate(signer.completedAt)}`}
                        {signer.status === "VIEWED" &&
                          `Viewed ${formatDate(signer.viewedAt)}`}
                        {signer.status === "PENDING" &&
                          signer.notifiedAt &&
                          `Notified ${formatDate(signer.notifiedAt)}`}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Activity Log</CardTitle>
            </CardHeader>
            <CardContent className="max-h-[300px] overflow-y-auto">
              <div className="space-y-4">
                {history.map((entry) => (
                  <div key={entry.id} className="flex items-start gap-3">
                    <div className="mt-1">
                      {entry.action === "CREATED" && (
                        <Mail className="h-4 w-4" />
                      )}
                      {entry.action === "SENT" && <Send className="h-4 w-4" />}
                      {entry.action === "VIEWED" && (
                        <ExternalLink className="h-4 w-4" />
                      )}
                      {entry.action === "SIGNED" && (
                        <CheckCircle className="h-4 w-4" />
                      )}
                      {entry.action === "COMPLETED" && (
                        <CheckCircle className="h-4 w-4" />
                      )}
                      {entry.action === "DECLINED" && (
                        <AlertTriangle className="h-4 w-4" />
                      )}
                      {entry.action === "EXPIRED" && (
                        <Clock className="h-4 w-4" />
                      )}
                    </div>
                    <div>
                      <div className="text-sm">
                        {entry.actorName || entry.actorEmail || "System"}{" "}
                        {entry.action.toLowerCase()} the document
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {formatDate(entry.timestamp)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
