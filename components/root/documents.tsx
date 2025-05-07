import { Document, Role, DocumentType } from "@prisma/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface DocumentComponentProps {
  userRole: Role;
  authorDocuments: Document[];
  signeeDocuments: Document[];
}

export function DocumentsComponent({ userRole, authorDocuments, signeeDocuments }: DocumentComponentProps) {
  const isAdmin = userRole === Role.ADMIN;
  const defaultTab = isAdmin ? "authored" : "signees";

  return (
    <div className="container mx-auto py-10">
      <Tabs defaultValue={defaultTab} className="w-full">
        <TabsList className={`grid w-full ${isAdmin ? "grid-cols-2" : "grid-cols-1"}`}>
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
              <CardContent className="space-y-4">
                {authorDocuments.length === 0 && <p className="text-sm text-muted-foreground">You have not authored any documents yet.</p>}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {authorDocuments.map((doc) => (
                    <Card key={doc.id}>
                      <CardHeader>
                        <CardTitle className="truncate">{doc.title}</CardTitle>
                        <CardDescription>Description: {doc.description ? doc.description : "No description available"}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground">Status: {doc.status}</p>
                        <p className="text-sm text-muted-foreground">Type: {doc.documentType}</p>
                        <p className="text-sm text-muted-foreground">Created: {new Date(doc.createdAt).toLocaleString("en-BD", { timeZone: "Asia/Dhaka" })}</p>
                        <p className="text-sm text-muted-foreground">Updated: {new Date(doc.updatedAt).toLocaleString("en-BD", { timeZone: "Asia/Dhaka" })}</p>
                        {doc.preparedAt && <p className="text-sm text-muted-foreground">Prepared: {new Date(doc.preparedAt).toLocaleString("en-BD", { timeZone: "Asia/Dhaka" })}</p>}
                        {doc.expiresAt && <p className="text-sm text-muted-foreground">Expires: {new Date(doc.expiresAt).toLocaleString("en-BD", { timeZone: "Asia/Dhaka" })}</p>}
                        {doc.dueDate && <p className="text-sm text-muted-foreground">Due: {new Date(doc.dueDate).toLocaleString("en-BD", { timeZone: "Asia/Dhaka" })}</p>}
                        {doc.signedAt && <p className="text-sm text-muted-foreground">Signed: {new Date(doc.signedAt).toLocaleString("en-BD", { timeZone: "Asia/Dhaka" })}</p>}
                      </CardContent>
                      <CardFooter className="flex justify-end space-x-2">
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/documents/${doc.id}`}>View</Link>
                        </Button>
                        {/* Add other actions like Edit, Delete, Share as needed */}
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
            <CardContent className="space-y-4">
              {signeeDocuments.length === 0 && <p className="text-sm text-muted-foreground">No documents are currently assigned to you for signing.</p>}
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {signeeDocuments.map((doc) => (
                  <Card key={doc.id}>
                    <CardHeader>
                      <CardTitle className="truncate">{doc.title}</CardTitle>
                      <CardDescription>Description: {doc.description ? doc.description : "No description available"}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">Status: {doc.status}</p>
                      <p className="text-sm text-muted-foreground">Type: {doc.documentType}</p>
                      <p className="text-sm text-muted-foreground">Received: {new Date(doc.updatedAt).toLocaleString("en-BD", { timeZone: "Asia/Dhaka" })}</p>
                      {doc.preparedAt && <p className="text-sm text-muted-foreground">Prepared: {new Date(doc.preparedAt).toLocaleString("en-BD", { timeZone: "Asia/Dhaka" })}</p>}
                      {doc.expiresAt && <p className="text-sm text-muted-foreground">Expires: {new Date(doc.expiresAt).toLocaleString("en-BD", { timeZone: "Asia/Dhaka" })}</p>}
                      {doc.dueDate && <p className="text-sm text-muted-foreground">Due: {new Date(doc.dueDate).toLocaleString("en-BD", { timeZone: "Asia/Dhaka" })}</p>}
                      {doc.signedAt && <p className="text-sm text-muted-foreground">Signed: {new Date(doc.signedAt).toLocaleString("en-BD", { timeZone: "Asia/Dhaka" })}</p>}
                    </CardContent>
                    <CardFooter className="flex justify-end space-x-2">
                      {doc.documentType === DocumentType.UNSIGNED ? (
                        <Button size="sm" asChild>
                          <Link href={`/documents/${doc.id}?action=sign`}>Sign</Link>
                        </Button>
                      ) : (
                        <Button size="sm" disabled>
                          Signed
                        </Button>
                      )}
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/documents/${doc.id}`}>View</Link>
                      </Button>
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
