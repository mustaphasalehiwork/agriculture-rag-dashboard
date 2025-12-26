export interface Category {
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

export interface CategoryWithStats extends Category {
  created_by_email?: string;
  equipment_count?: number;
}

export interface CreateCategoryRequest {
  name: string;
  emoji?: string;
  description?: string;
  slug: string;
}

export interface UpdateCategoryRequest {
  name?: string;
  emoji?: string;
  description?: string;
  slug?: string;
  is_active?: boolean;
}
