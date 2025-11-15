"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, HardDrive, Clock, TrendingUp, CheckCircle, XCircle, AlertCircle } from "lucide-react";

interface Document {
  id: string;
  filename: string;
  original_filename: string;
  file_size_bytes: number;
  status: "processing" | "completed" | "failed";
  total_chunks: number | null;
  chunks_processed: number | null;
  created_at: string;
  completed_at: string | null;
  error_message?: string | null;
}

interface ReportStats {
  totalDocuments: number;
  totalSize: number;
  completedDocuments: number;
  processingDocuments: number;
  failedDocuments: number;
  totalChunks: number;
  averageProcessingTime: number;
  uploadTrend: Array<{
    date: string;
    uploads: number;
  }>;
}

export default function ReportsPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<ReportStats | null>(null);

  const fetchDocuments = async () => {
    try {
      const response = await fetch("/api/documents");
      if (response.ok) {
        const data = await response.json();
        setDocuments(data);
        calculateStats(data);
      }
    } catch {
      console.error("Failed to load documents");
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (docs: Document[]) => {
    const totalDocuments = docs.length;
    const completedDocuments = docs.filter((doc) => doc.status === "completed").length;
    const processingDocuments = docs.filter((doc) => doc.status === "processing").length;
    const failedDocuments = docs.filter((doc) => doc.status === "failed").length;

    const totalSize = docs.reduce((sum, doc) => sum + doc.file_size_bytes, 0);
    const totalChunks = docs.reduce((sum, doc) => sum + (doc.total_chunks || 0), 0);

    // Calculate average processing time (in minutes)
    const completedDocs = docs.filter((doc) => doc.status === "completed" && doc.completed_at);
    const averageProcessingTime = completedDocs.length > 0
      ? completedDocs.reduce((sum, doc) => {
          const created = new Date(doc.created_at).getTime();
          const completed = new Date(doc.completed_at!).getTime();
          return sum + (completed - created) / (1000 * 60); // Convert to minutes
        }, 0) / completedDocs.length
      : 0;

    // Generate upload trend for last 7 days
    const uploadTrend = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      const dateStr = date.toISOString().split('T')[0];
      const uploads = docs.filter((doc) =>
        doc.created_at.startsWith(dateStr)
      ).length;

      return { date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), uploads };
    });

    setStats({
      totalDocuments,
      totalSize,
      completedDocuments,
      processingDocuments,
      failedDocuments,
      totalChunks,
      averageProcessingTime,
      uploadTrend,
    });
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  const formatFileSize = (bytes: number) => {
    const sizes = ["Bytes", "KB", "MB", "GB"];
    if (bytes === 0) return "0 Bytes";
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + " " + sizes[i];
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 1) return "< 1 min";
    if (minutes < 60) return `${Math.round(minutes)} min`;
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return `${hours}h ${mins}m`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const successRate = stats ? Math.round((stats.completedDocuments / stats.totalDocuments) * 100) : 0;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Reports & Analytics</h1>
        <p className="text-gray-600 mt-1">Monitor your document processing performance and statistics</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Documents</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalDocuments || 0}</div>
            <p className="text-xs text-muted-foreground">
              {formatFileSize(stats?.totalSize || 0)} total size
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{successRate}%</div>
            <p className="text-xs text-muted-foreground">
              {stats?.completedDocuments || 0} successful
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Chunks</CardTitle>
            <HardDrive className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalChunks || 0}</div>
            <p className="text-xs text-muted-foreground">
              Across all documents
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Processing Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatDuration(stats?.averageProcessingTime || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Per document
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="text-green-800 flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              Completed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              {stats?.completedDocuments || 0}
            </div>
            <p className="text-green-700 text-sm">
              Documents processed successfully
            </p>
          </CardContent>
        </Card>

        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="text-blue-800 flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Processing
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">
              {stats?.processingDocuments || 0}
            </div>
            <p className="text-blue-700 text-sm">
              Currently being processed
            </p>
          </CardContent>
        </Card>

        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-800 flex items-center gap-2">
              <XCircle className="h-5 w-5" />
              Failed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">
              {stats?.failedDocuments || 0}
            </div>
            <p className="text-red-700 text-sm">
              Documents that failed to process
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Upload Trend Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Upload Trend (Last 7 Days)</CardTitle>
          <CardDescription>
            Number of documents uploaded per day
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-end justify-between h-32 px-4">
            {stats?.uploadTrend.map((day, index) => {
              const maxUploads = Math.max(...stats.uploadTrend.map(d => d.uploads));
              const height = maxUploads > 0 ? (day.uploads / maxUploads) * 100 : 0;

              return (
                <div key={index} className="flex flex-col items-center flex-1">
                  <div className="w-full flex justify-center">
                    <div
                      className="bg-blue-600 rounded-t transition-all duration-300"
                      style={{ height: `${height}%`, width: '20px' }}
                    ></div>
                  </div>
                  <div className="text-xs text-gray-500 mt-2 text-center">
                    {day.date}
                  </div>
                  <div className="text-sm font-medium text-center">
                    {day.uploads}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Recent Documents */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Documents</CardTitle>
          <CardDescription>
            Latest document uploads and their status
          </CardDescription>
        </CardHeader>
        <CardContent>
          {documents.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No documents yet</h3>
              <p className="text-gray-500">Upload some documents to see analytics here.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {documents.slice(0, 10).map((document) => (
                <div key={document.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <FileText className="h-4 w-4 text-gray-400" />
                    <div>
                      <p className="font-medium text-gray-900 truncate max-w-xs">
                        {document.original_filename}
                      </p>
                      <p className="text-sm text-gray-500">
                        {formatFileSize(document.file_size_bytes)} •
                        {new Date(document.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={
                        document.status === "completed"
                          ? "secondary"
                          : document.status === "processing"
                          ? "secondary"
                          : "secondary"
                      }
                      className={
                        document.status === "completed"
                          ? "bg-green-100 text-green-800"
                          : document.status === "processing"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-red-100 text-red-800"
                      }
                    >
                      {document.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}