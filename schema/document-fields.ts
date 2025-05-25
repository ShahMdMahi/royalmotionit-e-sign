import * as z from "zod";

// Base field schema with common properties
const baseFieldSchema = z.object({
  id: z.string(),
  documentId: z.string(),
  type: z.enum([
    "signature",
    "initial",
    "text",
    "date",
    "checkbox",
    "dropdown",
    "email",
    "phone",
    "image",
    "formula",
    "radio",
    "payment",
    "number",
  ]),
  label: z.string(),
  required: z.boolean(),
  placeholder: z.string().optional(),
  x: z.number().nonnegative(),
  y: z.number().nonnegative(),
  width: z.number().positive(),
  height: z.number().positive(),
  pageNumber: z.number().positive(),
  signerId: z.string().optional(),
  color: z.string().optional(),
  fontFamily: z.string().optional(),
  fontSize: z.number().positive().optional(),
  validationRule: z.string().optional(),
  conditionalLogic: z.string().optional(),
  options: z.string().optional(), // JSON array for dropdown fields
  backgroundColor: z.string().optional(),
  borderColor: z.string().optional(),
  textColor: z.string().optional(),
});

// Specific field schemas with type-specific validation

// Signature/Initial fields
export const signatureFieldSchema = baseFieldSchema.extend({
  type: z.literal("signature"),
  value: z
    .string()
    .optional()
    .refine((val) => !val || val.startsWith("data:image"), {
      message: "Signature must be a valid image data URL",
    }),
});

export const initialFieldSchema = baseFieldSchema.extend({
  type: z.literal("initial"),
  value: z
    .string()
    .optional()
    .refine((val) => !val || val.startsWith("data:image"), {
      message: "Initial must be a valid image data URL",
    }),
});

// Text field
export const textFieldSchema = baseFieldSchema.extend({
  type: z.literal("text"),
  value: z.string().optional(),
});

// Email field
export const emailFieldSchema = baseFieldSchema.extend({
  type: z.literal("email"),
  value: z
    .string()
    .refine((val) => !val || val === "" || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val), {
      message: "Invalid email address",
    }),
});

// Phone field
export const phoneFieldSchema = baseFieldSchema.extend({
  type: z.literal("phone"),
  value: z
    .string()
    .refine((val) => !val || val === "" || /^[0-9+\-() ]{10,}$/.test(val), {
      message: "Invalid phone number format",
    }),
});

// Date field
export const dateFieldSchema = baseFieldSchema.extend({
  type: z.literal("date"),
  value: z
    .string()
    .optional()
    .or(z.literal(""))
    .refine((val) => !val || !isNaN(new Date(val).getTime()), {
      message: "Invalid date format",
    }),
});

// Number field
export const numberFieldSchema = baseFieldSchema.extend({
  type: z.literal("number"),
  value: z
    .string()
    .refine((val) => !val || val === "" || !isNaN(Number(val)), {
      message: "Value must be a number",
    }),
});

// Checkbox field
export const checkboxFieldSchema = baseFieldSchema.extend({
  type: z.literal("checkbox"),
  value: z.enum(["true", "false", "checked", "unchecked", ""]).optional(),
});

// Dropdown field
export const dropdownFieldSchema = baseFieldSchema.extend({
  type: z.literal("dropdown"),
  options: z.string().refine(
    (val) => {
      try {
        const options = JSON.parse(val);
        return Array.isArray(options);
      } catch {
        return false;
      }
    },
    { message: "Options must be a valid JSON array" },
  ),
  value: z.string().optional(),
});

// Radio field
export const radioFieldSchema = baseFieldSchema.extend({
  type: z.literal("radio"),
  options: z.string().refine(
    (val) => {
      try {
        const options = JSON.parse(val);
        return Array.isArray(options);
      } catch {
        return false;
      }
    },
    { message: "Options must be a valid JSON array" },
  ),
  value: z.string().optional(),
});

// Image field
export const imageFieldSchema = baseFieldSchema.extend({
  type: z.literal("image"),
  value: z
    .string()
    .optional()
    .refine((val) => !val || val.startsWith("data:image"), {
      message: "Image must be a valid image data URL",
    }),
});

// Payment field
export const paymentFieldSchema = baseFieldSchema.extend({
  type: z.literal("payment"),
  value: z
    .string()
    .optional()
    .refine((val) => !val || !isNaN(Number(val)), {
      message: "Payment value must be a valid number",
    }),
});

// Formula field
export const formulaFieldSchema = baseFieldSchema.extend({
  type: z.literal("formula"),
  value: z.string().optional(),
  validationRule: z
    .string()
    .min(1, { message: "Formula expression is required" }),
});

// Union of all field schemas
export const documentFieldSchema = z.discriminatedUnion("type", [
  signatureFieldSchema,
  initialFieldSchema,
  textFieldSchema,
  emailFieldSchema,
  phoneFieldSchema,
  dateFieldSchema,
  numberFieldSchema,
  checkboxFieldSchema,
  dropdownFieldSchema,
  radioFieldSchema,
  imageFieldSchema,
  paymentFieldSchema,
  formulaFieldSchema,
]);

// Validation function for conditional logic
export function validateConditionalLogic(logicString: string): boolean {
  try {
    const logic = JSON.parse(logicString);
    // Check if the conditional logic has a valid structure
    if (!logic.condition || !logic.action || !logic.targetFieldId) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

// Helper to validate a field based on its type
export function validateField(field: any) {
  switch (field.type) {
    case "signature":
      return signatureFieldSchema.safeParse(field);
    case "initial":
      return initialFieldSchema.safeParse(field);
    case "text":
      return textFieldSchema.safeParse(field);
    case "email":
      return emailFieldSchema.safeParse(field);
    case "phone":
      return phoneFieldSchema.safeParse(field);
    case "date":
      return dateFieldSchema.safeParse(field);
    case "number":
      return numberFieldSchema.safeParse(field);
    case "checkbox":
      return checkboxFieldSchema.safeParse(field);
    case "dropdown":
      return dropdownFieldSchema.safeParse(field);
    case "radio":
      return radioFieldSchema.safeParse(field);
    case "image":
      return imageFieldSchema.safeParse(field);
    case "payment":
      return paymentFieldSchema.safeParse(field);
    case "formula":
      return formulaFieldSchema.safeParse(field);
    default:
      return { success: false, error: `Unknown field type: ${field.type}` };
  }
}
