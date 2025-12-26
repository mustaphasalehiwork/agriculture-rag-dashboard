export interface Activity {
  id: string;
  name: string;
  emoji?: string | null;
  description?: string | null;
  slug: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

export interface ActivityWithStats extends Activity {
  created_by_email?: string;
  operation_count?: number;
}

export interface CreateActivityRequest {
  name: string;
  emoji?: string;
  description?: string;
  slug: string;
}

export interface UpdateActivityRequest {
  name?: string;
  emoji?: string;
  description?: string;
  slug?: string;
  is_active?: boolean;
}
