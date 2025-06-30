'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { User as SupabaseUser, Session } from '@supabase/supabase-js';
import { supabase, User, isSupabaseConfigured } from '@/lib/supabase';

interface AuthContextType {
  user: SupabaseUser | null;
  userProfile: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  updateUserProfile: (updates: Partial<User>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Only initialize auth if Supabase is configured
    if (!isSupabaseConfigured) {
      console.log('Supabase not configured, skipping auth initialization');
      setLoading(false);
      return;
    }

    // Get initial session
    const initializeAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting session:', error);
          setLoading(false);
          return;
        }

        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          await loadUserProfile(session.user.id);
        } else {
          setLoading(false);
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        setLoading(false);
      }
    };

    initializeAuth();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event, session?.user?.email);
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        await loadUserProfile(session.user.id);
      } else {
        setUserProfile(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadUserProfile = async (userId: string) => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data: profile, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error && error.code === 'PGRST116') {
        // User doesn't exist, create profile
        await createUserProfile(userId);
      } else if (profile) {
        setUserProfile(profile);
        
        // Update last login
        await supabase
          .from('users')
          .update({ last_login_at: new Date().toISOString() })
          .eq('id', userId);
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const createUserProfile = async (userId: string) => {
    if (!isSupabaseConfigured) {
      throw new Error('Supabase not configured');
    }

    try {
      const { data: authUser } = await supabase.auth.getUser();
      
      const newProfile = {
        id: userId,
        email: authUser.user?.email || '',
        display_name: authUser.user?.user_metadata?.display_name || 
                     authUser.user?.user_metadata?.full_name || 
                     authUser.user?.email?.split('@')[0] || '',
        photo_url: authUser.user?.user_metadata?.avatar_url,
        total_xp: 0,
        level: 1,
        subscription_tier: 'free' as const,
        last_login_at: new Date().toISOString(),
        preferences: {
          theme: 'dark' as const,
          notifications: true,
          language: 'en',
        },
      };

      const { data, error } = await supabase
        .from('users')
        .insert([newProfile])
        .select()
        .single();

      if (error) {
        console.error('Error creating user profile:', error);
        throw error;
      }
      
      setUserProfile(data);
    } catch (error) {
      console.error('Error creating user profile:', error);
      throw error;
    }
  };

  const signIn = async (email: string, password: string) => {
    if (!isSupabaseConfigured) {
      throw new Error('Supabase not configured. Please set up your environment variables.');
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) throw error;
      
      // The auth state change listener will handle the rest
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  const signUp = async (email: string, password: string, displayName: string) => {
    if (!isSupabaseConfigured) {
      throw new Error('Supabase not configured. Please set up your environment variables.');
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            display_name: displayName,
            full_name: displayName,
          },
        },
      });
      
      if (error) throw error;
      
      // The auth state change listener will handle the rest
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  const signInWithGoogle = async () => {
    if (!isSupabaseConfigured) {
      throw new Error('Supabase not configured. Please set up your environment variables.');
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      
      if (error) throw error;
      
      // OAuth will redirect, so we don't need to handle success here
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  const logout = async () => {
    if (!isSupabaseConfigured) {
      // For mock client, just clear local state
      setUser(null);
      setUserProfile(null);
      setSession(null);
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      // Clear local state
      setUser(null);
      setUserProfile(null);
      setSession(null);
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  const updateUserProfile = async (updates: Partial<User>) => {
    if (!user || !isSupabaseConfigured) return;
    
    try {
      const { data, error } = await supabase
        .from('users')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id)
        .select()
        .single();

      if (error) throw error;
      setUserProfile(data);
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw error;
    }
  };

  const value = {
    user,
    userProfile,
    session,
    loading,
    signIn,
    signUp,
    signInWithGoogle,
    logout,
    updateUserProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};