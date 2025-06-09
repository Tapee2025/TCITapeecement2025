import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { Database } from '../lib/database.types';

type User = Database['public']['Tables']['users']['Row'];

interface AuthContextType {
  currentUser: User | null;
  userData: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}

interface RegisterData {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  role: 'builder' | 'dealer' | 'contractor';
  city: string;
  address: string;
  district: string;
  gst_number?: string;
  mobile_number: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) {
          if (mounted) {
            setCurrentUser(null);
            setLoading(false);
          }
          return;
        }

        if (session?.user && mounted) {
          await fetchUserProfile(session.user.id);
        } else if (mounted) {
          setCurrentUser(null);
          setLoading(false);
        }

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
          if (!mounted) return;

          if (event === 'SIGNED_IN' && session?.user) {
            await fetchUserProfile(session.user.id);
          } else if (event === 'SIGNED_OUT') {
            setCurrentUser(null);
            setLoading(false);
          }
        });

        return () => {
          subscription.unsubscribe();
        };
      } catch {
        if (mounted) {
          setCurrentUser(null);
          setLoading(false);
        }
      }
    };

    initializeAuth();

    return () => {
      mounted = false;
    };
  }, []);

  async function fetchUserProfile(userId: string) {
    try {
      const { data: profile, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        setCurrentUser(null);
      } else {
        setCurrentUser(profile);
      }
    } catch {
      setCurrentUser(null);
    } finally {
      setLoading(false);
    }
  }

  async function login(email: string, password: string) {
    try {
      setLoading(true);
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      if (data.user) await fetchUserProfile(data.user.id);
    } finally {
      setLoading(false);
    }
  }

  async function register(data: RegisterData) {
    const { email, password, ...profileData } = data;
    try {
      setLoading(true);
      const { data: authData, error: signUpError } = await supabase.auth.signUp({ email, password });
      if (signUpError) throw signUpError;
      if (!authData.user) throw new Error('Failed to create user');
      const { error: profileError } = await supabase
        .from('users')
        .insert([{ id: authData.user.id, email, ...profileData, points: 0 }]);
      if (profileError) throw profileError;
    } finally {
      setLoading(false);
    }
  }

  async function logout() {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setCurrentUser(null);
    } finally {
      setLoading(false);
    }
  }

  async function resetPassword(email: string) {
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) throw error;
  }

  const value = {
    currentUser,
    userData: currentUser,
    loading,
    login,
    register,
    logout,
    resetPassword
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
