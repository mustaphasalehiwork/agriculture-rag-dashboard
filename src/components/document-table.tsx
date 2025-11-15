"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, Trash2, Eye } from "lucide-react";
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
  error_message?: string | null;
}

interface DocumentTableProps {
  documents: Document[];
  onRefresh: () => void;
  onDelete: (id: string, filename: string) => void;
}

export function DocumentTable({ documents, onRefresh, onDelete }: DocumentTableProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const formatFileSize = (bytes: number) => {
    const sizes = ["Bytes", "KB", "MB", "GB"];
    if (bytes === 0) return "0 Bytes";
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + " " + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "processing":
        return (
          <Badge variant="secondary" className="bg-blue-100 text-blue-800">
            <div className="w-2 h-2 bg-blue-600 rounded-full mr-2 animate-pulse"></div>
            Processing
          </Badge>
        );
      case "completed":
        return (
          <Badge variant="secondary" className="bg-green-100 text-green-800">
            <div className="w-2 h-2 bg-green-600 rounded-full mr-2"></div>
            Completed
          </Badge>
        );
      case "failed":
        return (
          <Badge variant="secondary" className="bg-red-100 text-red-800">
            <div className="w-2 h-2 bg-red-600 rounded-full mr-2"></div>
            Failed
          </Badge>
        );
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getProgressPercentage = (document: Document) => {
    if (!document.total_chunks || document.total_chunks === 0) return 0;
    return Math.round((document.chunks_processed || 0) / document.total_chunks * 100);
  };

  const handleDelete = async (id: string, filename: string) => {
    if (!confirm(`Are you sure you want to delete "${filename}"?`)) {
      return;
    }

    setDeletingId(id);

    try {
      const response = await fetch(`/api/documents/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success("Document deleted successfully");
        onDelete(id, filename);
      } else {
        const data = await response.json();
        toast.error(data.error || "Failed to delete document");
      }
    } catch {
      toast.error("Failed to delete document");
    } finally {
      setDeletingId(null);
    }
  };

  if (documents.length === 0) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-center">
            <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No documents yet</h3>
            <p className="text-gray-500">Upload your first PDF document to get started.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Documents ({documents.length})</CardTitle>
          <Button variant="outline" onClick={onRefresh}>
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-4 font-medium text-gray-700">File Name</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Size</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Status</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Progress</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Uploaded</th>
                <th className="text-right py-3 px-4 font-medium text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {documents.map((document) => (
                <tr key={document.id} className="border-b hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-gray-400" />
                      <div>
                        <p className="font-medium text-gray-900 truncate max-w-xs">
                          {document.original_filename}
                        </p>
                        <p className="text-xs text-gray-500">
                          {document.filename}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-600">
                    {formatFileSize(document.file_size_bytes)}
                  </td>
                  <td className="py-3 px-4">
                    {getStatusBadge(document.status)}
                    {document.error_message && (
                      <p className="text-xs text-red-600 mt-1">
                        {document.error_message}
                      </p>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <div className="w-32">
                      {document.status === "processing" && document.total_chunks ? (
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <div className="flex-1 bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${getProgressPercentage(document)}%` }}
                              ></div>
                            </div>
                            <span className="text-xs text-gray-500">
                              {getProgressPercentage(document)}%
                            </span>
                          </div>
                          <p className="text-xs text-gray-500">
                            {document.chunks_processed || 0} / {document.total_chunks} chunks
                          </p>
                        </div>
                      ) : document.status === "completed" ? (
                        <div className="text-sm text-green-600">
                          ✓ {document.total_chunks} chunks
                        </div>
                      ) : (
                        <span className="text-sm text-gray-500">—</span>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-600">
                    {formatDate(document.created_at)}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        title="View document"
                        disabled={document.status !== "completed"}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(document.id, document.original_filename)}
                        disabled={deletingId === document.id}
                        title="Delete document"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}