// src/lib/auth.ts - Authentication utilities for user management
import { supabase } from './supabaseClient';

// Define the session type
interface PersistedSession {
  access_token: string;
  refresh_token: string;
  expires_at?: number;
  [key: string]: any; // Allow for additional properties
}

// Persisted session management
let persistedSession: PersistedSession | null = null;

export function setPersistedSession(session: PersistedSession): void {
  persistedSession = session;
  
  // Also try to store in localStorage for page reloads
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem('oneplace_session', JSON.stringify({
        access_token: session.access_token,
        refresh_token: session.refresh_token,
        expires_at: session.expires_at
      }));
    } catch (e) {
      console.error("Failed to persist session to localStorage:", e);
    }
  }
}

export function getPersistedSession(): PersistedSession | null {
  if (persistedSession) return persistedSession;
  
  // Try to retrieve from localStorage
  if (typeof window !== 'undefined') {
    try {
      const storedSession = localStorage.getItem('oneplace_session');
      if (storedSession) {
        persistedSession = JSON.parse(storedSession) as PersistedSession;
        return persistedSession;
      }
    } catch (e) {
      console.error("Failed to retrieve session from localStorage:", e);
    }
  }
  
  return null;
}

export function clearPersistedSession(): void {
  persistedSession = null;
  
  // Also clear from localStorage
  if (typeof window !== 'undefined') {
    try {
      localStorage.removeItem('oneplace_session');
    } catch (e) {
      console.error("Failed to clear session from localStorage:", e);
    }
  }
}

/**
 * Register a new user and create their profile
 * @param name User's display name
 * @param email User's email address
 * @param password User's password
 * @returns The authenticated user data
 */
export async function signUp(name: string, email: string, password: string) {
  // Validate input
  if (!name || !email || !password) {
    throw new Error('Name, email and password are required');
  }

  try {
    // Create the user in auth.users with email confirmation enabled
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name, // Store name in auth metadata for immediate access
        },
        emailRedirectTo: `${window.location.origin}/auth/confirm`,
      },
    });

    if (error) throw error;
    if (!data.user) throw new Error('User creation failed');

    // For client-side profile creation that bypasses RLS
    // Use a direct server API call to create the profile
    const profileResponse = await fetch('/api/profiles/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        id: data.user.id,
        name,
      }),
    });

    if (!profileResponse.ok) {
      const profileError = await profileResponse.json();
      throw new Error(profileError.message || 'Failed to create user profile');
    }

    return data;
  } catch (error) {
    console.error('Sign up error:', error);
    throw error;
  }
}

/**
 * Sign in an existing user
 * @param email User's email address
 * @param password User's password
 * @returns The authenticated user data
 */
export async function signIn(email: string, password: string) {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Sign in error:', error);
    throw error;
  }
}

/**
 * Sign out the current user
 */
export async function signOut() {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  } catch (error) {
    console.error('Sign out error:', error);
    throw error;
  }
}

/**
 * Get the current session
 * @returns The current session or null
 */
export async function getSession() {
  try {
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    return data.session;
  } catch (error) {
    console.error('Get session error:', error);
    return null;
  }
}

/**
 * Get user profile data by user ID
 * @param userId The user's UUID
 * @returns The user's profile data or null if not found
 */
export async function getUserProfile(userId: string) {
  try {
    // Query without using .single() to avoid 406 errors
    const { data, error } = await supabase.from('profiles').select('*').eq('id', userId);

    if (error) throw error;

    // Handle array result
    if (!data || data.length === 0) {
      return null;
    }

    // Return the first result (there should only be one matching the userId)
    return data[0];
  } catch (error) {
    console.error('Get profile error:', error);
    return null;
  }
}

/**
 * Send a one-time password to the user's email for password reset
 */
export async function sendPasswordResetOtp(email: string): Promise<{ data: any; error: Error | null }> {
  console.log("📧 Sending password reset OTP to:", email);
  
  try {
    const { data, error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: false,
      }
    });
    
    if (error) {
      console.error("❌ Failed to send OTP:", error.message);
      return { data: null, error };
    }
    
    console.log("✅ OTP sent successfully:", data);
    return { data, error: null };
  } catch (error) {
    console.error("🚨 Exception during OTP send:", error);
    return { 
      data: null, 
      error: error instanceof Error ? error : new Error('Unknown error during OTP send') 
    };
  }
}

/**
 * Verify OTP and update password using direct fetch API
 */
export async function verifyOtpAndUpdatePassword(
  email: string, 
  otp: string, 
  password: string
): Promise<{ data: any; error: Error | null }> {
  console.log("🔄 Verifying OTP for:", email);
  
  try {
    // Step 1: Verify the OTP
    const verifyResponse = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
      },
      body: JSON.stringify({
        email,
        token: otp,
        type: 'email',
      }),
    });
    
    const verifyData = await verifyResponse.json();
    console.log("📊 OTP verification response:", verifyData);
    
    if (!verifyResponse.ok) {
      console.error("❌ OTP verification failed:", verifyData.error, verifyData.error_description);
      return { 
        data: null, 
        error: new Error(verifyData.error_description || verifyData.error || 'OTP verification failed') 
      };
    }
    
    // Store the session from verification for use in the next step
    setPersistedSession(verifyData);
    
    // Step 2: Update the password
    const updateResponse = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/user`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
        'Authorization': `Bearer ${verifyData.access_token}`,
      },
      body: JSON.stringify({
        password,
      }),
    });
    
    const updateData = await updateResponse.json();
    console.log("📊 Password update response:", updateData);
    
    if (!updateResponse.ok) {
      console.error("❌ Password update failed:", updateData.error, updateData.error_description);
      return { 
        data: null, 
        error: new Error(updateData.error_description || updateData.error || 'Password update failed') 
      };
    }
    
    console.log("✅ Password updated successfully");
    return { data: updateData, error: null };
  } catch (error) {
    console.error("🚨 Exception during password reset:", error);
    return { 
      data: null, 
      error: error instanceof Error ? error : new Error('Unknown error during password reset') 
    };
  }
}