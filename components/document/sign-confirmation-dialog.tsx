"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle, CheckCircle } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

interface SignConfirmationDialogProps {
  open: boolean;
  onOpenChangeAction: (open: boolean) => void; // Renamed to end with Action to fix serialization warning
  onConfirmAction: () => void; // Already renamed to indicate this is a server action
  documentTitle: string;
  isLoading: boolean;
}

export function SignConfirmationDialog({ open, onOpenChangeAction, onConfirmAction, documentTitle, isLoading }: SignConfirmationDialogProps) {
  const [agreement, setAgreement] = useState(false);

  const handleConfirm = () => {
    if (!agreement) return;
    onConfirmAction();
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChangeAction}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-primary" />
            Confirm Document Signing
          </DialogTitle>
          <DialogDescription>You are about to electronically sign &quot;{documentTitle}&quot;. This action cannot be undone.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-3">
          <div className="rounded-md bg-amber-50 p-3">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-amber-800">Legal Notice</h3>
                <div className="mt-2 text-sm text-amber-700">
                  <p>By clicking &quot;Sign Document&quot;, you agree that your electronic signature is the legal equivalent of your manual signature on this document.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2 pt-2">
            <Checkbox id="agreement" checked={agreement} onCheckedChange={(checked) => setAgreement(checked === true)} />
            <Label htmlFor="agreement" className="text-sm text-muted-foreground">
              I understand that this is a legally binding signature and I consent to electronically sign this document.
            </Label>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChangeAction(false)} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={!agreement || isLoading} className="relative">
            {isLoading ? (
              <>
                <span className="opacity-0">Sign Document</span>
                <span className="absolute inset-0 flex items-center justify-center">
                  <span className="h-4 w-4 border-t-2 border-primary border-r-2 animate-spin rounded-full" />
                </span>
              </>
            ) : (
              "Sign Document"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
