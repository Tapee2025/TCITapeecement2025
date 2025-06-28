import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables:', {
    url: !!supabaseUrl,
    key: !!supabaseAnonKey
  });
  throw new Error('Missing Supabase environment variables. Please check your .env file and ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set.');
}

// Create a single instance of the Supabase client
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storage: window.localStorage,
    flowType: 'pkce'
  },
  global: {
    headers: {
      'X-Client-Info': 'supabase-js-web'
    }
  },
  db: {
    schema: 'public'
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
});

// Helper function to get profile picture URL
export function getProfilePictureUrl(fileName: string | null): string {
  if (!fileName) return '';
  
  try {
    // Check if it's already a full URL
    if (fileName.startsWith('http')) {
      return fileName;
    }
    
    // Create the full URL for Supabase storage
    const { data } = supabase.storage
      .from('avatars')
      .getPublicUrl(fileName);
    
    return data.publicUrl;
  } catch (error) {
    console.error('Error getting profile picture URL:', error);
    return '';
  }
}

// Connection health check with timeout
export async function checkConnection(): Promise<boolean> {
  try {
    // Set a timeout for the connection check
    const timeoutPromise = new Promise<boolean>((_, reject) => {
      setTimeout(() => reject(new Error('Connection check timed out')), 5000);
    });
    
    // Actual connection check
    const connectionPromise = new Promise<boolean>(async (resolve) => {
      try {
        const { error } = await supabase.from('users').select('id').limit(1);
        resolve(!error);
      } catch {
        resolve(false);
      }
    });
    
    // Race the connection check against the timeout
    return await Promise.race([connectionPromise, timeoutPromise]);
  } catch {
    return false;
  }
}

// Function to clear Supabase cache
export function clearSupabaseCache() {
  try {
    // Clear localStorage items related to Supabase
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('sb-') || key.includes('supabase')) {
        localStorage.removeItem(key);
      }
    });
    
    // Force refresh auth session
    supabase.auth.refreshSession();
    
    return true;
  } catch (error) {
    console.error('Error clearing Supabase cache:', error);
    return false;
  }
}

// Function to handle connection recovery
export async function recoverConnection() {
  try {
    // Clear cache first
    clearSupabaseCache();
    
    // Try to reconnect
    const isConnected = await checkConnection();
    
    if (!isConnected) {
      // If still not connected, try to refresh the page
      window.location.reload();
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error recovering connection:', error);
    return false;
  }
}