import { NextResponse } from "next/server";
import { getSupabaseClient } from "@/lib/supabase";

// Airtable configuration
const AIRTABLE_BASE_ID = process.env.NEXT_PUBLIC_AIRTABLE_BASE_ID;
const AIRTABLE_API_KEY = process.env.NEXT_PUBLIC_AIRTABLE_API_KEY;

export async function GET() {
  const diagnostic = {
    step1_supabase_connection: { status: 'pending', details: null as string | null },
    step2_airtable_connection: { status: 'pending', details: null as string | null },
    step3_table_existence: { status: 'pending', details: null as string | null },
    step4_data_availability: { status: 'pending', details: null as string | null },
    recommendations: [] as string[]
  };

  // Step 1: Test Supabase Connection
  try {
    const supabase = getSupabaseClient();
    console.log('Testing Supabase connection...');

    // Test basic connection with a simple query
    const { data, error } = await supabase
      .from('CheckListQuestion')
      .select('count')
      .limit(1);

    if (error) {
      diagnostic.step1_supabase_connection = {
        status: 'failed',
        details: `Supabase Error: ${error.message} (Code: ${error.code})`
      };

      if (error.code === 'PGRST116') {
        diagnostic.recommendations.push('Table "CheckListQuestion" does not exist. Please run the setup SQL script.');
      } else if (error.message.includes('fetch failed')) {
        diagnostic.recommendations.push('Network connection to Supabase failed. Check your internet connection.');
      }
    } else {
      diagnostic.step1_supabase_connection = {
        status: 'success',
        details: 'Supabase connection established successfully'
      };
    }
  } catch (error) {
    diagnostic.step1_supabase_connection = {
      status: 'failed',
      details: `Connection Error: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
    diagnostic.recommendations.push('Check Supabase URL and API key in .env.local file.');
  }

  // Step 2: Test Airtable Connection
  try {
    console.log('Testing Airtable connection...');

    if (!AIRTABLE_BASE_ID || !AIRTABLE_API_KEY) {
      diagnostic.step2_airtable_connection = {
        status: 'failed',
        details: 'Airtable configuration missing from environment variables'
      };
      diagnostic.recommendations.push('Add NEXT_PUBLIC_AIRTABLE_BASE_ID and NEXT_PUBLIC_AIRTABLE_API_KEY to .env.local');
      return NextResponse.json(diagnostic);
    }

    // Test by trying to access base metadata
    const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/meta/bases`;

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
      },
    });

    if (!response.ok) {
      diagnostic.step2_airtable_connection = {
        status: 'failed',
        details: `Airtable API Error: ${response.status} ${response.statusText}`
      };

      if (response.status === 401) {
        diagnostic.recommendations.push('Invalid Airtable API key. Please check your PAT token.');
      } else if (response.status === 404) {
        diagnostic.recommendations.push('Invalid Airtable Base ID. Please check your base ID.');
      }
    } else {
      const baseInfo = await response.json();
      diagnostic.step2_airtable_connection = {
        status: 'success',
        details: `Connected to Airtable base: ${baseInfo.name || 'Unknown'}`
      };
    }
  } catch (error) {
    diagnostic.step2_airtable_connection = {
      status: 'failed',
      details: `Network Error: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
    diagnostic.recommendations.push('Check internet connection and Airtable API accessibility.');
  }

  // Step 3: Check Table Existence (only if connections succeeded)
  if (diagnostic.step1_supabase_connection.status === 'success' &&
      diagnostic.step2_airtable_connection.status === 'success') {

    // Check Supabase table
    try {
      const supabase = getSupabaseClient();
      const { data: tableInfo, error: tableError } = await supabase
        .from('CheckListQuestion')
        .select('*')
        .limit(1);

      if (tableError) {
        diagnostic.step3_table_existence = {
          status: 'failed',
          details: `CheckListQuestion table issue: ${tableError.message}`
        };
        diagnostic.recommendations.push('Create CheckListQuestion table in Supabase using the provided SQL script.');
      } else {
        diagnostic.step3_table_existence = {
          status: 'success',
          details: 'CheckListQuestion table exists and is accessible'
        };
      }
    } catch (error) {
      diagnostic.step3_table_existence = {
        status: 'failed',
        details: `Error checking table: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }

    // Check Airtable tables
    try {
      const possibleTables = ['Users', 'CheckList Template', 'Templates', 'Questions'];
      let foundTables = [];

      for (const tableName of possibleTables) {
        const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(tableName)}`;
        const response = await fetch(url, {
          headers: {
            'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
          },
        });

        if (response.ok) {
          foundTables.push(tableName);
        }
      }

      if (foundTables.length === 0) {
        diagnostic.step3_table_existence = {
          status: 'failed',
          details: 'No required Airtable tables found. Looking for: Users, CheckList Template'
        };
        diagnostic.recommendations.push('Create Users and CheckList Template tables in your Airtable base.');
      } else {
        diagnostic.step3_table_existence = {
          status: 'success',
          details: `Found Airtable tables: ${foundTables.join(', ')}`
        };
      }
    } catch (error) {
      diagnostic.step3_table_existence = {
        status: 'failed',
        details: `Error checking Airtable tables: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  // Step 4: Check Data Availability
  if (diagnostic.step3_table_existence.status === 'success') {
    try {
      const supabase = getSupabaseClient();
      const { count, error: countError } = await supabase
        .from('CheckListQuestion')
        .select('*', { count: 'exact', head: true });

      if (countError) {
        diagnostic.step4_data_availability = {
          status: 'failed',
          details: `Error counting records: ${countError.message}`
        };
      } else {
        diagnostic.step4_data_availability = {
          status: 'success',
          details: `Found ${count || 0} checklist records in database`
        };

        if ((count || 0) === 0) {
          diagnostic.recommendations.push('Database tables exist but are empty. Add some sample data to test the dashboard.');
        }
      }
    } catch (error) {
      diagnostic.step4_data_availability = {
        status: 'failed',
        details: `Error checking data: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  // If no specific recommendations, add general ones
  if (diagnostic.recommendations.length === 0) {
    diagnostic.recommendations.push('All checks passed! The system should work correctly.');
  }

  return NextResponse.json({
    timestamp: new Date().toISOString(),
    environment_configured: {
      supabase_url: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      supabase_key: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      airtable_base_id: !!AIRTABLE_BASE_ID,
      airtable_api_key: !!AIRTABLE_API_KEY
    },
    diagnostic
  });
}