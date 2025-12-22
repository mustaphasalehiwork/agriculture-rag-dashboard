import { NextRequest, NextResponse } from "next/server";
import { OperatorPerformance, OperatorPerformanceResponse } from "@/types/operator-performance";

/**
 * Test API endpoint - no authentication required
 * Returns mock operator performance data for testing
 */
export async function GET(request: NextRequest) {
  try {
    // Mock operator performance data for testing
    const mockData: OperatorPerformance[] = [
      {
        name: "John Smith",
        userGroup: "Operator",
        telegramId: "123456789",
        totalChecklists: 12,
        passedCount: 11,
        passRate: 92,
        lastActiveDate: new Date().toISOString(),
      },
      {
        name: "Sarah Johnson",
        userGroup: "Operator",
        telegramId: "987654321",
        totalChecklists: 15,
        passedCount: 12,
        passRate: 80,
        lastActiveDate: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
      },
      {
        name: "Emily Wilson",
        userGroup: "Operator",
        telegramId: "789123456",
        totalChecklists: 8,
        passedCount: 8,
        passRate: 100,
        lastActiveDate: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
      },
      {
        name: "Mike Davis",
        userGroup: "Coordinator",
        telegramId: "456789123",
        totalChecklists: 20,
        passedCount: 14,
        passRate: 70,
        lastActiveDate: new Date(Date.now() - 259200000).toISOString(), // 3 days ago
      }
    ];

    // Calculate summary statistics
    const totalOperators = mockData.length;
    const totalChecklists = mockData.reduce((sum, op) => sum + op.totalChecklists, 0);
    const totalPassed = mockData.reduce((sum, op) => sum + op.passedCount, 0);
    const averagePassRate = Math.round(
      mockData.reduce((sum, op) => sum + op.passRate, 0) / totalOperators
    );
    const overallPassRate = Math.round((totalPassed / totalChecklists) * 100);

    const response: OperatorPerformanceResponse = {
      data: mockData,
      summary: {
        totalOperators,
        averagePassRate,
        totalChecklists,
        overallPassRate,
      },
      lastUpdated: new Date().toISOString(),
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error("Test API error:", error);

    return NextResponse.json({
      error: "Failed to load test data",
      message: error instanceof Error ? error.message : "Unknown error",
    }, { status: 500 });
  }
}