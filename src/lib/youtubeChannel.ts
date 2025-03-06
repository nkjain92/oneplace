// src/lib/youtubeChannel.ts - Fetches YouTube channel details using YouTube Data API

export default async function fetchYouTubeChannelDetails(videoId: string): Promise<{
  channelId: string;
  name: string;
  description: string | null;
  videoTitle: string;
}> {
  if (!process.env.YOUTUBE_API_KEY) {
    throw new Error('YOUTUBE_API_KEY environment variable is not set');
  }

  try {
    // First, fetch the video details to get the channel ID
    const videoResponse = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${videoId}&key=${process.env.YOUTUBE_API_KEY}`,
    );

    if (!videoResponse.ok) {
      throw new Error(
        `Failed to fetch video details: ${videoResponse.status} ${videoResponse.statusText}`,
      );
    }

    const videoData = await videoResponse.json();

    // Check if the video exists and has the expected structure
    if (!videoData.items || videoData.items.length === 0) {
      throw new Error(`No video found with ID: ${videoId}`);
    }

    const channelId = videoData.items[0].snippet.channelId;
    const videoTitle = videoData.items[0].snippet.title;

    if (!channelId) {
      throw new Error(`Channel ID not found for video: ${videoId}`);
    }

    // Now fetch the channel details
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

    // Extract and return the channel details
    return {
      channelId,
      name: channelData.items[0].snippet.title,
      description: channelData.items[0].snippet.description || null,
      videoTitle,
    };
  } catch (error) {
    throw new Error(
      `Error fetching YouTube channel details: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
  }
}
