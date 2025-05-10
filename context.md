Context:
I’m working on a Next.js 15 App Router project called Royal Sign. My package.json already includes:

- PDF rendering: @react-pdf-viewer/core, pdfjs-dist, react-pdf
- Drag & drop: @dnd-kit/core, @dnd-kit/sortable, @dnd-kit/modifiers, @dnd-kit/utilities
- PDF manipulation: pdf-lib, canvas
- UI & animation: framer-motion, radix-ui, tailwindcss, lucide-react
- Form state & validation: react-hook-form, zod, @hookform/resolvers
- Signature capture: react-signature-canvas
- Storage & API: @vercel/blob, @aws-sdk/client-s3 (configured for Cloudflare R2), next-auth, @prisma/client, prisma
- Utilities: uuid, date-fns, lodash.debounce (optional), react-resize-detector

I need to upgrade my existing implementation so users can:

1. Drag any of these field types from a sidebar—Signature, Initial, Stamp, Company, Full Name, Email, Sign Date, Text Input, Checkbox, Dropdown, Radio Buttons, Attachment, Image, Formula, Payment—onto any page of a rendered PDF.
2. Snap-to-grid placement: when dropping or moving a field, it should align to a configurable grid (e.g. 10 px increments) for precise layouts.
3. Capture precise x/y coordinates relative to that page and store each field’s metadata (`id`, `type`, `page`, `x`, `y`, `width`, `height`, `assignedTo`) in my existing Zustand (or React Query) store.
4. Click a placed field to open a properties panel (using Radix Dialog/Popover) for “Required,” “Assigned signer,” default value, label text, validation rules, and conditional visibility.
5. Render placed fields as absolutely positioned, resizable, and movable boxes over the PDF with smooth GPU-accelerated transforms (via Framer Motion or interact.js).
6. Support multi-page documents by storing each field’s page index and only rendering it on that page; implement lazy-loading and fast pagination via @react-pdf-viewer/page-navigation.
7. Provide a signing mode where a recipient sees only their assigned fields as interactive inputs (text via react-hook-form, date pickers, signature canvas, file upload, checkboxes).
8. On “Finish,” use pdf-lib to embed all filled data and signature images into the original PDF at exact positions and sizes on the correct pages, producing a single, flattened signed PDF with vector-quality output and minimal file size.
9. Persist and load field data JSON to/from R2 storage using the AWS S3 SDK in my Next.js API routes, backed by Prisma/Postgres, so layouts survive reloads and are shareable.
10. Enhance performance and UX beyond Zoho Sign by using:
    • GPU-accelerated animations (Framer Motion)  
    • Smooth drag-resize interactions (interact.js or @dnd-kit modifiers)  
    • Optional OCR-based auto-field detection (Tesseract.js)  
    • Debounced state updates (lodash.debounce)

Additional Dependencies to Install:

- `interactjs` (for snap-to-grid & advanced dragging/resizing)
- `tesseract.js` (for OCR field detection, optional)

Deliverables:

- Pseudocode or diff snippets showing how to:
  1. Wrap each PDF page in a grid-aware drop-target area.
  2. Handle drag-end events to calculate and store grid-aligned coordinates.
  3. Render, drag, resize, and click to configure placed fields with smooth animations.
  4. Filter fields by assignee and render interactive inputs during signing with isolated state.
  5. Inject all filled data into the PDF via pdf-lib to produce a final signed copy.
  6. Use the AWS S3 SDK to persist/load field metadata JSON to/from R2.
- Example code for the properties panel using Radix UI and react-hook-form.
- A brief test plan covering:
  • Dragging/dropping each field type with grid snapping  
  • Editing properties  
  • Signing as a recipient  
  • Downloading the final PDF  
