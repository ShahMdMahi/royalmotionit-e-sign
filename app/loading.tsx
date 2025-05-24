"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { FileText } from "lucide-react";

export default function Loading() {
  return (
    <div className="container max-w-7xl mx-auto my-8 px-4">
      <Card className="w-full border-border shadow-lg">
        <CardHeader className="border-b border-border">
          <CardTitle className="text-xl sm:text-2xl font-semibold flex items-center gap-2">
            <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center">
              <FileText className="size-4 text-primary" />
            </div>
            Loading Content...
          </CardTitle>
          <CardDescription>Please wait while we prepare your content.</CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <div className="flex flex-col justify-center items-center h-[60vh] space-y-6">
            <div className="relative w-full max-w-md">
              <Progress value={60} className="h-2" />
              <div className="absolute top-0 left-0 right-0 bottom-0 flex items-center justify-center">
                <div className="w-6 h-6 rounded-full bg-primary animate-pulse"></div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-md animate-pulse">
              <div className="h-12 bg-muted/50 rounded-md"></div>
              <div className="h-12 bg-muted/50 rounded-md"></div>
              <div className="h-12 bg-muted/50 rounded-md sm:col-span-2"></div>
              <div className="h-12 bg-muted/50 rounded-md"></div>
              <div className="h-12 bg-muted/50 rounded-md"></div>
            </div>

            <p className="text-muted-foreground">Retrieving your data...</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
