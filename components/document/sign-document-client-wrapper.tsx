"use client";

import dynamic from "next/dynamic";
import { Document as PrismaDocument, Signer } from "@prisma/client";
import { DocumentField } from "@/types/document";

// Dynamically import the SignDocumentComponent to prevent SSR issues
const SignDocumentComponent = dynamic(
  () =>
    import("@/components/document").then((mod) => mod.SignDocumentComponent),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-[80vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading document viewer...</p>
        </div>
      </div>
    ),
  },
);

interface SignDocumentClientWrapperProps {
  document: PrismaDocument & {
    fields?: any[];
    signers: Signer[];
  };
  signer: Signer;
  fields: DocumentField[];
}

export function SignDocumentClientWrapper({
  document,
  signer,
  fields,
}: SignDocumentClientWrapperProps) {
  return (
    <SignDocumentComponent
      document={document}
      signer={signer}
      fields={fields}
    />
  );
}
