// Simple chart components using SVG (no external chart library dependency)
// Optimized for terminal aesthetic

export interface ChartData {
  label: string;
  value: number;
}

interface LineChartProps {
  data: Array<{ label: string; value: number }>;
  title: string;
  height?: number;
}

export function LineChart({ data, title, height = 200 }: LineChartProps) {
  if (data.length === 0) return null;

  const maxValue = Math.max(...data.map((d) => d.value));
  const padding = 40;
  const width = 600;
  const chartHeight = height - padding;

  const points = data.map((d, i) => {
    const x = padding + (i / (data.length - 1 || 1)) * (width - 2 * padding);
    const y = chartHeight - (d.value / maxValue) * (chartHeight - 20) - 10;
    return { x, y, value: d.value };
  });

  const pathD = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");

  return (
    <div className="rounded border border-terminal-green/20 p-4">
      <p className="text-xs text-terminal-gray mb-2">{title}</p>
      <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} className="text-terminal-green">
        <path d={pathD} stroke="currentColor" strokeWidth="2" fill="none" />
        {points.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r="3" fill="currentColor" />
        ))}
      </svg>
    </div>
  );
}

interface BarChartProps {
  data: ChartData[];
  title: string;
  height?: number;
}

export function BarChart({ data, title, height = 200 }: BarChartProps) {
  if (data.length === 0) return null;

  const maxValue = Math.max(...data.map((d) => d.value));
  const barWidth = Math.min(40, Math.floor(500 / data.length));
  const padding = 30;
  const chartHeight = height - 2 * padding;

  return (
    <div className="rounded border border-terminal-cyan/20 p-4">
      <p className="text-xs text-terminal-cyan mb-2">{title}</p>
      <svg width="100%" height={height} viewBox="0 0 600 250" className="text-terminal-cyan">
        {data.map((d, i) => {
          const barHeight = (d.value / maxValue) * chartHeight;
          const x = padding + i * (barWidth + 10);
          const y = height - padding - barHeight;
          return (
            <g key={i}>
              <rect x={x} y={y} width={barWidth} height={barHeight} fill="currentColor" opacity="0.7" />
              <text x={x + barWidth / 2} y={height - 10} textAnchor="middle" fontSize="10" fill="currentColor">
                {d.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

interface PieChartProps {
  data: ChartData[];
  title: string;
}

export function PieChart({ data, title }: PieChartProps) {
  if (data.length === 0) return null;

  const total = data.reduce((sum, d) => sum + d.value, 0);
  const colors = [
    "fill-terminal-green",
    "fill-terminal-cyan",
    "fill-terminal-magenta",
    "fill-terminal-yellow",
  ];

  let currentAngle = -Math.PI / 2;
  const slices = data.map((d, i) => {
    const sliceAngle = (d.value / total) * 2 * Math.PI;
    const startAngle = currentAngle;
    const endAngle = currentAngle + sliceAngle;

    const x1 = Math.cos(startAngle);
    const y1 = Math.sin(startAngle);
    const x2 = Math.cos(endAngle);
    const y2 = Math.sin(endAngle);

    const largeArc = sliceAngle > Math.PI ? 1 : 0;
    const pathData = [
      `M 0 0`,
      `L ${x1 * 80} ${y1 * 80}`,
      `A 80 80 0 ${largeArc} 1 ${x2 * 80} ${y2 * 80}`,
      "Z",
    ].join(" ");

    currentAngle = endAngle;

    return {
      pathData,
      label: d.label,
      value: d.value,
      percent: ((d.value / total) * 100).toFixed(1),
      colorIndex: i % colors.length,
    };
  });

  return (
    <div className="rounded border border-terminal-magenta/20 p-4">
      <p className="text-xs text-terminal-magenta mb-2">{title}</p>
      <div className="flex gap-4">
        <svg width="200" height="200" viewBox="-100 -100 200 200" className="flex-shrink-0">
          {slices.map((slice, i) => (
            <path
              key={i}
              d={slice.pathData}
              stroke="black"
              strokeWidth="2"
              fill={
                ["#00FF00", "#00FFFF", "#FF00FF", "#FFFF00"][
                  slice.colorIndex
                ]
              }
              opacity="0.7"
            />
          ))}
        </svg>
        <div className="flex-1 space-y-1 text-xs">
          {slices.map((slice, i) => (
            <div key={i} className="flex justify-between">
              <span className="text-terminal-gray">{slice.label}:</span>
              <span className="font-bold">{slice.percent}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function HeatmapChart({
  data,
  title,
}: {
  data: Array<Array<number>>;
  title: string;
}) {
  if (data.length === 0) return null;

  const max = Math.max(...data.flat());
  const cols = data[0].length;

  const getColor = (value: number): string => {
    const intensity = value / max;
    if (intensity < 0.33) return "#001a00";
    if (intensity < 0.66) return "#00aa00";
    return "#00ff00";
  };

  return (
    <div className="rounded border border-terminal-yellow/20 p-4">
      <p className="text-xs text-terminal-yellow mb-2">{title}</p>
      <svg width="100%" height="150" viewBox={`0 0 ${cols * 20} 150`}>
        {data.map((row, rowIdx) =>
          row.map((value, colIdx) => (
            <rect
              key={`${rowIdx}-${colIdx}`}
              x={colIdx * 20}
              y={rowIdx * 20}
              width="18"
              height="18"
              fill={getColor(value)}
              stroke="#222"
              strokeWidth="1"
            />
          ))
        )}
      </svg>
    </div>
  );
}
