// src/app/api/summaries/route.ts - Handles summary generation and retrieval for YouTube videos
import { NextResponse } from 'next/server';
import { createSupabaseServerClient, createSupabaseServiceClient } from '@/lib/supabaseServer';
import { extractYouTubeVideoId } from '@/lib/utils/youtube';
import fetchYouTubeTranscript from '@/lib/youtubeTranscript';
import fetchYouTubeChannelDetails from '@/lib/youtubeChannel';
import OpenAI from 'openai';
import { SUMMARY_PROMPT } from '@/lib/prompts';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  try {
    // Extract the URL from the request body
    const { url } = await request.json();

    // Extract video ID from the YouTube URL
    const videoId = extractYouTubeVideoId(url);
    if (!videoId) {
      return NextResponse.json({ error: 'Invalid YouTube URL' }, { status: 400 });
    }

    // Create regular Supabase client
    const supabase = await createSupabaseServerClient();

    // Check authentication status and get user ID if logged in
    const { data: sessionData } = await supabase.auth.getSession();
    const isAuthenticated = !!sessionData?.session?.user;
    const userId = sessionData?.session?.user?.id;

    console.log('Session Data:', JSON.stringify(sessionData, null, 2));
    console.log('Is Authenticated:', isAuthenticated);
    console.log('User ID:', userId);

    // Choose the appropriate client based on authentication
    const dbClient = isAuthenticated ? supabase : await createSupabaseServiceClient();

    // Check if summary already exists for this video
    const { data, error } = await dbClient
      .from('summaries')
      .select('id, title, summary, tags, featured_names, publisher_name, content_created_at')
      .eq('content_id', videoId)
      .single();

    if (error && error.code !== 'PGRST116') {
      // PGRST116 is the error code for "no rows returned" in Supabase
      throw new Error(`Supabase query error: ${error.message}`);
    }

    let summaryId, summaryData;

    if (data) {
      // Return existing summary
      summaryId = data.id;
      summaryData = data;
    } else {
      // No existing summary found - fetch channel details and transcript
      try {
        // Fetch channel details from YouTube
        const { channelId, name, description, videoTitle } = await fetchYouTubeChannelDetails(
          videoId,
        );

        // Check if channel already exists in our database
        const { data: existingChannel } = await dbClient
          .from('channels')
          .select('id')
          .eq('id', channelId)
          .single();

        // If channel doesn't exist, insert it using the appropriate client
        if (!existingChannel) {
          const rssFeedUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`;
          const { error: insertChannelError } = await dbClient.from('channels').insert([
            {
              id: channelId,
              name: name,
              description: description,
              rss_feed_url: rssFeedUrl,
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

        // Insert a new record into the summaries table with channel details
        const { data: insertedData, error: insertError } = await dbClient
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

        // Generate a summary using OpenAI directly
        const prompt = SUMMARY_PROMPT.replace('{transcript}', transcript);

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
        const { error: updateError } = await dbClient
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

    // Record user interaction if user is logged in
    if (isAuthenticated && userId && summaryId) {
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
        console.error('Error recording user interaction:', userSummaryError);
      }
    }

    // Return the summary data with user ID if present
    return NextResponse.json(
      {
        ...summaryData,
        userId: userId || null,
        channelId: 'publisher_id' in summaryData ? summaryData.publisher_id : null,
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
