import type { ColumnDef } from "@tanstack/react-table"
import type { ReactNode } from "react"

import type { ProductPublic } from "@/client"
import type { DataTableFeatures } from "@/components/Common/DataTable"
import { ProductActionsMenu } from "./ProductActionsMenu"

export function formatDateTime(value: string | null | undefined) {
  if (!value) return "—"
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return value
  return parsed.toLocaleString()
}

function formatPrice(price: string) {
  const formatted = new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
  }).format(Number(price))
  return formatted.includes("NaN") ? price : formatted
}

interface ProductColumnSpec {
  /** Product field backing the column, used as the table accessor. */
  accessorKey: keyof ProductPublic
  header: string
  /** Skeleton cell for the loading state, so widths live next to the column. */
  skeletonClass: string
  cell: (
    product: ProductPublic,
    onEdit?: (product: ProductPublic) => void,
  ) => ReactNode
}

/**
 * Single source of truth for the product table columns. Header labels are
 * derived from this list, and the loading skeleton reuses the same headers and
 * widths, so a column added here appears everywhere from one edit.
 */
const PRODUCT_COLUMN_SPECS: ProductColumnSpec[] = [
  {
    accessorKey: "name",
    header: "Name",
    skeletonClass: "h-4 w-32",
    // The name is the row's edit affordance: a real button that opens the
    // product drawer. Without write access it degrades to plain text, so a
    // normal user never gets a focusable control that does nothing.
    cell: (product, onEdit) =>
      onEdit ? (
        <button
          type="button"
          onClick={() => onEdit(product)}
          className="rounded-sm font-medium text-left underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
        >
          {product.name}
        </button>
      ) : (
        <span className="font-medium">{product.name}</span>
      ),
  },
  {
    accessorKey: "sku",
    header: "SKU",
    skeletonClass: "h-4 w-24 font-mono",
    cell: (product) => <span className="font-mono text-sm">{product.sku}</span>,
  },
  {
    accessorKey: "price",
    header: "Price",
    skeletonClass: "h-4 w-24",
    cell: (product) => <span>{formatPrice(product.price)}</span>,
  },
  {
    accessorKey: "stock",
    header: "Stock",
    skeletonClass: "h-4 w-12",
    cell: (product) => <span>{product.stock ?? 0}</span>,
  },
  {
    accessorKey: "updated_at",
    header: "Last Update",
    skeletonClass: "h-4 w-32",
    cell: (product) => (
      <span className="text-sm text-muted-foreground">
        {formatDateTime(product.updated_at)}
      </span>
    ),
  },
  {
    accessorKey: "is_active",
    header: "Status",
    skeletonClass: "h-4 w-16",
    cell: (product) =>
      product.is_active ? (
        <span className="text-green-600">Active</span>
      ) : (
        <span className="text-muted-foreground">Inactive</span>
      ),
  },
]

const ACTIONS_HEADER = "Actions"

/** Skeleton cells, one per column, including the trailing actions column. */
export const PRODUCT_COLUMN_SKELETONS: string[] = [
  ...PRODUCT_COLUMN_SPECS.map((spec) => spec.skeletonClass),
  "",
]

/** Header labels in render order, including the actions column. */
export const PRODUCT_COLUMN_HEADERS: string[] = [
  ...PRODUCT_COLUMN_SPECS.map((spec) => spec.header),
  ACTIONS_HEADER,
]

export function getProductColumns(
  canWrite: boolean,
  onEdit?: (product: ProductPublic) => void,
): ColumnDef<DataTableFeatures, ProductPublic>[] {
  const columns: ColumnDef<DataTableFeatures, ProductPublic>[] =
    PRODUCT_COLUMN_SPECS.map((spec) => ({
      accessorKey: spec.accessorKey,
      header: spec.header,
      cell: ({ row }) => spec.cell(row.original, onEdit),
    }))

  if (canWrite) {
    columns.push({
      id: "actions",
      header: () => <span className="sr-only">{ACTIONS_HEADER}</span>,
      cell: ({ row }) => (
        <div className="flex justify-end">
          <ProductActionsMenu product={row.original} />
        </div>
      ),
    })
  }

  return columns
}
