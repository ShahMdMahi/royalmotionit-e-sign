"use client";

import { DocumentToolbar as OriginalDocumentToolbar } from "./document-toolbar";
import { Document } from "@/types/document";
import { handleDocumentSave } from "@/actions/document-toolbar-actions";

// Define a flexible document type for the wrapper
interface PartialDocument {
  id: string;
  title: string;
  description?: string | null;
  authorId: string;
  authorName?: string;
  authorEmail?: string;
  status:
    | "DRAFT"
    | "PENDING"
    | "COMPLETED"
    | "EXPIRED"
    | "DECLINED"
    | "CANCELED";
  key?: string;
  type?: string;
  createdAt: Date;
  updatedAt: Date;
  sequentialSigning?: boolean;
  [key: string]: unknown;
}

interface SafeDocumentToolbarProps {
  document: PartialDocument;
  isSaving?: boolean;
  onSaveAction?: typeof handleDocumentSave;
  [key: string]: unknown;
}

// Wrapper component that accepts a more flexible document type
export function DocumentToolbar({
  document,
  isSaving = false,
  onSaveAction,
  ...rest
}: SafeDocumentToolbarProps) {
  // Convert document properties to match expected Document interface
  const safeDocument = {
    ...document,
    type: document.type || "",
    key: document.key || "",
    description: document.description || undefined, // Convert null to undefined
    sequentialSigning: document.sequentialSigning || false,
  };

  // Pass the converted document to the original component
  return (
    <OriginalDocumentToolbar
      document={safeDocument as Document}
      isSaving={isSaving}
      onSaveAction={onSaveAction}
      {...rest}
    />
  );
}
