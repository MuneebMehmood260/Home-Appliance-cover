import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { AdminProfile } from '../types';
import toast from 'react-hot-toast';

interface AuthContextType {
  user: AdminProfile | null;
  isAdmin: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  changePassword: (newPassword: string) => Promise<boolean>;
  isDemoMode: boolean;
}

const LOCAL_ADMIN_STORAGE_KEY = 'hac_demo_admin_auth_v1';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AdminProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const isDemo = !isSupabaseConfigured();

  const checkAdminStatus = async (userId: string, email: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase
        .from('admins')
        .select('*')
        .eq('id', userId)
        .single();

      if (!error && data) {
        setUser({
          id: data.id,
          email: data.email || email,
          full_name: data.full_name || 'Admin',
          role: data.role || 'admin',
          created_at: data.created_at,
        });
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  useEffect(() => {
    const initializeAuth = async () => {
      setIsLoading(true);

      if (isDemo) {
        // Check local demo admin session
        try {
          const stored = localStorage.getItem(LOCAL_ADMIN_STORAGE_KEY);
          if (stored) {
            setUser(JSON.parse(stored));
          }
        } catch {
          // ignore
        }
        setIsLoading(false);
        return;
      }

      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const authorized = await checkAdminStatus(session.user.id, session.user.email || '');
          if (!authorized) {
            setUser(null);
          }
        }
      } catch (err) {
        console.warn('Auth check error', err);
      } finally {
        setIsLoading(false);
      }

      // Supabase auth state change listener
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        async (_event, session) => {
          if (session?.user) {
            await checkAdminStatus(session.user.id, session.user.email || '');
          } else {
            setUser(null);
          }
          setIsLoading(false);
        }
      );

      return () => {
        subscription.unsubscribe();
      };
    };

    initializeAuth();
  }, [isDemo]);

  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);

    if (isDemo) {
      // Demo / Local Sandbox Authentication
      // Allows immediate testing of all admin capabilities
      if (
        (email.trim().toLowerCase() === 'admin@homeappliancecovers.pk' && password === 'admin123') ||
        (email.trim().toLowerCase() === 'admin@demo.com' && password === 'admin123') ||
        (password.length >= 6 && email.includes('@'))
      ) {
        const demoUser: AdminProfile = {
          id: 'demo-admin-id-001',
          email: email.trim().toLowerCase(),
          full_name: 'Store Administrator',
          role: 'super_admin',
          created_at: new Date().toISOString(),
        };
        setUser(demoUser);
        localStorage.setItem(LOCAL_ADMIN_STORAGE_KEY, JSON.stringify(demoUser));
        toast.success('Signed in as Administrator');
        setIsLoading(false);
        return true;
      } else {
        toast.error('Invalid credentials. In Demo mode, use password with 6+ characters or admin@homeappliancecovers.pk / admin123');
        setIsLoading(false);
        return false;
      }
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error || !data.user) {
        toast.error(error?.message || 'Login failed. Please check your credentials.');
        setIsLoading(false);
        return false;
      }

      // Verify that this user exists in public.admins table
      const isAuthorized = await checkAdminStatus(data.user.id, data.user.email || email);
      if (!isAuthorized) {
        await supabase.auth.signOut();
        setUser(null);
        toast.error('Access Denied: Your account is not registered in the admins table.');
        setIsLoading(false);
        return false;
      }

      toast.success('Admin login successful!');
      setIsLoading(false);
      return true;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'An unexpected error occurred';
      toast.error(message);
      setIsLoading(false);
      return false;
    }
  };

  const logout = async (): Promise<void> => {
    if (isDemo) {
      localStorage.removeItem(LOCAL_ADMIN_STORAGE_KEY);
      setUser(null);
      toast.success('Logged out successfully');
      return;
    }

    try {
      await supabase.auth.signOut();
      setUser(null);
      toast.success('Logged out successfully');
    } catch (err) {
      console.warn('Logout error', err);
    }
  };

  const changePassword = async (newPassword: string): Promise<boolean> => {
    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters long.');
      return false;
    }

    if (isDemo) {
      toast.success('Password updated successfully (Demo Mode)');
      return true;
    }

    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) {
        toast.error(error.message);
        return false;
      }
      toast.success('Your admin password has been changed successfully.');
      return true;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to update password';
      toast.error(message);
      return false;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAdmin: Boolean(user),
        isLoading,
        login,
        logout,
        changePassword,
        isDemoMode: isDemo,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
