"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { Users, Shield, UserPlus, Trash2, Mail, Calendar } from "lucide-react";
import { toast } from "sonner";
import { getSupabaseClient } from "@/lib/supabase";

interface UserProfile {
  id: string;
  email: string;
  created_at: string;
  last_sign_in_at: string | null;
  user_metadata: {
    name?: string;
    role?: string;
  };
}

export default function UsersManagementPage() {
  const { user, isAdmin } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateUser, setShowCreateUser] = useState(false);
  const [newUser, setNewUser] = useState({
    email: "",
    password: "",
    name: ""
  });
  const [creatingUser, setCreatingUser] = useState(false);

  // Redirect if not admin
  useEffect(() => {
    if (user && !isAdmin()) {
      window.location.href = "/dashboard";
    }
  }, [user, isAdmin]);

  useEffect(() => {
    if (isAdmin()) {
      fetchUsers();
    }
  }, [isAdmin]);

  const fetchUsers = async () => {
    try {
      // Get session token
      const { data: { session } } = await getSupabaseClient().auth.getSession();

      if (!session) {
        toast.error("Not authenticated");
        setLoading(false);
        return;
      }

      const response = await fetch('/api/admin/users', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch users');
      }

      const data = await response.json();

      // Transform Supabase users to UserProfile format
      const transformedUsers: UserProfile[] = data.users.map((u: any) => ({
        id: u.id,
        email: u.email,
        created_at: u.created_at,
        last_sign_in_at: u.last_sign_in_at,
        user_metadata: u.user_metadata || {}
      }));

      setUsers(transformedUsers);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error(error instanceof Error ? error.message : "Error fetching user information");
      setLoading(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUser.email || !newUser.password) {
      toast.error("Email and password are required");
      return;
    }

    setCreatingUser(true);
    try {
      // Get session token
      const { data: { session } } = await getSupabaseClient().auth.getSession();

      if (!session) {
        toast.error("Not authenticated");
        return;
      }

      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          email: newUser.email,
          password: newUser.password,
          name: newUser.name
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create user');
      }

      const data = await response.json();

      toast.success("New user created successfully");
      setNewUser({ email: "", password: "", name: "" });
      setShowCreateUser(false);
      fetchUsers();
    } catch (error) {
      console.error("Error creating user:", error);
      toast.error(error instanceof Error ? error.message : "Error creating new user");
    } finally {
      setCreatingUser(false);
    }
  };

  const handleDeleteUser = async (userId: string, email: string) => {
    if (email === user?.email) {
      toast.error("Cannot delete your own account");
      return;
    }

    if (!confirm(`Are you sure you want to delete user ${email}?`)) {
      return;
    }

    try {
      // Get session token
      const { data: { session } } = await getSupabaseClient().auth.getSession();

      if (!session) {
        toast.error("Not authenticated");
        return;
      }

      const response = await fetch('/api/admin/users', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ userId })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete user');
      }

      toast.success("User deleted successfully");
      fetchUsers();
    } catch (error) {
      console.error("Error deleting user:", error);
      toast.error(error instanceof Error ? error.message : "Error deleting user");
    }
  };

  if (!user || !isAdmin()) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Unauthorized access</p>
      </div>
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
            <Users className="h-8 w-8" />
            User Management
          </h1>
          <p className="text-muted-foreground mt-2">
            Manage user access and system users
          </p>
        </div>

        <Button
          onClick={() => setShowCreateUser(!showCreateUser)}
          className="flex items-center gap-2"
        >
          <UserPlus className="h-4 w-4" />
          New User
        </Button>
      </div>

      {showCreateUser && (
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Create New User</CardTitle>
            <CardDescription>
              Enter new user information
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateUser} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="user@example.com"
                    value={newUser.email}
                    onChange={(e) => setNewUser(prev => ({ ...prev, email: e.target.value }))}
                    required
                    dir="ltr"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Minimum 6 characters"
                    value={newUser.password}
                    onChange={(e) => setNewUser(prev => ({ ...prev, password: e.target.value }))}
                    required
                    minLength={6}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">Full Name ((Optional))</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="User Name"
                  value={newUser.name}
                  onChange={(e) => setNewUser(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={creatingUser}>
                  {creatingUser ? "Creating..." : "Create User"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowCreateUser(false)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {users.map((userProfile) => (
          <Card key={userProfile.id} className="relative">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <Mail className="h-4 w-4" />
                  </div>
                  <div>
                    <CardTitle className="text-sm font-medium">
                      {userProfile.user_metadata.name || userProfile.email}
                    </CardTitle>
                    <CardDescription className="text-xs">
                      {userProfile.email}
                    </CardDescription>
                  </div>
                </div>
                {userProfile.user_metadata.role === 'admin' && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <Shield className="h-3 w-3" />
                    Admin
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  Created: {new Date(userProfile.created_at).toLocaleDateString('en-US')}
                </div>
                {userProfile.last_sign_in_at && (
                  <span>
                    Last login: {new Date(userProfile.last_sign_in_at).toLocaleDateString('en-US')}
                  </span>
                )}
              </div>

              {userProfile.email !== user.email && (
                <div className="mt-3 flex gap-2">
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleDeleteUser(userProfile.id, userProfile.email)}
                    className="flex items-center gap-1"
                  >
                    <Trash2 className="h-3 w-3" />
                    Delete
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {users.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Users className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No users created yet</p>
            <Button
              onClick={() => setShowCreateUser(true)}
              className="mt-4"
            >
              Create First User
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}