import { useSuspenseQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { Search } from "lucide-react"
import { Suspense } from "react"

import { ProductsService } from "@/client"
import { DataTable } from "@/components/Common/DataTable"
import PendingProducts from "@/components/Pending/PendingProducts"
import AddProduct from "@/components/Products/AddProduct"
import { getProductColumns } from "@/components/Products/columns"
import useAuth from "@/hooks/useAuth"

function getProductsQueryOptions() {
  return {
    queryFn: async () =>
      (await ProductsService.readProducts({ query: { skip: 0, limit: 100 } }))
        .data,
    queryKey: ["products"],
  }
}

export const Route = createFileRoute("/_layout/products")({
  component: Products,
  head: () => ({
    meta: [
      {
        title: "Products - oxo",
      },
    ],
  }),
})

function ProductsTableContent({ canWrite }: { canWrite: boolean }) {
  const { data: products } = useSuspenseQuery(getProductsQueryOptions())

  if (products.data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center text-center py-12">
        <div className="rounded-full bg-muted p-4 mb-4">
          <Search className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold">No products yet</h3>
        <p className="text-muted-foreground">Add a product to get started</p>
      </div>
    )
  }

  return (
    <DataTable columns={getProductColumns(canWrite)} data={products.data} />
  )
}

function ProductsTable({ canWrite }: { canWrite: boolean }) {
  return (
    <Suspense fallback={<PendingProducts />}>
      <ProductsTableContent canWrite={canWrite} />
    </Suspense>
  )
}

function Products() {
  const { user } = useAuth()
  const canWrite = user?.is_superuser === true

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Products</h1>
          <p className="text-muted-foreground">Manage the store catalog</p>
        </div>
        {canWrite && <AddProduct />}
      </div>
      <ProductsTable canWrite={canWrite} />
    </div>
  )
}
