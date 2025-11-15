import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        { error: "No active session" },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      session,
    });
  } catch (error) {
    console.error("Session check error:", error);
    return NextResponse.json(
      { error: "An error occurred while checking session" },
      { status: 500 }
    );
  }
}