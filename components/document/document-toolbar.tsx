"use client";

import { Button } from "@/components/ui/button";
import { Save, ArrowLeft, Settings, Eye, FileSignature } from "lucide-react";
import { Document } from "@/types/document";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useState } from "react";
import { handleDocumentSave } from "@/actions/document-toolbar-actions";

interface DocumentToolbarProps {
  document: Document;
  onSaveAction?: typeof handleDocumentSave;
  isSaving?: boolean;
  isSubmitting?: boolean;
  onSave?: () => Promise<void>;
}

export function DocumentToolbar({ document, onSaveAction = handleDocumentSave, isSaving, isSubmitting, onSave }: DocumentToolbarProps) {
  const router = useRouter();
  const saving = isSaving || isSubmitting || false;
  const pathname = window.location.pathname;
  const [userRole, setUserRole] = useState<string | null>(null);

  // Get the user role from session when component loads
  useEffect(() => {
    const fetchUserRole = async () => {
      try {
        const response = await fetch("/api/auth/session");
        if (response.ok) {
          const data = await response.json();
          setUserRole(data?.user?.role || null);
        }
      } catch (error) {
        console.error("Error fetching session:", error);
      }
    };

    fetchUserRole();
  }, []);
  const isEditMode = pathname.includes("/edit");
  const isAdminRoute = pathname.includes("/admin");

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
    if (isAdminRoute) {
      router.push(`/admin/documents/${document.id}/preview`);
    } else {
      router.push(`/documents/${document.id}/preview`);
    }
  };

  const handleEdit = () => {
    router.push(`/admin/documents/${document.id}/edit`);
  };

  return (
    <div className="p-4 border-b flex items-center justify-between bg-background shadow-sm">
      <div className="flex items-center space-x-4">
        <Button variant="ghost" onClick={handleBack} data-testid="document-back-button">
          <ArrowLeft className="h-4 w-4 mr-2" />
          {isEditMode ? "Back to Document" : "Back to Documents"}
        </Button>

        <h1 className="text-lg font-medium hidden md:block">{document.title || "Untitled Document"}</h1>
      </div>
      <div className="flex items-center space-x-2">
        {!isEditMode ? (
          <>
            {/* Only show Edit button for admin users and draft documents */}
            {document.status === "DRAFT" && userRole === "ADMIN" && (
              <Button variant="outline" onClick={handleEdit} data-testid="document-edit-button">
                <Settings className="h-4 w-4 mr-2" />
                Edit
              </Button>
            )}
            {/* Show Sign button for regular users when document is pending signature */}
            {document.status === "PENDING" && userRole !== "ADMIN" && (
              <Button onClick={() => router.push(`/documents/${document.id}/sign`)} variant="default" data-testid="document-sign-button">
                <FileSignature className="h-4 w-4 mr-2" />
                Sign Document
              </Button>
            )}
            <Button variant="outline" onClick={handlePreview} data-testid="document-preview-button">
              <Eye className="h-4 w-4 mr-2" />
              Preview
            </Button>
          </>
        ) : (
          <>
            <Button variant="outline" onClick={handlePreview} data-testid="document-preview-button">
              <Eye className="h-4 w-4 mr-2" />
              Preview
            </Button>
            {/* Only show Save button for admin users in edit mode */}
            {userRole === "ADMIN" && (
              <Button onClick={onSave ? onSave : () => onSaveAction(document)} disabled={saving} data-testid="document-save-button">
                <Save className="h-4 w-4 mr-2" />
                {saving ? "Saving..." : "Save"}
              </Button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
