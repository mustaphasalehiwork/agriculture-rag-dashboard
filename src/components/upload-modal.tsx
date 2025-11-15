"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

interface UploadModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface ProgressData {
  status: "processing" | "completed" | "failed";
  current_step: string;
  total_chunks: number;
  chunks_processed: number;
  progress_percent: number;
  error_message?: string;
}

export function UploadModal({ open, onClose, onSuccess }: UploadModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState<ProgressData | null>(null);
  const [error, setError] = useState("");

  const resetState = () => {
    setFile(null);
    setUploading(false);
    setProgress(null);
    setError("");
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    // Validate file type
    if (selectedFile.type !== "application/pdf") {
      setError("This file could not be processed. Please ensure it's a valid PDF.");
      return;
    }

    // Validate file size (10MB = 10 * 1024 * 1024 bytes)
    if (selectedFile.size > 10 * 1024 * 1024) {
      setError("This PDF exceeds the 10MB limit. Please compress it and try again.");
      return;
    }

    setError("");
    setFile(selectedFile);
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || "Upload failed");
        setUploading(false);
        return;
      }

      const { job_id } = await response.json();

      // Start SSE connection for progress updates
      const eventSource = new EventSource(`/api/sse/${job_id}`);

      console.log('SSE connection opened for job:', job_id);

      eventSource.onopen = () => {
        console.log('SSE connection established');
      };

      eventSource.onmessage = (event) => {
        console.log('SSE message received:', event.data);
        const data: ProgressData = JSON.parse(event.data);
        setProgress(data);

        if (data.status === "completed") {
          console.log('Upload completed');
          eventSource.close();
          toast.success("Document uploaded successfully");
          resetState();
          onSuccess();
        } else if (data.status === "failed") {
          console.log('Upload failed:', data.error_message);
          eventSource.close();
          setError(data.error_message || "Upload failed");
          setUploading(false);
        }
      };

      eventSource.onerror = (error) => {
        console.error('SSE error:', error);
        eventSource.close();
        setError("Connection lost. Please refresh and check your documents.");
        setUploading(false);
      };
    } catch {
      setError("An error occurred. Please try again.");
      setUploading(false);
    }
  };

  const handleClose = () => {
    if (!uploading) {
      resetState();
      onClose();
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Upload Document</CardTitle>
          <CardDescription>
            Upload a PDF document to add it to your knowledge base.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {!uploading ? (
              <>
                <div>
                  <Input
                    type="file"
                    accept="application/pdf"
                    onChange={handleFileChange}
                    disabled={uploading}
                  />
                  {file && (
                    <p className="text-sm text-gray-500 mt-2">
                      Selected: {file.name} ({(file.size / (1024 * 1024)).toFixed(2)} MB)
                    </p>
                  )}
                </div>

                {error && <p className="text-sm text-red-600">{error}</p>}

                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={handleClose}>
                    Cancel
                  </Button>
                  <Button onClick={handleUpload} disabled={!file || uploading}>
                    Upload
                  </Button>
                </div>
              </>
            ) : (
              <>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium">
                      {progress?.current_step || "Starting upload..."}
                    </p>
                    {progress?.status === "processing" && (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                    )}
                  </div>
                  {progress && progress.total_chunks > 0 && (
                    <p className="text-sm text-gray-500">
                      {progress.chunks_processed} of {progress.total_chunks} chunks processed
                    </p>
                  )}
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${progress?.progress_percent || 0}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-gray-500 text-center">
                    {progress?.progress_percent || 0}% complete
                  </p>
                </div>

                {error && (
                  <div className="space-y-2">
                    <p className="text-sm text-red-600">{error}</p>
                    <Button variant="outline" onClick={handleClose}>
                      Close
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}