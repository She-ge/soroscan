'use client';

import React from 'react';

import {
  clampProgressValue,
  formatProgressPercentage,
} from './progressBarUtils.mjs';

export type ProgressBarVariant =
  | 'primary'
  | 'success'
  | 'warning'
  | 'danger';

export type ProgressBarLabelPosition = 'above' | 'inside';

export interface ProgressBarProps {
  /** Progress value. Values outside 0–100 are clamped. */
  value?: number;
  /** Visual colour variant. */
  variant?: ProgressBarVariant;
  /** Optional descriptive label. */
  label?: string;
  /** Whether the label appears above or inside the bar. */
  labelPosition?: ProgressBarLabelPosition;
  /** Adds animation to the determinate fill. */
  animated?: boolean;
  /** Displays a continuously moving fill instead of a percentage. */
  indeterminate?: boolean;
  /** Additional classes applied to the outer wrapper. */
  className?: string;
  /** Controls whether the calculated percentage is displayed. */
  showPercentage?: boolean;
}

const fillClasses: Record<ProgressBarVariant, string> = {
  primary: 'bg-blue-500',
  success: 'bg-green-500',
  warning: 'bg-yellow-500',
  danger: 'bg-red-500',
};

const trackClasses: Record<ProgressBarVariant, string> = {
  primary: 'bg-blue-100',
  success: 'bg-green-100',
  warning: 'bg-yellow-100',
  danger: 'bg-red-100',
};

const ProgressBar: React.FC<ProgressBarProps> = ({
  value = 0,
  variant = 'primary',
  label,
  labelPosition = 'above',
  animated = false,
  indeterminate = false,
  className = '',
  showPercentage = true,
}) => {
  const clampedValue = clampProgressValue(value);
  const percentageText = formatProgressPercentage(value);

  const displayAboveContent =
    labelPosition === 'above' &&
    Boolean(label || (showPercentage && !indeterminate));

  const displayInsideContent =
    labelPosition === 'inside' &&
    Boolean(label || (showPercentage && !indeterminate));

  return (
    <div className={`w-full ${className}`.trim()}>
      {displayAboveContent && (
        <div
          className={`mb-2 flex items-center ${
            label ? 'justify-between' : 'justify-end'
          }`}
        >
          {label && (
            <span className="text-sm font-medium text-gray-700">
              {label}
            </span>
          )}

          {showPercentage && !indeterminate && (
            <span className="text-sm text-gray-500">
              {percentageText}
            </span>
          )}
        </div>
      )}

      <div
        className={`relative h-4 w-full overflow-hidden rounded-full ${trackClasses[variant]}`}
        role="progressbar"
        aria-label={label ?? 'Progress'}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={indeterminate ? undefined : clampedValue}
        aria-valuetext={
          indeterminate ? 'Loading' : percentageText
        }
        aria-busy={indeterminate || undefined}
        data-variant={variant}
      >
        <div
          data-testid="progress-fill"
          className={[
            'h-full rounded-full transition-[width] duration-300 ease-out',
            fillClasses[variant],
            animated && !indeterminate ? 'animate-pulse' : '',
            indeterminate ? 'animate-indeterminate' : '',
          ]
            .filter(Boolean)
            .join(' ')}
          style={{
            width: indeterminate ? '40%' : `${clampedValue}%`,
          }}
        />

        {displayInsideContent && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xs font-medium text-white mix-blend-difference">
              {label}
              {label && showPercentage && !indeterminate
                ? ' '
                : null}
              {showPercentage && !indeterminate
                ? percentageText
                : null}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProgressBar;
