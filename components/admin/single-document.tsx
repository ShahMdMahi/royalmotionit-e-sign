import { Document, User } from "@prisma/client";

interface SignleDocumentComponentProps {
  document: Document;
  author: User;
  signee: User | null;
}

export function SingleDocumentComponent({ document, author, signee }: SignleDocumentComponentProps) {
  return (
    <div className="flex flex-col gap-4 p-4">
      <h1 className="text-2xl font-bold">Document Details</h1>
      <div className="flex flex-col gap-2">
        <h2 className="text-xl font-semibold">Document Information</h2>
        <p>
          <strong>Title:</strong> {document.title}
        </p>
        <p>
          <strong>Description:</strong> {document.description}
        </p>
        <p>
          <strong>Status:</strong> {document.status}
        </p>
        <p>
          <strong>Created At:</strong> {new Date(document.createdAt).toLocaleString()}
        </p>
      </div>
      <div className="flex flex-col gap-2">
        <h2 className="text-xl font-semibold">Author Information</h2>
        <p>
          <strong>Name:</strong> {author.name}
        </p>
        <p>
          <strong>Email:</strong> {author.email}
        </p>
      </div>
      {signee && (
        <div className="flex flex-col gap-2">
          <h2 className="text-xl font-semibold">Signee Information</h2>
          <p>
            <strong>Name:</strong> {signee.name}
          </p>
          <p>
            <strong>Email:</strong> {signee.email}
          </p>
        </div>
      )}
    </div>
  );
}
