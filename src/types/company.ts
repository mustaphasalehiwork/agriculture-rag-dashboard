// Company types for Agriculture RAG Dashboard

export interface Company {
  id: string;
  name: string;
  slug: string;
  domain?: string;
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

export interface CompanyWithStats extends Company {
  user_count?: number;
  checklist_count?: number;
  user_role?: 'Supervisor / Director' | 'Coordinator' | 'Operator';
  is_primary?: boolean;
}

export interface UserCompany {
  id: string;
  user_id: string;
  company_id: string;
  role: 'Supervisor / Director' | 'Coordinator' | 'Operator';
  is_primary: boolean;
  joined_at: string;
  company?: Company;
}

export type CompanyRole = 'Supervisor / Director' | 'Coordinator' | 'Operator';

export interface CreateCompanyRequest {
  name: string;
  slug: string;
  domain?: string;
  logo_url?: string;
  settings?: Record<string, any>;
}

export interface UpdateCompanyRequest {
  name?: string;
  domain?: string;
  logo_url?: string;
  settings?: Record<string, any>;
  is_active?: boolean;
}

export interface AddUserToCompanyRequest {
  user_email: string;
  role: CompanyRole;
  is_primary?: boolean;
}
