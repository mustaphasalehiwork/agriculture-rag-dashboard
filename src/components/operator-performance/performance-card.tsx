import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ProgressDonut } from "@/components/ui/progress-donut";
import { cn } from "@/lib/utils";
import { OperatorPerformance, PerformanceCardProps } from "@/types/operator-performance";

/**
 * PerformanceCard Component
 *
 * Displays individual operator performance metrics in a card format.
 * Shows operator name, user group, total checklists, pass rate with visual indicator,
 * and additional performance details.
 */
const PerformanceCard = React.forwardRef<HTMLDivElement, PerformanceCardProps>(
  ({ operator, className }, ref) => {
    // Format date for display
    const formatDate = (dateString?: string) => {
      if (!dateString) return 'No activity';
      try {
        return new Date(dateString).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric'
        });
      } catch {
        return 'Invalid date';
      }
    };

    // Determine performance level and color
    const getPerformanceLevel = (passRate: number) => {
      if (passRate >= 90) return { level: 'Excellent', color: 'bg-green-500' };
      if (passRate >= 75) return { level: 'Good', color: 'bg-yellow-500' };
      return { level: 'Needs Work', color: 'bg-red-500' };
    };

    const { level, color } = getPerformanceLevel(operator.passRate);

    // Calculate trend (placeholder - could be implemented with historical data)
    const trend = operator.weeklyProgress;
    const getTrendIcon = (trend?: number) => {
      if (!trend) return null;
      if (trend > 0) return '↗️';
      if (trend < 0) return '↘️';
      return '→';
    };

    const getTrendColor = (trend?: number) => {
      if (!trend) return 'text-gray-500';
      if (trend > 0) return 'text-green-600';
      if (trend < 0) return 'text-red-600';
      return 'text-gray-500';
    };

    return (
      <Card
        ref={ref}
        className={cn(
          "hover:shadow-lg transition-all duration-300 cursor-pointer border-l-4",
          color.replace('bg-', 'border-l-'),
          className
        )}
      >
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <CardTitle className="text-lg font-semibold text-gray-900">
                {operator.name}
              </CardTitle>
              <div className="flex items-center space-x-2">
                <Badge variant="outline" className="text-xs">
                  {operator.userGroup}
                </Badge>
                <Badge
                  variant="secondary"
                  className={cn(
                    "text-xs",
                    operator.passRate >= 90 ? "bg-green-100 text-green-800" :
                    operator.passRate >= 75 ? "bg-yellow-100 text-yellow-800" :
                    "bg-red-100 text-red-800"
                  )}
                >
                  {level}
                </Badge>
              </div>
            </div>
            {trend !== undefined && (
              <div className={cn("flex items-center space-x-1 text-sm font-medium", getTrendColor(trend))}>
                <span>{getTrendIcon(trend)}</span>
                <span>{Math.abs(trend)}%</span>
              </div>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Main Performance Metric with Donut Chart */}
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="text-2xl font-bold text-gray-900">
                {operator.passRate}%
              </div>
              <div className="text-sm text-gray-500">Pass Rate</div>
            </div>
            <ProgressDonut
              percentage={operator.passRate}
              size={80}
              strokeWidth={6}
              className="ml-4"
            />
          </div>

          {/* Additional Metrics */}
          <div className="grid grid-cols-2 gap-4 pt-2 border-t border-gray-100">
            <div className="space-y-1">
              <div className="text-sm font-medium text-gray-900">
                {operator.totalChecklists}
              </div>
              <div className="text-xs text-gray-500">Total Checklists</div>
            </div>
            <div className="space-y-1">
              <div className="text-sm font-medium text-green-600">
                {operator.passedCount}
              </div>
              <div className="text-xs text-gray-500">Passed</div>
            </div>
          </div>

          {/* Last Activity */}
          <div className="pt-2 border-t border-gray-100">
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-500">Last Activity</span>
              <span className="text-gray-700 font-medium">
                {formatDate(operator.lastActiveDate)}
              </span>
            </div>
          </div>

          {/* Performance Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-gray-500">
              <span>Performance</span>
              <span>{operator.passRate}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={cn(
                  "h-2 rounded-full transition-all duration-500 ease-in-out",
                  operator.passRate >= 90 ? "bg-green-500" :
                  operator.passRate >= 75 ? "bg-yellow-500" :
                  "bg-red-500"
                )}
                style={{ width: `${operator.passRate}%` }}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }
);

PerformanceCard.displayName = "PerformanceCard";

export default PerformanceCard;