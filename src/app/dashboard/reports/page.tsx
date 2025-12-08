"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, HardDrive, Clock, TrendingUp, CheckCircle, XCircle, AlertCircle, Download, RefreshCw, Database, Users, Activity, Tag, Package, Settings, Wrench, AlertTriangle, Cpu, Truck, Sprout, Filter } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { getAirtableClient, AIRTABLE_TABLES } from "@/lib/airtable";
import { toast } from "sonner";

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

interface AirtableRecord {
  id: string;
  fields: Record<string, any>;
}

interface SystemReport {
  id: string;
  title: string;
  type: "operational" | "equipment" | "troubleshooting";
  status: "active" | "resolved" | "pending";
  priority: "high" | "medium" | "low";
  created_at: string;
  description: string;
  category?: string;
  assigned_to?: string;
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

interface AirtableStats {
  categories: number;
  activities: number;
  models: number;
  checklists: number;
  users: number;
}

export default function ReportsPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingAirtable, setLoadingAirtable] = useState(false);
  const [activeTab, setActiveTab] = useState<"operational" | "equipment" | "troubleshooting">("operational");
  const [stats, setStats] = useState<ReportStats | null>(null);
  const [airtableStats, setAirtableStats] = useState<AirtableStats | null>(null);
  const [systemReports, setSystemReports] = useState<SystemReport[]>([]);

  const fetchDocuments = async () => {
    try {
      const { data: documents, error } = await supabase()
        .from("ingestion_jobs")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Failed to fetch documents from Supabase:", error);
        toast.error("Failed to load documents from database");
        return;
      }

      setDocuments(documents || []);
      calculateStats(documents || []);
    } catch (error) {
      console.error("Failed to load documents:", error);
      toast.error("Failed to load documents");
    } finally {
      setLoading(false);
    }
  };

  const fetchAirtableStats = async () => {
    setLoadingAirtable(true);
    try {
      const airtable = getAirtableClient();

      const [categories, activities, models, checklists, users] = await Promise.all([
        airtable.base('appSFfG3TTY5qFRyr').table(AIRTABLE_TABLES.CATEGORIES).select().firstPage(),
        airtable.base('appSFfG3TTY5qFRyr').table(AIRTABLE_TABLES.ACTIVITIES).select().firstPage(),
        airtable.base('appSFfG3TTY5qFRyr').table(AIRTABLE_TABLES.MODELS).select().firstPage(),
        airtable.base('appSFfG3TTY5qFRyr').table(AIRTABLE_TABLES.CHECKLISTS).select().firstPage(),
        airtable.base('appSFfG3TTY5qFRyr').table(AIRTABLE_TABLES.USERS).select().firstPage()
      ]);

      setAirtableStats({
        categories: categories.length,
        activities: activities.length,
        models: models.length,
        checklists: checklists.length,
        users: users.length
      });

      toast.success("Airtable data loaded successfully");
    } catch (error) {
      console.error("Failed to fetch Airtable data:", error);
      toast.error("Failed to load Airtable data");
    } finally {
      setLoadingAirtable(false);
    }
  };

  const fetchSystemReports = async () => {
    try {
      // Fetch real system reports from Airtable
      const airtable = getAirtableClient();

      // Fetch active checklist items
      const activeChecklists = await airtable
        .base('appSFfG3TTY5qFRyr')
        .table(AIRTABLE_TABLES.CHECKLISTS)
        .select()
        .firstPage();

      // Fetch activity reports
      const activityReports = await airtable
        .base('appSFfG3TTY5qFRyr')
        .table(AIRTABLE_TABLES.ACTIVITIES)
        .select()
        .firstPage();

      // Fetch equipment models data
      const equipmentModels = await airtable
        .base('appSFfG3TTY5qFRyr')
        .table(AIRTABLE_TABLES.MODELS)
        .select()
        .firstPage();

      // Generate system reports from Airtable data
      const generatedReports: SystemReport[] = [];

      // Convert active checklists to operational reports
      activeChecklists.forEach((checklist: any, index: number) => {
        generatedReports.push({
          id: `checklist_${index + 1}`,
          title: checklist.fields['Name'] || `Checklist #${index + 1}`,
          type: "operational",
          status: checklist.fields['Completed'] ? "completed" : "active",
          priority: checklist.fields['Priority']?.toLowerCase() || "medium",
          created_at: new Date(checklist.createdTime).toISOString(),
          description: checklist.fields['Description'] || "System performance check",
          category: checklist.fields['Category'] || "General",
          assigned_to: checklist.fields['AssignedTo'] || ""
        });
      });

      // Convert activities to reports
      activityReports.forEach((activity: any, index: number) => {
        generatedReports.push({
          id: `activity_${index + 1}`,
          title: activity.fields['Title'] || `Activity #${index + 1}`,
          type: activity.fields['Type']?.toLowerCase() || "operational",
          status: activity.fields['Status']?.toLowerCase() || "active",
          priority: activity.fields['Priority']?.toLowerCase() || "medium",
          created_at: new Date(activity.createdTime).toISOString(),
          description: activity.fields['Description'] || "Operational activity report",
          category: activity.fields['Category'] || "Operations",
          assigned_to: activity.fields['AssignedTo'] || ""
        });
      });

      // Convert equipment data to equipment reports
      equipmentModels.forEach((equipment: any, index: number) => {
        const equipmentType = equipment.fields['Type'] || "General";
        const modelName = equipment.fields['ModelName'] || `Model #${index + 1}`;
        const modelId = equipment.fields['ModelId'] || `model_${index + 1}`;

        generatedReports.push({
          id: `equipment_${index + 1}`,
          title: `${equipmentType} Report: ${modelName}`,
          type: "equipment",
          status: equipment.fields['Status']?.toLowerCase() || "active",
          priority: equipment.fields['Priority']?.toLowerCase() || "medium",
          created_at: new Date(equipment.createdTime).toISOString(),
          description: `${equipmentType} status and performance report - ${modelName}`,
          category: equipmentType,
          assigned_to: equipment.fields['AssignedTo'] || ""
        });
      });

      setSystemReports(generatedReports);
      toast.success("Reports loaded successfully from Airtable");

    } catch (error) {
      console.error("Failed to fetch system reports:", error);
      toast.error("Failed to load system reports");
    }
  };

  const calculateStats = (docs: Document[]) => {
    const totalDocuments = docs.length;
    const completedDocuments = docs.filter((doc) => doc.status === "completed").length;
    const processingDocuments = docs.filter((doc) => doc.status === "processing").length;
    const failedDocuments = docs.filter((doc) => doc.status === "failed").length;

    const totalSize = docs.reduce((sum, doc) => sum + doc.file_size_bytes, 0);
    const totalChunks = docs.reduce((sum, doc) => sum + (doc.total_chunks || 0), 0);

    const completedDocs = docs.filter((doc) => doc.status === "completed" && doc.completed_at);
    const averageProcessingTime = completedDocs.length > 0
      ? completedDocs.reduce((sum, doc) => {
          const created = new Date(doc.created_at).getTime();
          const completed = new Date(doc.completed_at!).getTime();
          return sum + (completed - created) / (1000 * 60);
        }, 0) / completedDocs.length
      : 0;

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
    fetchSystemReports();
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

  const exportToCSV = () => {
    if (!documents.length) {
      toast.error("No data to export");
      return;
    }

    const headers = ['ID', 'Filename', 'Original Filename', 'Status', 'File Size', 'Total Chunks', 'Chunks Processed', 'Created At', 'Completed At'];
    const csvContent = [
      headers.join(','),
      ...documents.map(doc => [
        doc.id,
        doc.filename,
        doc.original_filename,
        doc.status,
        doc.file_size_bytes,
        doc.total_chunks || 0,
        doc.chunks_processed || 0,
        doc.created_at,
        doc.completed_at || ''
      ].map(field => `"${field}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `agriculture-reports-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);

    toast.success("Report exported successfully");
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
      case 'processing':
        return 'text-blue-600 bg-blue-100';
      case 'completed':
      case 'resolved':
        return 'text-green-600 bg-green-100';
      case 'pending':
        return 'text-yellow-600 bg-yellow-100';
      case 'failed':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'text-red-600 bg-red-100';
      case 'medium':
        return 'text-yellow-600 bg-yellow-100';
      case 'low':
        return 'text-green-600 bg-green-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const filteredReports = systemReports.filter(report =>
    activeTab === "operational" || report.type === activeTab
  );

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
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Agriculture System Reports</h1>
          <p className="text-gray-600 mt-1">Comprehensive monitoring and analytics for agricultural operations</p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={fetchAirtableStats}
            disabled={loadingAirtable}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Database className={`h-4 w-4 ${loadingAirtable ? 'animate-pulse' : ''}`} />
            Load Airtable Data
          </Button>
          <Button
            onClick={exportToCSV}
            disabled={loading || !documents.length}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
          <Button
            onClick={() => {
              fetchDocuments();
              fetchSystemReports();
            }}
            disabled={loading}
            variant="outline"
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh All
          </Button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
        <Button
          variant={activeTab === "operational" ? "default" : "ghost"}
          onClick={() => setActiveTab("operational")}
          className="flex items-center gap-2"
        >
          <Database className="h-4 w-4" />
          Operational Reports
        </Button>
        <Button
          variant={activeTab === "equipment" ? "default" : "ghost"}
          onClick={() => setActiveTab("equipment")}
          className="flex items-center gap-2"
        >
          <Truck className="h-4 w-4" />
          Equipment Reports
        </Button>
        <Button
          variant={activeTab === "troubleshooting" ? "default" : "ghost"}
          onClick={() => setActiveTab("troubleshooting")}
          className="flex items-center gap-2"
        >
          <AlertTriangle className="h-4 w-4" />
          Troubleshooting
        </Button>
      </div>

      {/* Detailed Reports View */}
      {(activeTab !== "overview") && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {activeTab === "operational" && <Settings className="h-5 w-5" />}
              {activeTab === "equipment" && <Truck className="h-5 w-5" />}
              {activeTab === "troubleshooting" && <Wrench className="h-5 w-5" />}
              {activeTab === "operational" && "Operational Reports"}
              {activeTab === "equipment" && "Equipment & Machinery Reports"}
              {activeTab === "troubleshooting" && "Troubleshooting & Issue Reports"}
            </CardTitle>
            <CardDescription>
              {activeTab === "operational" && "System operational status and maintenance reports"}
              {activeTab === "equipment" && "Equipment maintenance and performance reports"}
              {activeTab === "troubleshooting" && "System troubleshooting and issue resolution reports"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filteredReports.length === 0 ? (
              <div className="text-center py-8">
                {activeTab === "operational" && <Settings className="mx-auto h-12 w-12 text-gray-400 mb-4" />}
                {activeTab === "equipment" && <Truck className="mx-auto h-12 w-12 text-gray-400 mb-4" />}
                {activeTab === "troubleshooting" && <Wrench className="mx-auto h-12 w-12 text-gray-400 mb-4" />}
                <h3 className="text-lg font-medium text-gray-900 mb-2">No reports found</h3>
                <p className="text-gray-500">No {activeTab} reports available at this time.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredReports.map((report) => (
                  <div key={report.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <div>
                        <h3 className="font-medium text-gray-900">{report.title}</h3>
                        <p className="text-sm text-gray-500 mt-1">{report.description}</p>
                        <div className="flex items-center gap-4 mt-2">
                          {report.category && (
                            <Badge variant="outline" className="text-xs">
                              <Tag className="h-3 w-3 mr-1" />
                              {report.category}
                            </Badge>
                          )}
                          {report.assigned_to && (
                            <Badge variant="outline" className="text-xs">
                              <Users className="h-3 w-3 mr-1" />
                              {report.assigned_to}
                            </Badge>
                          )}
                          <span className="text-xs text-gray-500">
                            {new Date(report.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={`text-xs ${getStatusColor(report.status)}`}>
                        {report.status}
                      </Badge>
                      <Badge className={`text-xs ${getPriorityColor(report.priority)}`}>
                        {report.priority} priority
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

    </div>
  );
}