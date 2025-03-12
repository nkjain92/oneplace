// src/app/api/summaries/route.ts - Handles summary generation and retrieval for YouTube videos
import { NextResponse } from 'next/server';
import { createSupabaseServerClient, createSupabaseServiceClient } from '@/lib/supabaseServer';
import { extractYouTubeVideoId } from '@/lib/utils/youtube';
import fetchYouTubeTranscript from '@/lib/youtubeTranscript';
import fetchYouTubeChannelDetails from '@/lib/youtubeChannel';
// Vercel AI SDK for summary generation
import { openai } from '@ai-sdk/openai';
import { generateText } from 'ai';
import { SUMMARY_PROMPT } from '@/lib/prompts';

export async function POST(request: Request) {
  try {
    console.log('Starting summary generation process...');

    // Extract the URL from the request body
    const { url } = await request.json();
    console.log('Received URL:', url);

    // Extract video ID from the YouTube URL
    const videoId = extractYouTubeVideoId(url);
    if (!videoId) {
      console.error('Invalid YouTube URL:', url);
      return NextResponse.json({ error: 'Invalid YouTube URL' }, { status: 400 });
    }
    console.log('Extracted video ID:', videoId);

    // Create regular Supabase client
    const supabase = await createSupabaseServerClient();
    console.log('Created Supabase client');

    // Check authentication status and get user ID if logged in
    const { data: sessionData } = await supabase.auth.getSession();
    const isAuthenticated = !!sessionData?.session?.user;
    const userId = sessionData?.session?.user?.id;

    console.log('Session Data:', JSON.stringify(sessionData, null, 2));
    console.log('Is Authenticated:', isAuthenticated);
    console.log('User ID:', userId);

    // Choose the appropriate client based on authentication
    const dbClient = isAuthenticated ? supabase : await createSupabaseServiceClient();
    console.log('Using', isAuthenticated ? 'authenticated' : 'service', 'client');

    // Check if summary already exists for this video
    console.log('Checking if summary already exists for video ID:', videoId);
    const { data, error } = await dbClient
      .from('summaries')
      .select('id, title, summary, tags, featured_names, publisher_name, content_created_at')
      .eq('content_id', videoId)
      .single();

    if (error && error.code !== 'PGRST116') {
      // PGRST116 is the error code for "no rows returned" in Supabase
      console.error('Supabase query error:', error.message);
      throw new Error(`Supabase query error: ${error.message}`);
    }

    let summaryId, summaryData;

    if (data && data.summary && data.summary.trim() !== '') {
      // Return existing summary only if it's not empty
      console.log('Found existing summary with ID:', data.id);
      summaryId = data.id;
      summaryData = data;
    } else {
      // No existing summary found or empty summary - generate a new one
      console.log('No valid summary found, generating new summary...');

      // If we have an existing record but empty summary, use that ID
      if (data && data.id) {
        console.log('Using existing record ID:', data.id);
        summaryId = data.id;
      }

      // No existing summary found - fetch channel details and transcript
      try {
        // Fetch channel details from YouTube
        const { channelId, name, description, videoTitle, thumbnailUrl } =
          await fetchYouTubeChannelDetails(videoId);

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
              thumbnail: thumbnailUrl,
            },
          ]);

          if (insertChannelError) {
            throw new Error(`Error inserting channel: ${insertChannelError.message}`);
          }

          console.log(
            `Channel ${name} (${channelId}) added to database with thumbnail: ${
              thumbnailUrl || 'none'
            }`,
          );
        } else {
          // If the channel exists but doesn't have a thumbnail, update it with the new thumbnail
          if (thumbnailUrl) {
            const { data: channelData } = await dbClient
              .from('channels')
              .select('thumbnail')
              .eq('id', channelId)
              .single();

            if (!channelData?.thumbnail) {
              const { error: updateError } = await dbClient
                .from('channels')
                .update({ thumbnail: thumbnailUrl })
                .eq('id', channelId);

              if (updateError) {
                console.error(`Error updating channel thumbnail: ${updateError.message}`);
              } else {
                console.log(
                  `Updated channel ${name} (${channelId}) with thumbnail: ${thumbnailUrl}`,
                );
              }
            }
          }
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
        console.log('Fetching transcript for video ID:', videoId);
        const transcript = await fetchYouTubeTranscript(videoId);
        console.log('Transcript length:', transcript.length);

        // Insert a new record into the summaries table with channel details
        if (!summaryId) {
          console.log('Creating new summary record...');
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
            console.error('Error storing transcript:', insertError.message);
            throw new Error(`Error storing transcript: ${insertError.message}`);
          }

          if (!insertedData || insertedData.length === 0) {
            console.error('Failed to get ID of inserted transcript');
            throw new Error('Failed to get ID of inserted transcript');
          }

          summaryId = insertedData[0].id;
          console.log('Created new summary record with ID:', summaryId);
        }

        // Generate a summary using OpenAI directly
        const prompt = SUMMARY_PROMPT.replace('{transcript}', transcript);

        console.log('Calling AI model to generate summary...');
        // Call the AI model to generate the summary
        const result = await generateText({
          model: openai('gpt-4o-mini'),
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.7,
        });

        // Get the full text response
        const fullSummary = result.text || '';
        console.log('Full AI response:', fullSummary);

        // Parse the response to extract summary, tags, and people
        let summary = '';
        let tags: string[] = [];
        let people: string[] = [];

        const lines = fullSummary.split('\n');
        let inSummarySection = false;

        for (let i = 0; i < lines.length; i++) {
          const line = lines[i].trim();

          if (line.startsWith('Summary:')) {
            inSummarySection = true;
            // Get the initial part after "Summary:"
            summary = line.substring('Summary:'.length).trim();
            continue;
          } else if (line.startsWith('Tags:')) {
            inSummarySection = false;
            const tagsString = line.substring('Tags:'.length).trim();
            tags = tagsString
              .split(',')
              .map((tag: string) => tag.trim())
              .filter((tag: string) => tag.length > 0);
          } else if (line.startsWith('People:')) {
            inSummarySection = false;
            const peopleString = line.substring('People:'.length).trim();
            people = peopleString
              .split(',')
              .map((person: string) => person.trim())
              .filter((person: string) => person.length > 0);
          } else if (inSummarySection) {
            // Preserve line breaks in markdown by adding proper newlines
            // Only add a new line if the summary already has content
            if (summary.length > 0) {
              // If line is empty, it's a paragraph break in markdown
              if (line === '') {
                summary += '\n\n';
              } else {
                summary += '\n' + line;
              }
            } else {
              summary = line;
            }
          }
        }

        console.log('Extracted Summary:', summary);
        console.log('Extracted Tags:', tags);
        console.log('Extracted People:', people);

        // Update the record with the generated summary, tags, and people
        console.log('Updating record with generated summary...');
        console.log('Summary ID:', summaryId);
        console.log('Summary:', summary);
        console.log('Tags:', tags);
        console.log('People:', people);

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
          console.error('Error updating summary:', updateError.message);
          throw new Error(`Error updating summary: ${updateError.message}`);
        }

        console.log('Successfully updated summary record');

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
