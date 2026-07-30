"use client";

import { useCallback, useEffect, useMemo } from "react";
import { useEffect, useMemo } from "react";
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  useReactFlow,
  type Node,
  type Edge,
  ReactFlowProvider,
  BackgroundVariant,
} from "reactflow";
import dagre from "dagre";
import "reactflow/dist/style.css";
import { useDependencyGraphStore } from "./store";
import { ContractNode } from "./ContractNode";
import type { GraphNodeData, GraphEdgeData } from "./store";
import { severityNodeColor } from "./types";

// Register custom node type
const nodeTypes = { contractNode: ContractNode };

/** Apply a left-to-right dagre layout to a set of nodes and edges */
function applyDagreLayout(
  nodes: Node<GraphNodeData>[],
  edges: Edge<GraphEdgeData>[],
  direction: "LR" | "TB" = "LR",
): Node<GraphNodeData>[] {
  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({
    rankdir: direction,
    nodesep: 60,
    ranksep: 100,
    edgesep: 20,
    marginx: 20,
    marginy: 20,
  });

  for (const node of nodes) {
    const size = typeof node.style?.width === "number" ? node.style.width : 80;
    g.setNode(node.id, { width: Math.max(size, 80), height: Math.max(size, 80) });
  }

  for (const edge of edges) {
    g.setEdge(edge.source, edge.target);
  }

  dagre.layout(g);

  return nodes.map((node) => {
    const { x, y, width, height } = g.node(node.id);
    return {
      ...node,
      position: { x: x - width / 2, y: y - height / 2 },
    };
  });
}

/** Inner component that has access to the ReactFlow instance */
function DependencyGraphInner({ graphId }: { graphId?: string }) {
  const storeNodes = useDependencyGraphStore((s) => s.nodes);
  const storeEdges = useDependencyGraphStore((s) => s.edges);
  const { fitView } = useReactFlow();

  // Compute layout whenever store nodes/edges change
  const layoutedNodes = useMemo(
    () => applyDagreLayout(storeNodes, storeEdges),
    // Only recalculate when ids change, not on every style update
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [storeNodes.map((n) => n.id).join(","), storeEdges.map((e) => e.id).join(",")],
  );

  const [nodes, setNodes, onNodesChange] = useNodesState<GraphNodeData>(layoutedNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState<GraphEdgeData>(storeEdges);

  // Sync nodes from store (style/data updates don't need re-layout)
  useEffect(() => {
    setNodes(layoutedNodes);
    setTimeout(() => fitView({ padding: 0.15, duration: 400 }), 50);
  }, [layoutedNodes, setNodes, fitView]);

  // Sync edges from store
  useEffect(() => {
    setEdges(storeEdges);
  }, [storeEdges, setEdges]);

  return (
    <div
      id={graphId}
      className="w-full h-full"
      style={{ background: "#0a0e27" }}
      role="img"
      aria-label="Contract dependency graph"
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.15 }}
        minZoom={0.05}
        maxZoom={3}
        proOptions={{ hideAttribution: true }}
        defaultEdgeOptions={{
          type: "smoothstep",
          style: { strokeWidth: 1.5 },
        }}
      >
        <Background
          variant={BackgroundVariant.Dots}
          color="#2d3748"
          gap={20}
          size={1}
        />
        <Controls
          style={{
            background: "#1a1f3a",
            border: "1px solid rgba(0, 255, 65, 0.2)",
            borderRadius: 6,
          }}
          showInteractive={false}
        />
        <MiniMap
          style={{
            background: "#1a1f3a",
            border: "1px solid rgba(0, 255, 65, 0.2)",
            borderRadius: 6,
          }}
          nodeColor={(node: Node<GraphNodeData>) => {
            const sev = node.data?.worstSeverity ?? "NONE";
            return severityNodeColor(sev).border;
          }}
          maskColor="rgba(10, 14, 39, 0.75)"
        />
      </ReactFlow>
    </div>
  );
}

/**
 * DependencyGraph — interactive ReactFlow graph of contract dependencies.
 * Wraps DependencyGraphInner in ReactFlowProvider (required for useReactFlow hook).
 */
export function DependencyGraph({ graphId }: { graphId?: string }) {
  return (
    <ReactFlowProvider>
      <DependencyGraphInner graphId={graphId} />
    </ReactFlowProvider>
  );
}

export default DependencyGraph;
