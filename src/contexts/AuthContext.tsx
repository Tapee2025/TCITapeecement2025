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
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    let mounted = true;
    let authSubscription: any = null;

    const initializeAuth = async () => {
      try {
        // Get the current session with retry logic
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

        // Listen for auth state changes with error handling
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
          if (!mounted) return;

          console.log('Auth state changed:', event, session?.user?.id);

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
            // Don't set loading to false here to allow retry
          }
        });

        authSubscription = subscription;
      } catch (error) {
        console.error('Auth initialization error:', error);
        if (mounted && retryCount < 3) {
          // Retry initialization up to 3 times
          setTimeout(() => {
            setRetryCount(prev => prev + 1);
          }, 1000 * (retryCount + 1)); // Exponential backoff
        } else if (mounted) {
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
  }, [retryCount]);

  async function fetchUserProfile(userId: string, retries = 3) {
    try {
      const { data: profile, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Profile fetch error:', error);
        
        // Retry logic for network errors
        if (retries > 0 && (error.message.includes('Failed to fetch') || error.message.includes('network'))) {
          console.log(`Retrying profile fetch... ${retries} attempts remaining`);
          setTimeout(() => {
            fetchUserProfile(userId, retries - 1);
          }, 1000);
          return;
        }
        
        setCurrentUser(null);
      } else {
        setCurrentUser(profile);
      }
    } catch (error) {
      console.error('Profile fetch error:', error);
      
      // Retry logic for unexpected errors
      if (retries > 0) {
        console.log(`Retrying profile fetch... ${retries} attempts remaining`);
        setTimeout(() => {
          fetchUserProfile(userId, retries - 1);
        }, 1000);
        return;
      }
      
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
      const { data, error } = await supabase.auth.signInWithPassword({ 
        email, 
        password 
      });
      
      if (error) throw error;
      
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