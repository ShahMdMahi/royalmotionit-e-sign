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

export function DocumentToolbar({
  document,
  onSaveAction = handleDocumentSave,
  isSaving,
  isSubmitting,
  onSave,
}: DocumentToolbarProps) {
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
    <div className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-sm">
      {/* Mobile Layout */}
      <div className="flex flex-col sm:hidden">
        {/* Top row - Back button and title */}
        <div className="flex items-center justify-between p-3 border-b border-border/50">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBack}
            data-testid="document-back-button"
            className="flex-shrink-0"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            <span className="text-xs">Back</span>
          </Button>

          <h1 className="text-sm font-medium text-center flex-1 mx-2 truncate">
            {document.title || "Untitled Document"}
          </h1>
        </div>

        {/* Bottom row - Action buttons */}
        <div className="flex items-center justify-center gap-2 p-2 bg-muted/30">
          {!isEditMode ? (
            <>
              {/* Edit button for admin users and draft documents */}
              {document.status === "DRAFT" && userRole === "ADMIN" && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleEdit}
                  data-testid="document-edit-button"
                  className="flex-1 max-w-[100px]"
                >
                  <Settings className="h-3 w-3" />
                  <span className="ml-1 text-xs">Edit</span>
                </Button>
              )}
              {/* Sign button for regular users */}
              {document.status === "PENDING" && userRole !== "ADMIN" && (
                <Button
                  onClick={() => router.push(`/documents/${document.id}/sign`)}
                  variant="default"
                  size="sm"
                  data-testid="document-sign-button"
                  className="flex-1 max-w-[120px]"
                >
                  <FileSignature className="h-3 w-3" />
                  <span className="ml-1 text-xs">Sign</span>
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={handlePreview}
                data-testid="document-preview-button"
                className="flex-1 max-w-[100px]"
              >
                <Eye className="h-3 w-3" />
                <span className="ml-1 text-xs">Preview</span>
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={handlePreview}
                data-testid="document-preview-button"
                className="flex-1 max-w-[100px]"
              >
                <Eye className="h-3 w-3" />
                <span className="ml-1 text-xs">Preview</span>
              </Button>
              {/* Save button for admin users in edit mode */}
              {userRole === "ADMIN" && (
                <Button
                  onClick={onSave ? onSave : () => onSaveAction(document)}
                  disabled={saving}
                  data-testid="document-save-button"
                  size="sm"
                  className="flex-1 max-w-[100px]"
                >
                  <Save className="h-3 w-3" />
                  <span className="ml-1 text-xs">
                    {saving ? "Saving..." : "Save"}
                  </span>
                </Button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Tablet and Desktop Layout */}
      <div className="hidden sm:flex items-center justify-between p-4 lg:px-6">
        <div className="flex items-center space-x-3 lg:space-x-4 min-w-0 flex-1">
          <Button
            variant="ghost"
            onClick={handleBack}
            data-testid="document-back-button"
            className="flex-shrink-0 hover:bg-muted/80 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            <span className="hidden md:inline">
              {isEditMode ? "Back to Document" : "Back to Documents"}
            </span>
            <span className="md:hidden">Back</span>
          </Button>

          <div className="min-w-0 flex-1">
            <h1 className="text-base lg:text-lg font-medium truncate text-foreground">
              {document.title || "Untitled Document"}
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <span
                className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                  document.status === "DRAFT"
                    ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400"
                    : document.status === "PENDING"
                      ? "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400"
                      : document.status === "COMPLETED"
                        ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
                        : "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400"
                }`}
              >
                {document.status}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2 lg:space-x-3 flex-shrink-0">
          {!isEditMode ? (
            <>
              {/* Edit button for admin users and draft documents */}
              {document.status === "DRAFT" && userRole === "ADMIN" && (
                <Button
                  variant="outline"
                  onClick={handleEdit}
                  data-testid="document-edit-button"
                  className="hover:bg-muted/80 transition-colors"
                >
                  <Settings className="h-4 w-4 mr-2" />
                  <span className="hidden lg:inline">Edit</span>
                </Button>
              )}
              {/* Sign button for regular users */}
              {document.status === "PENDING" && userRole !== "ADMIN" && (
                <Button
                  onClick={() => router.push(`/documents/${document.id}/sign`)}
                  variant="default"
                  data-testid="document-sign-button"
                  className="bg-primary hover:bg-primary/90 transition-colors shadow-sm"
                >
                  <FileSignature className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Sign Document</span>
                  <span className="sm:hidden">Sign</span>
                </Button>
              )}
              <Button
                variant="outline"
                onClick={handlePreview}
                data-testid="document-preview-button"
                className="hover:bg-muted/80 transition-colors"
              >
                <Eye className="h-4 w-4 mr-2" />
                <span className="hidden lg:inline">Preview</span>
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="outline"
                onClick={handlePreview}
                data-testid="document-preview-button"
                className="hover:bg-muted/80 transition-colors"
              >
                <Eye className="h-4 w-4 mr-2" />
                <span className="hidden lg:inline">Preview</span>
              </Button>
              {/* Save button for admin users in edit mode */}
              {userRole === "ADMIN" && (
                <Button
                  onClick={onSave ? onSave : () => onSaveAction(document)}
                  disabled={saving}
                  data-testid="document-save-button"
                  className="bg-primary hover:bg-primary/90 disabled:opacity-50 transition-colors shadow-sm"
                >
                  <Save className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">
                    {saving ? "Saving..." : "Save"}
                  </span>
                  <span className="sm:hidden">{saving ? "..." : "Save"}</span>
                </Button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
