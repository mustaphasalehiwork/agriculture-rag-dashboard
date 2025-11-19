import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// This endpoint is called by n8n to update job progress
// No auth required as it's called by n8n workflow
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    console.log('[Job Update] Received update for job:', id);
    console.log('[Job Update] Update data:', JSON.stringify(body, null, 2));

    // Get current job state for comparison
    const { data: currentJob } = await supabase()
      .from("ingestion_jobs")
      .select("chunks_processed, total_chunks")
      .eq("id", id)
      .single();

    if (currentJob) {
      console.log('[Job Update] Current state:', {
        chunks_processed: currentJob.chunks_processed,
        total_chunks: currentJob.total_chunks
      });
    }

    // Prepare update data
    const updateData = {
      ...body,
      updated_at: new Date().toISOString(),
    };

    // If job is being marked as completed, ensure chunks_processed equals total_chunks
    if (body.status === 'completed' && currentJob) {
      const finalTotalChunks = body.total_chunks || currentJob.total_chunks;
      if (finalTotalChunks && !body.chunks_processed) {
        updateData.chunks_processed = finalTotalChunks;
        console.log('[Job Update] Auto-setting chunks_processed to total_chunks:', finalTotalChunks);
      }
    }

    // Update job in database
    const { error } = await supabase()
      .from("ingestion_jobs")
      .update(updateData)
      .eq("id", id);

    if (error) {
      console.error("[Job Update] Failed to update job:", error);
      return NextResponse.json(
        { error: "Failed to update job" },
        { status: 500 }
      );
    }

    console.log('[Job Update] Successfully updated job');
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Job Update] Job update error:", error);
    return NextResponse.json(
      { error: "Failed to update job" },
      { status: 500 }
    );
  }
}