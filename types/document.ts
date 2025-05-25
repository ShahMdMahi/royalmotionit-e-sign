export interface Document {
  id: string;
  title: string;
  description?: string;
  authorId: string;
  authorName?: string;
  authorEmail?: string;
  status:
    | "DRAFT"
    | "PENDING"
    | "COMPLETED"
    | "EXPIRED"
    | "DECLINED"
    | "CANCELED";
  key: string;
  type: string;
  createdAt: Date;
  updatedAt: Date;
  preparedAt?: Date;
  sentAt?: Date;
  viewedAt?: Date;
  signedAt?: Date;
  expiresAt?: Date;
  enableWatermark?: boolean;
  watermarkText?: string;
  fields?: DocumentField[];
  signer?: Signer; // Single signer system
  signers?: Signer[]; // Added back for compatibility
}

export type DocumentFieldType =
  | "signature"
  | "initial"
  | "text"
  | "textarea"
  | "date"
  | "checkbox"
  | "dropdown"
  | "email"
  | "phone"
  | "image"
  | "formula"
  | "radio"
  | "payment"
  | "number";

export interface DocumentField {
  id: string;
  documentId: string;
  type: DocumentFieldType;
  label: string;
  required: boolean;
  placeholder?: string;
  isVisible?: boolean;
  x: number;
  y: number;
  width: number;
  height: number;
  pageNumber: number;
  value?: string;
  signerId?: string; // Added back for compatibility with existing code
  color?: string;
  fontFamily?: string;
  fontSize?: number;
  validationRule?: string;
  conditionalLogic?: string;
  options?: string; // JSON array of options for dropdown fields
  backgroundColor?: string;
  borderColor?: string;
  textColor?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Signer {
  id: string;
  documentId: string;
  email: string;
  name?: string;
  role?: string;
  status: "PENDING" | "VIEWED" | "COMPLETED" | "DECLINED";
  accessCode?: string;
  invitedAt?: Date;
  viewedAt?: Date;
  completedAt?: Date;
  notifiedAt?: Date;
  declinedAt?: Date;
  declineReason?: string;
  color?: string; // Custom property for UI display
}

export interface DocumentHistory {
  id: string;
  documentId: string;
  action: string;
  actorEmail?: string;
  actorName?: string;
  actorRole?: string;
  ipAddress?: string;
  userAgent?: string;
  details?: string;
  timestamp: Date;
}

export interface Attachment {
  id: string;
  documentId: string;
  name: string;
  description?: string;
  key: string;
  url?: string;
  size: number;
  mimeType: string;
  uploadedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}
