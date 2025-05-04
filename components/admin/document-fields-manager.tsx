import React, { useState, useEffect } from 'react';
import { 
  DndContext, 
  closestCenter, 
  KeyboardSensor, 
  PointerSensor, 
  useSensor, 
  useSensors,
  DragEndEvent
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import { CSS } from '@dnd-kit/utilities';

import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

import { 
  PenLine, 
  MousePointerSquareDashed,
  Pencil, 
  Type, 
  CalendarDays, 
  CheckSquare, 
  CircleOff, 
  GripVertical,
  Trash2,
  CircleDot,
  BookText,
  Copy,
  Plus,
  UserRound,
  MailCheck,
  Phone
} from 'lucide-react';

// Field types
export type FieldType = 
  | 'signature' 
  | 'initial' 
  | 'text' 
  | 'date' 
  | 'checkbox' 
  | 'radio' 
  | 'dropdown'
  | 'name'
  | 'email'
  | 'phone';

export interface DocumentField {
  id: string;
  type: FieldType;
  name: string;
  label?: string;
  required: boolean;
  placeholder?: string;
  value?: string | boolean | number; // Replace any with specific types
  options?: string[];
  assignedTo?: string | null;
  pageNumber: number;
  position: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  createdAt: Date;
  modifiedAt: Date;
}

interface Recipient {
  id: string;
  name: string;
  email: string;
  role?: string;
  color?: string;
}

interface DocumentFieldsManagerProps {
  fields: DocumentField[];
  recipients: Recipient[];
  onFieldsChange: (fields: DocumentField[]) => void;
  onAddField: (field: Partial<DocumentField>) => void;
  onDeleteField: (fieldId: string) => void;
  activePageNumber: number;
}

// Sortable field item component
function SortableFieldItem({ field, recipients, onUpdate, onDelete }: { 
  field: DocumentField; 
  recipients: Recipient[];
  onUpdate: (field: DocumentField) => void;
  onDelete: (fieldId: string) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: field.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 100 : 1,
  };

  // Get assigned recipient details if available
  const assignedRecipient = recipients.find(r => r.id === field.assignedTo);

  // Handle field updates
  const handleFieldUpdate = (updatedValues: Partial<DocumentField>) => {
    onUpdate({
      ...field,
      ...updatedValues,
      modifiedAt: new Date()
    });
  };

  // Get icon based on field type
  const getFieldIcon = () => {
    switch (field.type) {
      case 'signature':
        return <PenLine className="h-4 w-4" />;
      case 'initial':
        return <Pencil className="h-4 w-4" />;
      case 'text':
        return <Type className="h-4 w-4" />;
      case 'date':
        return <CalendarDays className="h-4 w-4" />;
      case 'checkbox':
        return <CheckSquare className="h-4 w-4" />;
      case 'radio':
        return <CircleDot className="h-4 w-4" />;
      case 'dropdown':
        return <BookText className="h-4 w-4" />;
      case 'name':
        return <UserRound className="h-4 w-4" />;
      case 'email':
        return <MailCheck className="h-4 w-4" />;
      case 'phone':
        return <Phone className="h-4 w-4" />;
      default:
        return <MousePointerSquareDashed className="h-4 w-4" />;
    }
  };

  // Get field type display name
  const getFieldTypeName = () => {
    switch (field.type) {
      case 'signature': return 'Signature';
      case 'initial': return 'Initial';
      case 'text': return 'Text Field';
      case 'date': return 'Date';
      case 'checkbox': return 'Checkbox';
      case 'radio': return 'Radio Button';
      case 'dropdown': return 'Dropdown';
      case 'name': return 'Name';
      case 'email': return 'Email';
      case 'phone': return 'Phone';
      default: return 'Field';
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`mb-2 rounded-md border ${
        field.assignedTo && assignedRecipient
          ? `border-l-4 border-l-[${assignedRecipient.color || '#2563eb'}]`
          : ''
      }`}
    >
      <div className="flex items-center p-3 bg-card">
        <div
          {...attributes}
          {...listeners}
          className="mr-2 cursor-grab active:cursor-grabbing"
        >
          <GripVertical className="h-5 w-5 text-muted-foreground" />
        </div>

        <div className="flex-1 flex items-center">
          <div className="flex items-center w-7 h-7 rounded-full bg-muted justify-center mr-2">
            {getFieldIcon()}
          </div>
          <div>
            <p className="text-sm font-medium">{field.name || getFieldTypeName()}</p>
            <p className="text-xs text-muted-foreground">
              Page {field.pageNumber} · {getFieldTypeName()}{field.required ? ' · Required' : ''}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {field.assignedTo && assignedRecipient && (
            <Badge 
              variant="outline" 
              className="h-6 text-xs"
              style={{ borderColor: assignedRecipient.color || '#2563eb', color: assignedRecipient.color || '#2563eb' }}
            >
              {assignedRecipient.name}
            </Badge>
          )}

          <Accordion type="single" collapsible className="w-auto">
            <AccordionItem value="edit" className="border-0">
              <AccordionTrigger className="py-0 px-2">
                <span className="sr-only">Edit Field</span>
              </AccordionTrigger>
              <AccordionContent className="border rounded-md mt-2 p-3 bg-background">
                <div className="space-y-3">
                  <div>
                    <Label htmlFor={`field-${field.id}-name`} className="text-xs">Field Name</Label>
                    <Input
                      id={`field-${field.id}-name`}
                      value={field.name}
                      onChange={(e) => handleFieldUpdate({ name: e.target.value })}
                      className="h-8 mt-1 text-sm"
                    />
                  </div>

                  {(field.type === 'text' || field.type === 'name' || field.type === 'email' || field.type === 'phone') && (
                    <div>
                      <Label htmlFor={`field-${field.id}-placeholder`} className="text-xs">Placeholder</Label>
                      <Input
                        id={`field-${field.id}-placeholder`}
                        value={field.placeholder || ''}
                        onChange={(e) => handleFieldUpdate({ placeholder: e.target.value })}
                        className="h-8 mt-1 text-sm"
                      />
                    </div>
                  )}

                  {field.type === 'dropdown' && (
                    <div>
                      <Label className="text-xs">Options</Label>
                      <div className="space-y-2 mt-1">
                        {field.options?.map((option, index) => (
                          <div key={index} className="flex gap-1">
                            <Input
                              value={option}
                              onChange={(e) => {
                                const newOptions = [...(field.options || [])];
                                newOptions[index] = e.target.value;
                                handleFieldUpdate({ options: newOptions });
                              }}
                              className="h-7 text-sm"
                            />
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => {
                                const newOptions = [...(field.options || [])];
                                newOptions.splice(index, 1);
                                handleFieldUpdate({ options: newOptions });
                              }}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full h-7 text-xs"
                          onClick={() => {
                            const newOptions = [...(field.options || []), "New Option"];
                            handleFieldUpdate({ options: newOptions });
                          }}
                        >
                          <Plus className="h-3 w-3 mr-1" /> Add Option
                        </Button>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id={`field-${field.id}-required`}
                        checked={field.required}
                        onCheckedChange={(checked) => handleFieldUpdate({ required: !!checked })}
                      />
                      <Label htmlFor={`field-${field.id}-required`} className="text-xs">Required</Label>
                    </div>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-7 text-xs">
                          {assignedRecipient?.name || 'Assign To'}
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {recipients.map((recipient) => (
                          <DropdownMenuItem
                            key={recipient.id}
                            onClick={() => handleFieldUpdate({ assignedTo: recipient.id })}
                            className="text-xs"
                          >
                            <div className="w-2 h-2 rounded-full mr-2" style={{ backgroundColor: recipient.color || '#2563eb' }}></div>
                            {recipient.name}
                          </DropdownMenuItem>
                        ))}
                        {field.assignedTo && (
                          <DropdownMenuItem
                            onClick={() => handleFieldUpdate({ assignedTo: null })}
                            className="text-xs text-destructive"
                          >
                            <CircleOff className="h-3 w-3 mr-2" /> Unassign
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <div className="pt-2 flex justify-end">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="icon"
                            className="h-7 w-7 mr-2"
                            onClick={() => {
                              const newField = {
                                ...field,
                                id: `field-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
                                name: `${field.name || getFieldTypeName()} (Copy)`,
                                createdAt: new Date(),
                                modifiedAt: new Date(),
                              };
                              onUpdate(newField);
                            }}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Duplicate</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>

                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button 
                            variant="destructive" 
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => onDelete(field.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Delete</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </div>
    </div>
  );
}

export function DocumentFieldsManager({
  fields,
  recipients,
  onFieldsChange,
  onAddField,
  onDeleteField,
  activePageNumber,
}: DocumentFieldsManagerProps) {
  // State
  const [localFields, setLocalFields] = useState<DocumentField[]>(fields);
  const [filteredFields, setFilteredFields] = useState<DocumentField[]>([]);
  const [filterByPage, setFilterByPage] = useState(true);
  const [showUnassigned, setShowUnassigned] = useState(true);
  
  // Sensors for drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // Update local fields when props change
  useEffect(() => {
    setLocalFields(fields);
  }, [fields]);

  // Filter fields based on active page
  useEffect(() => {
    let result = localFields;
    
    if (filterByPage) {
      result = result.filter(field => field.pageNumber === activePageNumber);
    }
    
    if (!showUnassigned) {
      result = result.filter(field => field.assignedTo);
    }
    
    setFilteredFields(result);
  }, [localFields, activePageNumber, filterByPage, showUnassigned]);

  // Handle drag end
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      // Reorder the fields
      setLocalFields((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        
        const reordered = arrayMove(items, oldIndex, newIndex);
        
        // Notify parent about the change
        onFieldsChange(reordered);
        
        return reordered;
      });
    }
  };

  // Handle field update
  const handleFieldUpdate = (updatedField: DocumentField) => {
    const updatedFields = localFields.map(field => 
      field.id === updatedField.id ? updatedField : field
    );
    
    setLocalFields(updatedFields);
    onFieldsChange(updatedFields);
  };

  // Create new field with default values
  const createNewField = (type: FieldType) => {
    const newField: Partial<DocumentField> = {
      type,
      name: getDefaultFieldName(type),
      required: type === 'signature',
      pageNumber: activePageNumber,
      position: {
        x: 100,
        y: 100,
        width: getDefaultFieldWidth(type),
        height: getDefaultFieldHeight(type),
      },
      options: type === 'dropdown' ? ['Option 1', 'Option 2', 'Option 3'] : undefined,
      placeholder: getDefaultPlaceholder(type),
    };
    
    onAddField(newField);
  };

  // Helper to get default field name based on type
  function getDefaultFieldName(type: FieldType): string {
    switch (type) {
      case 'signature': return 'Signature';
      case 'initial': return 'Initial';
      case 'text': return 'Text Field';
      case 'date': return 'Date';
      case 'checkbox': return 'Checkbox';
      case 'radio': return 'Radio Button';
      case 'dropdown': return 'Dropdown';
      case 'name': return 'Full Name';
      case 'email': return 'Email Address';
      case 'phone': return 'Phone Number';
      default: return 'Field';
    }
  }

  // Helper to get default field width based on type
  function getDefaultFieldWidth(type: FieldType): number {
    switch (type) {
      case 'signature': return 200;
      case 'initial': return 100;
      case 'text': case 'name': case 'email': case 'phone': return 150;
      case 'date': return 120;
      case 'checkbox': case 'radio': return 24;
      case 'dropdown': return 150;
      default: return 150;
    }
  }

  // Helper to get default field height based on type
  function getDefaultFieldHeight(type: FieldType): number {
    switch (type) {
      case 'signature': return 80;
      case 'initial': return 60;
      case 'text': case 'date': case 'name': case 'email': case 'phone': case 'dropdown': return 30;
      case 'checkbox': case 'radio': return 24;
      default: return 30;
    }
  }

  // Helper to get default placeholder based on field type
  function getDefaultPlaceholder(type: FieldType): string | undefined {
    switch (type) {
      case 'text': return 'Enter text here';
      case 'name': return 'Enter your full name';
      case 'email': return 'Enter your email address';
      case 'phone': return 'Enter your phone number';
      default: return undefined;
    }
  }

  // Group fields by page for display
  const fieldsByPage = localFields.reduce<Record<number, DocumentField[]>>((acc, field) => {
    if (!acc[field.pageNumber]) {
      acc[field.pageNumber] = [];
    }
    acc[field.pageNumber].push(field);
    return acc;
  }, {});

  // Count fields and get page numbers
  const totalFields = localFields.length;
  const currentPageFields = localFields.filter(field => field.pageNumber === activePageNumber).length;
  const allPages = Object.keys(fieldsByPage).map(Number).sort((a, b) => a - b);
  
  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle>Document Fields</CardTitle>
          <Badge variant="outline" className="text-xs py-0">
            {filterByPage ? `${currentPageFields} on page` : `${totalFields} total`}
          </Badge>
        </div>
        <CardDescription>
          Manage form fields and signatures
        </CardDescription>
      </CardHeader>

      <CardContent className="pb-3">
        {/* Filters and view options */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-2">
              <Switch 
                id="filter-by-page" 
                checked={filterByPage} 
                onCheckedChange={setFilterByPage}
              />
              <Label htmlFor="filter-by-page" className="text-sm">Current page only</Label>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Switch 
              id="show-unassigned" 
              checked={showUnassigned} 
              onCheckedChange={setShowUnassigned}
            />
            <Label htmlFor="show-unassigned" className="text-sm">Show unassigned</Label>
          </div>
        </div>
        
        {/* Field list with drag and drop */}
        <DndContext 
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
          modifiers={[restrictToVerticalAxis]}
        >
          <SortableContext 
            items={filteredFields.map(field => field.id)} 
            strategy={verticalListSortingStrategy}
          >
            <ScrollArea className="h-[400px] pr-4">
              {filteredFields.length > 0 ? (
                filteredFields.map((field) => (
                  <SortableFieldItem 
                    key={field.id} 
                    field={field} 
                    recipients={recipients}
                    onUpdate={handleFieldUpdate}
                    onDelete={onDeleteField}
                  />
                ))
              ) : (
                <div className="py-8 text-center">
                  <p className="text-sm text-muted-foreground">
                    {filterByPage 
                      ? `No fields on page ${activePageNumber}` 
                      : 'No fields in document'}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Add fields using the buttons below
                  </p>
                </div>
              )}
            </ScrollArea>
          </SortableContext>
        </DndContext>
        
        {/* Pages navigation */}
        {!filterByPage && allPages.length > 1 && (
          <div className="mt-4">
            <Label className="text-xs mb-2 block">Jump to page:</Label>
            <div className="flex flex-wrap gap-1">
              {allPages.map((pageNum) => (
                <Badge 
                  key={pageNum}
                  variant={pageNum === activePageNumber ? "default" : "outline"}
                  className="cursor-pointer"
                  // This would integrate with the PDF viewer to change pages
                  // onClick={() => onPageChange(pageNum)}
                >
                  {pageNum}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>

      <CardFooter className="pt-3 border-t">
        <div className="grid grid-cols-5 gap-1 w-full">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="sm" onClick={() => createNewField('signature')}>
                  <PenLine className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Signature</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="sm" onClick={() => createNewField('initial')}>
                  <Pencil className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Initial</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="sm" onClick={() => createNewField('text')}>
                  <Type className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Text Field</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="sm" onClick={() => createNewField('date')}>
                  <CalendarDays className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Date</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="sm" onClick={() => createNewField('checkbox')}>
                  <CheckSquare className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Checkbox</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </CardFooter>
    </Card>
  );
}