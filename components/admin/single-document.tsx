"use client";

import { Document, User } from "@prisma/client";

interface SingleDocumentComponentProps {
  document: Document;
  author: User;
  signee?: User | null;
}

export function SingleDocumentComponent({ document, author, signee }: SingleDocumentComponentProps) {
  return (
    <div>
      {JSON.stringify(document)}
      {author && <p>Author: {author.name}</p>}
      {signee && <p>Signee: {signee.name}</p>}
    </div>
  );
}
