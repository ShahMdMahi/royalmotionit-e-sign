import { Document, Role, DocumentType } from "@prisma/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { FileSignature, Eye, Pencil, Calendar, Clock, AlertCircle, CheckCircle2, TimerOff } from "lucide-react";

interface DocumentComponentProps {
  userRole: Role;
  authorDocuments: Document[];
  signeeDocuments: Document[];
}

export function DocumentsComponent({ userRole, authorDocuments, signeeDocuments }: DocumentComponentProps) {
  const isAdmin = userRole === Role.ADMIN;
  const defaultTab = isAdmin ? "authored" : "signees";

  // Helper function to format date with Bangladesh locale and time
  const formatDateWithTime = (date: Date | string) => {
    return new Date(date).toLocaleString("en-BD", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  return (
    <div className="container mx-auto py-8">
      <div className="space-y-3 mb-6">
        <h1 className="text-3xl font-bold tracking-tighter">Your Documents</h1>
        <p className="text-muted-foreground">Manage and sign your digital documents securely.</p>
      </div>

      <Tabs defaultValue={defaultTab} className="w-full">
        <TabsList className={`grid w-full ${isAdmin ? "grid-cols-2" : "grid-cols-1"} mb-6`}>
          {isAdmin && <TabsTrigger value="authored">Authored Documents</TabsTrigger>}
          <TabsTrigger value="signees">Documents to Sign</TabsTrigger>
        </TabsList>
        {isAdmin && (
          <TabsContent value="authored">
            <Card>
              <CardHeader>
                <CardTitle>Authored by You</CardTitle>
                <CardDescription>These are documents you have uploaded or created.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {authorDocuments.length === 0 && <p className="text-sm text-muted-foreground">You have not authored any documents yet.</p>}
                <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                  {authorDocuments.map((doc) => (
                    <Card key={doc.id} className="card-hover border-border overflow-hidden">
                      <CardHeader className="pb-3">
                        <div className="flex justify-between items-start gap-2">
                          <CardTitle className="truncate text-lg">{doc.title}</CardTitle>
                          <Badge variant={doc.status === "PENDING" ? "outline" : doc.status === "APPROVED" ? "default" : "secondary"} className="shrink-0">
                            {doc.status}
                          </Badge>
                        </div>
                        <CardDescription className="line-clamp-2">{doc.description ? doc.description : "No description available"}</CardDescription>
                      </CardHeader>
                      <CardContent className="pb-3 space-y-3">
                        <div className="flex items-center gap-2 text-sm">
                          <span className="size-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <FileSignature className="h-4 w-4 text-primary" />
                          </span>
                          <span className="text-muted-foreground">{doc.documentType}</span>
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground flex items-center gap-1.5">
                              <Calendar className="h-3 w-3" /> Created:
                            </span>
                            <span className="font-medium">{formatDateWithTime(doc.createdAt)}</span>
                          </div>

                          <div className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground flex items-center gap-1.5">
                              <Clock className="h-3 w-3" /> Updated:
                            </span>
                            <span className="font-medium">{formatDateWithTime(doc.updatedAt)}</span>
                          </div>

                          {doc.preparedAt && (
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-muted-foreground flex items-center gap-1.5">
                                <FileSignature className="h-3 w-3" /> Prepared:
                              </span>
                              <span className="font-medium">{formatDateWithTime(doc.preparedAt)}</span>
                            </div>
                          )}

                          {doc.expiresAt && (
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-muted-foreground flex items-center gap-1.5">
                                <TimerOff className="h-3 w-3" /> Expires:
                              </span>
                              <span className={`font-medium ${new Date(doc.expiresAt) < new Date() ? "text-destructive" : ""}`}>{formatDateWithTime(doc.expiresAt)}</span>
                            </div>
                          )}

                          {doc.dueDate && (
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-muted-foreground flex items-center gap-1.5">
                                <AlertCircle className="h-3 w-3" /> Due:
                              </span>
                              <span className={`font-medium ${new Date(doc.dueDate) < new Date() ? "text-destructive" : ""}`}>{formatDateWithTime(doc.dueDate)}</span>
                            </div>
                          )}

                          {doc.signedAt && (
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-muted-foreground flex items-center gap-1.5">
                                <CheckCircle2 className="h-3 w-3" /> Signed:
                              </span>
                              <span className="font-medium text-emerald-500">{formatDateWithTime(doc.signedAt)}</span>
                            </div>
                          )}
                        </div>
                      </CardContent>
                      <CardFooter className="flex justify-end gap-2 pt-2 border-t">
                        <Button variant="outline" size="sm" asChild className="w-full sm:w-auto">
                          <Link href={`/documents/${doc.id}`}>
                            <Eye className="h-3.5 w-3.5 mr-1.5" />
                            View
                          </Link>
                        </Button>
                        {doc.status === "PENDING" && (
                          <Button size="sm" asChild className="w-full sm:w-auto">
                            <Link href={`/documents/${doc.id}/edit`}>
                              <Pencil className="h-3.5 w-3.5 mr-1.5" />
                              Edit
                            </Link>
                          </Button>
                        )}
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}
        <TabsContent value="signees">
          <Card>
            <CardHeader>
              <CardTitle>Assigned to You for Signing</CardTitle>
              <CardDescription>These are documents that require your signature.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {signeeDocuments.length === 0 && <p className="text-sm text-muted-foreground">No documents are currently assigned to you for signing.</p>}
              <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                {signeeDocuments.map((doc) => (
                  <Card key={doc.id} className="card-hover border-border overflow-hidden">
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start gap-2">
                        <CardTitle className="truncate text-lg">{doc.title}</CardTitle>
                        <Badge variant={doc.documentType === DocumentType.UNSIGNED ? "outline" : "default"} className="shrink-0">
                          {doc.documentType === DocumentType.UNSIGNED ? "Needs Signature" : "Signed"}
                        </Badge>
                      </div>
                      <CardDescription className="line-clamp-2">{doc.description ? doc.description : "No description available"}</CardDescription>
                    </CardHeader>
                    <CardContent className="pb-3 space-y-3">
                      <div className="flex items-center gap-2 text-sm">
                        <span className="size-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <FileSignature className="h-4 w-4 text-primary" />
                        </span>
                        <span className="text-muted-foreground">Status: {doc.status}</span>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground flex items-center gap-1.5">
                            <Calendar className="h-3 w-3" /> Received:
                          </span>
                          <span className="font-medium">{formatDateWithTime(doc.updatedAt)}</span>
                        </div>

                        {doc.preparedAt && (
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground flex items-center gap-1.5">
                              <FileSignature className="h-3 w-3" /> Prepared:
                            </span>
                            <span className="font-medium">{formatDateWithTime(doc.preparedAt)}</span>
                          </div>
                        )}

                        {doc.expiresAt && (
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground flex items-center gap-1.5">
                              <TimerOff className="h-3 w-3" /> Expires:
                            </span>
                            <span className={`font-medium ${new Date(doc.expiresAt) < new Date() ? "text-destructive" : ""}`}>{formatDateWithTime(doc.expiresAt)}</span>
                          </div>
                        )}

                        {doc.dueDate && (
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground flex items-center gap-1.5">
                              <AlertCircle className="h-3 w-3" /> Due:
                            </span>
                            <span className={`font-medium ${new Date(doc.dueDate) < new Date() ? "text-destructive" : ""}`}>{formatDateWithTime(doc.dueDate)}</span>
                          </div>
                        )}

                        {doc.signedAt && (
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground flex items-center gap-1.5">
                              <CheckCircle2 className="h-3 w-3" /> Signed:
                            </span>
                            <span className="font-medium text-emerald-500">{formatDateWithTime(doc.signedAt)}</span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                    <CardFooter className="flex justify-end gap-2 pt-2 border-t">
                      <Button variant="outline" size="sm" asChild className="w-full sm:w-auto">
                        <Link href={`/documents/${doc.id}`}>
                          <Eye className="h-3.5 w-3.5 mr-1.5" />
                          View
                        </Link>
                      </Button>
                      {doc.documentType === DocumentType.UNSIGNED && (
                        <Button size="sm" asChild className="w-full sm:w-auto">
                          <Link href={`/documents/${doc.id}?action=sign`}>
                            <FileSignature className="h-3.5 w-3.5 mr-1.5" />
                            Sign
                          </Link>
                        </Button>
                      )}
                    </CardFooter>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
