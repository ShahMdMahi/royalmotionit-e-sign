"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Document, User } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { FileWarning, FileText, TextCursor, Pencil, ListChecks, Calendar, Mail, Type, Save, UserCheck, Signature, Trash2, Settings, ArrowLeft, Undo, Redo, Plus, Phone, Home, Check } from "lucide-react";
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
import { Switch } from "@/components/ui/switch";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Checkbox } from "@/components/ui/checkbox";

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
  validations?: {
    minLength?: number;
    maxLength?: number;
    pattern?: string;
  };
  options?: string[];
}

// Update the DocumentPrepareData interface to support multiple signers
interface DocumentPrepareData {
  fields: FormField[];
  signers: {
    id: string;
    userId: string;
    order: number;
    role: string;
  }[];
  signeeId: string | null; // Keep for backward compatibility
  dueDate: string | null;
  message: string;
  sendNotification: boolean;
  expiryDays: number;
}

// Fix the TypeScript error by replacing any with a specific type
interface ServerFieldData {
  id: string;
  type: string;
  label: string;
  required: boolean;
  x: number;
  y: number;
  width: number;
  height: number;
  pageNumber: number;
  placeholder?: string;
  validations?: {
    minLength?: number;
    maxLength?: number;
    pattern?: string;
  };
  options?: string[];
}

export function EditDocumentComponent({ document, users = [] }: { document: Document; users?: User[] }) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("prepare");
  const [pdfData, setPdfData] = useState<ArrayBuffer | null>(null);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  // Document preparation state
  const [documentData, setDocumentData] = useState<DocumentPrepareData>({
    fields: [],
    signers: [],
    signeeId: null,
    dueDate: null,
    message: "",
    sendNotification: true,
    expiryDays: 30
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
  const [isSaving, setIsSaving] = useState(false);

  // Reference for the document container
  const documentContainerRef = useRef<HTMLDivElement>(null);

  // Field being edited
  const [editingField, setEditingField] = useState<FormField | null>(null);

  // History for undo/redo
  const [history, setHistory] = useState<DocumentPrepareData[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // Add this state to track if we're currently restoring from history
  const [isRestoringFromHistory, setIsRestoringFromHistory] = useState(false);

  // Remove PDF annotations state
  const [activeSignerId, setActiveSignerId] = useState<string>("all");
  const [activeField, setActiveField] = useState<string | null>(null);
  const [fieldModalOpen, setFieldModalOpen] = useState(false);
  const [fieldPreview, setFieldPreview] = useState<{ x: number; y: number; visible: boolean }>({ x: 0, y: 0, visible: false });
  const [activeFieldSize, setActiveFieldSize] = useState<{ width: number; height: number }>({ width: 150, height: 40 });

  // Document metadata
  const [documentMetadata, setDocumentMetadata] = useState({
    title: document.title || document.fileName || "Untitled Document",
    description: document.description || ""
  });

  const documentFields = [
    { type: "text", label: "Text", description: "Single-line text", icon: <TextCursor className="h-4 w-4" /> },
    { type: "email", label: "Email", description: "Email address", icon: <Mail className="h-4 w-4" /> },
    { type: "date", label: "Date", description: "Date picker", icon: <Calendar className="h-4 w-4" /> },
    { type: "checkbox", label: "Checkbox", description: "Checkable box", icon: <ListChecks className="h-4 w-4" /> },
    { type: "signature", label: "Signature", description: "Signature field", icon: <Signature className="h-4 w-4" /> },
    { type: "name", label: "Name", description: "Full name", icon: <Type className="h-4 w-4" /> },
    { type: "phone", label: "Phone", description: "Phone number", icon: <Phone className="h-4 w-4" /> },
    { type: "address", label: "Address", description: "Address field", icon: <Home className="h-4 w-4" /> },
  ];

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
            const transformedFields: FormField[] = data.fields.map((field: ServerFieldData) => ({
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
              validations: field.validations || undefined,
              options: field.options || undefined,
            }));

            // Update document data with existing fields and information
            setDocumentData({
              fields: transformedFields,
              signers: data.signers || [],
              signeeId: document.signeeId || null,
              dueDate: document.dueDate ? new Date(document.dueDate).toISOString().split('T')[0] : null,
              message: document.message || "",
              sendNotification: true, // Default to true
              expiryDays: document.expiresInDays || 30,
            });
          }
        }
      } catch (error) {
        console.error("Error fetching document fields:", error);
      }
    };

    fetchExistingFields();
  }, [document.id, document.signeeId, document.dueDate, document.message, document.expiresInDays]);

  // Save current state to history when fields change
  useEffect(() => {
    // Skip history update if this effect is triggered by restoring from history
    if (isRestoringFromHistory) return;

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
  }, [documentData.fields]); // Only trigger on fields change, not all documentData

  // Function to add a new field
  const addField = (type: FieldType, position?: { x: number; y: number; width: number; height: number; pageNumber?: number; label?: string }) => {
    let fieldWidth = 150;
    let fieldHeight = 40;

    // Set different default dimensions based on field type
    switch (type) {
      case "signature":
        fieldWidth = 200;
        fieldHeight = 80;
        break;
      case "checkbox":
        fieldWidth = 30;
        fieldHeight = 30;
        break;
      case "address":
        fieldWidth = 300;
        fieldHeight = 60;
        break;
    }

    const newField: FormField = {
      id: `field-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      type,
      label: position?.label || `${type.charAt(0).toUpperCase() + type.slice(1)} Field`,
      required: false,
      position: {
        x: position?.x || 100,
        y: position?.y || 100,
        width: position?.width || fieldWidth,
        height: position?.height || fieldHeight,
        pageNumber: position?.pageNumber || currentPageNumber,
      },
      placeholder: type === "checkbox" || type === "signature" ? undefined : `Enter ${type}...`,
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
      const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
      const y = Math.max(0, Math.min(e.clientY - rect.top, rect.height));

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

  // Handle field position adjustment
  const moveField = (fieldId: string, offsetX: number, offsetY: number) => {
    setDocumentData(prevData => ({
      ...prevData,
      fields: prevData.fields.map(field => {
        if (field.id === fieldId && field.position) {
          return {
            ...field,
            position: {
              ...field.position,
              x: Math.max(0, field.position.x + offsetX),
              y: Math.max(0, field.position.y + offsetY)
            }
          };
        }
        return field;
      })
    }));
  };

  // Undo function
  const undo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setIsRestoringFromHistory(true);
      setHistoryIndex(newIndex);
      setDocumentData({ ...history[newIndex] });
      // Reset the flag after state update
      setTimeout(() => setIsRestoringFromHistory(false), 0);
    }
  };

  // Redo function
  const redo = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setIsRestoringFromHistory(true);
      setHistoryIndex(newIndex);
      setDocumentData({ ...history[newIndex] });
      // Reset the flag after state update
      setTimeout(() => setIsRestoringFromHistory(false), 0);
    }
  };

  // Save document preparation
  const saveDocumentPreparation = async () => {
    try {
      setIsSaving(true);
      // Validate required fields
      if (!documentData.signeeId) {
        setIsSaving(false);
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
          signers: documentData.signers,
          signeeId: documentData.signeeId,
          dueDate: documentData.dueDate,
          message: documentData.message,
          expiryDays: documentData.expiryDays,
          sendNotification: documentData.sendNotification,
        }),
      });

      const result = await response.json();

      // Dismiss loading toast
      toast.dismiss(loadingToast);
      setIsSaving(false);

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
      setIsSaving(false);
      console.error("Error saving document preparation:", error);
      toast.error("Failed to save document preparation");
    }
  };

  // Cancel and go back
  const handleCancel = () => {
    // If there are changes, show confirmation dialog
    if (documentData.fields.length > 0 || documentData.message || documentData.dueDate || documentData.signeeId) {
      setShowConfirmDialog(true);
    } else {
      // No changes, just go back
      router.push(`/admin/documents/${document.id}`);
    }
  };

  // Track current page for field positioning
  const handlePageChange = (pageNumber: number) => {
    setCurrentPageNumber(pageNumber);
  };

  // Track total pages
  const handleDocumentLoaded = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
  };

  // Duplicate an existing field
  const duplicateField = (field: FormField) => {
    const duplicatedField: FormField = {
      ...field,
      id: `field-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      position: field.position 
        ? {
            ...field.position,
            x: field.position.x + 20,
            y: field.position.y + 20
          }
        : undefined
    };

    setDocumentData(prev => ({
      ...prev,
      fields: [...prev.fields, duplicatedField]
    }));

    toast.success("Field duplicated");
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
          isSelected ? "border-primary bg-primary/10 z-20" : "border-gray-400 bg-gray-100/30 hover:bg-primary/5 hover:border-primary/70"
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
                duplicateField(field);
              }}
            >
              <Plus className="h-3 w-3" />
            </Button>
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

        {/* Arrow key controls for selected fields */}
        {isSelected && (
          <div className="absolute grid grid-cols-3 gap-1 bottom-full left-1/2 transform -translate-x-1/2 -translate-y-2 bg-white p-1 rounded shadow-md border">
            <Button 
              size="icon" 
              variant="ghost" 
              className="h-6 w-6" 
              onClick={(e) => { e.stopPropagation(); moveField(field.id, 0, -1); }}
            >
              <span className="transform rotate-180">↓</span>
            </Button>
            <Button 
              size="icon" 
              variant="ghost" 
              className="h-6 w-6" 
              onClick={(e) => { e.stopPropagation(); moveField(field.id, 0, -10); }}
            >
              <span className="transform rotate-180">↓↓</span>
            </Button>
            <span className="h-6 w-6"></span>
            <Button 
              size="icon" 
              variant="ghost" 
              className="h-6 w-6" 
              onClick={(e) => { e.stopPropagation(); moveField(field.id, -1, 0); }}
            >
              <span className="transform rotate-180">→</span>
            </Button>
            <span className="h-6 w-6"></span>
            <Button 
              size="icon" 
              variant="ghost" 
              className="h-6 w-6" 
              onClick={(e) => { e.stopPropagation(); moveField(field.id, 1, 0); }}
            >
              →
            </Button>
            <span className="h-6 w-6"></span>
            <Button 
              size="icon" 
              variant="ghost" 
              className="h-6 w-6" 
              onClick={(e) => { e.stopPropagation(); moveField(field.id, 0, 1); }}
            >
              ↓
            </Button>
            <Button 
              size="icon" 
              variant="ghost" 
              className="h-6 w-6" 
              onClick={(e) => { e.stopPropagation(); moveField(field.id, 0, 10); }}
            >
              ↓↓
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
      case "phone":
        return <Phone className="h-4 w-4" />;
      case "address":
        return <Home className="h-4 w-4" />;
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
          <Button size="sm" onClick={saveDocumentPreparation} className="gap-1" disabled={isSaving}>
            {isSaving ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Save & Send
              </>
            )}
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
            <div className="flex justify-between items-center mt-4 mb-2">
              <h3 className="text-sm font-medium">Document Fields</h3>
              <div className="flex items-center gap-2">
                <Select
                  value={activeSignerId}
                  onValueChange={(value) => setActiveSignerId(value)}
                >
                  <SelectTrigger className="h-8 text-xs" style={{ minWidth: '180px' }}>
                    <SelectValue placeholder="All signers" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All signers</SelectItem>
                    {documentData.signers.map((signer) => {
                      const user = users.find((u) => u.id === signer.userId);
                      return (
                        <SelectItem key={signer.id} value={signer.id}>
                          {user ? (user.name || user.email) : `Signer ${signer.order}`}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 mb-4">
              {documentFields.map((field) => (
                <Button
                  key={field.type}
                  variant="outline"
                  size="sm"
                  className={cn(
                    "h-10 text-xs flex items-center justify-start gap-2 px-2",
                    activeField === field.type && "ring-2 ring-primary"
                  )}
                  onClick={() => {
                    setActiveField(activeField === field.type ? null : field.type);
                    setFieldModalOpen(activeField !== field.type);
                  }}
                >
                  {field.icon}
                  <div className="flex flex-col items-start">
                    <span className="font-medium">{field.label}</span>
                    <span className="text-[10px] text-muted-foreground">{field.description}</span>
                  </div>
                </Button>
              ))}
            </div>

            <Dialog open={fieldModalOpen} onOpenChange={setFieldModalOpen}>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Add {activeField ? documentFields.find(f => f.type === activeField)?.label : "Field"}</DialogTitle>
                  <DialogDescription>
                    Configure the field properties before adding it to the document
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="field-assignee">Assign to</Label>
                    <Select defaultValue={activeSignerId === 'all' ? documentData.signers[0]?.id : activeSignerId}>
                      <SelectTrigger id="field-assignee">
                        <SelectValue placeholder="Select signer" />
                      </SelectTrigger>
                      <SelectContent>
                        {documentData.signers.map((signer) => {
                          const user = users.find((u) => u.id === signer.userId);
                          return (
                            <SelectItem key={signer.id} value={signer.id}>
                              {user ? (user.name || user.email) : `Signer ${signer.order}`}
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="field-required">Field properties</Label>
                    <div className="flex flex-wrap gap-4">
                      <div className="flex items-center gap-2">
                        <Checkbox id="field-required" defaultChecked />
                        <Label htmlFor="field-required" className="text-sm">Required</Label>
                      </div>
                      
                      {activeField === 'text' && (
                        <>
                          <div className="flex items-center gap-2">
                            <Checkbox id="field-multiline" />
                            <Label htmlFor="field-multiline" className="text-sm">Multiline</Label>
                          </div>
                          <div className="flex items-center gap-2">
                            <Checkbox id="field-prefilled" />
                            <Label htmlFor="field-prefilled" className="text-sm">Prefilled</Label>
                          </div>
                        </>
                      )}
                      
                      {activeField === 'dropdown' && (
                        <div className="flex items-center gap-2">
                          <Checkbox id="field-custom-options" />
                          <Label htmlFor="field-custom-options" className="text-sm">Custom options</Label>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {activeField === 'text' && (
                    <div className="space-y-2">
                      <Label htmlFor="field-validation">Validation</Label>
                      <Select defaultValue="none">
                        <SelectTrigger id="field-validation">
                          <SelectValue placeholder="No validation" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">No validation</SelectItem>
                          <SelectItem value="email">Email</SelectItem>
                          <SelectItem value="phone">Phone number</SelectItem>
                          <SelectItem value="number">Numeric only</SelectItem>
                          <SelectItem value="date">Date</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {activeField === 'dropdown' && (
                    <div className="space-y-2">
                      <Label htmlFor="field-options">Options (one per line)</Label>
                      <Textarea 
                        id="field-options" 
                        placeholder="Option 1&#10;Option 2&#10;Option 3"
                        className="min-h-[100px]"
                      />
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="field-name">Name/Label</Label>
                    <Input 
                      id="field-name" 
                      placeholder="Enter field name" 
                      defaultValue={activeField === 'signature' ? 'Signature' : 'Field'} 
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setFieldModalOpen(false)}>Cancel</Button>
                  <Button onClick={() => {
                    // Here you would handle adding the field to the document
                    toast.success(`Field added to document`);
                    setFieldModalOpen(false);
                    setActiveField(null);
                  }}>Add Field</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

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
                                <Check className="h-6 w-6 text-primary" />
                                <p className="text-xs font-medium">Checkbox</p>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent side="right">
                              <p className="text-sm">Add checkbox field</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>

                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div
                                className="bg-white border rounded-md p-3 flex flex-col items-center justify-center gap-1 cursor-pointer hover:bg-muted/30 hover:border-primary/50 transition-colors"
                                onClick={() => addField("phone")}
                              >
                                <Phone className="h-6 w-6 text-primary" />
                                <p className="text-xs font-medium">Phone</p>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent side="right">
                              <p className="text-sm">Add phone field</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>

                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div
                                className="bg-white border rounded-md p-3 flex flex-col items-center justify-center gap-1 cursor-pointer hover:bg-muted/30 hover:border-primary/50 transition-colors"
                                onClick={() => addField("address")}
                              >
                                <Home className="h-6 w-6 text-primary" />
                                <p className="text-xs font-medium">Address</p>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent side="right">
                              <p className="text-sm">Add address field</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>

                      {/* Field Templates - New Section */}
                      <div className="mt-4 pt-4 border-t border-border">
                        <h3 className="text-sm font-medium mb-2">Field Templates</h3>
                        <div className="grid grid-cols-1 gap-2">
                          <Button 
                            variant="outline" 
                            className="text-xs justify-start"
                            onClick={() => {
                              // Add standard signature block with date and name
                              const baseY = 50;
                              addField("signature", { x: 100, y: baseY, width: 200, height: 80, label: "Signature" });
                              addField("date", { x: 350, y: baseY + 30, width: 150, height: 40, label: "Date" });
                              addField("text", { x: 100, y: baseY + 100, width: 200, height: 40, label: "Print Name" });
                            }}
                          >
                            <Signature className="h-3 w-3 mr-2" />
                            Signature Block
                          </Button>
                          <Button 
                            variant="outline" 
                            className="text-xs justify-start"
                            onClick={() => {
                              // Add contact information block
                              const baseY = 50;
                              const spacing = 50;
                              addField("name", { x: 100, y: baseY, width: 200, height: 40, label: "Full Name" });
                              addField("email", { x: 100, y: baseY + spacing, width: 200, height: 40, label: "Email Address" });
                              addField("phone", { x: 100, y: baseY + spacing * 2, width: 200, height: 40, label: "Phone Number" });
                              addField("address", { x: 100, y: baseY + spacing * 3, width: 300, height: 80, label: "Address" });
                            }}
                          >
                            <UserCheck className="h-3 w-3 mr-2" />
                            Contact Details
                          </Button>
                          <Button 
                            variant="outline" 
                            className="text-xs justify-start"
                            onClick={() => {
                              // Add consent checkboxes
                              const baseY = 50;
                              const spacing = 40;
                              addField("checkbox", { x: 100, y: baseY, width: 20, height: 20, label: "I agree to the terms" });
                              addField("checkbox", { x: 100, y: baseY + spacing, width: 20, height: 20, label: "I consent to data processing" });
                              addField("checkbox", { x: 100, y: baseY + spacing * 2, width: 20, height: 20, label: "I confirm details are correct" });
                            }}
                          >
                            <Check className="h-3 w-3 mr-2" />
                            Consent Checkboxes
                          </Button>
                        </div>
                      </div>

                      <Separator className="my-4" />

                      <div className="space-y-2">
                        <h3 className="text-sm font-medium px-1">Fields on document</h3>
                        <Separator />
                        <div className="flex items-center justify-between px-2 py-1 text-xs text-muted-foreground">
                          <span>Page {currentPageNumber} of {numPages}</span>
                          <span>{documentData.fields.filter(f => f.position?.pageNumber === currentPageNumber).length} fields on this page</span>
                        </div>
                        {documentData.fields.length > 0 ? (
                          <div className="space-y-1">
                            {documentData.fields.map((field) => (
                              <div
                                key={field.id}
                                className={cn(
                                  "flex items-center justify-between p-2 rounded border text-sm", 
                                  selectedField?.id === field.id ? "bg-muted border-primary" : "bg-white",
                                  field.position?.pageNumber === currentPageNumber ? "opacity-100" : "opacity-60"
                                )}
                                onClick={() => handleFieldClick(field)}
                              >
                                <div className="flex items-center gap-2">
                                  {getFieldIcon(field.type)}
                                  <span className="truncate max-w-[140px]">{field.label}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  {field.position?.pageNumber !== currentPageNumber && (
                                    <Badge variant="outline" className="mr-1 text-xs">p{field.position?.pageNumber}</Badge>
                                  )}
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-6 w-6 text-muted-foreground hover:text-foreground"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      duplicateField(field);
                                    }}
                                  >
                                    <Plus className="h-3 w-3" />
                                  </Button>
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
                      <PDFViewer 
                        pdfData={pdfData} 
                        readOnly={false} 
                        onPageChange={handlePageChange} 
                        onDocumentLoad={handleDocumentLoaded}
                      />

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
                  <CardTitle className="text-base">Recipients</CardTitle>
                  <CardDescription>Add multiple signers and define signing order</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Multiple signers section */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-medium">Signers</h3>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="h-8 text-xs" 
                        onClick={() => {
                          // Generate a unique ID
                          const newSignerId = `signer-${Date.now()}`;
                          
                          // Calculate next order number
                          const nextOrder = documentData.signers.length > 0 
                            ? Math.max(...documentData.signers.map(s => s.order)) + 1 
                            : 1;
                            
                          setDocumentData({
                            ...documentData,
                            signers: [
                              ...documentData.signers,
                              {
                                id: newSignerId,
                                userId: "",
                                order: nextOrder,
                                role: "Signer",
                              }
                            ],
                            // Keep backward compatibility
                            signeeId: documentData.signers.length === 0 ? "" : documentData.signeeId,
                          });
                        }}
                      >
                        Add Signer
                      </Button>
                    </div>
                    
                    {documentData.signers.length === 0 ? (
                      // Legacy single signer mode - keeping for backward compatibility
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
                              signers: value ? [
                                {
                                  id: `signer-${Date.now()}`,
                                  userId: value,
                                  order: 1,
                                  role: "Signer",
                                }
                              ] : []
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
                    ) : (
                      // Multi-signer mode
                      <div className="space-y-3">
                        {documentData.signers.map((signer, index) => (
                          <div key={signer.id} className="flex gap-2 items-center p-3 border rounded-md bg-muted/20">
                            <div className="bg-primary text-primary-foreground flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium">
                              {signer.order}
                            </div>
                            
                            <div className="flex-grow grid grid-cols-1 md:grid-cols-2 gap-2">
                              <Select 
                                value={signer.userId} 
                                onValueChange={(value) => {
                                  setDocumentData({
                                    ...documentData,
                                    signers: documentData.signers.map(s => 
                                      s.id === signer.id ? {...s, userId: value} : s
                                    ),
                                    // Keep the signeeId in sync with the first signer for backward compatibility
                                    signeeId: index === 0 ? value : documentData.signeeId,
                                  });
                                }}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select user..." />
                                </SelectTrigger>
                                <SelectContent>
                                  {users.map((user) => (
                                    <SelectItem key={user.id} value={user.id}>
                                      {user.name || user.email}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              
                              <Select 
                                value={signer.role} 
                                onValueChange={(value) => {
                                  setDocumentData({
                                    ...documentData,
                                    signers: documentData.signers.map(s => 
                                      s.id === signer.id ? {...s, role: value} : s
                                    ),
                                  });
                                }}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select role..." />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="Signer">Signer</SelectItem>
                                  <SelectItem value="Reviewer">Reviewer</SelectItem>
                                  <SelectItem value="Approver">Approver</SelectItem>
                                  <SelectItem value="CC">CC</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            
                            <div className="flex items-center">
                              {documentData.signers.length > 1 && (
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-8 w-8 text-destructive"
                                  onClick={() => {
                                    // Remove this signer
                                    const updatedSigners = documentData.signers.filter(s => s.id !== signer.id);
                                    // Reorder the remaining signers
                                    const reorderedSigners = updatedSigners.map((s, i) => ({
                                      ...s,
                                      order: i + 1
                                    }));
                                    setDocumentData({
                                      ...documentData,
                                      signers: reorderedSigners,
                                      // Update signeeId if first signer is removed
                                      signeeId: index === 0 && reorderedSigners.length > 0 ? 
                                        reorderedSigners[0].userId : 
                                        documentData.signeeId
                                    });
                                  }}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </div>
                        ))}

                        <div className="flex gap-2 justify-between items-center pt-1">
                          <div className="text-xs text-muted-foreground">
                            {documentData.signers.length === 1 
                              ? "1 signer added" 
                              : `${documentData.signers.length} signers added in signing order`}
                          </div>
                          
                          <div className="space-x-2">
                            <Label htmlFor="sequential-signing" className="text-xs">Sequential signing</Label>
                            <Switch 
                              id="sequential-signing" 
                              checked={documentData.signers.length > 1} 
                              disabled={documentData.signers.length <= 1}
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <Separator />

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
                    <Label htmlFor="expiryDays">Document Expires After (days)</Label>
                    <Select
                      value={documentData.expiryDays.toString()}
                      onValueChange={(value) =>
                        setDocumentData({
                          ...documentData,
                          expiryDays: parseInt(value),
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select expiry period..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="7">7 days</SelectItem>
                        <SelectItem value="14">14 days</SelectItem>
                        <SelectItem value="30">30 days</SelectItem>
                        <SelectItem value="60">60 days</SelectItem>
                        <SelectItem value="90">90 days</SelectItem>
                      </SelectContent>
                    </Select>
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

                  <div className="flex items-center space-x-2 pt-2">
                    <Switch
                      id="sendNotification"
                      checked={documentData.sendNotification}
                      onCheckedChange={(checked) =>
                        setDocumentData({
                          ...documentData,
                          sendNotification: checked,
                        })
                      }
                    />
                    <Label htmlFor="sendNotification">Send email notification</Label>
                  </div>
                </CardContent>
                <CardFooter className="bg-muted/30 border-t flex gap-2 justify-between">
                  <div className="text-sm text-muted-foreground">
                    <UserCheck className="h-4 w-4 inline-block mr-1" />
                    {documentData.signers.length > 0 ? `${documentData.signers.length} recipient(s) added` : "No recipients added"}
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
          <Button size="sm" onClick={saveDocumentPreparation} className="gap-1" disabled={isSaving}>
            {isSaving ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Save & Send
              </>
            )}
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

                <div className="space-y-2">
                  <Label htmlFor="field-page">Page Number</Label>
                  <Select
                    value={(editingField.position?.pageNumber || 1).toString()}
                    onValueChange={(value) =>
                      setEditingField({
                        ...editingField,
                        position: {
                          ...(editingField.position || { x: 0, y: 0, width: 150, height: 40 }),
                          pageNumber: parseInt(value),
                        },
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select page..." />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: numPages }, (_, i) => (
                        <SelectItem key={i + 1} value={(i + 1).toString()}>
                          Page {i + 1}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Field-specific validations */}
                {editingField.type === "email" && (
                  <div className="space-y-2">
                    <Label className="text-sm">Email validation is applied automatically</Label>
                  </div>
                )}

                {editingField.type === "phone" && (
                  <div className="space-y-2">
                    <Label className="text-sm">Phone number format will be validated automatically</Label>
                  </div>
                )}
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

      {/* Discard changes confirmation */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Discard changes?</AlertDialogTitle>
            <AlertDialogDescription>
              Your document preparation changes will be lost. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => router.push(`/admin/documents/${document.id}`)}>
              Yes, discard changes
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
