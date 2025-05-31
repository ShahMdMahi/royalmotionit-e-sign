"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Document, DocumentField } from "@/types/document";
import { Save, ArrowLeft, Settings, Eye, FileSignature } from "lucide-react";
import { useRouter } from "next/navigation";
import { handleDocumentSave } from "@/actions/document-toolbar-actions";

interface DocumentToolbarProps {
  document: Document;
  onSaveAction?: typeof handleDocumentSave;
  isSaving: boolean;
  fields?: DocumentField[];
  isSigner?: boolean;
  userRole?: string | null;
}

export function DocumentToolbar({
  document,
  onSaveAction = handleDocumentSave,
  isSaving,
  fields = [],
  isSigner = false,
  userRole = null,
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
      if (userRole === "ADMIN") {
        router.push("/admin/documents");
      } else {
        router.push("/documents");
      }
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
      className="p-2 sm:p-3 md:p-4 border-b flex items-center justify-between bg-background shadow-sm"
      data-testid="admin-document-toolbar"
    >
      <div className="flex items-center space-x-2 sm:space-x-3 md:space-x-4">
        <Button
          variant="ghost"
          size="sm"
          className="text-xs sm:text-sm"
          onClick={handleBack}
          data-testid="admin-back-button"
        >
          <ArrowLeft className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
          <span className="hidden xs:inline">
            {isEditMode ? "Back to Document" : "Back to Documents"}
          </span>
          <span className="inline xs:hidden">Back</span>
        </Button>

        <h1 className="text-sm sm:text-base md:text-lg font-medium hidden sm:block truncate max-w-[150px] md:max-w-none">
          {document.title || "Untitled Document"}
        </h1>
      </div>

      <div className="flex items-center space-x-2">
        {/* Sign button for signers with pending documents */}
        {isSigner && document.status === "PENDING" && !isEditMode && (
          <Button
            onClick={() => router.push(`/documents/${document.id}/sign`)}
            variant="default"
            size="sm"
            className="text-xs sm:text-sm h-8 sm:h-9"
            data-testid="signer-sign-button"
          >
            <FileSignature className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
            <span className="hidden xs:inline">Sign Document</span>
            <span className="inline xs:hidden">Sign</span>
          </Button>
        )}

        {/* Admin edit button for draft documents */}
        {!isEditMode && document.status === "DRAFT" && userRole === "ADMIN" && (
          <>
            <Button
              variant="outline"
              size="sm"
              className="text-xs sm:text-sm h-8 sm:h-9"
              onClick={handleEdit}
              data-testid="admin-edit-button"
            >
              <Settings className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              Edit
            </Button>
          </>
        )}

        {isEditMode ? (
          <Button
            onClick={() => onSaveAction(document)}
            disabled={isSaving || !hasFields}
            title={!hasFields ? "Add at least one field to save" : ""}
            size="sm"
            className="text-xs sm:text-sm h-8 sm:h-9"
            data-testid="admin-save-button"
          >
            <Save className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
            <span className="hidden xs:inline">
              {isSaving ? "Saving..." : "Save Changes"}
            </span>
            <span className="inline xs:hidden">
              {isSaving ? "Saving..." : "Save"}
            </span>
          </Button>
        ) : (
          <Button
            variant="outline"
            onClick={handlePreview}
            size="sm"
            className="text-xs sm:text-sm h-8 sm:h-9"
            data-testid="admin-preview-button"
          >
            <Eye className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
            <span className="hidden xs:inline">Preview</span>
            <span className="inline xs:hidden">View</span>
          </Button>
        )}
      </div>
    </div>
  );
}
