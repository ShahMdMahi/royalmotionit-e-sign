"use client";

import { useState } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
} from "@dnd-kit/core";
import { restrictToWindowEdges } from "@dnd-kit/modifiers";
import { v4 as uuidv4 } from "uuid";
import { toast } from "sonner";

// Components
import { PDFEditViewer } from "@/components/document/pdf-edit-viewer";
import { FieldPalette } from "@/components/document/field-palette";
import { FieldProperties } from "@/components/document/field-properties";
import { DocumentToolbar } from "@/components/document/document-toolbar";
import { SignerManager } from "@/components/document/signer-manager";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

// Types & Actions
import { Document, DocumentField, DocumentFieldType } from "@/types/document";
import { saveDocumentFields } from "@/actions/document";
import { handleAddField } from "@/actions/field-palette-actions";
import {
  handleFieldDragEnd,
  handleFieldResize,
  handleFieldDelete,
  handleFieldSelect,
} from "@/actions/field-actions";
import {
  handleFieldUpdate,
  handleEditPageChange,
  handleEditTotalPagesChange,
} from "@/actions/pdf-edit-actions";

interface EditDocumentProps {
  document: Document;
  pdfData: Uint8Array;
  initialFields?: DocumentField[];
}

export function EditDocument({
  document,
  pdfData,
  initialFields = [],
}: EditDocumentProps) {
  // State for document fields
  const [fields, setFields] = useState<DocumentField[]>(initialFields);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);
  const [showFieldProperties, setShowFieldProperties] = useState(false);
  const [activeDragField, setActiveDragField] = useState<DocumentField | null>(
    null,
  );
  const [activeTab, setActiveTab] = useState("fields");
  const [saving, setSaving] = useState(false);

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5, // 5px movement before activation
      },
    }),
  );

  // Find selected field
  const selectedField = fields.find((field) => field.id === selectedFieldId);

  // Handle DnD start from field palette
  const handleDragStart = (event: DragStartEvent) => {
    if (event.active && event.active.data && event.active.data.current) {
      const dragData = event.active.data.current as {
        isFieldPalette?: boolean;
        type: DocumentFieldType;
        label: string;
      };
      if (dragData.isFieldPalette) {
        // Create a new field based on the palette item
        const newField: DocumentField = {
          id: uuidv4(),
          documentId: document.id,
          type: dragData.type as DocumentFieldType,
          label: dragData.label,
          placeholder: "",
          required: false,
          x: 0,
          y: 0,
          width: 150,
          height: 50,
          pageNumber: currentPage,
          color: "#000000",
        };
        setActiveDragField(newField);
      }
    }
  };
  // Create custom snapToGrid function since it might not be available in the library
  const snapToGrid = (gridSize: number) => {
    return ({
      transform,
    }: {
      transform: { x: number; y: number; scaleX: number; scaleY: number };
    }) => {
      return {
        ...transform,
        x: Math.round(transform.x / gridSize) * gridSize,
        y: Math.round(transform.y / gridSize) * gridSize,
      };
    };
  };

  // Handle field drop from palette
  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveDragField(null);

    if (!event.over) return;

    // If dragging from field palette to document
    if (
      event.active.data.current?.isFieldPalette &&
      event.over.id === "pdf-container"
    ) {
      // Get dropped position
      const rect = event.over.rect;
      const dragData = event.active.data.current as {
        isFieldPalette?: boolean;
        type: DocumentFieldType;
        label: string;
      };
      const type = dragData.type;
      const label = dragData.label; // Add field at position

      // Calculate position - ensure we have the proper event type
      const clientX = (event.activatorEvent as PointerEvent).clientX;
      const clientY = (event.activatorEvent as PointerEvent).clientY;

      const newField: DocumentField = {
        id: uuidv4(),
        documentId: document.id,
        type: type as DocumentFieldType,
        label,
        placeholder: "",
        required: false,
        x: clientX - rect.left,
        y: clientY - rect.top,
        width: type === "signature" || type === "initial" ? 200 : 150,
        height: type === "signature" || type === "initial" ? 80 : 40,
        pageNumber: currentPage,
        color: "#000000",
      };

      const updatedFields = [...fields, newField];
      setFields(updatedFields);

      // Select the newly added field
      setSelectedFieldId(newField.id);
      setShowFieldProperties(true);

      // Call server actions
      await handleAddField(type as DocumentFieldType);
      await saveDocumentFields(document.id, updatedFields);

      toast.success(`Added ${label} field`);
    }
  };
  // Handle field update
  const handleUpdateField = async (updatedField: DocumentField) => {
    const updatedFields = fields.map((field) =>
      field.id === updatedField.id ? updatedField : field,
    );
    setFields(updatedFields);
    await handleFieldUpdate(updatedField);
    await saveDocumentFields(document.id, updatedFields);
    toast.success("Field updated");
  };

  // Handle field drag position update
  const handleFieldPosition = async (fieldId: string, x: number, y: number) => {
    const updatedFields = fields.map((field) => {
      if (field.id === fieldId) {
        return { ...field, x, y };
      }
      return field;
    });
    setFields(updatedFields);
    await handleFieldDragEnd(fieldId, x, y);
    await saveDocumentFields(document.id, updatedFields);
  };
  // Handle field resize
  const handleFieldDimensionChange = async (
    fieldId: string,
    width: number,
    height: number,
  ) => {
    const updatedFields = fields.map((field) => {
      if (field.id === fieldId) {
        return { ...field, width, height };
      }
      return field;
    });
    setFields(updatedFields);
    await handleFieldResize(fieldId, width, height);
    await saveDocumentFields(document.id, updatedFields);
  };

  // Handle field deletion
  const handleDeleteField = async (fieldId: string) => {
    const updatedFields = fields.filter((field) => field.id !== fieldId);
    setFields(updatedFields);
    setSelectedFieldId(null);
    setShowFieldProperties(false);
    await handleFieldDelete(fieldId);
    await saveDocumentFields(document.id, updatedFields);
    toast.success("Field deleted");
  };

  // Handle field selection
  const handleSelectField = async (field: DocumentField) => {
    setSelectedFieldId(field.id);
    setShowFieldProperties(true);
    await handleFieldSelect(field);
  };

  // Handle page change
  const handlePageChange = async (pageNumber: number) => {
    setCurrentPage(pageNumber);
    await handleEditPageChange(pageNumber);
  };

  // Handle total pages change (when PDF loads)
  const handleTotalPagesChange = async (pages: number) => {
    setTotalPages(pages);
    await handleEditTotalPagesChange(pages);
  };

  // Handle document save/prepare
  const handlePrepareDocument = async () => {
    setSaving(true);
    try {
      await saveDocumentFields(document.id, fields);
      toast.success("Document prepared successfully");
    } catch (error) {
      console.error("Failed to prepare document:", error);
      toast.error("Failed to prepare document");
    } finally {
      setSaving(false);
    }
  };
  return (
    <div className="flex flex-col h-full">
      {/* Document Toolbar */}
      <DocumentToolbar
        document={document}
        isSubmitting={saving}
        onSave={handlePrepareDocument}
      />

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left sidebar with tabs */}
        <div className="w-80 border-r border-border flex flex-col">
          <Tabs
            defaultValue="fields"
            value={activeTab}
            onValueChange={setActiveTab}
          >
            <TabsList className="w-full">
              <TabsTrigger value="fields" className="flex-1">
                Fields
              </TabsTrigger>
              <TabsTrigger value="signers" className="flex-1">
                Signers
              </TabsTrigger>
              <TabsTrigger value="settings" className="flex-1">
                Settings
              </TabsTrigger>
            </TabsList>

            <TabsContent value="fields" className="flex-1 overflow-y-auto p-4">
              <FieldPalette onAddFieldAction={handleAddField} />
            </TabsContent>

            <TabsContent value="signers" className="flex-1 overflow-y-auto p-4">
              <SignerManager documentId={document.id} />
            </TabsContent>

            <TabsContent
              value="settings"
              className="flex-1 overflow-y-auto p-4"
            >
              {/* Document settings */}
              <h3 className="text-lg font-medium mb-2">Document Settings</h3>
              {/* Additional settings can go here */}
            </TabsContent>
          </Tabs>
        </div>

        {/* Main PDF viewer area */}
        <div className="flex-1 overflow-hidden relative">
          <DndContext
            sensors={sensors}
            modifiers={[snapToGrid(10), restrictToWindowEdges]}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <PDFEditViewer
              pdfData={pdfData}
              fields={fields}
              currentPage={currentPage}
              onPageChangeAction={(page) => {
                handlePageChange(page);
                return Promise.resolve(page);
              }}
              onTotalPagesChangeAction={(pages) => {
                handleTotalPagesChange(pages);
                return Promise.resolve(pages);
              }}
              onFieldUpdateAction={(field) => {
                handleUpdateField(field);
                return Promise.resolve(field);
              }}
              onFieldDeleteAction={(fieldId) => {
                handleDeleteField(fieldId);
                return Promise.resolve(fieldId);
              }}
              onFieldDragEnd={(id, x, y) => {
                handleFieldPosition(id, x, y);
                return Promise.resolve({ id, x, y });
              }}
              onFieldResize={(id, width, height) => {
                handleFieldDimensionChange(id, width, height);
                return Promise.resolve({ id, width, height });
              }}
              selectedFieldId={selectedFieldId || undefined}
              onFieldSelectAction={(field) => {
                if (field) handleSelectField(field);
                return Promise.resolve(field);
              }}
            />
            <DragOverlay>
              {activeDragField && (
                <div
                  className="border-2 border-primary bg-opacity-10 bg-primary p-2 rounded"
                  style={{
                    width: activeDragField.width,
                    height: activeDragField.height,
                  }}
                >
                  {activeDragField.label}
                </div>
              )}
            </DragOverlay>
          </DndContext>
          {/* Page navigation at the bottom */}
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
            <div className="flex items-center gap-2 bg-background/80 backdrop-blur-sm p-2 rounded-lg shadow">
              <button
                onClick={() =>
                  handlePageChange(currentPage > 1 ? currentPage - 1 : 1)
                }
                className="p-1 rounded hover:bg-muted"
                disabled={currentPage <= 1}
              >
                &lt;
              </button>
              <span>
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() =>
                  handlePageChange(
                    currentPage < totalPages ? currentPage + 1 : totalPages,
                  )
                }
                className="p-1 rounded hover:bg-muted"
                disabled={currentPage >= totalPages}
              >
                &gt;
              </button>
            </div>
          </div>
        </div>
        {/* Field properties panel */}
        <Sheet
          open={showFieldProperties && !!selectedField}
          onOpenChange={setShowFieldProperties}
        >
          <SheetContent side="right" className="w-[400px] sm:w-[540px]">
            <SheetHeader>
              <SheetTitle>Field Properties</SheetTitle>
              <SheetDescription>Configure the selected field</SheetDescription>
            </SheetHeader>

            {selectedField && (
              <FieldProperties
                field={selectedField}
                onUpdateAction={(field) => {
                  handleUpdateField(field as DocumentField);
                  return Promise.resolve(field);
                }}
                onCloseAction={() => {
                  setShowFieldProperties(false);
                  return Promise.resolve(true);
                }}
              />
            )}
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );
}
