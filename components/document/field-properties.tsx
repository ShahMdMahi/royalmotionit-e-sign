"use client";

import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { DocumentField, Signer } from "@/types/document";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { HexColorPicker } from "react-colorful";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Info } from "lucide-react";
import {
  handleFieldPropertiesUpdate,
  handleFieldPropertiesClose,
} from "@/actions/field-properties-actions";

interface FieldPropertiesProps {
  field: DocumentField;
  signers?: Signer[];
  availableFieldIds?: string[];
  onUpdateAction?: typeof handleFieldPropertiesUpdate;
  onCloseAction?: typeof handleFieldPropertiesClose;
}

export function FieldProperties({
  field,
  signers = [],
  availableFieldIds = [],
  onUpdateAction = handleFieldPropertiesUpdate,
  onCloseAction = handleFieldPropertiesClose,
}: FieldPropertiesProps) {
  const [localField, setLocalField] = useState<DocumentField>({ ...field });
  const [validationError, setValidationError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>("general");

  // Parse conditional logic if it exists
  const [conditionalLogic, setConditionalLogic] = useState<{
    fieldId?: string;
    condition?: string;
    value?: string;
    action?: string;
  }>(() => {
    try {
      if (localField.conditionalLogic) {
        const parsed = JSON.parse(localField.conditionalLogic);
        return {
          fieldId: parsed.condition?.fieldId,
          condition: parsed.condition?.type,
          value: parsed.condition?.value,
          action: parsed.action?.type,
        };
      }
    } catch (e) {
      console.error("Error parsing conditional logic", e);
    }
    return {};
  });

  const handleChange = (
    key: keyof DocumentField,
    value: string | number | boolean | undefined,
  ) => {
    setLocalField((prev) => ({
      ...prev,
      [key]: value,
    }));

    // Clear validation error when field is updated
    if (validationError) {
      setValidationError(null);
    }
  };

  // Handle signer selection and update the color accordingly
  const handleSignerChange = (signerId: string) => {
    const selectedSigner = signers.find((s) => s.id === signerId);

    setLocalField((prev) => ({
      ...prev,
      signerId,
      color: selectedSigner?.color || prev.color,
    }));
  };

  // Update JSON for conditional logic
  const updateConditionalLogic = (key: string, value: string) => {
    const updatedLogic = { ...conditionalLogic, [key]: value };
    setConditionalLogic(updatedLogic);

    // Only save logic if we have at least a field and condition
    if (updatedLogic.fieldId && updatedLogic.condition) {
      const logicObject = {
        condition: {
          type: updatedLogic.condition,
          fieldId: updatedLogic.fieldId,
          value: updatedLogic.value || "",
        },
        action: {
          type: updatedLogic.action || "show",
        },
        targetFieldId: localField.id,
      };

      handleChange("conditionalLogic", JSON.stringify(logicObject));
    } else {
      // Clear conditional logic if missing required parts
      handleChange("conditionalLogic", undefined);
    }
  };

  const handleSubmit = async () => {
    // Validate field before submitting
    if (localField.required && !localField.signerId) {
      setValidationError("Required fields must be assigned to a signer");
      return;
    }

    await onUpdateAction(localField);
    await onCloseAction();
  };

  // Render different property forms based on field type
  const renderFieldTypeSpecificProperties = () => {
    switch (localField.type) {
      case "text":
      case "email":
      case "phone":
      case "number":
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="placeholder">Placeholder</Label>
                <Input
                  id="placeholder"
                  value={localField.placeholder || ""}
                  onChange={(e) => handleChange("placeholder", e.target.value)}
                  placeholder="Enter placeholder text"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="fontSize">Font Size</Label>
                <Input
                  id="fontSize"
                  type="number"
                  value={localField.fontSize || 12}
                  onChange={(e) =>
                    handleChange("fontSize", parseInt(e.target.value))
                  }
                  placeholder="12"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="fontFamily">Font Family</Label>
              <Select
                value={localField.fontFamily || "Inter"}
                onValueChange={(value) => handleChange("fontFamily", value)}
              >
                <SelectTrigger id="fontFamily">
                  <SelectValue placeholder="Select font" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Inter">Inter</SelectItem>
                  <SelectItem value="Arial">Arial</SelectItem>
                  <SelectItem value="Times New Roman">
                    Times New Roman
                  </SelectItem>
                  <SelectItem value="Courier New">Courier New</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Text Validation</Label>
              <Select
                value={localField.validationRule || "none"}
                onValueChange={(value) => handleChange("validationRule", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select validation" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="email">Email Format</SelectItem>
                  <SelectItem value="numeric">Numbers Only</SelectItem>
                  <SelectItem value="alpha">Letters Only</SelectItem>
                  <SelectItem value="alphanumeric">Alphanumeric</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        );

      case "signature":
      case "initial":
        return (
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="requireSignature"
                checked={localField.required}
                onCheckedChange={(checked) => handleChange("required", checked)}
              />
              <Label htmlFor="requireSignature">
                Require {localField.type}
              </Label>
            </div>

            <div className="space-y-2">
              <Label>Signature Style</Label>
              <Select defaultValue="draw">
                <SelectTrigger>
                  <SelectValue placeholder="Signature style" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draw">Draw</SelectItem>
                  <SelectItem value="type">Type</SelectItem>
                  <SelectItem value="upload">Upload Image</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        );

      case "date":
        return (
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="autoDate"
                checked={!!localField.value}
                onCheckedChange={(checked) => {
                  if (checked) {
                    handleChange("value", "{{current_date}}");
                  } else {
                    handleChange("value", undefined);
                  }
                }}
              />
              <Label htmlFor="autoDate">Use current date when signed</Label>
            </div>

            <div className="space-y-2">
              <Label>Date Format</Label>
              <Select defaultValue="MM/DD/YYYY">
                <SelectTrigger>
                  <SelectValue placeholder="Date format" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                  <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                  <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                  <SelectItem value="MMM DD, YYYY">MMM DD, YYYY</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        );

      case "dropdown":
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="options">Dropdown Options</Label>
              <div className="space-y-2">
                <Input
                  placeholder="Enter options separated by commas"
                  value={localField.options || ""}
                  onChange={(e) => {
                    const optionsString = e.target.value;
                    handleChange("options", optionsString);
                  }}
                />
                <p className="text-xs text-muted-foreground">
                  Enter comma-separated values, e.g., &quot;Option 1, Option
                  2&quot;
                </p>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Sheet open={!!field} onOpenChange={(open) => !open && onCloseAction()}>
      <SheetContent className="w-full sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>Field Properties: {localField.label}</SheetTitle>
          <SheetDescription>
            Configure the selected field&apos;s properties and behavior
          </SheetDescription>
        </SheetHeader>

        {validationError && (
          <Alert className="mt-4 text-red-500">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{validationError}</AlertDescription>
          </Alert>
        )}

        <div className="py-4">
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
            <TabsList className="w-full grid grid-cols-3">
              <TabsTrigger value="general">General</TabsTrigger>
              <TabsTrigger value="appearance">Appearance</TabsTrigger>
              <TabsTrigger value="conditional">Conditional Logic</TabsTrigger>
            </TabsList>

            <TabsContent value="general" className="mt-4 space-y-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="label">Field Label</Label>
                  <Input
                    id="label"
                    value={localField.label}
                    onChange={(e) => handleChange("label", e.target.value)}
                    placeholder="Enter field label"
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="required"
                    checked={localField.required}
                    onCheckedChange={(checked) =>
                      handleChange("required", !!checked)
                    }
                  />
                  <Label htmlFor="required">Required Field</Label>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signer">Assign to Signer</Label>
                  <Select
                    value={localField.signerId || ""}
                    onValueChange={handleSignerChange}
                  >
                    <SelectTrigger id="signer">
                      <SelectValue placeholder="Select a signer" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Unassigned</SelectItem>
                      {signers.map((signer) => (
                        <SelectItem key={signer.id} value={signer.id}>
                          {signer.name || signer.email}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {renderFieldTypeSpecificProperties()}
              </div>
            </TabsContent>

            <TabsContent value="appearance" className="mt-4 space-y-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Field Color</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start"
                        style={{
                          backgroundColor:
                            localField.backgroundColor || "transparent",
                          borderColor: localField.color || "#000000",
                          color: localField.textColor || "#000000",
                        }}
                      >
                        <div
                          className="h-4 w-4 rounded border mr-2"
                          style={{
                            backgroundColor: localField.color || "#000000",
                          }}
                        />
                        {localField.color || "Select color"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-64">
                      <div className="space-y-2">
                        <HexColorPicker
                          color={localField.color || "#000000"}
                          onChange={(color) => handleChange("color", color)}
                        />
                        <Input
                          value={localField.color || "#000000"}
                          onChange={(e) =>
                            handleChange("color", e.target.value)
                          }
                        />
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label>Background Color</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start"
                      >
                        <div
                          className="h-4 w-4 rounded border mr-2"
                          style={{
                            backgroundColor:
                              localField.backgroundColor || "transparent",
                          }}
                        />
                        {localField.backgroundColor || "Select background"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-64">
                      <div className="space-y-2">
                        <HexColorPicker
                          color={localField.backgroundColor || "#ffffff"}
                          onChange={(color) =>
                            handleChange("backgroundColor", color)
                          }
                        />
                        <Input
                          value={localField.backgroundColor || "#ffffff"}
                          onChange={(e) =>
                            handleChange("backgroundColor", e.target.value)
                          }
                        />
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="conditional" className="mt-4 space-y-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="conditional-field">
                    Show this field based on:
                  </Label>
                  <Select
                    value={conditionalLogic.fieldId || ""}
                    onValueChange={(value) =>
                      updateConditionalLogic("fieldId", value)
                    }
                  >
                    <SelectTrigger id="conditional-field">
                      <SelectValue placeholder="Select a field" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">
                        No condition (always show)
                      </SelectItem>
                      {availableFieldIds
                        .filter((id) => id !== localField.id) // Don't allow self-reference
                        .map((fieldId) => (
                          <SelectItem key={fieldId} value={fieldId}>
                            {fieldId}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>

                {conditionalLogic.fieldId && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="condition-type">Condition</Label>
                      <Select
                        value={conditionalLogic.condition || "equals"}
                        onValueChange={(value) =>
                          updateConditionalLogic("condition", value)
                        }
                      >
                        <SelectTrigger id="condition-type">
                          <SelectValue placeholder="Select condition" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="equals">Equals</SelectItem>
                          <SelectItem value="notEquals">Not Equals</SelectItem>
                          <SelectItem value="contains">Contains</SelectItem>
                          <SelectItem value="notContains">
                            Does Not Contain
                          </SelectItem>
                          <SelectItem value="isEmpty">Is Empty</SelectItem>
                          <SelectItem value="isNotEmpty">
                            Is Not Empty
                          </SelectItem>
                          <SelectItem value="isChecked">Is Checked</SelectItem>
                          <SelectItem value="isNotChecked">
                            Is Not Checked
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {conditionalLogic.condition &&
                      ![
                        "isEmpty",
                        "isNotEmpty",
                        "isChecked",
                        "isNotChecked",
                      ].includes(conditionalLogic.condition) && (
                        <div className="space-y-2">
                          <Label htmlFor="condition-value">Value</Label>
                          <Input
                            id="condition-value"
                            value={conditionalLogic.value || ""}
                            onChange={(e) =>
                              updateConditionalLogic("value", e.target.value)
                            }
                            placeholder="Enter value"
                          />
                        </div>
                      )}

                    <div className="space-y-2">
                      <Label htmlFor="action">Action</Label>
                      <Select
                        value={conditionalLogic.action || "show"}
                        onValueChange={(value) =>
                          updateConditionalLogic("action", value)
                        }
                      >
                        <SelectTrigger id="action">
                          <SelectValue placeholder="Select action" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="show">Show this field</SelectItem>
                          <SelectItem value="hide">Hide this field</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <Alert>
                      <Info className="h-4 w-4" />
                      <AlertDescription>
                        This field will{" "}
                        {conditionalLogic.action === "hide"
                          ? "be hidden"
                          : "only appear"}
                        {conditionalLogic.condition &&
                          ` when field ${conditionalLogic.fieldId} ${conditionalLogic.condition}`}
                        {conditionalLogic.value &&
                          conditionalLogic.condition &&
                          ![
                            "isEmpty",
                            "isNotEmpty",
                            "isChecked",
                            "isNotChecked",
                          ].includes(conditionalLogic.condition) &&
                          ` "${conditionalLogic.value}"`}
                        .
                      </AlertDescription>
                    </Alert>
                  </>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <Button variant="outline" onClick={() => onCloseAction()}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>Save Changes</Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
