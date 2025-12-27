export interface Equipment {
  id: string;
  name: string;
  brand?: string | null;
  model?: string | null;
  year?: number | null;
  plate_number?: string | null;
  category_id?: string | null;
  activity_id?: string | null;
  company_id: string;
  farm_id?: string | null;
  specifications?: Record<string, any>;
  purchase_date?: string | null;
  status?: string;
  notes?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

export interface EquipmentWithDetails extends Equipment {
  category_name?: string;
  activity_name?: string;
  company_name?: string;
  farm_name?: string;
  created_by_email?: string;
  category_emoji?: string;
  activity_emoji?: string;
}

export interface CreateEquipmentRequest {
  name: string;
  brand?: string;
  model?: string;
  year?: number;
  plate_number?: string;
  category_id?: string;
  activity_id?: string;
  company_id: string;
  farm_id?: string;
  specifications?: Record<string, any>;
  purchase_date?: string;
  status?: string;
  notes?: string;
}

export interface UpdateEquipmentRequest {
  name?: string;
  brand?: string;
  model?: string;
  year?: number;
  plate_number?: string;
  category_id?: string;
  activity_id?: string;
  farm_id?: string;
  specifications?: Record<string, any>;
  purchase_date?: string;
  status?: string;
  notes?: string;
  is_active?: boolean;
}
