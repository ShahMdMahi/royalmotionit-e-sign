import { FileSignature, Loader2 } from "lucide-react";

export default function Loading() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center space-y-6">
        {/* Logo and Spinner */}
        <div className="flex items-center justify-center">
          <div className="relative">
            <FileSignature className="h-12 w-12 text-primary animate-pulse" />
            <Loader2 className="h-6 w-6 text-primary/60 animate-spin absolute -top-1 -right-1" />
          </div>
        </div>

        {/* Loading Text */}
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold text-foreground">Loading...</h2>
          <p className="text-muted-foreground">Please wait while we prepare your experience</p>
        </div>

        {/* Loading Bar */}
        <div className="w-64 mx-auto">
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-primary rounded-full animate-pulse"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
