/**
 * ContractCardSkeleton – shimmer placeholder for contract list items.
 *
 * Design spec (issue #989):
 * ──────────────────────────────────────────────────────────────────
 * Layout types:
 *   • Desktop (≥ 640px) – terminal Table row
 *   • Mobile  (< 640px) – vertical card with labeled sections
 *
 * Desktop row skeleton dimensions:
 *   Star       20×20  (circle via Skeleton variant)
 *   ContractID auto   (w-full h-4, truncated mono hash)
 *   Name       auto   (w-2/3 h-4)
 *   Status     80×24  (rounded badge)
 *   Events     50×20  (mono number)
 *   Tags       3× pill chips (60×18 each)
 *   Actions    60×28  (danger button)
 *
 * Mobile card skeleton dimensions:
 *   Header: ContractID (80×16) + Star (20×20) + Status (80×24)
 *   Name:   (120×16)
 *   Footer: EventCount (50×16) + Delete (60×28)
 *   Optional tags row: 3× pill chips
 *
 * Responsive rules:
 *   • Card list is hidden on sm+; table is hidden below sm.
 *   • Skeleton cards preserve the same flex/grid layout as real cards.
 * ──────────────────────────────────────────────────────────────────
 */

import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/terminal/Table";

const ROW_COUNT = 5;

export function ContractCardSkeleton() {
  return (
    <>
      {/* ── Mobile card skeleton (< 640px) ── */}
      <div className="flex flex-col gap-3 sm:hidden" aria-hidden="true">
        {Array.from({ length: ROW_COUNT }).map((_, i) => (
          <div
            key={`sk-contract-${i}`}
            className="border border-terminal-green/20 bg-terminal-green/5 p-4 flex flex-col gap-3 pointer-events-none"
          >
            {/* Header */}
            <div className="flex justify-between items-start">
              <div>
                <div className="text-xs text-terminal-cyan uppercase mb-1">Contract ID</div>
                <Skeleton variant="rectangle" width={80} height={16} />
              </div>
              <div className="flex items-center gap-2">
                <Skeleton variant="circle" width={20} height={20} />
                <Skeleton variant="rectangle" width={80} height={24} />
              </div>
            </div>

            {/* Name */}
            <div>
              <div className="text-xs text-terminal-cyan uppercase mb-1">Name</div>
              <Skeleton variant="rectangle" width={120} height={16} />
            </div>

            {/* Footer */}
            <div className="flex justify-between items-center">
              <div>
                <div className="text-xs text-terminal-cyan uppercase mb-1">Events</div>
                <Skeleton variant="rectangle" width={50} height={16} />
              </div>
              <Skeleton variant="rectangle" width={60} height={28} />
            </div>

            {/* Tags */}
            <div className="flex gap-1">
              <Skeleton variant="rectangle" width={60} height={18} />
              <Skeleton variant="rectangle" width={48} height={18} />
              <Skeleton variant="rectangle" width={55} height={18} />
            </div>
          </div>
        ))}
      </div>

      {/* ── Desktop table skeleton (≥ 640px) ── */}
      <div className="hidden sm:block" aria-hidden="true">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10"></TableHead>
              <TableHead>Contract ID</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Events</TableHead>
              <TableHead>Tags</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: ROW_COUNT }).map((_, i) => (
              <TableRow key={`sk-trow-${i}`} className="pointer-events-none">
                <TableCell>
                  <Skeleton variant="circle" width={20} height={20} />
                </TableCell>
                <TableCell>
                  <Skeleton variant="rectangle" width={100} height={16} />
                </TableCell>
                <TableCell>
                  <Skeleton variant="rectangle" width={120} height={16} />
                </TableCell>
                <TableCell>
                  <Skeleton variant="rectangle" width={80} height={24} />
                </TableCell>
                <TableCell>
                  <Skeleton variant="rectangle" width={50} height={16} />
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Skeleton variant="rectangle" width={60} height={18} />
                    <Skeleton variant="rectangle" width={48} height={18} />
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <Skeleton variant="rectangle" width={60} height={28} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Accessible loading announcement */}
      <div role="status" aria-live="polite" className="sr-only">
        Loading contracts…
      </div>
    </>
  );
}
