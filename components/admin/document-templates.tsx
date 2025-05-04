import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Check, LayoutTemplate, Plus, Trash2 } from "lucide-react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";

export interface DocumentTemplate {
  id: string;
  name: string;
  description: string;
  createdAt: Date;
  fields: any[]; // Template fields
  workflow?: {
    signers: { order: number; role: string }[];
    expiryDays: number;
    messageTemplate: string;
  };
}

interface DocumentTemplatesProps {
  templates: DocumentTemplate[];
  onSelectTemplate: (template: DocumentTemplate) => void;
  onSaveTemplate: (template: Omit<DocumentTemplate, "id" | "createdAt">) => Promise<void>;
  onDeleteTemplate: (templateId: string) => Promise<void>;
  currentFields: any[];
  currentWorkflow?: {
    signers: { order: number; role: string }[];
    expiryDays: number;
    messageTemplate: string;
  };
}

export function DocumentTemplates({
  templates,
  onSelectTemplate,
  onSaveTemplate,
  onDeleteTemplate,
  currentFields,
  currentWorkflow,
}: DocumentTemplatesProps) {
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [templateName, setTemplateName] = useState("");
  const [templateDescription, setTemplateDescription] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSaveTemplate = async () => {
    if (!templateName) {
      toast.error("Please provide a template name");
      return;
    }

    setIsLoading(true);
    try {
      await onSaveTemplate({
        name: templateName,
        description: templateDescription,
        fields: currentFields,
        workflow: currentWorkflow,
      });
      toast.success("Template saved successfully");
      setShowSaveDialog(false);
      setTemplateName("");
      setTemplateDescription("");
    } catch (error) {
      toast.error("Failed to save template");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-medium">Document Templates</h2>
        <Button
          variant="outline"
          size="sm"
          className="gap-1"
          onClick={() => setShowSaveDialog(true)}
        >
          <Plus className="h-4 w-4" />
          Save Current Layout
        </Button>
      </div>

      {templates.length === 0 ? (
        <div className="bg-muted/30 rounded-lg border p-6 text-center">
          <LayoutTemplate className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
          <h3 className="font-medium mb-1">No templates yet</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Save your current document layout as a template to reuse it later
          </p>
          <Button
            size="sm"
            variant="secondary"
            className="gap-1"
            onClick={() => setShowSaveDialog(true)}
          >
            <Plus className="h-4 w-4" />
            Create Template
          </Button>
        </div>
      ) : (
        <ScrollArea className="h-[300px]">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pr-4">
            {templates.map((template) => (
              <Card key={template.id} className="border">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center justify-between">
                    <span>{template.name}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-destructive"
                      onClick={async () => {
                        if (confirm("Are you sure you want to delete this template?")) {
                          try {
                            await onDeleteTemplate(template.id);
                            toast.success("Template deleted");
                          } catch (error) {
                            toast.error("Failed to delete template");
                          }
                        }
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </CardTitle>
                  <p className="text-xs text-muted-foreground">
                    {new Date(template.createdAt).toLocaleDateString()}
                    {" • "}
                    {template.fields.length} fields
                    {template.workflow?.signers?.length ? ` • ${template.workflow.signers.length} signers` : ""}
                  </p>
                </CardHeader>
                <CardContent className="text-sm py-2">
                  <p className="line-clamp-2 text-muted-foreground text-xs">
                    {template.description || "No description provided"}
                  </p>
                </CardContent>
                <CardFooter className="pt-0">
                  <Button
                    size="sm"
                    variant="secondary"
                    className="w-full gap-1"
                    onClick={() => onSelectTemplate(template)}
                  >
                    <Check className="h-3 w-3" />
                    Use Template
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </ScrollArea>
      )}

      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save as Template</DialogTitle>
            <DialogDescription>
              Save your current document layout and workflow as a template to reuse it later
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-3">
            <div className="space-y-2">
              <Label htmlFor="template-name">Template Name</Label>
              <Input
                id="template-name"
                placeholder="Enter template name"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="template-description">Description (optional)</Label>
              <Textarea
                id="template-description"
                placeholder="Enter a description for this template..."
                value={templateDescription}
                onChange={(e) => setTemplateDescription(e.target.value)}
                className="resize-none h-20"
              />
            </div>

            <div className="text-sm">
              <p className="text-muted-foreground">This template will include:</p>
              <ul className="list-disc list-inside mt-1 text-xs space-y-1">
                <li>All current document fields and their positions ({currentFields.length} fields)</li>
                {currentWorkflow && currentWorkflow.signers && currentWorkflow.signers.length > 0 && (
                  <li>Signing workflow with {currentWorkflow.signers.length} signers</li>
                )}
                {currentWorkflow && currentWorkflow.messageTemplate && <li>Message template</li>}
              </ul>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSaveDialog(false)} disabled={isLoading}>
              Cancel
            </Button>
            <Button onClick={handleSaveTemplate} disabled={!templateName || isLoading}>
              {isLoading ? "Saving..." : "Save Template"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}