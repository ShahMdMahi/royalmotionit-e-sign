"use client";

import Image from "next/image";
import { AlertTriangle, Clock, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Card } from "@/components/ui/card";

export default function Maintenance() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 text-center">
      <Card className="max-w-md w-full p-4 sm:p-6 shadow-lg border border-border">
        <div className="mb-4 sm:mb-6 flex justify-center">
          <Image
            src="/icon_logo.png"
            alt="Royal Sign"
            width={40}
            height={40}
            className="sm:w-[50px] sm:h-[50px]"
          />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-bold gradient-text">
            Maintenance Mode
          </h1>
          <Separator className="my-3 sm:my-4" />

          <div className="flex items-center justify-center gap-2 text-amber-500 my-3 sm:my-4">
            <AlertTriangle className="h-5 w-5 sm:h-6 sm:w-6" />
            <Wrench className="h-5 w-5 sm:h-6 sm:w-6" />
          </div>

          <p className="text-base sm:text-lg text-muted-foreground">
            Our system is currently undergoing scheduled maintenance.
          </p>
          <p className="text-xs sm:text-sm text-muted-foreground mb-4 sm:mb-6">
            We&apos;re working to improve your experience. Please check back
            soon.
          </p>
        </div>

        <div className="mt-4 sm:mt-6 flex flex-col gap-3 sm:gap-4">
          <div className="flex items-center justify-center gap-1.5 sm:gap-2 text-muted-foreground">
            <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            <span className="text-xs sm:text-sm">
              Expected completion: Shortly
            </span>
          </div>

          <Button
            variant="outline"
            className="w-full text-sm sm:text-base h-9 sm:h-10"
            onClick={() => window.location.reload()}
          >
            Refresh Page
          </Button>
        </div>
      </Card>

      <p className="mt-6 sm:mt-8 text-xs sm:text-sm text-muted-foreground">
        Royal Sign — Digital Document Signing
      </p>
    </div>
  );
}
