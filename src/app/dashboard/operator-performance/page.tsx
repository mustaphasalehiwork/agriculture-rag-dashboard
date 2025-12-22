"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import DashboardGrid from "@/components/operator-performance/dashboard-grid";
import { toast } from "sonner";
import { OperatorPerformance, OperatorPerformanceResponse } from "@/types/operator-performance";

// Import icons from lucide-react
import { RefreshCw, Calendar, Download, Users } from "lucide-react";

export default function OperatorPerformancePage() {
  const [operators, setOperators] = useState<OperatorPerformance[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  const fetchOperatorPerformance = async (showRefreshToast = false) => {
    try {
      // Use real API endpoint (requires authentication)
      const response = await fetch("/api/operator-performance");

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      const data: OperatorPerformanceResponse = await response.json();

      setOperators(data.data);
      setLastUpdated(data.lastUpdated);
      setError(null);

      if (showRefreshToast) {
        toast.success("Performance data refreshed successfully");
      }
    } catch (error) {
      console.error("Failed to fetch operator performance:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
      setError(errorMessage);

      // If real data fails, fallback to test data temporarily
      if (errorMessage.includes('Unauthorized') || errorMessage.includes('401')) {
        console.warn('Authentication required, falling back to test data for now');
        try {
          const testResponse = await fetch("/api/operator-performance-test");
          if (testResponse.ok) {
            const testData: OperatorPerformanceResponse = await testResponse.json();
            setOperators(testData.data);
            setLastUpdated(testData.lastUpdated);
            setError("Note: Showing test data - authentication required for real data");
            if (showRefreshToast) {
              toast.warning("Using test data - please login to view real performance metrics");
            }
            return;
          }
        } catch (testError) {
          console.error("Test data fallback also failed:", testError);
        }
      }

      if (showRefreshToast) {
        toast.error(`Failed to refresh data: ${errorMessage}`);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchOperatorPerformance();
  }, []);

  // Auto-refresh every 30 seconds (less frequent than documents since this is historical data)
  useEffect(() => {
    const interval = setInterval(() => {
      fetchOperatorPerformance();
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchOperatorPerformance(true);
  };

  const handleExportData = () => {
    try {
      // Create CSV content
      const headers = [
        "Name",
        "User Group",
        "Telegram ID",
        "Total Checklists",
        "Passed Count",
        "Pass Rate (%)",
        "Last Active Date"
      ];

      const csvContent = [
        headers.join(","),
        ...operators.map(operator => [
          `"${operator.name}"`,
          `"${operator.userGroup}"`,
          `"${operator.telegramId}"`,
          operator.totalChecklists,
          operator.passedCount,
          operator.passRate,
          `"${operator.lastActiveDate || "Never"}"`
        ].join(","))
      ].join("\n");

      // Create and download file
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);

      link.setAttribute("href", url);
      link.setAttribute(
        "download",
        `operator-performance-${new Date().toISOString().split("T")[0]}.csv`
      );
      link.style.visibility = "hidden";

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success("Performance data exported successfully");
    } catch (error) {
      console.error("Export failed:", error);
      toast.error("Failed to export data");
    }
  };

  const formatLastUpdated = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      });
    } catch {
      return "Unknown";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <div className="text-center">
            <p className="text-gray-600">Loading operator performance data...</p>
            <p className="text-sm text-gray-500 mt-1">This may take a moment as we fetch data from multiple sources</p>
          </div>
        </div>
      </div>
    );
  }

  if (error && operators.length === 0) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Operator Performance</h1>
            <p className="text-gray-600 mt-1">Weekly performance metrics for operators</p>
          </div>
        </div>

        <Card>
          <CardContent className="p-12">
            <div className="flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <Users className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Unable to Load Performance Data</h3>
              <p className="text-gray-500 max-w-md mb-6">
                {error}
              </p>
              <Button onClick={handleRefresh} disabled={refreshing}>
                {refreshing ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Retrying...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Try Again
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Operator Performance</h1>
          <p className="text-gray-600 mt-1">Weekly performance metrics for operators</p>
          {lastUpdated && (
            <div className="flex items-center space-x-2 mt-2">
              <Calendar className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-500">
                Last updated: {formatLastUpdated(lastUpdated)}
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center space-x-3">
          {error && (
            <div className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-md border border-red-200">
              ⚠️ {error}
            </div>
          )}

          <Button
            variant="outline"
            onClick={handleExportData}
            disabled={operators.length === 0}
          >
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>

          <Button onClick={handleRefresh} disabled={refreshing}>
            {refreshing ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Refreshing...
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Performance Information Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900">
            Performance Metrics Overview
          </CardTitle>
          <CardDescription>
            This dashboard displays weekly performance metrics for all operators based on checklist completion data.
            Performance is calculated based on pass rates across different question types.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="flex items-start space-x-3">
              <div className="w-3 h-3 bg-green-500 rounded-full mt-1.5"></div>
              <div>
                <div className="font-medium text-gray-900">Excellent Performance (≥90%)</div>
                <div className="text-gray-600">Operators demonstrating consistently high standards</div>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="w-3 h-3 bg-yellow-500 rounded-full mt-1.5"></div>
              <div>
                <div className="font-medium text-gray-900">Good Performance (75-89%)</div>
                <div className="text-gray-600">Operators meeting expectations with room for improvement</div>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="w-3 h-3 bg-red-500 rounded-full mt-1.5"></div>
              <div>
                <div className="font-medium text-gray-900">Needs Improvement (&lt;75%)</div>
                <div className="text-gray-600">Operators requiring additional support and training</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dashboard Grid */}
      <DashboardGrid
        operators={operators}
        loading={refreshing}
      />
    </div>
  );
}