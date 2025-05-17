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
import { Badge } from "@/components/ui/badge";
import { getUserByEmail } from "@/actions/user-minimal";
import { toast } from "sonner";
import {
  Plus,
  Trash,
  MoveUp,
  MoveDown,
  PaletteIcon,
  Mail,
  Briefcase,
} from "lucide-react";
import { handleSignerFieldsUpdate } from "@/actions/signer-manager-actions";

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

  // Fetch signer for this document
  useEffect(() => {
    const loadSigner = async () => {
      try {
        // This would typically be an API call to get the signer for this document
        // For now we'll use mock data - just a single signer
        setSigner({
          id: "signer1",
          documentId,
          email: "signer1@example.com",
          name: "John Doe",
          role: "Client",
          status: "PENDING",
          color: "#3B82F6", // Blue
        });

        // Set the form state to match the signer's data if it exists
        if (signer) {
          setSignerForm({
            email: signer.email,
            name: signer.name || "",
            role: signer.role || "",
            color: signer.color,
          });
        }
      } catch (error) {
        console.error("Failed to load signer:", error);
        toast.error("Failed to load signer");
      }
    };

    loadSigner();
  }, [documentId, signer?.id]);

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

    try {
      // Try to get user info if they're registered
      const userInfo = await getUserByEmail(signerForm.email);

      // Create/update signer
      const updatedSigner: Signer & { color: string } = {
        id: signer?.id || `new-${Date.now()}`, // Use existing ID or create a new one
        documentId,
        email: signerForm.email,
        name: userInfo?.name || signerForm.name || "",
        role: signerForm.role || "",
        status: "PENDING",
        color: signerForm.color,
      };

      // Update the signer
      setSigner(updatedSigner);

      // Notify about field updates
      if (onSignerFieldsUpdateAction) {
        await onSignerFieldsUpdateAction(updatedSigner.id, updatedSigner.color);
      }

      // Close dialog
      setShowEditSigner(false);

      toast.success("Signer updated successfully");
    } catch (error) {
      console.error("Error updating signer:", error);

      // Still update the signer with provided info
      const updatedSigner: Signer & { color: string } = {
        id: signer?.id || `new-${Date.now()}`,
        documentId,
        email: signerForm.email,
        name: signerForm.name || "",
        role: signerForm.role || "",
        status: "PENDING",
        color: signerForm.color,
      };

      setSigner(updatedSigner);
      setShowEditSigner(false);

      // Notify about field updates
      if (onSignerFieldsUpdateAction) {
        onSignerFieldsUpdateAction(updatedSigner.id, updatedSigner.color);
      }

      toast.success("Signer updated successfully");
    }
  };

  const handleRemoveSigner = () => {
    setSigner(null);

    // Notify about field updates with null values
    if (onSignerFieldsUpdateAction) {
      onSignerFieldsUpdateAction("", "");
    }

    toast.success("Signer removed");
  };

  const handleColorChange = (color: string) => {
    if (signer) {
      const updatedSigner = { ...signer, color };
      setSigner(updatedSigner);
      setSignerForm({ ...signerForm, color });

      // Notify about the color change
      if (onSignerFieldsUpdateAction) {
        onSignerFieldsUpdateAction(updatedSigner.id, updatedSigner.color);
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
            <div className="py-6 text-center text-muted-foreground">
              No signer assigned yet. Add a signer to assign fields.
            </div>
          )}
        </div>

        <Dialog open={showEditSigner} onOpenChange={setShowEditSigner}>
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
                />
              </div>

              <div className="space-y-2">
                <Label>Signer Color</Label>
                <div className="flex items-center space-x-4">
                  <div
                    className="w-10 h-10 rounded-md border"
                    style={{ backgroundColor: signerForm.color }}
                  />
                  <HexColorPicker
                    color={signerForm.color}
                    onChange={(color) =>
                      setSignerForm({ ...signerForm, color })
                    }
                  />
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowEditSigner(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleUpdateSigner}>
                {signer ? "Update Signer" : "Add Signer"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
