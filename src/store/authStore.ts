import { create } from 'zustand';
import { getSupabaseClient } from '@/lib/supabaseClient';
import { getUserProfile } from '@/lib/auth';
import { User, Session } from '@supabase/supabase-js';

// Define profile interface based on profiles table
interface Profile {
  id: string;
  name?: string;
  email?: string;
  created_at?: string;
  updated_at?: string;
  // Add any other fields from your profiles table
}

// What our "notebook" will hold
type AuthState = {
  user: User | null; // Who's logged in (from Supabase)
  session: Session | null; // Login session (token stuff)
  profile: Profile | null; // User's name, etc.
  loading: boolean; // Are we still checking?
  initialize: () => Promise<void>; // Start checking who's logged in
};

// Make the store
export const useAuthStore = create<AuthState>(set => ({
  user: null,
  session: null,
  profile: null,
  loading: true,

  // Function to check login when the app starts
  initialize: async () => {
    const supabase = getSupabaseClient();
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session) {
        const profile = await getUserProfile(session.user.id);
        set({ user: session.user, session, profile, loading: false });
        console.log('Logged in:', session.user.email);
      } else {
        set({ user: null, session: null, profile: null, loading: false });
        console.log('No one logged in');
      }

      // Listen for login/logout changes
      supabase.auth.onAuthStateChange(async (event, session) => {
        if (session) {
          const profile = await getUserProfile(session.user.id);
          set({ user: session.user, session, profile, loading: false });
          console.log('Auth changed - logged in:', session.user.email);
        } else {
          set({ user: null, session: null, profile: null, loading: false });
          console.log('Auth changed - logged out');
        }
      });
    } catch (error) {
      console.error('Error checking login:', error);
      set({ user: null, session: null, profile: null, loading: false });
    }
  },
}));
