"use client";

import React, { useEffect, useRef } from "react";
import cytoscape from "cytoscape";

export type NodeStatus = "healthy" | "degraded" | "failed";

export interface GraphNode {
  id: string;
  label: string;
  status: NodeStatus;
}

export interface GraphEdge {
  from: string;
  to: string;
  calls: number;
}

interface ContractDependencyGraphProps {
  nodes: GraphNode[];
  edges: GraphEdge[];
  onNodeClick?: (nodeId: string) => void;
  layout?: "cose" | "breadthfirst" | "circle";
}

const statusColors: Record<NodeStatus, string> = {
  healthy: "#4ade80", // text-green-400
  degraded: "#facc15", // text-yellow-400
  failed: "#f87171", // text-red-400
};

export default function ContractDependencyGraph({
  nodes,
  edges,
  onNodeClick,
  layout = "cose",
}: ContractDependencyGraphProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const cyRef = useRef<cytoscape.Core | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const cy = cytoscape({
      container: containerRef.current,
      elements: [
        ...nodes.map((n) => ({
          data: { id: n.id, label: n.label, status: n.status },
        })),
        ...edges.map((e) => ({
          data: {
            id: `${e.from}-${e.to}`,
            source: e.from,
            target: e.to,
            label: e.calls.toString(),
          },
        })),
      ],
      style: [
        {
          selector: "node",
          style: {
            label: "data(label)",
            "background-color": (ele) => statusColors[ele.data("status") as NodeStatus] || "#94a3b8",
            color: "#fff",
            "text-valign": "center",
            "text-halign": "center",
            "font-size": "12px",
            "font-family": "monospace",
            "text-outline-width": 1,
            "text-outline-color": "#000",
            width: 80,
            height: 80,
            shape: "ellipse",
          },
        },
        {
          selector: "edge",
          style: {
            width: 2,
            "line-color": "#475569",
            "target-arrow-color": "#475569",
            "target-arrow-shape": "triangle",
            "curve-style": "bezier",
            label: "data(label)",
            "font-size": "10px",
            color: "#94a3b8",
            "text-background-color": "#0a0e27",
            "text-background-opacity": 1,
            "text-background-padding": "2px",
            "text-background-shape": "roundrectangle",
          },
        },
        {
          selector: "node.highlighted",
          style: {
            "border-width": 4,
            "border-color": "#fff",
          },
        },
        {
          selector: "node.dimmed",
          style: {
            opacity: 0.2,
          },
        },
        {
          selector: "edge.highlighted",
          style: {
            "line-color": "#38bdf8",
            "target-arrow-color": "#38bdf8",
            width: 4,
            "z-index": 10,
            color: "#38bdf8",
          },
        },
        {
          selector: "edge.dimmed",
          style: {
            opacity: 0.2,
          },
        },
      ],
      layout: {
        name: layout,
        animate: true,
        animationDuration: 500,
        padding: 50,
      },
    });

    cyRef.current = cy;

    // Interactions
    cy.on("tap", "node", (evt) => {
      const node = evt.target;
      if (onNodeClick) {
        onNodeClick(node.id());
      }
    });

    cy.on("mouseover", "node", (evt) => {
      const node = evt.target;
      cy.elements().removeClass("highlighted dimmed");
      
      const neighborhood = node.neighborhood();
      cy.elements().difference(neighborhood).not(node).addClass("dimmed");
      
      node.addClass("highlighted");
      neighborhood.addClass("highlighted");
    });

    cy.on("mouseout", "node", () => {
      cy.elements().removeClass("highlighted dimmed");
    });

    return () => {
      cy.destroy();
    };
  }, [nodes, edges, layout, onNodeClick]);

  return <div ref={containerRef} className="w-full h-[600px] rounded border border-terminal-green/20 bg-black/40 overflow-hidden" />;
}
