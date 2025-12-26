"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useFarm } from "@/contexts/FarmContext";
import { useCompany } from "@/contexts/CompanyContext";
import { useAuth } from "@/contexts/AuthContext";
import { Wheat, Plus, Trash2, Edit2, MapPin, Calendar, Building2 } from "lucide-react";
import { toast } from "sonner";
import { getSupabaseClient } from "@/lib/supabase";
import { Farm } from "@/types/farm";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

export default function FarmsManagementPage() {
  const { user, isAdmin } = useAuth();
  const { companies, currentCompany } = useCompany();
  const { farms, loading, createFarm, updateFarm, deleteFarm } = useFarm();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingFarm, setEditingFarm] = useState<Farm | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    location: "",
    area_hectares: "",
    logo_url: ""
  });
  const [submitting, setSubmitting] = useState(false);

  // Redirect if not admin
  if (user && !isAdmin()) {
    if (typeof window !== 'undefined') {
      window.location.href = "/dashboard";
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.slug) {
      toast.error("Name and slug are required");
      return;
    }

    if (!currentCompany) {
      toast.error("Please select a company first");
      return;
    }

    setSubmitting(true);
    try {
      const { data: { session } } = await getSupabaseClient().auth.getSession();

      if (!session) {
        toast.error("Not authenticated");
        return;
      }

      const data = {
        name: formData.name,
        slug: formData.slug,
        company_id: currentCompany.id,
        location: formData.location || undefined,
        area_hectares: formData.area_hectares ? parseFloat(formData.area_hectares) : undefined,
        logo_url: formData.logo_url || undefined
      };

      if (editingFarm) {
        const result = await updateFarm(editingFarm.id, data);
        if (!result.success) {
          toast.error(result.error || "Failed to update farm");
          return;
        }
      } else {
        const result = await createFarm(data);
        if (!result.success) {
          toast.error(result.error || "Failed to create farm");
          return;
        }
      }

      toast.success(editingFarm ? "Farm updated successfully" : "Farm created successfully");
      setFormData({ name: "", slug: "", location: "", area_hectares: "", logo_url: "" });
      setShowCreateForm(false);
      setEditingFarm(null);
    } catch (error) {
      console.error("Error saving farm:", error);
      toast.error("Failed to save farm");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (farmId: string, farmName: string) => {
    if (!confirm(`Are you sure you want to delete ${farmName}?`)) {
      return;
    }

    const result = await deleteFarm(farmId);
    if (!result.success) {
      toast.error(result.error || "Failed to delete farm");
    }
  };

  const startEdit = (farm: Farm) => {
    setEditingFarm(farm);
    setFormData({
      name: farm.name,
      slug: farm.slug,
      location: farm.location || "",
      area_hectares: farm.area_hectares?.toString() || "",
      logo_url: farm.logo_url || ""
    });
    setShowCreateForm(true);
  };

  const cancelForm = () => {
    setEditingFarm(null);
    setFormData({ name: "", slug: "", location: "", area_hectares: "", logo_url: "" });
    setShowCreateForm(false);
  };

  if (!user || !isAdmin()) {
    return (
      <ProtectedRoute>
        <div></div>
      </ProtectedRoute>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Wheat className="h-8 w-8" />
            Farm Management
          </h1>
          <p className="text-muted-foreground mt-2">
            Manage farms and agricultural land
          </p>
        </div>

        <Button
          onClick={() => {
            setEditingFarm(null);
            setShowCreateForm(!showCreateForm);
          }}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          New Farm
        </Button>
      </div>

      {showCreateForm && (
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">
              {editingFarm ? "Edit Farm" : "Create New Farm"}
            </CardTitle>
            <CardDescription>
              {editingFarm ? "Update farm information" : "Enter farm details"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Farm Name *</Label>
                  <Input
                    id="name"
                    placeholder="Green Valley Farm"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="slug">Slug *</Label>
                  <Input
                    id="slug"
                    placeholder="green-valley-farm"
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
                  <Label htmlFor="location">Location (Optional)</Label>
                  <Input
                    id="location"
                    placeholder="California, Central Valley"
                    value={formData.location}
                    onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="area">Area in Hectares (Optional)</Label>
                  <Input
                    id="area"
                    type="number"
                    step="0.01"
                    placeholder="150.5"
                    value={formData.area_hectares}
                    onChange={(e) => setFormData(prev => ({ ...prev, area_hectares: e.target.value }))}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="logo">Logo URL (Optional)</Label>
                <Input
                  id="logo"
                  type="url"
                  placeholder="https://example.com/logo.png"
                  value={formData.logo_url}
                  onChange={(e) => setFormData(prev => ({ ...prev, logo_url: e.target.value }))}
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={submitting}>
                  {submitting ? (editingFarm ? "Updating..." : "Creating...") : (editingFarm ? "Update Farm" : "Create Farm")}
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {farms.map((farm) => (
          <Card key={farm.id} className="relative">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  {farm.logo_url ? (
                    <img
                      src={farm.logo_url}
                      alt={farm.name}
                      className="h-10 w-10 rounded"
                    />
                  ) : (
                    <div className="h-10 w-10 rounded bg-green-100 dark:bg-green-900 flex items-center justify-center">
                      <Wheat className="h-5 w-5 text-green-600 dark:text-green-400" />
                    </div>
                  )}
                  <div>
                    <CardTitle className="text-lg">{farm.name}</CardTitle>
                    {farm.location && (
                      <CardDescription className="text-xs">{farm.location}</CardDescription>
                    )}
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => startEdit(farm)}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDelete(farm.id, farm.name)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0 space-y-3">
              {farm.area_hectares && (
                <div className="text-sm text-muted-foreground">
                  Area: {farm.area_hectares} hectares
                </div>
              )}
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Building2 className="h-3 w-3" />
                <span>{farm.company_name || "Unknown Company"}</span>
              </div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Calendar className="h-3 w-3" />
                Created {new Date(farm.created_at).toLocaleDateString('en-US')}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {farms.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Wheat className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-2">No farms created yet</p>
            <p className="text-sm text-muted-foreground mb-4">
              Get started by creating your first farm for {currentCompany?.name || "your company"}
            </p>
            <Button
              onClick={() => setShowCreateForm(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Create First Farm
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
