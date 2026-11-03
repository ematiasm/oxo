import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"

import {
  type ProductPublic,
  ProductsService,
  type ProductUpdate,
} from "@/client"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { LoadingButton } from "@/components/ui/loading-button"
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import useCustomToast from "@/hooks/useCustomToast"
import { handleError } from "@/utils"
import { formatDateTime } from "./columns"
import {
  type ProductFormData,
  productFormSchema,
  toProductPayload,
} from "./productForm"

interface ProductEditDrawerProps {
  /** The product to edit, or null when the drawer is closed. */
  product: ProductPublic | null
  onOpenChange: (open: boolean) => void
}

/**
 * Right-side drawer that edits a single product. It is the only write
 * affordance for a catalog row: the product name in the table is a button that
 * opens it.
 *
 * Radix keeps the panel mounted while the exit animation runs, so the last
 * product is retained here instead of reading the now-null prop, and the form is
 * re-seeded only when a new product arrives.
 */
const ProductEditDrawer = ({
  product,
  onOpenChange,
}: ProductEditDrawerProps) => {
  const [shownProduct, setShownProduct] = useState<ProductPublic | null>(null)
  const queryClient = useQueryClient()
  const { showSuccessToast, showErrorToast } = useCustomToast()

  const form = useForm<ProductFormData>({
    resolver: zodResolver(productFormSchema),
    mode: "onBlur",
    criteriaMode: "all",
    defaultValues: {
      name: "",
      sku: "",
      barcode: "",
      price: "",
      stock: 0,
      description: "",
      is_active: true,
    },
  })
  const { reset } = form

  // Re-seed on every open, and also when another row is picked while open, so a
  // failed edit never leaks its draft into the next product.
  useEffect(() => {
    if (product === null) return
    setShownProduct(product)
    reset({
      name: product.name,
      sku: product.sku,
      barcode: product.barcode ?? "",
      price: product.price,
      stock: product.stock ?? 0,
      description: product.description ?? "",
      is_active: product.is_active,
    })
  }, [product, reset])

  const mutation = useMutation({
    mutationFn: (data: ProductUpdate) =>
      ProductsService.updateProduct({
        path: { id: shownProduct?.id ?? "" },
        body: data,
      }),
    onSuccess: () => {
      showSuccessToast("Product updated successfully")
      onOpenChange(false)
    },
    onError: handleError.bind(showErrorToast),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] })
    },
  })

  const onSubmit = (data: ProductFormData) => {
    mutation.mutate(toProductPayload(data))
  }

  return (
    <Sheet open={product !== null} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="sm:max-w-md">
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex min-h-0 flex-1 flex-col"
          >
            <SheetHeader className="border-b">
              <SheetTitle>Edit product</SheetTitle>
              <SheetDescription>
                {shownProduct?.sku} · updated{" "}
                {formatDateTime(shownProduct?.updated_at)}
              </SheetDescription>
            </SheetHeader>

            <div className="grid flex-1 content-start gap-4 overflow-y-auto p-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Name <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="Name" type="text" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="sku"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      SKU <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="SKU" type="text" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="barcode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Barcode</FormLabel>
                    <FormControl>
                      <Input placeholder="Barcode" type="text" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Price <span className="text-destructive">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Price"
                          type="text"
                          inputMode="decimal"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="stock"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Stock</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          step="1"
                          value={field.value}
                          onChange={(event) =>
                            field.onChange(
                              event.target.value === ""
                                ? 0
                                : Number(event.target.value),
                            )
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Input placeholder="Description" type="text" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="is_active"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start gap-3 space-y-0 rounded-md border p-3">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        className="mt-0.5"
                      />
                    </FormControl>
                    <div className="flex flex-col gap-1">
                      <FormLabel className="font-medium">Active</FormLabel>
                      <FormDescription>
                        Hidden from the catalog when off.
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />
            </div>

            <SheetFooter className="flex-row justify-end border-t">
              <SheetClose asChild>
                <Button variant="outline" disabled={mutation.isPending}>
                  Cancel
                </Button>
              </SheetClose>
              <LoadingButton type="submit" loading={mutation.isPending}>
                Save
              </LoadingButton>
            </SheetFooter>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  )
}

export default ProductEditDrawer
