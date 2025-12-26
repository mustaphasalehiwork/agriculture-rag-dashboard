"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { Category, CategoryWithStats, CreateCategoryRequest, UpdateCategoryRequest } from "@/types/category";
import { getSupabaseClient } from "@/lib/supabase";
import { toast } from "sonner";

interface CategoryContextType {
  categories: CategoryWithStats[];
  loading: boolean;
  fetchCategories: () => Promise<void>;
  createCategory: (data: CreateCategoryRequest) => Promise<{ success: boolean; error?: string; category?: Category }>;
  updateCategory: (id: string, data: UpdateCategoryRequest) => Promise<{ success: boolean; error?: string }>;
  deleteCategory: (id: string) => Promise<{ success: boolean; error?: string }>;
}

const CategoryContext = createContext<CategoryContextType | undefined>(undefined);

export function CategoryProvider({ children }: { children: ReactNode }) {
  const [categories, setCategories] = useState<CategoryWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = getSupabaseClient();

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);

      const { data: { session } } = await supabase.auth.getSession();
      console.log("DEBUG fetchCategories - session:", session ? "Present" : "Missing");

      const response = await fetch('/api/categories', {
        headers: session ? {
          'Authorization': `Bearer ${session.access_token}`
        } : {}
      });

      console.log("DEBUG fetchCategories - response status:", response.status);

      if (!response.ok) {
        const error = await response.json();
        console.error("DEBUG fetchCategories - error response:", error);
        throw new Error(error.error || 'Failed to fetch categories');
      }

      const data = await response.json();
      console.log("DEBUG fetchCategories - categories count:", data.categories?.length || 0);
      setCategories(data.categories || []);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching categories:", error);
      toast.error(error instanceof Error ? error.message : "Failed to fetch categories");
      setCategories([]);
      setLoading(false);
    }
  };

  const createCategory = async (data: CreateCategoryRequest) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        return { success: false, error: "Not authenticated" };
      }

      const response = await fetch('/api/categories', {
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
      await fetchCategories();

      toast.success(`Category "${data.name}" created successfully`);
      return { success: true, category: result.category };
    } catch (error) {
      console.error("Error creating category:", error);
      return { success: false, error: "Failed to create category" };
    }
  };

  const updateCategory = async (id: string, updateData: UpdateCategoryRequest) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        return { success: false, error: "Not authenticated" };
      }

      const response = await fetch('/api/categories', {
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

      await fetchCategories();
      toast.success("Category updated successfully");
      return { success: true };
    } catch (error) {
      console.error("Error updating category:", error);
      return { success: false, error: "Failed to update category" };
    }
  };

  const deleteCategory = async (id: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        return { success: false, error: "Not authenticated" };
      }

      const response = await fetch(`/api/categories?id=${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      if (!response.ok) {
        const error = await response.json();
        return { success: false, error: error.error };
      }

      await fetchCategories();
      toast.success("Category deleted successfully");
      return { success: true };
    } catch (error) {
      console.error("Error deleting category:", error);
      return { success: false, error: "Failed to delete category" };
    }
  };

  const value: CategoryContextType = {
    categories,
    loading,
    fetchCategories,
    createCategory,
    updateCategory,
    deleteCategory,
  };

  return (
    <CategoryContext.Provider value={value}>
      {children}
    </CategoryContext.Provider>
  );
}

export function useCategory() {
  const context = useContext(CategoryContext);
  if (context === undefined) {
    throw new Error("useCategory must be used within a CategoryProvider");
  }
  return context;
}
