// Farm types for Agriculture RAG Dashboard

export interface Farm {
  id: string;
  name: string;
  slug: string;
  company_id: string;
  location?: string;
  area_hectares?: number;
  coordinates?: Record<string, any>;
  logo_url?: string;
  settings: Record<string, any>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by?: string;
  created_by_user?: {
    email: string;
    user_metadata?: {
      name?: string;
    };
  };
}

export interface FarmWithStats extends Farm {
  company_name?: string;
  checklist_count?: number;
}

export type CreateFarmRequest = {
  name: string;
  slug: string;
  company_id: string;
  location?: string;
  area_hectares?: number;
  coordinates?: Record<string, any>;
  logo_url?: string;
  settings?: Record<string, any>;
};

export type UpdateFarmRequest = {
  name?: string;
  location?: string;
  area_hectares?: number;
  coordinates?: Record<string, any>;
  logo_url?: string;
  settings?: Record<string, any>;
  is_active?: boolean;
};
