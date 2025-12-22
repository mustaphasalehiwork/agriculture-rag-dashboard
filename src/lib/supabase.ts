import { createClient, SupabaseClient } from "@supabase/supabase-js";

function createSupabaseClient(): SupabaseClient {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Missing Supabase environment variables. Please check your .env.local file.");
  }

  return createClient(supabaseUrl, supabaseAnonKey);
}

// Lazy initialization - create client only when needed
let supabaseClient: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient {
  if (!supabaseClient) {
    supabaseClient = createSupabaseClient();
  }
  return supabaseClient;
}

// Export a function for backward compatibility
export const supabase = getSupabaseClient;

// Export the createClient function for server-side usage
export { createClient };

export interface IngestionJob {
  id: string;
  filename: string;
  original_filename: string;
  file_path: string;
  file_size_bytes: number;
  status: "processing" | "completed" | "failed";
  total_chunks: number | null;
  chunks_processed: number;
  current_step: string | null;
  error_code: string | null;
  error_message: string | null;
  created_at: string;
  completed_at: string | null;
  document_id: string | null;
  updated_at: string;
}