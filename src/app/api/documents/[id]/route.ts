import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { unlink } from "fs/promises";
import path from "path";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth();
    const { id: documentId } = await params;

    // First get the document to find the file path
    const { data: document, error: fetchError } = await supabase
      .from("ingestion_jobs")
      .select("file_path")
      .eq("id", documentId)
      .single();

    if (fetchError) {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 }
      );
    }

    // Delete from database
    const { error: deleteError } = await supabase
      .from("ingestion_jobs")
      .delete()
      .eq("id", documentId);

    if (deleteError) {
      console.error("Failed to delete document from database:", deleteError);
      return NextResponse.json(
        { error: "Failed to delete document" },
        { status: 500 }
      );
    }

    // Delete file from filesystem
    if (document.file_path) {
      try {
        await unlink(document.file_path);
      } catch (fileError) {
        console.error("Failed to delete file:", fileError);
        // Don't fail the operation if file deletion fails
      }
    }

    // Trigger n8n webhook for deletion (if configured)
    const n8nWebhookUrl = (process.env.N8N_WEBHOOK_URL || '') + (process.env.N8N_DELETE_WEBHOOK || '');

    if (n8nWebhookUrl) {
      fetch(n8nWebhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          document_id: documentId,
        }),
      }).catch((webhookError) => {
        console.error("Failed to trigger n8n delete webhook:", webhookError);
      });
    }

    return NextResponse.json({
      success: true,
      message: "Document deleted successfully",
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    console.error("Document deletion error:", error);
    return NextResponse.json(
      { error: "An error occurred while deleting the document" },
      { status: 500 }
    );
  }
}