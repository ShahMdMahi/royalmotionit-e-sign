"use client";

import { Button } from "@/components/ui/button";
import { Save, ArrowLeft, RotateCcw, Settings, Eye } from "lucide-react";
import { Document } from "@/types/document";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { sendDocumentForSigning } from "@/actions/document";
import { handleDocumentSave } from "@/actions/document-toolbar-actions";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface DocumentToolbarProps {
  document: Document;
  onSaveAction?: typeof handleDocumentSave;
  isSaving: boolean;
  isOwner?: boolean;
}

export function EnhancedDocumentToolbar({
  document,
  onSaveAction = handleDocumentSave,
  isSaving,
  isOwner = false,
}: DocumentToolbarProps) {
  const router = useRouter();
  const [isSending, setIsSending] = useState(false);
  const [confirmSendOpen, setConfirmSendOpen] = useState(false);
  const pathname = window.location.pathname;
  const isEditMode = pathname.includes("/edit");

  const handleBack = () => {
    if (isEditMode) {
      // If in edit mode, go back to document view
      router.push(`/documents/${document.id}`);
    } else {
      // Otherwise go back to documents list
      router.push("/documents");
    }
  };

  const handlePreview = () => {
    router.push(`/documents/${document.id}/preview`);
  };

  const handleEdit = () => {
    router.push(`/documents/${document.id}/edit`);
  };

  const handleSendForSignature = async () => {
    try {
      setIsSending(true);
      // First, save any pending changes
      await onSaveAction(document);

      // Send the document for signature
      const result = await sendDocumentForSigning(document.id);

      if (result.success) {
        toast.success("Document sent for signature successfully!");
        router.refresh();
      } else {
        toast.error(result.message || "Failed to send document for signature");
      }
    } catch (error) {
      console.error("Error sending document:", error);
      toast.error("An error occurred while sending the document");
    } finally {
      setIsSending(false);
      setConfirmSendOpen(false);
    }
  };

  const getActionButtons = () => {
    if (isEditMode) {
      return (
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleBack}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>

          <Button
            variant="default"
            size="sm"
            onClick={() => onSaveAction(document)}
            disabled={isSaving}
          >
            {isSaving ? (
              <>
                <RotateCcw className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save
              </>
            )}
          </Button>
        </div>
      );
    } else {
      return (
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleBack}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>

          {document.status === "DRAFT" && isOwner && (
            <>
              <Button variant="outline" size="sm" onClick={handleEdit}>
                <Settings className="mr-2 h-4 w-4" />
                Edit
              </Button>

              <Button variant="outline" size="sm" onClick={handlePreview}>
                <Eye className="mr-2 h-4 w-4" />
                Preview
              </Button>

              <Button
                variant="default"
                size="sm"
                onClick={() => setConfirmSendOpen(true)}
                disabled={isSending}
              >
                {isSending ? (
                  <>
                    <RotateCcw className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save
                  </>
                )}
              </Button>
            </>
          )}

          {document.status !== "DRAFT" && isOwner && (
            <Button variant="outline" size="sm" onClick={handlePreview}>
              <Eye className="mr-2 h-4 w-4" />
              Preview
            </Button>
          )}
        </div>
      );
    }
  };

  return (
    <>
      <div className="flex justify-between items-center gap-2">
        {getActionButtons()}
      </div>

      <AlertDialog open={confirmSendOpen} onOpenChange={setConfirmSendOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Send Document for Signature?</AlertDialogTitle>
            <AlertDialogDescription>
              This will send the document to the signer for signature. The
              document will no longer be editable once sent.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleSendForSignature();
              }}
              disabled={isSending}
            >
              {isSending ? "Sending..." : "Send"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
