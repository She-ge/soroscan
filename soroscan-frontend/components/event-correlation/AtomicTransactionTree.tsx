'use client';

import * as React from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
  type NodeProps,
  BackgroundVariant,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { cn } from '@/lib/utils';
import { getContractColor } from './contractColors';
import type { CorrelationNodeData, AtomicGroupTimeline } from './types';

// ─── Custom node ─────────────────────────────────────────────────────────────

function CorrelationNode({ data, selected }: NodeProps<Node<CorrelationNodeData>>) {
  const color = getContractColor(data.contractId);
  return (
    <div
      className={cn(
        'px-3 py-2 rounded-md border text-xs font-mono min-w-[140px] max-w-[200px] shadow-lg',
        selected && 'ring-2 ring-offset-1 ring-green-400'
      )}
      style={{
        backgroundColor: color.bg,
        borderColor: selected ? '#4ade80' : color.border,
        color: color.text,
      }}
      data-testid={`tree-node-${data.eventId}`}
      aria-label={`${data.eventType} on ${data.contractName} at block ${data.blockNumber}`}
    >
      {data.isRoot && (
        <div className="text-[9px] uppercase tracking-wider opacity-60 mb-1">root</div>
      )}
      <div className="font-semibold truncate">{data.eventType}</div>
      <div className="opacity-70 truncate text-[10px]">{data.contractName}</div>
      <div className="opacity-50 text-[10px] mt-0.5">#{data.blockNumber}</div>
    </div>
  );
}

const NODE_TYPES = { correlationNode: CorrelationNode };

// ─── Layout helper — simple top-down layered layout ──────────────────────────

function buildLayout(
  events: AtomicGroupTimeline[],
  rootEventId?: string
): { nodes: Node<CorrelationNodeData>[]; edges: Edge[] } {
  if (events.length === 0) return { nodes: [], edges: [] };

  // Sort by timestamp ascending
  const sorted = [...events].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  const NODE_W = 210;
  const NODE_H = 80;
  const H_GAP = 40;
  const V_GAP = 60;

  // Group events per block to create tree layers
  const byBlock = new Map<number, AtomicGroupTimeline[]>();
  for (const ev of sorted) {
    const arr = byBlock.get(ev.blockNumber) ?? [];
    arr.push(ev);
    byBlock.set(ev.blockNumber, arr);
  }
  const layers = [...byBlock.entries()].sort(([a], [b]) => a - b);

  const nodes: Node<CorrelationNodeData>[] = [];
  const edges: Edge[] = [];

  layers.forEach(([, eventsInLayer], layerIdx) => {
    const totalWidth = eventsInLayer.length * NODE_W + (eventsInLayer.length - 1) * H_GAP;
    const startX = -totalWidth / 2;

    eventsInLayer.forEach((ev, colIdx) => {
      const x = startX + colIdx * (NODE_W + H_GAP);
      const y = layerIdx * (NODE_H + V_GAP);

      nodes.push({
        id: ev.eventId,
        type: 'correlationNode',
        position: { x, y },
        data: {
          eventId: ev.eventId,
          eventType: ev.eventType,
          contractId: ev.contractId,
          contractName: ev.contractName,
          timestamp: ev.timestamp,
          blockNumber: ev.blockNumber,
          isRoot: ev.eventId === rootEventId,
        },
      });

      // Connect to previous layer (one edge per node to the first node of the prev layer)
      if (layerIdx > 0) {
        const prevLayer = layers[layerIdx - 1][1];
        const sourceId = prevLayer[Math.min(colIdx, prevLayer.length - 1)].eventId;
        edges.push({
          id: `e-${sourceId}-${ev.eventId}`,
          source: sourceId,
          target: ev.eventId,
          style: { stroke: '#16a34a', strokeWidth: 1.5, opacity: 0.6 },
          animated: false,
        });
      }
    });
  });

  return { nodes, edges };
}

// ─── Main component ───────────────────────────────────────────────────────────

export interface AtomicTransactionTreeProps {
  events: AtomicGroupTimeline[];
  rootEventId?: string;
  onNodeClick?: (eventId: string) => void;
  className?: string;
}

export function AtomicTransactionTree({
  events,
  rootEventId,
  onNodeClick,
  className,
}: AtomicTransactionTreeProps) {
  const { nodes: initialNodes, edges: initialEdges } = React.useMemo(
    () => buildLayout(events, rootEventId),
    [events, rootEventId]
  );

  const [nodes, , onNodesChange] = useNodesState<Node<CorrelationNodeData>>(initialNodes);
  const [edges, , onEdgesChange] = useEdgesState(initialEdges);

  // Re-initialise when events change
  React.useEffect(() => {
    const { nodes: n, edges: e } = buildLayout(events, rootEventId);
    // useNodesState/useEdgesState don't expose a "reset" directly;
    // we proxy through the callback form
    onNodesChange(n.map((node) => ({ type: 'reset' as const, item: node })));
    onEdgesChange(e.map((edge) => ({ type: 'reset' as const, item: edge })));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [events, rootEventId]);

  if (events.length === 0) {
    return (
      <div
        className="flex items-center justify-center h-64 text-sm font-mono text-gray-500 border border-green-900 rounded-lg bg-gray-950"
        data-testid="tree-empty"
      >
        No events to visualize.
      </div>
    );
  }

  return (
    <div
      className={cn(
        'w-full h-[500px] border border-green-900 rounded-lg overflow-hidden bg-gray-950',
        className
      )}
      data-testid="atomic-transaction-tree"
      aria-label={`Atomic transaction tree with ${events.length} events`}
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={NODE_TYPES}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={(_e, node) => onNodeClick?.(node.id)}
        fitView
        minZoom={0.1}
        maxZoom={3}
        proOptions={{ hideAttribution: true }}
      >
        <Background
          variant={BackgroundVariant.Dots}
          color="#16a34a"
          gap={24}
          size={1}
          style={{ opacity: 0.15 }}
        />
        <Controls
          style={{ background: '#030712', border: '1px solid #166534', borderRadius: 6 }}
          showInteractive={false}
        />
        <MiniMap
          nodeColor={(n) => getContractColor((n.data as CorrelationNodeData).contractId).border}
          style={{ background: '#030712', border: '1px solid #166534' }}
          maskColor="rgba(3,7,18,0.7)"
        />
      </ReactFlow>
    </div>
  );
}
