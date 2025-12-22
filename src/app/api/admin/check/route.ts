import { NextRequest, NextResponse } from "next/server";
import { getSupabaseClient } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseClient();

    // Get current user
    const authHeader = request.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    // List all users to check if this is the first user
    const { data: { users }, error } = await supabase.auth.admin.listUsers();

    if (error) {
      console.error("Error listing users:", error);
      return NextResponse.json({ error: "Failed to check users" }, { status: 500 });
    }

    // If this is the first user in the system, automatically grant admin access
    if (users.length === 1 && users[0].id === user.id) {
      return NextResponse.json({
        isAdmin: true,
        isFirstUser: true,
        message: "First user automatically has admin access"
      });
    }

    // Check admin emails
    const adminEmails = [
      'admin@example.com',
      'admin@agriculture-dashboard.com',
      process.env.ADMIN_EMAIL
    ].filter(Boolean);

    const isAdmin = adminEmails.includes(user.email || '');

    return NextResponse.json({
      isAdmin,
      isFirstUser: false,
      email: user.email
    });
  } catch (error) {
    console.error("Error in POST /api/admin/check:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}