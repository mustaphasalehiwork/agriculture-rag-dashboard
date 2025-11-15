"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DocumentTable } from "@/components/document-table";
import { UploadModal } from "@/components/upload-modal";
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

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);

  const fetchDocuments = async () => {
    try {
      const response = await fetch("/api/documents");
      if (response.ok) {
        const data = await response.json();
        setDocuments(data);
      }
    } catch {
      toast.error("Failed to load documents");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  // Auto-refresh every 5 seconds if there are processing documents
  useEffect(() => {
    const hasProcessing = documents.some((doc) => doc.status === "processing");

    if (hasProcessing) {
      const interval = setInterval(() => {
        fetchDocuments();
      }, 5000);

      return () => clearInterval(interval);
    }
  }, [documents]);

  const handleUploadSuccess = () => {
    fetchDocuments();
    setUploadModalOpen(false);
  };

  const handleDelete = (id: string, filename: string) => {
    setDocuments(documents.filter((doc) => doc.id !== id));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Documents</h1>
          <p className="text-gray-600 mt-1">Manage PDF documents and uploads</p>
        </div>
        <Button onClick={() => setUploadModalOpen(true)}>
          Upload Document
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">Total Documents</p>
                <p className="text-2xl font-bold text-gray-900">{documents.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-green-600">
                  {documents.filter((doc) => doc.status === "completed").length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">Processing</p>
                <p className="text-2xl font-bold text-blue-600">
                  {documents.filter((doc) => doc.status === "processing").length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">Failed</p>
                <p className="text-2xl font-bold text-red-600">
                  {documents.filter((doc) => doc.status === "failed").length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <DocumentTable
        documents={documents}
        onRefresh={fetchDocuments}
        onDelete={handleDelete}
      />

      <UploadModal
        open={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        onSuccess={handleUploadSuccess}
      />
    </div>
  );
}