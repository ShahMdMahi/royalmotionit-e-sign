import { Document } from "@prisma/client";

interface SignleDocumentComponentProps {
  document: Document;
}

export function SingleDocumentComponent({ document }: SignleDocumentComponentProps) {
  return <div>{JSON.stringify(document)}</div>;
}
