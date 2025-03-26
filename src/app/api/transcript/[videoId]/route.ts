import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServiceClient } from '@/lib/supabaseServer';

// In Next.js 15, params must be awaited before accessing its properties
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ videoId: string }> }
) {
  try {
    // Await params to access its properties
    const { videoId } = await params;
    
    if (!videoId) {
      return NextResponse.json(
        { error: 'Video ID is required' },
        { status: 400 }
      );
    }

    const supabase = await createSupabaseServiceClient();

    const { data, error } = await supabase
      .from('summaries')
      .select('transcript')
      .eq('content_id', videoId)
      .single();

    if (error) {
      console.error('Error fetching transcript:', error);
      return NextResponse.json(
        { error: 'Failed to fetch transcript' },
        { status: 500 }
      );
    }

    if (!data?.transcript) {
      return NextResponse.json(
        { error: 'Transcript not available for this content' },
        { status: 404 }
      );
    }

    return NextResponse.json({ transcript: data.transcript });
  } catch (err) {
    console.error('Unexpected error fetching transcript:', err);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
} 