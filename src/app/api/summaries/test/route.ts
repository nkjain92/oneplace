// src/app/api/summaries/test/route.ts - TEST ONLY VERSION that bypasses authentication
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { extractYouTubeVideoId } from '@/lib/utils/youtube';
import fetchYouTubeTranscript from '@/lib/youtubeTranscript';
import fetchYouTubeChannelDetails from '@/lib/youtubeChannel';
import OpenAI from 'openai';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// IMPORTANT: This is a special test endpoint that uses admin privileges.
// This would never be used in production as it bypasses authentication.
export async function POST(request: Request) {
  try {
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json(
        { error: 'Test endpoint not available in production' },
        { status: 403 },
      );
    }

    // Extract the URL from the request body and possible test user ID
    const { url, testUserId } = await request.json();

    // Extract video ID from the YouTube URL
    const videoId = extractYouTubeVideoId(url);
    if (!videoId) {
      return NextResponse.json({ error: 'Invalid YouTube URL' }, { status: 400 });
    }

    // Create a direct Supabase client with service role to bypass RLS
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json(
        { error: 'Missing Supabase environment variables for test endpoint' },
        { status: 500 },
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      {
        auth: {
          persistSession: false,
        },
      },
    );

    // Check if summary already exists for this video
    const { data, error } = await supabase
      .from('summaries')
      .select('id, title, summary, tags, featured_names, publisher_name, content_created_at')
      .eq('content_id', videoId)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw new Error(`Supabase query error: ${error.message}`);
    }

    let summaryId, summaryData;

    if (data) {
      // Return existing summary
      summaryId = data.id;
      summaryData = data;
    } else {
      try {
        // Fetch channel details from YouTube
        const { channelId, name, description, videoTitle } = await fetchYouTubeChannelDetails(
          videoId,
        );

        // Check if channel already exists in our database
        const { data: existingChannel, error: channelError } = await supabase
          .from('channels')
          .select('id')
          .eq('id', channelId)
          .single();

        if (channelError && channelError.code !== 'PGRST116') {
          throw new Error(`Error checking for existing channel: ${channelError.message}`);
        }

        // If channel doesn't exist, insert it
        if (!existingChannel) {
          const { error: insertChannelError } = await supabase.from('channels').insert([
            {
              id: channelId,
              name: name,
              description: description,
              rss_feed_url: null,
              tags: [],
            },
          ]);

          if (insertChannelError) {
            throw new Error(`Error inserting channel: ${insertChannelError.message}`);
          }

          console.log(`Channel ${name} (${channelId}) added to database`);
        }

        // Get video details including published date
        const videoResponse = await fetch(
          `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${videoId}&key=${process.env.YOUTUBE_API_KEY}`,
        );

        if (!videoResponse.ok) {
          throw new Error(
            `Error fetching video details: ${videoResponse.status} ${videoResponse.statusText}`,
          );
        }

        const videoData = await videoResponse.json();
        const publishedAt =
          videoData.items && videoData.items.length > 0
            ? videoData.items[0].snippet.publishedAt
            : null;

        // Fetch transcript from YouTube
        const transcript = await fetchYouTubeTranscript(videoId);

        // Insert a new record into the summaries table
        const { data: insertedData, error: insertError } = await supabase
          .from('summaries')
          .insert([
            {
              content_id: videoId,
              content_type: 'video',
              source_url: url,
              title: videoTitle,
              publisher_id: channelId,
              publisher_name: name,
              content_created_at: publishedAt,
              transcript: transcript,
              status: 'processing',
            },
          ])
          .select('id');

        if (insertError) {
          throw new Error(`Error storing transcript: ${insertError.message}`);
        }

        if (!insertedData || insertedData.length === 0) {
          throw new Error('Failed to get ID of inserted transcript');
        }

        summaryId = insertedData[0].id;

        // Generate a summary
        const prompt = `Generate a summary of the following transcript, followed by tags and people mentioned, in this format:

Summary: [summary text]
Tags: tag1, tag2
People: person1, person2

Transcript: ${transcript}`;

        // Call the AI model to generate the summary
        const response = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.7,
        });

        // Get the full text response
        const fullSummary = response.choices[0].message.content || '';

        // Parse the response to extract summary, tags, and people
        let summary = '';
        let tags: string[] = [];
        let people: string[] = [];

        const lines = fullSummary.split('\n');
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i].trim();
          if (line.startsWith('Summary:')) {
            summary = line.substring('Summary:'.length).trim();
            // Continue collecting summary lines until we hit Tags or People
            let j = i + 1;
            while (
              j < lines.length &&
              !lines[j].startsWith('Tags:') &&
              !lines[j].startsWith('People:')
            ) {
              summary += ' ' + lines[j].trim();
              j++;
            }
            i = j - 1; // Adjust loop counter
          } else if (line.startsWith('Tags:')) {
            const tagsString = line.substring('Tags:'.length).trim();
            tags = tagsString
              .split(',')
              .map((tag: string) => tag.trim())
              .filter((tag: string) => tag.length > 0);
          } else if (line.startsWith('People:')) {
            const peopleString = line.substring('People:'.length).trim();
            people = peopleString
              .split(',')
              .map((person: string) => person.trim())
              .filter((person: string) => person.length > 0);
          }
        }

        // Update the record with the generated summary, tags, and people
        const { error: updateError } = await supabase
          .from('summaries')
          .update({
            summary: summary,
            tags: tags,
            featured_names: people,
            status: 'completed',
          })
          .eq('id', summaryId);

        if (updateError) {
          throw new Error(`Error updating summary: ${updateError.message}`);
        }

        summaryData = {
          id: summaryId,
          title: videoTitle,
          summary: summary,
          tags: tags,
          featured_names: people,
          publisher_id: channelId,
          publisher_name: name,
          content_created_at: publishedAt,
        };
      } catch (transcriptError) {
        console.error('Error fetching or storing transcript:', transcriptError);
        throw new Error(
          `Failed to process transcript: ${
            transcriptError instanceof Error ? transcriptError.message : String(transcriptError)
          }`,
        );
      }
    }

    // Record user interaction if a test user ID was provided
    const userId = testUserId;
    if (userId && summaryId) {
      try {
        // Use upsert to avoid duplicates - on conflict do nothing
        const { error: userSummaryError } = await supabase.from('user_generated_summaries').upsert(
          [
            {
              user_id: userId,
              summary_id: summaryId,
              generated_at: new Date().toISOString(),
            },
          ],
          {
            onConflict: 'user_id, summary_id',
            ignoreDuplicates: true,
          },
        );

        if (userSummaryError) {
          console.error('Error recording user interaction:', userSummaryError);
          // Don't throw, just log the error - we don't want to fail the whole request
        } else {
          console.log(`Recorded user ${userId} interaction with summary ${summaryId}`);
        }
      } catch (userSummaryError) {
        // Log but don't fail the request
        console.error('Error recording user interaction:', userSummaryError);
      }
    }

    // Return success response with the summary data
    return NextResponse.json(
      {
        ...summaryData,
        userId: userId || null,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error('Error processing summary request:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error occurred' },
      { status: 500 },
    );
  }
}
