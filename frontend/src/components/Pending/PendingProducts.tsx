import {
  PRODUCT_COLUMN_HEADERS,
  PRODUCT_COLUMN_SKELETONS,
} from "@/components/Products/columns"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

const PendingProducts = () => (
  <Table>
    <TableHeader>
      <TableRow>
        {PRODUCT_COLUMN_HEADERS.map((header) => (
          <TableHead key={header}>
            {header === "Actions" ? (
              <span className="sr-only">{header}</span>
            ) : (
              header
            )}
          </TableHead>
        ))}
      </TableRow>
    </TableHeader>
    <TableBody>
      {Array.from({ length: 5 }).map((_, index) => (
        <TableRow key={index}>
          {PRODUCT_COLUMN_SKELETONS.map((skeletonClass, cellIndex) => (
            <TableCell key={PRODUCT_COLUMN_HEADERS[cellIndex]}>
              {skeletonClass === "" ? (
                <div className="flex justify-end">
                  <Skeleton className="size-8 rounded-md" />
                </div>
              ) : (
                <Skeleton className={skeletonClass} />
              )}
            </TableCell>
          ))}
        </TableRow>
      ))}
    </TableBody>
  </Table>
)

export default PendingProducts
