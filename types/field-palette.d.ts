import { DocumentFieldType } from "@/types/document";
export interface FieldPaletteProps {
  currentPage: number;
  onAddFieldAction: (
    result: string | { fieldType: DocumentFieldType; pageNumber: number },
  ) => Promise<{ fieldType: DocumentFieldType; pageNumber: number }>;
}
