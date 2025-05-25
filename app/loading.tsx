import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { FileSignature, Loader2 } from "lucide-react";

export default function Loading() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-4xl space-y-6">
        {/* Header Loading */}
        <div className="text-center space-y-3">
          <div className="flex items-center justify-center space-x-2">
            <div className="relative">
              <FileSignature className="h-8 w-8 text-primary animate-pulse" />
              <Loader2 className="h-4 w-4 text-primary/60 animate-spin absolute -top-1 -right-1" />
            </div>
          </div>
          <Skeleton className="h-8 w-48 mx-auto" />
          <Skeleton className="h-4 w-64 mx-auto" />
        </div>
        {/* Main Content Loading */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Sidebar Loading */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent className="space-y-3">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </CardContent>
            </Card>
          </div>

          {/* Main Document Area Loading */}
          <div className="lg:col-span-2 space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <Skeleton className="h-7 w-40" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                  <div className="flex space-x-2">
                    <Skeleton className="h-9 w-20" />
                    <Skeleton className="h-9 w-20" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {/* Document Preview Loading */}
                <div className="aspect-[3/4] bg-muted rounded-lg flex items-center justify-center">
                  <div className="text-center space-y-4">
                    <div className="relative mx-auto w-16 h-16">
                      <div className="absolute inset-0 border-4 border-primary/20 rounded-full"></div>
                      <div className="absolute inset-0 border-4 border-transparent border-t-primary rounded-full animate-spin"></div>
                    </div>
                    <div className="space-y-2">
                      <Skeleton className="h-5 w-32 mx-auto" />
                      <Skeleton className="h-4 w-40 mx-auto" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
        {/* Footer Actions Loading */}
        <div className="flex items-center justify-between p-4 border rounded-lg bg-card">
          <div className="flex items-center space-x-3">
            <Skeleton className="h-9 w-20" />
            <Skeleton className="h-4 w-32" />
          </div>
          <div className="flex space-x-2">
            <Skeleton className="h-9 w-24" />
            <Skeleton className="h-9 w-24" />
          </div>
        </div>
        {/* Loading Status */}
        <div className="text-center">
          <div className="inline-flex items-center space-x-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Loading...</span>
          </div>
        </div>
      </div>
    </div>
  );
}
