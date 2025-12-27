"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useEquipment } from "@/contexts/EquipmentContext";
import { useCompany } from "@/contexts/CompanyContext";
import { useFarm } from "@/contexts/FarmContext";
import { useCategory } from "@/contexts/CategoryContext";
import { useActivity } from "@/contexts/ActivityContext";
import { useAuth } from "@/contexts/AuthContext";
import { Settings, Plus, Trash2, Edit2, Calendar, Wrench, Building2, Wheat } from "lucide-react";
import { toast } from "sonner";
import { Equipment } from "@/types/equipment";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

export default function EquipmentManagementPage() {
  const { user } = useAuth();
  const { companies, currentCompany, setCurrentCompany } = useCompany();
  const { farms } = useFarm();
  const { categories } = useCategory();
  const { activities } = useActivity();
  const { equipment, loading, createEquipment, updateEquipment, deleteEquipment } = useEquipment();

  const [selectedCompanyId, setSelectedCompanyId] = useState<string>("");
  const [selectedFarmId, setSelectedFarmId] = useState<string>("");
  const [filteredFarms, setFilteredFarms] = useState([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingEquipment, setEditingEquipment] = useState<Equipment | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    brand: "",
    model: "",
    year: "",
    plate_number: "",
    category_id: "",
    activity_id: "",
    farm_id: "",
    status: "active",
    notes: ""
  });
  const [submitting, setSubmitting] = useState(false);

  // Set initial company
  useEffect(() => {
    if (currentCompany) {
      setSelectedCompanyId(currentCompany.id);
    }
  }, [currentCompany]);

  // Filter farms when company changes
  useEffect(() => {
    if (selectedCompanyId) {
      const companyFarms = farms.filter(f => f.company_id === selectedCompanyId);
      setFilteredFarms(companyFarms);
    } else {
      setFilteredFarms([]);
    }
    setSelectedFarmId("");
  }, [selectedCompanyId, farms]);

  const handleCompanyChange = (companyId: string) => {
    setSelectedCompanyId(companyId);
    const company = companies.find(c => c.id === companyId);
    if (company) {
      setCurrentCompany(company);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !selectedCompanyId) {
      toast.error("Name and Company are required");
      return;
    }

    setSubmitting(true);
    try {
      const data = {
        name: formData.name,
        brand: formData.brand || undefined,
        model: formData.model || undefined,
        year: formData.year ? parseInt(formData.year) : undefined,
        plate_number: formData.plate_number || undefined,
        category_id: formData.category_id || undefined,
        activity_id: formData.activity_id || undefined,
        company_id: selectedCompanyId,
        farm_id: selectedFarmId || undefined,
        status: formData.status,
        notes: formData.notes || undefined
      };

      if (editingEquipment) {
        const result = await updateEquipment(editingEquipment.id, data);
        if (!result.success) {
          toast.error(result.error || "Failed to update equipment");
          return;
        }
      } else {
        const result = await createEquipment(data);
        if (!result.success) {
          toast.error(result.error || "Failed to create equipment");
          return;
        }
      }

      toast.success(editingEquipment ? "Equipment updated successfully" : "Equipment created successfully");
      setFormData({
        name: "",
        brand: "",
        model: "",
        year: "",
        plate_number: "",
        category_id: "",
        activity_id: "",
        farm_id: "",
        status: "active",
        notes: ""
      });
      setShowCreateForm(false);
      setEditingEquipment(null);
    } catch (error) {
      console.error("Error saving equipment:", error);
      toast.error("Failed to save equipment");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (equipmentId: string, equipmentName: string) => {
    if (!confirm(`Are you sure you want to delete ${equipmentName}?`)) {
      return;
    }

    const result = await deleteEquipment(equipmentId);
    if (!result.success) {
      toast.error(result.error || "Failed to delete equipment");
      return;
    }

    toast.success("Equipment deleted successfully");
  };

  const handleEdit = (eq: Equipment) => {
    setEditingEquipment(eq);
    setFormData({
      name: eq.name,
      brand: eq.brand || "",
      model: eq.model || "",
      year: eq.year?.toString() || "",
      plate_number: eq.plate_number || "",
      category_id: eq.category_id || "",
      activity_id: eq.activity_id || "",
      farm_id: eq.farm_id || "",
      status: eq.status || "active",
      notes: eq.notes || ""
    });
    setSelectedCompanyId(eq.company_id);
    setSelectedFarmId(eq.farm_id || "");
    setShowCreateForm(true);
  };

  const handleCancel = () => {
    setShowCreateForm(false);
    setEditingEquipment(null);
    setFormData({
      name: "",
      brand: "",
      model: "",
      year: "",
      plate_number: "",
      category_id: "",
      activity_id: "",
      farm_id: "",
      status: "active",
      notes: ""
    });
  };

  // Filter equipment by selected company
  const filteredEquipment = equipment.filter(eq => eq.company_id === selectedCompanyId);

  return (
    <ProtectedRoute>
      <div className="space-y-6">
        {/* Header with Company Selector */}
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <h1 className="text-3xl font-bold tracking-tight">Equipment Management</h1>
            <p className="text-muted-foreground">
              Manage agricultural machinery and equipment
            </p>
          </div>
          {!showCreateForm && (
            <Button onClick={() => setShowCreateForm(true)}>
              <Plus className="mr-2 h-4 w-4" />
              New Equipment
            </Button>
          )}
        </div>

        {/* Company & Farm Selectors */}
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="company-select">
                  <Building2 className="inline mr-2 h-4 w-4" />
                  Company *
                </Label>
                <Select value={selectedCompanyId} onValueChange={handleCompanyChange}>
                  <SelectTrigger id="company-select">
                    <SelectValue placeholder="Select a company" />
                  </SelectTrigger>
                  <SelectContent>
                    {companies.map((company) => (
                      <SelectItem key={company.id} value={company.id}>
                        {company.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="farm-select">
                  <Wheat className="inline mr-2 h-4 w-4" />
                  Farm (Optional)
                </Label>
                <Select value={selectedFarmId || "all"} onValueChange={(value) => setSelectedFarmId(value === "all" ? "" : value)} disabled={!selectedCompanyId}>
                  <SelectTrigger id="farm-select">
                    <SelectValue placeholder={selectedCompanyId ? "All Farms" : "Select company first"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Farms</SelectItem>
                    {filteredFarms.map((farm) => (
                      <SelectItem key={farm.id} value={farm.id}>
                        {farm.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Create/Edit Form */}
        {showCreateForm && (
          <Card>
            <CardHeader>
              <CardTitle>{editingEquipment ? "Edit Equipment" : "Create New Equipment"}</CardTitle>
              <CardDescription>
                {editingEquipment ? "Update equipment information" : "Add new equipment to your fleet"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Equipment Name *</Label>
                    <Input
                      id="name"
                      placeholder="e.g., John Deere 8335R"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="brand">Brand</Label>
                    <Input
                      id="brand"
                      placeholder="e.g., John Deere"
                      value={formData.brand}
                      onChange={(e) => setFormData(prev => ({ ...prev, brand: e.target.value }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="model">Model</Label>
                    <Input
                      id="model"
                      placeholder="e.g., 8335R"
                      value={formData.model}
                      onChange={(e) => setFormData(prev => ({ ...prev, model: e.target.value }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="year">Year</Label>
                    <Input
                      id="year"
                      type="number"
                      placeholder="e.g., 2024"
                      value={formData.year}
                      onChange={(e) => setFormData(prev => ({ ...prev, year: e.target.value }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="plate_number">Plate Number</Label>
                    <Input
                      id="plate_number"
                      placeholder="License plate"
                      value={formData.plate_number}
                      onChange={(e) => setFormData(prev => ({ ...prev, plate_number: e.target.value }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <Select value={formData.status} onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}>
                      <SelectTrigger id="status">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="maintenance">Maintenance</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="category">Category</Label>
                    <Select value={formData.category_id} onValueChange={(value) => setFormData(prev => ({ ...prev, category_id: value }))}>
                      <SelectTrigger id="category">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id}>
                            {cat.emoji} {cat.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="activity">Activity</Label>
                    <Select value={formData.activity_id} onValueChange={(value) => setFormData(prev => ({ ...prev, activity_id: value }))}>
                      <SelectTrigger id="activity">
                        <SelectValue placeholder="Select activity" />
                      </SelectTrigger>
                      <SelectContent>
                        {activities.map((act) => (
                          <SelectItem key={act.id} value={act.id}>
                            {act.emoji} {act.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="form-farm">Farm</Label>
                    <Select value={formData.farm_id || "none"} onValueChange={(value) => setFormData(prev => ({ ...prev, farm_id: value === "none" ? "" : value }))}>
                      <SelectTrigger id="form-farm">
                        <SelectValue placeholder="Select farm (optional)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No Farm</SelectItem>
                        {filteredFarms.map((farm) => (
                          <SelectItem key={farm.id} value={farm.id}>
                            {farm.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Input
                    id="notes"
                    placeholder="Additional notes"
                    value={formData.notes}
                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  />
                </div>

                <div className="flex gap-2">
                  <Button type="submit" disabled={submitting}>
                    {submitting ? "Saving..." : editingEquipment ? "Update Equipment" : "Create Equipment"}
                  </Button>
                  <Button type="button" variant="outline" onClick={handleCancel}>
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Equipment List */}
        {!selectedCompanyId ? (
          <Card>
            <CardContent className="py-12">
              <div className="text-center text-muted-foreground">
                Please select a company to view equipment
              </div>
            </CardContent>
          </Card>
        ) : loading ? (
          <Card>
            <CardContent className="py-12">
              <div className="text-center text-muted-foreground">Loading equipment...</div>
            </CardContent>
          </Card>
        ) : filteredEquipment.length === 0 ? (
          <Card>
            <CardContent className="py-12">
              <div className="text-center">
                <Settings className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Equipment Yet</h3>
                <p className="text-muted-foreground mb-4">
                  Get started by adding your first equipment
                </p>
                <Button onClick={() => setShowCreateForm(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Equipment
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredEquipment.map((eq) => (
              <Card key={eq.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{eq.name}</CardTitle>
                      {eq.brand && eq.model && (
                        <CardDescription className="text-sm mt-1">
                          {eq.brand} {eq.model} {eq.year && `(${eq.year})`}
                        </CardDescription>
                      )}
                    </div>
                    {eq.category_emoji && (
                      <span className="text-3xl">{eq.category_emoji}</span>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  {eq.plate_number && (
                    <div className="text-sm">
                      <span className="font-medium">Plate:</span> {eq.plate_number}
                    </div>
                  )}
                  {eq.activity_name && (
                    <div className="text-sm flex items-center gap-1">
                      {eq.activity_emoji && <span>{eq.activity_emoji}</span>}
                      <span>{eq.activity_name}</span>
                    </div>
                  )}
                  {eq.farm_name && (
                    <div className="text-sm text-muted-foreground flex items-center gap-1">
                      <Wheat className="h-3 w-3" />
                      {eq.farm_name}
                    </div>
                  )}
                  <div className="text-sm">
                    <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                      eq.status === 'active' ? 'bg-green-100 text-green-800' :
                      eq.status === 'maintenance' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {eq.status}
                    </span>
                  </div>
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Calendar className="mr-2 h-3 w-3" />
                    <span>Added {new Date(eq.created_at).toLocaleDateString()}</span>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1"
                      onClick={() => handleEdit(eq)}
                    >
                      <Edit2 className="mr-2 h-3 w-3" />
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1"
                      onClick={() => handleDelete(eq.id, eq.name)}
                    >
                      <Trash2 className="mr-2 h-3 w-3" />
                      Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
