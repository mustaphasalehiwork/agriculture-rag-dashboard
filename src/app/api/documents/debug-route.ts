import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  console.log("API /api/documents called");

  try {
    // Check session manually for debugging
    const session = await getSession();
    console.log("Session found:", session);

    if (!session || !session.isAuthenticated) {
      console.log("No valid session found");
      return NextResponse.json(
        { error: "Unauthorized - No valid session" },
        { status: 401 }
      );
    }

    console.log("User authenticated:", session.username);
    console.log("Supabase URL:", process.env.NEXT_PUBLIC_SUPABASE_URL);

    const { data: documents, error } = await supabase()
      .from("ingestion_jobs")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json(
        { error: "Failed to fetch documents", details: error.message },
        { status: 500 }
      );
    }

    console.log("Documents found:", documents?.length || 0);
    return NextResponse.json(documents || []);

  } catch (error) {
    console.error("Documents API error:", error);
    return NextResponse.json(
      { error: "An error occurred while fetching documents" },
      { status: 500 }
    );
  }
}