// src/store/authStore.ts - Zustand store for authentication state
import { create } from 'zustand';
import { supabase } from '@/lib/supabaseClient';
import { getUserProfile } from '@/lib/auth';
import { User, Session } from '@supabase/supabase-js';

interface Profile {
  id: string;
  name?: string;
  email?: string;
  created_at?: string;
  updated_at?: string;
}

type AuthState = {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  initialize: () => Promise<void>;
};

export const useAuthStore = create<AuthState>(set => ({
  user: null,
  session: null,
  profile: null,
  loading: true,

  initialize: async () => {
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
