# Royal Sign: PDF E-Signature Platform Implementation

## Tech Stack Details

- **Framework:** Next.js 15 with App Router + TurboPack
- **UI Components:**
  - **shadcn/ui** component system (built on Radix UI primitives)
  - Tailwind CSS v4 for styling
  - `framer-motion` v12 for animations
  - `lucide-react` for iconography
  - `sonner` for toast notifications
- **PDF Processing:**
  - `@react-pdf-viewer/core` + plugins for viewing
  - `pdf-lib` for PDF manipulation and generation
  - `pdfjs-dist` as the underlying engine
  - `canvas` for rendering
- **Drag & Drop:** Full `@dnd-kit` ecosystem (core, sortable, modifiers, utilities)
- **Forms & Validation:**
  - `react-hook-form` integrated with shadcn/ui components
  - `zod` for schema validation with `@hookform/resolvers`
- **State Management:** Client-side state with React hooks and context
- **Database:** Prisma ORM with MongoDB
- **Authentication:** NextAuth v5 beta with Prisma adapter
- **Storage:**
  - Cloudflare R2 via `@aws-sdk/client-s3`
  - `@vercel/blob` for additional storage needs
- **Signature Capture:** `react-signature-canvas`
- **Special Utilities:**
  - `uuid` for unique identifiers
  - `date-fns` v4 for date operations
  - `react-resize-detector` for responsive components

## Implementation Requirements

I need a complete PDF e-signature solution with these key features:

1. **Document Preparation Interface:**

   - Dynamic field palette built with shadcn/ui components
   - Drag-and-drop field placement with @dnd-kit and grid snapping
   - Field types: Signature, Initial, Text, Date, Checkbox, Dropdown, etc.
   - Multi-page document support with efficient navigation

2. **Field Properties System:**

   - shadcn/ui Dialog/Sheet component for field configuration
   - Assignment of fields to specific signers with color coding
   - Field validation rules using zod schemas
   - Conditional logic support (show/hide based on other fields)

3. **Signing Experience:**

   - Role-specific views showing only assigned fields
   - Interactive form components for data entry
   - Signature/initial capture with react-signature-canvas
   - Mobile-responsive signing experience

4. **PDF Processing:**

   - Non-destructive field overlay during editing
   - Final PDF generation with embedded data using pdf-lib
   - Support for attachments and form submission

5. **Data Layer:**
   - MongoDB persistence via Prisma for document metadata
   - R2 storage for document files and assets
   - User authentication and role management

Please provide implementation guidance that leverages shadcn/ui components effectively, follows best practices for the Next.js App Router, and creates a polished, production-ready e-signature solution.
