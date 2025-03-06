// src/context/AuthProvider.tsx - Authentication context for global state management
'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabaseClient';
import { getUserProfile } from '../lib/auth';

// Define profile interface based on profiles table
interface Profile {
  id: string;
  name?: string;
  email?: string;
  created_at?: string;
  updated_at?: string;
  // Add any other fields from your profiles table
}

// Define the context state shape
interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null; // Type should match your profiles table schema
  loading: boolean;
}

// Create context with default values
const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  profile: null,
  loading: true,
});

// Provider props type
interface AuthProviderProps {
  children: ReactNode;
}

// Export the provider component
export function AuthProvider({ children }: AuthProviderProps) {
  const [state, setState] = useState<AuthContextType>({
    user: null,
    session: null,
    profile: null,
    loading: true,
  });

  // Load user on mount and set up auth listener
  useEffect(() => {
    let mounted = true;

    // Function to fetch profile with retry logic
    async function fetchProfileWithRetry(userId: string) {
      if (!userId) return null;

      let attempts = 0;
      const maxAttempts = 3;

      while (attempts < maxAttempts) {
        const profile = await getUserProfile(userId);
        if (profile) {
          return profile;
        }

        attempts++;
        // Exponential backoff: wait longer with each attempt (200ms, 400ms, 800ms)
        await new Promise(resolve => setTimeout(resolve, 200 * Math.pow(2, attempts - 1)));
      }

      // If no profile is found after retries, return null
      console.warn(`Could not fetch profile for user ${userId} after ${maxAttempts} attempts`);
      return null;
    }

    async function getInitialSession() {
      try {
        // Check for existing session
        const {
          data: { session },
        } = await supabase.auth.getSession();
        console.log('Initial session:', session); // Debug log

        if (mounted) {
          if (session) {
            // If logged in, fetch and add the user profile data with retry
            const profile = await fetchProfileWithRetry(session.user.id);
            console.log('Initial user:', session.user, 'Profile:', profile); // Debug log

            setState({
              user: session.user,
              session,
              profile,
              loading: false,
            });
          } else {
            // No session found
            setState({
              user: null,
              session: null,
              profile: null,
              loading: false,
            });
          }
        }
      } catch (error) {
        console.error('Error getting initial session:', error);
        if (mounted) {
          setState({
            user: null,
            session: null,
            profile: null,
            loading: false,
          });
        }
      }
    }

    getInitialSession();

    // Listen for auth changes
    const { data: listener } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state change:', event, session); // Debug log

      if (mounted) {
        if (session) {
          // Fetch user profile when auth state changes, with retry for signup events
          const profile = await fetchProfileWithRetry(session.user.id);
          setState({
            user: session.user,
            session,
            profile,
            loading: false,
          });
        } else {
          setState({
            user: null,
            session: null,
            profile: null,
            loading: false,
          });
        }
      }
    });

    return () => {
      mounted = false;
      // Clean up subscription
      listener?.subscription.unsubscribe();
    };
  }, []);

  return <AuthContext.Provider value={state}>{children}</AuthContext.Provider>;
}

// Custom hook for using the auth context
export const useAuth = () => useContext(AuthContext);
