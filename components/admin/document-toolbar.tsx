"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Document, DocumentField } from "@/types/document";
import { Save, Send, ArrowLeft, Settings, Eye } from "lucide-react";
import { useRouter } from "next/navigation";
import { handleDocumentSave } from "@/actions/document-toolbar-actions";

interface DocumentToolbarProps {
  document: Document;
  onSaveAction?: typeof handleDocumentSave;
  isSaving: boolean;
  fields?: DocumentField[];
}

export function DocumentToolbar({
  document,
  onSaveAction = handleDocumentSave,
  isSaving,
  fields = [],
}: DocumentToolbarProps) {
  const router = useRouter();
  const pathname = window.location.pathname;
  const isEditMode = pathname.includes("/edit");

  // Check if there are any fields to save
  const hasFields = fields.length > 0;

  const handleBack = () => {
    if (isEditMode) {
      // If in edit mode, go back to document view
      router.push(`/admin/documents/${document.id}`);
    } else {
      // Otherwise go back to documents list
      router.push("/admin/documents");
    }
  };

  const handlePreview = () => {
    router.push(`/admin/documents/${document.id}/preview`);
  };

  const handleEdit = () => {
    router.push(`/admin/documents/${document.id}/edit`);
  };
  return (
    <div
      className="p-4 border-b flex items-center justify-between bg-background shadow-sm"
      data-testid="admin-document-toolbar"
    >
      <div className="flex items-center space-x-4">
        <Button
          variant="ghost"
          onClick={handleBack}
          data-testid="admin-back-button"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          {isEditMode ? "Back to Document" : "Back to Documents"}
        </Button>

        <h1 className="text-lg font-medium hidden md:block">
          {document.title || "Untitled Document"}
        </h1>
      </div>

      <div className="flex items-center space-x-2">
        {!isEditMode && document.status === "DRAFT" && (
          <>
            <Button
              variant="outline"
              onClick={handleEdit}
              data-testid="admin-edit-button"
            >
              <Settings className="h-4 w-4 mr-2" />
              Edit
            </Button>

            <Button
              onClick={() => onSaveAction(document)}
              disabled={isSaving || !hasFields}
              title={
                !hasFields ? "Add at least one field to send for signing" : ""
              }
              data-testid="admin-send-button"
            >
              <Send className="h-4 w-4 mr-2" />
              {isSaving ? "Processing..." : "Send for Signing"}
            </Button>
          </>
        )}
        {isEditMode ? (
          <Button
            onClick={() => onSaveAction(document)}
            disabled={isSaving || !hasFields}
            title={!hasFields ? "Add at least one field to save" : ""}
            data-testid="admin-save-button"
          >
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
        ) : (
          <Button
            variant="outline"
            onClick={handlePreview}
            data-testid="admin-preview-button"
          >
            <Eye className="h-4 w-4 mr-2" />
            Preview
          </Button>
        )}
      </div>
    </div>
  );
}
