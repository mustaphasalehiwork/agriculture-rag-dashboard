import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  const { jobId } = await params;

  // Set headers for SSE
  const headers = new Headers({
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    "Connection": "keep-alive",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Cache-Control",
  });

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      // Send initial status
      const checkStatus = async () => {
        try {
          const { data: job, error } = await supabase
            .from("ingestion_jobs")
            .select("*")
            .eq("id", jobId)
            .single();

          if (error) {
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({
                  status: "failed",
                  error_message: "Job not found",
                })}\n\n`
              )
            );
            controller.close();
            return;
          }

          const progressData = {
            status: job.status,
            current_step: job.current_step || "Processing document",
            total_chunks: job.total_chunks || 0,
            chunks_processed: job.chunks_processed || 0,
            progress_percent: job.total_chunks
              ? Math.round((job.chunks_processed / job.total_chunks) * 100)
              : 0,
            error_message: job.error_message,
          };

          // Send progress update
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(progressData)}\n\n`)
          );

          // If job is completed or failed, close the connection
          if (job.status === "completed" || job.status === "failed") {
            setTimeout(() => controller.close(), 1000);
            return;
          }

          // Continue checking status
          setTimeout(checkStatus, 2000);
        } catch (error) {
          console.error("Error checking job status:", error);
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                status: "failed",
                error_message: "Error checking job status",
              })}\n\n`
            )
          );
          controller.close();
        }
      };

      // Start checking status
      checkStatus();
    },
  });

  return new NextResponse(stream, { headers });
}