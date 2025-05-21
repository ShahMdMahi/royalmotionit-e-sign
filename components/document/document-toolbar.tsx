"use client";

import { Button } from "@/components/ui/button";
import { Save, Send, ArrowLeft, RotateCcw, Settings, Eye } from "lucide-react";
import { Document } from "@/types/document";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  isSaving?: boolean;
  isSubmitting?: boolean;
  onSave?: () => Promise<void>;
}

export function DocumentToolbar({
  document,
  onSaveAction = handleDocumentSave,
  isSaving,
  isSubmitting,
  onSave,
}: DocumentToolbarProps) {
  const router = useRouter();
  const saving = isSaving || isSubmitting || false;
  const [isSending, setIsSending] = useState(false);
  const [confirmSendOpen, setConfirmSendOpen] = useState(false);
  const pathname = window.location.pathname;
  const [userRole, setUserRole] = useState<string | null>(null);
  
  // Get the user role from session when component loads
  useEffect(() => {
    const fetchUserRole = async () => {
      try {
        const response = await fetch('/api/auth/session');
        if (response.ok) {
          const data = await response.json();
          setUserRole(data?.user?.role || null);
        }
      } catch (error) {
        console.error('Error fetching session:', error);
      }
    };
    
    fetchUserRole();
  }, []);
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
        toast.success("Document sent for signature successfully");
        router.refresh(); // Refresh to update the document status in the UI
      } else {
        toast.error(result.message || "Failed to send document for signature");
      }
    } catch (error) {
      console.error("Error sending document for signature:", error);
      toast.error("An error occurred while sending the document for signature");
    } finally {
      setIsSending(false);
      setConfirmSendOpen(false);
    }
  };

  return (
    <div className="p-4 border-b flex items-center justify-between bg-background shadow-sm">
      {" "}
      <div className="flex items-center space-x-4">
        <Button
          variant="ghost"
          onClick={handleBack}
          data-testid="document-back-button"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          {isEditMode ? "Back to Document" : "Back to Documents"}
        </Button>

        <h1 className="text-lg font-medium hidden md:block">
          {document.title || "Untitled Document"}
        </h1>
      </div>
      <div className="flex items-center space-x-2">
        {!isEditMode ? (
          <>
            {/* Only show Edit button for admin users and draft documents */}
            {document.status === "DRAFT" && userRole === 'ADMIN' && (
              <Button
                variant="outline"
                onClick={handleEdit}
                data-testid="document-edit-button"
              >
                <Settings className="h-4 w-4 mr-2" />
                Edit
              </Button>
            )}
            <Button
              variant="outline"
              onClick={handlePreview}
              data-testid="document-preview-button"
            >
              <Eye className="h-4 w-4 mr-2" />
              Preview
            </Button>
          </>
        ) : (
          <>
            <Button
              variant="outline"
              onClick={handlePreview}
              data-testid="document-preview-button"
            >
              <Eye className="h-4 w-4 mr-2" />
              Preview
            </Button>{" "}
            {/* Only show Save button for admin users in edit mode */}
            {userRole === 'ADMIN' && (
              <Button
                onClick={onSave ? onSave : () => onSaveAction(document)}
                disabled={saving}
                data-testid="document-save-button"
              >
                <Save className="h-4 w-4 mr-2" />
                {saving ? "Saving..." : "Save"}
              </Button>
            )}
          </>
        )}

        {/* Only show Options dropdown menu for admin users */}
        {userRole === 'ADMIN' && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <Settings className="h-4 w-4 mr-2" />
                Options
              </Button>
            </DropdownMenuTrigger>{" "}
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Document Actions</DropdownMenuLabel>
              <DropdownMenuSeparator />{" "}
              <DropdownMenuItem
                onClick={onSave ? onSave : () => onSaveAction(document)}
              >
                <Save className="h-4 w-4 mr-2" />
                Save
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setConfirmSendOpen(true)}>
                <Send className="h-4 w-4 mr-2" />
                Send for Signature
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => toast.info("This feature is coming soon")}
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Reset Fields
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
      {/* Send for Signature Confirmation Dialog */}
      <AlertDialog open={confirmSendOpen} onOpenChange={setConfirmSendOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Send Document for Signature</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to send this document for signature? Once
              sent, the document cannot be edited until all signatures are
              completed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleSendForSignature}
              disabled={isSending}
            >
              {isSending ? "Sending..." : "Send Document"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
