import { Document, Role, DocumentType } from "@prisma/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { FileSignature, Eye, Calendar, Clock, AlertCircle, CheckCircle2, TimerOff, FileText } from "lucide-react";
import { PageHeader } from "@/components/common/page-header";
import { User } from "next-auth";

interface DocumentComponentProps {
  userRole: Role;
  user: User;
  authorDocuments: Document[];
  signeeDocuments: Document[];
}

export function DocumentsComponent({ userRole, user, authorDocuments, signeeDocuments }: DocumentComponentProps) {
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
    <div className="container mx-auto py-4 sm:py-6 md:py-8 lg:py-10 max-w-7xl px-3 sm:px-4 md:px-6">
      {/* Documents header */}
      <PageHeader
        title="Your Documents"
        description="Manage and sign your digital documents securely."
        showUserInfo={true}
        userName={user.name ?? "User"}
        userEmail={user.email ?? ""}
        userId={user.id}
        userImage={user.image}
        icon={
          <div className="size-10 sm:size-12 rounded-full bg-primary/10 flex items-center justify-center">
            <FileText className="size-5 sm:size-6 text-primary" />
          </div>
        }
      />

      <Tabs defaultValue={defaultTab} className="w-full">
        <div className="mb-4 sm:mb-6 md:mb-8 border-b border-border/80 overflow-x-auto">
          <TabsList className={`grid w-full ${isAdmin ? "grid-cols-2" : "grid-cols-1"} md:w-auto justify-start bg-transparent h-10 sm:h-12`}>
            {isAdmin && (
              <TabsTrigger value="authored" className="gap-1 sm:gap-2 text-xs sm:text-sm data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
                <FileSignature className="size-4 hidden sm:block" />
                Authored Documents
              </TabsTrigger>
            )}
            <TabsTrigger value="signees" className="gap-1 sm:gap-2 text-xs sm:text-sm data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
              <CheckCircle2 className="size-4 hidden sm:block" />
              Documents to Sign
            </TabsTrigger>
          </TabsList>
        </div>

        {isAdmin && (
          <TabsContent value="authored">
            <Card className="border-border shadow-md rounded-xl overflow-hidden">
              <CardHeader className="bg-muted/10 border-b border-border p-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 sm:gap-4">
                  <div>
                    <CardTitle className="text-xl font-semibold">Authored by You</CardTitle>
                    <CardDescription className="text-base">These are documents you have uploaded or created.</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6 space-y-6 sm:space-y-8">
                {authorDocuments.length === 0 && (
                  <div className="text-center py-12 bg-muted/5 rounded-lg border border-dashed border-border">
                    <FileSignature className="mx-auto size-12 text-muted-foreground mb-3 opacity-80" />
                    <p className="text-muted-foreground text-lg">You have not authored any documents yet.</p>
                  </div>
                )}
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {authorDocuments.map((doc) => (
                    <Card key={doc.id} className="group border-border shadow-sm transition-all duration-300 hover:shadow-xl hover:border-primary/50 hover:-translate-y-1 flex flex-col h-full">
                      <CardHeader className="pb-3 space-y-3">
                        <div className="flex flex-col xs:flex-row xs:justify-between xs:items-start gap-2 xs:gap-3">
                          <CardTitle className="truncate-2 text-base xs:text-lg font-semibold group-hover:text-primary transition-colors">{doc.title}</CardTitle>
                          <Badge
                            variant={doc.documentType === DocumentType.UNSIGNED ? "outline" : "default"}
                            className="shrink-0 shadow-sm uppercase text-[10px] px-2 xs:px-3 py-0.5 font-bold tracking-wider mt-1 xs:mt-0 text-center inline-block whitespace-nowrap"
                          >
                            {doc.documentType === DocumentType.UNSIGNED ? "Needs Signature" : "Signed"}
                          </Badge>
                        </div>
                        <CardDescription className="line-clamp-2 text-xs xs:text-sm">{doc.description ? doc.description : "No description available"}</CardDescription>
                      </CardHeader>
                      <CardContent className="pb-3 space-y-4">
                        <div className="flex items-center gap-2.5 text-xs xs:text-sm">
                          <span className="size-7 xs:size-9 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <FileSignature className="h-3 w-3 xs:h-4 xs:w-4 text-primary" />
                          </span>
                          <span className="text-muted-foreground font-medium">Status: {doc.status}</span>
                        </div>

                        <div className="bg-muted/5 rounded-lg p-2 xs:p-3 space-y-2.5">
                          <div className="flex items-center justify-between text-[11px] xs:text-xs">
                            <span className="text-muted-foreground flex items-center gap-1.5">
                              <Calendar className="h-3 w-3 xs:h-3.5 xs:w-3.5" /> Created:
                            </span>
                            <span className="font-medium">{formatDateWithTime(doc.createdAt)}</span>
                          </div>

                          <div className="flex items-center justify-between text-[11px] xs:text-xs">
                            <span className="text-muted-foreground flex items-center gap-1.5">
                              <Calendar className="h-3 w-3 xs:h-3.5 xs:w-3.5" /> Updated:
                            </span>
                            <span className="font-medium">{formatDateWithTime(doc.updatedAt)}</span>
                          </div>

                          {doc.preparedAt && (
                            <div className="flex items-center justify-between text-[11px] xs:text-xs">
                              <span className="text-muted-foreground flex items-center gap-1.5">
                                <FileSignature className="h-3 w-3 xs:h-3.5 xs:w-3.5" />
                                Prepared:
                              </span>
                              <span className="font-medium">{formatDateWithTime(doc.preparedAt)}</span>
                            </div>
                          )}

                          {doc.expiresAt && (
                            <div className="flex items-center justify-between text-[11px] xs:text-xs">
                              <span className="text-muted-foreground flex items-center gap-1.5">
                                <TimerOff className="h-3 w-3 xs:h-3.5 xs:w-3.5" /> Expires:
                              </span>
                              <span className={`font-medium ${new Date(doc.expiresAt) < new Date() ? "text-destructive" : ""}`}>{formatDateWithTime(doc.expiresAt)}</span>
                            </div>
                          )}

                          {doc.dueDate && (
                            <div className="flex items-center justify-between text-[11px] xs:text-xs">
                              <span className="text-muted-foreground flex items-center gap-1.5">
                                <AlertCircle className="h-3 w-3 xs:h-3.5 xs:w-3.5" /> Due:
                              </span>
                              <span className={`font-medium ${new Date(doc.dueDate) < new Date() ? "text-destructive" : ""}`}>{formatDateWithTime(doc.dueDate)}</span>
                            </div>
                          )}

                          {doc.signedAt && (
                            <div className="flex items-center justify-between text-[11px] xs:text-xs">
                              <span className="text-muted-foreground flex items-center gap-1.5">
                                <CheckCircle2 className="h-3 w-3 xs:h-3.5 xs:w-3.5" /> Signed:
                              </span>
                              <span className="font-medium text-emerald-500">{formatDateWithTime(doc.signedAt)}</span>
                            </div>
                          )}
                        </div>
                      </CardContent>
                      <CardFooter className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-2 border-t mt-auto">
                        <Button variant="outline" size="sm" asChild className="w-full sm:w-auto">
                          <Link href={`/documents/${doc.id}`}>
                            <Eye className="h-3 w-3 sm:h-3.5 sm:w-3.5 mr-1.5" />
                            View
                          </Link>
                        </Button>
                        {doc.documentType === DocumentType.UNSIGNED && doc.preparedAt && (
                          <Button size="sm" asChild className="w-full sm:w-auto">
                            <Link href={`/documents/${doc.id}/sign`}>
                              <FileSignature className="h-3 w-3 sm:h-3.5 sm:w-3.5 mr-1.5" />
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
        )}
        <TabsContent value="signees">
          <Card className="border-border shadow-md rounded-xl overflow-hidden">
            <CardHeader className="bg-muted/10 border-b border-border p-6">
              <CardTitle className="text-xl font-semibold">Assigned to You for Signing</CardTitle>
              <CardDescription className="text-base">These are documents that require your signature.</CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-8">
              {signeeDocuments.length === 0 && (
                <div className="text-center py-12 bg-muted/5 rounded-lg border border-dashed border-border">
                  <CheckCircle2 className="mx-auto size-12 text-muted-foreground mb-3 opacity-80" />
                  <p className="text-muted-foreground text-lg">No documents are currently assigned to you for signing.</p>
                </div>
              )}
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {signeeDocuments.map((doc) => (
                  <Card key={doc.id} className="group border-border shadow-sm transition-all duration-300 hover:shadow-xl hover:border-primary/50 hover:-translate-y-1 flex flex-col h-full">
                    <CardHeader className="pb-3 space-y-3">
                      <div className="flex flex-col xs:flex-row xs:justify-between xs:items-start gap-2 xs:gap-3">
                        <CardTitle className="truncate-2 text-base xs:text-lg font-semibold group-hover:text-primary transition-colors">{doc.title}</CardTitle>
                        <Badge
                          variant={doc.documentType === DocumentType.UNSIGNED ? "outline" : "default"}
                          className="shrink-0 shadow-sm uppercase text-[10px] px-2 xs:px-3 py-0.5 font-bold tracking-wider mt-1 xs:mt-0 text-center inline-block whitespace-nowrap"
                        >
                          {doc.documentType === DocumentType.UNSIGNED ? "Needs Signature" : "Signed"}
                        </Badge>
                      </div>
                      <CardDescription className="line-clamp-2 text-xs xs:text-sm">{doc.description ? doc.description : "No description available"}</CardDescription>
                    </CardHeader>
                    <CardContent className="pb-3 space-y-4">
                      <div className="flex items-center gap-2.5 text-xs xs:text-sm">
                        <span className="size-7 xs:size-9 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <FileSignature className="h-3 w-3 xs:h-4 xs:w-4 text-primary" />
                        </span>
                        <span className="text-muted-foreground font-medium">Status: {doc.status}</span>
                      </div>

                      <div className="bg-muted/5 rounded-lg p-2 xs:p-3 space-y-2.5">
                        <div className="flex items-center justify-between text-[11px] xs:text-xs">
                          <span className="text-muted-foreground flex items-center gap-1.5">
                            <Calendar className="h-3 w-3 xs:h-3.5 xs:w-3.5" /> Received:
                          </span>
                          <span className="font-medium">{formatDateWithTime(doc.updatedAt)}</span>
                        </div>

                        {doc.preparedAt && (
                          <div className="flex items-center justify-between text-[11px] xs:text-xs">
                            <span className="text-muted-foreground flex items-center gap-1.5">
                              <FileSignature className="h-3 w-3 xs:h-3.5 xs:w-3.5" />
                              Prepared:
                            </span>
                            <span className="font-medium">{formatDateWithTime(doc.preparedAt)}</span>
                          </div>
                        )}

                        {doc.expiresAt && (
                          <div className="flex items-center justify-between text-[11px] xs:text-xs">
                            <span className="text-muted-foreground flex items-center gap-1.5">
                              <TimerOff className="h-3 w-3 xs:h-3.5 xs:w-3.5" /> Expires:
                            </span>
                            <span className={`font-medium ${new Date(doc.expiresAt) < new Date() ? "text-destructive" : ""}`}>{formatDateWithTime(doc.expiresAt)}</span>
                          </div>
                        )}

                        {doc.dueDate && (
                          <div className="flex items-center justify-between text-[11px] xs:text-xs">
                            <span className="text-muted-foreground flex items-center gap-1.5">
                              <AlertCircle className="h-3 w-3 xs:h-3.5 xs:w-3.5" /> Due:
                            </span>
                            <span className={`font-medium ${new Date(doc.dueDate) < new Date() ? "text-destructive" : ""}`}>{formatDateWithTime(doc.dueDate)}</span>
                          </div>
                        )}

                        {doc.signedAt && (
                          <div className="flex items-center justify-between text-[11px] xs:text-xs">
                            <span className="text-muted-foreground flex items-center gap-1.5">
                              <CheckCircle2 className="h-3 w-3 xs:h-3.5 xs:w-3.5" /> Signed:
                            </span>
                            <span className="font-medium text-emerald-500">{formatDateWithTime(doc.signedAt)}</span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                    <CardFooter className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-2 border-t mt-auto">
                      <Button variant="outline" size="sm" asChild className="w-full sm:w-auto">
                        <Link href={`/documents/${doc.id}`}>
                          <Eye className="h-3 w-3 sm:h-3.5 sm:w-3.5 mr-1.5" />
                          View
                        </Link>
                      </Button>
                      {doc.documentType === DocumentType.UNSIGNED && doc.preparedAt && (
                        <Button size="sm" asChild className="w-full sm:w-auto">
                          <Link href={`/documents/${doc.id}/sign`}>
                            <FileSignature className="h-3 w-3 sm:h-3.5 sm:w-3.5 mr-1.5" />
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
