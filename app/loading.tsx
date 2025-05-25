"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
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
        </CardHeader>{" "}
        <CardContent className="p-6">
          <div className="flex flex-col justify-center items-center h-[60vh] space-y-6">
            {/* Main content skeleton */}
            <div className="w-full max-w-md space-y-4">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-8 w-3/4 mx-auto" />
              <Skeleton className="h-6 w-1/2 mx-auto" />
            </div>

            {/* Grid skeleton layout */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-md">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full sm:col-span-2" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>

            {/* Text skeleton */}
            <Skeleton className="h-4 w-48" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
