import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User as SupabaseUser } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: 'builder' | 'dealer' | 'contractor' | 'admin';
  city: string;
  address: string;
  district: string;
  gst_number: string | null;
  mobile_number: string;
  user_code: string;
  points: number;
  profile_picture_url: string | null;
  created_at: string;
  updated_at: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signUp: (userData: SignUpData) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error?: string }>;
  updateProfile: (updates: Partial<User>) => Promise<{ error?: string }>;
}

interface SignUpData {
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

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // For development mode, create a mock user if no real Supabase connection
    const isDevelopment = import.meta.env.VITE_SUPABASE_URL?.includes('placeholder');
    
    if (isDevelopment) {
      console.log('Running in development mode with mock data');
      // Create a mock user for development
      const mockUser: User = {
        id: 'mock-user-id',
        email: 'demo@example.com',
        first_name: 'Demo',
        last_name: 'User',
        role: 'builder',
        city: 'Demo City',
        address: '123 Demo Street',
        district: 'Demo District',
        gst_number: null,
        mobile_number: '+1234567890',
        user_code: 'BUILDER-123456',
        points: 150,
        profile_picture_url: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      setUser(mockUser);
      setLoading(false);
      return;
    }

    // Get initial session
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        console.error('Error getting session:', error);
        setLoading(false);
        return;
      }
      
      if (session?.user) {
        fetchUserProfile(session.user);
      } else {
        setLoading(false);
      }
    }).catch((error) => {
      console.error('Error in getSession:', error);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.id);
        
        if (session?.user) {
          await fetchUserProfile(session.user);
        } else {
          setUser(null);
          setLoading(false);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserProfile = async (authUser: SupabaseUser) => {
    try {
      console.log('Fetching user profile for:', authUser.id);
      
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single();

      if (error) {
        console.error('Error fetching user profile:', error);
        setUser(null);
      } else if (data) {
        console.log('User profile fetched successfully:', data);
        setUser(data);
      } else {
        console.error('No user data returned');
        setUser(null);
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      console.log('Attempting to sign in:', email);
      
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('Sign in error:', error);
        return { error: error.message };
      }

      console.log('Sign in successful');
      return {};
    } catch (error) {
      console.error('Unexpected sign in error:', error);
      return { error: 'An unexpected error occurred' };
    }
  };

  const signUp = async (userData: SignUpData) => {
    try {
      console.log('Attempting to sign up:', userData.email);
      
      // Generate user code
      const userCode = `${userData.role.toUpperCase()}-${Date.now()}`;

      // Sign up with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
      });

      if (authError) {
        console.error('Auth signup error:', authError);
        return { error: authError.message };
      }

      if (!authData.user) {
        return { error: 'Failed to create user account' };
      }

      console.log('Auth user created, creating profile...');

      // Create user profile
      const { error: profileError } = await supabase
        .from('users')
        .insert({
          id: authData.user.id,
          email: userData.email,
          first_name: userData.first_name,
          last_name: userData.last_name,
          role: userData.role,
          city: userData.city,
          address: userData.address,
          district: userData.district,
          gst_number: userData.gst_number || null,
          mobile_number: userData.mobile_number,
          user_code: userCode,
        });

      if (profileError) {
        console.error('Profile creation error:', profileError);
        return { error: profileError.message };
      }

      console.log('User profile created successfully');
      return {};
    } catch (error) {
      console.error('Unexpected signup error:', error);
      return { error: 'An unexpected error occurred' };
    }
  };

  const signOut = async () => {
    try {
      console.log('Signing out...');
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const resetPassword = async (email: string) => {
    try {
      console.log('Resetting password for:', email);
      
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        console.error('Password reset error:', error);
        return { error: error.message };
      }

      console.log('Password reset email sent');
      return {};
    } catch (error) {
      console.error('Unexpected password reset error:', error);
      return { error: 'An unexpected error occurred' };
    }
  };

  const updateProfile = async (updates: Partial<User>) => {
    if (!user) return { error: 'No user logged in' };

    try {
      console.log('Updating profile:', updates);
      
      const { error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', user.id);

      if (error) {
        console.error('Profile update error:', error);
        return { error: error.message };
      }

      // Update local user state
      setUser({ ...user, ...updates });
      console.log('Profile updated successfully');
      return {};
    } catch (error) {
      console.error('Unexpected profile update error:', error);
      return { error: 'An unexpected error occurred' };
    }
  };

  const value = {
    user,
    loading,
    signIn,
    signUp,
    signOut,
    resetPassword,
    updateProfile,
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
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export { AuthContext }