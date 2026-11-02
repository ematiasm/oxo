import type { ColumnDef } from "@tanstack/react-table"

import type { ProductPublic } from "@/client"
import type { DataTableFeatures } from "@/components/Common/DataTable"
import { ProductActionsMenu } from "./ProductActionsMenu"

function formatDateTime(value: string | null | undefined) {
  if (!value) return "—"
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return value
  return parsed.toLocaleString()
}

export function getProductColumns(
  canWrite: boolean,
): ColumnDef<DataTableFeatures, ProductPublic>[] {
  const columns: ColumnDef<DataTableFeatures, ProductPublic>[] = [
    {
      accessorKey: "name",
      header: "Name",
      cell: ({ row }) => (
        <span className="font-medium">{row.original.name}</span>
      ),
    },
    {
      accessorKey: "sku",
      header: "SKU",
      cell: ({ row }) => (
        <span className="font-mono text-sm">{row.original.sku}</span>
      ),
    },
    {
      accessorKey: "price",
      header: "Price",
      cell: ({ row }) => {
        const price = row.original.price
        const formatted = new Intl.NumberFormat("es-AR", {
          style: "currency",
          currency: "ARS",
        }).format(Number(price))
        return <span>{formatted.includes("NaN") ? price : formatted}</span>
      },
    },
    {
      accessorKey: "stock",
      header: "Stock",
      cell: ({ row }) => <span>{row.original.stock ?? 0}</span>,
    },
    {
      accessorKey: "updated_at",
      header: "Last Update",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {formatDateTime(row.original.updated_at)}
        </span>
      ),
    },
    {
      accessorKey: "is_active",
      header: "Status",
      cell: ({ row }) =>
        row.original.is_active ? (
          <span className="text-green-600">Active</span>
        ) : (
          <span className="text-muted-foreground">Inactive</span>
        ),
    },
  ]

  if (canWrite) {
    columns.push({
      id: "actions",
      header: () => <span className="sr-only">Actions</span>,
      cell: ({ row }) => (
        <div className="flex justify-end">
          <ProductActionsMenu product={row.original} />
        </div>
      ),
    })
  }

  return columns
}
