import { create } from 'zustand';
import { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface AuthState {
  user: User | null;
  loading: boolean;
  setUser: (user: User | null) => void;
  signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: true,
  setUser: (user) => set({ user, loading: false }),
  signOut: async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    } finally {
      // Always clear the user state, even if signOut fails
      set({ user: null, loading: false });
      
      // Clear any stored auth data from localStorage
      localStorage.removeItem('sb-' + import.meta.env.VITE_SUPABASE_PROJECT_ID + '-auth-token');
    }
  },
}));

// Set up auth state listener
supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'SIGNED_OUT' || event === 'USER_DELETED') {
    // Handle sign out and user deletion
    useAuthStore.getState().setUser(null);
  } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
    // Handle sign in and token refresh
    useAuthStore.getState().setUser(session?.user ?? null);
  }
});

// Initialize auth state
supabase.auth.getSession().then(({ data: { session } }) => {
  useAuthStore.getState().setUser(session?.user ?? null);
}).catch((error) => {
  console.error('Error getting session:', error);
  useAuthStore.getState().setUser(null);
});