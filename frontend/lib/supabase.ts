import { createClient } from '@supabase/supabase-js';

// Supabase configuration with fallback values
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder_key';

// Validate Supabase configuration
const isValidSupabaseConfig = () => {
  return supabaseUrl !== 'https://placeholder.supabase.co' && 
         supabaseAnonKey !== 'placeholder_key' &&
         supabaseUrl.includes('.supabase.co');
};

// Create a mock Supabase client for development when not configured
const createMockSupabaseClient = () => {
  const mockSubscription = {
    unsubscribe: () => {}
  };

  return {
    auth: {
      getSession: () => Promise.resolve({ 
        data: { session: null }, 
        error: null 
      }),
      getUser: (token?: string) => Promise.resolve({ 
        data: { user: null }, 
        error: null 
      }),
      signUp: () => Promise.reject(new Error('Supabase not configured. Please update your environment variables.')),
      signInWithPassword: () => Promise.reject(new Error('Supabase not configured. Please update your environment variables.')),
      signInWithOAuth: () => Promise.reject(new Error('Supabase not configured. Please update your environment variables.')),
      signOut: () => Promise.resolve({ error: null }),
      onAuthStateChange: () => ({
        data: { subscription: mockSubscription }
      }),
      exchangeCodeForSession: () => Promise.resolve({ 
        data: { session: null }, 
        error: null 
      })
    },
    from: (table: string) => ({
      select: () => ({
        eq: () => ({
          single: () => Promise.resolve({ data: null, error: { code: 'PGRST116', message: 'No rows found' } }),
          limit: () => Promise.resolve({ data: [], error: null }),
          order: () => ({
            limit: () => Promise.resolve({ data: [], error: null })
          })
        }),
        order: () => ({
          limit: () => Promise.resolve({ data: [], error: null })
        })
      }),
      insert: () => ({
        select: () => ({
          single: () => Promise.resolve({ data: null, error: new Error('Supabase not configured') })
        })
      }),
      update: () => ({
        eq: () => ({
          select: () => ({
            single: () => Promise.resolve({ data: null, error: new Error('Supabase not configured') })
          })
        })
      }),
      delete: () => ({
        eq: () => Promise.resolve({ data: null, error: new Error('Supabase not configured') })
      })
    })
  } as any;
};

// Create Supabase client with proper error handling
export const supabase = (() => {
  try {
    if (!isValidSupabaseConfig()) {
      console.warn('⚠️ Supabase not configured. Using mock client for development.');
      return createMockSupabaseClient();
    }
    
    return createClient(supabaseUrl, supabaseAnonKey);
  } catch (error) {
    console.error('Failed to initialize Supabase client:', error);
    return createMockSupabaseClient();
  }
})();

// Server-side Supabase client for API routes
export const createServerSupabaseClient = () => {
  if (!isValidSupabaseConfig()) {
    return createMockSupabaseClient();
  }
  
  try {
    return createClient(supabaseUrl, supabaseAnonKey);
  } catch (error) {
    console.error('Failed to create server Supabase client:', error);
    return createMockSupabaseClient();
  }
};

// Export configuration status
export const isSupabaseConfigured = isValidSupabaseConfig();

// Helper function to check if Supabase is ready
export const checkSupabaseConnection = async () => {
  if (!isValidSupabaseConfig()) {
    return { connected: false, error: 'Supabase not configured' };
  }
  
  try {
    const { data, error } = await supabase.auth.getUser();
    return { connected: true, error: null };
  } catch (error) {
    return { connected: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};

// Type definitions for better TypeScript support
export interface User {
  id: string;
  email: string;
  display_name: string;
  photo_url?: string;
  total_xp: number;
  level: number;
  subscription_tier: 'free' | 'premium' | 'enterprise';
  created_at: string;
  updated_at: string;
  last_login_at: string;
  preferences: {
    theme: 'light' | 'dark';
    notifications: boolean;
    language: string;
  };
}