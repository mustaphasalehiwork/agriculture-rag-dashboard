import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { readFile } from "fs/promises";
import { existsSync } from "fs";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Validate internal API key
    const apiKey = request.headers.get("x-api-key");
    const expectedApiKey = process.env.INTERNAL_API_KEY;

    if (!apiKey || apiKey !== expectedApiKey) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;

    // Get document details from database
    const { data: job, error: fetchError } = await supabase()
      .from("ingestion_jobs")
      .select("*")
      .eq("id", id)
      .single();

    if (fetchError || !job) {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 }
      );
    }

    // Check if file exists
    if (!existsSync(job.file_path)) {
      return NextResponse.json(
        { error: "File not found on server" },
        { status: 404 }
      );
    }

    // Read file
    const fileBuffer = await readFile(job.file_path);

    // Return file as binary
    return new NextResponse(fileBuffer as unknown as BodyInit, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Length": fileBuffer.length.toString(),
      },
    });
  } catch (error) {
    console.error("File access error:", error);
    return NextResponse.json(
      { error: "Failed to access file" },
      { status: 500 }
    );
  }
}