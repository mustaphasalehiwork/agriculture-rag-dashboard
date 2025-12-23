"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useCompany } from "@/contexts/CompanyContext";
import { useAuth } from "@/contexts/AuthContext";
import {
  Building2,
  Plus,
  Settings,
  Trash2,
  Edit2,
  Users,
  Calendar,
  Mail,
  Loader2
} from "lucide-react";
import { toast } from "sonner";
import { Company } from "@/types/company";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

export default function CompaniesManagementPage() {
  const { user, isAdmin } = useAuth();
  const { companies, currentCompany, loading, createCompany, updateCompany, deleteCompany } = useCompany();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    domain: "",
    logo_url: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (editingCompany) {
      setFormData({
        name: editingCompany.name,
        slug: editingCompany.slug,
        domain: editingCompany.domain || "",
        logo_url: editingCompany.logo_url || ""
      });
    }
  }, [editingCompany]);

  const handleCreateOrUpdate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.slug) {
      toast.error("Name and slug are required");
      return;
    }

    setIsSubmitting(true);

    try {
      if (editingCompany) {
        const result = await updateCompany(editingCompany.id, formData);
        if (!result.success) {
          toast.error(result.error || "Failed to update company");
          return;
        }
        toast.success("Company updated successfully");
      } else {
        const result = await createCompany(formData);
        if (!result.success) {
          toast.error(result.error || "Failed to create company");
          return;
        }
        toast.success("Company created successfully");
      }

      setFormData({ name: "", slug: "", domain: "", logo_url: "" });
      setShowCreateForm(false);
      setEditingCompany(null);
    } catch (error) {
      console.error("Error creating/updating company:", error);
      toast.error("Failed to save company");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (companyId: string, companyName: string) => {
    if (!confirm(`Are you sure you want to delete ${companyName}?`)) {
      return;
    }

    const result = await deleteCompany(companyId);
    if (!result.success) {
      toast.error(result.error || "Failed to delete company");
    }
  };

  const startEdit = (company: Company) => {
    setEditingCompany(company);
    setShowCreateForm(true);
  };

  const cancelForm = () => {
    setShowCreateForm(false);
    setEditingCompany(null);
    setFormData({ name: "", slug: "", domain: "", logo_url: "" });
  };

  if (!user) {
    return (
      <ProtectedRoute>
        <div></div>
      </ProtectedRoute>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Building2 className="h-8 w-8" />
            Company Management
          </h1>
          <p className="text-muted-foreground mt-2">
            Manage companies and organizations
          </p>
        </div>

        <Button
          onClick={() => {
            setEditingCompany(null);
            setShowCreateForm(!showCreateForm);
          }}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          New Company
        </Button>
      </div>

      {showCreateForm && (
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">
              {editingCompany ? "Edit Company" : "Create New Company"}
            </CardTitle>
            <CardDescription>
              {editingCompany ? "Update company information" : "Enter company details"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateOrUpdate} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Company Name *</Label>
                  <Input
                    id="name"
                    placeholder="Acme Corporation"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="slug">Slug *</Label>
                  <Input
                    id="slug"
                    placeholder="acme-corp"
                    value={formData.slug}
                    onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') }))}
                    required
                    pattern="[a-z0-9-]+"
                    title="Only lowercase letters, numbers, and hyphens"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="domain">Domain (Optional)</Label>
                  <Input
                    id="domain"
                    type="text"
                    placeholder="example.com"
                    value={formData.domain}
                    onChange={(e) => setFormData(prev => ({ ...prev, domain: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="logo_url">Logo URL (Optional)</Label>
                  <Input
                    id="logo_url"
                    type="url"
                    placeholder="https://example.com/logo.png"
                    value={formData.logo_url}
                    onChange={(e) => setFormData(prev => ({ ...prev, logo_url: e.target.value }))}
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      {editingCompany ? "Updating..." : "Creating..."}
                    </>
                  ) : (
                    editingCompany ? "Update Company" : "Create Company"
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={cancelForm}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {companies.map((company) => (
            <Card key={company.id} className={`relative ${currentCompany?.id === company.id ? 'ring-2 ring-primary' : ''}`}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    {company.logo_url ? (
                      <img
                        src={company.logo_url}
                        alt={company.name}
                        className="h-10 w-10 rounded"
                      />
                    ) : (
                      <div className="h-10 w-10 rounded bg-primary/10 flex items-center justify-center">
                        <Building2 className="h-5 w-5" />
                      </div>
                    )}
                    <div>
                      <CardTitle className="text-lg flex items-center gap-2">
                        {company.name}
                        {currentCompany?.id === company.id && (
                          <Badge variant="default" className="text-xs">Active</Badge>
                        )}
                      </CardTitle>
                      {company.domain && (
                        <CardDescription className="text-xs">
                          {company.domain}
                        </CardDescription>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => startEdit(company)}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDelete(company.id, company.name)}
                      disabled={company.id === currentCompany?.id}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0 space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Users className="h-4 w-4" />
                    <span>{company.user_count || 0} {company.user_count === 1 ? 'user' : 'users'}</span>
                  </div>
                  {company.user_role && (
                    <Badge variant="secondary" className="capitalize">
                      {company.user_role}
                    </Badge>
                  )}
                </div>

                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  Created {new Date(company.created_at).toLocaleDateString('en-US')}
                </div>

                {company.created_by_user && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Mail className="h-3 w-3" />
                    Created by {company.created_by_user.email || 'Unknown'}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {!loading && companies.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-2">No companies created yet</p>
            <p className="text-sm text-muted-foreground mb-4">
              Get started by creating your first company
            </p>
            <Button onClick={() => setShowCreateForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create First Company
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
