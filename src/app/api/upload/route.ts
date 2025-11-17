import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { writeFile, mkdir } from "fs/promises";
import { existsSync } from "fs";
import path from "path";
import { randomUUID } from "crypto";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

const ERROR_MESSAGES = {
  file_too_large: "This PDF exceeds the 10MB limit. Please compress it and try again.",
  invalid_pdf: "This file could not be processed. Please ensure it's a valid PDF.",
  storage_full: "Storage limit reached. Please delete some documents and try again.",
  unknown: "Something went wrong. Please try again or contact support.",
};

export async function POST(request: NextRequest) {
  try {
    await requireAuth();

    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    // Validate file type
    if (file.type !== "application/pdf") {
      return NextResponse.json(
        { error: ERROR_MESSAGES.invalid_pdf },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: ERROR_MESSAGES.file_too_large },
        { status: 400 }
      );
    }

    // Generate UUID for filename
    const fileId = randomUUID();
    const fileExtension = ".pdf";
    const filename = `${fileId}${fileExtension}`;

    // Get upload directory from env or use default
    const uploadDir = process.env.UPLOAD_DIR || "./uploads";

    // Ensure upload directory exists
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    const filePath = path.join(uploadDir, filename);

    // Save file to filesystem
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    // Create job record in Supabase
    const { error: jobError } = await supabase()
      .from("ingestion_jobs")
      .insert({
        id: fileId,
        filename: filename,
        original_filename: file.name,
        file_path: filePath,
        file_size_bytes: file.size,
        status: "processing",
        chunks_processed: 0,
      })
      .select()
      .single();

    if (jobError) {
      console.error("Failed to create job record:", jobError);
      return NextResponse.json(
        { error: "Failed to create job record" },
        { status: 500 }
      );
    }

    // Trigger n8n webhook asynchronously (don't wait for it)
    const n8nWebhookUrl = (process.env.N8N_WEBHOOK_URL || '') + (process.env.N8N_UPLOAD_WEBHOOK || '');

    if (n8nWebhookUrl) {
      fetch(n8nWebhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          job_id: fileId,
          original_filename: file.name,
          file_size_bytes: file.size,
        }),
      }).catch((webhookError) => {
        console.error("Failed to trigger n8n webhook:", webhookError);
        // Don't fail the upload if webhook fails - the job is created and can be retried
      });
    } else {
      // Simulate processing for demo purposes
      setTimeout(async () => {
        try {
          await supabase()
            .from("ingestion_jobs")
            .update({
              status: "completed",
              total_chunks: Math.floor(Math.random() * 50) + 10,
              chunks_processed: Math.floor(Math.random() * 50) + 10,
              completed_at: new Date().toISOString(),
            })
            .eq("id", fileId);
        } catch (error) {
          console.error("Failed to update job status:", error);
        }
      }, 3000);
    }

    // Return immediately so frontend can start listening for updates
    return NextResponse.json({
      success: true,
      job_id: fileId,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    console.error("Upload error:", error);
    return NextResponse.json(
      { error: ERROR_MESSAGES.unknown },
      { status: 500 }
    );
  }
}