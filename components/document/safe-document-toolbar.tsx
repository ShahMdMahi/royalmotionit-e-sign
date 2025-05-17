"use client";

import { DocumentToolbar as OriginalDocumentToolbar } from "./document-toolbar";

// Wrapper component that accepts any document type
export function DocumentToolbar({
  document,
  isSaving = false,
  onSaveAction,
  ...rest
}: {
  document: any;
  isSaving?: boolean;
  onSaveAction?: (document: any) => Promise<any>;
  [key: string]: any;
}) {
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
      document={safeDocument as any}
      isSaving={isSaving}
      onSaveAction={onSaveAction}
      {...rest}
    />
  );
}
