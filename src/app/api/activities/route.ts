import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Activity, ActivityWithStats, CreateActivityRequest, UpdateActivityRequest } from "@/types/activity";

// Create admin client with service role key
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

// Helper function to check if user is admin
async function isAdmin(token: string): Promise<{ isAdmin: boolean; user?: any }> {
  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

  if (error || !user) {
    return { isAdmin: false };
  }

  // Check if user is in admin email list
  const adminEmails = [
    'admin@example.com',
    'admin@agriculture-dashboard.com',
    'pranc14@gmail.com',
    process.env.ADMIN_EMAIL,
  ].filter(Boolean);

  const isAdmin = adminEmails.includes(user.email || '');

  return { isAdmin, user };
}

// GET - List all activities (public - no auth required)
export async function GET(request: NextRequest) {
  try {
    // Public endpoint - no authentication needed for reading activities
    const { data: activities, error } = await supabaseAdmin
      .from('activities')
      .select('*')
      .eq('is_active', true)
      .order('name', { ascending: true });

    if (error) {
      console.error("Error fetching activities:", error);
      return NextResponse.json({ error: "Failed to fetch activities" }, { status: 500 });
    }

    return NextResponse.json({ activities });
  } catch (error) {
    console.error("Error in GET /api/activities:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST - Create new activity (admin only)
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.replace("Bearer ", "");
    const { isAdmin: isUserAdmin, user } = await isAdmin(token);

    if (!isUserAdmin || !user) {
      return NextResponse.json({ error: "Forbidden - Admin access required" }, { status: 403 });
    }

    const body: CreateActivityRequest = await request.json();
    const { name, emoji, description, slug } = body;

    if (!name || !slug) {
      return NextResponse.json({ error: "Name and slug are required" }, { status: 400 });
    }

    // Check if slug is unique
    const { data: existingActivity } = await supabaseAdmin
      .from('activities')
      .select('id')
      .eq('slug', slug)
      .single();

    if (existingActivity) {
      return NextResponse.json({ error: "Activity with this slug already exists" }, { status: 400 });
    }

    // Create activity
    const { data: activity, error } = await supabaseAdmin
      .from('activities')
      .insert({
        name,
        emoji,
        description,
        slug,
        created_by: user.id
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating activity:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      activity
    }, { status: 201 });
  } catch (error) {
    console.error("Error in POST /api/activities:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PATCH - Update activity (admin only)
export async function PATCH(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.replace("Bearer ", "");
    const { isAdmin: isUserAdmin, user } = await isAdmin(token);

    if (!isUserAdmin || !user) {
      return NextResponse.json({ error: "Forbidden - Admin access required" }, { status: 403 });
    }

    const body: UpdateActivityRequest & { id: string } = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json({ error: "Activity ID is required" }, { status: 400 });
    }

    // Check if activity exists
    const { data: existingActivity } = await supabaseAdmin
      .from('activities')
      .select('id')
      .eq('id', id)
      .single();

    if (!existingActivity) {
      return NextResponse.json({ error: "Activity not found" }, { status: 404 });
    }

    // Update activity
    const { data: updatedActivity, error } = await supabaseAdmin
      .from('activities')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error("Error updating activity:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      activity: updatedActivity
    });
  } catch (error) {
    console.error("Error in PATCH /api/activities:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE - Delete activity (admin only)
export async function DELETE(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.replace("Bearer ", "");
    const { isAdmin: isUserAdmin, user } = await isAdmin(token);

    if (!isUserAdmin || !user) {
      return NextResponse.json({ error: "Forbidden - Admin access required" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const activityId = searchParams.get("id");

    if (!activityId) {
      return NextResponse.json({ error: "Activity ID is required" }, { status: 400 });
    }

    // Check if activity exists
    const { data: existingActivity } = await supabaseAdmin
      .from('activities')
      .select('id')
      .eq('id', activityId)
      .single();

    if (!existingActivity) {
      return NextResponse.json({ error: "Activity not found" }, { status: 404 });
    }

    // Soft delete by setting is_active to false
    const { error } = await supabaseAdmin
      .from('activities')
      .update({ is_active: false })
      .eq('id', activityId);

    if (error) {
      console.error("Error deleting activity:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in DELETE /api/activities:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
