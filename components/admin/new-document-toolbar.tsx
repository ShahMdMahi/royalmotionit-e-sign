"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Save, Send, ArrowLeft, Settings, Eye } from "lucide-react";
import { useRouter } from "next/navigation";
import { handleDocumentSave } from "@/actions/document-toolbar-actions";

interface NewDocumentToolbarProps {
  document: {
    id: string;
    title: string;
    description?: string;
    type: string;
    key: string;
    status: string;
    sequentialSigning: boolean;
    signers: Array<{
      id: string;
      documentId: string;
      email: string;
      name?: string;
      role?: string;
      order: number;
      status: string;
      color?: string;
    }>;
  };
  onSaveAction?: (doc: any) => Promise<any>;
  isSaving: boolean;
}

export function NewDocumentToolbar({
  document,
  onSaveAction,
  isSaving,
}: NewDocumentToolbarProps) {
  const router = useRouter();
  const pathname = window.location.pathname;
  const isEditMode = pathname.includes("/edit");

  const handleBack = () => {
    const parentPath = pathname.split("/").slice(0, -1).join("/");
    router.push(parentPath);
  };

  const handleSave = async () => {
    if (onSaveAction) {
      try {
        await onSaveAction(document);
      } catch (error) {
        console.error("Error saving document:", error);
      }
    }
  };

  return (
    <div className="p-4 border-b flex items-center justify-between bg-background shadow-sm">
      <div className="flex items-center space-x-2">
        <Button variant="ghost" onClick={handleBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <h1 className="text-lg font-medium hidden md:block">
          {document.title || "Untitled Document"}
        </h1>
      </div>
      <div className="flex items-center space-x-2">
        {isEditMode && (
          <Button variant="default" onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <>
                <span className="animate-pulse">Saving...</span>
                <span className="ml-2 h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent" />
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        )}

        {!isEditMode && document.status === "DRAFT" && (
          <Button variant="default" onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <>
                <span className="animate-pulse">Sending...</span>
                <span className="ml-2 h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent" />
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Send for Signing
              </>
            )}
          </Button>
        )}

        {!isEditMode && (
          <Button variant="outline">
            <Eye className="h-4 w-4 mr-2" />
            Preview
          </Button>
        )}

        <Button variant="outline">
          <Settings className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
