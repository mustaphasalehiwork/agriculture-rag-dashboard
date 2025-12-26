"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { Activity, ActivityWithStats, CreateActivityRequest, UpdateActivityRequest } from "@/types/activity";
import { getSupabaseClient } from "@/lib/supabase";
import { toast } from "sonner";

interface ActivityContextType {
  activities: ActivityWithStats[];
  loading: boolean;
  fetchActivities: () => Promise<void>;
  createActivity: (data: CreateActivityRequest) => Promise<{ success: boolean; error?: string; activity?: Activity }>;
  updateActivity: (id: string, data: UpdateActivityRequest) => Promise<{ success: boolean; error?: string }>;
  deleteActivity: (id: string) => Promise<{ success: boolean; error?: string }>;
}

const ActivityContext = createContext<ActivityContextType | undefined>(undefined);

export function ActivityProvider({ children }: { children: ReactNode }) {
  const [activities, setActivities] = useState<ActivityWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = getSupabaseClient();

  useEffect(() => {
    fetchActivities();
  }, []);

  const fetchActivities = async () => {
    try {
      setLoading(true);

      const { data: { session } } = await supabase.auth.getSession();
      console.log("DEBUG fetchActivities - session:", session ? "Present" : "Missing");

      const response = await fetch('/api/activities', {
        headers: session ? {
          'Authorization': `Bearer ${session.access_token}`
        } : {}
      });

      console.log("DEBUG fetchActivities - response status:", response.status);

      if (!response.ok) {
        const error = await response.json();
        console.error("DEBUG fetchActivities - error response:", error);
        throw new Error(error.error || 'Failed to fetch activities');
      }

      const data = await response.json();
      console.log("DEBUG fetchActivities - activities count:", data.activities?.length || 0);
      setActivities(data.activities || []);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching activities:", error);
      toast.error(error instanceof Error ? error.message : "Failed to fetch activities");
      setActivities([]);
      setLoading(false);
    }
  };

  const createActivity = async (data: CreateActivityRequest) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        return { success: false, error: "Not authenticated" };
      }

      const response = await fetch('/api/activities', {
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
      await fetchActivities();

      toast.success(`Activity "${data.name}" created successfully`);
      return { success: true, activity: result.activity };
    } catch (error) {
      console.error("Error creating activity:", error);
      return { success: false, error: "Failed to create activity" };
    }
  };

  const updateActivity = async (id: string, updateData: UpdateActivityRequest) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        return { success: false, error: "Not authenticated" };
      }

      const response = await fetch('/api/activities', {
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

      await fetchActivities();
      toast.success("Activity updated successfully");
      return { success: true };
    } catch (error) {
      console.error("Error updating activity:", error);
      return { success: false, error: "Failed to update activity" };
    }
  };

  const deleteActivity = async (id: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        return { success: false, error: "Not authenticated" };
      }

      const response = await fetch(`/api/activities?id=${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      if (!response.ok) {
        const error = await response.json();
        return { success: false, error: error.error };
      }

      await fetchActivities();
      toast.success("Activity deleted successfully");
      return { success: true };
    } catch (error) {
      console.error("Error deleting activity:", error);
      return { success: false, error: "Failed to delete activity" };
    }
  };

  const value: ActivityContextType = {
    activities,
    loading,
    fetchActivities,
    createActivity,
    updateActivity,
    deleteActivity,
  };

  return (
    <ActivityContext.Provider value={value}>
      {children}
    </ActivityContext.Provider>
  );
}

export function useActivity() {
  const context = useContext(ActivityContext);
  if (context === undefined) {
    throw new Error("useActivity must be used within an ActivityProvider");
  }
  return context;
}
