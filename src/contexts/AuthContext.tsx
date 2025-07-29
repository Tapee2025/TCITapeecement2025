import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { Database } from '../lib/database.types';
import { toast } from 'react-toastify';

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
  role: 'dealer' | 'contractor';
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
  const [authSubscription, setAuthSubscription] = useState<{ unsubscribe: () => void } | null>(null);

  // Helper function to check if error is session_not_found
  const isSessionNotFoundError = (error: any): boolean => {
    return error?.message?.includes('session_not_found') || 
           error?.code === 'session_not_found' ||
           (error?.status === 403 && error?.message?.includes('Session from session_id claim in JWT does not exist'));
  };

  // Use useCallback to memoize the fetchUserProfile function
  const fetchUserProfile = useCallback(async (userId: string) => {
    try {
      console.log('Fetching user profile for:', userId);
      
      const { data: profile, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.error('Profile fetch error:', error);
        
        // Check if this is a session_not_found error
        if (isSessionNotFoundError(error)) {
          console.log('Session not found, signing out...');
          await supabase.auth.signOut();
          setCurrentUser(null);
          return;
        }
        
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
      
      // Check if this is a session_not_found error
      if (isSessionNotFoundError(error)) {
        console.log('Session not found, signing out...');
        await supabase.auth.signOut();
      }
      
      setCurrentUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        // Get the current session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) {
          console.error('Session error:', sessionError);
          
          // Check if this is a session_not_found error
          if (isSessionNotFoundError(sessionError)) {
            console.log('Session not found during initialization, signing out...');
            await supabase.auth.signOut();
          }
          
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

          console.debug('Auth state changed:', event);

          try {
            if (event === 'SIGNED_IN' && session?.user) {
              await fetchUserProfile(session.user.id);
            } else if (event === 'SIGNED_OUT') {
              setCurrentUser(null);
              setLoading(false);
            } else if (event === 'TOKEN_REFRESHED' && session?.user) {
              // Keep user logged in when token is refreshed - but don't refetch profile unnecessarily
              if (!currentUser || currentUser.id !== session.user.id) {
                await fetchUserProfile(session.user.id);
              }
            }
          } catch (error) {
            console.debug('Auth state change error:', error);
            
            // Check if this is a session_not_found error
            if (isSessionNotFoundError(error)) {
              console.debug('Session not found during auth state change, signing out...');
              await supabase.auth.signOut();
            }
            
            if (mounted) {
              setCurrentUser(null);
              setLoading(false);
            }
          }
        });

        setAuthSubscription(subscription);
      } catch (error) {
        console.error('Auth initialization error:', error);
        
        // Check if this is a session_not_found error
        if (isSessionNotFoundError(error)) {
          console.log('Session not found during initialization, signing out...');
          await supabase.auth.signOut();
        }
        
        if (mounted) {
          setCurrentUser(null);
          setLoading(false);
        }
      }
    };

    initializeAuth();

    return () => {
      mounted = false;
      // Clean up subscription when component unmounts
      if (authSubscription) {
        authSubscription.unsubscribe();
      }
    };
  }, [fetchUserProfile]);

  const refreshUser = useCallback(async () => {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error) {
        // Check if this is a session_not_found error
        if (isSessionNotFoundError(error)) {
          console.log('Session not found during user refresh, signing out...');
          await supabase.auth.signOut();
          return;
        }
        throw error;
      }
      
      if (user) {
        await fetchUserProfile(user.id);
      }
    } catch (error) {
      console.error('Error refreshing user:', error);
      
      // Check if this is a session_not_found error
      if (isSessionNotFoundError(error)) {
        console.log('Session not found during user refresh, signing out...');
        await supabase.auth.signOut();
      }
    }
  }, [fetchUserProfile]);

  const login = useCallback(async (email: string, password: string) => {
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
  }, [fetchUserProfile]);

  const register = useCallback(async (data: RegisterData) => {
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
  }, []);

  const logout = useCallback(async () => {
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
  }, []);

  const resetPassword = useCallback(async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) throw error;
  }, []);

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