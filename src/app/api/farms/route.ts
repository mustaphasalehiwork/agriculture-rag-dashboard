import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Farm, FarmWithStats, CreateFarmRequest, UpdateFarmRequest } from "@/types/farm";

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
  // Use admin client (service role) to verify token - this doesn't require external connection
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

  // Get all users to check if this is the first user
  const { data: { users: allUsers } } = await supabaseAdmin.auth.admin.listUsers();
  const isFirstUser = allUsers.length === 1 && allUsers[0].id === user.id;

  const isAdmin = isFirstUser || adminEmails.includes(user.email || '');

  return { isAdmin, user };
}

// GET - List all farms
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    console.log("DEBUG GET /api/farms - authHeader:", authHeader ? "Present" : "Missing");

    if (!authHeader) {
      return NextResponse.json({ error: "Unauthorized - No auth header" }, { status: 401 });
    }

    const token = authHeader.replace("Bearer ", "");
    console.log("DEBUG GET /api/farms - token length:", token?.length);

    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
    console.log("DEBUG GET /api/farms - user:", user?.email, "error:", error?.message);

    if (!user) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    // Get farms that the user has access to through their companies
    const { data: farms, error: farmsError } = await supabaseAdmin
      .from('farms')
      .select(`
        *,
        company:companies(id, name)
      `)
      .order('created_at', { ascending: false });

    if (farmsError) {
      console.error("Error fetching farms:", farmsError);
      return NextResponse.json({ error: "Failed to fetch farms" }, { status: 500 });
    }

    // Filter farms by user's company access
    const { data: userCompanies } = await supabaseAdmin
      .from('user_companies')
      .select('company_id')
      .eq('user_id', user.id);

    const userCompanyIds = userCompanies?.map(uc => uc.company_id) || [];

    const filteredFarms = farms.filter((farm: any) =>
      userCompanyIds.includes(farm.company_id)
    );

    // For each farm, get creator info
    const farmsWithStats: FarmWithStats[] = await Promise.all(
      filteredFarms.map(async (farm: any) => {
        let createdByUser = null;
        if (farm.created_by) {
          const { data: creatorData } = await supabaseAdmin.auth.admin.getUserById(farm.created_by);
          if (creatorData?.user) {
            createdByUser = {
              email: creatorData.user.email,
              user_metadata: creatorData.user.user_metadata
            };
          }
        }

        return {
          ...farm,
          company_name: farm.company?.name,
          created_by_user: createdByUser
        } as FarmWithStats;
      })
    );

    return NextResponse.json({ farms: farmsWithStats });
  } catch (error) {
    console.error("Error in GET /api/farms:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST - Create new farm
export async function POST(request: NextRequest) {
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

    const body: CreateFarmRequest = await request.json();
    const { name, slug, company_id, location, area_hectares, coordinates, logo_url, settings } = body;

    if (!name || !slug || !company_id) {
      return NextResponse.json({ error: "Name, slug, and company_id are required" }, { status: 400 });
    }

    // Check permissions: admin users can always create farms, others need proper role
    if (!isUserAdmin) {
      // Verify user has access to this company with proper role
      const { data: userCompany, error: userCompanyError } = await supabaseAdmin
        .from('user_companies')
        .select('role')
        .eq('user_id', user.id)
        .eq('company_id', company_id)
        .single();

      console.log("DEBUG - Farm creation check:", {
        userId: user.id,
        companyId: company_id,
        userCompany,
        userCompanyError
      });

      if (!userCompany || !['Supervisor / Director', 'Coordinator'].includes(userCompany.role)) {
        return NextResponse.json({
          error: "You don't have permission to create farms for this company",
          debug: {
            userId: user.id,
            companyId: company_id,
            userCompany,
            hasRecord: !!userCompany,
            role: userCompany?.role
          }
        }, { status: 403 });
      }
    }

    // Check if slug is unique
    const { data: existingFarm } = await supabaseAdmin
      .from('farms')
      .select('id')
      .eq('slug', slug)
      .single();

    if (existingFarm) {
      return NextResponse.json({ error: "Farm with this slug already exists" }, { status: 400 });
    }

    // Create farm
    const { data: farm, error } = await supabaseAdmin
      .from('farms')
      .insert({
        name,
        slug,
        company_id,
        location,
        area_hectares,
        coordinates,
        logo_url,
        settings: settings || {},
        created_by: user.id
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating farm:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      farm
    }, { status: 201 });
  } catch (error) {
    console.error("Error in POST /api/farms:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PATCH - Update farm
export async function PATCH(request: NextRequest) {
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

    const body: UpdateFarmRequest & { id: string } = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json({ error: "Farm ID is required" }, { status: 400 });
    }

    // Check if user has permission to update this farm
    const { data: farm } = await supabaseAdmin
      .from('farms')
      .select('company_id, created_by')
      .eq('id', id)
      .single();

    if (!farm) {
      return NextResponse.json({ error: "Farm not found" }, { status: 404 });
    }

    const { data: userCompany } = await supabaseAdmin
      .from('user_companies')
      .select('role')
      .eq('user_id', user.id)
      .eq('company_id', farm.company_id)
      .single();

    const hasPermission = userCompany &&
      (userCompany.role === 'Supervisor / Director' ||
       (userCompany.role === 'Coordinator' && farm.created_by === user.id));

    if (!hasPermission) {
      return NextResponse.json({ error: "You don't have permission to update this farm" }, { status: 403 });
    }

    // Update farm
    const { data: updatedFarm, error } = await supabaseAdmin
      .from('farms')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error("Error updating farm:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      farm: updatedFarm
    });
  } catch (error) {
    console.error("Error in PATCH /api/farms:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE - Delete farm
export async function DELETE(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const farmId = searchParams.get("id");

    if (!farmId) {
      return NextResponse.json({ error: "Farm ID is required" }, { status: 400 });
    }

    // Check if user has permission to delete this farm
    const { data: farm } = await supabaseAdmin
      .from('farms')
      .select('company_id')
      .eq('id', farmId)
      .single();

    if (!farm) {
      return NextResponse.json({ error: "Farm not found" }, { status: 404 });
    }

    const { data: userCompany } = await supabaseAdmin
      .from('user_companies')
      .select('role')
      .eq('user_id', user.id)
      .eq('company_id', farm.company_id)
      .single();

    if (!userCompany || userCompany.role !== 'Supervisor / Director') {
      return NextResponse.json({ error: "Only Directors can delete farms" }, { status: 403 });
    }

    // Delete farm
    const { error } = await supabaseAdmin
      .from('farms')
      .delete()
      .eq('id', farmId);

    if (error) {
      console.error("Error deleting farm:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in DELETE /api/farms:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
