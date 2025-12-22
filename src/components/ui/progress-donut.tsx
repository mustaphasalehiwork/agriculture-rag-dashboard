import * as React from "react";
import { cn } from "@/lib/utils";
import { ProgressDonutProps } from "@/types/operator-performance";

/**
 * ProgressDonut Component
 *
 * A circular progress indicator component that displays a percentage in a donut chart format.
 * Color-coded based on performance thresholds:
 * - Green (>= 90%): Excellent performance
 * - Yellow (>= 75%): Good performance
 * - Red (< 75%): Needs improvement
 */
const ProgressDonut = React.forwardRef<SVGSVGElement, ProgressDonutProps>(
  ({ percentage, size = 120, strokeWidth = 8, className, showLabel = true }, ref) => {
    // Calculate color based on performance thresholds
    const getColor = (percentage: number) => {
      if (percentage >= 90) return '#10b981'; // green-500
      if (percentage >= 75) return '#eab308'; // yellow-500
      return '#ef4444'; // red-500
    };

    // Calculate SVG dimensions and properties
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const strokeDasharray = circumference;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;

    const color = getColor(percentage);
    const center = size / 2;

    return (
      <div className={cn("relative inline-flex items-center justify-center", className)}>
        <svg
          ref={ref}
          width={size}
          height={size}
          className="transform -rotate-90"
          viewBox={`0 0 ${size} ${size}`}
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Background circle (track) */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            stroke="#e5e7eb" // gray-200
            strokeWidth={strokeWidth}
            fill="none"
            className="opacity-20"
          />

          {/* Progress circle */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            stroke={color}
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-500 ease-in-out"
          />
        </svg>

        {/* Center content (percentage label) */}
        {showLabel && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <span
                className="text-2xl font-bold"
                style={{ color }}
              >
                {percentage}%
              </span>
              <div className="text-xs text-gray-500 mt-1">
                {percentage >= 90 ? 'Excellent' :
                 percentage >= 75 ? 'Good' : 'Needs Work'}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }
);

ProgressDonut.displayName = "ProgressDonut";

export { ProgressDonut };
export default ProgressDonut;