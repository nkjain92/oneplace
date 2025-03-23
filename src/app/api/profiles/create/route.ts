import { NextResponse } from 'next/server';
import { createSupabaseServiceClient } from '@/lib/supabaseServer';

/**
 * POST /api/profiles/create
 * Creates a new user profile bypassing RLS policies using the service role
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { id, name } = body;

    if (!id || !name) {
      return NextResponse.json(
        { error: 'User ID and name are required' },
        { status: 400 }
      );
    }

    // Use service role client to bypass RLS policies
    const supabaseService = await createSupabaseServiceClient();
    
    const { error } = await supabaseService
      .from('profiles')
      .insert({ id, name });

    if (error) {
      console.error('Profile creation error:', error);
      return NextResponse.json(
        { error: error.message || 'Failed to create profile' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Unexpected error in profile creation:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
} 