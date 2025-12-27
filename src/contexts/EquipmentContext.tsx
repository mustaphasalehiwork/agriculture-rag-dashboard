"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { Equipment, EquipmentWithDetails, CreateEquipmentRequest, UpdateEquipmentRequest } from "@/types/equipment";
import { getSupabaseClient } from "@/lib/supabase";
import { toast } from "sonner";

interface EquipmentContextType {
  equipment: EquipmentWithDetails[];
  loading: boolean;
  fetchEquipment: () => Promise<void>;
  createEquipment: (data: CreateEquipmentRequest) => Promise<{ success: boolean; error?: string; equipment?: Equipment }>;
  updateEquipment: (id: string, data: UpdateEquipmentRequest) => Promise<{ success: boolean; error?: string }>;
  deleteEquipment: (id: string) => Promise<{ success: boolean; error?: string }>;
}

const EquipmentContext = createContext<EquipmentContextType | undefined>(undefined);

export function EquipmentProvider({ children }: { children: ReactNode }) {
  const [equipment, setEquipment] = useState<EquipmentWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = getSupabaseClient();

  useEffect(() => {
    fetchEquipment();
  }, []);

  const fetchEquipment = async () => {
    try {
      setLoading(true);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setEquipment([]);
        setLoading(false);
        return;
      }

      const response = await fetch('/api/equipment', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch equipment');
      }

      const data = await response.json();
      setEquipment(data.equipment || []);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching equipment:", error);
      toast.error(error instanceof Error ? error.message : "Failed to fetch equipment");
      setEquipment([]);
      setLoading(false);
    }
  };

  const createEquipment = async (data: CreateEquipmentRequest) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        return { success: false, error: "Not authenticated" };
      }

      const response = await fetch('/api/equipment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        const error = await response.json();
        return { success: false, error: error.error };
      }

      const result = await response.json();
      await fetchEquipment();

      toast.success(`Equipment "${data.name}" created successfully`);
      return { success: true, equipment: result.equipment };
    } catch (error) {
      console.error("Error creating equipment:", error);
      return { success: false, error: "Failed to create equipment" };
    }
  };

  const updateEquipment = async (id: string, updateData: UpdateEquipmentRequest) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        return { success: false, error: "Not authenticated" };
      }

      const response = await fetch('/api/equipment', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ id, ...updateData })
      });

      if (!response.ok) {
        const error = await response.json();
        return { success: false, error: error.error };
      }

      await fetchEquipment();
      toast.success("Equipment updated successfully");
      return { success: true };
    } catch (error) {
      console.error("Error updating equipment:", error);
      return { success: false, error: "Failed to update equipment" };
    }
  };

  const deleteEquipment = async (id: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        return { success: false, error: "Not authenticated" };
      }

      const response = await fetch(`/api/equipment?id=${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      if (!response.ok) {
        const error = await response.json();
        return { success: false, error: error.error };
      }

      await fetchEquipment();
      toast.success("Equipment deleted successfully");
      return { success: true };
    } catch (error) {
      console.error("Error deleting equipment:", error);
      return { success: false, error: "Failed to delete equipment" };
    }
  };

  const value: EquipmentContextType = {
    equipment,
    loading,
    fetchEquipment,
    createEquipment,
    updateEquipment,
    deleteEquipment,
  };

  return (
    <EquipmentContext.Provider value={value}>
      {children}
    </EquipmentContext.Provider>
  );
}

export function useEquipment() {
  const context = useContext(EquipmentContext);
  if (context === undefined) {
    throw new Error("useEquipment must be used within an EquipmentProvider");
  }
  return context;
}
