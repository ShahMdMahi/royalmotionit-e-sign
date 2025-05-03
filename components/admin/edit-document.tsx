"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Document, User } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { FileWarning, FileText, TextCursor, Pencil, ListChecks, Calendar, Mail, Type, Save, UserCheck, Signature, Trash2, Settings, ArrowLeft, Undo, Redo, Plus } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { getFromR2 } from "@/actions/r2";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

// Import the PDFViewer and PDFViewerProps dynamically
import type { PDFViewerProps } from "@/components/admin/pdf-viewer";

const PDFViewer = dynamic<PDFViewerProps>(() => import("@/components/admin/pdf-viewer"), {
  ssr: false,
  loading: () => (
    <div className="flex flex-col items-center justify-center h-[500px] w-full">
      <div className="h-8 w-8 animate-spin text-primary mb-2 border-2 border-current border-t-transparent rounded-full" />
      <p className="text-sm text-muted-foreground">Loading PDF viewer...</p>
    </div>
  ),
});

// Define field types
type FieldType = "text" | "email" | "date" | "checkbox" | "signature" | "name" | "phone" | "address";

interface FormField {
  id: string;
  type: FieldType;
  label: string;
  required: boolean;
  position?: { x: number; y: number; width: number; height: number; pageNumber: number };
  placeholder?: string;
}

interface DocumentPrepareData {
  fields: FormField[];
  signeeId: string | null;
  dueDate: string | null;
  message: string;
}

export function EditDocumentComponent({ document, users = [] }: { document: Document; users?: User[] }) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("prepare");
  const [pdfData, setPdfData] = useState<ArrayBuffer | null>(null);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Document preparation state
  const [documentData, setDocumentData] = useState<DocumentPrepareData>({
    fields: [],
    signeeId: null,
    dueDate: null,
    message: "",
  });

  // Dragging state
  const [selectedField, setSelectedField] = useState<FormField | null>(null);
  const [dragField, setDragField] = useState<FormField | null>(null);
  const [currentPosition, setCurrentPosition] = useState({ x: 0, y: 0 });
  const [showFieldDialog, setShowFieldDialog] = useState(false);
  const [isDraggingTool, setIsDraggingTool] = useState(false);
  const [fieldEditMode, setFieldEditMode] = useState<"add" | "edit">("add");
  const [currentPageNumber, setCurrentPageNumber] = useState(1);
  const [numPages, setNumPages] = useState(1);

  // Reference for the document container
  const documentContainerRef = useRef<HTMLDivElement>(null);

  // Field being edited
  const [editingField, setEditingField] = useState<FormField | null>(null);

  // History for undo/redo
  const [history, setHistory] = useState<DocumentPrepareData[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // Fetch PDF data from R2 storage
  useEffect(() => {
    const fetchPdf = async () => {
      if (!document.key) {
        setPdfError("No file key available");
        setIsLoading(false);
        return;
      }

      try {
        const result = await getFromR2({
          Bucket: process.env.R2_BUCKET_NAME || "",
          Key: document.key,
        });

        if (!result.success) {
          setPdfError(result.message || "Failed to load document");
          setIsLoading(false);
          return;
        }

        // Process the response
        if (result.data.Body) {
          // Check if it's an async iterable (ReadableStream)
          if (Symbol.asyncIterator in result.data.Body) {
            try {
              // Read the stream
              const chunks = [];
              for await (const chunk of result.data.Body) {
                chunks.push(chunk);
              }

              // Determine total length
              let totalLength = 0;
              for (const chunk of chunks) {
                totalLength += chunk.length;
              }

              // Combine chunks into a single Uint8Array
              const combinedArray = new Uint8Array(totalLength);
              let offset = 0;
              for (const chunk of chunks) {
                combinedArray.set(chunk, offset);
                offset += chunk.length;
              }

              // Set the result
              setPdfData(combinedArray.buffer);
              setIsLoading(false);
            } catch (streamError) {
              console.error("Error reading async iterable:", streamError);
              setPdfError(`Error processing document stream: ${streamError instanceof Error ? streamError.message : "Unknown error"}`);
              setIsLoading(false);
            }
          } else {
            // Handle other data formats
            setPdfError("Unsupported document format");
            setIsLoading(false);
          }
        } else {
          setPdfError("Empty document response");
          setIsLoading(false);
        }
      } catch (error) {
        console.error("PDF fetch error:", error);
        setPdfError(error instanceof Error ? error.message : "Unknown error loading document");
        setIsLoading(false);
      }
    };

    fetchPdf();
  }, [document.key]);

  // Fetch existing document fields and settings
  useEffect(() => {
    const fetchExistingFields = async () => {
      try {
        const response = await fetch(`/api/documents/prepare?documentId=${document.id}`, {
          method: "GET",
        });
        
        if (response.ok) {
          const data = await response.json();
          
          if (data.success && data.fields) {
            // Transform database fields to component format
            const transformedFields: FormField[] = data.fields.map((field: any) => ({
              id: field.id,
              type: field.type as FieldType,
              label: field.label,
              required: field.required,
              placeholder: field.placeholder || undefined,
              position: {
                x: field.x,
                y: field.y,
                width: field.width,
                height: field.height,
                pageNumber: field.pageNumber,
              },
            }));
            
            // Update document data with existing fields and information
            setDocumentData({
              fields: transformedFields,
              signeeId: document.signeeId || null,
              dueDate: document.dueDate ? new Date(document.dueDate).toISOString().split('T')[0] : null,
              message: document.message || "",
            });
          }
        }
      } catch (error) {
        console.error("Error fetching document fields:", error);
      }
    };
    
    fetchExistingFields();
  }, [document.id, document.signeeId, document.dueDate, document.message]);

  // Save current state to history when fields change
  useEffect(() => {
    if (historyIndex >= 0) {
      // If we're not at the end of the history stack, remove future states
      const newHistory = history.slice(0, historyIndex + 1);
      setHistory([...newHistory, { ...documentData }]);
      setHistoryIndex(historyIndex + 1);
    } else {
      // First change
      setHistory([{ ...documentData }]);
      setHistoryIndex(0);
    }
  }, [documentData.fields]);

  // Function to add a new field
  const addField = (type: FieldType) => {
    const newField: FormField = {
      id: `field-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      type,
      label: `${type.charAt(0).toUpperCase() + type.slice(1)} Field`,
      required: false,
      position: {
        x: 100,
        y: 100,
        width: type === "signature" ? 200 : 150,
        height: type === "signature" ? 80 : 40,
        pageNumber: currentPageNumber,
      },
      placeholder: `Enter ${type}...`,
    };

    setSelectedField(newField);
    setDragField(newField);
    setIsDraggingTool(true);
  };

  // Mouse handlers for drag and drop
  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!isDraggingTool || !dragField) return;

      const container = documentContainerRef.current;
      if (!container) return;

      const rect = container.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      setCurrentPosition({ x, y });
    },
    [isDraggingTool, dragField]
  );

  const handleMouseUp = useCallback(() => {
    if (isDraggingTool && dragField && dragField.position) {
      // Add field to document at current position
      const updatedField = {
        ...dragField,
        position: {
          ...dragField.position,
          x: currentPosition.x,
          y: currentPosition.y,
          pageNumber: currentPageNumber,
        },
      };

      setDocumentData((prevData) => ({
        ...prevData,
        fields: [...prevData.fields, updatedField],
      }));

      // Reset dragging state
      setDragField(null);
      setIsDraggingTool(false);

      // Open dialog to configure the field
      setEditingField(updatedField);
      setFieldEditMode("add");
      setShowFieldDialog(true);
    }
  }, [isDraggingTool, dragField, currentPosition, currentPageNumber]);

  // Function to handle field clicks
  const handleFieldClick = (field: FormField) => {
    setSelectedField(field);
  };

  // Function to edit a field
  const editField = (field: FormField) => {
    setEditingField(field);
    setFieldEditMode("edit");
    setShowFieldDialog(true);
  };

  // Function to delete a field
  const deleteField = (fieldId: string) => {
    setDocumentData((prevData) => ({
      ...prevData,
      fields: prevData.fields.filter((f) => f.id !== fieldId),
    }));

    if (selectedField?.id === fieldId) {
      setSelectedField(null);
    }

    toast.success("Field removed");
  };

  // Function to update field properties
  const updateField = (updatedField: FormField) => {
    setDocumentData((prevData) => ({
      ...prevData,
      fields: prevData.fields.map((f) => (f.id === updatedField.id ? updatedField : f)),
    }));

    setShowFieldDialog(false);
    setEditingField(null);

    toast.success("Field updated");
  };

  // Undo function
  const undo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setDocumentData({ ...history[newIndex] });
    }
  };

  // Redo function
  const redo = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      setDocumentData({ ...history[newIndex] });
    }
  };

  // Save document preparation
  const saveDocumentPreparation = async () => {
    try {
      // Validate required fields
      if (!documentData.signeeId) {
        toast.error("Please select a signee");
        return;
      }

      // Show loading toast
      const loadingToast = toast.loading("Preparing document...");
      
      // Send data to the API
      const response = await fetch("/api/documents/prepare", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          documentId: document.id,
          fields: documentData.fields,
          signeeId: documentData.signeeId,
          dueDate: documentData.dueDate,
          message: documentData.message,
        }),
      });

      const result = await response.json();

      // Dismiss loading toast
      toast.dismiss(loadingToast);

      if (!response.ok) {
        toast.error(result.message || "Failed to save document preparation");
        return;
      }

      toast.success("Document prepared successfully and sent for signature");

      // Navigate back to the document view
      setTimeout(() => {
        router.push(`/admin/documents/${document.id}`);
      }, 1000);
    } catch (error) {
      console.error("Error saving document preparation:", error);
      toast.error("Failed to save document preparation");
    }
  };

  // Cancel and go back
  const handleCancel = () => {
    router.push(`/admin/documents/${document.id}`);
  };

  // Track current page for field positioning
  const handlePageChange = (pageNumber: number) => {
    setCurrentPageNumber(pageNumber);
  };

  // Track total pages
  const handleDocumentLoaded = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
  };

  // Render field overlay on PDF
  const renderFieldOverlay = (field: FormField) => {
    if (!field.position) return null;

    // Only show fields for the current page
    if (field.position.pageNumber !== currentPageNumber) return null;

    const isSelected = selectedField?.id === field.id;

    return (
      <div
        key={field.id}
        className={cn(
          "absolute border-2 rounded cursor-pointer flex items-center justify-center bg-opacity-20 overflow-hidden",
          isSelected ? "border-primary bg-primary/10" : "border-gray-400 bg-gray-100/30 hover:bg-primary/5 hover:border-primary/70"
        )}
        style={{
          left: field.position.x,
          top: field.position.y,
          width: field.position.width,
          height: field.position.height,
        }}
        onClick={(e) => {
          e.stopPropagation();
          handleFieldClick(field);
        }}
      >
        <div className="text-xs text-center px-1 select-none truncate">{field.label}</div>

        {isSelected && (
          <div className="absolute top-0 right-0 flex gap-1 bg-white rounded-bl border border-gray-200 shadow-sm">
            <Button
              size="icon"
              variant="ghost"
              className="h-6 w-6"
              onClick={(e) => {
                e.stopPropagation();
                editField(field);
              }}
            >
              <Settings className="h-3 w-3" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="h-6 w-6 text-destructive hover:text-destructive/90"
              onClick={(e) => {
                e.stopPropagation();
                deleteField(field.id);
              }}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        )}
      </div>
    );
  };

  // Field type icon mapping
  const getFieldIcon = (type: FieldType) => {
    switch (type) {
      case "text":
        return <TextCursor className="h-4 w-4" />;
      case "email":
        return <Mail className="h-4 w-4" />;
      case "date":
        return <Calendar className="h-4 w-4" />;
      case "checkbox":
        return <ListChecks className="h-4 w-4" />;
      case "signature":
        return <Signature className="h-4 w-4" />;
      case "name":
        return <Type className="h-4 w-4" />;
      default:
        return <TextCursor className="h-4 w-4" />;
    }
  };

  return (
    <div className="container py-6 mx-auto max-w-7xl space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-1" onClick={handleCancel}>
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <h1 className="text-2xl font-semibold tracking-tight">Prepare Document for Signing</h1>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={undo} disabled={historyIndex <= 0}>
            <Undo className="h-4 w-4" />
            <span className="sr-only md:not-sr-only md:ml-2">Undo</span>
          </Button>
          <Button variant="outline" size="sm" onClick={redo} disabled={historyIndex >= history.length - 1}>
            <Redo className="h-4 w-4" />
            <span className="sr-only md:not-sr-only md:ml-2">Redo</span>
          </Button>
          <Button variant="outline" size="sm" onClick={handleCancel}>
            Cancel
          </Button>
          <Button size="sm" onClick={saveDocumentPreparation} className="gap-1">
            <Save className="h-4 w-4" />
            Save & Send
          </Button>
        </div>
      </div>

      <Card className="shadow-md">
        <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle className="flex items-center gap-2 text-xl">
              <FileText className="h-5 w-5 text-primary" />
              {document.title || document.fileName || "Document"}
            </CardTitle>
            <CardDescription>{document.description || "Add fields and assign a signee"}</CardDescription>
          </div>
          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200 flex items-center gap-1">
            <Pencil className="h-3 w-3" />
            Editing
          </Badge>
        </CardHeader>

        <Separator />

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="px-6 pt-2">
            <TabsList className="grid grid-cols-2 max-w-[400px]">
              <TabsTrigger value="prepare">Prepare</TabsTrigger>
              <TabsTrigger value="recipients">Recipients</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="prepare" className="p-6 space-y-4">
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Field tools sidebar */}
              <div className="w-full lg:w-64 flex-shrink-0">
                <Card>
                  <CardHeader className="py-3">
                    <CardTitle className="text-base">Fields</CardTitle>
                    <CardDescription>Drag fields onto document</CardDescription>
                  </CardHeader>
                  <CardContent className="p-2">
                    <ScrollArea className="h-[500px] pr-4">
                      <div className="grid grid-cols-2 gap-2">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div
                                className="bg-white border rounded-md p-3 flex flex-col items-center justify-center gap-1 cursor-pointer hover:bg-muted/30 hover:border-primary/50 transition-colors"
                                onClick={() => addField("signature")}
                              >
                                <Signature className="h-6 w-6 text-primary" />
                                <p className="text-xs font-medium">Signature</p>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent side="right">
                              <p className="text-sm">Add signature field</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>

                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div
                                className="bg-white border rounded-md p-3 flex flex-col items-center justify-center gap-1 cursor-pointer hover:bg-muted/30 hover:border-primary/50 transition-colors"
                                onClick={() => addField("text")}
                              >
                                <TextCursor className="h-6 w-6 text-primary" />
                                <p className="text-xs font-medium">Text</p>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent side="right">
                              <p className="text-sm">Add text field</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>

                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div
                                className="bg-white border rounded-md p-3 flex flex-col items-center justify-center gap-1 cursor-pointer hover:bg-muted/30 hover:border-primary/50 transition-colors"
                                onClick={() => addField("name")}
                              >
                                <Type className="h-6 w-6 text-primary" />
                                <p className="text-xs font-medium">Name</p>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent side="right">
                              <p className="text-sm">Add name field</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>

                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div
                                className="bg-white border rounded-md p-3 flex flex-col items-center justify-center gap-1 cursor-pointer hover:bg-muted/30 hover:border-primary/50 transition-colors"
                                onClick={() => addField("email")}
                              >
                                <Mail className="h-6 w-6 text-primary" />
                                <p className="text-xs font-medium">Email</p>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent side="right">
                              <p className="text-sm">Add email field</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>

                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div
                                className="bg-white border rounded-md p-3 flex flex-col items-center justify-center gap-1 cursor-pointer hover:bg-muted/30 hover:border-primary/50 transition-colors"
                                onClick={() => addField("date")}
                              >
                                <Calendar className="h-6 w-6 text-primary" />
                                <p className="text-xs font-medium">Date</p>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent side="right">
                              <p className="text-sm">Add date field</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>

                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div
                                className="bg-white border rounded-md p-3 flex flex-col items-center justify-center gap-1 cursor-pointer hover:bg-muted/30 hover:border-primary/50 transition-colors"
                                onClick={() => addField("checkbox")}
                              >
                                <ListChecks className="h-6 w-6 text-primary" />
                                <p className="text-xs font-medium">Checkbox</p>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent side="right">
                              <p className="text-sm">Add checkbox field</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>

                      <div className="mt-6 space-y-2">
                        <h3 className="text-sm font-medium px-1">Fields on document</h3>
                        <Separator />
                        {documentData.fields.length > 0 ? (
                          <div className="space-y-1">
                            {documentData.fields.map((field) => (
                              <div
                                key={field.id}
                                className={cn("flex items-center justify-between p-2 rounded border text-sm", selectedField?.id === field.id ? "bg-muted border-primary" : "bg-white")}
                                onClick={() => handleFieldClick(field)}
                              >
                                <div className="flex items-center gap-2">
                                  {getFieldIcon(field.type)}
                                  <span className="truncate max-w-[140px]">{field.label}</span>
                                </div>
                                <div className="flex items-center">
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-6 w-6 text-muted-foreground hover:text-foreground"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      editField(field);
                                    }}
                                  >
                                    <Settings className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-6 w-6 text-muted-foreground hover:text-destructive"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      deleteField(field.id);
                                    }}
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="px-2 py-3 text-sm text-muted-foreground italic">No fields added yet. Drag fields from above onto the document.</div>
                        )}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </div>

              {/* Document viewer */}
              <div className="relative flex-grow">
                <div
                  ref={documentContainerRef}
                  className="relative w-full border rounded-md bg-muted/30 flex justify-center min-h-[650px] overflow-hidden"
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onClick={() => setSelectedField(null)}
                >
                  {isLoading ? (
                    <div className="flex flex-col py-8 my-8 items-center justify-center h-full w-full">
                      <div className="h-8 w-8 animate-spin text-primary mb-2 border-2 border-current border-t-transparent rounded-full" />
                      <p className="text-sm text-muted-foreground">Loading document...</p>
                    </div>
                  ) : pdfError ? (
                    <div className="flex flex-col py-8 my-8 items-center justify-center h-full w-full p-4">
                      <FileWarning className="h-10 w-10 text-destructive mb-2" />
                      <p className="text-sm text-destructive font-medium">Failed to load document</p>
                      <p className="text-xs text-muted-foreground text-center mt-1">{pdfError}</p>
                    </div>
                  ) : (
                    <>
                      <PDFViewer pdfData={pdfData} allowAnnotations={false} readOnly={true} onPageChange={handlePageChange} onDocumentLoad={handleDocumentLoaded} />

                      {/* Field overlays */}
                      {documentData.fields.map(renderFieldOverlay)}

                      {/* Dragging field preview */}
                      {isDraggingTool && dragField && (
                        <div
                          className="absolute border-2 border-primary bg-primary/10 rounded flex items-center justify-center z-30 pointer-events-none"
                          style={{
                            left: currentPosition.x,
                            top: currentPosition.y,
                            width: dragField.position?.width || 150,
                            height: dragField.position?.height || 40,
                            transform: "translate(-50%, -50%)",
                          }}
                        >
                          <div className="text-xs font-medium">{dragField.type.charAt(0).toUpperCase() + dragField.type.slice(1)}</div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="recipients" className="p-6 space-y-6">
            <div className="max-w-2xl mx-auto">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Recipient</CardTitle>
                  <CardDescription>Assign who should sign this document</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signee">
                      Select Signee <span className="text-destructive">*</span>
                    </Label>
                    <Select
                      value={documentData.signeeId || ""}
                      onValueChange={(value) =>
                        setDocumentData({
                          ...documentData,
                          signeeId: value || null,
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select signee..." />
                      </SelectTrigger>
                      <SelectContent>
                        {users.length > 0 ? (
                          users.map((user) => (
                            <SelectItem key={user.id} value={user.id}>
                              {user.name || user.email}
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="placeholder" disabled>
                            No users available
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="dueDate">Due Date</Label>
                    <Input
                      id="dueDate"
                      type="date"
                      value={documentData.dueDate || ""}
                      onChange={(e) =>
                        setDocumentData({
                          ...documentData,
                          dueDate: e.target.value || null,
                        })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="message">Message</Label>
                    <Textarea
                      id="message"
                      placeholder="Add a message for the signee..."
                      className="resize-none h-24"
                      value={documentData.message}
                      onChange={(e) =>
                        setDocumentData({
                          ...documentData,
                          message: e.target.value,
                        })
                      }
                    />
                  </div>
                </CardContent>
                <CardFooter className="bg-muted/30 border-t flex gap-2 justify-between">
                  <div className="text-sm text-muted-foreground">
                    <UserCheck className="h-4 w-4 inline-block mr-1" />
                    {documentData.signeeId ? "Signee selected" : "No signee selected"}
                  </div>
                  <Button size="sm" onClick={() => setActiveTab("prepare")}>
                    Continue to Document
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        <CardFooter className="border-t py-4 flex justify-between">
          <Button variant="outline" size="sm" onClick={handleCancel}>
            Cancel
          </Button>
          <Button size="sm" onClick={saveDocumentPreparation} className="gap-1">
            <Save className="h-4 w-4" />
            Save & Send
          </Button>
        </CardFooter>
      </Card>

      {/* Field settings dialog */}
      <Dialog open={showFieldDialog} onOpenChange={setShowFieldDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{fieldEditMode === "add" ? "Add New Field" : "Edit Field"}</DialogTitle>
            <DialogDescription>Configure the field properties</DialogDescription>
          </DialogHeader>

          {editingField && (
            <div className="space-y-4 py-2">
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="field-label">Field Label</Label>
                  <Input
                    id="field-label"
                    placeholder="Enter label"
                    value={editingField.label}
                    onChange={(e) =>
                      setEditingField({
                        ...editingField,
                        label: e.target.value,
                      })
                    }
                  />
                </div>

                {editingField.type !== "checkbox" && editingField.type !== "signature" && (
                  <div className="space-y-2">
                    <Label htmlFor="field-placeholder">Placeholder Text</Label>
                    <Input
                      id="field-placeholder"
                      placeholder="Enter placeholder"
                      value={editingField.placeholder || ""}
                      onChange={(e) =>
                        setEditingField({
                          ...editingField,
                          placeholder: e.target.value,
                        })
                      }
                    />
                  </div>
                )}

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="field-required"
                    className="rounded border-gray-300 text-primary focus:ring-primary"
                    checked={editingField.required}
                    onChange={(e) =>
                      setEditingField({
                        ...editingField,
                        required: e.target.checked,
                      })
                    }
                  />
                  <Label htmlFor="field-required" className="cursor-pointer">
                    Required field
                  </Label>
                </div>

                <div className="space-y-2">
                  <Label>Field Size</Label>
                  <div className="flex gap-4">
                    <div className="flex-1 space-y-1">
                      <Label htmlFor="field-width" className="text-xs text-muted-foreground">
                        Width
                      </Label>
                      <Input
                        id="field-width"
                        type="number"
                        min={50}
                        max={500}
                        value={editingField.position?.width || 150}
                        onChange={(e) =>
                          setEditingField({
                            ...editingField,
                            position: {
                              ...(editingField.position || { x: 0, y: 0, height: 40, pageNumber: 1 }),
                              width: parseInt(e.target.value),
                            },
                          })
                        }
                      />
                    </div>
                    <div className="flex-1 space-y-1">
                      <Label htmlFor="field-height" className="text-xs text-muted-foreground">
                        Height
                      </Label>
                      <Input
                        id="field-height"
                        type="number"
                        min={30}
                        max={200}
                        value={editingField.position?.height || 40}
                        onChange={(e) =>
                          setEditingField({
                            ...editingField,
                            position: {
                              ...(editingField.position || { x: 0, y: 0, width: 150, pageNumber: 1 }),
                              height: parseInt(e.target.value),
                            },
                          })
                        }
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowFieldDialog(false)}>
              Cancel
            </Button>
            <Button onClick={() => editingField && updateField(editingField)}>Save Field</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
