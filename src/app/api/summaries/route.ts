// src/app/api/summaries/route.ts - Handles summary generation and retrieval for YouTube videos
import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabaseServer';
import { extractYouTubeVideoId } from '@/lib/utils/youtube';

export async function POST(request: Request) {
  try {
    // Extract the URL from the request body
    const { url } = await request.json();

    // Extract video ID from the YouTube URL
    const videoId = extractYouTubeVideoId(url);
    if (!videoId) {
      return NextResponse.json({ error: 'Invalid YouTube URL' }, { status: 400 });
    }

    // Create Supabase client
    const supabase = await createSupabaseServerClient();

    // Check if summary already exists for this video
    const { data, error } = await supabase
      .from('summaries')
      .select('id, title, summary, tags, featured_names, publisher_name, content_created_at')
      .eq('content_id', videoId)
      .single();

    if (error && error.code !== 'PGRST116') {
      // PGRST116 is the error code for "no rows returned" in Supabase
      throw new Error(`Supabase query error: ${error.message}`);
    }

    if (data) {
      // Return existing summary
      return NextResponse.json(data, { status: 200 });
    } else {
      // No existing summary found
      return NextResponse.json(
        { message: 'Summary not found, generation pending' },
        { status: 200 },
      );
    }
  } catch (error) {
    console.error('Error processing summary request:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error occurred' },
      { status: 500 },
    );
  }
}
