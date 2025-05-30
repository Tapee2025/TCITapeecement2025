import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { Database } from '../lib/database.types';
import { toast } from 'react-toastify';

type User = Database['public']['Tables']['users']['Row'];

interface AuthContextType {
  currentUser: User | null;
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
    // Initial auth check
    checkUser();

    // Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        fetchUserProfile(session.user.id);
      } else {
        setCurrentUser(null);
        setLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  async function checkUser() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await fetchUserProfile(user.id);
      } else {
        setCurrentUser(null);
      }
    } catch (error) {
      console.error('Error checking auth state:', error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchUserProfile(userId: string) {
    try {
      const { data: profile, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
      setCurrentUser(profile);
    } catch (error) {
      console.error('Error fetching user profile:', error);
      setCurrentUser(null);
    }
  }

  async function login(email: string, password: string) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;

      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', data.user.id)
        .single();

      if (profileError) throw profileError;
      setCurrentUser(profile);
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  async function register(data: RegisterData) {
    const { email, password, ...profileData } = data;
    
    try {
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
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  }

  async function logout() {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setCurrentUser(null);
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  }

  async function resetPassword(email: string) {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      if (error) throw error;
    } catch (error) {
      console.error('Password reset error:', error);
      throw error;
    }
  }

  const value = {
    currentUser,
    loading,
    login,
    register,
    logout,
    resetPassword
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}