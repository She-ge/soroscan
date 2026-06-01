"use client";

import { useState, useRef, useEffect } from "react";
import { formatDateTime, shortHash } from "@/components/ingest/formatters";
import type { EventRecord } from "@/components/ingest/types";
import styles from "@/components/ingest/ingest-terminal.module.css";
import toolbarStyles from "./BulkActionsToolbar.module.css";

interface EventTableProps {
  events: EventRecord[];
  loading: boolean;
  onEventClick: (event: EventRecord) => void;
  eventTags: Record<string, string[]>;
  tagSuggestions: string[];
  onAddTag: (eventId: string, tag: string) => void;
  onRemoveTag: (eventId: string, tag: string) => void;
  hasActiveFilters?: boolean;
  onClearFilters?: () => void;
  showTags?: boolean;
  // Multi-select
  selectedIds?: Set<string>;
  onToggleSelect?: (eventId: string) => void;
  onToggleSelectAll?: () => void;
}

export function EventTable({
  events,
  loading,
  onEventClick,
  eventTags = {},
  tagSuggestions = [],
  onAddTag = () => {},
  onRemoveTag = () => {},
  hasActiveFilters,
  onClearFilters,
  showTags = false,
  selectedIds = new Set(),
  onToggleSelect = () => {},
  onToggleSelectAll = () => {},
}: EventTableProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [tagInputs, setTagInputs] = useState<Record<string, string>>({});

  const copyToClipboard = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const getEventTypeColor = (eventType: string): string => {
    const hash = eventType.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const colors = [
      "rgba(0, 255, 156, 0.8)",
      "rgba(0, 212, 255, 0.8)",
      "rgba(255, 170, 0, 0.8)",
      "rgba(255, 102, 255, 0.8)",
    ];
    return colors[hash % colors.length];
  };

  const allSelected = events.length > 0 && events.every((e) => selectedIds.has(e.id));
  const someSelected = events.some((e) => selectedIds.has(e.id));
  // Total column count (checkbox + data cols)
  const colCount = (showTags ? 7 : 6) + 1; // +1 for checkbox


  if (loading) {
    return (
      <div className={styles.tableWrap}>
        <table className={styles.eventTable}>
          <thead>
            <tr>
              <th className={toolbarStyles.checkboxCell} aria-label="Select rows">
                <input type="checkbox" disabled aria-label="Select all (loading)" />
              </th>
              <th>Contract</th>
              <th>Type</th>
              <th>Ledger</th>
              <th>Time</th>
              <th>Transaction</th>
              {showTags && <th>Tags</th>}
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {[...Array(5)].map((_, index) => (
              <tr key={`skeleton-${index}`}>
                <td className={toolbarStyles.checkboxCell}>
                  <div className={styles.skeleton} style={{ width: "16px", height: "16px", borderRadius: "3px" }} />
                </td>
                <td data-label="Contract">
                  <div className={styles.skeleton} style={{ width: "120px", height: "20px" }} />
                </td>
                <td data-label="Type">
                  <div className={styles.skeleton} style={{ width: "80px", height: "24px", borderRadius: "12px" }} />
                </td>
                <td data-label="Ledger">
                  <div className={styles.skeleton} style={{ width: "60px", height: "24px" }} />
                </td>
                <td data-label="Time">
                  <div className={styles.skeleton} style={{ width: "140px", height: "20px" }} />
                </td>
                <td data-label="Tx">
                  <div className={styles.skeleton} style={{ width: "100px", height: "20px" }} />
                </td>
                {showTags && (
                  <td data-label="Tags">
                    <div className={styles.skeleton} style={{ width: "120px", height: "24px" }} />
                  </td>
                )}
                <td data-label="Actions">
                  <div className={styles.skeleton} style={{ width: "50px", height: "28px" }} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div className={styles.tableWrap}>
      <table className={styles.eventTable}>
        <thead>
          <tr>
            <th className={toolbarStyles.checkboxCell}>
              <IndeterminateCheckbox
                checked={allSelected}
                indeterminate={someSelected && !allSelected}
                onChange={onToggleSelectAll}
                aria-label={allSelected ? "Deselect all events" : "Select all events"}
                id="select-all-events"
              />
            </th>
            <th>Contract</th>
            <th>Type</th>
            <th>Ledger</th>
            <th>Time</th>
            <th>Transaction</th>
            {showTags && <th>Tags</th>}
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {!events.length ? (
            <tr>
              <td colSpan={colCount} className={styles.emptyTable}>
                {loading ? (
                  "Loading events..."
                ) : hasActiveFilters ? (
                  <div style={{ padding: "3rem 1rem", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem" }}>
                    <div style={{ color: "var(--text-secondary)", marginBottom: "0.5rem" }}>
                      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="11" cy="11" r="8"></circle>
                        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                      </svg>
                    </div>
                    <h3 style={{ margin: 0, fontSize: "1.25rem", color: "var(--text-primary)" }}>
                      No events match your criteria
                    </h3>
                    <p style={{ margin: 0, color: "var(--text-secondary)", maxWidth: "400px", lineHeight: 1.5 }}>
                      We couldn&apos;t find any events matching your current search and filter settings. Try adjusting them or clear all filters to see more results.
                    </p>
                    <button
                      type="button"
                      className={styles.btn}
                      style={{ marginTop: "1rem" }}
                      onClick={onClearFilters}
                    >
                      Clear Filters
                    </button>
                  </div>
                ) : (
                  "No events found. Select a contract and adjust filters to view events."
                )}
              </td>
            </tr>
          ) : (
            events.map((event) => {
              const isSelected = selectedIds.has(event.id);
              return (
                <tr
                  key={event.id}
                  className={isSelected ? toolbarStyles.selectedRow : undefined}
                  style={{
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.boxShadow = `0 0 15px ${getEventTypeColor(event.eventType)}`;
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = "none";
                  }}
                >
                  {/* Checkbox cell */}
                  <td
                    className={toolbarStyles.checkboxCell}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => onToggleSelect(event.id)}
                      aria-label={`Select event ${event.id}`}
                      id={`select-event-${event.id}`}
                    />
                  </td>

                  <td data-label="Contract">
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <code>{shortHash(event.contractId)}</code>
                      <button
                        type="button"
                        className={styles.btn}
                        style={{
                          padding: "0.2rem 0.4rem",
                          fontSize: "0.7rem",
                          minWidth: "auto",
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          copyToClipboard(event.contractId, `contract-${event.id}`);
                        }}
                        title="Copy contract ID"
                      >
                        {copiedId === `contract-${event.id}` ? "✓" : "📋"}
                      </button>
                    </div>
                  </td>
                  <td data-label="Type">
                    <span
                      className={styles.pill}
                      style={{
                        borderColor: getEventTypeColor(event.eventType),
                        backgroundColor: `${getEventTypeColor(event.eventType)}15`,
                        color: getEventTypeColor(event.eventType),
                      }}
                    >
                      {event.eventType}
                    </span>
                  </td>
                  <td data-label="Ledger">
                    <button
                      type="button"
                      className={styles.btn}
                      style={{
                        padding: "0.2rem 0.5rem",
                        fontSize: "0.75rem",
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                      }}
                    >
                      {event.ledger}
                    </button>
                  </td>
                  <td data-label="Time">{formatDateTime(event.timestamp)}</td>
                  <td data-label="Tx">
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <code>{shortHash(event.txHash)}</code>
                      <button
                        type="button"
                        className={styles.btn}
                        style={{
                          padding: "0.2rem 0.4rem",
                          fontSize: "0.7rem",
                          minWidth: "auto",
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          copyToClipboard(event.txHash, `tx-${event.id}`);
                        }}
                        title="Copy transaction hash"
                      >
                        {copiedId === `tx-${event.id}` ? "✓" : "📋"}
                      </button>
                    </div>
                  </td>
                  {showTags && (
                    <td data-label="Tags">
                      <div style={{ display: "grid", gap: "0.4rem" }}>
                        <div style={{ display: "flex", gap: "0.3rem", flexWrap: "wrap" }}>
                          {(eventTags[event.id] ?? []).map((tag) => (
                            <span key={tag} className={styles.pill} style={{ fontSize: "0.72rem", padding: "0.2rem 0.45rem" }}>
                              {tag}
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onRemoveTag(event.id, tag);
                                }}
                                style={{
                                  background: "transparent",
                                  border: 0,
                                  color: "inherit",
                                  cursor: "pointer",
                                  marginLeft: "0.3rem",
                                  padding: 0,
                                }}
                                title={`Remove ${tag}`}
                              >
                                x
                              </button>
                            </span>
                          ))}
                        </div>
                        <div style={{ display: "flex", gap: "0.35rem" }}>
                          <input
                            className={styles.fieldInput}
                            list={`event-tag-suggestions-${event.id}`}
                            value={tagInputs[event.id] ?? ""}
                            placeholder="add tag"
                            onClick={(e) => e.stopPropagation()}
                            onChange={(e) => {
                              const value = e.target.value;
                              setTagInputs((prev) => ({ ...prev, [event.id]: value }));
                            }}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                e.stopPropagation();
                                const value = tagInputs[event.id] ?? "";
                                onAddTag(event.id, value);
                                setTagInputs((prev) => ({ ...prev, [event.id]: "" }));
                              }
                            }}
                            style={{ padding: "0.35rem 0.45rem", fontSize: "0.75rem" }}
                          />
                          <button
                            type="button"
                            className={styles.btn}
                            style={{ padding: "0.2rem 0.5rem", fontSize: "0.75rem", minWidth: "auto" }}
                            onClick={(e) => {
                              e.stopPropagation();
                              const value = tagInputs[event.id] ?? "";
                              onAddTag(event.id, value);
                              setTagInputs((prev) => ({ ...prev, [event.id]: "" }));
                            }}
                            title="Add tag"
                          >
                            +
                          </button>
                        </div>
                        <datalist id={`event-tag-suggestions-${event.id}`}>
                          {tagSuggestions.map((tag) => (
                            <option key={tag} value={tag} />
                          ))}
                        </datalist>
                      </div>
                    </td>
                  )}
                  <td data-label="Actions">
                    <button
                      type="button"
                      className={styles.btn}
                      style={{
                        padding: "0.3rem 0.6rem",
                        fontSize: "0.75rem",
                      }}
                      onClick={() => onEventClick(event)}
                    >
                      View
                    </button>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}

// ── IndeterminateCheckbox ────────────────────────────────────────────────────
// A controlled checkbox that also supports the indeterminate state via a
// useEffect-based ref, avoiding the "uncontrolled-to-controlled" React warning.
interface IndeterminateCheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  indeterminate?: boolean;
}

function IndeterminateCheckbox({ indeterminate = false, ...props }: IndeterminateCheckboxProps) {
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (ref.current) {
      ref.current.indeterminate = indeterminate;
    }
  }, [indeterminate]);

  return <input type="checkbox" ref={ref} {...props} />;
}