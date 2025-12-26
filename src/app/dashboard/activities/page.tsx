"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useActivity } from "@/contexts/ActivityContext";
import { useAuth } from "@/contexts/AuthContext";
import { Activity, Plus, Trash2, Edit2, Calendar, Wrench } from "lucide-react";
import { toast } from "sonner";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

export default function ActivitiesManagementPage() {
  const { user, isAdmin } = useAuth();
  const { activities, loading, createActivity, updateActivity, deleteActivity } = useActivity();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingActivity, setEditingActivity] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    emoji: "",
    description: ""
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

    setSubmitting(true);
    try {
      const data = {
        name: formData.name,
        slug: formData.slug,
        emoji: formData.emoji || undefined,
        description: formData.description || undefined
      };

      if (editingActivity) {
        const result = await updateActivity(editingActivity.id, data);
        if (!result.success) {
          toast.error(result.error || "Failed to update activity");
          return;
        }
      } else {
        const result = await createActivity(data);
        if (!result.success) {
          toast.error(result.error || "Failed to create activity");
          return;
        }
      }

      toast.success(editingActivity ? "Activity updated successfully" : "Activity created successfully");
      setFormData({ name: "", slug: "", emoji: "", description: "" });
      setShowCreateForm(false);
      setEditingActivity(null);
    } catch (error) {
      console.error("Error saving activity:", error);
      toast.error("Failed to save activity");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (activityId: string, activityName: string) => {
    if (!confirm(`Are you sure you want to delete ${activityName}?`)) {
      return;
    }

    const result = await deleteActivity(activityId);
    if (!result.success) {
      toast.error(result.error || "Failed to delete activity");
      return;
    }

    toast.success("Activity deleted successfully");
  };

  const handleEdit = (activity: any) => {
    setEditingActivity(activity);
    setFormData({
      name: activity.name,
      slug: activity.slug,
      emoji: activity.emoji || "",
      description: activity.description || ""
    });
    setShowCreateForm(true);
  };

  const handleCancel = () => {
    setShowCreateForm(false);
    setEditingActivity(null);
    setFormData({ name: "", slug: "", emoji: "", description: "" });
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const handleNameChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      name: value,
      slug: editingActivity ? prev.slug : generateSlug(value)
    }));
  };

  return (
    <ProtectedRoute>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Agricultural Activities</h1>
            <p className="text-muted-foreground">
              Manage agricultural activities and operations
            </p>
          </div>
          {!showCreateForm && (
            <Button onClick={() => setShowCreateForm(true)}>
              <Plus className="mr-2 h-4 w-4" />
              New Activity
            </Button>
          )}
        </div>

        {/* Create/Edit Form */}
        {showCreateForm && (
          <Card>
            <CardHeader>
              <CardTitle>{editingActivity ? "Edit Activity" : "Create New Activity"}</CardTitle>
              <CardDescription>
                {editingActivity ? "Update activity information" : "Add a new agricultural activity"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Activity Name *</Label>
                    <Input
                      id="name"
                      placeholder="e.g., Plantadeira"
                      value={formData.name}
                      onChange={(e) => handleNameChange(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="slug">Slug *</Label>
                    <Input
                      id="slug"
                      placeholder="e.g., plantadeira"
                      value={formData.slug}
                      onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="emoji">Emoji Icon</Label>
                    <Input
                      id="emoji"
                      placeholder="e.g., 🌱"
                      value={formData.emoji}
                      onChange={(e) => setFormData(prev => ({ ...prev, emoji: e.target.value }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Input
                      id="description"
                      placeholder="Brief description of the activity"
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button type="submit" disabled={submitting}>
                    {submitting ? "Saving..." : editingActivity ? "Update Activity" : "Create Activity"}
                  </Button>
                  <Button type="button" variant="outline" onClick={handleCancel}>
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Activities Grid */}
        {loading ? (
          <Card>
            <CardContent className="py-12">
              <div className="text-center text-muted-foreground">Loading activities...</div>
            </CardContent>
          </Card>
        ) : activities.length === 0 ? (
          <Card>
            <CardContent className="py-12">
              <div className="text-center">
                <Wrench className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Activities Yet</h3>
                <p className="text-muted-foreground mb-4">
                  Get started by creating your first agricultural activity
                </p>
                <Button onClick={() => setShowCreateForm(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create First Activity
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activities.map((activity) => (
              <Card key={activity.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      {activity.emoji && (
                        <span className="text-3xl">{activity.emoji}</span>
                      )}
                      <div>
                        <CardTitle className="text-lg">{activity.name}</CardTitle>
                        {activity.description && (
                          <CardDescription className="text-sm mt-1">
                            {activity.description}
                          </CardDescription>
                        )}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Activity className="mr-2 h-4 w-4" />
                    <span className="font-mono">{activity.slug}</span>
                  </div>

                  <div className="flex items-center text-sm text-muted-foreground">
                    <Calendar className="mr-2 h-4 w-4" />
                    <span>
                      Created {new Date(activity.created_at).toLocaleDateString()}
                    </span>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1"
                      onClick={() => handleEdit(activity)}
                    >
                      <Edit2 className="mr-2 h-3 w-3" />
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1"
                      onClick={() => handleDelete(activity.id, activity.name)}
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
