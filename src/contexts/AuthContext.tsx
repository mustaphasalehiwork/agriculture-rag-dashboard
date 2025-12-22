"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, Session, AuthError } from "@supabase/supabase-js";
import { getSupabaseClient } from "@/lib/supabase";
import { toast } from "sonner";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  isAdmin: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = getSupabaseClient();

  useEffect(() => {
    // Get initial session
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    };

    getSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session);
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);

        if (event === 'SIGNED_IN') {
          toast.success("Welcome!");
        } else if (event === 'SIGNED_OUT') {
          toast.success("Successfully signed out");
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [supabase.auth]);

  const signIn = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      console.log('Attempting login with:', { email, passwordLength: password.length });

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      console.log('Login result:', { data, error });

      if (error) {
        console.error('Login error:', error);
        toast.error(error.message);
        return { success: false, error: error.message };
      }

      console.log('Login successful:', data);
      return { success: true };
    } catch (err) {
      console.error('Login exception:', err);
      const errorMessage = "Login failed";
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  const signOut = async (): Promise<void> => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      toast.error("Logout failed");
      console.error('Sign out error:', error);
    }
  };

  const isAdmin = (): boolean => {
    if (!user) return false;

    // Check if user email is admin (you can customize this logic)
    const adminEmails = [
      'admin@agriculture-dashboard.com',
      'admin@example.com',
      'pranc14@gmail.com',
    ];

    return adminEmails.includes(user.email || '');
  };

  const value: AuthContextType = {
    user,
    session,
    loading,
    signIn,
    signOut,
    isAdmin,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}