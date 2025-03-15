// src/lib/summaryHelpers.ts - Helper functions for summary generation and processing

// Calculates total video duration (in seconds) from transcript segments.
// Define proper type for transcript data
interface TranscriptData {
  transcript?: Array<{
    start?: number;
    duration?: number;
  }>;
}

export function calculateVideoDuration(transcriptData: TranscriptData): number {
  if (!transcriptData || !transcriptData.transcript || !Array.isArray(transcriptData.transcript)) {
    return 0;
  }

  // If the transcript is empty, return 0
  if (transcriptData.transcript.length === 0) {
    return 0;
  }

  try {
    // Get the last segment
    const lastSegment = transcriptData.transcript[transcriptData.transcript.length - 1];

    // If the last segment has start and duration properties, use them to calculate total duration
    if (lastSegment.start !== undefined && lastSegment.duration !== undefined) {
      return Math.round(lastSegment.start + lastSegment.duration);
    }

    // Alternative calculation: sum up all durations
    let totalDuration = 0;
    for (const segment of transcriptData.transcript) {
      if (segment.duration !== undefined) {
        totalDuration += segment.duration;
      }
    }

    return Math.round(totalDuration);
  } catch (error) {
    console.error('Error calculating video duration:', error);
    return 0;
  }
}

// Parses the AI response text to extract summary, tags, and people.
export function parseAiResponse(fullText: string): {
  summary: string;
  tags: string[];
  people: string[];
} {
  let summary = '';
  let tags: string[] = [];
  let people: string[] = [];
  const lines = fullText.split('\n');
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

  return { summary, tags, people };
}

// Checks if the channel exists in the database; if not, inserts it,
// or updates it if a thumbnail is missing.
// Define type for database client
// Use a type definition that avoids excessive type instantiation depth
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DbClient = any;

export async function handleChannelInDB(
  dbClient: DbClient,
  channelDetails: { channelId: string; name: string; description: string | null; thumbnailUrl: string | null },
) {
  const { channelId, name, description, thumbnailUrl } = channelDetails;

  // Check if channel already exists in our database
  const { data: existingChannel } = await dbClient
    .from('channels')
    .select('id, thumbnail')
    .eq('id', channelId)
    .single();

  // If channel doesn't exist, insert it
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
      `Channel ${name} (${channelId}) added to database with thumbnail: ${thumbnailUrl || 'none'}`,
    );
  }
  // If the channel exists but doesn't have a thumbnail, update it with the new thumbnail
  else if (thumbnailUrl && !existingChannel.thumbnail) {
    const { error: updateError } = await dbClient
      .from('channels')
      .update({ thumbnail: thumbnailUrl })
      .eq('id', channelId);

    if (updateError) {
      console.error(`Error updating channel thumbnail: ${updateError.message}`);
    } else {
      console.log(`Updated channel ${name} (${channelId}) with thumbnail: ${thumbnailUrl}`);
    }
  }
}
