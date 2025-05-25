// Example usage and testing for sign-document component
// filepath: c:\Users\shahm\Desktop\RoyalMotionIT\e-sign\components\document\sign-document-example.tsx

import { SignDocumentComponent } from "./sign-document";
import { DocumentStatus, SignerStatus, DocumentType } from "@prisma/client";

// Complete mock document data that matches Prisma Document type
const exampleDocument = {
  // Required Prisma Document properties
  id: "doc-123",
  createdAt: new Date("2024-01-01T00:00:00Z"),
  updatedAt: new Date("2024-01-01T00:00:00Z"),
  title: "Sample Contract",
  description: "A sample contract for testing purposes" as string | null,
  pathname: "documents/sample-contract.pdf" as string | null,
  url: "https://example.com/sample-contract.pdf" as string | null,
  key: "documents/sample-contract.pdf" as string | null,
  type: "CONTRACT" as string | null,
  fileName: "sample-contract.pdf" as string | null,
  status: "PENDING" as DocumentStatus,
  signedAt: null as Date | null,
  expiresAt: null as Date | null,
  preparedAt: new Date("2024-01-01T00:00:00Z") as Date | null,
  sentAt: new Date("2024-01-01T00:00:00Z") as Date | null,
  authorId: "author-123",
  documentType: "UNSIGNED" as DocumentType,
  hash: "sample-hash-123" as string | null,
  dueDate: null as Date | null,
  allowDownload: true,
  allowPrint: true,
  reminderEnabled: false,
  reminderFrequency: null as number | null,
  lastReminderSent: null as Date | null,
  completionMessage: null as string | null,
  notifyOnCompletion: true,
  enableWatermark: false,
  watermarkText: null as string | null,
  pageCount: 1 as number | null,
  fileSize: 1024 as number | null,
  originalFormat: "PDF" as string | null,
  // Additional properties for the component
  signers: [
    {
      // Required Prisma Signer properties
      id: "signer-1",
      name: "John Doe" as string | null,
      email: "john.doe@example.com",
      role: "SIGNER" as string | null,
      status: "PENDING" as SignerStatus,
      accessCode: null as string | null,
      invitedAt: new Date("2024-01-01T00:00:00Z") as Date | null,
      viewedAt: null as Date | null,
      completedAt: null as Date | null,
      notifiedAt: null as Date | null,
      declinedAt: null as Date | null,
      declineReason: null as string | null,
      ipAddress: null as string | null,
      userAgent: null as string | null,
      userId: null as string | null,
      documentId: "doc-123",
      createdAt: new Date("2024-01-01T00:00:00Z"),
      updatedAt: new Date("2024-01-01T00:00:00Z"),
    },
  ],
  fields: [] as any[], // Will be populated with example fields
};

// Example fields for testing all field types
const exampleFields = [
  {
    id: "field-1",
    type: "text" as const,
    label: "Full Name",
    required: true,
    placeholder: "Enter your full name",
    x: 100,
    y: 200,
    width: 200,
    height: 30,
    pageNumber: 1,
    documentId: "doc-123",
  },
  {
    id: "field-2",
    type: "email" as const,
    label: "Email Address",
    required: true,
    placeholder: "Enter your email",
    x: 100,
    y: 250,
    width: 200,
    height: 30,
    pageNumber: 1,
    documentId: "doc-123",
  },
  {
    id: "field-3",
    type: "date" as const,
    label: "Date of Birth",
    required: false,
    x: 100,
    y: 300,
    width: 150,
    height: 30,
    pageNumber: 1,
    documentId: "doc-123",
  },
  {
    id: "field-4",
    type: "checkbox" as const,
    label: "I agree to terms",
    required: true,
    placeholder: "Check to agree",
    x: 100,
    y: 350,
    width: 20,
    height: 20,
    pageNumber: 1,
    documentId: "doc-123",
  },
  {
    id: "field-5",
    type: "dropdown" as const,
    label: "Country",
    required: true,
    options: "USA,Canada,UK,Australia",
    x: 100,
    y: 400,
    width: 150,
    height: 30,
    pageNumber: 1,
    documentId: "doc-123",
  },
  {
    id: "field-6",
    type: "radio" as const,
    label: "Preferred Contact",
    required: true,
    options: "Email,Phone,Mail",
    x: 100,
    y: 450,
    width: 200,
    height: 80,
    pageNumber: 1,
    documentId: "doc-123",
  },
  {
    id: "field-7",
    type: "textarea" as const,
    label: "Additional Comments",
    required: false,
    placeholder: "Enter any additional comments",
    x: 100,
    y: 550,
    width: 300,
    height: 100,
    pageNumber: 1,
    documentId: "doc-123",
  },
  {
    id: "field-8",
    type: "signature" as const,
    label: "Your Signature",
    required: true,
    x: 100,
    y: 700,
    width: 200,
    height: 50,
    pageNumber: 1,
    documentId: "doc-123",
  },
];

// Example signer that matches Prisma Signer type
const exampleSigner = {
  // Required Prisma Signer properties
  id: "signer-1",
  name: "John Doe" as string | null,
  email: "john.doe@example.com",
  role: "SIGNER" as string | null,
  status: "PENDING" as SignerStatus,
  accessCode: null as string | null,
  invitedAt: new Date("2024-01-01T00:00:00Z") as Date | null,
  viewedAt: null as Date | null,
  completedAt: null as Date | null,
  notifiedAt: null as Date | null,
  declinedAt: null as Date | null,
  declineReason: null as string | null,
  ipAddress: null as string | null,
  userAgent: null as string | null,
  userId: null as string | null,
  documentId: "doc-123",
  createdAt: new Date("2024-01-01T00:00:00Z"),
  updatedAt: new Date("2024-01-01T00:00:00Z"),
};

// Testing scenarios
export const SignDocumentTestScenarios = {
  // Basic functionality test
  basicTest: () => {
    return (
      <SignDocumentComponent
        document={exampleDocument}
        signer={exampleSigner}
        fields={exampleFields.slice(0, 3)} // Test with fewer fields first
      />
    );
  },

  // All field types test
  allFieldTypesTest: () => {
    return (
      <SignDocumentComponent
        document={exampleDocument}
        signer={exampleSigner}
        fields={exampleFields} // Test with all field types
      />
    );
  },

  // Mobile responsiveness test
  mobileTest: () => {
    return (
      <div style={{ width: "375px", height: "667px" }}>
        {" "}
        {/* iPhone dimensions */}
        <SignDocumentComponent document={exampleDocument} signer={exampleSigner} fields={exampleFields} />
      </div>
    );
  },

  // Large number of fields test
  performanceTest: () => {
    const manyFields = Array.from({ length: 50 }, (_, i) => ({
      ...exampleFields[0],
      id: `field-${i}`,
      label: `Field ${i + 1}`,
      y: 100 + i * 60,
      pageNumber: Math.floor(i / 10) + 1,
    }));

    return <SignDocumentComponent document={exampleDocument} signer={exampleSigner} fields={manyFields} />;
  },
};

// Manual testing checklist
export const testingChecklist = [
  "✅ All field types render correctly",
  "✅ Field validation works for each type",
  "✅ Auto-save functionality works",
  "✅ Manual save with Ctrl+S works",
  "✅ Signing with Ctrl+Enter works when ready",
  "✅ Mobile sidebar toggles correctly",
  "✅ Error navigation jumps to correct fields",
  "✅ Progress tracking updates correctly",
  "✅ Signature canvas works on mobile and desktop",
  "✅ Field completion status updates in real-time",
  "✅ Backup restoration works after page refresh",
  "✅ Responsive design works on various screen sizes",
];

// Example validation rules for testing
export const exampleValidationRules = {
  text: "minLength:2,maxLength:50",
  email: "regex:^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$",
  phone: "regex:^[0-9+\\-() ]{10,}$",
  textarea: "minLength:10,maxLength:500",
};

console.log("Sign Document Component Testing Examples Ready");
console.log("Testing Checklist:", testingChecklist);
