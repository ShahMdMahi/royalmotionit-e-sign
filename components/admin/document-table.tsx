"use client";

import { Document, DocumentStatus, DocumentSet, DocumentType, User } from "@prisma/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import React, { useState } from "react";
import { Eye, Download, Search, FileSignature, ChevronDown, ChevronRight } from "lucide-react";
import Link from "next/link";
import { ScrollArea } from "@/components/ui/scroll-area";

// Define a type for document with its document set
type DocumentWithSet = Document & {
  documentSet?: DocumentSet | null;
};

// Group documents by document set
interface DocumentsBySet {
  [key: string]: {
    documentSet: DocumentSet | null;
    documents: Document[];
  };
}

export function DocumentTable({ documents, users }: { documents: DocumentWithSet[]; users: User[] }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedSets, setExpandedSets] = useState<{ [key: string]: boolean }>({});

  // Default all document sets to expanded
  useState(() => {
    const initialExpandState: { [key: string]: boolean } = {};
    documents.forEach((doc) => {
      const setId = doc.documentSetId || "unassigned";
      initialExpandState[setId] = true;
    });
    setExpandedSets(initialExpandState);
  });

  // Filter documents based on search query
  const filteredDocuments = documents.filter((document) => {
    if (!searchQuery.trim()) return true;

    const query = searchQuery.toLowerCase();

    // Document related fields
    if (
      document.title.toLowerCase().includes(query) ||
      document.id.toLowerCase().includes(query) ||
      (document.pathname ? document.pathname.toLowerCase().includes(query) : false) ||
      (document.documentSet?.name ? document.documentSet.name.toLowerCase().includes(query) : false) ||
      document.status.toLowerCase().includes(query) ||
      document.documentType.toLowerCase().includes(query)
    ) {
      return true;
    }

    // Author related fields
    const author = users.find((user) => user.id === document.authorId);
    if (author && (author.name?.toLowerCase().includes(query) || author.email?.toLowerCase().includes(query) || author.id?.toLowerCase().includes(query))) {
      return true;
    }

    // Signee related fields
    const signee = users.find((user) => user.id === document.signeeId);
    if (signee && (signee.name?.toLowerCase().includes(query) || signee.email?.toLowerCase().includes(query) || signee.id?.toLowerCase().includes(query))) {
      return true;
    }

    return false;
  });

  // Group documents by their document set
  const documentsBySet: DocumentsBySet = filteredDocuments.reduce((acc, document) => {
    const setId = document.documentSetId || DocumentType.UNSIGNED;

    if (!acc[setId]) {
      acc[setId] = {
        documentSet: document.documentSet || null,
        documents: [],
      };
    }

    acc[setId].documents.push(document);
    return acc;
  }, {} as DocumentsBySet);

  const handleDownload = (documentUrl: string, documentTitle: string, documentId: string) => {
    // Create a temporary anchor element to trigger download
    const anchor = document.createElement("a");
    anchor.href = documentUrl;
    anchor.download = `${documentTitle}_${documentId}.pdf`;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
  };

  const toggleSetExpansion = (setId: string) => {
    setExpandedSets((prev) => ({
      ...prev,
      [setId]: !prev[setId],
    }));
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileSignature className="h-5 w-5 text-primary" />
            Documents
          </div>
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input type="search" placeholder="Search documents..." className="w-full pl-9" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[500px] w-full">
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-100">
                  <TableHead className="w-[50px]"></TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>ID</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Author</TableHead>
                  <TableHead>Signee</TableHead>
                  <TableHead>Signed</TableHead>
                  <TableHead>Updated</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Object.entries(documentsBySet).length > 0 ? (
                  Object.entries(documentsBySet).map(([setId, { documentSet, documents }]) => (
                    <React.Fragment key={setId}>
                      {/* DocumentSet Row (Parent) */}
                      <TableRow className="bg-white hover:bg-gray-50 cursor-pointer border-b" onClick={() => toggleSetExpansion(setId)}>
                        <TableCell className="p-2">
                          <div className="flex items-center">
                            {expandedSets[setId] ? <ChevronDown className="h-4 w-4 text-gray-500" /> : <ChevronRight className="h-4 w-4 text-gray-500" />}
                            <div className="ml-2 flex">
                              <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path
                                  d="M22 12.204v-1.504c0-4.41-1.932-5.604-4.824-5.604H6.824C3.932 5.096 2 6.29 2 10.7v5.592C2 20.7 3.932 21.904 6.824 21.904h10.352"
                                  stroke="currentColor"
                                  strokeWidth="1.5"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                                <path d="M12 5.096V13.7L8.8 10.5M12 13.7l3.2-3.2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="font-semibold">{setId === "unassigned" ? "Unassigned Documents" : documentSet?.name || "Unknown Set"}</span>
                          {/* <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">{documents.length} Documents</span> */}
                        </TableCell>
                        <TableCell>{setId}</TableCell>
                        <TableCell>{"N/A"}</TableCell>
                        <TableCell>{"N/A"}</TableCell>
                        <TableCell>{"N/A"}</TableCell>
                        <TableCell>{"N/A"}</TableCell>
                        <TableCell>{"N/A"}</TableCell>
                        <TableCell>
                          {documentSet?.updatedAt ? (
                            <>
                              <p>{new Date(documentSet.updatedAt).toLocaleDateString()}</p>
                              <p>{new Date(documentSet.updatedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", timeZoneName: "short" })}</p>
                            </>
                          ) : (
                            "N/A"
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {setId !== "unassigned" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              asChild
                              onClick={(e) => e.stopPropagation()} // Prevent toggling the parent
                            >
                              <Link href={`/admin/document-sets/${setId}`}>
                                <Eye className="h-4 w-4" />
                                <span className="sr-only">View</span>
                              </Link>
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>

                      {/* Document Rows (Children) */}
                      {expandedSets[setId] &&
                        documents.map((document, index) => {
                          const author = users.find((user) => user.id === document.authorId);
                          const signee = users.find((user) => user.id === document.signeeId);
                          return (
                            <TableRow key={document.id} className="hover:bg-gray-50">
                              <TableCell className="relative p-2">
                                <div className="flex items-center">
                                  <div className="absolute left-0 top-0 w-8 bottom-0 flex items-center justify-center">
                                    <div className={`h-full w-px bg-gray-300 ${index === documents.length - 1 ? "h-1/2" : ""}`}></div>
                                  </div>
                                  <div className="absolute left-8 top-1/2 w-4 h-px bg-gray-300"></div>
                                  <div className="ml-12 flex items-center">
                                    <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                      <path
                                        d="M22 12.204v-1.504c0-4.41-1.932-5.604-4.824-5.604H6.824C3.932 5.096 2 6.29 2 10.7v5.592C2 20.7 3.932 21.904 6.824 21.904h10.352"
                                        stroke="currentColor"
                                        strokeWidth="1.5"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                      />
                                      <path d="M12 5.096V13.7L8.8 10.5M12 13.7l3.2-3.2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>{document.title}</TableCell>
                              <TableCell>{document.id}</TableCell>
                              <TableCell>
                                <span
                                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                    document.status === DocumentStatus.APPROVED
                                      ? "bg-green-100 text-green-800"
                                      : document.status === DocumentStatus.REJECTED
                                        ? "bg-red-100 text-red-800"
                                        : "bg-yellow-100 text-yellow-800"
                                  }`}
                                >
                                  {document.status}
                                </span>
                              </TableCell>
                              <TableCell>
                                <span
                                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                    document.documentType === DocumentType.SIGNED ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                                  }`}
                                >
                                  {document.documentType}
                                </span>
                              </TableCell>
                              <TableCell>
                                {author ? (
                                  <>
                                    <p>{author.name}</p>
                                    <p>{author.email}</p>
                                    <p>{author.id}</p>
                                  </>
                                ) : (
                                  "N/A"
                                )}
                              </TableCell>
                              <TableCell>
                                {signee ? (
                                  <>
                                    <p>{signee.name}</p>
                                    <p>{signee.email}</p>
                                    <p>{signee.id}</p>
                                  </>
                                ) : (
                                  "N/A"
                                )}
                              </TableCell>
                              <TableCell>
                                {document.signedAt ? (
                                  <>
                                    <p>{new Date(document.signedAt).toLocaleDateString()}</p>
                                    <p>{new Date(document.signedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", timeZoneName: "short" })}</p>
                                  </>
                                ) : (
                                  "N/A"
                                )}
                              </TableCell>
                              <TableCell>
                                {document.updatedAt ? (
                                  <>
                                    <p>{new Date(document.updatedAt).toLocaleDateString()}</p>
                                    <p>{new Date(document.updatedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", timeZoneName: "short" })}</p>
                                  </>
                                ) : (
                                  "N/A"
                                )}
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex justify-end space-x-2">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation(); // Prevent toggling the parent
                                      if (document.downloadUrl) {
                                        handleDownload(document.downloadUrl, document.title, document.id);
                                      }
                                    }}
                                    title="Download"
                                    disabled={!document.downloadUrl}
                                  >
                                    <Download className="h-4 w-4" />
                                    <span className="sr-only">Download</span>
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    asChild
                                    onClick={(e) => e.stopPropagation()} // Prevent toggling the parent
                                  >
                                    <Link href={`/admin/documents/${document.id}`}>
                                      <Eye className="h-4 w-4" />
                                      <span className="sr-only">View</span>
                                    </Link>
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                    </React.Fragment>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={8} className="h-24 text-center">
                      No documents found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
