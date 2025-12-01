import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { getAllTablesStats, getRecordsFromTable } from "@/lib/airtable";

export async function GET(request: NextRequest) {
  try {
    await requireAuth();

    // Get stats query parameter
    const { searchParams } = new URL(request.url);
    const table = searchParams.get('table');

    if (table) {
      // Return records for specific table
      const records = await getRecordsFromTable(table);
      return NextResponse.json(records);
    } else {
      // Return stats for all tables
      const stats = await getAllTablesStats();
      return NextResponse.json(stats);
    }
  } catch (error) {
    console.error("Airtable API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch Airtable data", message: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAuth();

    const body = await request.json();
    const { table, record } = body;

    if (!table || !record) {
      return NextResponse.json(
        { error: "Table and record data are required" },
        { status: 400 }
      );
    }

    // This is a placeholder - implement record creation if needed
    return NextResponse.json(
      { error: "Record creation not implemented yet" },
      { status: 501 }
    );
  } catch (error) {
    console.error("Airtable POST error:", error);
    return NextResponse.json(
      { error: "Failed to create Airtable record" },
      { status: 500 }
    );
  }
}