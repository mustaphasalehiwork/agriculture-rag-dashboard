import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Company, CompanyWithStats, CreateCompanyRequest, UpdateCompanyRequest } from "@/types/company";

// Create admin client
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
    process.env.ADMIN_EMAIL,
  ].filter(Boolean);

  // Get all users to check if this is the first user
  const { data: { users: allUsers } } = await supabaseAdmin.auth.admin.listUsers();
  const isFirstUser = allUsers.length === 1 && allUsers[0].id === user.id;

  const isAdmin = isFirstUser || adminEmails.includes(user.email || '');

  return { isAdmin, user };
}

// GET - List all companies
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.replace("Bearer ", "");
    const { isAdmin: isUserAdmin, user } = await isAdmin(token);

    if (!isUserAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get companies that the user belongs to
    const { data: companies, error } = await supabaseAdmin
      .from('companies')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error("Error fetching companies:", error);
      return NextResponse.json({ error: "Failed to fetch companies" }, { status: 500 });
    }

    // For each company, get user count and role
    const companiesWithStats: CompanyWithStats[] = await Promise.all(
      companies.map(async (company: any) => {
        const { count } = await supabaseAdmin
          .from('user_companies')
          .select('*', { count: 'exact', head: true })
          .eq('company_id', company.id);

        // Get user's role for this company
        const { data: userCompany } = await supabaseAdmin
          .from('user_companies')
          .select('role')
          .eq('user_id', user.id)
          .eq('company_id', company.id)
          .single();

        // Get creator info if available
        let createdByUser = null;
        if (company.created_by) {
          const { data: creatorData } = await supabaseAdmin.auth.admin.getUserById(company.created_by);
          if (creatorData?.user) {
            createdByUser = {
              email: creatorData.user.email,
              user_metadata: creatorData.user.user_metadata
            };
          }
        }

        return {
          ...company,
          user_count: count || 0,
          user_role: userCompany?.role || 'member',
          created_by_user: createdByUser
        } as CompanyWithStats;
      })
    );

    return NextResponse.json({ companies: companiesWithStats });
  } catch (error) {
    console.error("Error in GET /api/companies:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST - Create new company
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.replace("Bearer ", "");
    const { isAdmin: isUserAdmin, user } = await isAdmin(token);

    if (!isUserAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body: CreateCompanyRequest = await request.json();
    const { name, slug, domain, logo_url, settings } = body;

    if (!name || !slug) {
      return NextResponse.json({ error: "Name and slug are required" }, { status: 400 });
    }

    // Check if slug is unique
    const { data: existingCompany } = await supabaseAdmin
      .from('companies')
      .select('id')
      .eq('slug', slug)
      .single();

    if (existingCompany) {
      return NextResponse.json({ error: "Company with this slug already exists" }, { status: 400 });
    }

    // Create company
    const { data: company, error } = await supabaseAdmin
      .from('companies')
      .insert({
        name,
        slug,
        domain,
        logo_url,
        settings: settings || {},
        created_by: user.id
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating company:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Add creator as admin of this company
    await supabaseAdmin
      .from('user_companies')
      .insert({
        user_id: user.id,
        company_id: company.id,
        role: 'admin',
        is_primary: false
      });

    return NextResponse.json({
      success: true,
      company
    }, { status: 201 });
  } catch (error) {
    console.error("Error in POST /api/companies:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PATCH - Update company
export async function PATCH(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.replace("Bearer ", "");
    const { isAdmin: isUserAdmin, user } = await isAdmin(token);

    if (!isUserAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body: UpdateCompanyRequest & { id: string } = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json({ error: "Company ID is required" }, { status: 400 });
    }

    // Update company
    const { data: company, error } = await supabaseAdmin
      .from('companies')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error("Error updating company:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      company
    });
  } catch (error) {
    console.error("Error in PATCH /api/companies:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE - Delete company
export async function DELETE(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.replace("Bearer ", "");
    const { isAdmin: isUserAdmin, user } = await isAdmin(token);

    if (!isUserAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get("id");

    if (!companyId) {
      return NextResponse.json({ error: "Company ID is required" }, { status: 400 });
    }

    // Check if user is creator of this company
    const { data: company } = await supabaseAdmin
      .from('companies')
      .select('created_by')
      .eq('id', companyId)
      .single();

    if (company?.created_by !== user.id) {
      return NextResponse.json({ error: "You can only delete companies you created" }, { status: 403 });
    }

    // Delete company (will cascade to user_companies)
    const { error } = await supabaseAdmin
      .from('companies')
      .delete()
      .eq('id', companyId);

    if (error) {
      console.error("Error deleting company:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in DELETE /api/companies:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
