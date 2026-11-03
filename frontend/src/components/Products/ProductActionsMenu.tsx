import { EllipsisVertical } from "lucide-react"
import { useState } from "react"

import type { ProductPublic } from "@/client"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import DeleteProduct from "./DeleteProduct"

interface ProductActionsMenuProps {
  product: ProductPublic
}

/**
 * Per-row destructive actions. Editing is not here: the product name in the
 * table is a button that opens the edit drawer, so this menu only holds the
 * actions that do not fit in the row.
 */
export const ProductActionsMenu = ({ product }: ProductActionsMenuProps) => {
  const [open, setOpen] = useState(false)

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Product actions">
          <EllipsisVertical />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DeleteProduct id={product.id} onSuccess={() => setOpen(false)} />
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
