"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, MoreHorizontal } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "./button"
import { Dropdown } from "./dropdown"

export interface PaginationProps extends React.HTMLAttributes<HTMLElement> {
  currentPage: number
  totalPages: number
  pageSize?: number
  pageSizes?: number[]
  onPageChange: (page: number) => void
  onPageSizeChange?: (size: number) => void
  siblingCount?: number
}

const DOTS = "..."

const usePagination = ({
  totalPageCount,
  siblingCount = 1,
  currentPage
}: {
  totalPageCount: number,
  siblingCount: number,
  currentPage: number
}) => {
  return React.useMemo(() => {
    const totalPageNumbers = siblingCount + 5;

    if (totalPageNumbers >= totalPageCount) {
      return Array.from({ length: totalPageCount }, (_, i) => i + 1)
    }

    const leftSiblingIndex = Math.max(currentPage - siblingCount, 1)
    const rightSiblingIndex = Math.min(currentPage + siblingCount, totalPageCount)

    const shouldShowLeftDots = leftSiblingIndex > 2
    const shouldShowRightDots = rightSiblingIndex < totalPageCount - 2

    const firstPageIndex = 1
    const lastPageIndex = totalPageCount

    if (!shouldShowLeftDots && shouldShowRightDots) {
      const leftItemCount = 3 + 2 * siblingCount
      const leftRange = Array.from({ length: leftItemCount }, (_, i) => i + 1)
      return [...leftRange, DOTS, totalPageCount]
    }

    if (shouldShowLeftDots && !shouldShowRightDots) {
      const rightItemCount = 3 + 2 * siblingCount
      const rightRange = Array.from({ length: rightItemCount }, (_, i) => totalPageCount - rightItemCount + i + 1)
      return [firstPageIndex, DOTS, ...rightRange]
    }

    if (shouldShowLeftDots && shouldShowRightDots) {
      const middleRange = Array.from({ length: rightSiblingIndex - leftSiblingIndex + 1 }, (_, i) => leftSiblingIndex + i)
      return [firstPageIndex, DOTS, ...middleRange, DOTS, lastPageIndex]
    }

    return []
  }, [totalPageCount, siblingCount, currentPage])
}

export function Pagination({
  currentPage,
  totalPages,
  pageSize = 10,
  pageSizes = [10, 20, 50, 100],
  onPageChange,
  onPageSizeChange,
  siblingCount = 1,
  className,
  ...props
}: PaginationProps) {
  const paginationRange = usePagination({
    currentPage,
    totalPageCount: totalPages,
    siblingCount
  })

  // Prevent rendering if there's only 1 page unless we want to show size selector
  if (totalPages <= 0) {
    return null
  }

  return (
    <nav
      role="navigation"
      aria-label="pagination"
      className={cn("flex flex-wrap items-center justify-between gap-4", className)}
      {...props}
    >
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="icon"
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1}
          aria-label="Go to first page"
        >
          <ChevronsLeft className="size-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          aria-label="Go to previous page"
        >
          <ChevronLeft className="size-4" />
        </Button>
        
        <div className="flex items-center gap-1 mx-2">
          {paginationRange.map((pageNumber, idx) => {
            if (pageNumber === DOTS) {
              return (
                <span key={`dots-${idx}`} className="flex size-9 items-center justify-center">
                  <MoreHorizontal className="size-4 text-muted-foreground opacity-50" />
                </span>
              )
            }

            return (
              <Button
                key={pageNumber}
                variant={pageNumber === currentPage ? "default" : "outline"}
                size="icon"
                onClick={() => onPageChange(pageNumber as number)}
                aria-current={pageNumber === currentPage ? "page" : undefined}
                aria-label={`Page ${pageNumber}`}
              >
                {pageNumber}
              </Button>
            )
          })}
        </div>

        <Button
          variant="outline"
          size="icon"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          aria-label="Go to next page"
        >
          <ChevronRight className="size-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages}
          aria-label="Go to last page"
        >
          <ChevronsRight className="size-4" />
        </Button>
      </div>

      {onPageSizeChange && pageSizes.length > 0 && (
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-muted-foreground">Rows per page</span>
          <Dropdown
            className="w-[80px]"
            value={pageSize.toString()}
            onChange={(val) => onPageSizeChange(Number(val))}
            options={pageSizes.map(size => ({
              label: size.toString(),
              value: size.toString()
            }))}
          />
        </div>
      )}
    </nav>
  )
}
