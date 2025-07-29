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
    flowType: 'pkce',
    storageKey: 'tapee-cement-auth'
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
      eventsPerSecond: 5
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
    // Simple session check without timeout to avoid false negatives
    const { data, error } = await supabase.auth.getSession();
    return !error;
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
    
    return true;
  } catch (error) {
    console.error('Error clearing Supabase cache:', error);
    return false;
  }
}

// Function to handle silent connection recovery
export async function recoverConnection(silent: boolean = true) {
  try {
    // Try to refresh the session first
    const { error: refreshError } = await supabase.auth.refreshSession();
    if (refreshError) {
      if (!silent) console.warn('Session refresh failed:', refreshError);
    }
    
    // Try to reconnect
    const isConnected = await checkConnection();
    
    if (!isConnected) {
      // For silent recovery, just return false without aggressive actions
      if (silent) {
        return false;
      } else {
        // Clear cache and try once more only if not silent
        clearSupabaseCache();
        const retryConnected = await checkConnection();
        if (!retryConnected) {
          console.warn('Connection recovery failed');
          return false;
        }
      }
    }
    
    return true;
  } catch (error) {
    if (!silent) console.error('Error recovering connection:', error);
    return false;
  }
}

// Background connection manager
class BackgroundConnectionManager {
  private isRunning = false;
  private checkInterval: NodeJS.Timeout | null = null;
  private recoveryAttempts = 0;
  private maxRecoveryAttempts = 3;
  
  start() {
    if (this.isRunning) return;
    
    this.isRunning = true;
    this.recoveryAttempts = 0;
    
    // Check connection every 2 minutes
    this.checkInterval = setInterval(async () => {
      await this.performBackgroundCheck();
    }, 2 * 60 * 1000);
  }
  
  stop() {
    this.isRunning = false;
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }
  
  private async performBackgroundCheck() {
    try {
      const isConnected = await checkConnection();
      
      if (!isConnected && this.recoveryAttempts < this.maxRecoveryAttempts) {
        this.recoveryAttempts++;
        
        // Try silent recovery
        const recovered = await recoverConnection(true);
        
        if (recovered) {
          this.recoveryAttempts = 0; // Reset on successful recovery
        } else if (this.recoveryAttempts >= this.maxRecoveryAttempts) {
          // After max attempts, do a silent page refresh
          setTimeout(() => {
            window.location.reload();
          }, 5000); // Wait 5 seconds before refresh
        }
      } else if (isConnected) {
        this.recoveryAttempts = 0; // Reset on successful connection
      }
    } catch (error) {
      // Silent error handling
      console.debug('Background connection check failed:', error);
    }
  }
}

export const backgroundConnectionManager = new BackgroundConnectionManager();