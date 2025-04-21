"use client";

import Image from "next/image";
import { AlertTriangle, Clock, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Card } from "@/components/ui/card";

export default function Maintenance() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 text-center">
      <Card className="max-w-md w-full p-6 shadow-lg border border-border">
        <div className="mb-6 flex justify-center">
          <Image src="/icon_logo.png" alt="Royal Sign" width={50} height={50} />
        </div>

        <div className="space-y-2">
          <h1 className="text-3xl font-bold gradient-text">Maintenance Mode</h1>
          <Separator className="my-4" />

          <div className="flex items-center justify-center gap-2 text-amber-500 my-4">
            <AlertTriangle className="h-6 w-6" />
            <Wrench className="h-6 w-6" />
          </div>

          <p className="text-lg text-muted-foreground">Our system is currently undergoing scheduled maintenance.</p>
          <p className="text-sm text-muted-foreground mb-6">We're working to improve your experience. Please check back soon.</p>
        </div>

        <div className="mt-6 flex flex-col gap-4">
          <div className="flex items-center justify-center gap-2 text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span className="text-sm">Expected completion: Shortly</span>
          </div>

          <Button variant="outline" className="w-full" onClick={() => window.location.reload()}>
            Refresh Page
          </Button>
        </div>
      </Card>

      <p className="mt-8 text-sm text-muted-foreground">Royal Sign — Digital Document Signing</p>
    </div>
  );
}
