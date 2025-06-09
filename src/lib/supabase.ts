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

// Add connection monitoring
let isOnline = navigator.onLine;
let reconnectAttempts = 0;
const maxReconnectAttempts = 5;

// Monitor online/offline status
window.addEventListener('online', () => {
  console.log('Connection restored');
  isOnline = true;
  reconnectAttempts = 0;
});

window.addEventListener('offline', () => {
  console.log('Connection lost');
  isOnline = false;
});

// Enhanced error handling for network issues
const originalFrom = supabase.from;
supabase.from = function(table: string) {
  const query = originalFrom.call(this, table);
  
  // Wrap query methods with retry logic
  const originalSelect = query.select;
  query.select = function(...args: any[]) {
    const selectQuery = originalSelect.apply(this, args);
    
    // Add retry logic to the query execution
    const originalThen = selectQuery.then;
    selectQuery.then = function(onFulfilled?: any, onRejected?: any) {
      return originalThen.call(this, onFulfilled, (error: any) => {
        // Check if it's a network error and we should retry
        if (error && (
          error.message?.includes('Failed to fetch') ||
          error.message?.includes('network') ||
          error.message?.includes('timeout') ||
          !isOnline
        ) && reconnectAttempts < maxReconnectAttempts) {
          
          reconnectAttempts++;
          console.log(`Retrying query... Attempt ${reconnectAttempts}/${maxReconnectAttempts}`);
          
          return new Promise((resolve, reject) => {
            setTimeout(() => {
              // Retry the original query
              originalThen.call(selectQuery, resolve, reject);
            }, 1000 * reconnectAttempts); // Exponential backoff
          });
        }
        
        // If not a retryable error or max attempts reached, reject
        if (onRejected) {
          return onRejected(error);
        }
        throw error;
      });
    };
    
    return selectQuery;
  };
  
  return query;
};

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

// Connection health check
export async function checkConnection(): Promise<boolean> {
  try {
    const { error } = await supabase.from('users').select('id').limit(1);
    return !error;
  } catch {
    return false;
  }
}

// Periodic connection check
setInterval(async () => {
  if (isOnline && reconnectAttempts > 0) {
    const isConnected = await checkConnection();
    if (isConnected) {
      console.log('Supabase connection restored');
      reconnectAttempts = 0;
    }
  }
}, 30000); // Check every 30 seconds