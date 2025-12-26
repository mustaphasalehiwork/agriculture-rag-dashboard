import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Create a Supabase client with service role key for admin operations
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

export async function GET(request: NextRequest) {
  try {
    // Get current user from request
    const authHeader = request.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    // Check if user is admin
    const { data: { users: allUsers } } = await supabaseAdmin.auth.admin.listUsers();

    // First user automatically has admin access
    const isFirstUser = allUsers.length === 1 && allUsers[0].id === user.id;

    const adminEmails = [
      'admin@example.com',
      'admin@agriculture-dashboard.com',
      process.env.ADMIN_EMAIL,
    ].filter(Boolean);

    const isAdmin = isFirstUser || adminEmails.includes(user.email || '');

    if (!isAdmin) {
      return NextResponse.json({ error: "Forbidden - Admin access required" }, { status: 403 });
    }

    // List all users using admin API
    const { data: { users }, error } = await supabaseAdmin.auth.admin.listUsers();

    if (error) {
      console.error("Error listing users:", error);
      return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
    }

    // Fetch company associations for all users
    const usersWithCompanies = await Promise.all(
      users.map(async (u: any) => {
        const { data: userCompany } = await supabaseAdmin
          .from('user_companies')
          .select('company_id, role')
          .eq('user_id', u.id)
          .maybeSingle();

        return {
          ...u,
          company_id: userCompany?.company_id || null,
          role: userCompany?.role || 'Operator'
        };
      })
    );

    return NextResponse.json({ users: usersWithCompanies });
  } catch (error) {
    console.error("Error in GET /api/admin/users:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get current user from request
    const authHeader = request.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    // Check if user is admin
    const { data: { users: allUsers } } = await supabaseAdmin.auth.admin.listUsers();

    // First user automatically has admin access
    const isFirstUser = allUsers.length === 1 && allUsers[0].id === user.id;

    const adminEmails = [
      'admin@example.com',
      'admin@agriculture-dashboard.com',
      process.env.ADMIN_EMAIL,
    ].filter(Boolean);

    const isAdmin = isFirstUser || adminEmails.includes(user.email || '');

    if (!isAdmin) {
      return NextResponse.json({ error: "Forbidden - Admin access required" }, { status: 403 });
    }

    const body = await request.json();
    const { email, password, name, company_id, role = 'Operator' } = body;

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
    }

    if (!company_id) {
      return NextResponse.json({ error: "Company ID is required" }, { status: 400 });
    }

    // Verify company exists
    const { data: company, error: companyError } = await supabaseAdmin
      .from('companies')
      .select('id')
      .eq('id', company_id)
      .single();

    if (companyError || !company) {
      return NextResponse.json({ error: "Invalid company" }, { status: 400 });
    }

    // Create new user using admin API
    const { data: newUser, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        name: name || email.split('@')[0],
        role: 'user'
      }
    });

    if (error) {
      console.error("Error creating user:", error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // Associate user with company
    if (newUser.user) {
      const { error: associationError } = await supabaseAdmin
        .from('user_companies')
        .insert({
          user_id: newUser.user.id,
          company_id: company_id,
          role: role,
          is_primary: true // User's primary company
        });

      if (associationError) {
        console.error("Error associating user with company:", associationError);
        // Note: User was created but association failed - you might want to handle this
      }
    }

    return NextResponse.json({
      success: true,
      user: newUser.user
    });
  } catch (error) {
    console.error("Error in POST /api/admin/users:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Get current user from request
    const authHeader = request.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    // Check if user is admin
    const { data: { users: allUsers } } = await supabaseAdmin.auth.admin.listUsers();

    // First user automatically has admin access
    const isFirstUser = allUsers.length === 1 && allUsers[0].id === user.id;

    const adminEmails = [
      'admin@example.com',
      'admin@agriculture-dashboard.com',
      process.env.ADMIN_EMAIL,
    ].filter(Boolean);

    const isAdmin = isFirstUser || adminEmails.includes(user.email || '');

    if (!isAdmin) {
      return NextResponse.json({ error: "Forbidden - Admin access required" }, { status: 403 });
    }

    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    // Prevent admin from deleting themselves
    if (userId === user.id) {
      return NextResponse.json({ error: "Cannot delete your own account" }, { status: 400 });
    }

    // Delete user using admin API
    const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);

    if (error) {
      console.error("Error deleting user:", error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in DELETE /api/admin/users:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PATCH - Update user
export async function PATCH(request: NextRequest) {
  try {
    // Get current user from request
    const authHeader = request.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    // Check if user is admin
    const { data: { users: allUsers } } = await supabaseAdmin.auth.admin.listUsers();

    // First user automatically has admin access
    const isFirstUser = allUsers.length === 1 && allUsers[0].id === user.id;

    const adminEmails = [
      'admin@example.com',
      'admin@agriculture-dashboard.com',
      process.env.ADMIN_EMAIL,
    ].filter(Boolean);

    const isAdmin = isFirstUser || adminEmails.includes(user.email || '');

    if (!isAdmin) {
      return NextResponse.json({ error: "Forbidden - Admin access required" }, { status: 403 });
    }

    const body = await request.json();
    const { userId, email, name, company_id, role } = body;

    console.log("PATCH /api/admin/users - Request body:", { userId, email, name, company_id, role });

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    // Update user metadata
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      userId,
      {
        email: email || undefined,
        user_metadata: {
          name: name || undefined,
          role: 'user'
        }
      }
    );

    if (updateError) {
      console.error("Error updating user:", updateError);
      return NextResponse.json({ error: updateError.message }, { status: 400 });
    }

    // Update company association if provided
    if (company_id && role) {
      // Verify company exists
      const { data: company, error: companyError } = await supabaseAdmin
        .from('companies')
        .select('id')
        .eq('id', company_id)
        .single();

      if (companyError || !company) {
        return NextResponse.json({ error: "Invalid company" }, { status: 400 });
      }

      // Check if user has existing company association
      const { data: existingAssociation } = await supabaseAdmin
        .from('user_companies')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (existingAssociation) {
        // Update existing association
        console.log("Updating existing association for user:", userId);
        const { error: updateAssociationError } = await supabaseAdmin
          .from('user_companies')
          .update({
            company_id: company_id,
            role: role
          })
          .eq('user_id', userId);

        if (updateAssociationError) {
          console.error("Error updating user company association:", updateAssociationError);
          return NextResponse.json({ error: "Failed to update company association" }, { status: 500 });
        }
        console.log("Successfully updated association");
      } else {
        // Create new association
        console.log("Creating new association for user:", userId);
        const { error: insertAssociationError } = await supabaseAdmin
          .from('user_companies')
          .insert({
            user_id: userId,
            company_id: company_id,
            role: role,
            is_primary: true
          });

        if (insertAssociationError) {
          console.error("Error creating user company association:", insertAssociationError);
          return NextResponse.json({ error: "Failed to create company association" }, { status: 500 });
        }
        console.log("Successfully created association");
      }
    }

    console.log("PATCH completed successfully");
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in PATCH /api/admin/users:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
