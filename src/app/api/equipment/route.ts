import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { EquipmentWithDetails, CreateEquipmentRequest, UpdateEquipmentRequest } from "@/types/equipment";

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
  try {
    // Use admin client (service role) to verify token - this doesn't require external connection
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

    if (error || !user) {
      console.log("DEBUG isAdmin - Error or no user:", error?.message);
      return { isAdmin: false };
    }

    // Check if user is in admin email list
    const adminEmails = [
      'admin@example.com',
      'admin@agriculture-dashboard.com',
      'pranc14@gmail.com',
      process.env.ADMIN_EMAIL,
    ].filter(Boolean);

    // Get all users to check if this is the first user
    const { data: { users: allUsers } } = await supabaseAdmin.auth.admin.listUsers();
    const isFirstUser = allUsers.length === 1 && allUsers[0].id === user.id;

    const isAdmin = isFirstUser || adminEmails.includes(user.email || '');

    console.log("DEBUG isAdmin - User:", user.email, "Is admin:", isAdmin);
    return { isAdmin, user };
  } catch (error) {
    console.error("Error in isAdmin:", error);
    return { isAdmin: false };
  }
}

// GET - List all equipment (filtered by user's company access)
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user } } = await supabaseAdmin.auth.getUser(token);

    if (!user) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    // Get user's companies
    const { data: userCompanies } = await supabaseAdmin
      .from('user_companies')
      .select('company_id')
      .eq('user_id', user.id);

    const userCompanyIds = userCompanies?.map(uc => uc.company_id) || [];

    // Get equipment with details
    const { data: equipment, error } = await supabaseAdmin
      .from('equipment')
      .select(`
        *,
        category:categories(id, name, emoji),
        activity:activities(id, name, emoji),
        company:companies(id, name),
        farm:farms(id, name)
      `)
      .in('company_id', userCompanyIds)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.error("Error fetching equipment:", error);
      return NextResponse.json({ error: "Failed to fetch equipment" }, { status: 500 });
    }

    // Transform data
    const equipmentWithDetails: EquipmentWithDetails[] = equipment.map((eq: any) => ({
      ...eq,
      category_name: eq.category?.name,
      category_emoji: eq.category?.emoji,
      activity_name: eq.activity?.name,
      activity_emoji: eq.activity?.emoji,
      company_name: eq.company?.name,
      farm_name: eq.farm?.name
    }));

    return NextResponse.json({ equipment: equipmentWithDetails });
  } catch (error) {
    console.error("Error in GET /api/equipment:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST - Create new equipment
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    console.log("DEBUG POST /api/equipment - authHeader:", authHeader ? "Present" : "Missing");

    if (!authHeader) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.replace("Bearer ", "");
    console.log("DEBUG POST /api/equipment - token length:", token?.length);

    const { isAdmin: isUserAdmin, user } = await isAdmin(token);

    console.log("DEBUG POST /api/equipment - user:", user?.email, "isAdmin:", isUserAdmin);

    if (!user) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const body: CreateEquipmentRequest = await request.json();
    const { name, brand, model, year, plate_number, category_id, activity_id, company_id, farm_id, specifications, purchase_date, status, notes } = body;

    if (!name || !company_id) {
      return NextResponse.json({ error: "Name and company_id are required" }, { status: 400 });
    }

    // Admin users can create equipment for any company
    // Other users need proper role in the company
    if (!isUserAdmin) {
      const { data: userCompany } = await supabaseAdmin
        .from('user_companies')
        .select('role')
        .eq('user_id', user.id)
        .eq('company_id', company_id)
        .single();

      const hasPermission = userCompany && ['Supervisor / Director', 'Coordinator'].includes(userCompany.role);

      if (!hasPermission) {
        return NextResponse.json({ error: "You don't have permission to create equipment for this company" }, { status: 403 });
      }
    }

    // If farm_id is provided, verify it belongs to the company
    if (farm_id) {
      const { data: farm } = await supabaseAdmin
        .from('farms')
        .select('company_id')
        .eq('id', farm_id)
        .single();

      if (!farm || farm.company_id !== company_id) {
        return NextResponse.json({ error: "Farm does not belong to this company" }, { status: 400 });
      }
    }

    // Create equipment
    const { data: equipment, error } = await supabaseAdmin
      .from('equipment')
      .insert({
        name,
        brand,
        model,
        year,
        plate_number,
        category_id,
        activity_id,
        company_id,
        farm_id,
        specifications: specifications || {},
        purchase_date,
        status: status || 'active',
        notes,
        created_by: user.id
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating equipment:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      equipment
    }, { status: 201 });
  } catch (error) {
    console.error("Error in POST /api/equipment:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PATCH - Update equipment
export async function PATCH(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.replace("Bearer ", "");
    const { isAdmin: isUserAdmin, user } = await isAdmin(token);

    if (!user) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const body: UpdateEquipmentRequest & { id: string; company_id?: string; farm_id?: string } = await request.json();
    const { id, company_id, farm_id, ...updateData } = body;

    if (!id) {
      return NextResponse.json({ error: "Equipment ID is required" }, { status: 400 });
    }

    // Check if equipment exists and get company_id
    const { data: existingEquipment } = await supabaseAdmin
      .from('equipment')
      .select('company_id, farm_id, created_by')
      .eq('id', id)
      .single();

    if (!existingEquipment) {
      return NextResponse.json({ error: "Equipment not found" }, { status: 404 });
    }

    // Admin users can update any equipment
    // Other users need proper permissions
    if (!isUserAdmin) {
      const { data: userCompany } = await supabaseAdmin
        .from('user_companies')
        .select('role')
        .eq('user_id', user.id)
        .eq('company_id', existingEquipment.company_id)
        .single();

      const hasPermission = userCompany &&
        (userCompany.role === 'Supervisor / Director' ||
         (userCompany.role === 'Coordinator' && existingEquipment.created_by === user.id));

      if (!hasPermission) {
        return NextResponse.json({ error: "You don't have permission to update this equipment" }, { status: 403 });
      }
    }

    // If updating farm_id, verify it belongs to the same company
    if (updateData.farm_id) {
      const { data: farm } = await supabaseAdmin
        .from('farms')
        .select('company_id')
        .eq('id', updateData.farm_id)
        .single();

      if (!farm || farm.company_id !== existingEquipment.company_id) {
        return NextResponse.json({ error: "Farm does not belong to the same company" }, { status: 400 });
      }
    }

    // Update equipment
    const { data: updatedEquipment, error } = await supabaseAdmin
      .from('equipment')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error("Error updating equipment:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      equipment: updatedEquipment
    });
  } catch (error) {
    console.error("Error in PATCH /api/equipment:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE - Delete equipment
export async function DELETE(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.replace("Bearer ", "");
    const { isAdmin: isUserAdmin, user } = await isAdmin(token);

    if (!user) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const equipmentId = searchParams.get("id");

    if (!equipmentId) {
      return NextResponse.json({ error: "Equipment ID is required" }, { status: 400 });
    }

    // Check if equipment exists
    const { data: equipment } = await supabaseAdmin
      .from('equipment')
      .select('company_id')
      .eq('id', equipmentId)
      .single();

    if (!equipment) {
      return NextResponse.json({ error: "Equipment not found" }, { status: 404 });
    }

    // Admin users can delete any equipment
    // Other users must be Directors
    if (!isUserAdmin) {
      const { data: userCompany } = await supabaseAdmin
        .from('user_companies')
        .select('role')
        .eq('user_id', user.id)
        .eq('company_id', equipment.company_id)
        .single();

      if (!userCompany || userCompany.role !== 'Supervisor / Director') {
        return NextResponse.json({ error: "Only Directors can delete equipment" }, { status: 403 });
      }
    }

    // Soft delete
    const { error } = await supabaseAdmin
      .from('equipment')
      .update({ is_active: false })
      .eq('id', equipmentId);

    if (error) {
      console.error("Error deleting equipment:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in DELETE /api/equipment:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
