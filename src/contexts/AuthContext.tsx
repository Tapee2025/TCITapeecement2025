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
  refreshUser: () => Promise<void>;
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
    let authSubscription: any = null;

    const initializeAuth = async () => {
      try {
        // Get the current session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) {
          console.error('Session error:', sessionError);
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

        // Listen for auth state changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
          if (!mounted) return;

          console.log('Auth state changed:', event);

          try {
            if (event === 'SIGNED_IN' && session?.user) {
              await fetchUserProfile(session.user.id);
            } else if (event === 'SIGNED_OUT') {
              setCurrentUser(null);
              setLoading(false);
            } else if (event === 'TOKEN_REFRESHED' && session?.user) {
              // Keep user logged in when token is refreshed
              await fetchUserProfile(session.user.id);
            }
          } catch (error) {
            console.error('Auth state change error:', error);
            if (mounted) {
              setCurrentUser(null);
              setLoading(false);
            }
          }
        });

        authSubscription = subscription;
      } catch (error) {
        console.error('Auth initialization error:', error);
        if (mounted) {
          setCurrentUser(null);
          setLoading(false);
        }
      }
    };

    initializeAuth();

    return () => {
      mounted = false;
      if (authSubscription) {
        authSubscription.unsubscribe();
      }
    };
  }, []);

  async function fetchUserProfile(userId: string) {
    try {
      console.log('Fetching user profile for:', userId);
      
      const { data: profile, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.error('Profile fetch error:', error);
        setCurrentUser(null);
      } else if (!profile) {
        console.log('No user profile found for authenticated user, signing out');
        await supabase.auth.signOut();
        setCurrentUser(null);
      } else {
        console.log('User profile loaded:', profile);
        setCurrentUser(profile);
        
        // Navigate to appropriate dashboard based on role
        if (typeof window !== 'undefined') {
          const currentPath = window.location.pathname;
          
          // Only redirect if we're on the login page or root
          if (currentPath === '/login' || currentPath === '/') {
            if (profile.role === 'admin') {
              window.location.href = '/admin/dashboard';
            } else if (profile.role === 'dealer') {
              window.location.href = '/dealer/dashboard';
            } else {
              window.location.href = '/dashboard';
            }
          }
        }
      }
    } catch (error) {
      console.error('Profile fetch error:', error);
      setCurrentUser(null);
    } finally {
      setLoading(false);
    }
  }

  async function refreshUser() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await fetchUserProfile(user.id);
      }
    } catch (error) {
      console.error('Error refreshing user:', error);
    }
  }

  async function login(email: string, password: string) {
    try {
      setLoading(true);
      console.log('Attempting login...');
      
      const { data, error } = await supabase.auth.signInWithPassword({ 
        email, 
        password 
      });
      
      if (error) {
        console.error('Login error:', error);
        throw error;
      }
      
      console.log('Login successful, user:', data.user?.id);
      
      if (data.user) {
        await fetchUserProfile(data.user.id);
      }
    } catch (error) {
      setLoading(false);
      throw error;
    }
  }

  async function register(data: RegisterData) {
    const { email, password, ...profileData } = data;
    try {
      setLoading(true);
      const { data: authData, error: signUpError } = await supabase.auth.signUp({ 
        email, 
        password 
      });
      
      if (signUpError) throw signUpError;
      if (!authData.user) throw new Error('Failed to create user');
      
      const { error: profileError } = await supabase
        .from('users')
        .insert([{ 
          id: authData.user.id, 
          email, 
          ...profileData, 
          points: 0 
        }]);
      
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
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  }

  async function resetPassword(email: string) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) throw error;
  }

  const value = {
    currentUser,
    userData: currentUser,
    loading,
    login,
    register,
    logout,
    resetPassword,
    refreshUser
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}