import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import PerformanceCard from "./performance-card";
import { cn } from "@/lib/utils";
import { OperatorPerformance, DashboardGridProps } from "@/types/operator-performance";

/**
 * DashboardGrid Component
 *
 * Renders a responsive grid of operator performance cards with summary statistics.
 * Includes loading states, empty states, and performance summary.
 */
const DashboardGrid = React.forwardRef<HTMLDivElement, DashboardGridProps>(
  ({ operators, loading = false, className }, ref) => {
    // Calculate summary statistics
    const totalOperators = operators.length;
    const totalChecklists = operators.reduce((sum, op) => sum + op.totalChecklists, 0);
    const totalPassed = operators.reduce((sum, op) => sum + op.passedCount, 0);
    const averagePassRate = totalOperators > 0
      ? Math.round(operators.reduce((sum, op) => sum + op.passRate, 0) / totalOperators)
      : 0;
    const overallPassRate = totalChecklists > 0
      ? Math.round((totalPassed / totalChecklists) * 100)
      : 0;

    // Performance distribution
    const excellentPerformers = operators.filter(op => op.passRate >= 90).length;
    const goodPerformers = operators.filter(op => op.passRate >= 75 && op.passRate < 90).length;
    const needsImprovement = operators.filter(op => op.passRate < 75).length;

    // Loading skeleton component
    const LoadingSkeleton = () => (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {Array.from({ length: 8 }).map((_, index) => (
          <Card key={index} className="animate-pulse">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <div className="h-6 bg-gray-200 rounded w-3/4"></div>
                  <div className="flex space-x-2">
                    <div className="h-5 bg-gray-200 rounded-full w-16"></div>
                    <div className="h-5 bg-gray-200 rounded-full w-20"></div>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <div className="h-8 bg-gray-200 rounded w-12"></div>
                  <div className="h-4 bg-gray-200 rounded w-16"></div>
                </div>
                <div className="h-16 w-16 bg-gray-200 rounded-full ml-4"></div>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-2 border-t border-gray-100">
                <div className="space-y-1">
                  <div className="h-4 bg-gray-200 rounded w-8"></div>
                  <div className="h-3 bg-gray-200 rounded w-20"></div>
                </div>
                <div className="space-y-1">
                  <div className="h-4 bg-gray-200 rounded w-8"></div>
                  <div className="h-3 bg-gray-200 rounded w-12"></div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );

    // Empty state component
    const EmptyState = () => (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
          <svg
            className="w-10 h-10 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 17v1a1 1 0 001 1h4a1 1 0 001-1v-1m3-2V8a2 2 0 00-2-2H8a2 2 0 00-2 2v6m3-2h6"
            />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No Operator Data Available</h3>
        <p className="text-gray-500 max-w-md">
          There are no operator performance records to display. This could be because no checklist data has been collected yet, or there might be an issue with the data sources.
        </p>
      </div>
    );

    if (loading) {
      return (
        <div ref={ref} className={cn("space-y-6", className)}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, index) => (
              <Card key={index} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          <LoadingSkeleton />
        </div>
      );
    }

    if (operators.length === 0) {
      return (
        <div ref={ref} className={cn("space-y-6", className)}>
          <Card>
            <CardContent className="p-6">
              <EmptyState />
            </CardContent>
          </Card>
        </div>
      );
    }

    return (
      <div ref={ref} className={cn("space-y-6", className)}>
        {/* Summary Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="space-y-2">
                <div className="text-sm font-medium text-gray-500">Total Operators</div>
                <div className="text-3xl font-bold text-gray-900">{totalOperators}</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="space-y-2">
                <div className="text-sm font-medium text-gray-500">Average Pass Rate</div>
                <div className="text-3xl font-bold text-blue-600">{averagePassRate}%</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="space-y-2">
                <div className="text-sm font-medium text-gray-500">Total Checklists</div>
                <div className="text-3xl font-bold text-gray-900">{totalChecklists}</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="space-y-2">
                <div className="text-sm font-medium text-gray-500">Overall Pass Rate</div>
                <div className="text-3xl font-bold text-green-600">{overallPassRate}%</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Performance Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900">Performance Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-900">Excellent (≥90%)</span>
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      {excellentPerformers}
                    </Badge>
                  </div>
                  <div className="text-xs text-gray-500">{Math.round((excellentPerformers / totalOperators) * 100)}% of operators</div>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-900">Good (75-89%)</span>
                    <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                      {goodPerformers}
                    </Badge>
                  </div>
                  <div className="text-xs text-gray-500">{Math.round((goodPerformers / totalOperators) * 100)}% of operators</div>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-900">Needs Work (75%)</span>
                    <Badge variant="secondary" className="bg-red-100 text-red-800">
                      {needsImprovement}
                    </Badge>
                  </div>
                  <div className="text-xs text-gray-500">{Math.round((needsImprovement / totalOperators) * 100)}% of operators</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Performance Cards Grid */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">Operator Performance</h2>
            <div className="text-sm text-gray-500">
              Showing {operators.length} operator{operators.length !== 1 ? 's' : ''}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {operators.map((operator) => (
              <PerformanceCard
                key={operator.telegramId}
                operator={operator}
                className="h-full"
              />
            ))}
          </div>
        </div>
      </div>
    );
  }
);

DashboardGrid.displayName = "DashboardGrid";

export default DashboardGrid;