import * as React from "react";
import { cn } from "@/lib/utils";

export interface MetricCardProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  value: string | number;
  subtitle?: string;
  subValue?: string;
  change?: string | number;
  changeType?: "positive" | "negative" | "neutral";
  icon?: React.ReactNode;
  loading?: boolean;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtitle,
  subValue,
  change,
  changeType = "neutral",
  icon,
  loading = false,
  className,
  children,
  ...props
}) => {
  return (
    <div
      data-testid="metric-card"
      className={cn(
        "h-full flex flex-col justify-between p-4 rounded-lg border border-terminal-green/20 bg-terminal-black/60 font-terminal-mono transition-all",
        className
      )}
      {...props}
    >
      <div>
        <div className="flex items-start justify-between gap-2 mb-2">
          <p className="text-xs text-terminal-gray uppercase tracking-wider">
            {title}
          </p>
          {icon && (
            <div className="shrink-0 text-terminal-green/70">
              {icon}
            </div>
          )}
        </div>
        <div className="text-2xl font-bold text-terminal-green">
          {loading ? "---" : value}
        </div>
        {children}
      </div>

      <div className="mt-4 pt-2 border-t border-terminal-green/10 flex items-center justify-between text-xs">
        {(subValue || subtitle) && (
          <span className="text-terminal-gray truncate">
            {subValue || subtitle}
          </span>
        )}
        {change !== undefined && (
          <span
            className={cn(
              "font-mono font-medium ml-auto",
              changeType === "positive" && "text-terminal-green",
              changeType === "negative" && "text-terminal-danger",
              changeType === "neutral" && "text-terminal-gray"
            )}
          >
            {change}
          </span>
        )}
      </div>
    </div>
  );
};

export default MetricCard;
