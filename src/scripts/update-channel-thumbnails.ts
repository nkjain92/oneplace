// src/scripts/update-channel-thumbnails.ts - Script to update missing channel thumbnails
import 'dotenv/config'; // Load .env file
import { createSupabaseServiceClient } from '../lib/supabaseServer';
import { downloadAndUploadFile } from '../lib/storage';

interface Channel {
  id: string;
  name: string;
  description: string | null;
  thumbnail: string | null;
}

interface ChannelThumbnails {
  default: { url: string } | null;
  medium: { url: string } | null;
  high: { url: string } | null;
}

/**
 * Fetch channel details from YouTube API
 * @param channelId YouTube channel ID
 * @returns Best available thumbnail URL or null
 */
async function fetchChannelThumbnail(channelId: string): Promise<string | null> {
  if (!process.env.YOUTUBE_API_KEY) {
    throw new Error('YOUTUBE_API_KEY environment variable is not set');
  }

  try {
    // Fetch channel details with thumbnails
    const channelResponse = await fetch(
      `https://www.googleapis.com/youtube/v3/channels?part=snippet&id=${channelId}&key=${process.env.YOUTUBE_API_KEY}`,
    );

    if (!channelResponse.ok) {
      throw new Error(
        `Failed to fetch channel details: ${channelResponse.status} ${channelResponse.statusText}`,
      );
    }

    const channelData = await channelResponse.json();

    // Check if the channel exists and has the expected structure
    if (!channelData.items || channelData.items.length === 0) {
      throw new Error(`No channel found with ID: ${channelId}`);
    }

    // Get the highest quality thumbnail available
    let thumbnailUrl: string | null = null;
    const thumbnails = channelData.items[0].snippet.thumbnails as ChannelThumbnails;

    if (thumbnails) {
      // Prioritize high resolution thumbnails
      thumbnailUrl =
        thumbnails.high?.url || thumbnails.medium?.url || thumbnails.default?.url || null;
    }

    return thumbnailUrl;
  } catch (error) {
    console.error(`Error fetching thumbnail for channel ${channelId}:`, error);
    return null;
  }
}

/**
 * Process a single channel to update its thumbnail
 * @param channel Channel object to update
 * @returns Whether the update was successful
 */
async function processChannel(channel: Channel): Promise<boolean> {
  try {
    console.log(`Processing channel: ${channel.name} (${channel.id})`);

    // Fetch thumbnail from YouTube
    const thumbnailUrl = await fetchChannelThumbnail(channel.id);

    if (!thumbnailUrl) {
      console.log(`No thumbnail found for channel: ${channel.name}`);
      return false;
    }

    // Download and upload to Supabase storage
    const filename = `channel-${channel.id}.jpg`;
    const storedUrl = await downloadAndUploadFile(thumbnailUrl, filename);

    if (!storedUrl) {
      console.error(`Failed to upload thumbnail for channel: ${channel.name}`);
      return false;
    }

    // Update channel record with the new thumbnail URL
    const supabase = await createSupabaseServiceClient();
    const { error } = await supabase
      .from('channels')
      .update({ thumbnail: storedUrl })
      .eq('id', channel.id);

    if (error) {
      console.error(`Error updating channel ${channel.name}:`, error.message);
      return false;
    }

    console.log(`✅ Successfully updated thumbnail for channel: ${channel.name}`);
    return true;
  } catch (error) {
    console.error(`Error processing channel ${channel.name}:`, error);
    return false;
  }
}

/**
 * Main function to update all missing channel thumbnails
 */
async function updateChannelThumbnails() {
  const supabase = await createSupabaseServiceClient();

  try {
    console.log('Starting channel thumbnail update process...');

    // Get all channels without thumbnails
    const { data: channels, error } = await supabase
      .from('channels')
      .select('id, name, description, thumbnail')
      .is('thumbnail', null);

    if (error) {
      throw new Error(`Error fetching channels: ${error.message}`);
    }

    console.log(`Found ${channels.length} channels without thumbnails`);

    if (channels.length === 0) {
      console.log('No channels need updating. Exiting.');
      return;
    }

    // Process channels with rate limiting to avoid YouTube API quota issues
    let successCount = 0;
    let failureCount = 0;

    // Process channels with a small delay between requests to avoid rate limiting
    for (let i = 0; i < channels.length; i++) {
      // Use a small timeout to pace the requests
      await new Promise(resolve => setTimeout(resolve, 1000));

      const success = await processChannel(channels[i]);
      if (success) {
        successCount++;
      } else {
        failureCount++;
      }

      // Log progress every 10 channels
      if ((i + 1) % 10 === 0 || i === channels.length - 1) {
        console.log(`Progress: ${i + 1}/${channels.length} channels processed`);
      }
    }

    console.log('\nChannel thumbnail update completed');
    console.log(`Successful updates: ${successCount}`);
    console.log(`Failed updates: ${failureCount}`);
  } catch (error) {
    console.error('Error updating channel thumbnails:', error);
  }
}

// Run the script
updateChannelThumbnails()
  .then(() => console.log('Script completed.'))
  .catch(error => console.error('Script error:', error))
  .finally(() => process.exit(0));
