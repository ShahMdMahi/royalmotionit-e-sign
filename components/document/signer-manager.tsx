"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { HexColorPicker } from "react-colorful";
import { Signer } from "@/types/document";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Mail,
  Briefcase,
  AlertCircle,
  Plus,
  Trash,
  PaletteIcon,
} from "lucide-react";
import { handleSignerFieldsUpdate } from "@/actions/signer-manager-actions";
import { saveDocumentSigner } from "@/actions/save-document-signer";
import { deleteDocumentSigner } from "@/actions/delete-document-signer";
import { getDocumentSigner } from "@/actions/get-document-signer";
import { ensureSignerAccount } from "@/actions/signer-account";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface SignerManagerProps {
  documentId: string;
  onSignerFieldsUpdateAction?: typeof handleSignerFieldsUpdate;
}

export function SignerManager({
  documentId,
  onSignerFieldsUpdateAction = handleSignerFieldsUpdate,
}: SignerManagerProps) {
  // Generate a default color for the signer with predefined professional colors
  const generateDefaultColor = (): string => {
    // Professional color palette for document signing
    const signerColors = [
      "#3B82F6", // Blue
      "#10B981", // Green
      "#8B5CF6", // Purple
      "#F59E0B", // Amber
      "#EC4899", // Pink
      "#06B6D4", // Cyan
    ];

    // Use a consistent color for the primary signer
    return signerColors[0]; // Default to blue for primary signer
  };

  const [signer, setSigner] = useState<(Signer & { color: string }) | null>(
    null,
  );
  const [showEditSigner, setShowEditSigner] = useState(false);
  const [signerForm, setSignerForm] = useState<{
    email: string;
    name: string;
    role: string;
    color: string;
  }>({
    email: "",
    name: "",
    role: "",
    color: generateDefaultColor(),
  });
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Function to refresh signer data from the server
  const refreshSigner = async () => {
    try {
      console.log("Refreshing signer data for document", documentId);
      const result = await getDocumentSigner(documentId);

      if (result.success && result.signer) {
        // Set the signer with proper color
        const signerColor = result.signer.userAgent || generateDefaultColor();

        // Convert Prisma signer to our Signer type
        const convertedSigner: Signer & { color: string } = {
          id: result.signer.id,
          documentId: result.signer.documentId,
          email: result.signer.email,
          name: result.signer.name || undefined, // Convert null to undefined
          role: result.signer.role || undefined, // Convert null to undefined
          status: result.signer.status as
            | "PENDING"
            | "VIEWED"
            | "COMPLETED"
            | "DECLINED",
          accessCode: result.signer.accessCode || undefined,
          invitedAt: result.signer.invitedAt,
          viewedAt: result.signer.viewedAt || undefined,
          completedAt: result.signer.completedAt || undefined,
          notifiedAt: result.signer.notifiedAt || undefined,
          declinedAt: result.signer.declinedAt || undefined,
          declineReason: result.signer.declineReason || undefined,
          color: signerColor,
        };

        setSigner(convertedSigner);
        console.log("Refreshed signer data:", convertedSigner);
      } else {
        setSigner(null);
        console.log("No signer found on refresh for document", documentId);
      }
    } catch (error) {
      console.error("Failed to refresh signer data:", error);
    }
  };

  // Fetch signer for this document - on initial load only
  useEffect(() => {
    const loadSigner = async () => {
      try {
        // Use our server action to get the signer directly from the database
        const result = await getDocumentSigner(documentId);

        if (result.success && result.signer) {
          // Set the signer with proper color
          const signerColor = result.signer.userAgent || generateDefaultColor(); // userAgent stores color

          // Convert Prisma signer to our Signer type
          const convertedSigner: Signer & { color: string } = {
            id: result.signer.id,
            documentId: result.signer.documentId,
            email: result.signer.email,
            name: result.signer.name || undefined, // Convert null to undefined
            role: result.signer.role || undefined, // Convert null to undefined
            status: result.signer.status as
              | "PENDING"
              | "VIEWED"
              | "COMPLETED"
              | "DECLINED",
            accessCode: result.signer.accessCode || undefined,
            invitedAt: result.signer.invitedAt,
            viewedAt: result.signer.viewedAt || undefined,
            completedAt: result.signer.completedAt || undefined,
            notifiedAt: result.signer.notifiedAt || undefined,
            declinedAt: result.signer.declinedAt || undefined,
            declineReason: result.signer.declineReason || undefined,
            color: signerColor,
          };

          setSigner(convertedSigner);
          console.log("Loaded signer:", convertedSigner);
        } else {
          // If no signer found, ensure our state reflects that
          setSigner(null);
          console.log("No signer found for document", documentId);
        }
      } catch (error) {
        console.error("Failed to load signer:", error);
        toast.error("Failed to load signer data");
        setSigner(null);
      }
    };

    if (documentId) {
      loadSigner();
    }
  }, [documentId]); // Only depend on documentId, not signer?.id

  // Update form state when signer changes
  useEffect(() => {
    if (signer) {
      setSignerForm({
        email: signer.email,
        name: signer.name || "",
        role: signer.role || "",
        color: signer.color,
      });
    }
  }, [signer]);

  const validateEmail = (email: string): boolean => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleUpdateSigner = async () => {
    // Clear previous errors
    setValidationError(null);

    // Validate email
    if (!validateEmail(signerForm.email)) {
      setValidationError("Please enter a valid email address");
      return;
    }

    // Set saving state to true
    setIsSaving(true);

    try {
      // Try to ensure user exists - this will create an account if needed
      const signerAccount = await ensureSignerAccount(
        signerForm.email,
        signerForm.name,
      );

      if (!signerAccount.success) {
        console.error("Error ensuring signer account:", signerAccount.error);
        setValidationError("Error processing signer account");
        setIsSaving(false); // Reset saving state
        return;
      }

      // If a new user was created, show a message
      if (signerAccount.user?.isNewUser) {
        toast.info(
          `New account created for ${signerForm.email}. Login credentials have been sent by email.`,
          { duration: 5000 },
        );
      }

      // Create/update signer
      const updatedSigner: Signer & { color: string } = {
        id: signer?.id || `new-${Date.now()}`, // Use existing ID or create a new one
        documentId,
        email: signerForm.email,
        name: signerAccount.user?.name || signerForm.name || "",
        role: signerForm.role || "",
        status: "PENDING",
        color: signerForm.color,
      };

      // Save the signer to the database
      const saveResult = await saveDocumentSigner(updatedSigner);

      if (!saveResult.success || !saveResult.signer) {
        console.error("Failed to save signer:", saveResult.error);
        toast.error("Failed to save signer");
        setIsSaving(false);
        return;
      }

      console.log("Signer saved to database:", saveResult.signer);

      // Refresh signer data to ensure we have the latest from the database
      await refreshSigner();

      // Get the saved signer ID for field updates
      const signerId = saveResult.signer.id;

      // Notify about field updates
      if (onSignerFieldsUpdateAction) {
        try {
          // This will update all signature fields with the signer ID and apply styling
          const result = await onSignerFieldsUpdateAction(
            signerId,
            updatedSigner.color,
          );
          console.log("Signer fields updated:", result);
        } catch (error) {
          console.error("Error updating signature fields:", error);
          toast.error("Error linking signature fields to signer");
        }
      }

      // Close dialog
      setShowEditSigner(false);

      toast.success("Signer added successfully", {
        description: "Signature fields are now linked to this signer",
      });
      setIsSaving(false); // Reset saving state
    } catch (error) {
      console.error("Error updating signer:", error);
      setIsSaving(false); // Reset saving state on error

      // Still try to save the signer without account creation
      const updatedSigner: Signer & { color: string } = {
        id: signer?.id || `new-${Date.now()}`,
        documentId,
        email: signerForm.email,
        name: signerForm.name || "",
        role: signerForm.role || "",
        status: "PENDING",
        color: signerForm.color,
      };

      // Save the signer to the database even if account creation failed
      const saveResult = await saveDocumentSigner(updatedSigner);

      if (saveResult.success && saveResult.signer) {
        // Refresh signer data from the database
        await refreshSigner();

        // Notify about field updates
        if (onSignerFieldsUpdateAction) {
          try {
            // Try to update signature fields even in case of account creation error
            await onSignerFieldsUpdateAction(
              saveResult.signer.id,
              updatedSigner.color,
            );
          } catch (fieldUpdateError) {
            console.error(
              "Error updating field associations:",
              fieldUpdateError,
            );
          }
        }
      } else {
        console.error("Failed to save signer:", saveResult.error);
        setSigner(updatedSigner); // Use local state as fallback
      }

      setShowEditSigner(false);

      toast.success("Signer updated but user account could not be verified");
    }
  };

  const handleRemoveSigner = async () => {
    // Store the signer ID before removing the signer
    const signerId = signer?.id;

    if (!signerId || !documentId) {
      setSigner(null);
      toast.success("Signer removed");
      return;
    }

    try {
      // Delete the signer from the database
      const deleteResult = await deleteDocumentSigner(signerId, documentId);

      if (deleteResult.success) {
        // Refresh data from server to ensure state is in sync
        await refreshSigner();

        // Clear signer associations from fields
        if (onSignerFieldsUpdateAction) {
          try {
            // Pass empty string to clear field associations
            await onSignerFieldsUpdateAction("", "");
            toast.success("Signer removed and field assignments cleared");
          } catch (error) {
            console.error("Error clearing signer field associations:", error);
            toast.error(
              "Signer removed but there was an issue updating fields",
            );
          }
        } else {
          toast.success("Signer removed");
        }
      } else {
        console.error("Failed to delete signer:", deleteResult.error);
        toast.error("Failed to delete signer");
      }
    } catch (error) {
      console.error("Error removing signer:", error);
      toast.error("Failed to remove signer");
    }
  };

  const handleColorChange = (color: string) => {
    if (signer) {
      const updatedSigner = { ...signer, color };
      setSigner(updatedSigner);
      setSignerForm({ ...signerForm, color });

      // Notify about the color change
      if (onSignerFieldsUpdateAction) {
        try {
          // This will update all signature fields with the new color
          onSignerFieldsUpdateAction(updatedSigner.id, updatedSigner.color);
          console.log(
            `Updated signature fields to color ${color} for signer ${updatedSigner.id}`,
          );
        } catch (error) {
          console.error("Error updating signature field colors:", error);
        }
      }
    }
  };

  const handleSelectSigner = async () => {
    if (signer && onSignerFieldsUpdateAction) {
      await onSignerFieldsUpdateAction(signer.id, signer.color);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Document Signer</CardTitle>
        <CardDescription>Manage the document signer</CardDescription>
      </CardHeader>

      <CardContent>
        <div className="space-y-4">
          {signer ? (
            <div
              className="p-3 border rounded-lg flex flex-col gap-2 border-primary bg-primary/5 cursor-pointer"
              onClick={handleSelectSigner}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: signer.color }}
                  />
                  <span className="font-medium">
                    {signer.name || signer.email}
                  </span>
                </div>

                <div className="flex items-center space-x-1">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-7 w-7">
                        <PaletteIcon className="h-4 w-4" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <HexColorPicker
                        color={signer.color}
                        onChange={handleColorChange}
                      />
                    </PopoverContent>
                  </Popover>

                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-destructive hover:text-destructive/90"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveSigner();
                    }}
                  >
                    <Trash className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="flex items-center text-sm text-muted-foreground">
                <Mail className="h-3 w-3 mr-1" />
                {signer.email}
              </div>

              {signer.role && (
                <div className="flex items-center text-sm text-muted-foreground">
                  <Briefcase className="h-3 w-3 mr-1" />
                  {signer.role}
                </div>
              )}

              <Badge variant="outline" className="w-fit">
                Status: {signer.status}
              </Badge>
            </div>
          ) : (
            <div className="p-4 border border-dashed border-destructive rounded-lg flex flex-col items-center gap-2 bg-destructive/5">
              <AlertCircle className="h-5 w-5 text-destructive" />
              <p className="text-center text-destructive font-medium">
                No signer assigned
              </p>
              <p className="text-center text-muted-foreground text-sm">
                A signer is required before the document can be saved for
                signing.
              </p>
            </div>
          )}
        </div>

        <Dialog
          open={showEditSigner}
          onOpenChange={(open) => {
            setShowEditSigner(open);
            if (!open) {
              setIsSaving(false); // Reset saving state when dialog is closed
            }
          }}
        >
          <DialogTrigger asChild>
            <Button
              className="w-full mt-4"
              onClick={() => {
                // Pre-fill the form with existing signer data if available
                if (signer) {
                  setSignerForm({
                    email: signer.email,
                    name: signer.name || "",
                    role: signer.role || "",
                    color: signer.color,
                  });
                }
                setShowEditSigner(true);
              }}
            >
              {signer ? (
                <>
                  <PaletteIcon className="h-4 w-4 mr-2" />
                  Edit Signer
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Signer
                </>
              )}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{signer ? "Edit Signer" : "Add Signer"}</DialogTitle>
              <DialogDescription>
                {signer
                  ? "Update the document signer"
                  : "Add a signer to the document"}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  placeholder="signer@example.com"
                  value={signerForm.email}
                  onChange={(e) =>
                    setSignerForm({ ...signerForm, email: e.target.value })
                  }
                  disabled={isSaving}
                />
                {validationError && (
                  <p className="text-sm text-destructive">{validationError}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  placeholder="John Doe"
                  value={signerForm.name}
                  onChange={(e) =>
                    setSignerForm({ ...signerForm, name: e.target.value })
                  }
                  disabled={isSaving}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Input
                  id="role"
                  placeholder="Client, Agent, etc."
                  value={signerForm.role}
                  onChange={(e) =>
                    setSignerForm({ ...signerForm, role: e.target.value })
                  }
                  disabled={isSaving}
                />
              </div>

              <div className="space-y-2">
                <Label>Signer Color</Label>
                <div className="flex items-center space-x-4">
                  <div
                    className="w-10 h-10 rounded-md border"
                    style={{ backgroundColor: signerForm.color }}
                  />
                  <div
                    className={isSaving ? "opacity-50 pointer-events-none" : ""}
                  >
                    <HexColorPicker
                      color={signerForm.color}
                      onChange={(color) =>
                        !isSaving && setSignerForm({ ...signerForm, color })
                      }
                    />
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowEditSigner(false)}
                disabled={isSaving}
              >
                Cancel
              </Button>
              <Button onClick={handleUpdateSigner} disabled={isSaving}>
                {isSaving ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Saving...
                  </>
                ) : signer ? (
                  "Update Signer"
                ) : (
                  "Add Signer"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
