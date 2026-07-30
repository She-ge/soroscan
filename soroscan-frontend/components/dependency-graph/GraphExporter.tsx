"use client";

import { useCallback, useState } from "react";
import { useDependencyGraphStore } from "./store";

type ExportFormat = "svg" | "png" | "json";

/**
 * GraphExporter — exports the dependency graph as SVG, PNG, or JSON.
 *
 * SVG/PNG: captures the ReactFlow canvas via the DOM.
 * JSON: serialises the raw contract data.
 */
export function GraphExporter({ graphId = "dependency-graph" }: { graphId?: string }) {
 * SVG/PNG: renders a representative image via the Canvas API (no external deps).
 * JSON: serialises the raw contract data.
 */
export function GraphExporter() {
  const contracts = useDependencyGraphStore((s) => s.contracts);
  const nodes = useDependencyGraphStore((s) => s.nodes);
  const edges = useDependencyGraphStore((s) => s.edges);
  const [exporting, setExporting] = useState<ExportFormat | null>(null);
  const [error, setError] = useState<string | null>(null);

  const exportJSON = useCallback(() => {
    setExporting("json");
    setError(null);
  const [exportError, setExportError] = useState<string | null>(null);

  const exportJSON = useCallback(() => {
    setExporting("json");
    setExportError(null);
    try {
      const payload = {
        exportedAt: new Date().toISOString(),
        contractCount: contracts.length,
        contracts: contracts.map((c) => ({
          id: c.id,
          name: c.name,
          address: c.address,
          riskScore: c.riskScore,
          reachabilityPct: c.reachabilityPct,
          vulnerabilities: c.vulnerabilities,
          dependencies: c.dependencies,
          dependents: c.dependents,
        })),
        edges: edges.map((e) => ({
          source: e.source,
          target: e.target,
          dependencyType: e.data?.dependencyType,
        })),
      };
      const blob = new Blob([JSON.stringify(payload, null, 2)], {
        type: "application/json",
      });
      downloadBlob(blob, "contract-dependency-graph.json");
    } catch (err) {
      setError("JSON export failed.");
    } catch {
      setExportError("JSON export failed.");
    } finally {
      setExporting(null);
    }
  }, [contracts, edges]);

  const exportSVG = useCallback(async () => {
    setExporting("svg");
    setError(null);
    try {
      const container = document.querySelector(`#${graphId} .react-flow__viewport`) as SVGElement | null;
      if (!container) throw new Error("ReactFlow viewport not found");

      // Clone the SVG-equivalent by serializing the DOM element
      const svgEl = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      const viewport = document.querySelector(`#${graphId} .react-flow__viewport`) as HTMLElement | null;
      if (!viewport) throw new Error("Viewport not found");

      const { width, height } = viewport.getBoundingClientRect();
      svgEl.setAttribute("xmlns", "http://www.w3.org/2000/svg");
      svgEl.setAttribute("width", String(Math.max(width, 800)));
      svgEl.setAttribute("height", String(Math.max(height, 600)));
      svgEl.setAttribute("viewBox", `0 0 ${Math.max(width, 800)} ${Math.max(height, 600)}`);

      // Background rect
  const exportSVG = useCallback(() => {
    setExporting("svg");
    setExportError(null);
    try {
      const svgEl = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      const W = 1200;
      const H = 800;
      svgEl.setAttribute("xmlns", "http://www.w3.org/2000/svg");
      svgEl.setAttribute("width", String(W));
      svgEl.setAttribute("height", String(H));
      svgEl.setAttribute("viewBox", `0 0 ${W} ${H}`);

      const bg = document.createElementNS("http://www.w3.org/2000/svg", "rect");
      bg.setAttribute("width", "100%");
      bg.setAttribute("height", "100%");
      bg.setAttribute("fill", "#0a0e27");
      svgEl.appendChild(bg);

      // Fallback text when canvas capture is unsupported
      const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
      text.setAttribute("x", "50%");
      text.setAttribute("y", "50%");
      text.setAttribute("text-anchor", "middle");
      text.setAttribute("fill", "#00ff41");
      text.setAttribute("font-family", "monospace");
      text.setAttribute("font-size", "14");
      text.textContent = `SoroScan Contract Graph — ${contracts.length} contracts`;
      svgEl.appendChild(text);

      // Embed node labels
      nodes.forEach((node, idx) => {
        const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
        const nodeText = document.createElementNS("http://www.w3.org/2000/svg", "text");
        nodeText.setAttribute("x", String(node.position.x + 40));
        nodeText.setAttribute("y", String(node.position.y + 50 + idx * 5));
        nodeText.setAttribute("fill", "#00ff41");
        nodeText.setAttribute("font-family", "monospace");
        nodeText.setAttribute("font-size", "10");
        nodeText.textContent = node.data.contract.name;
        g.appendChild(nodeText);
        svgEl.appendChild(g);
      const title = document.createElementNS("http://www.w3.org/2000/svg", "text");
      title.setAttribute("x", "40");
      title.setAttribute("y", "40");
      title.setAttribute("fill", "#00ff41");
      title.setAttribute("font-family", "monospace");
      title.setAttribute("font-size", "14");
      title.textContent = `SoroScan Contract Dependency Graph — ${contracts.length} contracts`;
      svgEl.appendChild(title);

      nodes.forEach((node) => {
        const color = (node.style?.borderColor as string | undefined) ?? "#00ff41";
        const x = Math.min(node.position.x + 40, W - 80);
        const y = Math.min(node.position.y + 80, H - 40);

        const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        circle.setAttribute("cx", String(x));
        circle.setAttribute("cy", String(y));
        circle.setAttribute("r", "20");
        circle.setAttribute("fill", "none");
        circle.setAttribute("stroke", color);
        circle.setAttribute("stroke-width", "1.5");
        svgEl.appendChild(circle);

        const label = document.createElementNS("http://www.w3.org/2000/svg", "text");
        label.setAttribute("x", String(x));
        label.setAttribute("y", String(y + 5));
        label.setAttribute("text-anchor", "middle");
        label.setAttribute("fill", color);
        label.setAttribute("font-family", "monospace");
        label.setAttribute("font-size", "9");
        label.textContent = node.data.contract.name.slice(0, 8);
        svgEl.appendChild(label);
      });

      const serializer = new XMLSerializer();
      const svgString = serializer.serializeToString(svgEl);
      const blob = new Blob([svgString], { type: "image/svg+xml" });
      downloadBlob(blob, "contract-dependency-graph.svg");
    } catch (err) {
      setError("SVG export failed. Try PNG instead.");
    } finally {
      setExporting(null);
    }
  }, [graphId, contracts, nodes]);

  const exportPNG = useCallback(async () => {
    setExporting("png");
    setError(null);
    try {
      // Find the ReactFlow container
      const rfEl = document.querySelector(`#${graphId}`) as HTMLElement | null;
      if (!rfEl) throw new Error("Graph container not found");

      // Dynamically import html2canvas-like approach using the canvas API
      const { default: html2canvas } = await import("html2canvas" as string).catch(() => ({
        default: null,
      }));

      if (html2canvas) {
        const canvas = await (html2canvas as Function)(rfEl, {
          backgroundColor: "#0a0e27",
          scale: 2,
          useCORS: true,
          logging: false,
        });
        canvas.toBlob((blob: Blob | null) => {
          if (blob) downloadBlob(blob, "contract-dependency-graph.png");
        });
      } else {
        // Fallback: generate a simple PNG via canvas
        const canvas = document.createElement("canvas");
        canvas.width = 1200;
        canvas.height = 800;
        const ctx = canvas.getContext("2d")!;
        ctx.fillStyle = "#0a0e27";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "#00ff41";
        ctx.font = "16px monospace";
        ctx.fillText(`SoroScan Contract Dependency Graph`, 40, 60);
        ctx.font = "12px monospace";
        ctx.fillStyle = "#94a3b8";
        ctx.fillText(
          `${contracts.length} contracts · Exported ${new Date().toLocaleDateString()}`,
          40,
          90,
        );

        // Draw simplified node grid
        const cols = Math.ceil(Math.sqrt(nodes.length));
        nodes.forEach((node, idx) => {
          const col = idx % cols;
          const row = Math.floor(idx / cols);
          const x = 80 + col * 150;
          const y = 130 + row * 80;
          const color = node.style?.borderColor as string ?? "#00ff41";
          ctx.strokeStyle = color;
          ctx.lineWidth = 1.5;
          ctx.strokeRect(x - 30, y - 20, 60, 40);
          ctx.fillStyle = color;
          ctx.font = "10px monospace";
          ctx.fillText(node.data.contract.name.slice(0, 10), x - 28, y + 5);
        });

        canvas.toBlob((blob) => {
          if (blob) downloadBlob(blob, "contract-dependency-graph.png");
        });
      }
    } catch (err) {
      setError("PNG export failed.");
    } finally {
      setExporting(null);
    }
  }, [graphId, contracts, nodes]);

  return (
    <div className="flex items-center gap-2">
      {error && (
        <span className="text-terminal-danger text-[10px] font-mono" role="alert">
          {error}
    } catch {
      setExportError("SVG export failed.");
    } finally {
      setExporting(null);
    }
  }, [contracts, nodes]);

  const exportPNG = useCallback(() => {
    setExporting("png");
    setExportError(null);
    try {
      const canvas = document.createElement("canvas");
      canvas.width = 1200;
      canvas.height = 800;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas not supported");

      ctx.fillStyle = "#0a0e27";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = "#00ff41";
      ctx.font = "16px monospace";
      ctx.fillText("SoroScan Contract Dependency Graph", 40, 50);

      ctx.fillStyle = "#94a3b8";
      ctx.font = "12px monospace";
      ctx.fillText(
        `${contracts.length} contracts · Exported ${new Date().toLocaleDateString()}`,
        40,
        75,
      );

      const cols = Math.ceil(Math.sqrt(nodes.length));
      nodes.forEach((node, idx) => {
        const col = idx % cols;
        const row = Math.floor(idx / cols);
        const x = 80 + col * 140;
        const y = 120 + row * 70;
        const color = (node.style?.borderColor as string | undefined) ?? "#00ff41";

        ctx.strokeStyle = color;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(x, y, 22, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = color;
        ctx.font = "9px monospace";
        ctx.textAlign = "center";
        ctx.fillText(node.data.contract.name.slice(0, 8), x, y + 4);
        ctx.textAlign = "left";
      });

      canvas.toBlob((blob) => {
        if (blob) downloadBlob(blob, "contract-dependency-graph.png");
      });
    } catch {
      setExportError("PNG export failed.");
    } finally {
      setExporting(null);
    }
  }, [contracts, nodes]);

  return (
    <div className="flex items-center gap-2">
      {exportError && (
        <span className="text-terminal-danger text-[10px] font-mono" role="alert">
          {exportError}
        </span>
      )}

      <div className="flex rounded border border-terminal-green/20 overflow-hidden text-[11px] font-mono">
        <ExportButton
          label="SVG"
          loading={exporting === "svg"}
          onClick={exportSVG}
          aria-label="Export graph as SVG"
        />
        <ExportButton
          label="PNG"
          loading={exporting === "png"}
          onClick={exportPNG}
          className="border-l border-terminal-green/20"
          aria-label="Export graph as PNG"
        />
        <ExportButton
          label="JSON"
          loading={exporting === "json"}
          onClick={exportJSON}
          className="border-l border-terminal-green/20"
          aria-label="Export graph data as JSON"
        />
      </div>
    </div>
  );
}

function ExportButton({
  label,
  loading,
  onClick,
  className = "",
  "aria-label": ariaLabel,
}: {
  label: string;
  loading: boolean;
  onClick: () => void;
  className?: string;
  "aria-label": string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      className={`px-2.5 py-1 text-terminal-gray hover:text-terminal-white hover:bg-terminal-green/10 transition-colors focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      aria-label={ariaLabel}
    >
      {loading ? "…" : `↓ ${label}`}
    </button>
  );
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export default GraphExporter;
