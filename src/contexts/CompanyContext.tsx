"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { Company, CompanyWithStats } from "@/types/company";
import { getSupabaseClient } from "@/lib/supabase";
import { toast } from "sonner";

interface CompanyContextType {
  companies: CompanyWithStats[];
  currentCompany: CompanyWithStats | null;
  loading: boolean;
  setCurrentCompany: (company: CompanyWithStats | null) => void;
  fetchCompanies: () => Promise<void>;
  createCompany: (data: {
    name: string;
    slug: string;
    domain?: string;
    logo_url?: string;
  }) => Promise<{ success: boolean; error?: string; company?: Company }>;
  updateCompany: (id: string, data: Partial<Company>) => Promise<{ success: boolean; error?: string }>;
  deleteCompany: (id: string) => Promise<{ success: boolean; error?: string }>;
  switchCompany: (companyId: string) => void;
}

const CompanyContext = createContext<CompanyContextType | undefined>(undefined);

export function CompanyProvider({ children }: { children: ReactNode }) {
  const [companies, setCompanies] = useState<CompanyWithStats[]>([]);
  const [currentCompany, setCurrentCompanyState] = useState<CompanyWithStats | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = getSupabaseClient();

  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    try {
      setLoading(true);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setCompanies([]);
        setCurrentCompanyState(null);
        setLoading(false);
        return;
      }

      const response = await fetch('/api/companies', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch companies');
      }

      const data = await response.json();
      setCompanies(data.companies || []);

      // Set current company: prioritize primary company, then saved company, then first company
      const primaryCompany = data.companies.find((c: CompanyWithStats) => c.user_role && c.is_primary);

      if (primaryCompany) {
        setCurrentCompanyState(primaryCompany);
        localStorage.setItem('currentCompanyId', primaryCompany.id);
      } else {
        const savedCompanyId = localStorage.getItem('currentCompanyId');
        if (savedCompanyId) {
          const savedCompany = data.companies.find((c: CompanyWithStats) => c.id === savedCompanyId);
          if (savedCompany) {
            setCurrentCompanyState(savedCompany);
          } else {
            setCurrentCompanyState(data.companies[0] || null);
          }
        } else {
          setCurrentCompanyState(data.companies[0] || null);
        }
      }

      setLoading(false);
    } catch (error) {
      console.error("Error fetching companies:", error);
      toast.error(error instanceof Error ? error.message : "Failed to fetch companies");
      setLoading(false);
    }
  };

  const createCompany = async (data: {
    name: string;
    slug: string;
    domain?: string;
    logo_url?: string;
  }) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        return { success: false, error: "Not authenticated" };
      }

      const response = await fetch('/api/companies', {
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
      await fetchCompanies(); // Refresh list

      toast.success(`Company "${data.name}" created successfully`);
      return { success: true, company: result.company };
    } catch (error) {
      console.error("Error creating company:", error);
      return { success: false, error: "Failed to create company" };
    }
  };

  const updateCompany = async (id: string, updateData: Partial<Company>) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        return { success: false, error: "Not authenticated" };
      }

      const response = await fetch('/api/companies', {
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

      await fetchCompanies(); // Refresh list
      toast.success("Company updated successfully");
      return { success: true };
    } catch (error) {
      console.error("Error updating company:", error);
      return { success: false, error: "Failed to update company" };
    }
  };

  const deleteCompany = async (id: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        return { success: false, error: "Not authenticated" };
      }

      const response = await fetch(`/api/companies?id=${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      if (!response.ok) {
        const error = await response.json();
        return { success: false, error: error.error };
      }

      await fetchCompanies(); // Refresh list
      toast.success("Company deleted successfully");
      return { success: true };
    } catch (error) {
      console.error("Error deleting company:", error);
      return { success: false, error: "Failed to delete company" };
    }
  };

  const setCurrentCompany = (company: CompanyWithStats | null) => {
    setCurrentCompanyState(company);
    if (company) {
      localStorage.setItem('currentCompanyId', company.id);
    } else {
      localStorage.removeItem('currentCompanyId');
    }
  };

  const switchCompany = (companyId: string) => {
    const company = companies.find(c => c.id === companyId);
    if (company) {
      setCurrentCompany(company);
      toast.success(`Switched to ${company.name}`);
      // Reload page to refresh data
      window.location.reload();
    }
  };

  const value: CompanyContextType = {
    companies,
    currentCompany,
    loading,
    setCurrentCompany,
    fetchCompanies,
    createCompany,
    updateCompany,
    deleteCompany,
    switchCompany,
  };

  return (
    <CompanyContext.Provider value={value}>
      {children}
    </CompanyContext.Provider>
  );
}

export function useCompany() {
  const context = useContext(CompanyContext);
  if (context === undefined) {
    throw new Error("useCompany must be used within a CompanyProvider");
  }
  return context;
}
