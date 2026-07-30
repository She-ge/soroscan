"use client";

import { memo, useCallback } from "react";
import { Handle, Position, type NodeProps } from "reactflow";
import type { GraphNodeData } from "./store";
import { severityNodeColor } from "./types";
import { useDependencyGraphStore } from "./store";

/**
 * ContractNode — individual node in the dependency graph.
 * Color coding:
 *   - CRITICAL/HIGH  → red border + red bg tint
 *   - MEDIUM         → amber border + amber bg tint
 *   - LOW            → cyan border + cyan bg tint
 *   - NONE           → green border + green bg tint (healthy)
 * Node size is driven by reachabilityPct (set in store, translated to style.width/height).
 */
export const ContractNode = memo(function ContractNode({
  data,
  selected,
}: NodeProps<GraphNodeData>) {
  const { contract, isSelected, isHighlighted, isDimmed, worstSeverity } = data;
}: NodeProps<GraphNodeData>) {
  const { contract, isSelected, isHighlighted, worstSeverity } = data;
  const colors = severityNodeColor(worstSeverity);
  const { selectContract, hoverContract } = useDependencyGraphStore();

  const handleClick = useCallback(() => {
    selectContract(isSelected ? null : contract.id);
  }, [contract.id, isSelected, selectContract]);

  const handleMouseEnter = useCallback(() => {
    hoverContract(contract.id);
  }, [contract.id, hoverContract]);

  const handleMouseLeave = useCallback(() => {
    hoverContract(null);
  }, [hoverContract]);

  const severityLabel =
    worstSeverity === "NONE" ? null : (
      <span
        className="absolute -top-2 -right-2 text-[9px] font-bold px-1 py-0.5 rounded leading-none"
        style={{
          backgroundColor: colors.border,
          color: "#0a0e27",
        }}
        aria-label={`Severity: ${worstSeverity}`}
      >
        {worstSeverity[0]}
      </span>
    );

  return (
    <>
      {/* Accepts incoming edges */}
      <Handle
        type="target"
        position={Position.Top}
        style={{ background: colors.border, border: "none", width: 8, height: 8 }}
        aria-label="dependency target"
      />

      <button
        type="button"
        onClick={handleClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className="relative flex flex-col items-center justify-center w-full h-full rounded-full cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 transition-all duration-150"
        style={{
          borderWidth: isSelected || isHighlighted ? 2.5 : 1.5,
          borderStyle: "solid",
          borderColor: colors.border,
          backgroundColor: isSelected
            ? `${colors.border}22`
            : isHighlighted
            ? `${colors.border}18`
            : colors.bg,
          boxShadow: isSelected
            ? `0 0 16px ${colors.border}66, 0 0 4px ${colors.border}44`
            : isHighlighted
            ? `0 0 8px ${colors.border}44`
            : undefined,
          transform: isSelected ? "scale(1.08)" : undefined,
          transition: "all 150ms ease",
          minWidth: 60,
          minHeight: 60,
        }}
        aria-label={`Contract ${contract.name}. Risk score: ${contract.riskScore.toFixed(1)}. Severity: ${worstSeverity}`}
        aria-pressed={isSelected}
      >
        {severityLabel}

        {/* Contract initials */}
        <span
          className="text-xs font-bold font-mono leading-tight text-center px-1 truncate max-w-full"
          style={{ color: colors.text, fontSize: "10px" }}
        >
          {contract.name.length > 8 ? `${contract.name.slice(0, 6)}…` : contract.name}
        </span>

        {/* Risk score badge */}
        {contract.riskScore > 0 && (
          <span
            className="text-[9px] font-mono mt-0.5 opacity-80"
            style={{ color: colors.text }}
          >
            {contract.riskScore.toFixed(1)}
          </span>
        )}

        {/* Vulnerability count indicator */}
        {contract.vulnerabilities.length > 0 && (
          <span
            className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full"
            style={{ backgroundColor: colors.border }}
            aria-hidden="true"
          />
        )}
      </button>

      {/* Emits outgoing edges */}
      <Handle
        type="source"
        position={Position.Bottom}
        style={{ background: colors.border, border: "none", width: 8, height: 8 }}
        aria-label="dependency source"
      />
    </>
  );
});

export default ContractNode;
