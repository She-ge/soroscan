import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

const skeletonVariants = cva('bg-muted', {
  variants: {
    variant: {
      rectangle: 'rounded-md',
      circle: 'rounded-full',
      text: 'h-4 w-full rounded',
    },
    animation: {
      pulse: 'animate-pulse',
      shimmer:
        'animate-shimmer bg-[length:200%_100%] bg-gradient-to-r from-muted via-muted-foreground/10 to-muted',
      none: '',
    },
  },
  defaultVariants: {
    variant: 'rectangle',
    animation: 'shimmer',
  },
});

type DimensionValue = string | number;
type AnimationSpeed = 'fast' | 'normal' | 'slow' | string | number;
type SkeletonAnimation = 'pulse' | 'shimmer' | 'none';

const animationSpeedValues: Record<Extract<AnimationSpeed, 'fast' | 'normal' | 'slow'>, string> = {
  fast: '700ms',
  normal: '1.5s',
  slow: '2.5s',
};

function toCSSValue(value: DimensionValue | undefined): string | undefined {
  if (value === undefined) {
    return undefined;
  }

  return typeof value === 'number' ? `${value}px` : value;
}

function toAnimationDuration(speed: AnimationSpeed | undefined): string | undefined {
  if (speed === undefined) {
    return undefined;
  }

  if (typeof speed === 'number') {
    return `${speed}ms`;
  }

  if (speed in animationSpeedValues) {
    return animationSpeedValues[speed as Extract<AnimationSpeed, 'fast' | 'normal' | 'slow'>];
  }

  return speed;
}

interface SkeletonProps
  extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof skeletonVariants> {
  width?: DimensionValue;
  height?: DimensionValue;
  animationSpeed?: AnimationSpeed;
}

const Skeleton = React.forwardRef<HTMLDivElement, SkeletonProps>(
  (
    {
      className,
      variant = 'rectangle',
      animation = 'shimmer',
      animationSpeed = 'normal',
      width,
      height,
      style,
      ...props
    },
    ref,
  ) => {
    const dimensionStyle: React.CSSProperties = {
      width: toCSSValue(width),
      height: toCSSValue(height),
      animationDuration: animation === 'none' ? undefined : toAnimationDuration(animationSpeed),
      ...style,
    };

    return (
      <div
        ref={ref}
        data-slot="skeleton"
        aria-hidden="true"
        className={cn(
          skeletonVariants({
            variant,
            animation,
          }),
          className,
        )}
        style={dimensionStyle}
        {...props}
      />
    );
  },
);

Skeleton.displayName = 'Skeleton';

interface SkeletonTextProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'children'> {
  lines?: number;
  width?: DimensionValue;
  lineHeight?: DimensionValue;
  gap?: DimensionValue;
  lineWidths?: DimensionValue[];
  animation?: SkeletonAnimation;
  animationSpeed?: AnimationSpeed;
}

const SkeletonText = React.forwardRef<HTMLDivElement, SkeletonTextProps>(
  (
    {
      lines = 1,
      width = '100%',
      lineHeight = 16,
      gap = 8,
      lineWidths,
      animation = 'pulse',
      animationSpeed = 'normal',
      className,
      style,
      ...props
    },
    ref,
  ) => {
    const safeLineCount = Math.max(1, Math.floor(lines));

    return (
      <div
        ref={ref}
        data-slot="skeleton-text"
        aria-hidden="true"
        className={cn('flex flex-col', className)}
        style={{
          width: toCSSValue(width),
          gap: toCSSValue(gap),
          ...style,
        }}
        {...props}
      >
        {Array.from({ length: safeLineCount }, (_, index) => {
          const configuredWidth = lineWidths?.[index];
          const defaultWidth = index === safeLineCount - 1 && safeLineCount > 1 ? '75%' : '100%';

          return (
            <Skeleton
              key={index}
              data-slot="skeleton-text-line"
              variant="text"
              animation={animation}
              animationSpeed={animationSpeed}
              width={configuredWidth ?? defaultWidth}
              height={lineHeight}
            />
          );
        })}
      </div>
    );
  },
);

SkeletonText.displayName = 'SkeletonText';

interface SkeletonCardProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'children'> {
  width?: DimensionValue;
  height?: DimensionValue;
  lines?: number;
  showMedia?: boolean;
  showAvatar?: boolean;
  animation?: SkeletonAnimation;
  animationSpeed?: AnimationSpeed;
}

const SkeletonCard = React.forwardRef<HTMLDivElement, SkeletonCardProps>(
  (
    {
      width = '100%',
      height,
      lines = 3,
      showMedia = true,
      showAvatar = false,
      animation = 'pulse',
      animationSpeed = 'normal',
      className,
      style,
      ...props
    },
    ref,
  ) => (
    <div
      ref={ref}
      data-slot="skeleton-card"
      aria-hidden="true"
      className={cn(
        'flex flex-col gap-4 overflow-hidden rounded-lg border border-border p-4',
        className,
      )}
      style={{
        width: toCSSValue(width),
        height: toCSSValue(height),
        ...style,
      }}
      {...props}
    >
      {showMedia && (
        <Skeleton
          data-slot="skeleton-card-media"
          animation={animation}
          animationSpeed={animationSpeed}
          width="100%"
          height={160}
          className="shrink-0"
        />
      )}

      <div className="flex items-center gap-3">
        {showAvatar && (
          <Skeleton
            data-slot="skeleton-card-avatar"
            variant="circle"
            animation={animation}
            animationSpeed={animationSpeed}
            width={40}
            height={40}
            className="shrink-0"
          />
        )}

        <div className="flex-1 space-y-2">
          <Skeleton
            data-slot="skeleton-card-title"
            variant="text"
            animation={animation}
            animationSpeed={animationSpeed}
            width="60%"
            height={20}
          />

          <Skeleton
            data-slot="skeleton-card-subtitle"
            variant="text"
            animation={animation}
            animationSpeed={animationSpeed}
            width="40%"
            height={12}
          />
        </div>
      </div>

      <SkeletonText
        data-slot="skeleton-card-content"
        lines={lines}
        animation={animation}
        animationSpeed={animationSpeed}
        lineHeight={14}
        gap={10}
      />
    </div>
  ),
);

SkeletonCard.displayName = 'SkeletonCard';

interface SkeletonTableProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'children'> {
  rows?: number;
  columns?: number;
  width?: DimensionValue;
  height?: DimensionValue;
  rowHeight?: DimensionValue;
  showHeader?: boolean;
  animation?: SkeletonAnimation;
  animationSpeed?: AnimationSpeed;
}

const SkeletonTable = React.forwardRef<HTMLDivElement, SkeletonTableProps>(
  (
    {
      rows = 5,
      columns = 4,
      width = '100%',
      height,
      rowHeight = 20,
      showHeader = true,
      animation = 'pulse',
      animationSpeed = 'normal',
      className,
      style,
      ...props
    },
    ref,
  ) => {
    const safeRowCount = Math.max(1, Math.floor(rows));
    const safeColumnCount = Math.max(1, Math.floor(columns));
    const gridTemplateColumns = `repeat(${safeColumnCount}, minmax(0, 1fr))`;

    return (
      <div
        ref={ref}
        data-slot="skeleton-table"
        aria-hidden="true"
        className={cn('overflow-hidden rounded-lg border border-border', className)}
        style={{
          width: toCSSValue(width),
          height: toCSSValue(height),
          ...style,
        }}
        {...props}
      >
        {showHeader && (
          <div
            data-slot="skeleton-table-header"
            className="grid gap-4 border-b border-border bg-muted/30 p-4"
            style={{ gridTemplateColumns }}
          >
            {Array.from({ length: safeColumnCount }, (_, columnIndex) => (
              <Skeleton
                key={columnIndex}
                data-slot="skeleton-table-header-cell"
                variant="text"
                animation={animation}
                animationSpeed={animationSpeed}
                width={columnIndex === safeColumnCount - 1 ? '65%' : '85%'}
                height={rowHeight}
              />
            ))}
          </div>
        )}

        <div data-slot="skeleton-table-body">
          {Array.from({ length: safeRowCount }, (_, rowIndex) => (
            <div
              key={rowIndex}
              data-slot="skeleton-table-row"
              className="grid gap-4 border-b border-border/60 p-4 last:border-b-0"
              style={{ gridTemplateColumns }}
            >
              {Array.from({ length: safeColumnCount }, (_, columnIndex) => (
                <Skeleton
                  key={columnIndex}
                  data-slot="skeleton-table-cell"
                  variant="text"
                  animation={animation}
                  animationSpeed={animationSpeed}
                  width={
                    columnIndex === safeColumnCount - 1 ? '55%' : rowIndex % 2 === 0 ? '90%' : '75%'
                  }
                  height={rowHeight}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  },
);

SkeletonTable.displayName = 'SkeletonTable';

interface SkeletonChartProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'children'> {
  width?: DimensionValue;
  height?: DimensionValue;
  bars?: number;
  animation?: SkeletonAnimation;
  animationSpeed?: AnimationSpeed;
}

const SkeletonChart = React.forwardRef<HTMLDivElement, SkeletonChartProps>(
  (
    {
      width = '100%',
      height = 280,
      bars = 8,
      animation = 'pulse',
      animationSpeed = 'normal',
      className,
      style,
      ...props
    },
    ref,
  ) => {
    const safeBarCount = Math.max(1, Math.floor(bars));
    const barHeights = [42, 68, 54, 82, 64, 90, 58, 74];

    return (
      <div
        ref={ref}
        data-slot="skeleton-chart"
        aria-hidden="true"
        className={cn('relative overflow-hidden rounded-lg border border-border p-4', className)}
        style={{
          width: toCSSValue(width),
          height: toCSSValue(height),
          ...style,
        }}
        {...props}
      >
        <div
          data-slot="skeleton-chart-grid"
          className="absolute inset-4 flex flex-col justify-between"
        >
          {Array.from({ length: 5 }, (_, index) => (
            <div key={index} className="h-px w-full bg-border/60" />
          ))}
        </div>

        <div
          data-slot="skeleton-chart-bars"
          className="absolute inset-x-6 bottom-6 top-6 flex items-end justify-between gap-3"
        >
          {Array.from({ length: safeBarCount }, (_, index) => (
            <Skeleton
              key={index}
              data-slot="skeleton-chart-bar"
              animation={animation}
              animationSpeed={animationSpeed}
              width={`${Math.max(4, 80 / safeBarCount)}%`}
              height={`${barHeights[index % barHeights.length]}%`}
              className="min-w-2"
            />
          ))}
        </div>
      </div>
    );
  },
);

SkeletonChart.displayName = 'SkeletonChart';

export { Skeleton, SkeletonCard, SkeletonChart, SkeletonTable, SkeletonText, skeletonVariants };

export type {
  AnimationSpeed,
  DimensionValue,
  SkeletonAnimation,
  SkeletonCardProps,
  SkeletonChartProps,
  SkeletonProps,
  SkeletonTableProps,
  SkeletonTextProps,
};
