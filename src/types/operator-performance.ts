// Operator Performance Dashboard Type Definitions

/**
 * Represents a checklist question record from Supabase CheckListQuestion table
 */
export interface CheckListQuestion {
  id: number;
  telegramId: string; // To identify the operator
  question: string; // The exact text of the question
  response: string; // The operator's response
  created_at?: string;
  updated_at?: string;
  // ... other columns that might exist in the table
}

/**
 * Represents a user from Airtable Users view
 */
export interface User {
  TelegramId: string;
  Name: string;
  UserGroup: 'Operator' | 'Coordinator';
  // ... other user fields that might exist
}

/**
 * Represents a checklist template from Airtable CheckList Template view
 */
export interface CheckListTemplate {
  Question: string;
  ResponseType: 'Yes/No' | 'Enum (Ok/Below/Above)' | 'Enum (Green/Yellow/Red)';
  // ... other template fields that might exist
}

/**
 * Represents aggregated operator performance metrics
 */
export interface OperatorPerformance {
  name: string;
  userGroup: string;
  telegramId: string;
  totalChecklists: number;
  passedCount: number;
  passRate: number; // (passedCount / totalChecklists) * 100
  // Optional: Additional metrics for future expansion
  lastActiveDate?: string;
  weeklyProgress?: number; // Percentage change from previous week
}

/**
 * API response type for operator performance data
 */
export interface OperatorPerformanceResponse {
  data: OperatorPerformance[];
  summary: {
    totalOperators: number;
    averagePassRate: number;
    totalChecklists: number;
    overallPassRate: number;
  };
  lastUpdated: string;
}

/**
 * Performance metrics for UI display
 */
export interface PerformanceMetrics {
  label: string;
  value: number;
  color: 'green' | 'yellow' | 'red' | 'gray';
  trend?: 'up' | 'down' | 'neutral';
}

/**
 * Chart data type for performance visualization
 */
export interface PerformanceChartData {
  name: string;
  value: number;
  fill: string;
}

/**
 * Props for the PerformanceCard component
 */
export interface PerformanceCardProps {
  operator: OperatorPerformance;
  className?: string;
}

/**
 * Props for the DashboardGrid component
 */
export interface DashboardGridProps {
  operators: OperatorPerformance[];
  loading?: boolean;
  className?: string;
}

/**
 * Props for the ProgressDonut component
 */
export interface ProgressDonutProps {
  percentage: number;
  size?: number;
  strokeWidth?: number;
  className?: string;
  showLabel?: boolean;
}

/**
 * Airtable API response wrapper
 */
export interface AirtableResponse<T> {
  records: Array<{
    id: string;
    createdTime: string;
    fields: T;
  }>;
}

/**
 * Error response type
 */
export interface ErrorResponse {
  error: string;
  message?: string;
  details?: any;
}

/**
 * Date range filter for performance reports
 */
export interface DateRange {
  startDate: string;
  endDate: string;
}

/**
 * Performance thresholds for color coding
 */
export interface PerformanceThresholds {
  excellent: number; // >= this value is green
  good: number; // >= this value is yellow
  // below good threshold is red
}

// Default performance thresholds
export const DEFAULT_PERFORMANCE_THRESHOLDS: PerformanceThresholds = {
  excellent: 90,
  good: 75
};

// Helper type for response type mapping
export type ResponseTypeMap = {
  'Yes/No': string[];
  'Enum (Ok/Below/Above)': string[];
  'Enum (Green/Yellow/Red)': string[];
};

// Default pass responses for each response type
export const DEFAULT_PASS_RESPONSES: ResponseTypeMap = {
  'Yes/No': ['Yes', 'yes', 'Y', 'y'],
  'Enum (Ok/Below/Above)': ['Ok', 'ok', 'OK'],
  'Enum (Green/Yellow/Red)': ['Green', 'green', 'G', 'g']
};