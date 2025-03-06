// src/lib/supabaseClient.ts - Handles Supabase client instantiation for database and auth operations
import { createClient } from '@supabase/supabase-js';

// Initialize the Supabase client with environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Validate that environment variables are set
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

// Create and export a function to get the client with the current session
export function getSupabaseClient() {
  // Use validated variables which are guaranteed not to be undefined at this point
  const client = createClient(supabaseUrl as string, supabaseAnonKey as string);

  // Sync with current session on initialization - only run on client
  if (typeof window !== 'undefined') {
    const storedSession = localStorage.getItem('supabase.auth.token');
    if (storedSession) {
      try {
        const { currentSession } = JSON.parse(storedSession);
        if (currentSession) {
          client.auth.setSession(currentSession);
        }
      } catch (error) {
        console.error('Error setting stored session:', error);
      }
    }

    // Also fetch any active session
    client.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        client.auth.setSession(session);
      }
    });
  }

  return client;
}

// Maintain the original singleton for compatibility with existing code
export const supabase = createClient(supabaseUrl as string, supabaseAnonKey as string);
