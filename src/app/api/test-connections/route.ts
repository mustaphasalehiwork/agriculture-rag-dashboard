import { NextResponse } from "next/server";
import { getSupabaseClient } from "@/lib/supabase";

// Airtable configuration
const AIRTABLE_BASE_ID = process.env.NEXT_PUBLIC_AIRTABLE_BASE_ID;
const AIRTABLE_API_KEY = process.env.NEXT_PUBLIC_AIRTABLE_API_KEY;

export async function GET() {
  const results = {
    supabase: { status: 'unknown', error: null as string | null, data: null as string | null },
    airtable: { status: 'unknown', error: null as string | null, data: null as string | null }
  };

  // Test Supabase Connection
  try {
    console.log('Testing Supabase connection...');
    const supabase = getSupabaseClient();

    // Test basic connectivity
    const { data, error } = await supabase
      .from('CheckListQuestion')
      .select('count')
      .limit(1);

    if (error) {
      results.supabase = {
        status: 'error',
        error: error.message,
        data: null
      };
    } else {
      results.supabase = {
        status: 'connected',
        error: null,
        data: 'Supabase connection successful'
      };
    }
  } catch (error) {
    results.supabase = {
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
      data: null
    };
  }

  // Test Airtable Connection
  try {
    console.log('Testing Airtable connection...');

    if (!AIRTABLE_BASE_ID || !AIRTABLE_API_KEY) {
      results.airtable = {
        status: 'error',
        error: 'Airtable configuration missing',
        data: null
      };
    } else {
      // Try to list tables (meta endpoint)
      const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/meta/bases`;

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
        },
      });

      if (response.ok) {
        const baseInfo = await response.json();
        results.airtable = {
          status: 'connected',
          error: null,
          data: `Airtable connection successful. Base: ${baseInfo.name}`
        };
      } else {
        results.airtable = {
          status: 'error',
          error: `Airtable API error: ${response.status} ${response.statusText}`,
          data: null
        };
      }
    }
  } catch (error) {
    results.airtable = {
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
      data: null
    };
  }

  return NextResponse.json({
    timestamp: new Date().toISOString(),
    environment: {
      supabase_url: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'configured' : 'missing',
      supabase_key: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'configured' : 'missing',
      airtable_base_id: AIRTABLE_BASE_ID ? 'configured' : 'missing',
      airtable_api_key: AIRTABLE_API_KEY ? 'configured' : 'missing'
    },
    connections: results
  });
}