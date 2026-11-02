import { z } from "zod"

/**
 * Single source of truth for the product dialogs.
 *
 * The API rejects a barcode longer than 64 characters, so the browser checks
 * the same limit. `trim()` runs before `max()` on purpose: a 64 character
 * barcode pasted with a trailing space is valid once the whitespace is
 * removed, and measuring the raw value would reject it.
 */
export const productFormSchema = z.object({
  name: z.string().min(1, { message: "Name is required" }),
  sku: z.string().min(1, { message: "SKU is required" }),
  barcode: z
    .string()
    .trim()
    .max(64, { message: "Barcode must be at most 64 characters" })
    .optional(),
  price: z
    .string()
    .regex(/^\d+(?:\.\d+)?$/, { message: "Enter a valid price" })
    .refine((value) => /[1-9]/.test(value), {
      message: "Price must be greater than zero",
    }),
  stock: z.number().int().min(0, { message: "Stock cannot be negative" }),
  description: z.string().optional(),
})

export type ProductFormData = z.infer<typeof productFormSchema>

/** Maps the form state onto the payload shape, sending an empty barcode as null. */
export function toProductPayload(data: ProductFormData) {
  const barcode = data.barcode ?? ""
  return { ...data, barcode: barcode === "" ? null : barcode }
}
