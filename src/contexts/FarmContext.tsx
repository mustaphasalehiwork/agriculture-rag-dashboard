"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { Farm, FarmWithStats, CreateFarmRequest, UpdateFarmRequest } from "@/types/farm";
import { getSupabaseClient } from "@/lib/supabase";
import { toast } from "sonner";

interface FarmContextType {
  farms: FarmWithStats[];
  loading: boolean;
  fetchFarms: () => Promise<void>;
  createFarm: (data: CreateFarmRequest) => Promise<{ success: boolean; error?: string; farm?: Farm }>;
  updateFarm: (id: string, data: UpdateFarmRequest) => Promise<{ success: boolean; error?: string }>;
  deleteFarm: (id: string) => Promise<{ success: boolean; error?: string }>;
}

const FarmContext = createContext<FarmContextType | undefined>(undefined);

export function FarmProvider({ children }: { children: ReactNode }) {
  const [farms, setFarms] = useState<FarmWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = getSupabaseClient();

  useEffect(() => {
    fetchFarms();
  }, []);

  const fetchFarms = async () => {
    try {
      setLoading(true);

      // Get current session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      console.log("DEBUG fetchFarms - session:", session ? "Present" : "Missing", "error:", sessionError?.message);

      if (!session) {
        console.log("DEBUG fetchFarms - No session, clearing farms");
        setFarms([]);
        setLoading(false);
        return;
      }

      console.log("DEBUG fetchFarms - user:", session.user?.email, "token expires:", new Date(session.expires_at! * 1000).toISOString());

      const response = await fetch('/api/farms', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      console.log("DEBUG fetchFarms - response status:", response.status);

      if (!response.ok) {
        const error = await response.json();
        console.error("DEBUG fetchFarms - error response:", error);

        // If 401, try to refresh session
        if (response.status === 401) {
          console.log("DEBUG fetchFarms - Got 401, trying to refresh session");
          const { data: { session: refreshedSession }, error: refreshError } = await supabase.auth.refreshSession();

          if (refreshedSession) {
            console.log("DEBUG fetchFarms - Session refreshed, retrying request");
            const retryResponse = await fetch('/api/farms', {
              headers: {
                'Authorization': `Bearer ${refreshedSession.access_token}`
              }
            });

            if (retryResponse.ok) {
              const data = await retryResponse.json();
              console.log("DEBUG fetchFarms - farms count:", data.farms?.length || 0);
              setFarms(data.farms || []);
              setLoading(false);
              return;
            }
          }
        }

        throw new Error(error.error || 'Failed to fetch farms');
      }

      const data = await response.json();
      console.log("DEBUG fetchFarms - farms count:", data.farms?.length || 0);
      setFarms(data.farms || []);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching farms:", error);
      toast.error(error instanceof Error ? error.message : "Failed to fetch farms");
      setFarms([]);
      setLoading(false);
    }
  };

  const createFarm = async (data: CreateFarmRequest) => {
    try {
      // Refresh session to get a valid token
      const { data: { session } } = await supabase.auth.refreshSession();
      if (!session) {
        return { success: false, error: "Not authenticated" };
      }

      const response = await fetch('/api/farms', {
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
      await fetchFarms(); // Refresh list

      toast.success(`Farm "${data.name}" created successfully`);
      return { success: true, farm: result.farm };
    } catch (error) {
      console.error("Error creating farm:", error);
      return { success: false, error: "Failed to create farm" };
    }
  };

  const updateFarm = async (id: string, updateData: UpdateFarmRequest) => {
    try {
      // Refresh session to get a valid token
      const { data: { session } } = await supabase.auth.refreshSession();
      if (!session) {
        return { success: false, error: "Not authenticated" };
      }

      const response = await fetch('/api/farms', {
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

      await fetchFarms(); // Refresh list
      toast.success("Farm updated successfully");
      return { success: true };
    } catch (error) {
      console.error("Error updating farm:", error);
      return { success: false, error: "Failed to update farm" };
    }
  };

  const deleteFarm = async (id: string) => {
    try {
      // Refresh session to get a valid token
      const { data: { session } } = await supabase.auth.refreshSession();
      if (!session) {
        return { success: false, error: "Not authenticated" };
      }

      const response = await fetch(`/api/farms?id=${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      if (!response.ok) {
        const error = await response.json();
        return { success: false, error: error.error };
      }

      await fetchFarms(); // Refresh list
      toast.success("Farm deleted successfully");
      return { success: true };
    } catch (error) {
      console.error("Error deleting farm:", error);
      return { success: false, error: "Failed to delete farm" };
    }
  };

  const value: FarmContextType = {
    farms,
    loading,
    fetchFarms,
    createFarm,
    updateFarm,
    deleteFarm,
  };

  return (
    <FarmContext.Provider value={value}>
      {children}
    </FarmContext.Provider>
  );
}

export function useFarm() {
  const context = useContext(FarmContext);
  if (context === undefined) {
    throw new Error("useFarm must be used within a FarmProvider");
  }
  return context;
}
