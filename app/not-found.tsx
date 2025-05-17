import Link from "next/link";
import { Button } from "@/components/ui/button";
import { FileX, ArrowLeft, Home } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata = {
  title: "Not Found - Royal Sign - RoyalMotionIT",
  description: "The page you are looking for does not exist.",
};

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] container max-w-md px-4 py-12 text-center">
      <div className="flex size-16 items-center justify-center rounded-full gradient-bg text-white mb-6">
        <FileX className="size-8" />
      </div>

      <h1 className="text-3xl font-bold tracking-tight mb-2">Page Not Found</h1>
      <p className="text-muted-foreground mb-8">
        The page you are looking for doesn&apos;t exist or has been moved.
      </p>

      <Card className="card-hover border-none shadow-lg w-full">
        <CardHeader>
          <CardTitle>Looking for something?</CardTitle>
          <CardDescription>
            Here are some helpful links to get you back on track.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-3">
            <Button asChild className="w-full justify-start gap-2">
              <Link href="/">
                <Home className="size-4" />
                Return Home
              </Link>
            </Button>
            <Button
              variant="outline"
              asChild
              className="w-full justify-start gap-2"
            >
              <Link href="/dashboard">
                <ArrowLeft className="size-4" />
                Go to Dashboard
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
