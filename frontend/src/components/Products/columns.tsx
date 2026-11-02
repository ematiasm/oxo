import type { ColumnDef } from "@tanstack/react-table"
import { Check, Copy } from "lucide-react"

import type { ProductPublic } from "@/client"
import type { DataTableFeatures } from "@/components/Common/DataTable"
import { Button } from "@/components/ui/button"
import { useCopyToClipboard } from "@/hooks/useCopyToClipboard"
import { ProductActionsMenu } from "./ProductActionsMenu"

function CopyId({ id }: { id: string }) {
  const [copiedText, copy] = useCopyToClipboard()
  const isCopied = copiedText === id

  return (
    <div className="flex items-center gap-1.5 group">
      <span className="font-mono text-xs text-muted-foreground">{id}</span>
      <Button
        variant="ghost"
        size="icon"
        className="size-6 opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={() => copy(id)}
      >
        {isCopied ? (
          <Check className="size-3 text-green-500" />
        ) : (
          <Copy className="size-3" />
        )}
        <span className="sr-only">Copy ID</span>
      </Button>
    </div>
  )
}

export function getProductColumns(
  canWrite: boolean,
): ColumnDef<DataTableFeatures, ProductPublic>[] {
  const columns: ColumnDef<DataTableFeatures, ProductPublic>[] = [
    {
      accessorKey: "id",
      header: "ID",
      cell: ({ row }) => <CopyId id={row.original.id} />,
    },
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
      accessorKey: "is_active",
      header: "Active",
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
