// src/lib/summaryHelpers.ts - Helper functions for summary generation and processing

// Calculates total video duration (in seconds) from transcript segments.
// Define proper types for the various transcript data formats
interface LegacyTranscriptSegment {
  start?: number;
  duration?: number;
}

interface NewTranscriptSegment {
  lang?: string;
  text?: string;
  offset?: string;
  duration?: string;
}

interface TranscriptData {
  transcript?: Array<LegacyTranscriptSegment | NewTranscriptSegment>;
  success?: boolean;
}

type TranscriptInput = TranscriptData | string | Record<string, unknown>;

export function calculateVideoDuration(transcriptData: TranscriptInput): number {
  // Handle the case where transcriptData might be a string
  let parsedData: TranscriptData;
  
  if (typeof transcriptData === 'string') {
    try {
      parsedData = JSON.parse(transcriptData);
    } catch (error) {
      console.error('Error parsing transcript data string:', error);
      return 0;
    }
  } else {
    parsedData = transcriptData as TranscriptData;
  }
  
  // Handle the transcript_raw format with "success" and "transcript" array
  if (parsedData && parsedData.success && Array.isArray(parsedData.transcript)) {
    // If the transcript is empty, return 0
    if (parsedData.transcript.length === 0) {
      return 0;
    }
    
    try {
      // Get the last segment
      const lastSegment = parsedData.transcript[parsedData.transcript.length - 1];
      
      // Check for offset and duration properties (as in the sample format)
      if ('offset' in lastSegment && 'duration' in lastSegment) {
        const offsetValue = parseFloat(lastSegment.offset as string);
        const durationValue = parseFloat(lastSegment.duration as string);
        return Math.round(offsetValue + durationValue);
      }
      
      // Handle original format with start and duration properties
      if ((lastSegment as LegacyTranscriptSegment).start !== undefined && 
          (lastSegment as LegacyTranscriptSegment).duration !== undefined) {
        return Math.round(
          (lastSegment as LegacyTranscriptSegment).start! + 
          (lastSegment as LegacyTranscriptSegment).duration!
        );
      }
      
      // Alternative calculation: sum up all durations
      let totalDuration = 0;
      for (const segment of parsedData.transcript) {
        if (segment.duration !== undefined) {
          if (typeof segment.duration === 'string') {
            totalDuration += parseFloat(segment.duration);
          } else {
            totalDuration += segment.duration;
          }
        }
      }
      
      return Math.round(totalDuration);
    } catch (error) {
      console.error('Error calculating video duration:', error);
      return 0;
    }
  }
  
  // Handle legacy format 
  if (parsedData?.transcript && Array.isArray(parsedData.transcript)) {
    // Legacy implementation
    if (parsedData.transcript.length === 0) {
      return 0;
    }
    
    try {
      const lastSegment = parsedData.transcript[parsedData.transcript.length - 1] as LegacyTranscriptSegment;
      
      if (lastSegment.start !== undefined && lastSegment.duration !== undefined) {
        return Math.round(lastSegment.start + lastSegment.duration);
      }
      
      let totalDuration = 0;
      for (const segment of parsedData.transcript as LegacyTranscriptSegment[]) {
        if (segment.duration !== undefined) {
          totalDuration += segment.duration;
        }
      }
      
      return Math.round(totalDuration);
    } catch (error) {
      console.error('Error calculating video duration from legacy format:', error);
      return 0;
    }
  }
  
  return 0;
}

// Parses the AI response text and returns the trimmed summary.
export function parseAiResponse(fullText: string): { summary: string } {
  const summary = fullText.trim();
  if (summary.length === 0) {
    throw new Error('Summary is empty');
  }
  return { summary };
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
