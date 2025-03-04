// src/lib/auth.ts - Authentication utilities for user management
import { supabase } from './supabaseClient';

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
    // Create the user in auth.users
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name, // Store name in auth metadata for immediate access
        },
      },
    });

    if (error) throw error;
    if (!data.user) throw new Error('User creation failed');

    // Insert profile into profiles table using the same UUID
    const { error: profileError } = await supabase.from('profiles').insert({
      id: data.user.id,
      name,
    });

    if (profileError) throw profileError;

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
