/**
 * EventDetailModalSkeleton – shimmer placeholder for the event detail modal.
 *
 * Design spec (issue #989):
 * ──────────────────────────────────────────────────────────────────
 * Layout:
 *   Full-screen overlay with centered modal matching exportModal styles.
 *
 *   Header:  Title skeleton (140×20) + close button (20×20)
 *   Body:
 *     Metadata section (bordered box):
 *       4× MetaBadge skeletons in auto-fit grid (min 150px):
 *         Label:  60×12
 *         Value:  full-width × 32
 *     DetailRow skeletons (3 rows):
 *       Label:  70×12
 *       Value:  full-width × 32
 *     Payload section:
 *       Toggle buttons: 2× (40×24)
 *       Code block:      full-width × 120 (rounded, dark bg)
 *     Optional rows: 2× (70×12 + full-width × 32)
 *   Footer: Close button skeleton (80×32)
 *
 * Responsive rules:
 *   • Modal is max-w-2xl w-full – skeleton scales naturally.
 *   • Metadata grid uses auto-fit minmax(150px, 1fr) for responsiveness.
 * ──────────────────────────────────────────────────────────────────
 */

import { Skeleton } from "@/components/ui/skeleton";
import styles from "@/components/ingest/ingest-terminal.module.css";

export function EventDetailModalSkeleton({ onClose }: { onClose: () => void }) {
  return (
    <div className={styles.exportModalOverlay}>
      <div className={styles.exportModal}>
        {/* Header */}
        <div className={styles.exportModalHead}>
          <Skeleton variant="rectangle" width={140} height={20} />
          <button
            type="button"
            className={styles.modalIconBtn}
            onClick={onClose}
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className={styles.exportModalBody}>
          <div style={{ display: "grid", gap: "1rem" }}>
            {/* Metadata section */}
            <section
              style={{
                border: "1px solid rgba(0, 212, 255, 0.2)",
                borderRadius: "6px",
                padding: "0.75rem",
                display: "grid",
                gap: "0.55rem",
              }}
            >
              <Skeleton variant="text" width={80} height={14} />
              <div
                style={{
                  display: "grid",
                  gap: "0.55rem",
                  gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
                }}
              >
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={`sk-meta-${i}`}>
                    <Skeleton variant="text" width={60} height={12} />
                    <div style={{ marginTop: "0.3rem" }}>
                      <Skeleton variant="rectangle" width="100%" height={32} />
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Detail rows */}
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={`sk-detail-${i}`}>
                <Skeleton variant="text" width={70} height={12} />
                <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", marginTop: "0.3rem" }}>
                  <Skeleton variant="rectangle" width="100%" height={32} />
                  <Skeleton variant="rectangle" width={36} height={32} />
                </div>
              </div>
            ))}

            {/* Payload section */}
            <div>
              <Skeleton variant="text" width={50} height={12} />
              <div style={{ display: "flex", gap: "0.35rem", marginTop: "0.3rem", marginBottom: "0.5rem" }}>
                <Skeleton variant="rectangle" width={40} height={24} />
                <Skeleton variant="rectangle" width={40} height={24} />
                <Skeleton variant="rectangle" width={80} height={24} />
              </div>
              <Skeleton variant="rectangle" width="100%" height={120} />
            </div>

            {/* Optional rows */}
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={`sk-opt-${i}`}>
                <Skeleton variant="text" width={80} height={12} />
                <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", marginTop: "0.3rem" }}>
                  <Skeleton variant="rectangle" width="100%" height={32} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className={styles.exportModalActions}>
          <Skeleton variant="rectangle" width={80} height={32} />
        </div>
      </div>

      {/* Accessible loading announcement */}
      <div role="status" aria-live="polite" className="sr-only">
        Loading event details…
      </div>
    </div>
  );
}
